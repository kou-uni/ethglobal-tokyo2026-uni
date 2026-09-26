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
});
