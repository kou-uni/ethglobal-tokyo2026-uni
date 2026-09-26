/**
 * Throw a whole night at the running server, the way agents would.
 *
 *   npm start           # in one terminal
 *   npm run night       # in another
 *
 * This is the same generator the tests and the console use, but the requests go over HTTP
 * to the real endpoint rather than through a function call. What comes back is what an
 * agent would actually receive.
 */

import { loadEnv } from '../src/core/env.js';
loadEnv();

import { FLAGGED_ADDRESS, generateNight } from '../src/core/night.js';
import { FIXTURES } from '../src/ports/screening.js';

const API = process.env['YOHAKU_API'] ?? 'http://127.0.0.1:8402';
const seed = Number(process.argv[2] ?? 18);

const health = await fetch(`${API}/health`).catch(() => undefined);
if (!health?.ok) {
  console.error(`\n  Nothing is listening on ${API}. Start it with \`npm start\`.\n`);
  process.exit(1);
}
const wired = (await health.json()) as { wired: Record<string, boolean>; dailyCap: number };

/*
 * Against a live-screening server, the night declares addresses that can actually be screened.
 *
 * The generator's payout addresses are counted up from one — `0x…01`, `0x…02` — which no risk
 * API has ever heard of, and an address it cannot speak about is `unavailable`, which denies.
 * A simulated night run against a live server would therefore refuse all 52 for a reason that
 * says nothing about the rule. So the two confirmed fixtures stand in: the one the provider
 * clears, and, for the request the night marked as dirty, the one it refuses. **Which requests
 * are dirty is still the generator's decision, not ours** — the seed decides, and the count
 * does not change.
 */
const live = Boolean(wired.wired['screening']) && Boolean(FIXTURES.clean) && Boolean(FIXTURES.flagged);
const requests = generateNight(seed).map((r) =>
  live
    ? { ...r, payoutAddress: r.payoutAddress === FLAGGED_ADDRESS ? FIXTURES.flagged! : FIXTURES.clean! }
    : r,
);

console.log(`\n  ${requests.length} requests → ${API}\n`);
console.log(
  live
    ? '  screening is live on that server, so this night declares the two confirmed mainnet\n' +
        '  fixtures as its payment sources. Rule 4 is a real call; everything else is seeded.\n'
    : `  screening: ${wired.wired['screening'] ? 'live' : 'stand-in'} — the payout addresses in this night are generated, not real.\n`,
);

const tally: Record<string, number> = { auto: 0, human: 0, deny: 0 };
const byRule = new Map<number, number>();

for (const r of requests) {
  const res = await fetch(`${API}/requests`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(r),
  });
  const body = (await res.json()) as { verdict: string; rule: number };
  tally[body.verdict] = (tally[body.verdict] ?? 0) + 1;
  byRule.set(body.rule, (byRule.get(body.rule) ?? 0) + 1);
  process.stdout.write(body.verdict === 'auto' ? '.' : body.verdict === 'deny' ? 'x' : 'H');
}

console.log(`\n\n    auto   ${tally['auto']}`);
console.log(`    deny   ${tally['deny']}`);
console.log(`    human  ${tally['human']}`);
console.log(`\n  by rule`);
for (const rule of [...byRule.keys()].sort((a, b) => a - b)) {
  console.log(`    rule ${rule}   ${byRule.get(rule)}`);
}

const ledger = (await (await fetch(`${API}/ledger/alice.yohaku.eth`)).json()) as {
  needsYou: { category: string; count: number; ids: string[] }[];
  deferred: number;
  received: { amount: number; currency: string }[];
};

console.log(`\n  07:00 — daily cap ${wired.dailyCap}\n`);
for (const b of ledger.needsYou) {
  console.log(`    ${b.category}  (${b.count} request${b.count > 1 ? 's' : ''})`);
  console.log(`      curl -s ${API}/approvals/${b.ids[0]} -X POST \\`);
  console.log(`        -H 'content-type: application/json' -d '{"approve":true}'`);
}
console.log(`\n    deferred   ${ledger.deferred}`);
console.log(`    received   ${ledger.received.map((r) => `${r.amount} ${r.currency}`).join(', ') || '—'}`);
console.log(`\n  settlement: ${wired.wired['settlement'] ? 'wired' : 'not wired — nothing actually moved'}\n`);
