/**
 * Yohaku — what happens after `human`.
 *
 * Three-way routing is easy. This file is the product.
 *
 * A person cannot absorb an unbounded number of decisions, so the queue does four
 * things before anything reaches them: bundle, rank, hold until the notification
 * hour, and fall back when the deadline passes. The daily cap is the owner's own
 * setting — the router does not decide how much attention they have.
 */

import type { Bundle, Decision, HeldRequest, Policy } from './types.js';

/**
 * Group held requests by what they are asking for.
 *
 * "3 companies are asking for the same health category" is one notification, not three.
 */
export function bundle(held: HeldRequest[]): Bundle[] {
  const byCategory = new Map<string, HeldRequest[]>();
  for (const h of held) {
    const list = byCategory.get(h.request.what) ?? [];
    list.push(h);
    byCategory.set(h.request.what, list);
  }

  return [...byCategory.entries()].map(([category, requests]) => ({
    category,
    requests,
    topValue: Math.max(...requests.map((r) => r.request.price.amount)),
    nextDeadline: requests
      .map((r) => r.request.deadline)
      .sort()
      .at(0)!,
  }));
}

/** Higher scores surface first: what it is worth, and how soon it disappears. */
export function rank(bundles: Bundle[], now: Date): Bundle[] {
  const score = (b: Bundle): number => {
    const hoursLeft = (new Date(b.nextDeadline).getTime() - now.getTime()) / 3_600_000;
    // Urgency rises as the deadline approaches, but never dominates value entirely.
    const urgency = hoursLeft <= 0 ? 0 : 1 / Math.max(hoursLeft, 0.5);
    return b.topValue * (1 + urgency);
  };
  return [...bundles].sort((a, b) => score(b) - score(a));
}

export interface SurfaceResult {
  /** What the owner actually sees this morning. */
  surfaced: Bundle[];
  /** Held back by the daily cap — still alive, still within their deadlines. */
  deferred: Bundle[];
  /** Past their deadline. These are denied, not deferred. */
  expired: HeldRequest[];
}

/**
 * Decide what reaches the person at the notification hour.
 *
 * Anything past its deadline is taken out first — it is denied, not shown. The rest
 * is ranked, and only `dailyCap` bundles are surfaced. What is deferred is not lost;
 * it simply did not fit inside the space the owner set aside today.
 */
export function surface(held: HeldRequest[], policy: Policy, now: Date): SurfaceResult {
  const expired: HeldRequest[] = [];
  const alive: HeldRequest[] = [];

  for (const h of held) {
    if (new Date(h.request.deadline).getTime() <= now.getTime()) expired.push(h);
    else alive.push(h);
  }

  const ranked = rank(bundle(alive), now);

  return {
    surfaced: ranked.slice(0, policy.dailyCap),
    deferred: ranked.slice(policy.dailyCap),
    expired,
  };
}

/** Is it the hour at which held requests are shown? */
export function isNotificationHour(policy: Policy, now: Date): boolean {
  return policyClock(policy, now).hour === policy.notifyHour;
}

/** Calendar boundaries belong to the owner, never to the deployment machine. */
export function policyClock(policy: Policy, now: Date) {
  const timeZone = policy.timeZone ?? 'Asia/Tokyo';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const value = (name: string) => parts.find(p => p.type === name)!.value;
  return { timeZone, day: `${value('year')}-${value('month')}-${value('day')}`, hour: Number(value('hour')) };
}

/**
 * What silence means.
 *
 * Deliberately not configurable to `auto`. An owner may widen their allow list, but
 * they cannot make "no answer" mean "yes".
 */
export function onDeadline(): Decision {
  return {
    verdict: 'deny',
    rule: -1,
    reason: 'the deadline passed without an answer — silence is not consent',
  };
}
