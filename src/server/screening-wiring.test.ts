/**
 * Which address the live screening call is actually made about.
 *
 * The adapter is tested on its own; these are about the wiring around it, and they exist
 * because two of the mistakes available here are silent ones. **Screening the wrong address**
 * — a testnet buyer wallet, or an empty string — would be a call that proves nothing while
 * looking exactly like a check. **Screening on a path that never settles** would spend a
 * 1,000-request key on the visitor demo and make the booth depend on someone else's uptime.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { createApp } from './app.js';
import { Store } from './state.js';
import { DEMO_POLICY, KNOWN_PARTIES, NIGHT } from '../core/night.js';
import { MockIdentity } from '../ports/identity.js';
import type { ScreeningPort } from '../ports/screening.js';
import type { ScreeningResult } from '../core/types.js';

const DECLARED = '0x' + 'a'.repeat(40);
const servers: Server[] = [];
afterEach(async () => {
  for (const s of servers.splice(0)) await new Promise<void>((r) => s.close(() => r()));
});

function boot(answer: ScreeningResult = 'clean', said?: string) {
  const scan = vi.fn(async (_address: string): Promise<ScreeningResult> => answer);
  const screening: ScreeningPort = { scan, reasonFor: () => said };
  const server = createApp({
    policy: DEMO_POLICY,
    store: new Store(KNOWN_PARTIES),
    screening,
    screeningWired: true,
    identity: new MockIdentity({ maxAgeSeconds: 120, requiredAcr: 'test-acr' }),
    now: () => NIGHT,
  });
  servers.push(server);
  return new Promise<{ base: string; scan: typeof scan }>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ base: `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`, scan });
    });
  });
}

const ask = (base: string, over: Record<string, unknown> = {}) =>
  fetch(`${base}/requests`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      who: 'market-research.acme.eth',
      what: 'experience/why-you-put-it-back',
      purpose: 'demand-estimation',
      price: { amount: 80, currency: 'JPYC' },
      deadline: '2026-09-27T00:00:00Z',
      ...over,
    }),
  });

describe('the address the provider is asked about', () => {
  it('is the one the request declared, unchanged', async () => {
    const { base, scan } = await boot();
    await ask(base, { id: 'declared', payoutAddress: DECLARED });
    expect(scan).toHaveBeenCalledTimes(1);
    expect(scan).toHaveBeenCalledWith(DECLARED);
  });

  /**
   * An empty string is not an address, and a live adapter can only answer `unavailable` about
   * one — which would deny every request that declares no payment source. That is not rule 4
   * finding something wrong; it is us asking a question nobody was asked to answer.
   */
  it('is never an empty string when nothing was declared', async () => {
    const { base, scan } = await boot();
    const res = await ask(base, { id: 'undeclared' });
    expect(scan).not.toHaveBeenCalled();
    expect((await res.json() as { verdict: string }).verdict).toBe('auto');
  });

  it('is not asked for at all by the visitor demo, which has no mainnet payment source', async () => {
    const { base, scan } = await boot();
    const res = await fetch(`${base}/try`, { method: 'POST', body: 'go=skip', redirect: 'manual' });
    expect(scan).not.toHaveBeenCalled();
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toMatch(/^\/approve\//);
  });
});

describe('what the refusal tells the person who reads it', () => {
  it('carries the provider’s sentence onto the page that lists refusals', async () => {
    const said = 'sanction_address — The address is officially listed as sanctioned.';
    const { base } = await boot('flagged', said);
    const res = await ask(base, { id: 'flagged-1', payoutAddress: DECLARED });
    const body = (await res.json()) as { verdict: string; rule: number; reason: string };
    expect(body).toMatchObject({ verdict: 'deny', rule: 4 });
    expect(body.reason).toContain('officially listed as sanctioned');
    expect(await (await fetch(`${base}/dropped`)).text()).toContain('officially listed as sanctioned');
  });

  it('denies without settling when the provider could not answer', async () => {
    const { base } = await boot('unavailable', 'the screening API answered 404');
    const body = (await (await ask(base, { id: 'unavailable-1', payoutAddress: DECLARED })).json()) as {
      verdict: string; rule: number; reason: string;
    };
    expect(body).toMatchObject({ verdict: 'deny', rule: 4 });
    expect(body.reason).toContain('404');
  });
});
