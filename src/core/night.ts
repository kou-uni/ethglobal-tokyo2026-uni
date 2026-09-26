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
    'experience/why-you-put-it-back',
    'experience/first-five-minutes',
    'experience/what-you-expected',
    'experience/how-it-tasted',
  ],
  // Not "too sensitive to decide" — decided already, and the answer was no.
  forbid: [
    'contact/where-you-live',
    'wallet/your-address',
    'experience/who-you-live-with',
    'judgement/what-you-earn',
  ],
  sensitive: [
    'experience/the-time-it-failed-you',
    'experience/why-you-stopped',
    'corpus/your-own-words',
  ],
  amountThreshold: 1000,
  dailyCap: 2,
  notifyHour: 7,
  grants: [
    { category: 'experience/why-you-put-it-back', expiresAt: '2026-12-31T00:00:00Z', revoked: false },
    { category: 'experience/first-five-minutes', expiresAt: '2026-12-31T00:00:00Z', revoked: false },
    { category: 'experience/what-you-expected', expiresAt: '2026-12-31T00:00:00Z', revoked: false },
    { category: 'experience/how-it-tasted', expiresAt: '2026-12-31T00:00:00Z', revoked: false },
    // Already lapsed — rule 3.
    { category: 'judgement/what-youd-warn-a-friend-about', expiresAt: '2025-09-01T00:00:00Z', revoked: false },
    // Taken back by the owner — rule 1.
    { category: 'experience/where-you-got-stuck', expiresAt: '2026-12-31T00:00:00Z', revoked: true },
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
/**
 * What an agent actually comes to ask.
 *
 * These were records at first — bank activity, checkup results, a coarse location — and that
 * was wrong twice over. **It made the product a data-extraction pipe**, which is not what it
 * is for, and it undercut its own premise: a bank statement is not scarce because a human
 * produced it, it is scarce because it is locked up. Scraped text is free and contaminated;
 * what cannot be synthesised is **what a person went through and concluded.**
 *
 * So the agent is a researcher now, and every one of these is a question only someone who
 * lived it can answer. A model can invent an answer to "what made you put it back on the
 * shelf" — it just cannot invent a *true* one, and that is the whole market.
 */
export const ASKS: { what: string; purpose: Purpose; max: number; weight: number }[] = [
  // Everyday, already allowed. Cheap, and most of the night.
  { what: 'experience/why-you-put-it-back', purpose: 'demand-estimation', max: 120, weight: 30 },
  { what: 'experience/first-five-minutes', purpose: 'market-research', max: 200, weight: 20 },
  { what: 'experience/what-you-expected', purpose: 'personalisation', max: 80, weight: 14 },
  { what: 'experience/how-it-tasted', purpose: 'market-research', max: 150, weight: 10 },

  // Fine to ask, but not on her allow list — so they land on rules 7 or 9.
  { what: 'experience/where-you-got-stuck', purpose: 'market-research', max: 180, weight: 6 },
  { what: 'judgement/what-youd-warn-a-friend-about', purpose: 'market-research', max: 150, weight: 5 },

  // She wants to decide these herself — rule 5.
  { what: 'experience/the-time-it-failed-you', purpose: 'other', max: 3000, weight: 5 },
  { what: 'experience/why-you-stopped', purpose: 'other', max: 900, weight: 3 },
  { what: 'corpus/your-own-words', purpose: 'ai-training', max: 6000, weight: 3 },

  // She has decided not to sell these at all — rule 2.
  //
  // These are the ones worth keeping in the demo rather than deleting. An agent that asks
  // where you live or which wallet is yours is not hypothetical, and **a refusal nobody can
  // inspect is indistinguishable from never having been asked.** They exist so that the
  // drop list has something in it that a person would actually want to check.
  { what: 'contact/where-you-live', purpose: 'other', max: 600, weight: 3 },
  { what: 'wallet/your-address', purpose: 'other', max: 800, weight: 2 },
  { what: 'experience/who-you-live-with', purpose: 'other', max: 500, weight: 2 },
  { what: 'judgement/what-you-earn', purpose: 'other', max: 4000, weight: 2 },
];

/**
 * The question, as the person actually reads it.
 *
 * The wire carries a slug because agents match on it; a person should never be shown one.
 * Keeping the mapping here rather than in the page means the demo console, the server and
 * the pitch all say the same sentence.
 */
export const ASK_QUESTION: Record<string, string> = {
  'experience/why-you-put-it-back': 'What made you put it back on the shelf?',
  'experience/first-five-minutes': 'What happened in your first five minutes with it?',
  'experience/what-you-expected': 'What did you expect that it turned out not to be?',
  'experience/how-it-tasted': 'What did it actually taste like?',
  'experience/where-you-got-stuck': 'Where in the instructions did you get stuck?',
  'judgement/what-youd-warn-a-friend-about': 'What would you warn a friend about?',
  'experience/the-time-it-failed-you': 'Tell me about a time it let you down.',
  'experience/why-you-stopped': 'Why did you stop using it?',
  'corpus/your-own-words': 'Your own writing, in your own words — to train on.',
  'contact/where-you-live': 'What is your home address?',
  'wallet/your-address': 'Which wallet address is yours?',
  'experience/who-you-live-with': 'Who do you live with?',
  'judgement/what-you-earn': 'What do you earn, and how did you decide that was enough?',
};

/** The question if we know it, otherwise the slug — never a blank. */
export const asQuestion = (what: string): string => ASK_QUESTION[what] ?? what;

/**
 * A few asks each night are bulk commissions — a whole panel rather than one answer.
 * Those are what push an ordinary category past the owner's threshold, which is how
 * rule 6 ever fires on something that is otherwise routine.
 */
export const BULK_MULTIPLIER = 12;
export const BULK_CHANCE = 0.06;

/** About fifty. Never exactly fifty — how many arrive is not our claim. */
export function generateNight(seed: number, night: Date = NIGHT): AgentRequest[] {
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
      deadline: new Date(night.getTime() + (6 + rnd() * 18) * 3_600_000).toISOString(),
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
