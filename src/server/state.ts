/**
 * Yohaku — what the server remembers between requests.
 *
 * Pending authorizations and browser sessions live in memory. In the runnable server,
 * completed requests and uncertain payment intents are journaled before money can move.
 * The daily attention budget is persisted separately. Both files require a single writer.
 */

import type { HeldAuthorization } from '../ports/settlement.js';
import type { AgentRequest, Bundle, Decision, HeldRequest, Policy } from '../core/types.js';
import type { DecisionRecord } from '../core/decisions.js';
import { AttentionBudget } from './attention.js';
import { onDeadline } from '../core/queue.js';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

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
  /** Actual screened source, bound to the signed payer for ordinary paid requests. */
  paymentSource?: string;
  /** A terminal response survives retries, including uncertain payment failures. */
  completed?: { status: number; body: Record<string, unknown> };
}

/** Canonical request identity: a retry may add a signature, never change the offer. */
export function sameRequest(a: AgentRequest, b: AgentRequest): boolean {
  const fields = (r: AgentRequest) => [
    r.id, r.who, r.what, r.purpose, r.price.amount, r.price.currency, r.deadline,
    r.payoutAddress?.toLowerCase() ?? null, r.actingAs ?? 'buyer', r.writeTarget ?? null,
  ];
  return JSON.stringify(fields(a)) === JSON.stringify(fields(b));
}

export class Store {
  private entries = new Map<string, Entry>();
  private decisions: DecisionRecord[] = [];
  /** Counterparties the owner has answered about before — feeds rule 7. */
  private seen: Set<string>;
  private processing = new Set<string>();

  acquire(id: string): boolean {
    if (this.processing.has(id)) return false;
    this.processing.add(id); return true;
  }
  release(id: string): void { this.processing.delete(id); }

  /**
   * An owner who has been trading for a while already knows some counterparties.
   *
   * Starting empty would be "correct" and useless: every request would hit rule 7 at once,
   * and the server would disagree with `npm run seed` about the same night. The two must
   * produce the same numbers or one of them is lying.
   */
  constructor(knownParties: readonly string[] = [], private attention = new AttentionBudget(), private journal?: string) {
    this.seen = new Set(knownParties);
    if (journal) {
      try {
        const saved = JSON.parse(readFileSync(journal, 'utf8'));
        if (saved.version !== 1 || !Array.isArray(saved.entries)
          || saved.entries.some((e: Entry) => !e?.request?.id || !e.decision || !e.completed
            || !Number.isInteger(e.completed.status) || !e.completed.body || e.auth || e.demoBrowser)) {
          throw new Error('Invalid request journal; reconcile before restarting');
        }
        this.entries = new Map(saved.entries.map((e: Entry) => [e.request.id, e]));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
    }
  }

  add(entry: Entry): void {
    this.entries.set(entry.request.id, entry);
    if (this.journal && entry.completed) {
      mkdirSync(dirname(this.journal), { recursive: true, mode: 0o700 });
      // Persist intent/results only. Held authorizations and browser capabilities stay in memory.
      const entries = this.all().filter(e => e.completed).map(({ auth, demoBrowser, ...safe }) => safe);
      writeFileSync(`${this.journal}.tmp`, JSON.stringify({ version: 1, entries }), { mode: 0o600 });
      renameSync(`${this.journal}.tmp`, this.journal);
    }
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

  surface(policy: Policy, now: Date) {
    const held = this.outstanding();
    const result = this.attention.surface(held.filter(h => !this.get(h.request.id)?.demoBrowser), policy, now);
    result.expired.push(...held.filter(h => this.get(h.request.id)?.demoBrowser
      && !(Date.parse(h.request.deadline) > now.getTime())));
    for (const held of result.expired) {
      const entry = this.entries.get(held.request.id)!;
      entry.resolution = 'expired';
      entry.decision = onDeadline();
      this.remember({
        who: entry.request.who, what: entry.request.what, outcome: 'ignored',
        decidedAt: now.toISOString(), escalatedBy: held.decision.rule,
      });
    }
    return result;
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
      if (!e.settlement || e.settlement === 'not-wired') continue;
      const { amount, currency } = e.request.price;
      byCurrency.set(currency, (byCurrency.get(currency) ?? 0) + amount);
    }
    return [...byCurrency.entries()].map(([currency, amount]) => ({
      currency,
      amount: Math.round(amount * 100) / 100,
    }));
  }

  reset(): void {
    if (this.journal) throw new Error('A persistent payment journal must not be reset');
    this.entries.clear();
    this.decisions = [];
    this.seen.clear();
    this.processing.clear();
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
