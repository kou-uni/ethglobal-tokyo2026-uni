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
  /**
   * Which authentication methods count, if we insist on any.
   *
   * **Added because the answer was not what we assumed.** Sending both `prompt=login` and
   * `max_age=0`, the sandbox issuer returned `amr: ["pop"]` with an `auth_time` stamped a
   * second earlier: a session presenting a key it already held, not a person approving
   * anything in an app. `auth_time` being fresh therefore does **not** mean somebody was
   * asked — so if a deployment needs an actual re-authentication, it has to say which method
   * counts, and this is where.
   *
   * Left unset in the demo, because setting it would refuse every login this issuer issues.
   * **The screen says what actually happened instead of hiding it.**
   */
  acceptedAmr?: string[];
}

/** What we learn when someone completes a verification. */
export interface Verified {
  /** Pairwise subject — stable for us, and useless to anyone else. */
  subject: string;
  issuer: string;
  /** When the issuer says the authentication happened. */
  authTime: Date;
  acr: string;
  /**
   * How they were authenticated, as the issuer describes it.
   *
   * `pop` means proof of possession — a held credential was presented. That is a real and
   * useful thing, but **it is not a person approving a prompt**, and the two must not be
   * described with the same sentence.
   */
  amr?: string[];
}

export type VerificationOutcome =
  | { status: 'verified'; identity: Verified }
  | { status: 'denied'; reason: string }
  | { status: 'expired'; reason: string }
  | { status: 'unavailable'; reason: string };

export interface IdentityPort {
  /** Where to send the person, asking for a *fresh* verification. */
  beginUrl(params: {
    state: string;
    nonce: string;
    redirectUri: string;
    /** PKCE verifier; the challenge derived from it goes in the URL. */
    codeVerifier?: string;
  }): Promise<string>;
  /** Turn what came back into an outcome. Never throws for a normal refusal. */
  complete(params: {
    code?: string;
    error?: string;
    redirectUri: string;
    nonce: string;
    codeVerifier?: string;
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
/**
 * Did the authentication use a method this deployment accepts?
 *
 * Unset means "any" — and that is a deliberate default, not an oversight: refusing `pop`
 * today would refuse every login this issuer produces. What the product must not do is
 * *claim* more than `pop` supports, which is a wording problem, not a policy one.
 */
export function methodAccepted(amr: string[] | undefined, policy: FreshnessPolicy): boolean {
  if (!policy.acceptedAmr?.length) return true;
  if (!amr?.length) return false;
  return amr.some((m) => policy.acceptedAmr!.includes(m));
}

/**
 * Was a held credential presented, rather than a person re-authenticating?
 *
 * Used by the screen, not by the gate. The distinction is worth showing even when it is not
 * worth refusing.
 */
export function isPossessionOnly(amr: string[] | undefined): boolean {
  return Boolean(amr?.length) && amr!.every((m) => m === 'pop');
}

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
