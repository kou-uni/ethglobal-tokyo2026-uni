import { describe, expect, it, vi } from 'vitest';
import { hashSignal } from '@worldcoin/idkit-core/hashing';
import { verifyIdkitProof } from './idkit-proof.js';

const config = { rpId: 'rp_test', verifyBaseUrl: 'https://verify.example/api/v4/verify' };
const challenge = { nonce: '0x1234', action: 'yohaku-live-check', signal: 'random-per-attempt', expiresAt: 200 };
function fixture(protocol = '3.0') {
  const identifier = protocol === '3.0' ? 'orb' : 'proof_of_human';
  const proof = {
    protocol_version: protocol, environment: 'production', nonce: challenge.nonce, action: challenge.action,
    responses: [{ identifier, signal_hash: hashSignal(challenge.signal), proof: 'sample-proof',
      nullifier: 'private-nullifier', ...(protocol === '4.0' ? { issuer_schema_id: 1 } : {}) }],
  };
  const fetcher = vi.fn(async () => Response.json({
    success: true, environment: 'production', action: challenge.action,
    results: [{ identifier, success: true, nullifier: 'private-nullifier' }],
  }));
  return { proof, fetcher };
}

describe('IDKit proof-only verification', () => {
  it.each(['3.0', '4.0'])('accepts a challenge-bound %s Orb/PoH result without exposing identity', async (protocol) => {
    const f = fixture(protocol);
    const result = await verifyIdkitProof(config, challenge, f.proof, 100, f.fetcher as typeof fetch);
    expect(result.verified).toBe(true);
    expect(result.protocolVersion).toBe(protocol);
    expect(JSON.stringify(result)).not.toMatch(/private-nullifier|sample-proof|random-per-attempt/);
    expect(f.fetcher).toHaveBeenCalledOnce();
  });
  it.each(['staging', 'nonce', 'action', 'signal', 'credential', 'schema', 'session', 'multiple', 'expiry'] as const)(
    'rejects %s before contacting the verification service', async (mode) => {
      const f = fixture('4.0');
      if (mode === 'staging') f.proof.environment = 'staging';
      if (mode === 'nonce') f.proof.nonce = '0x9999';
      if (mode === 'action') f.proof.action = 'other-action';
      if (mode === 'signal') f.proof.responses[0]!.signal_hash = hashSignal('other-browser');
      if (mode === 'credential') f.proof.responses[0]!.identifier = 'selfie';
      if (mode === 'schema') f.proof.responses[0]!.issuer_schema_id = 11;
      if (mode === 'session') Object.assign(f.proof, { session_id: 'session_test' });
      if (mode === 'multiple') f.proof.responses.push(f.proof.responses[0]!);
      await expect(verifyIdkitProof(config, challenge, f.proof, mode === 'expiry' ? 200 : 100, f.fetcher as typeof fetch)).rejects.toThrow();
      expect(f.fetcher).not.toHaveBeenCalled();
    },
  );
  it.each([
    { success: true, results: [{ identifier: 'orb', success: false }] },
    { success: true, results: [{ identifier: 'selfie', success: true }] },
    { success: true, environment: 'staging', results: [{ identifier: 'orb', success: true }] },
    { success: true, action: 'other', results: [{ identifier: 'orb', success: true }] },
    { success: true, results: [] },
    { success: false },
  ])('does not treat a partial or mismatched API response as success', async (result) => {
    await expect(verifyIdkitProof(config, challenge, fixture().proof, 100,
      (async () => Response.json(result)) as typeof fetch)).rejects.toThrow('verification_rejected');
  });
  it('does not accept HTTP failure or network failure', async () => {
    const f = fixture();
    await expect(verifyIdkitProof(config, challenge, f.proof, 100,
      (async () => Response.json({ success: true, results: [{ identifier: 'orb', success: true }] }, { status: 503 })) as typeof fetch)).rejects.toThrow();
    await expect(verifyIdkitProof(config, challenge, f.proof, 100,
      (async () => { throw new Error('offline'); }) as typeof fetch)).rejects.toThrow();
  });
});
