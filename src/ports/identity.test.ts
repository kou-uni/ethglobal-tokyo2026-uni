import { describe, expect, it } from 'vitest';
import { MockIdentity, isFresh, isPossessionOnly, mayProceed, methodAccepted, type FreshnessPolicy } from './identity.js';
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
  prompt_values_supported: ['none', 'login'],
  code_challenge_methods_supported: ['S256'],
};

const VERIFIER = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';

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
  const begin = () =>
    world().beginUrl({
      state: 'st',
      nonce: 'no',
      redirectUri: 'https://x.example/cb',
      codeVerifier: VERIFIER,
    });

  it('is built from the issuer, never from a URL written in here', async () => {
    const url = new URL(await begin());
    expect(url.origin + url.pathname).toBe(DISCOVERY.authorization_endpoint);
  });

  it('carries PKCE — without it this issuer refuses every request', async () => {
    const url = new URL(await begin());
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    // RFC 7636 A.1/A.2 test vector: challenge for this verifier.
    expect(url.searchParams.get('code_challenge')).toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    );
  });

  it('refuses to build a request without a verifier rather than sending one that fails', async () => {
    await expect(
      world().beginUrl({ state: 'st', nonce: 'no', redirectUri: 'https://x.example/cb' }),
    ).rejects.toThrow(/PKCE/);
  });

  it('asks for re-authentication the way this issuer advertises', async () => {
    const url = new URL(await begin());
    expect(url.searchParams.get('prompt')).toBe('login');
    expect(url.searchParams.get('acr_values')).toBe(POLICY.requiredAcr);
    expect(url.searchParams.get('nonce')).toBe('no');
    expect(url.searchParams.get('response_type')).toBe('code');
  });

  it('does not send prompt=login to an issuer that does not advertise it', async () => {
    const url = new URL(
      await world({ prompt_values_supported: ['none'] }).beginUrl({
        state: 'st',
        nonce: 'no',
        redirectUri: 'https://x.example/cb',
        codeVerifier: VERIFIER,
      }),
    );
    expect(url.searchParams.get('prompt')).toBeNull();
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

/**
 * What the issuer actually answers, and what we are therefore allowed to say.
 *
 * Measured 2026-09-26 against `sandbox.auth.world.org`: sending both `prompt=login` and
 * `max_age=0`, it returned `amr: ["pop"]` with `auth_time` stamped one second before `iat`.
 * **A fresh `auth_time` is not evidence that anybody was asked** — these lock the distinction
 * so that a later change cannot quietly restore the stronger claim.
 */
describe('proof of possession is not an approval', () => {
  const policy = { maxAgeSeconds: 120, requiredAcr: 'orb-v3' };

  it('recognises a pop-only authentication', () => {
    expect(isPossessionOnly(['pop'])).toBe(true);
  });

  it('does not call it possession-only when another method is present', () => {
    expect(isPossessionOnly(['pop', 'user'])).toBe(false);
    expect(isPossessionOnly(['mfa'])).toBe(false);
  });

  it('treats a missing amr as not provably possession-only', () => {
    expect(isPossessionOnly(undefined)).toBe(false);
    expect(isPossessionOnly([])).toBe(false);
  });

  it('accepts any method when a deployment names none', () => {
    expect(methodAccepted(['pop'], policy)).toBe(true);
    expect(methodAccepted(undefined, policy)).toBe(true);
  });

  /** A deployment that needs a real re-authentication can demand it, and this issuer fails it. */
  it('refuses pop when a deployment insists on something stronger', () => {
    const strict = { ...policy, acceptedAmr: ['mfa', 'user'] };
    expect(methodAccepted(['pop'], strict)).toBe(false);
    expect(methodAccepted(['user'], strict)).toBe(true);
    expect(methodAccepted(undefined, strict)).toBe(false);
  });

  /**
   * The trap this whole section exists for: freshness and method are independent, and
   * conflating them is how "she proved she is a person just now" got written down.
   */
  it('is fresh and still only possession', () => {
    const now = new Date('2026-09-26T12:00:00Z');
    const authTime = new Date(now.getTime() - 1000);
    expect(isFresh(authTime, policy, now)).toBe(true);
    expect(isPossessionOnly(['pop'])).toBe(true);
  });
});
