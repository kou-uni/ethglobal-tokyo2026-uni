import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { createApp } from './app.js';
import { Store } from './state.js';
import { DEMO_POLICY, KNOWN_PARTIES, MORNING } from '../core/night.js';
import { MockIdentity } from '../ports/identity.js';
import type { ScreeningResult } from '../core/types.js';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const payer = '0x' + 'a'.repeat(40);
const other = '0x' + 'b'.repeat(40);
const servers: Server[] = [];
afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>(r => server.close(() => r()));
  }
});
async function boot(journal?: string) {
  let clock = MORNING.getTime();
  const store = new Store(KNOWN_PARTIES, undefined, journal);
  const scan = vi.fn(async (_address: string): Promise<ScreeningResult> => 'clean');
  const settle = vi.fn(async () => ({ status: 'settled' as const, transaction: 'fixture-tx', network: 'eip155:0' }));
  const check = vi.fn(async () => ({ status: 'settled' as const, transaction: '', network: 'eip155:0' }));
  const server = createApp({
    policy: DEMO_POLICY, store, now: () => new Date(clock),
    screening: { scan }, screeningWired: true,
    identity: new MockIdentity({ requiredAcr: 'test', maxAgeSeconds: 120 }),
    settlement: { live: true, settle, check, quote: () => ({
      scheme: 'exact', network: 'eip155:0', amount: '120', asset: other, payTo: other, maxTimeoutSeconds: 60,
    }) },
  });
  servers.push(server);
  await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const request = (over: Record<string, unknown> = {}) => ({
    id: 'one', who: KNOWN_PARTIES[0], what: DEMO_POLICY.allow[0], purpose: 'demand-estimation',
    price: { amount: 120, currency: 'JPYC' }, deadline: new Date(clock + 600000).toISOString(),
    payoutAddress: payer, ...over,
  });
  const signed = (from: string | undefined = payer, nonce = 'first') => Buffer.from(JSON.stringify({
    x402Version: 2, payload: { signature: 'fixture', authorization: {
      from, nonce, validBefore: String(Math.floor(clock / 1000) + 10000),
    } },
  })).toString('base64');
  const post = (path: string, body: unknown, signature?: string) => fetch(base + path, {
    method: 'POST', headers: { 'content-type': 'application/json', ...(signature ? { 'PAYMENT-SIGNATURE': signature } : {}) },
    body: JSON.stringify(body),
  });
  return { base, store, scan, settle, check, request, signed, post, advance: (ms: number) => { clock += ms; } };
}

describe('request lifecycle at the payment boundary', () => {
  it('denies an expired request without calling settlement', async () => {
    const b = await boot();
    const r = await b.post('/requests', b.request({ deadline: new Date(MORNING.getTime() - 1).toISOString() }), b.signed());
    expect(r.status).toBe(410);
    expect(await r.json()).toMatchObject({ verdict: 'deny' });
    expect(b.settle).not.toHaveBeenCalled();
  });
  it.each([
    { deadline: 'not-a-date' }, { price: { amount: -1, currency: 'JPYC' } },
    { price: { amount: 120, currency: 'unknown' } }, { actingAs: 'delegate', writeTarget: 'admin' },
  ])('rejects malformed or unsupported request fields: %j', async over => {
    const b = await boot();
    expect((await b.post('/requests', b.request(over), b.signed())).status).toBe(400);
    expect(b.scan).not.toHaveBeenCalled(); expect(b.settle).not.toHaveBeenCalled();
  });
  it('checks the deadline again after screening waits', async () => {
    const b = await boot(), request = b.request();
    b.scan.mockImplementationOnce(async () => { b.advance(601000); return 'clean'; });
    const r = await b.post('/requests', request, b.signed());
    expect(r.status).toBe(410); expect(b.settle).not.toHaveBeenCalled();
  });
  it('returns the original success when one request is sent with two authorizations', async () => {
    const b = await boot(), request = b.request();
    const first = await (await b.post('/requests', request, b.signed())).json();
    const again = await (await b.post('/requests', request, b.signed(payer, 'second'))).json();
    expect(again).toEqual(first); expect(b.settle).toHaveBeenCalledOnce();
    expect(b.store.received()).toEqual([{ amount: 120, currency: 'JPYC' }]);
  });
  it('claims a request before awaiting the payment provider', async () => {
    const b = await boot(), request = b.request();
    let release!: () => void, entered!: () => void;
    const started = new Promise<void>(r => { entered = r; });
    b.settle.mockImplementationOnce(async () => {
      entered(); await new Promise<void>(r => { release = r; });
      return { status: 'settled', transaction: 'fixture-tx', network: 'eip155:0' };
    });
    const first = b.post('/requests', request, b.signed());
    await started;
    const second = await b.post('/requests', request, b.signed(payer, 'second'));
    release(); await first;
    expect(second.status).toBe(409); expect(b.settle).toHaveBeenCalledOnce();
  });
  it('never retries settlement after a provider throws with an unknown payment outcome', async () => {
    const b = await boot(), request = b.request();
    b.settle.mockRejectedValueOnce(new Error('connection lost after broadcast'));
    expect((await b.post('/requests', request, b.signed())).status).toBeGreaterThanOrEqual(500);
    const retry = await b.post('/requests', request, b.signed(payer, 'second'));
    expect(retry.status).toBe(503);
    expect(await retry.json()).toMatchObject({ settlement: 'unknown' });
    expect(b.settle).toHaveBeenCalledOnce();
  });
  it.each(['paid', 'uncertain', 'held-approved'] as const)('retains the %s payment result across a process restart without storing signatures', async mode => {
    const dir = mkdtempSync(join(tmpdir(), 'yohaku-journal-')), file = join(dir, 'requests.json');
    try {
      const first = await boot(file);
      const request = first.request(mode === 'held-approved' ? { what: DEMO_POLICY.sensitive[0] } : {});
      if (mode === 'uncertain') first.settle.mockRejectedValueOnce(new Error('lost outcome'));
      await first.post('/requests', request, first.signed());
      if (mode === 'held-approved') await first.post('/approvals/one', { approve: true });
      first.settle.mockClear();
      const restarted = await boot(file);
      const response = await restarted.post('/requests', request, restarted.signed(payer, 'new-after-restart'));
      expect(response.status).toBe(mode === 'uncertain' ? 503 : 200);
      expect(restarted.settle).not.toHaveBeenCalled();
      const saved = readFileSync(file, 'utf8');
      expect(saved).not.toContain('"auth"');
      expect(saved).not.toContain('"signature"');
      expect(saved).not.toContain('"demoBrowser"');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it('refuses changing the contents of an existing request ID', async () => {
    const b = await boot();
    await b.post('/requests', b.request());
    expect((await b.post('/requests', b.request({ what: DEMO_POLICY.sensitive[0] }), b.signed())).status).toBe(409);
    expect(b.store.get('one')?.request.what).toBe(DEMO_POLICY.allow[0]);
    expect(b.settle).not.toHaveBeenCalled();
  });
  it('keeps the original entry and authorization when a held request is retried', async () => {
    const b = await boot(), request = b.request({ what: DEMO_POLICY.sensitive[0] });
    await b.post('/requests', request, b.signed());
    const entry = b.store.get('one')!, auth = entry.auth;
    await b.post('/requests', request);
    expect(b.store.get('one')).toBe(entry); expect(entry.auth).toBe(auth);
    expect(b.check).toHaveBeenCalledOnce(); expect(b.settle).not.toHaveBeenCalled();
  });
});

describe('payment source is checked, not self-attested', () => {
  it('denies an unsigned request with no source when live screening is enabled', async () => {
    const b = await boot();
    const r = await b.post('/requests', b.request({ payoutAddress: undefined }));
    expect(await r.json()).toMatchObject({ verdict: 'deny', rule: 4 });
    expect(b.settle).not.toHaveBeenCalled();
  });
  it('screens the signed payer when the request omits a declared source', async () => {
    const b = await boot();
    const r = await b.post('/requests', b.request({ payoutAddress: undefined }), b.signed());
    expect(r.status).toBe(200); expect(b.scan).toHaveBeenCalledWith(payer);
    expect(b.settle).toHaveBeenCalledOnce();
  });
  it('cannot use a different clean declaration to cover the signed payer', async () => {
    const b = await boot();
    const r = await b.post('/requests', b.request(), b.signed(other));
    expect(await r.json()).toMatchObject({ verdict: 'deny', rule: 4 });
    expect(b.settle).not.toHaveBeenCalled();
  });
  it('checks the source again before settling a held approval', async () => {
    const b = await boot();
    await b.post('/requests', b.request({ what: DEMO_POLICY.sensitive[0] }), b.signed());
    b.scan.mockResolvedValue('flagged');
    const r = await b.post('/approvals/one', { approve: true });
    expect(await r.json()).toMatchObject({ settlement: { settled: false } });
    expect(b.settle).not.toHaveBeenCalled();
  });
  it('keeps different reasons for the same rule visible on the refusal page', async () => {
    const b = await boot();
    b.scan.mockResolvedValueOnce('flagged');
    const flagged = await (await b.post('/requests', b.request({ id: 'flagged' }))).json() as { reason: string };
    b.scan.mockResolvedValueOnce('unavailable');
    const unavailable = await (await b.post('/requests', b.request({ id: 'unavailable' }))).json() as { reason: string };
    const html = await (await fetch(b.base + '/dropped')).text();
    expect(html).toContain(flagged.reason); expect(html).toContain(unavailable.reason);
  });
});
