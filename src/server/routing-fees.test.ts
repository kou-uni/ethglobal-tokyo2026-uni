import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { decodePaymentRequiredHeader, decodePaymentSignatureHeader, encodePaymentSignatureHeader } from '@x402/core/http';
import { RoutingFees } from './routing-fees.js';
import { FeeLedger, feesFromEnv } from '../core/fees.js';
import { authorizeRoutingFee } from '../adapters/fee-authorization.js';
import { signAuthorization } from '../adapters/eip3009.js';
import { createApp } from './app.js';
import { Store } from './state.js';
import { DEMO_POLICY, KNOWN_PARTIES } from '../core/night.js';
import { MockScreening } from '../ports/screening.js';
import type { PaymentRequirement } from '../ports/settlement.js';
const address = (c: string) => '0x' + c.repeat(40);
const feeAddress = address('2'), seller = address('3');
const template: PaymentRequirement = { scheme: 'exact', network: 'eip155:84532', asset: address('4'), payTo: seller, amount: '80', maxTimeoutSeconds: 60, extra: { name: 'USDC', version: '2' } };
// Public, unfunded test fixture; never loaded from a real wallet.
const key = '0x' + '1'.repeat(64);
const agentEnv = { AGENT_PAY_ROUTING_FEE: 'true', AGENT_PRIVATE_KEY: key, AGENT_FEE_ADDRESS: feeAddress, AGENT_FEE_MAX_ATOMIC: '1', X402_NETWORK: template.network, X402_ASSET: template.asset, X402_ASSET_NAME: 'USDC', X402_ASSET_VERSION: '2' };
const servers: Server[] = [];
afterEach(async () => { for (const s of servers.splice(0)) { s.closeAllConnections(); await new Promise<void>(r => s.close(() => r())); } });
async function boot(enabled = true) {
  let time = Date.now();
  const fees = new RoutingFees({ payTo: feeAddress, perDecision: 1, redeemAbove: 3 }, template);
  const settle = vi.fn(async () => ({ status: 'settled' as const, transaction: 'test-only', network: template.network }));
  const check = vi.fn(async () => ({ status: 'settled' as const, transaction: '', network: template.network }));
  const server = createApp({ policy: DEMO_POLICY, store: new Store(KNOWN_PARTIES), screening: new MockScreening(), now: () => new Date(time), ...(enabled ? { fees } : {}), settlement: { live: true, settle, check, quote: amount => ({ ...template, amount: String(amount) }) } });
  servers.push(server); await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const request = (id: string, what = DEMO_POLICY.allow[0]!) => ({ id, who: KNOWN_PARTIES[0], what, purpose: 'market-research', price: { amount: 80, currency: 'JPYC' }, deadline: new Date(time + 3600_000).toISOString() });
  const post = (body: unknown, fee?: string, main?: string) => fetch(base + '/requests', { method: 'POST', headers: { 'content-type': 'application/json', ...(fee ? { 'YOHAKU-FEE-AUTHORIZATION': fee } : {}), ...(main ? { 'PAYMENT-SIGNATURE': main } : {}) }, body: JSON.stringify(body) }) as Promise<Omit<Response, 'json'> & { json(): Promise<any> }>;
  const summary = async () => await (await fetch(base + '/fees')).json();
  const offer = async (req: unknown) => await (await post(req)).json();
  const sign = async (extensions: unknown, env = agentEnv) => (await authorizeRoutingFee(extensions, env, base + '/requests', time))!;
  return { base, request, post, summary, offer, sign, fees, settle, check, time: () => time, advance: (ms: number) => { time += ms; } };
}
describe('optional routing-fee HTTP flow', () => {
  it('records auto/human/deny equally and advertises the optional requirement in the 402 header', async () => {
    const b = await boot();
    for (const [i, topic, status] of [[0, DEMO_POLICY.allow[0], 402], [1, DEMO_POLICY.sensitive[0], 202], [2, DEMO_POLICY.forbid[0], 200]] as const) {
      const r = await b.post(b.request(String(i), topic));
      expect(r.status).toBe(status);
      const body = await r.json();
      expect(body.fee.paid).toBe(false);
      expect(body.extensions['yohaku-routing-fee'].info.requirement.amount).toBe('1');
      if (status === 402) {
        const header = decodePaymentRequiredHeader(r.headers.get('payment-required')!);
        expect(header.extensions).toEqual(body.extensions);
        expect(header.accepts[0]!.payTo).toBe(seller);
      }
    }
    expect(await b.summary()).toMatchObject({ vouchers: 3, accrued: '3', authorizedVouchers: 0, worthRedeeming: false, broadcast: false });
    expect(b.settle).not.toHaveBeenCalled();
  });
  it('retains a real EIP-712 signature without paying, and counts an x402 retry only once', async () => {
    const b = await boot(), request = b.request('same');
    const first = await b.offer(request), signed = await b.sign(first.extensions);
    const r = await b.post(request, signed); expect(r.status).toBe(402);
    expect((await r.json()).fee.status).toContain('signature verified');
    const replay = await b.post(request, signed); expect((await replay.json()).fee.status).toContain('already retained');
    expect(await b.summary()).toMatchObject({ vouchers: 1, accrued: '1', authorizedVouchers: 1, authorizedAccrued: '1', broadcast: false });
    expect(JSON.stringify(await b.summary())).not.toContain('signature');
    expect(b.settle).not.toHaveBeenCalled(); expect(b.check).not.toHaveBeenCalled();
    b.advance(901_000);
    expect(await b.summary()).toMatchObject({ authorizedVouchers: 1, unexpiredAuthorizedVouchers: 0, unexpiredAuthorizedAccrued: '0', worthRedeeming: false });
  });
  it('keeps optional fees separate from the seller transfer', async () => {
    const b = await boot(), req = b.request('paid');
    const first = await b.offer(req), fee = await b.sign(first.extensions);
    const main = encodePaymentSignatureHeader({ x402Version: 2, accepted: template, payload: { fixture: 'seller authorization' } } as never);
    const r = await b.post(req, fee, main); expect(r.status).toBe(200);
    expect(b.settle).toHaveBeenCalledOnce();
    expect(b.settle).toHaveBeenCalledWith(expect.objectContaining({ payload: { fixture: 'seller authorization' } }), expect.objectContaining({ payTo: seller, amount: '80' }));
    const result = await r.json(); expect(result.settlement.requirement.payTo).toBe(seller);
    expect(result.fee.paid).toBe(false);
    expect(await b.summary()).toMatchObject({ authorizedVouchers: 1, broadcast: false });
  });
  it('does not hold a refusal hostage to a missing, malformed or invalid fee signature', async () => {
    const b = await boot(), req = b.request('denied', DEMO_POLICY.forbid[0]);
    for (const header of [undefined, 'bad', encodePaymentSignatureHeader({ bad: true } as never)]) {
      const r = await b.post(req, header); expect(r.status).toBe(200); expect((await r.json()).verdict).toBe('deny');
    }
    expect(await b.summary()).toMatchObject({ vouchers: 1, authorizedVouchers: 0 });
  });
  it('binds signatures to the request; rejects changed content, amount, nonce, recipient and signature', async () => {
    const b = await boot(), req = b.request('bound'), first = await b.offer(req), raw = await b.sign(first.extensions);
    const altered = { ...req, what: DEMO_POLICY.allow[1] };
    expect((await (await b.post(altered, raw)).json()).fee.status).toContain('rejected');
    const p = decodePaymentSignatureHeader(raw) as any;
    for (const change of [
      (v: any) => { v.payload.authorization.value = '2'; },
      (v: any) => { v.payload.authorization.to = seller; },
      (v: any) => { v.payload.authorization.nonce = '0x' + 'f'.repeat(64); },
      (v: any) => { v.payload.signature = '0x' + '0'.repeat(130); },
    ]) {
      const v = structuredClone(p); change(v);
      expect((await (await b.post(req, encodePaymentSignatureHeader(v))).json()).fee.status).toContain('rejected');
    }
    expect(await b.summary()).toMatchObject({ authorizedVouchers: 0 });
  });
  it('rejects expired and too-long authorizations without failing the original request', async () => {
    const b = await boot(), req = b.request('expired'), offer = await b.offer(req), info = offer.extensions['yohaku-routing-fee'].info;
    const long = await signAuthorization({ privateKey: key, requirement: info.requirement, nonce: info.nonce, resourceUrl: b.base + '/requests', validBeforeMs: (info.expiresAt + 900) * 1000, now: () => new Date(b.time()) });
    expect((await (await b.post(req, encodePaymentSignatureHeader(long as never))).json()).fee.status).toContain('rejected');
    const raw = await b.sign(offer.extensions); b.advance(901_000);
    expect((await (await b.post(req, raw)).json()).fee.status).toContain('rejected');
    expect(await b.summary()).toMatchObject({ authorizedVouchers: 0 });
  });
  it('is absent when disabled and ignores unsolicited fee headers', async () => {
    const b = await boot(false), r = await b.post(b.request('off'), 'bad');
    expect(r.status).toBe(402); expect((await r.json()).extensions).toBeUndefined();
    expect((await fetch(b.base + '/fees')).status).toBe(404);
  });
  it('records work with no settlement configuration without inventing a payable requirement', () => {
    const f = new RoutingFees({ payTo: feeAddress, perDecision: 1, redeemAbove: 2 });
    const q = f.record({ id: 'offline', who: 'a', what: 'b', purpose: 'other', price: { amount: 1, currency: 'JPYC' }, deadline: new Date().toISOString() }, Date.now());
    expect(f.extensions(q)).toBeUndefined(); expect(f.summary()).toMatchObject({ vouchers: 1, authorizationAvailable: false });
  });
});
describe('fee spending and configuration boundaries', () => {
  it('signs nothing unless explicitly enabled and rejects offers outside pinned limits', async () => {
    const b = await boot(), offer = await b.offer(b.request('optin'));
    expect(await b.sign(offer.extensions, { ...agentEnv, AGENT_PAY_ROUTING_FEE: 'false' })).toBeUndefined();
    for (const override of [{ AGENT_FEE_MAX_ATOMIC: '0' }, { AGENT_FEE_ADDRESS: seller }, { X402_NETWORK: 'eip155:1' }, { X402_ASSET: seller }]) {
      await expect(b.sign(offer.extensions, { ...agentEnv, ...override })).rejects.toThrow('spending permission');
    }
  });
  it('rejects invalid rates and addresses while an unset address stays disabled', () => {
    expect(feesFromEnv({})).toBeUndefined();
    for (const v of ['0', '-1', 'NaN', '1.5', '9007199254740992']) expect(() => feesFromEnv({ YOHAKU_FEE_ADDRESS: feeAddress, YOHAKU_FEE_PER_DECISION: v })).toThrow();
    expect(() => feesFromEnv({ YOHAKU_FEE_ADDRESS: 'invalid' })).toThrow();
  });
  it('keeps large sums exact and does not count unsigned work as signed fees', () => {
    const l = new FeeLedger({ payTo: feeAddress, perDecision: Number.MAX_SAFE_INTEGER, redeemAbove: 1 });
    l.record('a', 'now'); l.record('b', 'now'); l.record('a', 'retry');
    expect(l.summary()).toMatchObject({ vouchers: 2, accrued: String(2n * BigInt(Number.MAX_SAFE_INTEGER)), authorizedAccrued: '0', worthRedeeming: false });
  });
});
