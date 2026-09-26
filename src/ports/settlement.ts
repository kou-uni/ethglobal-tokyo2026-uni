/**
 * Settlement — the last thing we wired, and the first thing a judge will test.
 *
 * Two properties are worth more than the integration itself:
 *
 * **1. There is no "probably paid".** `SettlementResult` is `settled | refused`. A facilitator
 * that times out, a signature that does not verify, a network we do not accept — all of them
 * are `refused`. Nothing in the type system lets a caller treat an unknown as a success, in
 * exactly the way `Suggestion` has no `pass`.
 *
 * **2. The deadline is not our promise — it is the signature's.** An EIP-3009 authorization
 * carries `validBefore`. We require it to outlive the request's deadline, which means that
 * if the owner never answers, **the authorization expires on chain and can never be settled
 * by anyone, including us.** "Silence is not consent" stops being a server behaviour and
 * becomes a property of the money.
 */

export interface PaymentRequirement {
  scheme: string;
  /** CAIP-2, e.g. eip155:84532. Never hardcoded — it comes from configuration. */
  network: string;
  /** Atomic token units, as a decimal string. */
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: Record<string, unknown>;
}

export type SettlementResult =
  | { status: 'settled'; transaction: string; network: string; payer?: string }
  | { status: 'refused'; reason: string };

export interface SettlementPort {
  /** True only when a real facilitator is configured. `GET /health` reports it. */
  readonly live: boolean;
  /** What this request costs, in the asset actually being settled. */
  quote(amount: number, currency: string): PaymentRequirement;
  /**
   * Verify a signed authorization without moving anything. Used at intake, so a held
   * request can be rejected immediately if its authorization would expire before it
   * could ever be approved.
   */
  check(payload: unknown, requirement: PaymentRequirement): Promise<SettlementResult>;
  /** Move the money. Only ever called after `auto`, or after the owner answered yes. */
  settle(payload: unknown, requirement: PaymentRequirement): Promise<SettlementResult>;
}

/**
 * The authorization an agent signed up front, kept against a held request.
 *
 * Holding this is what makes "approve on your phone and the money lands" possible without
 * asking the agent to come back — and it costs the agent nothing while it waits, because an
 * EIP-3009 authorization moves no funds until it is settled.
 */
export interface HeldAuthorization {
  payload: unknown;
  requirement: PaymentRequirement;
  /** Unix seconds. Past this, nobody can settle it. */
  validBefore: number;
}

/** Seconds, from an EIP-3009 authorization inside an x402 payload. Absent → 0. */
export function validBeforeOf(payload: unknown): number {
  const auth = (payload as { payload?: { authorization?: { validBefore?: string | number } } })
    ?.payload?.authorization?.validBefore;
  const n = Number(auth);
  return Number.isFinite(n) ? n : 0;
}

/**
 * An authorization is only worth holding if it outlives the request it is attached to.
 *
 * Accepting a shorter one would mean telling the agent "you are in the queue" while knowing
 * the payment can never complete — the exact shape of lying we refuse elsewhere.
 */
export function outlivesDeadline(payload: unknown, deadline: string): boolean {
  const validBefore = validBeforeOf(payload);
  if (validBefore <= 0) return false;
  return validBefore * 1000 >= new Date(deadline).getTime();
}

/** Stands in when no facilitator is configured. Refuses, and says why. */
export class NoSettlement implements SettlementPort {
  readonly live = false;

  constructor(private readonly requirement: PaymentRequirement) {}

  quote(): PaymentRequirement {
    return this.requirement;
  }

  async check(): Promise<SettlementResult> {
    return { status: 'refused', reason: 'settlement is not configured on this instance' };
  }

  async settle(): Promise<SettlementResult> {
    return { status: 'refused', reason: 'settlement is not configured on this instance' };
  }
}
