/**
 * The checker has to be alive.
 *
 * On 2026-09-26 `scripts/verify.ts` was truncated to zero bytes by a careless in-place
 * rewrite — `open(path,'w')` truncates before the inner `read()` runs — and for three hours
 * `npm run check` passed while checking nothing. **An empty script exits 0.** Every "10
 * claims verified" reported in that window was worth nothing, and nothing in the output
 * said so.
 *
 * So the guard is not "remember not to do that". These assert that the file still contains a
 * checker, and `npm run check` runs them.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SOURCE = readFileSync('scripts/verify.ts', 'utf8');

/** Raised deliberately: lowering it is the same mistake in a slower form. */
const MINIMUM_CLAIMS = 10;

describe('the claim checker is not empty', () => {
  it('has source at all', () => {
    expect(SOURCE.length).toBeGreaterThan(2000);
  });

  it('still makes at least as many claims as the documents rely on', () => {
    const calls = SOURCE.match(/\bcheck\(/g) ?? [];
    expect(calls.length).toBeGreaterThanOrEqual(MINIMUM_CLAIMS);
  });

  it('still refuses hardcoded model ids, endpoints and addresses', () => {
    expect(SOURCE).toContain('model id');
    expect(SOURCE).toContain('api endpoint');
    expect(SOURCE).toContain('contract address');
  });

  it('still reports how many claims it checked', () => {
    expect(SOURCE).toContain('claims checked against the running code');
  });

  /**
   * The specific shape that killed it: a silent exit with nothing printed.
   * If the file is empty, every assertion above fails — which is the point.
   */
  it('cannot pass by being absent', () => {
    expect(SOURCE.trim()).not.toBe('');
  });
});
