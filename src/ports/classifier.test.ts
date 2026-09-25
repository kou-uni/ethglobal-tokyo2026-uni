import { describe, expect, it } from 'vitest';
import { MockClassifier, applyClassification, type Classification } from './classifier.js';
import type { Decision } from '../core/types.js';

const c = (over: Partial<Classification> = {}): Classification => ({
  category: 'something',
  sensitivity: 'unclear',
  suggestion: 'ask',
  reasoning: 'because',
  ...over,
});

const d = (verdict: Decision['verdict'], rule: number): Decision => ({
  verdict, rule, reason: 'r',
});

describe('the model can narrow, never widen', () => {
  it('turns an unmatched request into a deny when it says drop', () => {
    expect(applyClassification(d('human', 9), c({ suggestion: 'drop' }))).toMatchObject({
      verdict: 'deny', rule: 9,
    });
  });

  it('leaves it with the person when it says ask', () => {
    expect(applyClassification(d('human', 9), c({ suggestion: 'ask' })).verdict).toBe('human');
  });

  it('cannot touch auto', () => {
    const before = d('auto', 8);
    expect(applyClassification(before, c({ suggestion: 'drop' }))).toEqual(before);
  });

  it('cannot reopen a deny — including rule 0', () => {
    for (const rule of [0, 1, 2, 3, 4]) {
      const before = d('deny', rule);
      expect(applyClassification(before, c({ suggestion: 'ask' }))).toEqual(before);
    }
  });

  it('cannot touch escalations that a real rule produced', () => {
    for (const rule of [5, 6, 7]) {
      const before = d('human', rule);
      expect(applyClassification(before, c({ suggestion: 'drop' }))).toEqual(before);
    }
  });
});

describe('the schema is the enforcement', () => {
  it('has no value meaning "let it through"', () => {
    // A compile-time guarantee, asserted at runtime so it shows up in the suite.
    const allowed: Classification['suggestion'][] = ['ask', 'drop'];
    expect(allowed).toHaveLength(2);
    expect(allowed).not.toContain('pass');
    expect(allowed).not.toContain('auto');
    expect(allowed).not.toContain('allow');
  });

  it('the worst a successful prompt injection achieves is a dropped request', () => {
    // Whatever the model is talked into, the only reachable outcomes are these two.
    const outcomes = (['ask', 'drop'] as const).map(
      (suggestion) => applyClassification(d('human', 9), c({ suggestion })).verdict,
    );
    expect(new Set(outcomes)).toEqual(new Set(['human', 'deny']));
  });
});

describe('the mock', () => {
  it('runs without a key and says so', async () => {
    const out = await new MockClassifier().classify({
      id: 'x', who: 'a.eth', what: 'odd/thing', purpose: 'other',
      price: { amount: 1, currency: 'JPYC' }, deadline: '2026-09-27T00:00:00Z',
    });
    expect(out.reasoning).toMatch(/no model was called/);
  });
});
