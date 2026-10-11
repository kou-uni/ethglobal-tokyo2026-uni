import { describe, expect, it } from 'vitest';
import { serverPolicy } from './policy.js';
import { DEMO_POLICY } from '../core/night.js';

describe('configured server owner', () => {
  it('keeps the demo defaults without ENS configuration', () => {
    expect(serverPolicy()).toEqual(DEMO_POLICY);
  });
  it('uses the normalized registered name without changing routing rules', () => {
    expect(serverPolicy('  Yohaku-Minta-2026.eth ')).toEqual({
      ...DEMO_POLICY, owner: 'yohaku-minta-2026.eth',
    });
    expect(DEMO_POLICY.owner).toBe('alice.yohaku.eth');
  });
  it('refuses an invalid configured name', () => {
    expect(() => serverPolicy('bad..eth')).toThrow();
    expect(() => serverPolicy('example.com')).toThrow();
  });

  it('keeps the demo defaults when the attention settings are absent or blank', () => {
    expect(serverPolicy()).toEqual(DEMO_POLICY);
    expect(serverPolicy(undefined, {})).toEqual(DEMO_POLICY);
    expect(serverPolicy(undefined, { dailyCap: '', notifyHour: '' })).toEqual(DEMO_POLICY);
  });

  it('applies the configured cap and notify hour', () => {
    expect(serverPolicy(undefined, { dailyCap: '3', notifyHour: '9' })).toEqual({
      ...DEMO_POLICY, dailyCap: 3, notifyHour: 9,
    });
  });

  // Two hosts keep two attention files, so the same owner would be interrupted twice over.
  // The host that is not an entry point says so with 0 instead of relying on convention.
  it('lets a host declare it is not an entry point for the owner', () => {
    expect(serverPolicy('yohaku-minta-2026.eth', { dailyCap: '0' })).toEqual({
      ...DEMO_POLICY, owner: 'yohaku-minta-2026.eth', dailyCap: 0,
    });
  });

  it('refuses values it cannot read rather than silently muting the owner', () => {
    for (const bad of ['-1', '1.5', 'two', '2x']) {
      expect(() => serverPolicy(undefined, { dailyCap: bad })).toThrow();
    }
    // The hour is a clock position, so out-of-range is a mistake, not a big number.
    for (const bad of ['-1', '24', '7.5', 'noon']) {
      expect(() => serverPolicy(undefined, { notifyHour: bad })).toThrow();
    }
  });
});
