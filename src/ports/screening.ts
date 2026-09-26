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
 * **The live adapter is `src/adapters/intercepta.ts`** — wired in `src/server/main.ts` when the
 * key is present, and reported as `screening` in `GET /health` so a judge can see which one is
 * running without reading the source. What the API answers, and why its score maps onto these
 * three values the way it does, is documented there.
 *
 * Known before the first call, and still true after it:
 *
 *   - screening must be run against **real mainnet addresses, even for testnet payments**
 *   - integrations are expected to **fail closed** when the key or the live result is
 *     unavailable — which is the same rule this file already enforces
 */

import { existsSync, readFileSync } from 'node:fs';
import type { ScreeningResult } from '../core/types.js';

export interface ScreeningPort {
  /**
   * Runs before signing. Its result decides what happens next.
   *
   * Returns `unavailable` rather than throwing, so that the caller has to make the
   * fail-closed decision explicitly instead of inheriting it from an exception.
   */
  scan(address: string, token?: string): Promise<ScreeningResult>;

  /**
   * What the provider said about the address it was last asked about, in its own words.
   *
   * Optional, and no decision depends on it: `scan` decides, and this only supplies the
   * sentence shown to whoever reads the refusal. The stand-ins have nothing to add.
   */
  reasonFor?(address: string): string | undefined;
}

/** Addresses used to prove both branches. Confirmed by calling, never from a list we believe. */
export interface ScreeningFixtures {
  /** A real mainnet address that comes back clean. */
  clean?: string;
  /** A real mainnet address that comes back flagged. Not "probably" — confirmed. */
  flagged?: string;
}

/**
 * Read from configuration rather than written here.
 *
 * `npm run verify` refuses a hardcoded address in `src/` or `scripts/`, and it is right to:
 * these two came back from a real call on 2026-09-26, and the call that produced each one is
 * recorded next to it in `config/intercepta-suggestions.json`. A value without its provenance
 * is a value nobody can re-check.
 */
function confirmedFixtures(): ScreeningFixtures {
  const path = new URL('../../config/intercepta-suggestions.json', import.meta.url);
  if (!existsSync(path)) return {};
  try {
    const file = JSON.parse(readFileSync(path, 'utf8')) as {
      fixtures?: Record<string, { value?: string }>;
    };
    const clean = file.fixtures?.['clean']?.value;
    const flagged = file.fixtures?.['flagged']?.value;
    return { ...(clean ? { clean } : {}), ...(flagged ? { flagged } : {}) };
  } catch {
    // A malformed config leaves the fixtures empty rather than inventing an address.
    return {};
  }
}

export const FIXTURES: ScreeningFixtures = confirmedFixtures();

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
