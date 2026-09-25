import { describe, expect, it } from 'vitest';
import {
  APPROVALS_TO_LEARN,
  REFUSALS_TO_MUTE,
  applyLearned,
  learn,
  rejectionRate,
  type DecisionRecord,
} from './decisions.js';
import { defaultAnswerer, runWeek } from './week.js';
import type { AgentRequest, Decision } from './types.js';

const rec = (
  who: string,
  what: string,
  outcome: DecisionRecord['outcome'],
): DecisionRecord => ({ who, what, outcome, decidedAt: 'day-1', escalatedBy: 5 });

const req = (who: string, what: string): AgentRequest => ({
  id: 'x', who, what, purpose: 'market-research',
  price: { amount: 100, currency: 'JPYC' },
  deadline: '2026-09-27T00:00:00Z',
});

const held: Decision = { verdict: 'human', rule: 5, reason: 'sensitive' };

describe('learning only ever removes work', () => {
  it('stops asking after enough consistent approvals', () => {
    const l = learn(Array.from({ length: APPROVALS_TO_LEARN }, () => rec('a.eth', 'x', 'approved')));
    expect(applyLearned(req('a.eth', 'x'), held, l).verdict).toBe('auto');
  });

  it('does not learn from fewer', () => {
    const l = learn(Array.from({ length: APPROVALS_TO_LEARN - 1 }, () => rec('a.eth', 'x', 'approved')));
    expect(applyLearned(req('a.eth', 'x'), held, l).verdict).toBe('human');
  });

  it('a single refusal cancels learning for that pair, however many approvals', () => {
    const l = learn([
      ...Array.from({ length: 10 }, () => rec('a.eth', 'x', 'approved')),
      rec('a.eth', 'x', 'refused'),
    ]);
    expect(applyLearned(req('a.eth', 'x'), held, l).verdict).toBe('human');
  });

  it('mutes a counterparty she keeps refusing', () => {
    const l = learn(Array.from({ length: REFUSALS_TO_MUTE }, (_, i) => rec('spam.eth', `c${i}`, 'refused')));
    expect(applyLearned(req('spam.eth', 'anything'), held, l).verdict).toBe('deny');
  });

  it('being ignored teaches nothing in either direction', () => {
    const l = learn(Array.from({ length: 10 }, () => rec('a.eth', 'x', 'ignored')));
    expect(applyLearned(req('a.eth', 'x'), held, l).verdict).toBe('human');
    expect(l.mutedParties.size).toBe(0);
  });

  it('never overturns a deny, and never touches rule 0', () => {
    const l = learn(Array.from({ length: 10 }, () => rec('a.eth', 'x', 'approved')));
    const denied: Decision = { verdict: 'deny', rule: 0, reason: 'delegate overreach' };
    expect(applyLearned(req('a.eth', 'x'), denied, l)).toEqual(denied);
  });

  it('never widens auto into a category she refused', () => {
    const l = learn([
      ...Array.from({ length: 5 }, () => rec('a.eth', 'ok', 'approved')),
      ...Array.from({ length: 5 }, () => rec('a.eth', 'no', 'refused')),
    ]);
    expect(applyLearned(req('a.eth', 'ok'), held, l).verdict).toBe('auto');
    expect(applyLearned(req('a.eth', 'no'), held, l).verdict).toBe('deny'); // muted by refusals
  });
});

describe('what only the platform can see', () => {
  it('reports a rejection rate per counterparty', () => {
    const r = rejectionRate(
      [rec('a.eth', 'x', 'refused'), rec('a.eth', 'y', 'refused'), rec('a.eth', 'z', 'approved')],
      'a.eth',
    );
    expect(r).toEqual({ asked: 3, refused: 2, rate: 0.67 });
  });

  it('says nothing about a counterparty nobody has judged', () => {
    expect(rejectionRate([], 'nobody.eth')).toBeUndefined();
  });

  it('ignores the ones she never answered', () => {
    expect(rejectionRate([rec('a.eth', 'x', 'ignored')], 'a.eth')).toBeUndefined();
  });
});

describe('a month — what actually moves, and what does not', () => {
  const { days } = runWeek({
    seeds: Array.from({ length: 30 }, (_, i) => 101 + i),
    answerer: defaultAnswerer,
  });

  it('runs thirty nights', () => {
    expect(days).toHaveLength(30);
  });

  it('never exceeds her daily cap on any day', () => {
    for (const d of days) expect(d.surfaced).toBeLessThanOrEqual(2);
  });

  it('holds the number she sees steady for the first two weeks — the cap binds first', () => {
    const wk1 = days.slice(0, 7).reduce((s, d) => s + d.surfaced, 0) / 7;
    const wk2 = days.slice(7, 14).reduce((s, d) => s + d.surfaced, 0) / 7;
    expect(wk1).toBeCloseTo(2, 1);
    expect(wk2).toBeCloseTo(2, 1);
  });

  it('spares her more and more — that is the part that moves from day one', () => {
    const wk1 = days.slice(0, 7).reduce((s, d) => s + d.learnedAway, 0) / 7;
    const wk4 = days.slice(21, 30).reduce((s, d) => s + d.learnedAway, 0) / 9;
    expect(wk1).toBeLessThan(1);
    expect(wk4).toBeGreaterThan(4);
  });

  it('eventually the mornings themselves get quieter', () => {
    const wk4 = days.slice(21, 30).reduce((s, d) => s + d.surfaced, 0) / 9;
    expect(wk4).toBeLessThan(1.5);
  });

  it('learns nothing on the first night — she has decided nothing yet', () => {
    expect(days[0]!.learnedAway).toBe(0);
  });
});
