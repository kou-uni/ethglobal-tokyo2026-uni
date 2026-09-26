import { hashSignal } from '@worldcoin/idkit-core/hashing';
import type { IDKitResult } from '@worldcoin/idkit-core';

export interface IdkitChallenge { nonce: string; action: string; signal: string; expiresAt: number }
export interface IdkitVerificationConfig { rpId: string; verifyBaseUrl: string }
export type IdkitProofSummary = Awaited<ReturnType<typeof verifyIdkitProof>>;
const sameHex = (a: unknown, b: string) => typeof a === 'string' && /^0x[0-9a-f]+$/i.test(a) && BigInt(a) === BigInt(b);

/** No payment, user account, token persistence, or uniqueness/reward grant. */
export async function verifyIdkitProof(
  config: IdkitVerificationConfig, challenge: IdkitChallenge, input: unknown,
  nowSeconds = Math.floor(Date.now() / 1000), fetchImpl: typeof fetch = fetch,
) {
  if (nowSeconds >= challenge.expiresAt) throw new Error('expired');
  if (!input || typeof input !== 'object') throw new Error('invalid_proof');
  const proof = input as IDKitResult;
  if (!['3.0', '4.0'].includes(proof.protocol_version) || 'session_id' in proof
    || proof.environment !== 'production' || !sameHex(proof.nonce, challenge.nonce)
    || !('action' in proof) || proof.action !== challenge.action
    || !Array.isArray(proof.responses) || proof.responses.length !== 1) throw new Error('wrong_challenge');
  const item = proof.responses[0]!;
  const credential = proof.protocol_version === '3.0' ? 'orb' : 'proof_of_human';
  if (item.identifier !== credential || !sameHex(item.signal_hash, hashSignal(challenge.signal))
    || (proof.protocol_version === '4.0' && (!('issuer_schema_id' in item) || item.issuer_schema_id !== 1))) {
    throw new Error('wrong_credential');
  }
  const response = await fetchImpl(`${config.verifyBaseUrl}/${encodeURIComponent(config.rpId)}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(proof), signal: AbortSignal.timeout(15000), redirect: 'error',
  });
  // Never display raw proof/nullifier/provider details.
  const result = await response.json() as {
    success?: boolean; environment?: string; action?: string;
    results?: { identifier?: string; success?: boolean }[];
  };
  if (!response.ok || result.success !== true || result.environment && result.environment !== 'production'
    || result.action && result.action !== challenge.action
    || !Array.isArray(result.results) || result.results.length !== 1
    || result.results[0]?.identifier !== credential || result.results[0]?.success !== true) {
    throw new Error('verification_rejected');
  }
  return { verified: true, environment: 'production', protocolVersion: proof.protocol_version,
    credential, checkedAt: new Date(nowSeconds * 1000).toISOString() };
}
