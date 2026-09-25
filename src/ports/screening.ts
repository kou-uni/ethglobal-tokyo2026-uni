/**
 * Yohaku — the screening port (rule 4).
 *
 * Rule 4 is the one deny that is not about permission. The grant is valid, the category is
 * allowed, the amount is fine — and the payment still does not go, because of where the
 * money would come from. That separation is the point: **a licence and a payment are
 * different layers, and one can fail while the other holds.**
 *
 * The prize requires this to be real: *"At least one live call… runs before a payment is
 * signed and its result decides what happens next"*, and *"Mocked or hard-coded responses
 * don't qualify"*. So the mock below exists for tests and for the console — **never for the
 * submission**.
 *
 * ⚠️ **Unconfirmed until the key arrives** (requested 2026-09-26, delivered by email within
 * hours). Endpoint path, auth header and response shape are NOT written here, because we
 * have not called them. What is known from public material:
 *
 *   - the operation is referred to as a **Quick Scan**
 *   - screening must be run against **real mainnet addresses, even for testnet payments**
 *   - integrations are expected to **fail closed** when the key or the live result is
 *     unavailable — which is the same rule this file already enforces
 *
 * First thing to do when the key lands, before writing any client:
 *
 *   1. one `clean` address and one `flagged` address, confirmed by actually calling it
 *   2. `curl` both and keep the raw responses in the PR
 *   3. only then map the response onto `ScreeningResult`
 */

import type { ScreeningResult } from '../core/types.js';

export interface ScreeningPort {
  /**
   * Runs before signing. Its result decides what happens next.
   *
   * Returns `unavailable` rather than throwing, so that the caller has to make the
   * fail-closed decision explicitly instead of inheriting it from an exception.
   */
  scan(address: string, token?: string): Promise<ScreeningResult>;
}

/** Addresses used to prove both branches. Filled in once the API has actually answered. */
export interface ScreeningFixtures {
  /** A real mainnet address that comes back clean. */
  clean?: string;
  /** A real mainnet address that comes back flagged. Not "probably" — confirmed. */
  flagged?: string;
}

export const FIXTURES: ScreeningFixtures = {
  // clean:   '0x…',   ← fill from a real call
  // flagged: '0x…',   ← fill from a real call, never from a list we merely believe
};

/**
 * Stand-in for tests and the console.
 *
 * Deliberately blunt: a single sentinel address is flagged and everything else is clean.
 * It is not trying to look like the real service, because anything that looked convincing
 * here would make it easy to forget which one is running.
 */
export class MockScreening implements ScreeningPort {
  constructor(private readonly flagged: Set<string> = new Set(['0xSANCTIONED_FIXTURE'])) {}

  async scan(address: string): Promise<ScreeningResult> {
    return this.flagged.has(address) ? 'flagged' : 'clean';
  }
}

/** Simulates the API being down, so the fail-closed path can be tested on purpose. */
export class UnavailableScreening implements ScreeningPort {
  async scan(_address: string, _token?: string): Promise<ScreeningResult> {
    return 'unavailable';
  }
}

/**
 * The decision this port exists to force.
 *
 * `clean` passes. Everything else stops. There is no third behaviour, and no configuration
 * that turns `unavailable` into a pass — if we cannot check, we do not move money.
 */
export function mayMoveMoney(result: ScreeningResult): boolean {
  return result === 'clean';
}
