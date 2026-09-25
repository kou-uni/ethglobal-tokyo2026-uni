/**
 * Yohaku — proving a person is there, at the moment it matters.
 *
 * The owner approves one request in the morning. **The verification happens then** — not at
 * signup, not last week. That distinction is the whole reason this port exists, and it is
 * checkable rather than asserted: an OIDC id_token carries `auth_time`, so "she proved it
 * just now" is a comparison, not a claim.
 *
 * Three things are checked, and a failure in any of them means the protected action does
 * not happen:
 *
 *   1. the token verifies against the issuer's JWKS       — it is genuinely from them
 *   2. `acr` is the proof-of-personhood level we asked for — a person, not an account
 *   3. `auth_time` is inside the freshness window          — now, not previously
 *
 * Endpoint URLs are never written down here. They are read from the issuer's OIDC discovery
 * document at run time, because a URL copied into source is a guess with a shelf life.
 */

export interface FreshnessPolicy {
  /** How recently the person must have authenticated, in seconds. */
  maxAgeSeconds: number;
  /** The assurance level that means "a verified person". */
  requiredAcr: string;
}

/** What we learn when someone completes a verification. */
export interface Verified {
  /** Pairwise subject — stable for us, and useless to anyone else. */
  subject: string;
  issuer: string;
  /** When the person actually authenticated. */
  authTime: Date;
  acr: string;
}

export type VerificationOutcome =
  | { status: 'verified'; identity: Verified }
  | { status: 'denied'; reason: string }
  | { status: 'expired'; reason: string }
  | { status: 'unavailable'; reason: string };

export interface IdentityPort {
  /** Where to send the person, asking for a *fresh* verification. */
  beginUrl(params: { state: string; nonce: string; redirectUri: string }): Promise<string>;
  /** Turn what came back into an outcome. Never throws for a normal refusal. */
  complete(params: {
    code?: string;
    error?: string;
    redirectUri: string;
    nonce: string;
    at?: Date;
  }): Promise<VerificationOutcome>;
}

/**
 * Only a verified person lets the protected action run.
 *
 * `denied`, `expired` and `unavailable` are all the same to the caller: nothing happens.
 * Written as one function so there is a single place where that is true.
 */
export function mayProceed(outcome: VerificationOutcome): boolean {
  return outcome.status === 'verified';
}

/** Is this verification recent enough to stand for "she is here right now"? */
export function isFresh(authTime: Date, policy: FreshnessPolicy, now: Date): boolean {
  const age = (now.getTime() - authTime.getTime()) / 1000;
  return age >= 0 && age <= policy.maxAgeSeconds;
}

/**
 * In-memory stand-in with the same outcomes, so the whole approval flow runs offline.
 * It refuses in exactly the cases the real one refuses.
 */
export class MockIdentity implements IdentityPort {
  constructor(
    private readonly policy: FreshnessPolicy,
    private readonly behaviour: 'verified' | 'denied' | 'stale' = 'verified',
  ) {}

  async beginUrl(p: { state: string; nonce: string; redirectUri: string }): Promise<string> {
    return `mock://verify?state=${p.state}&nonce=${p.nonce}`;
  }

  async complete(p: { error?: string; at?: Date }): Promise<VerificationOutcome> {
    const now = p.at ?? new Date();
    if (p.error) return { status: 'denied', reason: p.error };
    if (this.behaviour === 'denied') return { status: 'denied', reason: 'the person declined' };
    if (this.behaviour === 'stale') {
      return { status: 'expired', reason: 'the last verification was too long ago' };
    }
    return {
      status: 'verified',
      identity: {
        subject: 'mock-pairwise-subject',
        issuer: 'mock',
        authTime: now,
        acr: this.policy.requiredAcr,
      },
    };
  }
}
