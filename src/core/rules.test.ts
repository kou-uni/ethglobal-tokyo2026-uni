import { describe, expect, it } from 'vitest';
import { onFailure, route } from './rules.js';
import type { AgentRequest, Policy, RoutingContext } from './types.js';

const NOW = new Date('2026-09-26T02:00:00+09:00');

const policy = (over: Partial<Policy> = {}): Policy => ({
  owner: 'alice.yohaku.eth',
  allow: ['experience/why-you-put-it-back', 'experience/first-five-minutes'],
  forbid: ['experience/who-you-live-with'],
  sensitive: ['experience/why-you-stopped'],
  amountThreshold: 1000,
  dailyCap: 2,
  notifyHour: 7,
  grants: [
    { category: 'experience/why-you-put-it-back', expiresAt: '2026-12-31T00:00:00Z', revoked: false },
    { category: 'experience/first-five-minutes', expiresAt: '2026-12-31T00:00:00Z', revoked: false },
  ],
  ...over,
});

const req = (over: Partial<AgentRequest> = {}): AgentRequest => ({
  id: 'req-1',
  who: 'market-research-agent.acme.eth',
  what: 'experience/why-you-put-it-back',
  purpose: 'demand-estimation',
  price: { amount: 0.5, currency: 'JPYC' },
  deadline: '2026-09-26T14:00:00+09:00',
  payoutAddress: '0xclean',
  ...over,
});

const ctx = (over: Partial<RoutingContext> = {}): RoutingContext => ({
  now: NOW,
  seenBefore: () => true,
  screen: () => 'clean',
  ...over,
});

describe('rule 0 — the delegate may propose, not widen', () => {
  it('accepts a proposal from a delegate', () => {
    const d = route(req({ actingAs: 'delegate', writeTarget: 'proposal' }), policy(), ctx());
    expect(d.verdict).not.toBe('deny');
  });

  it('denies a delegate writing a permission key', () => {
    const d = route(req({ actingAs: 'delegate', writeTarget: 'permission' }), policy(), ctx());
    expect(d).toMatchObject({ verdict: 'deny', rule: 0 });
  });

  it('denies a delegate changing the payout address', () => {
    const d = route(req({ actingAs: 'delegate', writeTarget: 'payout' }), policy(), ctx());
    expect(d).toMatchObject({ verdict: 'deny', rule: 0 });
  });

  it('stops even proposals once delegation is revoked', () => {
    const d = route(
      req({ actingAs: 'delegate', writeTarget: 'proposal' }),
      policy(),
      ctx({ delegationRevoked: true }),
    );
    expect(d).toMatchObject({ verdict: 'deny', rule: 0 });
  });

  it('does not apply rule 0 to a buyer', () => {
    const d = route(req({ actingAs: 'buyer' }), policy(), ctx());
    expect(d.rule).not.toBe(0);
  });
});

describe('rules 1–4 — deny', () => {
  it('1: revoked grant', () => {
    const p = policy({
      grants: [
        { category: 'experience/why-you-put-it-back', expiresAt: '2026-12-31T00:00:00Z', revoked: true },
      ],
    });
    expect(route(req(), p, ctx())).toMatchObject({ verdict: 'deny', rule: 1 });
  });

  it('2: forbidden category', () => {
    const d = route(req({ what: 'experience/who-you-live-with' }), policy(), ctx());
    expect(d).toMatchObject({ verdict: 'deny', rule: 2 });
  });

  it('3: expired grant', () => {
    const p = policy({
      grants: [
        { category: 'experience/why-you-put-it-back', expiresAt: '2025-01-01T00:00:00Z', revoked: false },
      ],
    });
    expect(route(req(), p, ctx())).toMatchObject({ verdict: 'deny', rule: 3 });
  });

  it('4: flagged payment source', () => {
    const d = route(req(), policy(), ctx({ screen: () => 'flagged' }));
    expect(d).toMatchObject({ verdict: 'deny', rule: 4 });
  });

  it('4: screening unavailable is NOT a pass', () => {
    const d = route(req(), policy(), ctx({ screen: () => 'unavailable' }));
    expect(d).toMatchObject({ verdict: 'deny', rule: 4 });
  });
});

describe('rules 5–7, 9 — human', () => {
  it('5: sensitive domain, even when cheap', () => {
    const d = route(
      req({ what: 'experience/why-you-stopped', price: { amount: 0.1, currency: 'JPYC' } }),
      policy(),
      ctx(),
    );
    expect(d).toMatchObject({ verdict: 'human', rule: 5 });
  });

  it('6: above the threshold', () => {
    const d = route(req({ price: { amount: 5000, currency: 'JPYC' } }), policy(), ctx());
    expect(d).toMatchObject({ verdict: 'human', rule: 6 });
  });

  it('7: first time from this counterparty', () => {
    const d = route(req(), policy(), ctx({ seenBefore: () => false }));
    expect(d).toMatchObject({ verdict: 'human', rule: 7 });
  });

  it('9: nothing matched falls to human, never auto', () => {
    const d = route(req({ what: 'something/unheard-of' }), policy(), ctx());
    expect(d).toMatchObject({ verdict: 'human', rule: 9 });
  });
});

describe('rule 8 — auto', () => {
  it('passes a known counterparty inside a standing grant', () => {
    expect(route(req(), policy(), ctx())).toMatchObject({ verdict: 'auto', rule: 8 });
  });

  it('does not pass an allowed category with no grant behind it', () => {
    const p = policy({ grants: [] });
    expect(route(req(), p, ctx()).verdict).toBe('human');
  });
});

describe('ordering — the first match decides', () => {
  it('a forbidden category is denied even when the amount is tiny and the party is known', () => {
    const d = route(
      req({ what: 'experience/who-you-live-with', price: { amount: 0.01, currency: 'JPYC' } }),
      policy(),
      ctx(),
    );
    expect(d.rule).toBe(2);
  });

  it('rule 0 beats everything, including a perfectly ordinary request', () => {
    const d = route(
      req({ actingAs: 'delegate', writeTarget: 'permission' }),
      policy(),
      ctx(),
    );
    expect(d.rule).toBe(0);
  });

  it('a sensitive domain is asked about, not denied, when nothing earlier fired', () => {
    const d = route(req({ what: 'experience/why-you-stopped' }), policy(), ctx());
    expect(d.verdict).toBe('human');
  });

  it('every decision carries the rule that produced it', () => {
    const d = route(req(), policy(), ctx());
    expect(typeof d.rule).toBe('number');
    expect(d.reason.length).toBeGreaterThan(0);
  });
});

describe('failure — every path falls to deny', () => {
  it.each([
    'routing-engine-down',
    'screening-unavailable',
    'identity-check-failed',
    'deadline-passed',
  ] as const)('%s → deny', (kind) => {
    expect(onFailure(kind).verdict).toBe('deny');
  });
});
