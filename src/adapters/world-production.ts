/** Isolated real-identity probe. Never logs tokens, subjects, or endpoint error bodies. */
import { createHash } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

export interface ProductionWorldConfig {
  issuer: string; requiredAcr: string; clientId: string; clientSecret: string; redirectUri: string;
}
export interface ProbeAttempt { nonce: string; verifier: string; startedAt: number }
export interface ProbeResult { authTime: string; acr: string; amr: string[] }
export interface ProductionIdentity {
  begin(state: string, attempt: ProbeAttempt): Promise<string>;
  complete(code: string, attempt: ProbeAttempt, now: number): Promise<ProbeResult>;
}
interface Discovery { issuer: string; authorization_endpoint: string; token_endpoint: string; jwks_uri: string }
const formEncoded = (value: string) => new URLSearchParams({ v: value }).toString().slice(2);

export class ProductionWorldIdentity implements ProductionIdentity {
  private discovery?: Discovery;
  private key?: JWTVerifyGetKey;
  constructor(
    private readonly config: ProductionWorldConfig,
    private readonly fetchImpl: typeof fetch = fetch,
    testKey?: JWTVerifyGetKey,
  ) { if (testKey) this.key = testKey; }

  private async discover() {
    if (this.discovery) return this.discovery;
    const response = await this.fetchImpl(`${this.config.issuer}/.well-known/openid-configuration`, {
      signal: AbortSignal.timeout(10000), redirect: 'error',
    });
    if (!response.ok) throw new Error('World discovery unavailable');
    const d = await response.json() as Discovery;
    if (d.issuer !== this.config.issuer) throw new Error('World issuer mismatch');
    for (const endpoint of [d.authorization_endpoint, d.token_endpoint, d.jwks_uri]) {
      const u = new URL(endpoint);
      if (u.origin !== this.config.issuer || u.protocol !== 'https:' || u.username || u.password) {
        throw new Error('Unexpected World endpoint');
      }
    }
    this.key ??= createRemoteJWKSet(new URL(d.jwks_uri), { timeoutDuration: 10000 });
    return this.discovery = d;
  }

  async begin(state: string, attempt: ProbeAttempt) {
    const d = await this.discover();
    const url = new URL(d.authorization_endpoint);
    const values = {
      client_id: this.config.clientId, redirect_uri: this.config.redirectUri,
      response_type: 'code', scope: 'openid', state, nonce: attempt.nonce,
      code_challenge: createHash('sha256').update(attempt.verifier).digest('base64url'),
      code_challenge_method: 'S256', max_age: '0', prompt: 'login', acr_values: this.config.requiredAcr,
    };
    for (const [key, value] of Object.entries(values)) url.searchParams.set(key, value);
    return url.toString();
  }

  async complete(code: string, attempt: ProbeAttempt, now: number): Promise<ProbeResult> {
    const d = await this.discover();
    const response = await this.fetchImpl(d.token_endpoint, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000),
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        authorization: `Basic ${Buffer.from(`${formEncoded(this.config.clientId)}:${formEncoded(this.config.clientSecret)}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code', code, redirect_uri: this.config.redirectUri,
        code_verifier: attempt.verifier,
      }),
    });
    if (!response.ok) throw new Error('World code exchange failed');
    const body = await response.json() as { id_token?: string };
    if (!body.id_token) throw new Error('World returned no ID token');
    const { payload } = await jwtVerify(body.id_token, this.key!, {
      issuer: this.config.issuer, audience: this.config.clientId, algorithms: ['RS256'],
      currentDate: new Date(now),
      requiredClaims: ['sub', 'exp', 'iat', 'nonce', 'auth_time', 'acr', 'amr'],
    });
    if (!payload.sub?.trim() || payload.nonce !== attempt.nonce || payload.acr !== this.config.requiredAcr) {
      throw new Error('World proof does not match this attempt');
    }
    const authTime = payload.auth_time;
    if (typeof authTime !== 'number' || !Number.isSafeInteger(authTime)
      || authTime < Math.floor(attempt.startedAt / 1000)
      || authTime > Math.floor(now / 1000) || now / 1000 - authTime > 120) {
      throw new Error('World proof is not fresh for this attempt');
    }
    if (!Array.isArray(payload.amr) || !payload.amr.length || payload.amr.some((v) => typeof v !== 'string')) {
      throw new Error('World authentication method missing');
    }
    // pop is the documented World method, including fresh proof. It does not imply MFA.
    // Deliberately discard sub and the token: this probe creates no user account or grant.
    return { authTime: new Date(authTime * 1000).toISOString(), acr: String(payload.acr), amr: payload.amr as string[] };
  }
}
