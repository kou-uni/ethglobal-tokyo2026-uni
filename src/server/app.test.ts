import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createApp } from './app.js';
import { Store } from './state.js';
import { DEMO_POLICY, KNOWN_PARTIES, NIGHT, generateNight } from '../core/night.js';
import { MockScreening } from '../ports/screening.js';
import { MockIdentity } from '../ports/identity.js';
import { surface } from '../core/queue.js';
import { route } from '../core/rules.js';
import { demoContext } from '../core/night.js';
import type { HeldRequest } from '../core/types.js';

const FRESH = { maxAgeSeconds: 120, requiredAcr: 'test-acr' };
let server: Server;
let base: string;
let store: Store;

beforeAll(async () => {
  store = new Store(KNOWN_PARTIES);
  server = createApp({
    policy: DEMO_POLICY,
    store,
    screening: new MockScreening(),
    identity: new MockIdentity(FRESH),
    now: () => NIGHT,
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const addr = server.address();
  base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
});

afterAll(() => new Promise<void>((r) => server.close(() => r())));

const post = (path: string, body: unknown) =>
  fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

const ask = (over: Record<string, unknown> = {}) =>
  post('/requests', {
    who: 'market-research.acme.eth',
    what: 'experience/why-you-put-it-back',
    purpose: 'demand-estimation',
    price: { amount: 80, currency: 'JPYC' },
    deadline: '2026-09-27T00:00:00Z',
    ...over,
  });

describe('an agent asks', () => {
  it('says what is wired, without being asked twice', async () => {
    const response = await fetch(`${base}/health`, { headers: { origin: 'https://pages.example' } });
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('access-control-allow-credentials')).toBeNull();
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(response.headers.get('cache-control')).toBe('no-store');
    const h = await response.json() as { wired: Record<string, boolean> };
    expect(h.wired['routing']).toBe(true);
    expect(h.wired['identity']).toBe(false); // MockIdentity is not a live integration.
    expect(h.wired['screening']).toBe(false);
    expect(h.wired['settlement']).toBe(false); // never claimed
  });

  it('names every missing field rather than just refusing', async () => {
    const res = await post('/requests', { who: 'x.eth' });
    expect(res.status).toBe(400);
    const b = (await res.json()) as { missing: string[] };
    expect(b.missing).toEqual(['what', 'purpose', 'price', 'deadline']);
  });

  it('answers immediately when held — 202, with the deadline', async () => {
    const res = await ask({ id: 'held-1', what: 'experience/why-you-stopped', price: { amount: 2000, currency: 'JPYC' } });
    expect(res.status).toBe(202);
    const b = (await res.json()) as { verdict: string; held: boolean; deadline: string };
    expect(b).toMatchObject({ verdict: 'human', held: true });
    expect(b.deadline).toBe('2026-09-27T00:00:00Z');
  });

  it('denies a delegate that reaches past its own key', async () => {
    const res = await ask({ id: 'del-1', actingAs: 'delegate', writeTarget: 'permission' });
    const b = (await res.json()) as { verdict: string; rule: number };
    expect(b).toMatchObject({ verdict: 'deny', rule: 0 });
  });

  it('never reports a settlement it did not make', async () => {
    const res = await ask({ id: 'auto-1' });
    const b = (await res.json()) as { verdict: string; settlement?: string };
    expect(b.verdict).toBe('auto');
    expect(b.settlement).toBe('not-wired');
  });
});

describe('the owner answers', () => {
  it('records a refusal and settles nothing', async () => {
    await ask({ id: 'ref-1', what: 'experience/why-you-stopped', price: { amount: 4000, currency: 'JPYC' } });
    const res = await post('/approvals/ref-1', { approve: false });
    const b = (await res.json()) as { verdict: string; settled: boolean };
    expect(b).toMatchObject({ verdict: 'deny', settled: false });
  });

  it('proves personhood at the moment of approval', async () => {
    await ask({ id: 'app-1', what: 'experience/why-you-stopped', price: { amount: 2500, currency: 'JPYC' } });
    const res = await post('/approvals/app-1', { approve: true });
    const b = (await res.json()) as { verdict: string; identity: { acr: string } };
    expect(b.verdict).toBe('approved');
    expect(b.identity.acr).toBe(FRESH.requiredAcr);
  });

  it('refuses to answer something that was never held for her', async () => {
    await ask({ id: 'auto-2' });
    expect((await post('/approvals/auto-2', { approve: true })).status).toBe(409);
  });

  it('refuses a second answer', async () => {
    expect((await post('/approvals/app-1', { approve: true })).status).toBe(409);
  });

  it('404s an unknown id rather than inventing one', async () => {
    expect((await post('/approvals/nope', { approve: true })).status).toBe(404);
  });
});

describe('the server and the seed script describe the same night', () => {
  it('produces exactly the same split over HTTP as in process', async () => {
    const fresh = new Store(KNOWN_PARTIES);
    const s = createApp({
      policy: DEMO_POLICY,
      store: fresh,
      screening: new MockScreening(),
      now: () => NIGHT,
    });
    await new Promise<void>((r) => s.listen(0, '127.0.0.1', r));
    const addr = s.address();
    const url = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;

    const night = generateNight(18);
    const overHttp = { auto: 0, human: 0, deny: 0 } as Record<string, number>;
    for (const r of night) {
      const res = await fetch(`${url}/requests`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(r),
      });
      const b = (await res.json()) as { verdict: string };
      overHttp[b.verdict] = (overHttp[b.verdict] ?? 0) + 1;
    }
    await new Promise<void>((r) => s.close(() => r()));

    const ctx = demoContext(NIGHT);
    const inProcess = night.map((r) => route(r, DEMO_POLICY, ctx));
    expect(overHttp['auto']).toBe(inProcess.filter((d) => d.verdict === 'auto').length);
    expect(overHttp['deny']).toBe(inProcess.filter((d) => d.verdict === 'deny').length);
    expect(overHttp['human']).toBe(inProcess.filter((d) => d.verdict === 'human').length);
  }, 30_000);

  it('holds invitations until the notification hour instead of exposing the morning preview at night', async () => {
    const led = (await (await fetch(`${base}/ledger/alice.yohaku.eth`)).json()) as {
      needsYou: unknown[];
    };
    expect(NIGHT.getHours()).toBeLessThan(DEMO_POLICY.notifyHour);
    expect(led.needsYou).toHaveLength(0);
  });
});

/**
 * The approval page shows a money figure in its fold. Settlement is not wired, so that
 * figure is what accepted offers are *worth* — and the page must say so on the same
 * screen. This is here because the failure is silent: the sum renders perfectly either
 * way, and only the label decides whether the screen is lying.
 */
describe('the fold never shows money without saying nothing moved', () => {
  it('labels the sum as worth and names the missing payment', async () => {
    for (const r of generateNight(18).slice(0, 30)) await post('/requests', r);
    const held = store.outstanding();
    expect(held.length).toBeGreaterThan(0);

    const page = await (await fetch(`${base}/approve/${held[0]!.request.id}`)).text();
    const sum = page.match(/class="amt">([\d,]+) JPYC([^<]*)</);
    expect(sum, 'the fold should show what was accepted').not.toBeNull();
    expect(sum![2]).toContain('worth');
    expect(page).toContain('Payment is not connected yet');
    expect(page).not.toMatch(/class="amt">\+/);
  });

  it('tells her how many arrived and how many need her', async () => {
    const held = store.outstanding();
    const page = await (await fetch(`${base}/approve/${held[0]!.request.id}`)).text();
    expect(page).toContain('OFFERS FROM AGENTS');
    expect(page).toMatch(/class="count">\d+</);
    const arrived = Number(page.match(/class="count">(\d+)</)![1]);
    expect(arrived).toBe(store.all().length);
  });

  it('renders with no past nights at all', async () => {
    const bare = createApp({
      policy: DEMO_POLICY,
      store,
      screening: new MockScreening(),
      identity: new MockIdentity(FRESH),
      now: () => NIGHT,
    });
    await new Promise<void>((r) => bare.listen(0, '127.0.0.1', r));
    const addr = bare.address();
    const b = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
    const held = store.outstanding();
    const page = await (await fetch(`${b}/approve/${held[0]!.request.id}`)).text();
    expect(page).toContain('OVERNIGHT, FOR YOU');
    expect(page).not.toContain('THE NIGHTS BEFORE');
    await new Promise<void>((r) => bare.close(() => r()));
  });
});
