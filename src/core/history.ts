/**
 * What happened on the nights before this one.
 *
 * **No count in here is written down.** Each past night is generated, then run through the
 * same `route()` and the same `surface()` the live server uses, so every number the fold
 * shows is the router's own output. Change rule 5 and this history changes with it.
 *
 * It is still a *generated* night — real traffic does not exist yet. That is said out loud
 * in the tutorial panel rather than hidden, because a number a judge cannot trace is worse
 * than no number.
 */

import { DEMO_POLICY, demoContext, generateNight } from './night.js';
import { surface } from './queue.js';
import { route } from './rules.js';
import type { HeldRequest, Policy } from './types.js';

export interface NightSummary {
  /** YYYY-MM-DD of the morning she would have woken up to. */
  date: string;
  /** How it reads on the screen: "Last night", "Wed 24". */
  label: string;
  arrived: number;
  /** Settled without her. */
  auto: number;
  /** Never reached her. */
  deny: number;
  /** Held for her. */
  human: number;
  /** Of those held, how many notifications actually reached her — the cap decides. */
  asked: number;
  settled: number;
  currency: string;
}

const DAY_MS = 86_400_000;

/** A seed that follows the date, so the same day always replays identically. */
export function seedFor(night: Date): number {
  return Math.floor(night.getTime() / DAY_MS);
}

export function replayNight(night: Date, policy: Policy = DEMO_POLICY, label = ''): NightSummary {
  const requests = generateNight(seedFor(night), night);
  const ctx = demoContext(night);
  const morning = new Date(night.getTime() + 5 * 3_600_000);

  let auto = 0;
  let deny = 0;
  let settled = 0;
  const held: HeldRequest[] = [];

  for (const request of requests) {
    const decision = route(request, policy, ctx);
    if (decision.verdict === 'auto') {
      auto += 1;
      settled += request.price.amount;
    } else if (decision.verdict === 'deny') {
      deny += 1;
    } else {
      held.push({ request, decision, heldAt: night.toISOString() });
    }
  }

  return {
    date: morning.toISOString().slice(0, 10),
    label,
    arrived: requests.length,
    auto,
    deny,
    human: held.length,
    asked: surface(held, policy, morning).surfaced.length,
    settled,
    currency: 'JPYC',
  };
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * The `count` nights before `today`, most recent first.
 *
 * `today` is excluded on purpose: today's numbers come from the live store, because today
 * is the night a judge is actually putting requests into.
 */
export function pastNights(today: Date, count = 4, policy: Policy = DEMO_POLICY): NightSummary[] {
  return Array.from({ length: count }, (_, i) => {
    const night = new Date(today.getTime() - (i + 1) * DAY_MS);
    const label = i === 0 ? 'Last night' : `${WEEKDAY[night.getUTCDay()]} ${night.getUTCDate()}`;
    return replayNight(night, policy, label);
  });
}
