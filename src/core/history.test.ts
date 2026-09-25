import { describe, expect, it } from 'vitest';
import { DEMO_POLICY } from './night.js';
import { pastNights, replayNight, seedFor } from './history.js';

const NIGHT = new Date('2026-09-26T02:00:00+09:00');

describe('replayNight', () => {
  it('splits a night into exactly the requests it generated', () => {
    const n = replayNight(NIGHT);
    expect(n.auto + n.deny + n.human).toBe(n.arrived);
  });

  it('is deterministic for a given night', () => {
    expect(replayNight(NIGHT)).toEqual(replayNight(new Date(NIGHT)));
  });

  it('gives different nights different traffic', () => {
    const a = replayNight(NIGHT);
    const b = replayNight(new Date(NIGHT.getTime() - 86_400_000));
    expect(seedFor(NIGHT)).not.toBe(seedFor(new Date(NIGHT.getTime() - 86_400_000)));
    expect([a.arrived, a.auto, a.deny]).not.toEqual([b.arrived, b.auto, b.deny]);
  });

  it('only counts money against requests that settled without her', () => {
    const n = replayNight(NIGHT);
    expect(n.settled).toBeGreaterThan(0);
    if (n.auto === 0) expect(n.settled).toBe(0);
  });
});

describe('pastNights', () => {
  it('excludes today — today comes from the live store', () => {
    const today = NIGHT.toISOString().slice(0, 10);
    expect(pastNights(NIGHT).map((n) => n.date)).not.toContain(today);
  });

  it('is ordered most recent first', () => {
    const dates = pastNights(NIGHT, 4).map((n) => n.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  /**
   * The claim the fold makes on screen. If a rule change ever lets a third notification
   * through, this fails here rather than in front of a judge.
   */
  it('never asks her about more than her cap, on any night', () => {
    for (const n of pastNights(NIGHT, 14)) {
      expect(n.asked).toBeLessThanOrEqual(DEMO_POLICY.dailyCap);
    }
  });

  it('varies what arrives while holding what reaches her at the cap', () => {
    const nights = pastNights(NIGHT, 14);
    expect(new Set(nights.map((n) => n.arrived)).size).toBeGreaterThan(1);
    expect(new Set(nights.map((n) => n.asked))).toEqual(new Set([DEMO_POLICY.dailyCap]));
  });
});
