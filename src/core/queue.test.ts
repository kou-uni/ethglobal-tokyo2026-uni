import { describe, expect, it } from 'vitest';
import { bundle, isNotificationHour, onDeadline, rank, surface } from './queue.js';
import type { HeldRequest, Policy } from './types.js';

const NOW = new Date('2026-09-26T07:00:00+09:00');

const policy: Policy = {
  owner: 'alice.yohaku.eth',
  allow: [],
  forbid: [],
  sensitive: [],
  amountThreshold: 1000,
  dailyCap: 3,
  notifyHour: 7,
  grants: [],
};

const held = (
  id: string,
  what: string,
  amount: number,
  deadline: string,
): HeldRequest => ({
  request: {
    id,
    who: `${id}.agent.eth`,
    what,
    purpose: 'market-research',
    price: { amount, currency: 'JPYC' },
    deadline,
  },
  decision: { verdict: 'human', rule: 5, reason: 'sensitive' },
  heldAt: '2026-09-26T02:00:00+09:00',
});

describe('bundle — three companies asking the same thing is one notification', () => {
  it('groups by category', () => {
    const out = bundle([
      held('a', 'experience/why-you-stopped', 2000, '2026-09-26T20:00:00+09:00'),
      held('b', 'experience/why-you-stopped', 1500, '2026-09-26T18:00:00+09:00'),
      held('c', 'corpus/your-own-words', 800, '2026-09-26T22:00:00+09:00'),
    ]);
    expect(out).toHaveLength(2);
    const health = out.find((b) => b.category === 'experience/why-you-stopped')!;
    expect(health.requests).toHaveLength(2);
    expect(health.topValue).toBe(2000);
    expect(health.nextDeadline).toBe('2026-09-26T18:00:00+09:00');
  });
});

describe('rank — value, pulled forward by urgency', () => {
  it('puts the more valuable bundle first when deadlines are similar', () => {
    const out = rank(
      bundle([
        held('a', 'x', 100, '2026-09-26T20:00:00+09:00'),
        held('b', 'y', 5000, '2026-09-26T20:00:00+09:00'),
      ]),
      NOW,
    );
    expect(out[0]!.category).toBe('y');
  });

  it('pulls an expiring bundle forward', () => {
    const out = rank(
      bundle([
        held('a', 'x', 1000, '2026-09-27T20:00:00+09:00'),
        held('b', 'y', 900, '2026-09-26T07:20:00+09:00'),
      ]),
      NOW,
    );
    expect(out[0]!.category).toBe('y');
  });
});

describe('surface — the daily cap is the owner’s, not ours', () => {
  it('shows at most dailyCap bundles and defers the rest', () => {
    const out = surface(
      [
        held('a', 'c1', 100, '2026-09-27T00:00:00+09:00'),
        held('b', 'c2', 200, '2026-09-27T00:00:00+09:00'),
        held('c', 'c3', 300, '2026-09-27T00:00:00+09:00'),
        held('d', 'c4', 400, '2026-09-27T00:00:00+09:00'),
      ],
      policy,
      NOW,
    );
    expect(out.surfaced).toHaveLength(3);
    expect(out.deferred).toHaveLength(1);
    expect(out.surfaced.map((b) => b.category)).not.toContain('c1');
  });

  it('takes expired requests out before ranking — they are denied, not shown', () => {
    const out = surface(
      [
        held('old', 'c1', 9999, '2026-09-26T06:00:00+09:00'),
        held('new', 'c2', 100, '2026-09-27T00:00:00+09:00'),
      ],
      policy,
      NOW,
    );
    expect(out.expired.map((h) => h.request.id)).toEqual(['old']);
    expect(out.surfaced.map((b) => b.category)).toEqual(['c2']);
  });

  it('a cap of zero means nothing reaches the person', () => {
    const out = surface(
      [held('a', 'c1', 100, '2026-09-27T00:00:00+09:00')],
      { ...policy, dailyCap: 0 },
      NOW,
    );
    expect(out.surfaced).toHaveLength(0);
    expect(out.deferred).toHaveLength(1);
  });
});

describe('silence', () => {
  it('is never consent', () => {
    expect(onDeadline().verdict).toBe('deny');
  });

  it('notification hour is the owner’s setting', () => {
    expect(isNotificationHour(policy, new Date('2026-09-26T07:30:00+09:00'))).toBe(true);
    expect(isNotificationHour(policy, new Date('2026-09-26T02:00:00+09:00'))).toBe(false);
  });
});
