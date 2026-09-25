/**
 * Yohaku — core types.
 *
 * Every incoming request carries exactly five things. The fifth one — `deadline` —
 * is the one people forget, and it is the reason this product works at all:
 * a router that has not decided what happens while the owner is asleep does not work.
 */

/** What an agent may claim it wants the data for. Self-declared — see QA. */
export type Purpose =
  | 'market-research'
  | 'demand-estimation'
  | 'personalisation'
  | 'ai-training'
  | 'other';

/** The five fields. Nothing is accepted without all of them. */
export interface AgentRequest {
  id: string;
  /** ENS name — the agent identifies itself. */
  who: string;
  /** Category being asked for, e.g. "purchase-intent/cosmetics". */
  what: string;
  purpose: Purpose;
  price: { amount: number; currency: 'JPYC' };
  /** ISO 8601. Withdrawn by the agent if unanswered by then. */
  deadline: string;

  /** Where money would go. Screened before signing. */
  payoutAddress?: string;

  /**
   * Requests from a *delegate* (the owner's own helper agent) are judged on a
   * different axis from requests from a buyer. See rule 0.
   */
  actingAs?: 'buyer' | 'delegate';
  /** Which key a delegate is attempting to write. Anything but `proposal` is rule 0. */
  writeTarget?: 'proposal' | 'permission' | 'payout';
}

export interface Grant {
  /** Category this grant covers. */
  category: string;
  /** If set, the grant is only for this counterparty. */
  grantee?: string;
  /** ISO 8601. */
  expiresAt: string;
  revoked: boolean;
}

/** Written once by the owner. The body lives off-chain; only its hash goes on-chain. */
export interface Policy {
  /** ENS name, e.g. alice.yohaku.eth */
  owner: string;
  /** Categories that may pass automatically. */
  allow: string[];
  /** Categories that are never offered, to anyone. */
  forbid: string[];
  /** Categories that always reach a human, however small the amount. */
  sensitive: string[];
  /** Above this, a human decides. */
  amountThreshold: number;
  /** How many requests may reach the owner in one day. The product's real setting. */
  dailyCap: number;
  /** Local hour at which held requests surface. */
  notifyHour: number;
  grants: Grant[];
}

export type Verdict = 'auto' | 'human' | 'deny';

export interface Decision {
  verdict: Verdict;
  /** Which rule fired, 0–9. Kept so that every outcome can be explained afterwards. */
  rule: number;
  reason: string;
}

/** Screening is a live call. `unavailable` is not a pass — see `route`. */
export type ScreeningResult = 'clean' | 'flagged' | 'unavailable';

export interface RoutingContext {
  now: Date;
  /** Has the owner ever decided about this counterparty before? */
  seenBefore(who: string): boolean;
  /** Live call, before signing. Its result decides what happens next. */
  screen(payoutAddress: string | undefined): ScreeningResult;
  /** True once the owner has revoked the delegate entirely. */
  delegationRevoked?: boolean;
}

/** Lifecycle of one request. Kept separate from Grant and Delegation on purpose. */
export type RequestState =
  | 'received'
  | 'evaluating'
  | 'auto'
  | 'held'
  | 'bundled'
  | 'surfaced'
  | 'approved'
  | 'settling'
  | 'settled'
  | 'denied'
  | 'failed';

export interface HeldRequest {
  request: AgentRequest;
  decision: Decision;
  heldAt: string;
}

/** One line in the morning inbox. Several requests may be behind it. */
export interface Bundle {
  /** Category these requests share. */
  category: string;
  requests: HeldRequest[];
  /** Highest value in the bundle, used for ranking. */
  topValue: number;
  /** Earliest deadline in the bundle. */
  nextDeadline: string;
}
