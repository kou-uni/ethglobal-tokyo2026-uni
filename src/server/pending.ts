/**
 * Yohaku — the short-lived state of one verification.
 *
 * A verification round-trip leaves the process: she goes to the issuer, comes back with a
 * code, and we have to know which approval that reply belongs to. `state` links the two and
 * `nonce` makes a replayed reply useless.
 *
 * Deliberately short-lived. If an approval is still pending when the window closes, it did
 * not happen — the same rule as everywhere else in this system.
 */

import { randomBytes } from 'node:crypto';

export interface Pending {
  requestId: string;
  nonce: string;
  /** PKCE: kept here, sent only at token exchange, never in the browser redirect. */
  codeVerifier: string;
  startedAt: number;
}

export class PendingVerifications {
  private map = new Map<string, Pending>();

  constructor(private readonly ttlMs = 10 * 60 * 1000) {}

  begin(requestId: string): { state: string; nonce: string; codeVerifier: string } {
    const state = randomBytes(16).toString('hex');
    const nonce = randomBytes(16).toString('hex');
    // RFC 7636: 43-128 chars of unreserved characters. 32 random bytes, base64url.
    const codeVerifier = randomBytes(32).toString('base64url');
    this.map.set(state, { requestId, nonce, codeVerifier, startedAt: Date.now() });
    return { state, nonce, codeVerifier };
  }

  /** One use only. A state that comes back twice is not a second chance. */
  take(state: string, now = Date.now()): Pending | undefined {
    const p = this.map.get(state);
    if (!p) return undefined;
    this.map.delete(state);
    if (now - p.startedAt > this.ttlMs) return undefined;
    return p;
  }

  get size(): number {
    return this.map.size;
  }
}
