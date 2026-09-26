import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { createProductionProbe } from './world-production-probe.js';
import { productionWorldConfig } from './world-production-config.js';
import { createApp } from './app.js';
import { Store } from './state.js';
import { DEMO_POLICY } from '../core/night.js';
import { MockScreening } from '../ports/screening.js';
import type { ProductionIdentity } from '../adapters/world-production.js';

const origin = 'https://app.example';
const servers: Server[] = [];
afterEach(async () => { await Promise.all(servers.splice(0).map((s) => new Promise<void>((r) => s.close(() => r())))); });
async function fixture(configured = true) {
  let time = Date.parse('2026-09-26T03:00:00Z');
  const identity = {
    begin: vi.fn(async (state: string) => `${origin}/authorize?state=${state}`),
    complete: vi.fn(async () => ({ authTime: new Date(time).toISOString(), acr: 'orb-test', amr: ['pop'] })),
  } satisfies ProductionIdentity;
  const store = new Store();
  const handler = createProductionProbe(configured ? { identity, redirectUri: `${origin}/world-production/callback` } : undefined, () => time);
  const server = createApp({ policy: DEMO_POLICY, store, screening: new MockScreening(), productionProbe: handler });
  servers.push(server);
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No address');
  const base = `http://127.0.0.1:${address.port}`;
  const start = async (cookie?: string) => {
    const r = await fetch(`${base}/world-production/start`, { method: 'POST', redirect: 'manual',
      headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}) } });
    return { response: r, cookie: r.headers.get('set-cookie')?.split(';')[0] ?? '',
      state: r.headers.has('location') ? new URL(r.headers.get('location')!).searchParams.get('state')! : '' };
  };
  const callback = (state: string, cookie = '', suffix = '&code=test') =>
    fetch(`${base}/world-production/callback?state=${state}${suffix}`, { headers: { Cookie: cookie } });
  return { base, identity, store, start, callback, advance: (ms: number) => { time += ms; } };
}
describe('isolated production probe', () => {
  it('stays unavailable until explicitly configured and leaves the existing app working', async () => {
    const f = await fixture(false);
    expect((await fetch(`${f.base}/world-production`)).status).toBe(503);
    const health = await (await fetch(`${f.base}/health`)).json() as { owner: string; wired: { identity: boolean } };
    expect(health.owner).toBe(DEMO_POLICY.owner);
    expect(health.wired.identity).toBe(false);
    expect((await fetch(`${f.base}/try`)).status).toBe(200);
  });
  it('requires a same-origin POST, with a secure browser binding', async () => {
    const f = await fixture();
    expect((await fetch(`${f.base}/world-production/start`, { method: 'POST' })).status).toBe(403);
    const { response } = await f.start();
    expect(response.status).toBe(303);
    expect(response.headers.get('set-cookie')).toContain('HttpOnly; Secure; SameSite=Lax');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
  });
  it('accepts one callback in the initiating browser and makes no requests or payments', async () => {
    const f = await fixture();
    const { state, cookie } = await f.start();
    const response = await f.callback(state, cookie);
    expect(await response.text()).toContain('本番World IDの認証を確認しました');
    expect(f.store.received()).toHaveLength(0);
    expect((await f.callback(state, cookie)).status).toBe(400);
    expect(f.identity.complete).toHaveBeenCalledTimes(1);
  });
  it('rejects a callback from another browser without consuming the correct attempt', async () => {
    const f = await fixture();
    const { state, cookie } = await f.start();
    expect((await f.callback(state)).status).toBe(400);
    expect(f.identity.complete).not.toHaveBeenCalled();
    expect((await f.callback(state, cookie)).status).toBe(200);
  });
  it('expires abandoned attempts and prevents replay after errors', async () => {
    const f = await fixture();
    const a = await f.start();
    f.advance(300001);
    expect((await f.callback(a.state, a.cookie)).status).toBe(400);
    const b = await f.start();
    f.identity.complete.mockRejectedValueOnce(new Error('secret raw provider failure'));
    const result = await f.callback(b.state, b.cookie);
    expect(result.status).toBe(400);
    expect(await result.text()).not.toContain('secret raw');
    expect((await f.callback(b.state, b.cookie)).status).toBe(400);
  });
  it('handles cancellation without exchanging the code', async () => {
    const f = await fixture();
    const { state, cookie } = await f.start();
    const result = await f.callback(state, cookie, '&error=access_denied');
    expect(await result.text()).toContain('認証は完了していません');
    expect(f.identity.complete).not.toHaveBeenCalled();
    expect(f.store.received()).toHaveLength(0);
  });
  it('limits rapid restarts and invalidates previous attempts on a permitted restart', async () => {
    const f = await fixture();
    const a = await f.start();
    expect((await f.start(a.cookie)).response.status).toBe(429);
    f.advance(15001);
    const b = await f.start(a.cookie);
    expect((await f.callback(a.state, a.cookie)).status).toBe(400);
    expect((await f.callback(b.state, b.cookie)).status).toBe(200);
  });
});
describe('independent production configuration', () => {
  it('never falls back to sandbox credentials', () => {
    expect(productionWorldConfig({ WORLD_CLIENT_ID: 'sandbox', WORLD_CLIENT_SECRET: 'secret' })).toBeUndefined();
    expect(() => productionWorldConfig({ WORLD_PRODUCTION_ENABLED: 'true', WORLD_CLIENT_ID: 'sandbox' })).toThrow();
  });
  it('requires a separate HTTPS callback', () => {
    const env = { WORLD_PRODUCTION_ENABLED: 'true', WORLD_PRODUCTION_CLIENT_ID: 'prod', WORLD_PRODUCTION_CLIENT_SECRET: 'secret' };
    expect(() => productionWorldConfig({ ...env, WORLD_PRODUCTION_REDIRECT_URI: `${origin}/auth/world/callback` })).toThrow();
    expect(() => productionWorldConfig({ ...env, WORLD_PRODUCTION_REDIRECT_URI: 'http://app.example/world-production/callback' })).toThrow();
    expect(productionWorldConfig({ ...env, WORLD_PRODUCTION_REDIRECT_URI: `${origin}/world-production/callback` })?.clientId).toBe('prod');
  });
});
