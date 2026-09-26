/**
 * What the money is allowed to do, tested at the HTTP boundary.
 *
 * The facilitator is faked, because what is being checked here is not whether a chain
 * works — it is the two promises the product makes about it:
 *
 *   1. A `200` on an `auto` request means a transfer really happened. Anything else is a 402.
 *   2. **A held request moves nothing until a verified person says yes**, and if she never
 *      does, the authorization expires rather than being settled later.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createApp } from './app.js';
import { Store } from './state.js';
import { DEMO_POLICY, KNOWN_PARTIES, NIGHT } from '../core/night.js';
import { MockScreening } from '../ports/screening.js';
import { MockIdentity } from '../ports/identity.js';
import type { PaymentRequirement, SettlementPort, SettlementResult } from '../ports/settlement.js';

const REQUIREMENT: PaymentRequirement = {
  scheme: 'exact',
  network: 'eip155:0',
  amount: '120',
  asset: '0xasset',
  payTo: '0xseller',
  maxTimeoutSeconds: 60,
};

/** Counts every call, so "nothing moved" is provable rather than assumed. */
class FakeSettlement implements SettlementPort {
  readonly live = true;
  settleCalls = 0;
  checkCalls = 0;
  constructor(private readonly outcome: SettlementResult) {}
  quote(): PaymentRequirement {
    return REQUIREMENT;
  }
  async check(): Promise<SettlementResult> {
    this.checkCalls += 1;
    return this.outcome.status === 'settled'
      ? { status: 'settled', transaction: '', network: REQUIREMENT.network }
      : this.outcome;
  }
  async settle(): Promise<SettlementResult> {
    this.settleCalls += 1;
    return this.outcome;
  }
}

const signed = (validBefore: number) =>
  Buffer.from(
    JSON.stringify({
      x402Version: 2,
      accepted: REQUIREMENT,
      payload: { signature: '0xsig', authorization: { from: '0x' + 'a'.repeat(40), validBefore: String(validBefore) } },
    }),
  ).toString('base64');

const DEADLINE = new Date(NIGHT.getTime() + 8 * 3_600_000).toISOString();
const atDeadline = Math.floor(new Date(DEADLINE).getTime() / 1000);

const routine = (id: string) => ({
  id,
  who: KNOWN_PARTIES[0]!,
  what: 'experience/why-you-put-it-back',
  purpose: 'demand-estimation',
  price: { amount: 120, currency: 'JPYC' },
  deadline: DEADLINE,
  payoutAddress: '0x' + 'a'.repeat(40),
});

const sensitive = (id: string) => ({ ...routine(id), what: 'experience/the-time-it-failed-you', price: { amount: 4200, currency: 'JPYC' } });

async function boot(settlement: SettlementPort) {
  const store = new Store(KNOWN_PARTIES);
  const server = createApp({
    policy: DEMO_POLICY,
    store,
    screening: new MockScreening(),
    identity: new MockIdentity({ maxAgeSeconds: 120, requiredAcr: 'test-acr' }),
    settlement,
    now: () => NIGHT,
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const addr = server.address();
  const base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
  return { server, store, base };
}

const post = (base: string, path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

describe('auto — a 200 means the money moved', () => {
  let ctx: Awaited<ReturnType<typeof boot>>;
  const fake = new FakeSettlement({ status: 'settled', transaction: '0xtx', network: 'eip155:0' });
  beforeAll(async () => {
    ctx = await boot(fake);
  });
  afterAll(() => new Promise<void>((r) => ctx.server.close(() => r())));

  it('asks for payment with a 402 and the protocol header', async () => {
    const res = await post(ctx.base, '/requests', routine('s-1'));
    expect(res.status).toBe(402);
    expect(res.headers.get('payment-required')).toBeTruthy();
    const decoded = JSON.parse(
      Buffer.from(res.headers.get('payment-required')!, 'base64').toString('utf8'),
    );
    expect(decoded.x402Version).toBe(2);
    expect(decoded.accepts[0].payTo).toBe('0xseller');
    expect(fake.settleCalls).toBe(0);
  });

  it('settles before answering, and reports the transaction', async () => {
    const res = await post(ctx.base, '/requests', routine('s-2'), {
      'PAYMENT-SIGNATURE': signed(atDeadline),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { settlement?: { transaction?: string } };
    expect(body.settlement?.transaction).toBe('0xtx');
  });
});

describe('auto — a refused payment is not a sale', () => {
  let ctx: Awaited<ReturnType<typeof boot>>;
  beforeAll(async () => {
    ctx = await boot(new FakeSettlement({ status: 'refused', reason: 'facilitator said no' }));
  });
  afterAll(() => new Promise<void>((r) => ctx.server.close(() => r())));

  it('answers 402 again rather than 200', async () => {
    const res = await post(ctx.base, '/requests', routine('s-3'), {
      'PAYMENT-SIGNATURE': signed(atDeadline),
    });
    expect(res.status).toBe(402);
    expect((await res.json()) as { settlement?: string }).toMatchObject({ settlement: 'refused' });
  });
});

describe('held — nothing moves until she says yes', () => {
  let ctx: Awaited<ReturnType<typeof boot>>;
  const fake = new FakeSettlement({ status: 'settled', transaction: '0xlater', network: 'eip155:0' });
  beforeAll(async () => {
    ctx = await boot(fake);
  });
  afterAll(() => new Promise<void>((r) => ctx.server.close(() => r())));

  it('keeps an authorization that outlives the deadline — and settles nothing', async () => {
    const res = await post(ctx.base, '/requests', sensitive('h-1'), {
      'PAYMENT-SIGNATURE': signed(atDeadline + 600),
    });
    expect(res.status).toBe(202);
    expect((await res.json()) as { payment?: { accepted?: boolean } }).toMatchObject({
      payment: { accepted: true },
    });
    expect(fake.settleCalls).toBe(0);
    expect(ctx.store.get('h-1')?.settlement).toBeUndefined();
  });

  it('refuses an authorization that would expire first', async () => {
    const res = await post(ctx.base, '/requests', sensitive('h-2'), {
      'PAYMENT-SIGNATURE': signed(atDeadline - 1),
    });
    expect(res.status).toBe(202);
    const body = (await res.json()) as { payment?: { accepted?: boolean; reason?: string } };
    expect(body.payment?.accepted).toBe(false);
    expect(body.payment?.reason).toContain('expires before');
    expect(ctx.store.get('h-2')?.auth).toBeUndefined();
  });

  it('settles exactly once, at the moment she approves', async () => {
    const before = fake.settleCalls;
    const res = await post(ctx.base, '/approvals/h-1', { approve: true, nonce: 'n', redirectUri: 'r' });
    expect(res.status).toBe(200);
    expect((await res.json()) as { settlement?: unknown }).toMatchObject({
      settlement: { settled: true, transaction: '0xlater' },
    });
    expect(fake.settleCalls).toBe(before + 1);
  });

  it('never settles one she declined', async () => {
    await post(ctx.base, '/requests', sensitive('h-3'), {
      'PAYMENT-SIGNATURE': signed(atDeadline + 600),
    });
    const before = fake.settleCalls;
    const res = await post(ctx.base, '/approvals/h-3', { approve: false });
    expect(res.status).toBe(200);
    expect(fake.settleCalls).toBe(before);
    expect(ctx.store.get('h-3')?.settlement).toBeUndefined();
  });

  it('reports honestly when the agent never authorized anything', async () => {
    await post(ctx.base, '/requests', sensitive('h-4'));
    const res = await post(ctx.base, '/approvals/h-4', { approve: true, nonce: 'n', redirectUri: 'r' });
    const body = (await res.json()) as { settlement?: { settled?: boolean; reason?: string } };
    expect(body.settlement?.settled).toBe(false);
    expect(body.settlement?.reason).toContain('did not authorize');
  });
});
