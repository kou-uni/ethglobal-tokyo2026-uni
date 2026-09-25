/**
 * Yohaku — the flywheel.
 *
 * What a person decided yesterday becomes routing today. This is the only part of the
 * system that improves by being used, and what it accumulates is the scarce thing:
 * a record of when a human says no.
 *
 * Conservative in one direction only. Repeated approvals can widen `auto`; repeated
 * refusals can never widen it. Learning may remove work from a person — it may never
 * grant something they kept refusing.
 */

import type { AgentRequest, Decision } from './types.js';

export interface DecisionRecord {
  who: string;
  what: string;
  /** What the person actually chose when asked. */
  outcome: 'approved' | 'refused' | 'ignored';
  decidedAt: string;
  /** The rule that escalated it in the first place. */
  escalatedBy: number;
}

export interface Learned {
  /** (who, what) pairs approved often enough that she stops being asked. */
  autoPairs: Set<string>;
  /** (who, what) pairs refused often enough that they stop arriving. */
  mutedPairs: Set<string>;
  /**
   * Counterparties she has refused repeatedly *and never once accepted*.
   *
   * Deliberately narrow. A party she buys from every week does not get cut off for
   * asking one thing she dislikes — that pair gets muted instead.
   */
  mutedParties: Set<string>;
}

const key = (who: string, what: string): string => `${who} :: ${what}`;

/** Consistent approvals before we stop asking. Low, but never one. */
export const APPROVALS_TO_LEARN = 3;
/** Refusals before a counterparty stops reaching her at all. */
export const REFUSALS_TO_MUTE = 3;

export function learn(records: DecisionRecord[]): Learned {
  const approvals = new Map<string, number>();
  const refusals = new Map<string, number>();
  const refusalsByParty = new Map<string, number>();
  const approvalsByParty = new Map<string, number>();

  for (const r of records) {
    const k = key(r.who, r.what);
    if (r.outcome === 'approved') {
      approvals.set(k, (approvals.get(k) ?? 0) + 1);
      approvalsByParty.set(r.who, (approvalsByParty.get(r.who) ?? 0) + 1);
    } else if (r.outcome === 'refused') {
      refusals.set(k, (refusals.get(k) ?? 0) + 1);
      refusalsByParty.set(r.who, (refusalsByParty.get(r.who) ?? 0) + 1);
    }
    // 'ignored' teaches nothing. Silence is not consent, and it is not refusal either.
  }

  const autoPairs = new Set<string>();
  for (const [k, n] of approvals) {
    // One refusal anywhere in the history cancels learning for that pair.
    if (n >= APPROVALS_TO_LEARN && (refusals.get(k) ?? 0) === 0) autoPairs.add(k);
  }

  const mutedPairs = new Set<string>();
  for (const [k, n] of refusals) {
    if (n >= REFUSALS_TO_MUTE) mutedPairs.add(k);
  }

  const mutedParties = new Set<string>();
  for (const [who, n] of refusalsByParty) {
    // Only someone she has never once said yes to gets cut off entirely.
    if (n >= REFUSALS_TO_MUTE && (approvalsByParty.get(who) ?? 0) === 0) mutedParties.add(who);
  }

  return { autoPairs, mutedPairs, mutedParties };
}

/**
 * Apply what was learned to a decision the rules already made.
 *
 * Only ever moves `human` to `auto`, or `human` to `deny`. It never overturns a `deny`
 * and never touches rule 0. The rules stay the authority; this only removes work.
 */
export function applyLearned(
  req: AgentRequest,
  decision: Decision,
  learned: Learned,
): Decision {
  if (decision.verdict !== 'human') return decision;

  if (learned.mutedParties.has(req.who)) {
    return { verdict: 'deny', rule: decision.rule, reason: `${req.who} has been refused every time` };
  }
  if (learned.mutedPairs.has(key(req.who, req.what))) {
    return {
      verdict: 'deny',
      rule: decision.rule,
      reason: `she has refused "${req.what}" from ${req.who} before`,
    };
  }
  if (learned.autoPairs.has(key(req.who, req.what))) {
    return {
      verdict: 'auto',
      rule: decision.rule,
      reason: `she has approved "${req.what}" from ${req.who} before`,
    };
  }
  return decision;
}

/**
 * What only the platform can see.
 *
 * No individual seller can know that an agent was refused by most people it approached.
 * This is the signal worth handing back to the ecosystem.
 */
export function rejectionRate(
  records: DecisionRecord[],
  who: string,
): { asked: number; refused: number; rate: number } | undefined {
  const mine = records.filter((r) => r.who === who && r.outcome !== 'ignored');
  if (mine.length === 0) return undefined;
  const refused = mine.filter((r) => r.outcome === 'refused').length;
  return { asked: mine.length, refused, rate: Math.round((refused / mine.length) * 100) / 100 };
}
