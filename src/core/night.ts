/**
 * Yohaku — one night of requests.
 *
 * Shared by `npm run seed` and by the demo console, so that what a judge sees on
 * screen and what the terminal prints are produced by exactly the same code.
 * A different number here and there would quietly turn the demo into a claim we
 * cannot back, so there is only one generator.
 */

import type { AgentRequest, Policy, Purpose, RoutingContext } from './types.js';

/** Small deterministic PRNG — a given seed always produces the same night. */
export function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const NIGHT = new Date('2026-09-26T02:00:00+09:00');
export const MORNING = new Date('2026-09-26T07:00:00+09:00');

export const DEMO_POLICY: Policy = {
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

export const KNOWN_PARTIES = [
  'market-research.acme.eth',
  'demand.nozomi-labs.eth',
  'cafe-nearby.local.eth',
  'retail-insight.dentsu-x.eth',
  'trendwatch.shibuya.eth',
];
export const NEW_PARTIES = ['first-contact.newco.eth', 'unknown-buyer.eth'];

export const FLAGGED_ADDRESS = '0xSANCTIONED_FIXTURE';

/** Weighted so that ordinary, low-stakes asks dominate — as they do in life. */
export const ASKS: { what: string; purpose: Purpose; max: number; weight: number }[] = [
  { what: 'purchase-intent/groceries', purpose: 'demand-estimation', max: 120, weight: 34 },
  { what: 'purchase-intent/cosmetics', purpose: 'market-research', max: 200, weight: 22 },
  { what: 'preference/coffee', purpose: 'personalisation', max: 80, weight: 14 },
  { what: 'location/coarse', purpose: 'market-research', max: 150, weight: 10 },
  { what: 'health/symptoms', purpose: 'market-research', max: 3000, weight: 5 },
  { what: 'work/history', purpose: 'other', max: 4000, weight: 3 },
  { what: 'finance/bank-activity', purpose: 'other', max: 500, weight: 5 },
  { what: 'health/checkup-results', purpose: 'other', max: 900, weight: 3 },
  { what: 'preference/travel', purpose: 'market-research', max: 150, weight: 5 },
  { what: 'purchase-intent/electronics', purpose: 'demand-estimation', max: 180, weight: 5 },
  { what: 'corpus/writing', purpose: 'ai-training', max: 6000, weight: 3 },
];

/**
 * A few asks each night are bulk commissions — a whole panel rather than one answer.
 * Those are what push an ordinary category past the owner's threshold, which is how
 * rule 6 ever fires on something that is otherwise routine.
 */
export const BULK_MULTIPLIER = 12;
export const BULK_CHANCE = 0.06;

/** About fifty. Never exactly fifty — how many arrive is not our claim. */
export function generateNight(seed: number): AgentRequest[] {
  const rnd = mulberry32(seed);
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)]!;
  const totalWeight = ASKS.reduce((s, a) => s + a.weight, 0);

  const pickAsk = () => {
    let r = rnd() * totalWeight;
    for (const a of ASKS) {
      r -= a.weight;
      if (r <= 0) return a;
    }
    return ASKS[0]!;
  };

  const count = 46 + Math.floor(rnd() * 9);

  return Array.from({ length: count }, (_, i) => {
    const ask = pickAsk();
    const firstTime = rnd() < 0.05;
    const dirtyPayout = rnd() < 0.04;
    const bulk = rnd() < BULK_CHANCE;
    return {
      id: `req-${String(i + 1).padStart(3, '0')}`,
      who: firstTime ? pick(NEW_PARTIES) : pick(KNOWN_PARTIES),
      what: ask.what,
      purpose: ask.purpose,
      price: {
        amount: Math.round(rnd() * ask.max * (bulk ? BULK_MULTIPLIER : 1)),
        currency: 'JPYC' as const,
      },
      deadline: new Date(NIGHT.getTime() + (6 + rnd() * 18) * 3_600_000).toISOString(),
      payoutAddress: dirtyPayout
        ? FLAGGED_ADDRESS
        : `0x${(i + 1).toString(16).padStart(40, '0')}`,
    };
  });
}

/** The context the demo and the seed script both run against. */
export function demoContext(now: Date = NIGHT): RoutingContext {
  const seen = new Set(KNOWN_PARTIES);
  return {
    now,
    seenBefore: (who) => seen.has(who),
    screen: (addr) => (addr === FLAGGED_ADDRESS ? 'flagged' : 'clean'),
  };
}
