import { afterEach, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createApp, type AppDeps } from './app.js';
import { Store } from './state.js';
import { DEMO_POLICY, KNOWN_PARTIES, NIGHT } from '../core/night.js';
import { MockScreening } from '../ports/screening.js';
import { KEYS, MockPermissions } from '../ports/permissions.js';

const account = '0x1111111111111111111111111111111111111111' as const;
let server: Server | undefined;
afterEach(async () => {
  if (server) await new Promise<void>((r) => server!.close(() => r()));
  server = undefined;
});

async function start(delegation?: AppDeps['delegation']) {
  server = createApp({
    policy: DEMO_POLICY, store: new Store(KNOWN_PARTIES),
    screening: new MockScreening(), now: () => NIGHT,
    ...(delegation ? { delegation } : {}),
  });
  await new Promise<void>((r) => server!.listen(0, '127.0.0.1', r));
  const addr = server.address();
  if (!addr || typeof addr === 'string') throw new Error('No port');
  return `http://127.0.0.1:${addr.port}`;
}
async function ask(base: string, target = 'proposal') {
  const response = await fetch(`${base}/requests`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      who: 'market-research.acme.eth', what: 'purchase-intent/groceries',
      purpose: 'demand-estimation', price: { amount: 80, currency: 'JPYC' },
      deadline: '2026-09-27T00:00:00Z', actingAs: 'delegate', writeTarget: target,
    }),
  });
  return response.json() as Promise<{ verdict: string; rule: number }>;
}

describe('HTTP delegation denial gate', () => {
  it('denies proposal requests when the reader is unconfigured', async () => {
    expect(await ask(await start())).toMatchObject({ verdict: 'deny', rule: 0 });
  });

  it('preserves rule 0 and observes revocation for subsequent requests', async () => {
    const port = new MockPermissions();
    port.grant(DEMO_POLICY.owner, account, KEYS.proposal);
    const base = await start({ port, account });
    expect((await ask(base)).verdict).not.toBe('deny');
    expect(await ask(base, 'permission')).toMatchObject({ verdict: 'deny', rule: 0 });
    port.revokeDelegation(DEMO_POLICY.owner, account);
    expect(await ask(base)).toMatchObject({ verdict: 'deny', rule: 0 });
  });

  it('denies on provider exceptions', async () => {
    const port = new MockPermissions();
    port.isDelegationRevoked = async () => { throw new Error('RPC offline'); };
    expect(await ask(await start({ port, account }))).toMatchObject({ verdict: 'deny', rule: 0 });
  });
});
