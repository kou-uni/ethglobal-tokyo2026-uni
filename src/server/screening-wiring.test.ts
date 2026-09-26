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

  /**
   * The visitor demo screens a *declared* mainnet address, never the visitor's own wallet.
   *
   * This reverses an earlier decision, deliberately. The reason for skipping the call was that
   * the only address in sight was the visitor's testnet wallet, and checking that would prove
   * nothing. The demo now declares the mainnet fixture we confirmed comes back clean, so the
   * call is real — and the wallet the visitor types in is still never sent anywhere.
   */
  it('is the declared mainnet fixture in the visitor demo, and never the visitor’s wallet', async () => {
    const { base, scan } = await boot();
    const visitorWallet = '0x' + 'b'.repeat(40);
    const res = await fetch(`${base}/try`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: `payTo=${visitorWallet}`,
      redirect: 'manual',
    });
    expect(scan).toHaveBeenCalledTimes(1);
    expect(scan).not.toHaveBeenCalledWith(visitorWallet);
    expect(scan.mock.calls[0]![0]).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toMatch(/^\/approve\//);
  });

  /** A refused payment source stops the demo before any approval screen exists. */
  it('refuses the visitor demo when the declared source is flagged', async () => {
    const { base } = await boot('flagged', 'known_scammer — a confirmed history of malicious activity.');
    const res = await fetch(`${base}/try`, { method: 'POST', body: 'go=skip', redirect: 'manual' });
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('Rule 4');
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
