import { expect, it } from 'vitest';
import { Store, type Entry } from './state.js';

it('counts actual settlements, excluding approved offers with no payment', () => {
  const store = new Store();
  const entry: Entry = {
    request: { id: 'paid', who: 'agent', what: 'experience/test', purpose: 'market-research',
      price: { amount: 120, currency: 'JPYC' }, deadline: '2026-09-27T00:00:00Z' },
    decision: { verdict: 'human', rule: 5, reason: 'needs approval' },
    receivedAt: '2026-09-26T00:00:00Z', resolution: 'approved', settlement: 'test-tx',
  };
  store.add(entry);
  store.add({ ...entry, request: { ...entry.request, id: 'unpaid', price: { amount: 4200, currency: 'JPYC' } }, settlement: 'not-wired' });
  store.add({ request: { ...entry.request, id: 'waiting' }, decision: entry.decision, receivedAt: entry.receivedAt });
  expect(store.received()).toEqual([{ amount: 120, currency: 'JPYC' }]);
});
