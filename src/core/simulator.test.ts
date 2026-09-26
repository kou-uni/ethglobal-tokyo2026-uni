/**
 * The simulator, and the reason this file exists at all.
 *
 * `npm test` did not catch a missing export, because nothing imported this module — so a
 * broken build passed 271 tests while `tsc` was failing. Importing it here closes that hole:
 * if `night.ts` stops exporting what the simulator needs, this file cannot even load.
 */
import { describe, expect, it } from 'vitest';
import { BUYERS, generateJobs, phrasing } from './simulator.js';
import { DEMO_POLICY, asQuestion } from './night.js';

describe('the buyers', () => {
  it('only ask about categories the policy actually knows', () => {
    const known = new Set([
      ...DEMO_POLICY.allow,
      ...DEMO_POLICY.forbid,
      ...DEMO_POLICY.sensitive,
      ...DEMO_POLICY.grants.map((g) => g.category),
    ]);
    for (const buyer of BUYERS) {
      for (const what of buyer.asks) {
        expect(known.has(what), `${buyer.who} asks for ${what}, which no rule mentions`).toBe(true);
      }
    }
  });

  it('covers more than one kind of work', () => {
    expect(new Set(BUYERS.map((b) => b.sector)).size).toBeGreaterThan(8);
  });
});

describe('generateJobs', () => {
  it('is the same night twice', () => {
    expect(generateJobs(5, 20, new Date(0))).toEqual(generateJobs(5, 20, new Date(0)));
  });

  it('is a different night on a different seed', () => {
    const a = generateJobs(5, 20, new Date(0)).map((j) => j.question).join();
    const b = generateJobs(6, 20, new Date(0)).map((j) => j.question).join();
    expect(a).not.toBe(b);
  });

  /** The whole point of it: a staged night must not read as one sentence repeated. */
  it('asks in many different ways', () => {
    const jobs = generateJobs(9, 52, new Date(0));
    expect(new Set(jobs.map((j) => j.question)).size).toBeGreaterThan(12);
    expect(new Set(jobs.map((j) => j.buyer.who)).size).toBeGreaterThan(5);
  });

  it('gives every request a deadline in the future and a positive price', () => {
    const now = new Date('2026-09-26T00:00:00Z');
    for (const { request } of generateJobs(3, 30, now)) {
      expect(new Date(request.deadline).getTime()).toBeGreaterThan(now.getTime());
      expect(request.price.amount).toBeGreaterThan(0);
    }
  });
});

describe('phrasing', () => {
  it('is stable for the same id and varies across ids', () => {
    const what = 'experience/why-you-put-it-back';
    expect(phrasing(what, 'a')).toBe(phrasing(what, 'a'));
    const seen = new Set(['a', 'b', 'c', 'd', 'e', 'f'].map((id) => phrasing(what, id)));
    expect(seen.size).toBeGreaterThan(1);
  });

  it('falls back to the single wording when a category has no variants', () => {
    expect(asQuestion('experience/why-you-put-it-back')).toBeTruthy();
    expect(asQuestion('nothing/we/know', 'x')).toBe('nothing/we/know');
  });
});
