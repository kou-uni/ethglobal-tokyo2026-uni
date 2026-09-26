import { encodePaymentSignatureHeader } from '@x402/core/http';
import { signAuthorization } from './eip3009.js';
import type { PaymentRequirement } from '../ports/settlement.js';
/** Explicit opt-in and pinned destination/asset/network/cap; never broadcasts. */
export async function authorizeRoutingFee(extensions: unknown, env: NodeJS.ProcessEnv, resourceUrl: string, now = Date.now()): Promise<string | undefined> {
  if (env.AGENT_PAY_ROUTING_FEE !== 'true' || !env.AGENT_PRIVATE_KEY) return undefined;
  const info = (extensions as Record<string, { info?: Record<string, unknown> }> | undefined)?.['yohaku-routing-fee']?.info;
  if (!info) return undefined;
  const r = info.requirement as PaymentRequirement | undefined;
  const cap = env.AGENT_FEE_MAX_ATOMIC;
  if (!r || info.optional !== true || typeof info.nonce !== 'string' || !/^0x[0-9a-f]{64}$/i.test(info.nonce)
    || info.nonce !== `0x${info.reference}` || typeof info.expiresAt !== 'number' || !Number.isSafeInteger(info.expiresAt)
    || info.expiresAt * 1000 <= now + 60_000 || info.expiresAt * 1000 > now + 930_000
    || !cap || !/^[1-9]\d*$/.test(cap) || !/^[1-9]\d*$/.test(r.amount)
    || BigInt(r.amount) > BigInt(cap) || r.scheme !== 'exact'
    || !env.AGENT_FEE_ADDRESS || r.payTo.toLowerCase() !== env.AGENT_FEE_ADDRESS.toLowerCase()
    || !env.X402_ASSET || r.asset.toLowerCase() !== env.X402_ASSET.toLowerCase()
    || !env.X402_NETWORK || r.network !== env.X402_NETWORK
    || !env.X402_ASSET_NAME || r.extra?.name !== env.X402_ASSET_NAME
    || !env.X402_ASSET_VERSION || r.extra?.version !== env.X402_ASSET_VERSION) throw new Error('Fee offer is outside the configured spending permission');
  const payload = await signAuthorization({ privateKey: env.AGENT_PRIVATE_KEY, requirement: r,
    validBeforeMs: info.expiresAt * 1000 - 60_000, resourceUrl, nonce: info.nonce as `0x${string}`, now: () => new Date(now) });
  return encodePaymentSignatureHeader(payload as never);
}
