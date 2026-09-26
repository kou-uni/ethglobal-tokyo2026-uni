import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { ProductionWorldIdentity, type ProductionWorldConfig } from './world-production.js';

const issuer = 'https://world.example';
const config: ProductionWorldConfig = {
  issuer, requiredAcr: 'orb-test', clientId: 'client', clientSecret: 'secret:+ value',
  redirectUri: 'https://app.example/world-production/callback',
};
const now = Date.parse('2026-09-26T03:00:30Z');
const attempt = { nonce: 'nonce', verifier: 'v'.repeat(43), startedAt: now - 30000 };
let pair: Awaited<ReturnType<typeof generateKeyPair>>;
let keys: ReturnType<typeof createLocalJWKSet>;
beforeAll(async () => {
  pair = await generateKeyPair('RS256');
  keys = createLocalJWKSet({ keys: [{ ...await exportJWK(pair.publicKey), kid: 'test' }] });
});
async function token(over: Record<string, unknown> = {}) {
  return new SignJWT({
    sub: 'private-human-id', nonce: attempt.nonce, auth_time: now / 1000 - 1,
    acr: config.requiredAcr, amr: ['pop'], iss: issuer, aud: config.clientId,
    iat: now / 1000 - 1, exp: now / 1000 + 300, ...over,
  }).setProtectedHeader({ alg: 'RS256', kid: 'test' }).sign(pair.privateKey);
}
function fixture(idToken: string, discoveryOver = {}) {
  const fetcher = vi.fn(async (url: string | URL | Request, options?: RequestInit) => {
    if (String(url).endsWith('openid-configuration')) {
      return Response.json({
        issuer, authorization_endpoint: `${issuer}/authorize`,
        token_endpoint: `${issuer}/token`, jwks_uri: `${issuer}/jwks`, ...discoveryOver,
      });
    }
    expect(String(options?.body)).not.toContain('client_secret');
    return Response.json({ id_token: idToken });
  });
  return { fetcher, adapter: new ProductionWorldIdentity(config, fetcher as typeof fetch, keys) };
}

describe('production World proof', () => {
  it('accepts signed fresh pop and returns only non-identifying metadata', async () => {
    const f = fixture(await token());
    const result = await f.adapter.complete('code', attempt, now);
    expect(result.amr).toEqual(['pop']);
    expect(JSON.stringify(result)).not.toContain('private-human-id');
    expect(Object.keys(result).sort()).toEqual(['acr', 'amr', 'authTime']);
    const options = f.fetcher.mock.calls[1]![1]!;
    const authorization = (options.headers as Record<string, string>).authorization!;
    expect(Buffer.from(authorization.slice(6), 'base64').toString()).toBe('client:secret%3A%2B+value');
  });
  it.each([
    ['issuer', { iss: 'https://wrong.example' }],
    ['audience', { aud: 'wrong-client' }],
    ['nonce', { nonce: 'other-attempt' }],
    ['acr', { acr: 'other-class' }],
    ['old-but-within-120-seconds', { auth_time: now / 1000 - 31 }],
    ['future', { auth_time: now / 1000 + 1 }],
    ['expired', { exp: now / 1000 - 1 }],
    ['missing-subject', { sub: '' }],
    ['missing-amr', { amr: [] }],
  ])('rejects %s', async (_name, over) => {
    await expect(fixture(await token(over as Record<string, unknown>)).adapter.complete('code', attempt, now)).rejects.toThrow();
  });
  it('rejects forged signatures', async () => {
    const other = await generateKeyPair('RS256');
    const forged = await new SignJWT({}).setProtectedHeader({ alg: 'RS256', kid: 'test' }).sign(other.privateKey);
    await expect(fixture(forged).adapter.complete('code', attempt, now)).rejects.toThrow();
  });
  it('rejects mismatched discovery and cross-origin token endpoints before sending secrets', async () => {
    for (const over of [{ issuer: 'https://wrong.example' }, { token_endpoint: 'https://wrong.example/token' }]) {
      const f = fixture('', over);
      await expect(f.adapter.complete('code', attempt, now)).rejects.toThrow();
      expect(f.fetcher).toHaveBeenCalledTimes(1);
    }
  });
  it('constructs PKCE, nonce and fresh-proof controls without a secret', async () => {
    const url = new URL(await fixture('').adapter.begin('state', attempt));
    expect(url.searchParams.get('max_age')).toBe('0');
    expect(url.searchParams.get('prompt')).toBe('login');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('nonce')).toBe(attempt.nonce);
    expect(url.searchParams.has('client_secret')).toBe(false);
    expect(url.searchParams.has('code_verifier')).toBe(false);
  });
});
