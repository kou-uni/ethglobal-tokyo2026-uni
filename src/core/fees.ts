/** Optional per-decision accounting. Seller proceeds never enter this ledger. */
export interface Voucher {
  requestId: string;
  amount: string;
  work: 'routed';
  at: string;
  /** Cryptographically checked fee authorization; not proof of funds or settlement. */
  authorization?: unknown;
}
export interface FeePolicy { perDecision: number; redeemAbove: number; payTo: string }
export interface FeeSummary {
  vouchers: number; accrued: string; authorizedVouchers: number; authorizedAccrued: string;
  unsignedVouchers: number; redeemAbove: string; worthRedeeming: boolean;
  redeemed: string; broadcast: false;
}
export function validateFeePolicy(p: FeePolicy): FeePolicy {
  if (!/^0x[0-9a-fA-F]{40}$/.test(p.payTo) || /^0x0{40}$/i.test(p.payTo)
    || !Number.isSafeInteger(p.perDecision) || p.perDecision <= 0
    || !Number.isSafeInteger(p.redeemAbove) || p.redeemAbove <= 0) throw new Error('Invalid routing fee configuration');
  return p;
}
/** In memory. Repeated records for the same accounting key are one decision, not new fees. */
export class FeeLedger {
  private readonly vouchers = new Map<string, Voucher>();
  constructor(private readonly policy: FeePolicy) { validateFeePolicy(policy); }
  record(requestId: string, at: string, authorization?: unknown): Voucher {
    const existing = this.vouchers.get(requestId);
    if (existing) return existing;
    const v: Voucher = { requestId, amount: String(this.policy.perDecision), work: 'routed', at,
      ...(authorization !== undefined ? { authorization } : {}) };
    this.vouchers.set(requestId, v); return v;
  }
  attach(requestId: string, authorization: unknown): boolean {
    const v = this.vouchers.get(requestId);
    if (!v || v.authorization !== undefined) return false;
    v.authorization = authorization; return true;
  }
  all(): readonly Voucher[] { return [...this.vouchers.values()]; }
  accrued(): bigint { return this.all().reduce((sum, v) => sum + BigInt(v.amount), 0n); }
  authorized(): Voucher[] { return this.all().filter(v => v.authorization !== undefined); }
  summary(): FeeSummary {
    const signed = this.authorized(), amount = signed.reduce((sum, v) => sum + BigInt(v.amount), 0n);
    return {
      vouchers: this.vouchers.size, accrued: String(this.accrued()), authorizedVouchers: signed.length,
      authorizedAccrued: String(amount), unsignedVouchers: this.vouchers.size - signed.length,
      redeemAbove: String(this.policy.redeemAbove), worthRedeeming: amount >= BigInt(this.policy.redeemAbove),
      redeemed: '0 — nothing has been broadcast. See docs/product/ECONOMICS.md', broadcast: false,
    };
  }
}
export function feesFromEnv(env: NodeJS.ProcessEnv): FeePolicy | undefined {
  if (!env.YOHAKU_FEE_ADDRESS) return undefined;
  return validateFeePolicy({ payTo: env.YOHAKU_FEE_ADDRESS,
    perDecision: Number(env.YOHAKU_FEE_PER_DECISION ?? 1),
    redeemAbove: Number(env.YOHAKU_FEE_REDEEM_ABOVE ?? 10_000) });
}
