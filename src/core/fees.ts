/**
 * What we charge for, and what we do not.
 *
 * **We are not paid out of the seller's money.** Their payment is an `exact` transfer straight
 * to them; we are not a destination on it and never hold it. What we charge for is the work we
 * actually did — running ten rules, bundling, holding the day's count, and checking that a
 * person was there — so the charge is per decision, not per yen.
 *
 * That distinction is not a wording choice. **A cut of the money would grow when we escalate
 * an expensive request; a charge per decision does not.** We would rather not have that
 * incentive at all than promise to resist it.
 *
 * And it is charged the way the protocol says to charge something smaller than gas: a
 * commitment now, redeemed later, in one transaction. `batch-settlement` exists for exactly
 * this — *"gas fees exceed the value of individual requests"*.
 */

/** One decision, one voucher. Kept until it is worth a transaction to redeem them. */
export interface Voucher {
  requestId: string;
  /** Atomic units of the settlement asset. */
  amount: string;
  /** What we did to earn it. */
  work: 'routed';
  at: string;
  /** The agent's signed authorization for the fee, when it sent one. */
  authorization?: unknown;
}

export interface FeePolicy {
  /**
   * Atomic units per decision.
   *
   * Deliberately near the floor: this has to be smaller than what the seller gets by enough
   * that nobody thinks about it. **A fee a person notices is a fee that closes the counter,
   * and a closed counter pays us nothing.** The interests line up.
   */
  perDecision: number;
  /** Below this, redeeming costs more than it collects. Nothing is broadcast until then. */
  redeemAbove: number;
  /** Where the fee would go. Never the seller's address. */
  payTo: string;
}

export interface FeeSummary {
  vouchers: number;
  accrued: string;
  redeemAbove: string;
  /** True once redeeming would collect more than the gas to redeem it. */
  worthRedeeming: boolean;
  /** Nothing has been broadcast. Said plainly rather than implied by omission. */
  redeemed: string;
}

/**
 * The vouchers we hold.
 *
 * In memory, like the rest of the store — and **nothing here has ever been redeemed.** The
 * summary says so rather than leaving a reader to assume it from a number going up.
 */
export class FeeLedger {
  private readonly vouchers: Voucher[] = [];

  constructor(private readonly policy: FeePolicy) {}

  /** Called once per decision, whatever the decision was. We did the work either way. */
  record(requestId: string, at: string, authorization?: unknown): Voucher {
    const v: Voucher = {
      requestId,
      amount: String(this.policy.perDecision),
      work: 'routed',
      at,
      ...(authorization ? { authorization } : {}),
    };
    this.vouchers.push(v);
    return v;
  }

  all(): readonly Voucher[] {
    return this.vouchers;
  }

  accrued(): number {
    return this.vouchers.reduce((sum, v) => sum + Number(v.amount), 0);
  }

  /** How many of them the agent actually signed for. The rest are ours to write off. */
  authorized(): Voucher[] {
    return this.vouchers.filter((v) => v.authorization !== undefined);
  }

  summary(): FeeSummary {
    const accrued = this.accrued();
    return {
      vouchers: this.vouchers.length,
      accrued: String(accrued),
      redeemAbove: String(this.policy.redeemAbove),
      worthRedeeming: accrued >= this.policy.redeemAbove,
      redeemed: '0 — nothing has been broadcast. See docs/product/ECONOMICS.md',
    };
  }
}

export function feesFromEnv(env: NodeJS.ProcessEnv): FeePolicy | undefined {
  const payTo = env['YOHAKU_FEE_ADDRESS'];
  if (!payTo) return undefined;
  return {
    perDecision: Number(env['YOHAKU_FEE_PER_DECISION'] ?? 1),
    redeemAbove: Number(env['YOHAKU_FEE_REDEEM_ABOVE'] ?? 10_000),
    payTo,
  };
}
