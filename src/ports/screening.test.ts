import { describe, expect, it } from 'vitest';
import { FIXTURES, MockScreening, UnavailableScreening, mayMoveMoney } from './screening.js';
import { route } from '../core/rules.js';
import { DEMO_POLICY, FLAGGED_ADDRESS, NIGHT, demoContext } from '../core/night.js';
import type { AgentRequest, ScreeningResult } from '../core/types.js';

const req = (payoutAddress: string): AgentRequest => ({
  id: 's', who: 'market-research.acme.eth', what: 'experience/why-you-put-it-back',
  purpose: 'market-research', price: { amount: 100, currency: 'JPYC' },
  deadline: '2026-09-27T00:00:00Z', payoutAddress,
});

describe('only clean moves money', () => {
  it.each<[ScreeningResult, boolean]>([
    ['clean', true],
    ['flagged', false],
    ['unavailable', false],
  ])('%s → %s', (result, allowed) => {
    expect(mayMoveMoney(result)).toBe(allowed);
  });
});

describe('the port', () => {
  it('flags the sentinel and clears everything else', async () => {
    const s = new MockScreening();
    expect(await s.scan(FLAGGED_ADDRESS)).toBe('flagged');
    expect(await s.scan('0x' + '1'.repeat(40))).toBe('clean');
  });

  it('reports unavailable instead of throwing, so the caller must decide', async () => {
    await expect(new UnavailableScreening().scan('0x0')).resolves.toBe('unavailable');
  });
});

describe('rule 4 stops the payment while the grant stays valid', () => {
  it('denies a flagged payer even though nothing else is wrong', () => {
    const d = route(req(FLAGGED_ADDRESS), DEMO_POLICY, demoContext(NIGHT));
    expect(d).toMatchObject({ verdict: 'deny', rule: 4 });
    expect(d.reason).toMatch(/screening/);
  });

  it('denies when screening is unavailable — we do not settle unchecked', () => {
    const ctx = { ...demoContext(NIGHT), screen: (): ScreeningResult => 'unavailable' };
    expect(route(req('0x' + '1'.repeat(40)), DEMO_POLICY, ctx)).toMatchObject({
      verdict: 'deny', rule: 4,
    });
  });

  it('lets a clean payer through on the same request', () => {
    expect(route(req('0x' + '1'.repeat(40)), DEMO_POLICY, demoContext(NIGHT)).verdict).not.toBe('deny');
  });
});

describe('fixtures', () => {
  /**
   * These were empty until the API answered. They are filled now, and they are filled from
   * `config/intercepta-suggestions.json`, where each one is recorded next to the call that
   * confirmed it — not from a list of addresses we merely believe are risky.
   */
  it('are two different real mainnet addresses, confirmed by a call', () => {
    expect(FIXTURES.clean).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(FIXTURES.flagged).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(FIXTURES.clean).not.toBe(FIXTURES.flagged);
  });
});

describe('what the refusal says', () => {
  /** The rule is ours. The finding is the provider's, quoted rather than paraphrased. */
  it('carries the provider’s own words into the reason', () => {
    const ctx = {
      ...demoContext(NIGHT),
      screeningReason: () => 'sanction_address — The address is officially listed as sanctioned.',
    };
    const d = route(req(FLAGGED_ADDRESS), DEMO_POLICY, ctx);
    expect(d).toMatchObject({ verdict: 'deny', rule: 4 });
    expect(d.reason).toContain('officially listed as sanctioned');
  });

  it('refuses just as firmly when there is nothing to quote', () => {
    const ctx = { ...demoContext(NIGHT), screeningReason: () => undefined };
    expect(route(req(FLAGGED_ADDRESS), DEMO_POLICY, ctx)).toMatchObject({
      verdict: 'deny', rule: 4, reason: 'the payment source failed screening',
    });
  });
});
