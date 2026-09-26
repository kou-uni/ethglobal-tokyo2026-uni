/**
 * The other side of the counter: agents with jobs to do.
 *
 * `generateNight` was enough to measure the router, and useless for showing anyone what this
 * is. It draws from eleven fixed sentences, so a staged night reads as the same question
 * asked forty times — which makes the product look like a toy and the market look imaginary.
 *
 * **What an agent actually wants from a person is the part of a job it cannot do itself.**
 * A brand can count purchases; it cannot know what made someone put the box back. A hospital
 * can measure waiting times; it cannot know what the waiting felt like. So a request here is
 * a *buyer with a job* plus *the question that job ran into*, and the variety is the point:
 * dozens of distinct asks, all of them things only someone who lived it can answer truthfully.
 *
 * Nothing here is random at run time. A seed produces the same night twice, because a demo
 * whose numbers move when nobody changed anything is a demo nobody can check.
 */

import {
  ASKS, BULK_CHANCE, BULK_MULTIPLIER, FLAGGED_ADDRESS, KNOWN_PARTIES, NEW_PARTIES,
  mulberry32, phrasing, stableHash,
} from './night.js';
import type { AgentRequest, Purpose } from './types.js';

export interface Buyer {
  /** The name it identifies itself with. */
  who: string;
  /** What kind of outfit is behind it — shown to the owner so "who is asking" means something. */
  sector: string;
  /** The job it is in the middle of. */
  job: string;
  /** Which of the owner's categories this buyer plausibly asks about. */
  asks: string[];
}

/**
 * Buyers, drawn wide on purpose.
 *
 * A market where only cosmetics brands ask questions is not a market. These are the kinds of
 * work that stall on something only a person can answer — and each one is a different reason
 * the open web could not supply it.
 */
export const BUYERS: Buyer[] = [
  { who: 'market-research.acme.eth', sector: 'a cosmetics brand', job: 'working out why a launch underperformed',
    asks: ['experience/why-you-put-it-back', 'experience/first-five-minutes', 'experience/what-you-expected'] },
  { who: 'shelf-signal.retail.eth', sector: 'a grocery chain', job: 'deciding what to stock next quarter',
    asks: ['experience/why-you-put-it-back', 'experience/how-it-tasted', 'judgement/what-youd-warn-a-friend-about'] },
  { who: 'nozomi-labs.eth', sector: 'a consumer-health startup', job: 'understanding why people abandon a regimen',
    asks: ['experience/why-you-stopped', 'experience/the-time-it-failed-you'] },
  { who: 'onboarding.fintech.eth', sector: 'a bank', job: 'finding where new customers give up',
    asks: ['experience/where-you-got-stuck', 'experience/what-you-expected'] },
  { who: 'ux.hospital-group.eth', sector: 'a hospital group', job: 'redesigning an outpatient waiting area',
    asks: ['experience/the-time-it-failed-you', 'experience/what-you-expected'] },
  { who: 'playtest.studio.eth', sector: 'a game studio', job: 'finding where players stop caring',
    asks: ['experience/first-five-minutes', 'experience/why-you-stopped'] },
  { who: 'transit.city-lab.eth', sector: 'a city transport office', job: 'planning a timetable change',
    asks: ['experience/the-time-it-failed-you', 'judgement/what-youd-warn-a-friend-about'] },
  { who: 'roast.coffee-co.eth', sector: 'a coffee roaster', job: 'choosing between two blends',
    asks: ['experience/how-it-tasted', 'experience/what-you-expected'] },
  { who: 'manual.appliance.eth', sector: 'an appliance maker', job: 'rewriting an instruction manual',
    asks: ['experience/where-you-got-stuck', 'judgement/what-youd-warn-a-friend-about'] },
  { who: 'churn.saas.eth', sector: 'a software company', job: 'understanding cancellations',
    asks: ['experience/why-you-stopped', 'experience/the-time-it-failed-you'] },
  { who: 'corpus.model-lab.eth', sector: 'a model lab', job: 'buying writing that is provably human',
    asks: ['corpus/your-own-words'] },
  { who: 'first-contact.newco.eth', sector: 'a startup nobody has heard of', job: 'its first piece of research',
    asks: ['experience/first-five-minutes', 'experience/what-you-expected'] },
  { who: 'unknown-buyer.eth', sector: 'an unidentified buyer', job: 'unstated',
    asks: ['contact/where-you-live', 'wallet/your-address', 'experience/who-you-live-with', 'judgement/what-you-earn'] },
  { who: 'growth.dtc-brand.eth', sector: 'a direct-to-consumer brand', job: 'pricing a new size',
    asks: ['judgement/what-you-earn', 'experience/why-you-put-it-back'] },
];


export { phrasing } from './night.js';

export interface Job {
  request: AgentRequest;
  buyer: Buyer;
  question: string;
}

const priceFor = (what: string, rnd: () => number): number => {
  const ask = ASKS.find((a) => a.what === what);
  const max = ask?.max ?? 200;
  const bulk = rnd() < BULK_CHANCE;
  return Math.max(1, Math.round(rnd() * max * (bulk ? BULK_MULTIPLIER : 1)));
};

/** Looked up on demand: computing it at module load would depend on import order. */
const purposeOf = (what: string): Purpose => ASKS.find((a) => a.what === what)?.purpose ?? 'other';

/**
 * One night of jobs.
 *
 * Buyers are weighted so that a handful do most of the asking and the long tail is thin —
 * which is what a real counter looks like, and what makes rule 7 fire for the right reason.
 */
export function generateJobs(seed: number, count = 52, now = new Date()): Job[] {
  const rnd = mulberry32(seed);
  const known = new Set<string>([...KNOWN_PARTIES, ...NEW_PARTIES]);
  return Array.from({ length: count }, (_, i) => {
    // Front-loaded: the first few buyers are the regulars.
    const idx = Math.floor(Math.pow(rnd(), 1.7) * BUYERS.length);
    const buyer = BUYERS[Math.min(idx, BUYERS.length - 1)]!;
    const what = buyer.asks[Math.floor(rnd() * buyer.asks.length)]!;
    const id = `sim-${seed}-${String(i + 1).padStart(3, '0')}`;
    const dirty = rnd() < 0.04;
    return {
      buyer,
      question: phrasing(what, id) ?? what,
      request: {
        id,
        who: buyer.who,
        what,
        purpose: purposeOf(what),
        price: { amount: priceFor(what, rnd), currency: 'JPYC' as const },
        deadline: new Date(now.getTime() + (6 + rnd() * 18) * 3_600_000).toISOString(),
        payoutAddress: dirty
          ? FLAGGED_ADDRESS
          : `0x${(stableHash(buyer.who + i) % 0xffffffff).toString(16).padStart(40, '0')}`,
      },
    };
  }).map((j) => (known.has(j.buyer.who) ? j : j));
}
