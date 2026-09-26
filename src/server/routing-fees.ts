import { createHash, randomBytes } from 'node:crypto';
import { verifyTypedData } from 'viem';
import { decodePaymentSignatureHeader } from '@x402/core/http';
import { FeeLedger, validateFeePolicy, type FeePolicy } from '../core/fees.js';
import type { AgentRequest } from '../core/types.js';
import type { PaymentRequirement } from '../ports/settlement.js';
import { chainIdOf } from '../adapters/eip3009.js';

export const FEE_EXTENSION = 'yohaku-routing-fee';
export const FEE_HEADER = 'yohaku-fee-authorization';
interface Quote { key: string; reference: string; requirement?: PaymentRequirement; expiresAt: number }
const types = { TransferWithAuthorization: [
  { name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'value', type: 'uint256' },
  { name: 'validAfter', type: 'uint256' }, { name: 'validBefore', type: 'uint256' }, { name: 'nonce', type: 'bytes32' },
] } as const;
/** App-defined optional extension, NOT an implementation of the batch-settlement scheme. */
export class RoutingFees {
  readonly ledger: FeeLedger;
  private readonly quotes = new Map<string, Quote>();
  constructor(readonly policy: FeePolicy, private readonly template?: PaymentRequirement) {
    validateFeePolicy(policy); this.ledger = new FeeLedger(policy);
  }
  record(request: AgentRequest, now: number): Quote {
    // Same id and canonical request on an x402 retry = one voucher. Changes get their own quote.
    const key = createHash('sha256').update(JSON.stringify([
      request.id, request.who, request.what, request.purpose, request.price.amount, request.price.currency,
      request.deadline, request.payoutAddress ?? null, request.actingAs ?? null, request.writeTarget ?? null,
    ])).digest('hex');
    this.ledger.record(key, new Date(now).toISOString());
    let q = this.quotes.get(key);
    if (!q) {
      q = { key, reference: randomBytes(32).toString('hex'), expiresAt: Math.floor(now / 1000) + 900,
        ...(this.template ? { requirement: { ...this.template, amount: String(this.policy.perDecision), payTo: this.policy.payTo, maxTimeoutSeconds: 900 } } : {}) };
      this.quotes.set(key, q);
    }
    return q;
  }
  extensions(q: Quote) {
    if (!q.requirement) return undefined;
    return { [FEE_EXTENSION]: { info: {
      optional: true, reference: q.reference, nonce: `0x${q.reference}`, expiresAt: q.expiresAt,
      requirement: q.requirement, header: FEE_HEADER, collection: 'disabled; no broadcast',
    }, schema: { type: 'object', required: ['optional', 'reference', 'nonce', 'expiresAt', 'requirement', 'header', 'collection'],
      properties: { optional: { const: true }, reference: { type: 'string' }, nonce: { type: 'string' }, expiresAt: { type: 'integer' }, requirement: { type: 'object' }, header: { type: 'string' }, collection: { type: 'string' } } } } };
  }
  async receive(q: Quote, raw: string | string[] | undefined, now: number): Promise<string> {
    if (!raw) return 'not supplied; request continues';
    if (typeof raw !== 'string' || raw.length > 16000 || !q.requirement) return 'rejected; request continues';
    try {
      const p = decodePaymentSignatureHeader(raw) as unknown as {
        x402Version: number; accepted: PaymentRequirement;
        payload: { signature: `0x${string}`; authorization: Record<string, string> };
      };
      const r = q.requirement, a = p.payload?.authorization, t = Math.floor(now / 1000);
      if (!a || p.x402Version !== 2 || r.scheme !== 'exact' || !r.extra?.name || !r.extra.version
        || p.accepted?.scheme !== r.scheme || p.accepted.network !== r.network
        || p.accepted.asset?.toLowerCase() !== r.asset.toLowerCase() || p.accepted.payTo?.toLowerCase() !== r.payTo.toLowerCase()
        || p.accepted.amount !== r.amount || a.to?.toLowerCase() !== r.payTo.toLowerCase()
        || a.value !== r.amount || a.nonce !== `0x${q.reference}` || !/^0x[0-9a-fA-F]{40}$/.test(a.from ?? '')
        || !/^\d+$/.test(a.validAfter ?? '') || !/^\d+$/.test(a.validBefore ?? '')
        || BigInt(a.validAfter!) > BigInt(t) || BigInt(a.validBefore!) <= BigInt(t)
        || BigInt(a.validBefore!) > BigInt(q.expiresAt) || q.expiresAt <= t) throw new Error('invalid fee');
      const valid = await verifyTypedData({ address: a.from as `0x${string}`,
        domain: { name: String(r.extra.name), version: String(r.extra.version), chainId: chainIdOf(r.network), verifyingContract: r.asset as `0x${string}` },
        types, primaryType: 'TransferWithAuthorization', signature: p.payload.signature,
        message: { from: a.from as `0x${string}`, to: r.payTo as `0x${string}`, value: BigInt(r.amount), validAfter: BigInt(a.validAfter!), validBefore: BigInt(a.validBefore!), nonce: a.nonce as `0x${string}` } });
      if (!valid) throw new Error('bad signature');
      const added = this.ledger.attach(q.key, { ...p, accepted: r });
      return added ? 'signature verified and retained; not paid' : 'already retained; not paid';
    } catch { return 'rejected; request continues'; }
  }
  summary(now = Date.now()) {
    const unexpired = this.ledger.authorized().filter(v => {
      const auth = (v.authorization as { payload?: { authorization?: { validBefore?: string } } })?.payload?.authorization;
      return auth?.validBefore && BigInt(auth.validBefore) > BigInt(Math.floor(now / 1000));
    });
    const unexpiredAmount = unexpired.reduce((sum, v) => sum + BigInt(v.amount), 0n);
    return { enabled: true, ...this.ledger.summary(), unexpiredAuthorizedVouchers: unexpired.length,
      unexpiredAuthorizedAccrued: String(unexpiredAmount), worthRedeeming: unexpiredAmount >= BigInt(this.policy.redeemAbove), unit: 'atomic token units',
      network: this.template?.network ?? null, asset: this.template?.asset ?? null,
      authorizationAvailable: Boolean(this.template), collection: 'disabled',
      note: 'Accrued includes unsigned vouchers. Signatures do not reserve funds. Authorized amounts may expire or become uncollectible. Threshold is configured, not a gas estimate. Memory-only; lost on restart.' };
  }
}
