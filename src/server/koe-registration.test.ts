import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { createApp } from './app.js';
import { Store } from './state.js';
import { DEMO_POLICY, KNOWN_PARTIES } from '../core/night.js';
import { MockScreening } from '../ports/screening.js';
import type { IdkitApprovalOptions } from './idkit-approval.js';
const servers: Server[] = [];
afterEach(async () => { for (const s of servers.splice(0)) { s.closeAllConnections(); await new Promise<void>(r => s.close(() => r())); } });
async function boot(enabled = true) {
  let time = Date.now(), nonce = 0;
  const verify = vi.fn(async () => ({ verified: true, environment: 'production', protocolVersion: '3.0' as const, credential: 'orb', checkedAt: new Date(time).toISOString() }));
  const settle = vi.fn(async () => ({ status: 'settled' as const, transaction: 'unused', network: 'test' }));
  const store = new Store(KNOWN_PARTIES);
  const opts: IdkitApprovalOptions = {
    origin: 'http://127.0.0.1:0', appId: 'app_test', action: 'test',
    sign: () => ({ rp_id: 'rp_test', nonce: `0x${++nonce}`, signature: '0xabc', created_at: Math.floor(time / 1000), expires_at: Math.floor(time / 1000) + 120 }), verify,
    assets: { page: '', js: new Uint8Array(), wasm: new Uint8Array(), koePage: readFileSync(new URL('../../setup/koe-registration.html', import.meta.url), 'utf8'), koeJs: new Uint8Array() },
  };
  const server = createApp({ ...(enabled ? { idkitDemo: opts } : {}), policy: DEMO_POLICY, store, screening: new MockScreening(), settlement: { live: true, settle, check: settle, quote: () => { throw new Error('must not quote'); } }, now: () => new Date(time) });
  servers.push(server); await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`; opts.origin = base;
  const post = (path: string, body: unknown, cookie: string, origin = base) => fetch(base + '/koe-registration/' + path, { method: 'POST', headers: { 'content-type': 'application/json', origin, cookie }, body: JSON.stringify(body) });
  const visit = async () => { const r = await fetch(base + '/koe-registration'); return r.headers.get('set-cookie')!.split(';')[0]!; };
  const draft = { name: 'Demo alias', headline: 'Coffee perspective', about: 'Self-reported', topic: DEMO_POLICY.allow[0], consent: true };
  const challenge = async (cookie: string, override = {}) => { const r = await post('challenge', { ...draft, ...override }, cookie); expect(r.status).toBe(200); return await r.json() as { id: string; signal: string }; };
  const feed = async () => await (await fetch(base + '/koe-registration/directory.json')).json() as { profiles: Record<string, unknown>[] };
  return { base, post, visit, draft, challenge, feed, verify, settle, store, advance: (ms: number) => { time += ms; } };
}
describe('Koe production-personhood registration', () => {
  it('fails closed when production IDKit is disabled', async () => {
    const b = await boot(false);
    expect((await fetch(b.base + '/koe-registration')).status).toBe(503);
    expect((await fetch(b.base + '/koe-registration/directory.json')).status).toBe(503);
  });
  it('publishes only after verification, uses the bound draft, and never approves or pays', async () => {
    const b = await boot(), cookie = await b.visit(), c = await b.challenge(cookie);
    expect((await b.feed()).profiles).toHaveLength(0);
    const wrongFlow = await fetch(b.base + '/world-approval/verify', { method: 'POST', headers: { origin: b.base, cookie, 'content-type': 'application/json' }, body: JSON.stringify({ id: c.id, proof: {} }) });
    expect(wrongFlow.status).toBe(400);
    expect(b.verify).not.toHaveBeenCalled();
    const r = await b.post('verify', { id: c.id, proof: { secret: 'not-retained' }, name: 'tampered' }, cookie);
    expect(r.status).toBe(200);
    const feed = await b.feed(); expect(feed.profiles).toHaveLength(1);
    expect(feed.profiles[0]!.name).toBe(b.draft.name);
    expect(JSON.stringify(feed)).not.toMatch(/not-retained|nonce|signal|rp_id|browser|nullifier/);
    expect(b.verify).toHaveBeenCalledOnce(); expect(b.settle).not.toHaveBeenCalled(); expect(b.store.all()).toHaveLength(0);
    expect((await b.post('verify', { id: c.id }, cookie)).status).toBe(409);
    const publicResponse = await fetch(b.base + '/koe-registration/directory.json');
    expect(publicResponse.headers.get('access-control-allow-origin')).toBe('*');
    expect(publicResponse.headers.get('set-cookie')).toBeNull();
    expect(publicResponse.headers.get('cache-control')).toBe('no-store');
  });
  it('requires consent, a supported topic, bounded strings and same-origin browser ownership', async () => {
    const b = await boot(), a = await b.visit(), other = await b.visit();
    for (const override of [{ consent: false }, { topic: 'contact/where-you-live' }, { name: '' }, { headline: 'x'.repeat(101) }, { about: 'a\u0000b' }]) {
      expect((await b.post('challenge', { ...b.draft, ...override }, a)).status).toBe(403);
    }
    expect((await b.post('challenge', b.draft, '')).status).toBe(403);
    expect((await b.post('challenge', b.draft, a, 'https://other.example')).status).toBe(403);
    const c = await b.challenge(a);
    expect((await b.post('verify', { id: c.id }, other)).status).toBe(409);
    expect(b.verify).not.toHaveBeenCalled();
    expect((await fetch(b.base + '/koe-registration/me', { headers: { cookie: a } })).headers.get('access-control-allow-origin')).toBeNull();
  });
  it('refuses failed proofs and consumes them', async () => {
    const b = await boot(), a = await b.visit(), c = await b.challenge(a);
    b.verify.mockRejectedValueOnce(new Error('invalid proof'));
    expect((await b.post('verify', { id: c.id }, a)).status).toBe(403);
    expect((await b.post('verify', { id: c.id }, a)).status).toBe(409);
    expect((await b.feed()).profiles).toHaveLength(0);
  });
  it('cancel and replacement invalidate earlier challenges and change the signal', async () => {
    const b = await boot(), a = await b.visit(), first = await b.challenge(a), second = await b.challenge(a, { name: 'New alias' });
    expect(second.signal).not.toBe(first.signal);
    expect((await b.post('verify', { id: first.id }, a)).status).toBe(409);
    await b.post('cancel', { id: second.id }, a);
    expect((await b.post('verify', { id: second.id }, a)).status).toBe(409);
    expect((await b.feed()).profiles).toHaveLength(0); expect(b.verify).not.toHaveBeenCalled();
  });
  it('expires challenges and one-hour listings, and removes only this browser’s listing', async () => {
    const b = await boot(), a = await b.visit(), other = await b.visit();
    const expired = await b.challenge(a); b.advance(121_000);
    expect((await b.post('verify', { id: expired.id }, a)).status).toBe(409);
    for (const cookie of [a, other]) { const c = await b.challenge(cookie); await b.post('verify', { id: c.id }, cookie); }
    expect((await b.feed()).profiles).toHaveLength(2);
    await b.post('remove', {}, a); expect((await b.feed()).profiles).toHaveLength(1);
    b.advance(3_600_001); expect((await b.feed()).profiles).toHaveLength(0);
  });
  for (const mutation of ['cancel', 'remove', 'replace', 'expire']) it(`does not publish after ${mutation} during verification`, async () => {
    const b = await boot(), a = await b.visit(), c = await b.challenge(a);
    let release!: () => void, started!: () => void;
    const begun = new Promise<void>(r => { started = r; });
    const waiting = new Promise<void>(r => { release = r; });
    b.verify.mockImplementationOnce(async () => { started(); await waiting; return { verified: true, environment: 'production', protocolVersion: '3.0', credential: 'orb', checkedAt: new Date().toISOString() }; });
    const response = b.post('verify', { id: c.id }, a); await begun;
    if (mutation === 'replace') await b.challenge(a, { name: 'Another alias' });
    else if (mutation === 'expire') b.advance(121_000);
    else await b.post(mutation, { id: c.id }, a);
    release(); expect((await response).status).toBe(409);
    expect((await b.feed()).profiles).toHaveLength(0);
  });
});
