/**
 * The fee ledger, as a starting point.
 *
 * ⚠️ **Nothing is wired to this yet, and nothing has ever been redeemed.** These pin the two
 * properties that must survive whoever finishes it: the charge is per decision rather than a
 * share of the money, and the summary never lets a growing number imply a payout.
 */
import { describe, expect, it } from 'vitest';
import { FeeLedger, feesFromEnv } from './fees.js';

const POLICY = { perDecision: 1, redeemAbove: 10, payTo: '0xfee' };

describe('what is charged for', () => {
  it('charges the same for an expensive decision as a cheap one', () => {
    const l = new FeeLedger(POLICY);
    l.record('cheap', 'now');
    l.record('expensive', 'now');
    expect(new Set(l.all().map((v) => v.amount)).size).toBe(1);
  });

  /**
   * The incentive this exists to remove: a share of the money would grow when we escalate an
   * expensive request to a person. Per decision, it cannot.
   */
  it('does not grow with the size of the payment', () => {
    const l = new FeeLedger(POLICY);
    for (const id of ['a', 'b', 'c']) l.record(id, 'now');
    expect(l.accrued()).toBe(3 * POLICY.perDecision);
  });

  it('charges for a refusal too — the work was the same', () => {
    const l = new FeeLedger(POLICY);
    l.record('denied', 'now');
    expect(l.all()).toHaveLength(1);
  });
});

describe('the summary never implies a payout', () => {
  it('says plainly that nothing has been broadcast', () => {
    const s = new FeeLedger(POLICY).summary();
    expect(s.redeemed).toMatch(/nothing has been broadcast/);
  });

  it('holds below the threshold, because redeeming would cost more than it collects', () => {
    const l = new FeeLedger(POLICY);
    for (let i = 0; i < 9; i++) l.record(`v${i}`, 'now');
    expect(l.summary().worthRedeeming).toBe(false);
    l.record('v9', 'now');
    expect(l.summary().worthRedeeming).toBe(true);
  });
});

describe('authorizations', () => {
  it('separates the vouchers an agent actually signed for', () => {
    const l = new FeeLedger(POLICY);
    l.record('signed', 'now', { payload: {} });
    l.record('unsigned', 'now');
    expect(l.authorized().map((v) => v.requestId)).toEqual(['signed']);
  });
});

describe('feesFromEnv', () => {
  it('stays off until someone says where the fee would go', () => {
    expect(feesFromEnv({} as NodeJS.ProcessEnv)).toBeUndefined();
    expect(feesFromEnv({ YOHAKU_FEE_ADDRESS: '0xa' } as NodeJS.ProcessEnv)).toMatchObject({ payTo: '0xa' });
  });
});
