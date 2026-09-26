import { describe, expect, it } from 'vitest';
import { NoSettlement, outlivesDeadline, validBeforeOf } from './settlement.js';

const REQ = {
  scheme: 'exact',
  network: 'eip155:0',
  amount: '1',
  asset: '0x0',
  payTo: '0x0',
  maxTimeoutSeconds: 60,
};

const authorized = (validBefore: number) => ({
  payload: { authorization: { validBefore: String(validBefore) } },
});

describe('validBeforeOf', () => {
  it('reads the expiry out of an x402 payload', () => {
    expect(validBeforeOf(authorized(1_800_000_000))).toBe(1_800_000_000);
  });

  it('treats anything it cannot read as already expired', () => {
    for (const bad of [undefined, null, {}, { payload: {} }, { payload: { authorization: {} } }]) {
      expect(validBeforeOf(bad)).toBe(0);
    }
  });
});

/**
 * The property the whole settlement design rests on.
 *
 * If an authorization would expire before the request's deadline, queueing it means telling
 * an agent it is waiting on a payment that could never complete. Worse, it would let a
 * request sit past the point where "she approved it" could still move money.
 */
describe('outlivesDeadline', () => {
  const deadline = '2026-09-27T00:00:00.000Z';
  const atDeadline = Math.floor(new Date(deadline).getTime() / 1000);

  it('accepts an authorization that lasts exactly as long as the deadline', () => {
    expect(outlivesDeadline(authorized(atDeadline), deadline)).toBe(true);
  });

  it('accepts one that lasts longer', () => {
    expect(outlivesDeadline(authorized(atDeadline + 3600), deadline)).toBe(true);
  });

  it('refuses one that expires first, even by a second', () => {
    expect(outlivesDeadline(authorized(atDeadline - 1), deadline)).toBe(false);
  });

  /**
   * Found by running the real agent against the real facilitator.
   *
   * A deadline that is not a whole second used to refuse an authorization that matched it
   * exactly, because the agent could only express whole seconds and floored. Comparing in
   * seconds is the only comparison EIP-3009 can actually support.
   */
  it('does not punish a deadline that falls mid-second', () => {
    const odd = '2026-09-27T00:00:00.500Z';
    const secs = Math.ceil(new Date(odd).getTime() / 1000);
    expect(outlivesDeadline(authorized(secs), odd)).toBe(true);
    expect(outlivesDeadline(authorized(secs - 1), odd)).toBe(false);
  });

  it('refuses a payload with no authorization at all', () => {
    expect(outlivesDeadline({}, deadline)).toBe(false);
  });
});

describe('NoSettlement', () => {
  it('is not live, and says so rather than being absent', () => {
    expect(new NoSettlement(REQ).live).toBe(false);
  });

  /**
   * Both calls refuse. There is no configuration of this class that returns `settled`, which
   * is what makes "settlement: false" in `GET /health` a statement about the code and not
   * about today's environment.
   */
  it('refuses both checking and settling', async () => {
    const s = new NoSettlement(REQ);
    for (const r of [await s.check(), await s.settle()]) {
      expect(r.status).toBe('refused');
      expect(r).not.toHaveProperty('transaction');
    }
  });
});
