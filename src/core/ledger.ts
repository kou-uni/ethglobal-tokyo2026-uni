/**
 * Yohaku — what she wakes up to.
 *
 * One screen. Not a feed. The morning ledger answers three questions in the order a
 * person actually asks them: what moved, what still needs me, and what was kept out.
 */

import type { AgentRequest, Bundle, Decision, HeldRequest } from './types.js';

export interface SettledEntry {
  request: AgentRequest;
  decision: Decision;
  /** Present once settlement has actually happened. Absent is not "pending" — it is "no". */
  txHash?: string;
}

export interface Ledger {
  date: string;
  arrived: number;
  autoCount: number;
  denyCount: number;
  heldCount: number;
  /** What she is asked about this morning, already bundled and ranked. */
  needsYou: Bundle[];
  received: { amount: number; currency: string }[];
  /** Counts per rule, so any single outcome can be traced back. */
  byRule: { rule: number; count: number }[];
}

export function buildLedger(input: {
  date: string;
  settled: SettledEntry[];
  denied: SettledEntry[];
  held: HeldRequest[];
  surfaced: Bundle[];
}): Ledger {
  const byCurrency = new Map<string, number>();
  for (const s of input.settled) {
    const { amount, currency } = s.request.price;
    byCurrency.set(currency, (byCurrency.get(currency) ?? 0) + amount);
  }

  const ruleCounts = new Map<number, number>();
  for (const e of [...input.settled, ...input.denied]) {
    ruleCounts.set(e.decision.rule, (ruleCounts.get(e.decision.rule) ?? 0) + 1);
  }
  for (const h of input.held) {
    ruleCounts.set(h.decision.rule, (ruleCounts.get(h.decision.rule) ?? 0) + 1);
  }

  return {
    date: input.date,
    arrived: input.settled.length + input.denied.length + input.held.length,
    autoCount: input.settled.length,
    denyCount: input.denied.length,
    heldCount: input.held.length,
    needsYou: input.surfaced,
    received: [...byCurrency.entries()]
      .map(([currency, amount]) => ({ currency, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount),
    byRule: [...ruleCounts.entries()]
      .map(([rule, count]) => ({ rule, count }))
      .sort((a, b) => a.rule - b.rule),
  };
}

/**
 * The line that says this is not a static demo.
 * How many reached her, day by day. It should fall as her decisions accumulate.
 */
export function escalationTrend(history: { date: string; heldCount: number }[]): number[] {
  return [...history].sort((a, b) => a.date.localeCompare(b.date)).map((d) => d.heldCount);
}
