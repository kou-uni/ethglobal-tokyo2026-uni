/**
 * Yohaku — World ID for Agents, over OIDC.
 *
 * Nothing about the provider is written down here except the issuer, which comes from the
 * environment. Endpoints, signing keys and the supported assurance levels are all read from
 * the issuer's own discovery document at run time.
 *
 * The freshness requirement is enforced twice on purpose:
 *
 *   - **asking**: `max_age` on the authorization request tells the issuer to re-authenticate
 *     rather than reuse a session
 *   - **checking**: `auth_time` on the returned token is compared against the clock here
 *
 * Asking alone would be trusting the issuer to have honoured a parameter. Checking alone
 * would let a stale session through. Both together is what makes "she proved it just now"
 * something a judge can verify instead of take on faith.
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';
import type {
  FreshnessPolicy,
  IdentityPort,
  VerificationOutcome,
} from '../ports/identity.js';
import { isFresh } from '../ports/identity.js';

interface Discovery {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  acr_values_supported?: string[];
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

  async beginUrl(p: { state: string; nonce: string; redirectUri: string }): Promise<string> {
    const d = await this.discover();
    const url = new URL(d.authorization_endpoint);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', this.config.clientId);
    url.searchParams.set('redirect_uri', p.redirectUri);
    url.searchParams.set('scope', 'openid');
    url.searchParams.set('state', p.state);
    url.searchParams.set('nonce', p.nonce);
    // Re-authenticate rather than reuse a session: this is the "at the moment" part.
    url.searchParams.set('max_age', String(this.config.policy.maxAgeSeconds));
    url.searchParams.set('acr_values', this.config.policy.requiredAcr);
    return url.toString();
  }

  async complete(p: {
    code?: string;
    error?: string;
    redirectUri: string;
    nonce: string;
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
        }),
      });
      if (!res.ok) {
        return { status: 'unavailable', reason: `token endpoint returned ${res.status}` };
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

    return {
      status: 'verified',
      identity: {
        subject: String(claims['sub']),
        issuer: d.issuer,
        authTime,
        acr,
      },
    };
  }
}
