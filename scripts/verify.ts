/**
 * Check that what the documents claim is what the code actually does.
 *
 *   npm run verify
 *
 * Every number in the README and the docs that describes behaviour is re-derived here by
 * running the real code, and compared. **If a document drifts from the implementation, this
 * fails.** That is the point: "remember to update the docs" is not a mechanism, and this
 * repository has already had three numbers in it that were true when written and false by
 * the time anyone read them.
 *
 * It also refuses hardcoded external identifiers — model names, endpoints, contract
 * addresses. Those are guesses with a shelf life; one of them was wrong within a day.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { surface } from '../src/core/queue.js';
import { route } from '../src/core/rules.js';
import { DEMO_POLICY, MORNING, NIGHT, demoContext, generateNight } from '../src/core/night.js';
import { runWeek } from '../src/core/week.js';
import type { HeldRequest } from '../src/core/types.js';

const failures: string[] = [];
const checks: string[] = [];

function check(name: string, ok: boolean, detail: string): void {
  if (ok) checks.push(`  ok    ${name}`);
  else failures.push(`  FAIL  ${name}\n        ${detail}`);
}

const read = (p: string) => readFileSync(p, 'utf8');

/* ── 1. the night quoted in the docs is the night the code produces ────────── */

function runSeed(seed: number) {
  const ctx = demoContext(NIGHT);
  const decided = generateNight(seed).map((r) => ({ request: r, decision: route(r, DEMO_POLICY, ctx) }));
  const held: HeldRequest[] = decided
    .filter((d) => d.decision.verdict === 'human')
    .map((d) => ({ ...d, heldAt: '' }));
  return {
    arrived: decided.length,
    auto: decided.filter((d) => d.decision.verdict === 'auto').length,
    deny: decided.filter((d) => d.decision.verdict === 'deny').length,
    surfaced: surface(held, DEMO_POLICY, MORNING).surfaced.length,
  };
}

const s18 = runSeed(18);
const readme = read('README.md');

const quoted = readme.match(/seed -- 18` is the night used in the pitch\*\* — (\d+) arrive, (\d+) settle, (\d+) are dropped,\s*\*\*(\d+) reach her\*\*/);
check(
  'README quotes seed 18 correctly',
  Boolean(quoted) &&
    Number(quoted![1]) === s18.arrived &&
    Number(quoted![2]) === s18.auto &&
    Number(quoted![3]) === s18.deny &&
    Number(quoted![4]) === s18.surfaced,
  quoted
    ? `README says ${quoted[1]}/${quoted[2]}/${quoted[3]}/${quoted[4]}, code produces ${s18.arrived}/${s18.auto}/${s18.deny}/${s18.surfaced}`
    : 'could not find the claim in README.md — did the wording change?',
);

/* ── 2. the 20-seed spread the docs quote ─────────────────────────────────── */

const spread = Array.from({ length: 20 }, (_, i) => runSeed(i + 1));
const arrivals = spread.map((r) => r.arrived);
const reached = spread.map((r) => r.surfaced);
const lo = Math.min(...arrivals);
const hi = Math.max(...arrivals);

check(
  'arrivals really do range 46-54 across 20 seeds',
  lo === 46 && hi === 54,
  `measured ${lo}-${hi}`,
);
check(
  'what reaches her really is the cap, every single run',
  reached.every((n) => n === DEMO_POLICY.dailyCap),
  `measured ${[...new Set(reached)].join(', ')} against a cap of ${DEMO_POLICY.dailyCap}`,
);

const assumptions = read('docs/product/ASSUMPTIONS.md');
check(
  'ASSUMPTIONS quotes the same range as the code produces',
  assumptions.includes(`${lo}–${hi}`),
  `code says ${lo}-${hi}; that range does not appear in ASSUMPTIONS.md`,
);

/* ── 3. the month-long claim ──────────────────────────────────────────────── */

const { days } = runWeek({ seeds: Array.from({ length: 30 }, (_, i) => 101 + i) });
const wk = (a: number, b: number, k: 'surfaced' | 'learnedAway') =>
  days.slice(a, b).reduce((t, d) => t + d[k], 0) / (b - a);

check(
  'the cap really does bind for the first two weeks',
  Math.abs(wk(0, 7, 'surfaced') - DEMO_POLICY.dailyCap) < 0.15 &&
    Math.abs(wk(7, 14, 'surfaced') - DEMO_POLICY.dailyCap) < 0.15,
  `week 1 ${wk(0, 7, 'surfaced').toFixed(2)}, week 2 ${wk(7, 14, 'surfaced').toFixed(2)}`,
);
check(
  'being spared really does grow from near zero to several a day',
  wk(0, 7, 'learnedAway') < 1 && wk(21, 30, 'learnedAway') > 4,
  `week 1 ${wk(0, 7, 'learnedAway').toFixed(1)}, week 4 ${wk(21, 30, 'learnedAway').toFixed(1)}`,
);
check(
  'the mornings really do go quiet by week four',
  wk(21, 30, 'surfaced') < 1.5,
  `week 4 ${wk(21, 30, 'surfaced').toFixed(2)}`,
);

/* ── 4. no guessed external identifiers in the source ─────────────────────── */

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return sources(p);
    return p.endsWith('.ts') && !p.endsWith('.test.ts') ? [p] : [];
  });
}

/** Things that change outside this repository and must never be written into it. */
const GUESSES: { name: string; re: RegExp }[] = [
  { name: 'model id', re: /['"`](?:gpt-[\w.-]+|claude-[\w.-]+|o\d-[\w.-]+)['"`]/g },
  { name: 'api endpoint', re: /['"`]https?:\/\/(?!127\.0\.0\.1|localhost)[^'"`]+['"`]/g },
  { name: 'contract address', re: /['"`]0x[0-9a-fA-F]{40}['"`]/g },
];

/**
 * Hosts that serve assets rather than answers.
 *
 * **This narrowing was added 2026-09-26, and it is a change to the check.** The rule it
 * loosens exists to catch an endpoint or model id somebody *guessed*. A stylesheet from a
 * published font CDN is neither guessed nor credentialed — but it is still a dependency on
 * someone else's network, so it is allowed only alongside `local font fallback` below,
 * which fails if the page would look broken when that host is unreachable.
 */
const ASSET_HOSTS = [/^['"`]https:\/\/fonts\.(?:googleapis|gstatic)\.com\//];

for (const file of sources('src').concat(sources('scripts'))) {
  const body = read(file);
  for (const { name, re } of GUESSES) {
    // Every hit, not just the first: one permitted URL must not hide a real one behind it.
    for (const hit of body.match(re) ?? []) {
      // Repeated characters are fixtures, not real addresses.
      if (name === 'contract address' && /^['"`]0x(.)\1{39}['"`]$/.test(hit)) continue;
      if (name === 'api endpoint' && ASSET_HOSTS.some((h) => h.test(hit))) continue;
      check(
        `${file} has no hardcoded ${name}`,
        false,
        `found ${hit} — read it from the environment, or list it from the provider`,
      );
    }
  }
}

/*
 * The price of allowing a font CDN: the page must not depend on it.
 *
 * "Looks fine on my machine with the font cached" is exactly the failure that shows up at
 * a booth on venue wifi, so the fallback is checked rather than assumed.
 */
{
  const pages = read('src/server/pages.ts');
  const stack = pages.match(/font-family:([^;]+);/)?.[1] ?? '';
  const remote = /fonts\.googleapis\.com/.test(pages);
  const localRounded = /Hiragino Maru Gothic ProN/.test(stack);
  const systemFallback = /-apple-system|sans-serif/.test(stack);
  check(
    'local font fallback',
    !remote || (localRounded && systemFallback),
    remote
      ? 'pages.ts loads a font over the network with no local rounded fallback in the same stack'
      : '',
  );
}
if (!failures.some((f) => f.includes('hardcoded'))) {
  check('no hardcoded model ids, endpoints or addresses anywhere in src/ or scripts/', true, '');
}

/* ── 5. unverified assumptions must not leak into what we hand over ────────── */

const red = (assumptions.match(/🔴/g) ?? []).length;
check(
  'every placeholder is still marked as one',
  red > 0,
  'ASSUMPTIONS.md has no 🔴 left — either everything is verified, or the marks were dropped',
);

/* ── report ───────────────────────────────────────────────────────────────── */

console.log('');
for (const c of checks) console.log(c);
if (failures.length) {
  console.log('');
  for (const f of failures) console.log(f);
  console.log(`\n  ${failures.length} claim(s) no longer match the code.\n`);
  process.exit(1);
}
console.log(`\n  ${checks.length} claims checked against the running code.\n`);
