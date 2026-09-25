import { describe, expect, it } from 'vitest';
import { MockIdentity, isFresh, mayProceed, type FreshnessPolicy } from './identity.js';
import { WorldIdentity } from '../adapters/world-oidc.js';

const POLICY: FreshnessPolicy = {
  maxAgeSeconds: 120,
  requiredAcr: 'https://world.org/oidc/acr/orb-v3',
};

const NOW = new Date('2026-09-26T07:00:00Z');

/** The issuer's own description, as it actually answered on 2026-09-26. */
const DISCOVERY = {
  issuer: 'https://sandbox.auth.world.org',
  authorization_endpoint: 'https://sandbox.auth.world.org/api/v1/authorize',
  token_endpoint: 'https://sandbox.auth.world.org/api/v1/token',
  jwks_uri: 'https://sandbox.auth.world.org/.well-known/jwks.json',
  acr_values_supported: ['https://world.org/oidc/acr/orb-v3'],
};

const stubFetch = (over: Partial<Record<string, unknown>> = {}) =>
  (async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes('.well-known/openid-configuration')) {
      return new Response(JSON.stringify({ ...DISCOVERY, ...over }), { status: 200 });
    }
    return new Response('{}', { status: 500 });
  }) as unknown as typeof fetch;

const world = (over?: Partial<Record<string, unknown>>) =>
  new WorldIdentity(
    { issuer: DISCOVERY.issuer, clientId: 'cid', clientSecret: 'sec', policy: POLICY },
    stubFetch(over),
  );

describe('only a verified person lets it through', () => {
  it.each([
    ['verified', true],
    ['denied', false],
    ['expired', false],
    ['unavailable', false],
  ] as const)('%s → %s', (status, allowed) => {
    const outcome =
      status === 'verified'
        ? ({ status, identity: { subject: 's', issuer: 'i', authTime: NOW, acr: POLICY.requiredAcr } } as const)
        : ({ status, reason: 'r' } as const);
    expect(mayProceed(outcome)).toBe(allowed);
  });
});

describe('freshness is a comparison, not a claim', () => {
  it('accepts an authentication that just happened', () => {
    expect(isFresh(new Date(NOW.getTime() - 5_000), POLICY, NOW)).toBe(true);
  });

  it('rejects one from before the window', () => {
    expect(isFresh(new Date(NOW.getTime() - 3600_000), POLICY, NOW)).toBe(false);
  });

  it('rejects one from the future — a clock that disagrees is not evidence', () => {
    expect(isFresh(new Date(NOW.getTime() + 60_000), POLICY, NOW)).toBe(false);
  });

  it('accepts exactly at the boundary and rejects just past it', () => {
    expect(isFresh(new Date(NOW.getTime() - 120_000), POLICY, NOW)).toBe(true);
    expect(isFresh(new Date(NOW.getTime() - 120_001), POLICY, NOW)).toBe(false);
  });
});

describe('the authorization request asks for a fresh one', () => {
  it('is built from the issuer, never from a URL written in here', async () => {
    const url = new URL(
      await world().beginUrl({ state: 'st', nonce: 'no', redirectUri: 'https://x.example/cb' }),
    );
    expect(url.origin + url.pathname).toBe(DISCOVERY.authorization_endpoint);
  });

  it('sets max_age and acr_values so the issuer re-authenticates', async () => {
    const url = new URL(
      await world().beginUrl({ state: 'st', nonce: 'no', redirectUri: 'https://x.example/cb' }),
    );
    expect(url.searchParams.get('max_age')).toBe('120');
    expect(url.searchParams.get('acr_values')).toBe(POLICY.requiredAcr);
    expect(url.searchParams.get('nonce')).toBe('no');
    expect(url.searchParams.get('response_type')).toBe('code');
  });

  it('refuses to proceed if the issuer does not offer the level we require', async () => {
    await expect(world({ acr_values_supported: ['something-else'] }).assertAcrSupported())
      .rejects.toThrow(/does not offer/);
    await expect(world().assertAcrSupported()).resolves.toBeUndefined();
  });
});

describe('the unsuccessful paths — the protected action must not happen', () => {
  it('a refusal comes back as denied, not as an exception', async () => {
    const out = await world().complete({
      error: 'access_denied',
      redirectUri: 'https://x.example/cb',
      nonce: 'no',
    });
    expect(out.status).toBe('denied');
    expect(mayProceed(out)).toBe(false);
  });

  it('a missing code is denied', async () => {
    const out = await world().complete({ redirectUri: 'https://x.example/cb', nonce: 'no' });
    expect(out).toMatchObject({ status: 'denied' });
  });

  it('a failing token endpoint is unavailable, and still does not proceed', async () => {
    const out = await world().complete({
      code: 'c',
      redirectUri: 'https://x.example/cb',
      nonce: 'no',
    });
    expect(out.status).toBe('unavailable');
    expect(mayProceed(out)).toBe(false);
  });
});

describe('the mock refuses in the same cases', () => {
  it('verifies', async () => {
    const out = await new MockIdentity(POLICY).complete({ at: NOW });
    expect(mayProceed(out)).toBe(true);
  });

  it('declines', async () => {
    expect(mayProceed(await new MockIdentity(POLICY, 'denied').complete({ at: NOW }))).toBe(false);
  });

  it('goes stale', async () => {
    const out = await new MockIdentity(POLICY, 'stale').complete({ at: NOW });
    expect(out.status).toBe('expired');
    expect(mayProceed(out)).toBe(false);
  });

  it('passes an upstream error straight through as denied', async () => {
    const out = await new MockIdentity(POLICY).complete({ error: 'access_denied', at: NOW });
    expect(out).toMatchObject({ status: 'denied', reason: 'access_denied' });
  });
});
