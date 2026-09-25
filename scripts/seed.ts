/**
 * Generate one night of agent requests and run them through the real router.
 *
 * The counts in the demo are not typed in by hand — they come out of `route()`.
 * The mix varies with the seed, which is the point: how many arrive is not our
 * claim. What we fix is how many reach a person.
 *
 *   npm run seed            # today's night
 *   npm run seed -- 42      # reproducible
 */

import { writeFileSync } from 'node:fs';
import { route } from '../src/core/rules.js';
import { surface } from '../src/core/queue.js';
import type {
  AgentRequest,
  HeldRequest,
  Policy,
  Purpose,
  RoutingContext,
} from '../src/core/types.js';

/** Small deterministic PRNG so a given seed always produces the same night. */
function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seed = Number(process.argv[2] ?? Math.floor(Date.now() / 86_400_000));
const rnd = mulberry32(seed);
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)]!;

const NIGHT = new Date('2026-09-26T02:00:00+09:00');
const MORNING = new Date('2026-09-26T07:00:00+09:00');

const policy: Policy = {
  owner: 'alice.yohaku.eth',
  allow: [
    'purchase-intent/groceries',
    'purchase-intent/cosmetics',
    'preference/coffee',
    'location/coarse',
  ],
  forbid: ['finance/bank-activity', 'health/checkup-results'],
  sensitive: ['health/symptoms', 'work/history', 'finance/income'],
  amountThreshold: 1000,
  dailyCap: 3,
  notifyHour: 7,
  grants: [
    { category: 'purchase-intent/groceries', expiresAt: '2026-12-31T00:00:00Z', revoked: false },
    { category: 'purchase-intent/cosmetics', expiresAt: '2026-12-31T00:00:00Z', revoked: false },
    { category: 'preference/coffee', expiresAt: '2026-12-31T00:00:00Z', revoked: false },
    { category: 'location/coarse', expiresAt: '2026-12-31T00:00:00Z', revoked: false },
    // Already lapsed — rule 3.
    { category: 'preference/travel', expiresAt: '2025-09-01T00:00:00Z', revoked: false },
    // Taken back by the owner — rule 1.
    { category: 'purchase-intent/electronics', expiresAt: '2026-12-31T00:00:00Z', revoked: true },
  ],
};

const KNOWN = [
  'market-research.acme.eth',
  'demand.nozomi-labs.eth',
  'cafe-nearby.local.eth',
  'retail-insight.dentsu-x.eth',
  'trendwatch.shibuya.eth',
];
const NEW_COMERS = ['first-contact.newco.eth', 'unknown-buyer.eth'];

/** Categories weighted so that ordinary, low-stakes asks dominate — as they should. */
const ASKS: { what: string; purpose: Purpose; max: number; weight: number }[] = [
  { what: 'purchase-intent/groceries', purpose: 'demand-estimation', max: 1, weight: 34 },
  { what: 'purchase-intent/cosmetics', purpose: 'market-research', max: 1, weight: 22 },
  { what: 'preference/coffee', purpose: 'personalisation', max: 0.5, weight: 14 },
  { what: 'location/coarse', purpose: 'market-research', max: 1, weight: 10 },
  { what: 'health/symptoms', purpose: 'market-research', max: 3000, weight: 5 },
  { what: 'work/history', purpose: 'other', max: 4000, weight: 3 },
  { what: 'finance/bank-activity', purpose: 'other', max: 500, weight: 5 },
  { what: 'health/checkup-results', purpose: 'other', max: 900, weight: 3 },
  { what: 'preference/travel', purpose: 'market-research', max: 1, weight: 5 },
  { what: 'purchase-intent/electronics', purpose: 'demand-estimation', max: 1, weight: 5 },
  { what: 'corpus/writing', purpose: 'ai-training', max: 6000, weight: 3 },
];
const TOTAL_WEIGHT = ASKS.reduce((s, a) => s + a.weight, 0);

function pickAsk() {
  let r = rnd() * TOTAL_WEIGHT;
  for (const a of ASKS) {
    r -= a.weight;
    if (r <= 0) return a;
  }
  return ASKS[0]!;
}

/** About fifty. Never exactly fifty — see docs/ASSUMPTIONS.md. */
const count = 46 + Math.floor(rnd() * 9);

const requests: AgentRequest[] = Array.from({ length: count }, (_, i) => {
  const ask = pickAsk();
  const firstTime = rnd() < 0.05;
  const dirtyPayout = rnd() < 0.04;
  return {
    id: `req-${String(i + 1).padStart(3, '0')}`,
    who: firstTime ? pick(NEW_COMERS) : pick(KNOWN),
    what: ask.what,
    purpose: ask.purpose,
    price: { amount: Math.round(rnd() * ask.max * 100) / 100, currency: 'JPYC' as const },
    deadline: new Date(NIGHT.getTime() + (6 + rnd() * 18) * 3_600_000).toISOString(),
    payoutAddress: dirtyPayout ? '0xSANCTIONED_FIXTURE' : `0x${(i + 1).toString(16).padStart(40, '0')}`,
  };
});

const seenBefore = new Set(KNOWN);
const ctx: RoutingContext = {
  now: NIGHT,
  seenBefore: (who) => seenBefore.has(who),
  screen: (addr) => (addr === '0xSANCTIONED_FIXTURE' ? 'flagged' : 'clean'),
};

const decided = requests.map((r) => ({ request: r, decision: route(r, policy, ctx) }));
const auto = decided.filter((d) => d.decision.verdict === 'auto');
const denied = decided.filter((d) => d.decision.verdict === 'deny');
const held: HeldRequest[] = decided
  .filter((d) => d.decision.verdict === 'human')
  .map((d) => ({ ...d, heldAt: NIGHT.toISOString() }));

const morning = surface(held, policy, MORNING);

const byRule = new Map<number, number>();
for (const d of decided) byRule.set(d.decision.rule, (byRule.get(d.decision.rule) ?? 0) + 1);

console.log(`\n  seed ${seed} — one night, run through the real router\n`);
console.log(`  arrived            ${decided.length}`);
console.log(`    auto             ${auto.length}   settled while she slept`);
console.log(`    deny             ${denied.length}   never reached her`);
console.log(`    human            ${held.length}   held`);
console.log(`\n  07:00 — daily cap ${policy.dailyCap}`);
console.log(`    surfaced         ${morning.surfaced.length}  ${morning.surfaced.map((b) => b.category).join(', ')}`);
console.log(`    deferred         ${morning.deferred.length}`);
console.log(`    expired → deny   ${morning.expired.length}`);
console.log(`\n  by rule`);
for (const rule of [...byRule.keys()].sort((a, b) => a - b)) {
  console.log(`    rule ${rule}           ${byRule.get(rule)}`);
}
console.log('');

writeFileSync(
  'scripts/night.json',
  JSON.stringify({ seed, policy, decided, morning }, null, 2),
);
console.log('  → scripts/night.json\n');
