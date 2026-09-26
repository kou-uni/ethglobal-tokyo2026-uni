/**
 * Yohaku — World ID for Agents, over OIDC.
 *
 * Nothing about the provider is written down here except the issuer, which comes from the
 * environment. Endpoints, signing keys and the supported assurance levels are all read from
 * the issuer's own discovery document at run time.
 *
 * The freshness requirement is enforced twice on purpose:
 *
 *   - **asking**: `prompt=login` and `max_age=0` both tell the issuer to re-authenticate
 *     rather than reuse a session. We send both, and we **check the answer** rather than
 *     assuming either worked: `amr` says how the person was authenticated, and a value of
 *     `pop` means a key was presented, not that anybody approved anything.
 *   - **checking**: `auth_time` on the returned token is compared against the clock here
 *
 * Asking alone would be trusting the issuer to have honoured a parameter. Checking alone
 * would let a stale session through. Both together is what makes "she proved it just now"
 * something a judge can verify instead of take on faith.
 *
 * **PKCE is required here**, which is not obvious from the documentation — every
 * authorization request without `code_challenge` comes back `invalid_request`, whatever
 * else is on it. Found by probing the endpoint rather than by reading about it.
 */

import { createHash } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type {
  FreshnessPolicy,
  IdentityPort,
  VerificationOutcome,
} from '../ports/identity.js';
import { isFresh, methodAccepted } from '../ports/identity.js';

interface Discovery {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  acr_values_supported?: string[];
  prompt_values_supported?: string[];
  code_challenge_methods_supported?: string[];
}

/** RFC 7636 S256: base64url(sha256(verifier)). */
export function codeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

export class WorldIdentity implements IdentityPort {
  private discovery?: Discovery;
  private jwks?: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    private readonly config: {
      issuer: string;
      clientId: string;
      clientSecret: string;
      policy: FreshnessPolicy;
    },
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  /** Read the issuer's own description of itself. Cached for the process. */
  private async discover(): Promise<Discovery> {
    if (this.discovery) return this.discovery;
    const url = `${this.config.issuer.replace(/\/$/, '')}/.well-known/openid-configuration`;
    const res = await this.fetchImpl(url);
    if (!res.ok) throw new Error(`discovery failed: ${res.status} at ${url}`);
    const d = (await res.json()) as Discovery;
    for (const key of ['authorization_endpoint', 'token_endpoint', 'jwks_uri'] as const) {
      if (!d[key]) throw new Error(`discovery document has no ${key}`);
    }
    this.discovery = d;
    return d;
  }

  /**
   * Check that the level we require is one the issuer actually offers.
   *
   * Cheap, and it turns a silent mismatch — asking for an acr nobody supports and getting a
   * token without it — into an error at the point the request is built.
   */
  async assertAcrSupported(): Promise<void> {
    const d = await this.discover();
    const supported = d.acr_values_supported ?? [];
    if (supported.length > 0 && !supported.includes(this.config.policy.requiredAcr)) {
      throw new Error(
        `issuer does not offer ${this.config.policy.requiredAcr}; it offers ${supported.join(', ')}`,
      );
    }
  }

  async beginUrl(p: {
    state: string;
    nonce: string;
    redirectUri: string;
    codeVerifier?: string;
  }): Promise<string> {
    const d = await this.discover();
    if (!p.codeVerifier) {
      throw new Error('this issuer requires PKCE — a code verifier must be supplied');
    }
    const url = new URL(d.authorization_endpoint);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', this.config.clientId);
    url.searchParams.set('redirect_uri', p.redirectUri);
    url.searchParams.set('scope', 'openid');
    url.searchParams.set('state', p.state);
    url.searchParams.set('nonce', p.nonce);
    url.searchParams.set('code_challenge', codeChallenge(p.codeVerifier));
    url.searchParams.set('code_challenge_method', 'S256');

    /*
     * `max_age=0` — the spec's own way to demand a fresh authentication.
     *
     * `prompt=login` alone was not enough here: the issuer answered with `amr: ["pop"]` and an
     * `auth_time` stamped one second earlier, which is a session presenting a key it already
     * held rather than a person approving anything. OIDC Core says an OP **MUST** attempt to
     * actively re-authenticate when the elapsed time exceeds `max_age`, so zero is the
     * strongest ask available.
     *
     * The discovery document does not advertise `max_age`, and an OP is allowed to ignore a
     * parameter it does not implement — so **this is an ask, not a guarantee.** What decides
     * whether it worked is `amr` on the way back, which is why we print it.
     */
    url.searchParams.set('max_age', '0');
    // Re-authenticate rather than reuse a session: this is the "at the moment" part.
    if ((d.prompt_values_supported ?? []).includes('login')) {
      url.searchParams.set('prompt', 'login');
    }
    url.searchParams.set('acr_values', this.config.policy.requiredAcr);
    return url.toString();
  }

  async complete(p: {
    code?: string;
    error?: string;
    redirectUri: string;
    nonce: string;
    codeVerifier?: string;
    at?: Date;
  }): Promise<VerificationOutcome> {
    const now = p.at ?? new Date();

    // A refusal is an ordinary outcome, not an exception.
    if (p.error) return { status: 'denied', reason: p.error };
    if (!p.code) return { status: 'denied', reason: 'no authorization code was returned' };

    let d: Discovery;
    try {
      d = await this.discover();
    } catch (e) {
      return { status: 'unavailable', reason: e instanceof Error ? e.message : String(e) };
    }

    let idToken: string;
    try {
      const res = await this.fetchImpl(d.token_endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          authorization: `Basic ${Buffer.from(
            `${this.config.clientId}:${this.config.clientSecret}`,
          ).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: p.code,
          redirect_uri: p.redirectUri,
          ...(p.codeVerifier ? { code_verifier: p.codeVerifier } : {}),
        }),
      });
      if (!res.ok) {
        // The body carries why, and "400" alone is not debuggable at a booth.
        const text = await res.text().catch(() => '');
        return {
          status: 'unavailable',
          reason: `token endpoint returned ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`,
        };
      }
      const body = (await res.json()) as { id_token?: string };
      if (!body.id_token) return { status: 'unavailable', reason: 'no id_token in the response' };
      idToken = body.id_token;
    } catch (e) {
      return { status: 'unavailable', reason: e instanceof Error ? e.message : String(e) };
    }

    // Verified against the issuer's published keys — not parsed and trusted.
    this.jwks ??= createRemoteJWKSet(new URL(d.jwks_uri));
    let claims: Record<string, unknown>;
    try {
      const { payload } = await jwtVerify(idToken, this.jwks, {
        issuer: d.issuer,
        audience: this.config.clientId,
      });
      claims = payload as Record<string, unknown>;

      /*
       * What the issuer actually said, minus who it said it about.
       *
       * The product's central claim is that a person proved they were present **at that
       * moment**. That is only true if `auth_time` reflects a real authentication rather than
       * a session being re-stamped, and `amr` is the claim that says which. Printing it is
       * the only way to find out, and `sub` is deliberately not printed — we do not keep it,
       * so we should not log it either.
       */
      console.log(
        '  identity claims:',
        JSON.stringify({
          acr: claims['acr'],
          amr: claims['amr'],
          auth_time: claims['auth_time'],
          iat: claims['iat'],
          age_seconds:
            typeof claims['auth_time'] === 'number' && typeof claims['iat'] === 'number'
              ? (claims['iat'] as number) - (claims['auth_time'] as number)
              : undefined,
        }),
      );
    } catch (e) {
      return { status: 'denied', reason: `token did not verify: ${e instanceof Error ? e.message : e}` };
    }

    if (claims['nonce'] !== p.nonce) {
      return { status: 'denied', reason: 'nonce did not match — this reply belongs to another request' };
    }

    const acr = typeof claims['acr'] === 'string' ? claims['acr'] : '';
    if (acr !== this.config.policy.requiredAcr) {
      return {
        status: 'denied',
        reason: `assurance level was "${acr || 'absent'}", not ${this.config.policy.requiredAcr}`,
      };
    }

    const authTimeRaw = claims['auth_time'];
    if (typeof authTimeRaw !== 'number') {
      return { status: 'denied', reason: 'no auth_time — cannot tell when they authenticated' };
    }
    const authTime = new Date(authTimeRaw * 1000);
    if (!isFresh(authTime, this.config.policy, now)) {
      return {
        status: 'expired',
        reason: `they authenticated ${Math.round(
          (now.getTime() - authTime.getTime()) / 1000,
        )}s ago; the limit is ${this.config.policy.maxAgeSeconds}s`,
      };
    }

    const amr = Array.isArray(claims['amr'])
      ? (claims['amr'] as unknown[]).map(String)
      : undefined;

    /*
     * If a deployment named the methods it accepts, honour it here rather than on the screen.
     *
     * The demo names none, because this issuer only ever answers `pop` — see `FreshnessPolicy`.
     */
    if (!methodAccepted(amr, this.config.policy)) {
      return {
        status: 'denied',
        reason: `authenticated by ${amr?.join(', ') ?? 'an unstated method'}, which this deployment does not accept`,
      };
    }

    return {
      status: 'verified',
      identity: {
        subject: String(claims['sub']),
        issuer: d.issuer,
        authTime,
        acr,
        ...(amr ? { amr } : {}),
      },
    };
  }
}
