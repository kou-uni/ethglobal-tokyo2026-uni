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
  startedAt: number;
}

export class PendingVerifications {
  private map = new Map<string, Pending>();

  constructor(private readonly ttlMs = 10 * 60 * 1000) {}

  begin(requestId: string): { state: string; nonce: string } {
    const state = randomBytes(16).toString('hex');
    const nonce = randomBytes(16).toString('hex');
    this.map.set(state, { requestId, nonce, startedAt: Date.now() });
    return { state, nonce };
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
