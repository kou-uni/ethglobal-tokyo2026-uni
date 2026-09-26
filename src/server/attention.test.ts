import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AttentionBudget } from './attention.js';
import { Store } from './state.js';
import { DEMO_POLICY, MORNING } from '../core/night.js';
import type { HeldRequest } from '../core/types.js';

const held = (id: string, category = id): HeldRequest => ({
  request: { id, who: 'fixture', what: category, purpose: 'demand-estimation',
    price: { amount: 100, currency: 'JPYC' }, deadline: new Date(MORNING.getTime() + 3 * 86400000).toISOString() },
  decision: { verdict: 'human', rule: 9, reason: 'unknown category' }, heldAt: MORNING.toISOString(),
});
describe('daily attention budget', () => {
  it('waits for the notification hour then shows at most the daily cap', () => {
    const budget = new AttentionBudget(), early = new Date(MORNING);
    early.setHours(DEMO_POLICY.notifyHour - 1);
    const queue = ['a', 'b', 'c'].map(id => held(id));
    expect(budget.surface(queue, DEMO_POLICY, early).surfaced).toHaveLength(0);
    expect(budget.surface(queue, DEMO_POLICY, MORNING).surfaced).toHaveLength(2);
    expect(budget.surface(queue, DEMO_POLICY, MORNING).surfaced).toHaveLength(2);
  });
  it('answering one invitation does not free a slot for another on the same day', () => {
    const budget = new AttentionBudget();
    budget.surface([held('a'), held('b')], DEMO_POLICY, MORNING);
    const result = budget.surface([held('b'), held('c')], DEMO_POLICY, MORNING);
    expect(result.surfaced.flatMap(b => b.requests.map(h => h.request.id))).toEqual(['b']);
    expect(result.deferred).toHaveLength(1);
  });
  it('new requests in an already shown category still consume a new invitation', () => {
    const budget = new AttentionBudget(), policy = { ...DEMO_POLICY, dailyCap: 1 };
    budget.surface([held('a', 'same')], policy, MORNING);
    expect(budget.surface([held('a', 'same'), held('b', 'same')], policy, MORNING).deferred).toHaveLength(1);
  });
  it('renews the allowance on the next day', () => {
    const budget = new AttentionBudget();
    budget.surface([held('a'), held('b')], DEMO_POLICY, MORNING);
    expect(budget.surface([held('c')], DEMO_POLICY, new Date(MORNING.getTime() + 86400000)).surfaced).toHaveLength(1);
  });
  it('retains the daily budget across a restart and refuses corrupted state', () => {
    const dir = mkdtempSync(join(tmpdir(), 'yohaku-attention-')), file = join(dir, 'state.json');
    try {
      new AttentionBudget(file).surface([held('a'), held('b')], DEMO_POLICY, MORNING);
      expect(new AttentionBudget(file).surface([held('c')], DEMO_POLICY, MORNING).surfaced).toHaveLength(0);
      writeFileSync(file, '{"broken":true}');
      expect(() => new AttentionBudget(file)).toThrow();
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it('resolves expired requests once, so a refresh cannot train repeated ignored answers', () => {
    const store = new Store(), h = held('expired');
    h.request.deadline = MORNING.toISOString();
    store.add({ request: h.request, decision: h.decision, receivedAt: h.heldAt });
    expect(store.surface(DEMO_POLICY, MORNING).expired).toHaveLength(1);
    expect(store.surface(DEMO_POLICY, MORNING).expired).toHaveLength(0);
    expect(store.history()).toHaveLength(1);
    expect(store.get('expired')).toMatchObject({ resolution: 'expired', decision: { verdict: 'deny' } });
  });
  it('keeps visitor demos out of the configured owner’s attention budget', () => {
    const store = new Store();
    for (const id of ['visitor-a', 'visitor-b', 'ordinary']) {
      const h = held(id);
      store.add({ request: h.request, decision: h.decision, receivedAt: h.heldAt,
        ...(id.startsWith('visitor') ? { demoBrowser: id } : {}) });
    }
    const result = store.surface(DEMO_POLICY, MORNING);
    expect(result.surfaced.flatMap(b => b.requests.map(h => h.request.id))).toEqual(['ordinary']);
  });
});
