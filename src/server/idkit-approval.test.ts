import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { createApp } from './app.js';
import { Store } from './state.js';
import { DEMO_POLICY, KNOWN_PARTIES } from '../core/night.js';
import { MockScreening } from '../ports/screening.js';
import { MockIdentity } from '../ports/identity.js';
import type { IdkitApprovalOptions } from './idkit-approval.js';
import { idkitApprovalFromEnv } from './idkit-config.js';

const servers: Server[] = [];
afterEach(async () => { for (const s of servers.splice(0)) await new Promise<void>(r => s.close(() => r())); });
async function boot() {
  let time = Date.now();
  const store = new Store(KNOWN_PARTIES);
  const verify = vi.fn(async () => ({
    verified: true, environment: 'production', protocolVersion: '3.0' as const, credential: 'orb',
    checkedAt: new Date(time).toISOString(),
  }));
  const settle = vi.fn(async () => ({ status: 'settled' as const, transaction: 'test-transaction', network: 'test' }));
  const options: IdkitApprovalOptions = {
    origin: 'http://127.0.0.1:0', appId: 'app_test', action: 'demo-approval',
    sign: () => ({ rp_id: 'rp_test', nonce: '0x123', signature: '0xabc', created_at: Math.floor(time / 1000), expires_at: Math.floor(time / 1000) + 120 }),
    verify,
    assets: { page: readFileSync(new URL('../../setup/idkit-approval.html', import.meta.url), 'utf8'), js: new Uint8Array(), wasm: new Uint8Array() },
  };
  const server = createApp({
    policy: DEMO_POLICY, store, screening: new MockScreening(), idkitDemo: options,
    identity: new MockIdentity({ maxAgeSeconds: 120, requiredAcr: 'mock' }),
    settlement: { live: true, settle, check: settle, quote: () => { throw new Error('unused'); } },
    now: () => new Date(time),
  });
  servers.push(server);
  await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
  options.origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const base = options.origin;
  const post = (path: string, body: unknown, cookie = '', origin = base) => fetch(base + path, {
    method: 'POST', headers: { origin, cookie, 'content-type': 'application/json' },
    body: JSON.stringify(body), redirect: 'manual',
  });
  async function visit() {
    const r = await fetch(base + '/try', { method: 'POST', headers: { origin: base }, body: 'go=skip', redirect: 'manual' });
    const cookie = r.headers.get('set-cookie')!.split(';')[0]!;
    const id = r.headers.get('location')!.split('/').at(-1)!;
    // A prevalidated held authorization; fake facilitator counts settlement attempts.
    const entry = store.get(id)!;
    entry.auth = { payload: { signature: 'fake' }, validBefore: Math.floor(time / 1000) + 600,
      requirement: { scheme: 'exact', network: 'test', amount: '1', asset: 'test', payTo: 'test', maxTimeoutSeconds: 60 } };
    const page = await fetch(base + '/world-approval?id=' + id, { headers: { cookie } });
    const text = await page.text();
    const snapshot = text.match(/id="snapshot" value="([^"]+)"/)![1]!;
    return { id, cookie, snapshot };
  }
  const challenge = (v: Awaited<ReturnType<typeof visit>>) => post('/world-approval/challenge', { requestId: v.id, snapshot: v.snapshot }, v.cookie);
  return { base, post, visit, challenge, store, settle, verify, advance: (ms: number) => { time += ms; } };
}

describe('IDKit visitor approval boundaries', () => {
  it('lets two visitors independently approve their own requests; replays cannot settle twice', async () => {
    const b = await boot();
    let completed = 0;
    for (const v of [await b.visit(), await b.visit()]) {
      const c = await (await b.challenge(v)).json() as { id: string };
      expect(b.settle).toHaveBeenCalledTimes(completed);
      const result = await b.post('/world-approval/verify', { id: c.id, proof: {} }, v.cookie);
      expect(result.status).toBe(200);
      expect(((await result.json()) as { verdict: string }).verdict).toBe('approved');
      expect((await b.post('/world-approval/verify', { id: c.id, proof: {} }, v.cookie)).status).toBe(400);
      completed++;
    }
    expect(b.settle).toHaveBeenCalledTimes(2);
  });
  it('requires the originating browser for viewing, starting, verifying and declining', async () => {
    const b = await boot(), a = await b.visit(), other = await b.visit();
    expect((await fetch(b.base + '/world-approval?id=' + a.id, { headers: { cookie: other.cookie } })).status).toBe(409);
    expect((await b.post('/world-approval/challenge', { requestId: a.id, snapshot: a.snapshot }, other.cookie)).status).toBe(409);
    const c = await (await b.challenge(a)).json() as { id: string };
    expect((await b.post('/world-approval/verify', { id: c.id, proof: {} }, other.cookie)).status).toBe(400);
    expect((await b.post(`/approve/${a.id}/decline`, {}, other.cookie)).status).toBe(403);
    expect(b.verify).not.toHaveBeenCalled(); expect(b.settle).not.toHaveBeenCalled();
  });
  it('blocks cross-origin starts and verifies', async () => {
    const b = await boot(), v = await b.visit();
    expect((await b.post('/try', {}, '', 'https://other.example')).status).toBe(403);
    expect((await b.post('/world-approval/challenge', { requestId: v.id, snapshot: v.snapshot }, v.cookie, 'https://other.example')).status).toBe(403);
    const c = await (await b.challenge(v)).json() as { id: string };
    expect((await b.post('/world-approval/verify', { id: c.id }, v.cookie, 'https://other.example')).status).toBe(403);
    expect(b.verify).not.toHaveBeenCalled();
  });
  it('blocks legacy mock/OIDC and raw-code approval bypasses', async () => {
    const b = await boot(), v = await b.visit();
    expect((await b.post('/approvals/' + v.id, { approve: true }, v.cookie)).status).toBe(403);
    expect((await fetch(b.base + '/auth/world/callback?code=fake')).status).toBe(403);
    expect(b.settle).not.toHaveBeenCalled();
  });
  it('cannot approve ordinary agent requests without a visitor capability', async () => {
    const b = await boot(), v = await b.visit();
    delete b.store.get(v.id)!.demoBrowser;
    expect((await b.challenge(v)).status).toBe(409);
    expect(b.settle).not.toHaveBeenCalled();
  });
  it.each(['changed', 'declined', 'expired', 'replaced', 'failed'] as const)('does not settle when %s during verification', async mode => {
    const b = await boot(), v = await b.visit();
    const c = await (await b.challenge(v)).json() as { id: string };
    b.verify.mockImplementationOnce(async () => {
      const e = b.store.get(v.id)!;
      if (mode === 'changed') e.request.price.amount++;
      if (mode === 'declined') e.resolution = 'ignored';
      if (mode === 'expired') b.advance(121000);
      if (mode === 'replaced') b.store.add({ ...e });
      if (mode === 'failed') throw new Error('World unavailable');
      return { verified: true, environment: 'production', protocolVersion: '3.0' as const, credential: 'orb', checkedAt: new Date().toISOString() };
    });
    expect((await b.post('/world-approval/verify', { id: c.id, proof: {} }, v.cookie)).status).toBeGreaterThanOrEqual(400);
    expect(b.settle).not.toHaveBeenCalled();
  });
  it('rejects a stale displayed offer before asking for a proof', async () => {
    const b = await boot(), v = await b.visit();
    b.store.get(v.id)!.auth!.requirement.payTo = 'changed';
    expect((await b.challenge(v)).status).toBe(409);
    expect(b.verify).not.toHaveBeenCalled();
  });
  it('cancel consumes the challenge without approving the request', async () => {
    const b = await boot(), v = await b.visit();
    const c = await (await b.challenge(v)).json() as { id: string };
    expect((await b.post('/world-approval/cancel', { id: c.id }, v.cookie)).status).toBe(200);
    expect((await b.post('/world-approval/verify', { id: c.id, proof: {} }, v.cookie)).status).toBe(400);
    expect(b.store.get(v.id)!.resolution).toBeUndefined();
    expect(b.settle).not.toHaveBeenCalled();
  });
  it('concurrent proofs for the same request settle at most once', async () => {
    const b = await boot(), v = await b.visit();
    const a = await (await b.challenge(v)).json() as { id: string };
    let release!: () => void, started!: () => void;
    const waiting = new Promise<void>(r => { started = r; });
    b.verify.mockImplementationOnce(async () => {
      started(); await new Promise<void>(r => { release = r; });
      return { verified: true, environment: 'production', protocolVersion: '3.0' as const, credential: 'orb', checkedAt: new Date().toISOString() };
    });
    const first = b.post('/world-approval/verify', { id: a.id, proof: {} }, v.cookie);
    await waiting;
    const c = await (await b.challenge(v)).json() as { id: string };
    expect((await b.post('/world-approval/verify', { id: c.id, proof: {} }, v.cookie)).status).toBe(200);
    release(); expect((await first).status).toBe(409);
    expect(b.settle).toHaveBeenCalledOnce();
  });
});
describe('IDKit opt-in configuration', () => {
  it('is disabled unless explicitly enabled', async () => { expect(await idkitApprovalFromEnv({})).toBeUndefined(); });
  it('refuses partial enabled configuration instead of falling back', async () => {
    await expect(idkitApprovalFromEnv({ WORLD_IDKIT_DEMO_ENABLED: 'true' })).rejects.toThrow();
  });
});
