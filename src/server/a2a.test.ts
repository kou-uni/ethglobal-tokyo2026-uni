import { afterEach, describe, it, expect, vi } from 'vitest';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { Server } from 'node:http';
import { createApp } from './app.js';
import { Store } from './state.js';
import { DEMO_POLICY, KNOWN_PARTIES, MORNING } from '../core/night.js';
import { MockScreening } from '../ports/screening.js';
import { MockIdentity } from '../ports/identity.js';

const payer = '0x' + 'a'.repeat(40);
const config = JSON.parse(readFileSync(new URL('../../config/a2a.json', import.meta.url), 'utf8'));
const servers: Server[] = [];
afterEach(async () => { for (const s of servers.splice(0)) { s.closeAllConnections(); await new Promise<void>(r => s.close(() => r())); } });
async function boot(journal?: string) {
  let time = MORNING.getTime();
  const store = new Store(KNOWN_PARTIES, undefined, journal);
  const settle = vi.fn(async () => ({ status: 'settled' as const, transaction: 'fixture-payment', network: 'eip155:0' }));
  const server = createApp({
    store, policy: DEMO_POLICY, screening: new MockScreening(), now: () => new Date(time),
    identity: new MockIdentity({ maxAgeSeconds: 120, requiredAcr: 'fixture' }),
    settlement: { live: true, settle,
      check: async () => ({ status: 'settled', transaction: '', network: 'eip155:0' }),
      quote: () => ({ scheme: 'exact', amount: '120', asset: payer, payTo: payer, network: 'eip155:0', maxTimeoutSeconds: 60 }),
    },
  });
  servers.push(server); await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const request = (what = DEMO_POLICY.allow[0]) => ({
    id: 'caller-id-is-not-a-task-id', who: KNOWN_PARTIES[0], what, purpose: 'demand-estimation',
    price: { amount: 120, currency: 'JPYC' }, payoutAddress: payer, deadline: new Date(time + 600000).toISOString(),
  });
  const payment = () => ({ x402Version: 2, payload: { signature: 'fixture', authorization: { from: payer, validBefore: String(time / 1000 + 10000) } } });
  const rpc = async (method: string, params: unknown, extension = true) => await (await fetch(base + '/a2a', {
    method: 'POST', headers: { 'content-type': 'application/json', ...(extension ? { 'X-A2A-Extensions': config.paymentExtension } : {}) },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })).json() as any;
  const message = (id: string, data?: unknown, taskId?: string) => ({
    kind: 'message', messageId: id, role: 'user', parts: data ? [{ kind: 'data', data }] : [{ kind: 'text', text: 'payment' }],
    ...(taskId ? { taskId } : {}),
  });
  return { base, store, settle, request, payment, rpc, message, advance: (ms: number) => { time += ms; } };
}
describe('A2A discovery and x402 transport over real HTTP intake', () => {
  it('publishes the implemented protocol, operations and required extension', async () => {
    const b = await boot();
    const card = await (await fetch(b.base + '/.well-known/agent-card.json')).json() as any;
    expect(card).toMatchObject({ protocolVersion: '0.3.0', url: b.base + '/a2a', preferredTransport: 'JSONRPC',
      capabilities: { streaming: false, pushNotifications: false, extensions: [{ uri: config.paymentExtension, required: true }] } });
    expect(card.skills[0].description).toContain('data part');
    expect((await b.rpc('message/send', { message: b.message('no-extension', b.request()) }, false)).error.code).toBe(-32003);
    expect(b.store.all()).toHaveLength(0);
  });
  it('quotes, accepts payment metadata on the same task, returns a receipt and prevents duplicate settlement', async () => {
    const b = await boot(), m = b.message('first', b.request());
    const quote = (await b.rpc('message/send', { message: m })).result;
    expect(quote.id).not.toBe('caller-id-is-not-a-task-id');
    expect(quote.status.state).toBe('input-required');
    expect(quote.status.message.metadata['x402.payment.required'].accepts[0].amount).toBe('120');
    const paid = { ...b.message('pay', undefined, quote.id), metadata: { 'x402.payment.payload': b.payment() } };
    const result = (await b.rpc('message/send', { message: paid })).result;
    expect(result.status.state).toBe('completed');
    expect(result.status.message.metadata['x402.payment.receipts']).toMatchObject([{ success: true, transaction: 'fixture-payment' }]);
    await b.rpc('message/send', { message: paid });
    await b.rpc('message/send', { message: m });
    expect(b.settle).toHaveBeenCalledOnce();
    expect((await b.rpc('tasks/get', { id: quote.id })).result.status.state).toBe('completed');
  });
  it('holds a checked payment until approval and exposes the same Store transition when polled', async () => {
    const b = await boot();
    const m = { ...b.message('held', b.request(DEMO_POLICY.sensitive[0])), metadata: { 'x402.payment.payload': b.payment() } };
    const held = (await b.rpc('message/send', { message: m })).result;
    expect(held.status.state).toBe('input-required');
    expect(held.status.message.metadata['x402.payment.status']).toBe('payment-verified');
    expect(b.settle).not.toHaveBeenCalled();
    const approval = await fetch(b.base + '/approvals/' + held.id, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ approve: true }),
    });
    expect(approval.status).toBe(200);
    const result = (await b.rpc('tasks/get', { id: held.id })).result;
    expect(result.status.state).toBe('completed'); expect(b.settle).toHaveBeenCalledOnce();
    expect(JSON.stringify(result)).not.toContain('signature');
  });
  it('reuses a completed task after restart when the same initial message is retried', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'yohaku-a2a-journal-')), file = join(dir, 'journal.json');
    try {
      const first = await boot(file);
      const message = { ...first.message('durable-message', first.request()), metadata: { 'x402.payment.payload': first.payment() } };
      const paid = (await first.rpc('message/send', { message })).result;
      expect(paid.status.state).toBe('completed');
      const restarted = await boot(file);
      const retry = (await restarted.rpc('message/send', { message })).result;
      expect(retry.id).toBe(paid.id); expect(retry.status.state).toBe('completed');
      expect(restarted.settle).not.toHaveBeenCalled();
      expect((await restarted.rpc('tasks/get', { id: paid.id })).result.contextId).toBe(paid.contextId);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it('rejects forbidden requests and expired held tasks without payment', async () => {
    const b = await boot();
    expect((await b.rpc('message/send', { message: b.message('deny', b.request(DEMO_POLICY.forbid[0])) })).result.status.state).toBe('rejected');
    const held = (await b.rpc('message/send', { message: b.message('held', b.request(DEMO_POLICY.sensitive[0])) })).result;
    b.advance(601000);
    expect((await b.rpc('tasks/get', { id: held.id })).result.status.state).toBe('rejected');
    expect(b.settle).not.toHaveBeenCalled();
  });
  it('does not let a continuation change the offer, context or target task', async () => {
    const b = await boot();
    const quote = (await b.rpc('message/send', { message: b.message('initial', b.request()) })).result;
    const changed = b.message('changed', b.request(DEMO_POLICY.sensitive[0]), quote.id);
    expect((await b.rpc('message/send', { message: changed })).error.code).toBe(-32602);
    expect((await b.rpc('message/send', { message: { ...b.message('context', undefined, quote.id), contextId: 'other' } })).error.code).toBe(-32602);
    expect((await b.rpc('message/send', { message: b.message('missing', undefined, 'missing') })).error.code).toBe(-32001);
    expect(b.store.get(quote.id)!.request.what).toBe(DEMO_POLICY.allow[0]);
    expect(b.settle).not.toHaveBeenCalled();
  });
  it('returns protocol errors for malformed data and unsupported operations', async () => {
    const b = await boot();
    expect((await b.rpc('message/stream', {})).error.code).toBe(-32601);
    expect((await b.rpc('message/send', { message: b.message('no-data') })).error.code).toBe(-32602);
    expect((await b.rpc('tasks/get', { id: 'missing' })).error.code).toBe(-32001);
    const malformed = await fetch(b.base + '/a2a', { method: 'POST', body: '{' });
    expect(await malformed.json()).toMatchObject({ jsonrpc: '2.0', error: { code: -32700 } });
    expect(b.store.all()).toHaveLength(0);
  });
});
