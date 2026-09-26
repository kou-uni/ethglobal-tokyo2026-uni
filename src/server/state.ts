/**
 * Yohaku — what the server remembers between requests.
 *
 * In memory on purpose. A night is a few dozen records, the demo is reproducible from a
 * seed, and a database here would be infrastructure standing in for a product decision.
 * Everything that must outlive the process is on chain or in the owner's policy, not here.
 */

import type { HeldAuthorization } from '../ports/settlement.js';
import type { AgentRequest, Bundle, Decision, HeldRequest } from '../core/types.js';
import type { DecisionRecord } from '../core/decisions.js';

export interface Entry {
  /** Private browser capability: only the visitor who created this demo can approve it. */
  demoBrowser?: string;
  request: AgentRequest;
  decision: Decision;
  /** Set once the owner has answered, or the deadline has passed. */
  resolution?: 'approved' | 'ignored' | 'expired';
  /** Present only when money actually moved. Absent is not "pending" — it is "no". */
  settlement?: string;
  /**
   * An authorization the agent signed at intake, held against a `human` verdict.
   *
   * It moves nothing while it waits. If the owner never answers, its `validBefore` passes
   * and it becomes unsettleable by anyone — which is why the deadline is enforced by the
   * signature rather than by us.
   */
  auth?: HeldAuthorization;
  /** Where this one pays, when a visitor asked to be paid into their own wallet. */
  payTo?: string;
  receivedAt: string;
}

export class Store {
  private entries = new Map<string, Entry>();
  private decisions: DecisionRecord[] = [];
  /** Counterparties the owner has answered about before — feeds rule 7. */
  private seen: Set<string>;

  /**
   * An owner who has been trading for a while already knows some counterparties.
   *
   * Starting empty would be "correct" and useless: every request would hit rule 7 at once,
   * and the server would disagree with `npm run seed` about the same night. The two must
   * produce the same numbers or one of them is lying.
   */
  constructor(knownParties: readonly string[] = []) {
    this.seen = new Set(knownParties);
  }

  add(entry: Entry): void {
    this.entries.set(entry.request.id, entry);
  }

  get(id: string): Entry | undefined {
    return this.entries.get(id);
  }

  all(): Entry[] {
    return [...this.entries.values()];
  }

  byVerdict(verdict: Decision['verdict']): Entry[] {
    return this.all().filter((e) => e.decision.verdict === verdict);
  }

  /** Held and not yet answered. */
  outstanding(): HeldRequest[] {
    return this.all()
      .filter((e) => e.decision.verdict === 'human' && !e.resolution)
      .map((e) => ({ request: e.request, decision: e.decision, heldAt: e.receivedAt }));
  }

  hasSeen(who: string): boolean {
    return this.seen.has(who);
  }

  remember(record: DecisionRecord): void {
    this.decisions.push(record);
    this.seen.add(record.who);
  }

  history(): DecisionRecord[] {
    return [...this.decisions];
  }

  /** Total of what actually settled, by currency. */
  received(): { amount: number; currency: string }[] {
    const byCurrency = new Map<string, number>();
    for (const e of this.all()) {
      if (!e.settlement) continue;
      const { amount, currency } = e.request.price;
      byCurrency.set(currency, (byCurrency.get(currency) ?? 0) + amount);
    }
    return [...byCurrency.entries()].map(([currency, amount]) => ({
      currency,
      amount: Math.round(amount * 100) / 100,
    }));
  }

  reset(): void {
    this.entries.clear();
    this.decisions = [];
    this.seen.clear();
  }
}

/** Shape returned to an agent. Deliberately small, and it always includes the reason. */
export function verdictBody(entry: Entry, surfaced?: Bundle[]): Record<string, unknown> {
  return {
    id: entry.request.id,
    verdict: entry.decision.verdict,
    rule: entry.decision.rule,
    reason: entry.decision.reason,
    ...(entry.decision.verdict === 'human'
      ? {
          held: true,
          deadline: entry.request.deadline,
          note: 'held for the owner. You will not be kept waiting on this connection.',
          ...(surfaced ? { willSurface: surfaced.some((b) => b.requests.some((r) => r.request.id === entry.request.id)) } : {}),
        }
      : {}),
    ...(entry.settlement ? { settlement: entry.settlement } : {}),
  };
}
