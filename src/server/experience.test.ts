import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { Server } from 'node:http';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { createApp, type AppDeps } from './app.js';
import { DEMO_POLICY, KNOWN_PARTIES } from '../core/night.js';
import { Store } from './state.js';
import type { IdkitApprovalOptions } from './idkit-approval.js';
import type { ScreeningResult } from '../core/types.js';

const servers: Server[] = [];
afterEach(async () => { for (const s of servers.splice(0)) await new Promise<void>(r => s.close(() => r())); });
const config = JSON.parse(readFileSync(new URL('../../config/x402-suggestions.json', import.meta.url), 'utf8')).values;
interface JsonResponse extends Response { json(): Promise<any> }
async function boot(overrides: Partial<AppDeps> = {}) {
  let time = new Date('2026-09-26T12:00:00Z').getTime(), risk: ScreeningResult = 'clean';
  const key = generatePrivateKey(), receiver = privateKeyToAccount(generatePrivateKey()).address;
  const verify = vi.fn(async () => ({ verified: true, environment: 'production',
    protocolVersion: '3.0' as const, credential: 'orb', checkedAt: new Date(time).toISOString() }));
  const settle = vi.fn(async () => ({ status: 'settled' as const, transaction: 'test-receipt', network: config.X402_NETWORK.value }));
  const check = vi.fn(async () => ({ status: 'settled' as const, transaction: '', network: config.X402_NETWORK.value }));
  const scan = vi.fn(async () => risk);
  const classify = vi.fn(async () => ({ category: 'unknown', sensitivity: 'unclear' as const, suggestion: 'ask' as const, reasoning: 'ask the person' }));
  const options: IdkitApprovalOptions = {
    origin: 'http://127.0.0.1:0', appId: 'app_test', action: 'demo-approval', verify,
    sign: () => ({ rp_id: 'rp_test', nonce: 'nonce', signature: 'sig', created_at: Math.floor(time / 1000), expires_at: Math.floor(time / 1000) + 120 }),
    assets: { page: '', js: new Uint8Array(), wasm: new Uint8Array() },
  };
  const server = createApp({
    policy: DEMO_POLICY, store: new Store(KNOWN_PARTIES), idkitDemo: options,
    experience: { page: readFileSync(new URL('../../setup/experience.html', import.meta.url), 'utf8'), js: new Uint8Array() },
    screening: { scan }, screeningWired: true, classifier: { classify }, demoBuyerKey: key,
    settlement: { live: true, check, settle, quote: (amount, _currency, payTo) => ({
      scheme: 'exact', amount: String(amount), asset: config.X402_ASSET.value, network: config.X402_NETWORK.value,
      payTo: payTo!, maxTimeoutSeconds: 60, extra: { name: config.X402_ASSET_NAME.value, version: '2' },
    }) },
    now: () => new Date(time), ...overrides,
  });
  servers.push(server); await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
  options.origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const url = options.origin;
  const post = (path:string, body:unknown, cookie:string, origin=url) => fetch(url+'/experience/'+path, {
    method:'POST', headers:{ origin, cookie, 'content-type':'application/json' }, body:JSON.stringify(body),
  }) as Promise<JsonResponse>;
  async function visit() {
    const page = await fetch(url+'/experience'), cookie = page.headers.get('set-cookie')!.split(';')[0]!;
    const first = await post('start', { receiver, consent:true }, cookie);
    let state = await first.json(); const run = state.id as string;
    for(let n=0;n<10;n++) state = await (await post('advance',{run},cookie)).json();
    const call = (path:string, body:Record<string,unknown>={}) => post(path,{run,...body},cookie);
    const get = async (): Promise<any> => (await fetch(url+'/experience/state',{headers:{cookie}})).json();
    async function login() {
      const c = await (await call('challenge')).json();
      const response = await call('verify',{id:c.id,proof:{test:true}});
      expect(response.status).toBe(200); return response.json();
    }
    return {cookie,run,state,call,get,login};
  }
  return {url,post,visit,verify,settle,check,scan,classify,payer:privateKeyToAccount(key).address,
    advance:(ms:number)=>{time+=ms;},risk:(value:ScreeningResult)=>{risk=value;}};
}

describe('browser-owned live journey',()=>{
  it('routes 50 real inputs, calls the model only on rule 9, and funds only two examples',async()=>{
    const b=await boot(),v=await b.visit();
    expect(v.state.processed).toBe(50);expect(v.state.complete).toBe(true);
    expect(b.classify).toHaveBeenCalledOnce();
    expect(v.state.items.filter((i:any)=>i.payment.requirement)).toHaveLength(2);
    expect(v.state.totals).toEqual([]);expect(v.state.surfaced).toEqual([]);
    expect(b.settle).not.toHaveBeenCalled();
    expect((await v.call('collect')).status).toBe(403);
  });
  it('keeps World sign-in separate from payment, then records one delegated receipt across retries',async()=>{
    const b=await boot(),v=await b.visit();
    await v.login();expect(b.settle).not.toHaveBeenCalled();
    const paid=await (await v.call('collect')).json();
    expect(b.settle).toHaveBeenCalledOnce();expect(b.scan).toHaveBeenLastCalledWith(b.payer);
    expect(paid.totals[0]).toMatchObject({amount:'120',automated:'120',answered:'0'});
    expect(paid.items.filter((i:any)=>i.delivered)).toHaveLength(1);
    await v.call('collect');expect(b.settle).toHaveBeenCalledOnce();
    expect((await v.get()).totals[0].amount).toBe('120');
  });
  it('binds the signed payment to the recipient and delivers the personal answer only after settlement',async()=>{
    const b=await boot(),v=await b.visit(),s=await v.login();
    const item=s.items.find((i:any)=>i.decision?.verdict==='human'&&i.payment.requirement);
    const result=await (await v.call('answer',{id:item.id,answer:'I needed a smaller pack.',consent:true})).json();
    expect(b.settle).toHaveBeenCalledOnce();
    const [payload,quote]=b.settle.mock.calls[0] as unknown as [any,any];
    expect(payload.payload.authorization.to).toBe(s.receiver);
    expect(payload.payload.authorization.from).toBe(b.payer);
    expect(payload.payload.authorization.value).toBe(quote.amount);
    expect(result.items.find((i:any)=>i.id===item.id).delivered).toBe('I needed a smaller pack.');
    expect(result.items.find((i:any)=>i.id===item.id).explorer).toBe(config.X402_EXPLORER_URL.value+'test-receipt');
    expect(result.totals[0].answered).toBe(quote.amount);
  });
  it('rejects another browser, another origin, denied requests and requests outside the fixed cap',async()=>{
    const b=await boot(),a=await b.visit(),other=await b.visit(),s=await a.login();
    expect((await b.post('collect',{run:a.run},other.cookie)).status).toBe(409);
    expect((await b.post('collect',{run:a.run},a.cookie,'https://other.example')).status).toBe(403);
    const deny=s.items.find((i:any)=>i.decision?.verdict==='deny');
    const deferred=s.items.find((i:any)=>i.decision?.verdict==='human'&&!s.surfaced.includes(i.id));
    for(const item of [deny,deferred])expect((await a.call('answer',{id:item.id,answer:'not allowed',consent:true})).status).toBe(400);
    expect(b.settle).not.toHaveBeenCalled();expect((await other.get()).authenticated).toBe(false);
  });
  it('does not settle twice on simultaneous answers and does not refill the attention cap',async()=>{
    const b=await boot(),v=await b.visit(),s=await v.login();
    const item=s.items.find((i:any)=>i.decision?.verdict==='human'&&i.payment.requirement);
    const body={id:item.id,answer:'My own answer',consent:true};
    const responses=await Promise.all([v.call('answer',body),v.call('answer',body)]);
    expect(responses.map(r=>r.status).sort()).toEqual([200,409]);
    expect(b.settle).toHaveBeenCalledOnce();expect((await v.get()).surfaced).toEqual(s.surfaced);
  });
  it('keeps unpaid answers out of the buyer inbox and cannot retry an uncertain payment',async()=>{
    const b=await boot(),v=await b.visit(),s=await v.login();
    b.settle.mockRejectedValueOnce(new Error('network uncertainty'));
    const item=s.items.find((i:any)=>i.decision?.verdict==='human'&&i.payment.requirement);
    const body={id:item.id,answer:'private until paid',consent:true};
    const failed=await (await v.call('answer',body)).json();
    expect(failed.totals).toEqual([]);expect(failed.items.find((i:any)=>i.id===item.id).delivered).toBeUndefined();
    expect(JSON.stringify(failed)).not.toContain('private until paid');
    expect((await v.call('answer',body)).status).toBe(409);expect(b.settle).toHaveBeenCalledOnce();
  });
  it('cancellation invalidates an in-flight proof and never grants access',async()=>{
    const b=await boot(),v=await b.visit(),c=await (await v.call('challenge')).json();
    let release!:()=>void;const held=new Promise<void>(r=>release=r);
    b.verify.mockImplementationOnce(async()=>{await held;return {verified:true,environment:'production',protocolVersion:'3.0',credential:'orb',checkedAt:'test'};});
    const verifying=v.call('verify',{id:c.id,proof:{}});
    await vi.waitFor(()=>expect(b.verify).toHaveBeenCalledOnce());
    await v.call('cancel',{id:c.id});release();
    expect((await verifying).status).toBe(400);expect((await v.get()).authenticated).toBe(false);
    expect(b.settle).not.toHaveBeenCalled();
  });
  it('expiry, missing consent, and refusal cannot pay',async()=>{
    const b=await boot(),v=await b.visit(),s=await v.login();
    const item=s.items.find((i:any)=>i.decision?.verdict==='human'&&i.payment.requirement);
    expect((await v.call('answer',{id:item.id,answer:'answer without consent'})).status).toBe(400);
    expect((await v.call('decline',{id:item.id})).status).toBe(200);
    expect((await v.call('answer',{id:item.id,answer:'answer later',consent:true})).status).toBe(409);
    b.advance(16*60*1000);
    expect((await v.call('collect')).status).toBe(403);expect(b.settle).not.toHaveBeenCalled();
  });
  it('re-screens the actual signer and refuses a newly risky payment',async()=>{
    const b=await boot(),v=await b.visit();await v.login();b.risk('unavailable');
    const result=await (await v.call('collect')).json();
    expect(result.totals).toEqual([]);expect(b.settle).not.toHaveBeenCalled();
    expect(b.check).not.toHaveBeenCalled();
  });
  it('shares the existing signing limit and fails visibly when the budget is exhausted',async()=>{
    const b=await boot({demoSignsPerHour:1}),v=await b.visit(),s=await v.login();
    await v.call('collect');const item=s.items.find((i:any)=>i.decision?.verdict==='human'&&i.payment.requirement);
    const result=await (await v.call('answer',{id:item.id,answer:'my answer',consent:true})).json();
    expect(b.settle).toHaveBeenCalledOnce();
    expect(result.items.find((i:any)=>i.id===item.id).payment.error).toBe('demo_payment_limit_reached');
    expect(result.totals[0].amount).toBe('120');
    const invalid=await boot({demoSignsPerHour:Number.NaN}),bad=await invalid.visit();
    await bad.login();await bad.call('collect');expect(invalid.settle).not.toHaveBeenCalled();
  });
  it('does not fund this visitor demo on a different network, even if settlement is configured',async()=>{
    const settle=vi.fn(async()=>({status:'refused' as const,reason:'must not be called'}));
    const b=await boot({settlement:{live:true,settle,check:settle,quote:()=>({
      scheme:'exact',network:'eip155:1',asset:config.X402_ASSET.value,amount:'120',
      payTo:privateKeyToAccount(generatePrivateKey()).address,maxTimeoutSeconds:60,
    })}});
    const v=await b.visit();await v.login();
    expect(v.state.items.some((i:any)=>i.payment.requirement)).toBe(false);
    expect((await v.call('collect')).status).toBe(400);expect(settle).not.toHaveBeenCalled();
  });
  it('lets the model drop an unknown request without giving it an automatic permission',async()=>{
    const b=await boot({classifier:{classify:async()=>({category:'unknown',sensitivity:'unclear',
      suggestion:'drop',reasoning:'Not useful in this example'})}});
    const v=await b.visit(),unknown=v.state.items.find((i:any)=>i.category==='experience/what-changed-your-mind');
    expect(unknown.decision).toMatchObject({verdict:'deny',rule:9});
    expect(unknown.payment.requirement).toBeUndefined();
  });
  it('allows a private World-gated draft without funding, but never pays or delivers it',async()=>{
    const b=await boot({demoBuyerKey:''}),v=await b.visit();
    expect(v.state.wired.payment).toBe(false);
    expect(v.state.items.every((i:any)=>i.reward.preview&&!i.payment.requirement)).toBe(true);
    expect((await v.call('draft',{id:v.state.items[0].id,answer:'private draft',consent:true})).status).toBe(403);
    const s=await v.login(),id=s.surfaced[0];
    expect((await v.call('draft',{id,answer:'private draft'})).status).toBe(400);
    const saved=await (await v.call('draft',{id,answer:'private draft',consent:true})).json();
    expect(saved.items.find((i:any)=>i.id===id).draft).toBe('private draft');
    expect(saved.items.find((i:any)=>i.id===id).delivered).toBeUndefined();
    expect(saved.totals).toEqual([]);expect(b.settle).not.toHaveBeenCalled();
    const other=await b.visit();
    expect((await b.post('draft',{run:v.run,id,answer:'overwrite',consent:true},other.cookie)).status).toBe(409);
    expect(JSON.stringify(await other.get())).not.toContain('private draft');
    b.advance(16*60*1000);
    expect(JSON.stringify(await v.get())).not.toContain('private draft');
    expect((await v.call('draft',{id,answer:'expired edit',consent:true})).status).toBe(403);
  });
  it('displays the configured USDC quote, including a non-default scale, without counting offers as receipts',async()=>{
    const settle=vi.fn(async()=>({status:'settled' as const,transaction:'test-display',network:config.X402_NETWORK.value}));
    const b=await boot({settlement:{live:true,settle,check:async()=>({status:'settled',transaction:'',network:config.X402_NETWORK.value}),
      quote:(amount,_currency,payTo)=>({scheme:'exact',amount:String(amount*17),payTo:payTo!,
        asset:config.X402_ASSET.value,network:config.X402_NETWORK.value,maxTimeoutSeconds:60,
        extra:{name:config.X402_ASSET_NAME.value,version:'2'}})}});
    const v=await b.visit(),s=await v.login();
    const automatic=s.items.find((i:any)=>i.decision?.verdict==='auto'&&i.payment.requirement);
    expect(automatic.reward).toMatchObject({amount:'2040',preview:false});
    expect(automatic.payment.requirement.amount).toBe(automatic.reward.amount);
    expect(s.policy.displayThreshold.amount).toBe('17000');expect(s.totals).toEqual([]);
    const paid=await (await v.call('collect')).json();
    expect(paid.totals[0].amount).toBe('2040');
  });
});
