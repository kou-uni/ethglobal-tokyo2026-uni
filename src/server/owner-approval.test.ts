import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { privateKeyToAccount } from 'viem/accounts';
import { verifyMessage } from 'viem';
import { createApp } from './app.js';
import { OwnerAuth, type OwnerAuthOptions } from './owner-auth.js';
import { ownerAddress } from './owner-config.js';
import { Store } from './state.js';
import { DEMO_POLICY, KNOWN_PARTIES, MORNING } from '../core/night.js';
import { MockScreening } from '../ports/screening.js';
import type { IdkitApprovalOptions } from './idkit-approval.js';

const wallet = privateKeyToAccount(('0x' + '1'.repeat(64)) as `0x${string}`);
const stranger = privateKeyToAccount(('0x' + '2'.repeat(64)) as `0x${string}`);
const servers: Server[] = [];
afterEach(async () => { for (const s of servers.splice(0)) { s.closeAllConnections(); await new Promise<void>(r => s.close(() => r())); } });
async function boot() {
  let time = MORNING.getTime();
  const store = new Store(KNOWN_PARTIES);
  const authority = vi.fn(async () => true);
  const proof = () => ({ verified: true, environment: 'production', protocolVersion: '3.0' as const, credential: 'orb', checkedAt: new Date(time).toISOString() });
  const verifyWorld = vi.fn(async () => proof());
  const settle = vi.fn(async () => ({ status: 'settled' as const, transaction: 'fixture-paid', network: 'eip155:0' }));
  const ownerOptions: OwnerAuthOptions = {
    origin: 'http://127.0.0.1:0', address: wallet.address, name: DEMO_POLICY.owner,
    verify: (message, signature) => verifyMessage({ address: wallet.address, message, signature }), authority,
  };
  const owner = new OwnerAuth(ownerOptions, () => time);
  const options: IdkitApprovalOptions = {
    origin: ownerOptions.origin, owner, appId: 'app_fixture', action: 'owner-approval',
    sign: () => ({ rp_id: 'rp_fixture', nonce: '0x123', signature: '0xabc', created_at: Math.floor(time / 1000), expires_at: Math.floor(time / 1000) + 120 }),
    verify: verifyWorld,
    assets: { page: readFileSync(new URL('../../setup/idkit-approval.html', import.meta.url), 'utf8'), js: new Uint8Array(), wasm: new Uint8Array() },
  };
  const server = createApp({
    policy: DEMO_POLICY, store, screening: new MockScreening(), idkitDemo: options,
    settlement: { live: true, settle, check: async () => ({ status: 'settled', transaction: '', network: 'eip155:0' }),
      quote: () => ({ scheme: 'exact', network: 'eip155:0', asset: wallet.address, amount: '120', payTo: wallet.address, maxTimeoutSeconds: 60 }) },
    now: () => new Date(time),
  });
  servers.push(server);
  await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  options.origin = ownerOptions.origin = base;
  const post = (path: string, body: unknown = {}, cookie = '', origin = base, extra: Record<string, string> = {}) => fetch(base + path, {
    method: 'POST', headers: { origin, cookie, 'content-type': 'application/json', ...extra }, body: JSON.stringify(body), redirect: 'manual',
  });
  const get = (path: string, cookie = '') => fetch(base + path, { headers: { cookie }, redirect: 'manual' });
  const begin = async () => {
    const r = await post('/owner/challenge');
    return { ...await r.json() as { address: string; message: string }, cookie: r.headers.get('set-cookie')!.split(';')[0]! };
  };
  const login = async () => {
    const c = await begin(), signature = await wallet.signMessage({ message: c.message });
    const r = await post('/owner/session', { signature }, c.cookie);
    expect(r.status).toBe(200);
    return r.headers.get('set-cookie')!.split(';')[0]!;
  };
  const intake = async () => {
    const signature = Buffer.from(JSON.stringify({ x402Version: 2, payload: { authorization: {
      from: wallet.address, validBefore: String(Math.floor(time / 1000) + 10000),
    }, signature: 'fixture' } })).toString('base64');
    const r = await post('/requests', {
      id: 'ordinary', who: KNOWN_PARTIES[0], what: DEMO_POLICY.sensitive[0], purpose: 'demand-estimation',
      price: { amount: 120, currency: 'JPYC' }, deadline: new Date(time + 600000).toISOString(), payoutAddress: wallet.address,
    }, '', base, { 'payment-signature': signature });
    expect(r.status).toBe(202);
    expect(await r.json()).toMatchObject({ payment: { accepted: true } });
  };
  const challenge = async (cookie: string) => {
    const page = await (await get('/world-approval?id=ordinary', cookie)).text();
    const snapshot = page.match(/id="snapshot" value="([^"]+)"/)![1]!;
    return post('/world-approval/challenge', { requestId: 'ordinary', snapshot }, cookie);
  };
  return { base, post, get, begin, login, intake, challenge, authority, verifyWorld, settle, store, proof, advance: (ms: number) => { time += ms; } };
}

describe('ordinary owner approval through wallet and World', () => {
  it('connects real HTTP intake, wallet signature, owner inbox, World proof and one settlement', async () => {
    const b = await boot(); await b.intake();
    expect(await (await b.get('/health')).json()).toMatchObject({ wired: { ownerApproval: true, identityMode: 'idkit-production-owner-and-visitor' } });
    expect((await (await b.get('/')).json() as { cannotDo: string[] }).cannotDo).not.toContain('identity is mocked on this instance');
    expect((await b.get('/owner')).status).toBe(303);
    expect((await b.get('/approve/ordinary')).status).toBe(403);
    const cookie = await b.login();
    expect(await (await b.get('/owner', cookie)).text()).toContain('/approve/ordinary');
    const c = await (await b.challenge(cookie)).json() as { id: string };
    expect(b.settle).not.toHaveBeenCalled();
    const result = await b.post('/world-approval/verify', { id: c.id, proof: {} }, cookie);
    expect(await result.json()).toMatchObject({ verdict: 'approved', identity: { verified: true }, settlement: { settled: true } });
    expect((await b.post('/world-approval/verify', { id: c.id, proof: {} }, cookie)).status).toBe(400);
    expect(b.settle).toHaveBeenCalledOnce();
  });
  it('refuses a stranger wallet and consumes the failed challenge', async () => {
    const b = await boot(), c = await b.begin();
    const signature = await stranger.signMessage({ message: c.message });
    expect((await b.post('/owner/session', { signature }, c.cookie)).status).toBe(403);
    expect((await b.post('/owner/session', { signature: await wallet.signMessage({ message: c.message }) }, c.cookie)).status).toBe(403);
  });
  it('binds wallet login to its browser and origin and rotates the session cookie', async () => {
    const b = await boot(), c = await b.begin(), signature = await wallet.signMessage({ message: c.message });
    expect((await b.post('/owner/session', { signature })).status).toBe(403);
    expect((await b.post('/owner/session', { signature }, c.cookie, 'https://other.example')).status).toBe(403);
    const r = await b.post('/owner/session', { signature }, c.cookie);
    expect(r.status).toBe(200);
    expect(r.headers.get('set-cookie')!.split(';')[0]).not.toBe(c.cookie);
    expect((await b.post('/owner/session', { signature }, c.cookie)).status).toBe(403);
    expect((await b.get('/owner', c.cookie)).status).toBe(303);
  });
  it.each(['revoked', 'unavailable', 'expired'] as const)('denies owner login when authority is %s', async mode => {
    const b = await boot(), c = await b.begin();
    if (mode === 'revoked') b.authority.mockResolvedValue(false);
    if (mode === 'unavailable') b.authority.mockRejectedValue(new Error('RPC down'));
    if (mode === 'expired') b.advance(301000);
    expect((await b.post('/owner/session', { signature: await wallet.signMessage({ message: c.message }) }, c.cookie)).status).toBe(403);
  });
  it.each(['revoked', 'logout', 'session-expired', 'deadline', 'cancelled'] as const)('does not settle if %s during World verification', async mode => {
    const b = await boot(); await b.intake();
    const cookie = await b.login(), c = await (await b.challenge(cookie)).json() as { id: string };
    b.verifyWorld.mockImplementationOnce(async () => {
      if (mode === 'revoked') b.authority.mockResolvedValue(false);
      if (mode === 'logout') await b.post('/owner/logout', {}, cookie);
      if (mode === 'session-expired') b.advance(1801000);
      if (mode === 'deadline') b.advance(601000);
      if (mode === 'cancelled') throw new Error('World refused');
      return b.proof();
    });
    expect((await b.post('/world-approval/verify', { id: c.id, proof: {} }, cookie)).status).toBeGreaterThanOrEqual(400);
    expect(b.settle).not.toHaveBeenCalled();
  });
  it('requires owner authority again for both a World challenge and a decline', async () => {
    const b = await boot(); await b.intake();
    const cookie = await b.login();
    b.authority.mockResolvedValue(false);
    expect((await b.challenge(cookie)).status).toBe(403);
    expect((await b.post('/approve/ordinary/decline', {}, cookie)).status).toBe(403);
    expect(b.store.get('ordinary')!.resolution).toBeUndefined();
  });
  it('cancels a World attempt without paying or answering the request', async () => {
    const b = await boot(); await b.intake();
    const cookie = await b.login(), c = await (await b.challenge(cookie)).json() as { id: string };
    expect((await b.post('/world-approval/cancel', { id: c.id }, cookie)).status).toBe(200);
    expect((await b.post('/world-approval/verify', { id: c.id, proof: {} }, cookie)).status).toBe(400);
    expect(b.settle).not.toHaveBeenCalled();
    expect(b.store.get('ordinary')!.resolution).toBeUndefined();
  });
  it('does not give one owner session access to a visitor-owned demo', async () => {
    const b = await boot(), cookie = await b.login();
    const r = await fetch(b.base + '/try', { method: 'POST', headers: { origin: b.base }, body: 'go=skip', redirect: 'manual' });
    const path = r.headers.get('location')!;
    expect((await b.get(path, cookie)).status).toBe(403);
  });
});

describe('configured owner binding', () => {
  const binding = { name: 'seller.eth', resolver: stranger.address, owner: wallet.address };
  it('uses a recorded owner only for the same name and resolver', () => {
    expect(ownerAddress({ ENS_NAME: binding.name, ENS_RESOLVER_ADDRESS: binding.resolver }, binding)).toBe(wallet.address);
    expect(ownerAddress({ ENS_NAME: 'different.eth', ENS_RESOLVER_ADDRESS: binding.resolver }, binding)).toBeUndefined();
    expect(ownerAddress({ ENS_NAME: binding.name, ENS_RESOLVER_ADDRESS: wallet.address }, binding)).toBeUndefined();
  });
});
