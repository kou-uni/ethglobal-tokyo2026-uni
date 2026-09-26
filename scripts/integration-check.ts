/**
 * Architecture acceptance audit, separate from unit-test counts.
 * npm run integration:check -- [--live] [--env path] [--output path]
 *
 * Local mode uses real HTTP, routing, x402 encoding/signing and the real adapters
 * against explicitly simulated providers. No chain writes or real proof verification.
 * --live additionally reads configured providers and previously recorded receipts.
 * Missing connections exit 2; failed assertions or unavailable dependencies exit 1.
 * Secrets, cookies, proofs and payment authorizations are never written to evidence.
 */
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createPublicClient, decodeEventLog, http, parseAbi, verifyTypedData, verifyMessage, type Address, type Hex } from 'viem';
import { sepolia, baseSepolia } from 'viem/chains';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { encodePaymentSignatureHeader } from '@x402/core/http';
import { loadEnv } from '../src/core/env.js';
import { DEMO_POLICY, KNOWN_PARTIES, MORNING } from '../src/core/night.js';
import { createApp } from '../src/server/app.js';
import { Store } from '../src/server/state.js';
import { RoutingFees } from '../src/server/routing-fees.js';
import type { IdkitApprovalOptions } from '../src/server/idkit-approval.js';
import { idkitApprovalFromEnv } from '../src/server/idkit-config.js';
import { OwnerAuth } from '../src/server/owner-auth.js';
import { InterceptaScreening, interceptaFromEnv } from '../src/adapters/intercepta.js';
import { X402Settlement } from '../src/adapters/x402.js';
import { signAuthorization, chainIdOf } from '../src/adapters/eip3009.js';
import { EnsPermissions } from '../src/adapters/ens-permissions.js';
import { KEYS, MockPermissions } from '../src/ports/permissions.js';
import { MockClassifier } from '../src/ports/classifier.js';
import { MockScreening, FIXTURES } from '../src/ports/screening.js';
import { serverPolicy } from '../src/server/policy.js';
import type { PaymentRequirement } from '../src/ports/settlement.js';

const args = process.argv.slice(2);
function option(name: string, fallback: string) {
  const at = args.indexOf(name);
  if (at < 0) return fallback;
  if (!args[at + 1] || args[at + 1]!.startsWith('--')) throw new Error(`Missing ${name}`);
  return args[at + 1]!;
}
const live = args.includes('--live');
if (live) loadEnv(option('--env', '.env'));
const read = (file: string) => JSON.parse(readFileSync(file, 'utf8'));
type Outcome = { name: string; status: 'pass' | 'gap' | 'blocked' | 'fail'; detail: unknown };
const results: Outcome[] = [];
const servers: Server[] = [];
async function listen(server: Server) {
  servers.push(server);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return `http://127.0.0.1:${(server.address() as { port: number }).port}`;
}
async function test(name: string, run: () => Promise<unknown>) {
  try {
    const detail = await run();
    results.push({ name, status: 'pass', detail });
    console.log(`PASS ${name}`);
  } catch (error) {
    // Provider exception messages may contain credentialled URLs or request bodies.
    const isAssertion = error instanceof assert.AssertionError;
    results.push({ name, status: isAssertion ? 'fail' : 'blocked',
      detail: isAssertion ? error.message : {
        error: error instanceof Error ? error.name : 'unknown error',
        code: error instanceof Error && error.cause && typeof error.cause === 'object' && 'code' in error.cause
          ? String(error.cause.code) : null,
        note: 'Raw provider errors omitted because they may contain credentials.',
      } });
    console.log(`${isAssertion ? 'FAIL' : 'BLOCKED'} ${name}`);
  }
}
function gap(name: string, detail: unknown) {
  results.push({ name, status: 'gap', detail });
  console.log(`GAP ${name}`);
}
async function fetchTimed(url: string, init: RequestInit = {}) {
  return fetch(url, { ...init, signal: AbortSignal.timeout(20_000) });
}
async function bodyOf(req: import('node:http').IncomingMessage) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return JSON.parse(raw || '{}');
}
const json = (res: import('node:http').ServerResponse, status: number, data: unknown) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(data));
};
const post = (base: string, path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetchTimed(base + path, { method: 'POST', redirect: 'manual',
    headers: { 'content-type': 'application/json', origin: base, ...headers }, body: JSON.stringify(body) });
const types = { TransferWithAuthorization: [
  { name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'value', type: 'uint256' },
  { name: 'validAfter', type: 'uint256' }, { name: 'validBefore', type: 'uint256' }, { name: 'nonce', type: 'bytes32' },
] } as const;

async function localAudit() {
  const buyerKey = generatePrivateKey(); // Ephemeral, unfunded and never exported.
  const ownerWallet = privateKeyToAccount(generatePrivateKey());
  const receiver = privateKeyToAccount(generatePrivateKey()).address;
  const asset = privateKeyToAccount(generatePrivateKey()).address;
  const flagged = privateKeyToAccount(generatePrivateKey()).address;
  const unavailable = privateKeyToAccount(generatePrivateKey()).address;
  const clean = privateKeyToAccount(buyerKey).address;
  let scans = 0, settlements = 0, checks = 0, clock = MORNING.getTime(), worldAccepts = true;
  const used = new Set<string>();
  const provider = await listen(createServer(async (req, res) => {
    try {
      const path = new URL(req.url!, 'http://localhost').pathname;
      if (path.startsWith('/scan/')) {
        scans++;
        const addr = path.slice('/scan/'.length);
        if (addr === unavailable) return json(res, 503, { error: 'simulated outage' });
        return json(res, 200, { toxicScore: addr === flagged ? 100 : 0,
          traits: addr === flagged ? [{ risk: 100, name: 'fixture', description: 'Simulated flagged source.' }] : [] });
      }
      if (path === '/supported') return json(res, 200, {
        kinds: [{ x402Version: 2, scheme: 'exact', network: 'eip155:84532' }], extensions: [], signers: {},
      });
      const body = await bodyOf(req);
      const p = body.paymentPayload, r = body.paymentRequirements as PaymentRequirement;
      const a = p?.payload?.authorization;
      let valid = Boolean(a && p.x402Version === 2 && p.accepted?.network === r.network
        && p.accepted?.asset === r.asset && a.to === r.payTo && a.value === r.amount
        && Number(a.validAfter) <= clock / 1000 && Number(a.validBefore) > clock / 1000);
      if (valid) valid = await verifyTypedData({
        address: a.from, signature: p.payload.signature,
        domain: { name: String(r.extra?.name), version: String(r.extra?.version),
          chainId: chainIdOf(r.network), verifyingContract: r.asset as Address },
        types, primaryType: 'TransferWithAuthorization',
        message: { from: a.from, to: a.to, value: BigInt(a.value), validAfter: BigInt(a.validAfter),
          validBefore: BigInt(a.validBefore), nonce: a.nonce },
      });
      if (path === '/verify') {
        checks++;
        return json(res, 200, { isValid: valid, ...(valid ? { payer: a.from } : { invalidReason: 'invalid fixture authorization' }) });
      }
      if (path !== '/settle') return json(res, 404, {});
      if (!valid || used.has(a.nonce)) return json(res, 200, { success: false, errorReason: 'invalid or reused authorization' });
      used.add(a.nonce); settlements++;
      return json(res, 200, { success: true, transaction: `simulated-${settlements}`, network: r.network, payer: a.from });
    } catch { json(res, 400, { error: 'invalid fixture request' }); }
  }));
  const settlement = new X402Settlement({ facilitatorUrl: provider, network: 'eip155:84532',
    asset, payTo: receiver, assetName: 'USDC', assetVersion: '2', atomicPerUnit: 1, maxTimeoutSeconds: 60 });
  const screening = new InterceptaScreening({ baseUrl: provider, scanPath: '/scan/{address}',
    authHeader: 'x-fixture', apiKey: 'simulated', cacheMs: 0 });
  const permissions = new MockPermissions();
  const account = receiver;
  permissions.grant(DEMO_POLICY.owner, account, KEYS.proposal);
  permissions.grant(DEMO_POLICY.owner, ownerWallet.address, KEYS.policy);
  const store = new Store(KNOWN_PARTIES);
  const fees = new RoutingFees({ payTo: receiver, perDecision: 1, redeemAbove: 10 }, settlement.quote(1, 'JPYC'));
  const idkit: IdkitApprovalOptions = {
    origin: 'http://127.0.0.1:0', appId: 'app_fixture', action: 'fixture-approval',
    sign: () => ({ rp_id: 'rp_fixture', nonce: 'fixture', signature: 'fixture',
      created_at: Math.floor(clock / 1000), expires_at: Math.floor(clock / 1000) + 120 }),
    verify: async () => {
      if (!worldAccepts) throw new Error('Simulated proof rejection');
      return { verified: true, environment: 'production', protocolVersion: '3.0', credential: 'orb',
        checkedAt: new Date(clock).toISOString() };
    },
    assets: { page: readFileSync('setup/idkit-approval.html', 'utf8'), js: new Uint8Array(), wasm: new Uint8Array() },
  };
  const base = await listen(createApp({ policy: DEMO_POLICY, store, fees, screening, screeningWired: true,
    settlement, demoBuyerKey: buyerKey, idkitDemo: idkit,
    classifier: { classify: r => new MockClassifier(r.what === 'unknown/audit' ? 'drop' : 'ask').classify(r) },
    delegation: { port: permissions, account }, now: () => new Date(clock) }));
  idkit.origin = base;
  idkit.owner = new OwnerAuth({
    origin: base, name: DEMO_POLICY.owner, address: ownerWallet.address,
    verify: (message, signature) => verifyMessage({ address: ownerWallet.address, message, signature }),
    authority: () => permissions.canWrite(DEMO_POLICY.owner, ownerWallet.address, KEYS.policy),
  }, () => clock);
  const routine = (id: string, over: Record<string, unknown> = {}) => ({
    id, who: KNOWN_PARTIES[0], what: DEMO_POLICY.allow[0], purpose: 'demand-estimation',
    price: { amount: 120, currency: 'JPYC' }, deadline: new Date(clock + 600_000).toISOString(),
    payoutAddress: clean, ...over,
  });
  async function signed(requirement: PaymentRequirement) {
    return encodePaymentSignatureHeader(await signAuthorization({ privateKey: buyerKey, requirement,
      validBeforeMs: clock + 7 * 3_600_000, now: () => new Date(clock), resourceUrl: base + '/requests' }) as never);
  }
  async function paidRequest(request: Record<string, unknown>) {
    return post(base, '/requests', request, { 'PAYMENT-SIGNATURE': await signed(settlement.quote(
      (request.price as { amount: number }).amount, 'JPYC')) });
  }
  async function visit() {
    const r = await fetchTimed(base + '/try', { method: 'POST', redirect: 'manual',
      headers: { origin: base }, body: new URLSearchParams({ payTo: receiver }) });
    assert.equal(r.status, 302);
    const cookie = r.headers.get('set-cookie')!.split(';')[0]!;
    const id = r.headers.get('location')!.split('/').at(-1)!;
    const page = await fetchTimed(base + '/world-approval?id=' + id, { headers: { cookie } });
    const snapshot = (await page.text()).match(/id="snapshot" value="([^"]+)"/)![1]!;
    const challenge = await post(base, '/world-approval/challenge', { requestId: id, snapshot }, { cookie });
    assert.equal(challenge.status, 200);
    const c = await challenge.json() as { id: string };
    return { id, cookie, challenge: c.id };
  }
  await test('x402 v2 support and unpaid quote', async () => {
    await settlement.assertSupported();
    const r = await post(base, '/requests', routine('quote'));
    assert.equal(r.status, 402); assert.ok(r.headers.get('payment-required')); assert.equal(settlements, 0);
    return { status: r.status, settlements, provider: 'local simulated facilitator' };
  });
  await test('declared clean source -> real signing -> x402 HTTP -> ledger', async () => {
    const r = await paidRequest(routine('paid'));
    const body = await r.json() as any;
    assert.equal(r.status, 200); assert.equal(body.settlement.status, 'settled');
    assert.equal(settlements, 1); assert.equal(store.received()[0]?.amount, 120);
    return { status: r.status, rule: body.rule, settlement: body.settlement.status, onchain: false };
  });
  for (const [name, address] of [['flagged', flagged], ['unavailable', unavailable]] as const) {
    await test(`screening ${name} -> deny without settlement`, async () => {
      const before = settlements;
      const r = await paidRequest(routine(name, { payoutAddress: address }));
      const body = await r.json() as any;
      assert.equal(body.verdict, 'deny'); assert.equal(body.rule, 4); assert.equal(settlements, before);
      const dropped = await (await fetchTimed(base + '/dropped')).text();
      assert.ok(dropped.includes(body.reason), 'Every request retains its own refusal reason');
      return { verdict: body.verdict, rule: body.rule, settlementsAdded: settlements - before };
    });
  }
  await test('delegate permission refusal and revoked proposal refusal', async () => {
    const a = await (await post(base, '/requests', routine('permission', { actingAs: 'delegate', writeTarget: 'permission' }))).json() as any;
    assert.equal(a.rule, 0); assert.equal(a.verdict, 'deny');
    permissions.revokeDelegation(DEMO_POLICY.owner, account);
    const b = await (await post(base, '/requests', routine('revoked', { actingAs: 'delegate', writeTarget: 'proposal' }))).json() as any;
    assert.equal(b.rule, 0); assert.equal(b.verdict, 'deny');
    return { permission: a.verdict, afterRevocation: b.verdict, provider: 'simulated ENS permission state' };
  });
  await test('unknown topic -> classifier drop -> no payment', async () => {
    const before = settlements;
    const b = await (await paidRequest(routine('model', { what: 'unknown/audit' }))).json() as any;
    assert.equal(b.verdict, 'deny'); assert.equal(b.rule, 9); assert.equal(settlements, before);
    return { rule: b.rule, verdict: b.verdict, provider: 'MockClassifier' };
  });
  await test('ordinary human request -> wallet owner login -> World approval -> settlement', async () => {
    const before = settlements;
    const r = await paidRequest(routine('ordinary-held', { what: DEMO_POLICY.sensitive[0] }));
    const b = await r.json() as any;
    assert.equal(r.status, 202); assert.equal(b.payment.accepted, true);
    assert.equal(settlements, before); assert.ok(checks > 0);
    const screen = await fetchTimed(base + '/approve/ordinary-held');
    const approval = await post(base, '/approvals/ordinary-held', { approve: true });
    assert.equal(screen.status, 403); assert.equal(approval.status, 403);
    const loginChallenge = await post(base, '/owner/challenge', {});
    const loginCookie = loginChallenge.headers.get('set-cookie')!.split(';')[0]!;
    const { message } = await loginChallenge.json() as { message: string };
    const session = await post(base, '/owner/session', { signature: await ownerWallet.signMessage({ message }) }, { cookie: loginCookie });
    assert.equal(session.status, 200);
    const cookie = session.headers.get('set-cookie')!.split(';')[0]!;
    const page = await fetchTimed(base + '/world-approval?id=ordinary-held', { headers: { cookie } });
    const snapshot = (await page.text()).match(/id="snapshot" value="([^"]+)"/)![1]!;
    const challenge = await post(base, '/world-approval/challenge', { requestId: 'ordinary-held', snapshot }, { cookie });
    assert.equal(challenge.status, 200);
    const c = await challenge.json() as { id: string };
    const verified = await post(base, '/world-approval/verify', { id: c.id, proof: {} }, { cookie });
    assert.equal(verified.status, 200);
    assert.equal((await verified.json() as any).settlement.settled, true);
    assert.equal(settlements, before + 1);
    return { walletSignature: 'real cryptography, ephemeral wallet', World: 'simulated verifier', settlementsAdded: 1 };
  });
  await test('visitor proof -> payment once; replay refused', async () => {
    const before = settlements, scansBefore = scans;
    const v = await visit();
    const b = await (await post(base, '/world-approval/verify', { id: v.challenge, proof: {} }, { cookie: v.cookie })).json() as any;
    assert.equal(b.verdict, 'approved'); assert.equal(b.settlement.settled, true);
    assert.equal(settlements, before + 1);
    assert.equal((await post(base, '/world-approval/verify', { id: v.challenge, proof: {} }, { cookie: v.cookie })).status, 400);
    assert.ok(scans > scansBefore, 'Visitor fixture must be screened');
    return { proof: 'simulated verifier result', settlement: 'local HTTP facilitator', onchain: false, replayStatus: 400 };
  });
  for (const mode of ['cancel', 'reject', 'expire'] as const) {
    await test(`visitor ${mode} -> no payment`, async () => {
      const before = settlements, v = await visit();
      if (mode === 'cancel') await post(base, '/world-approval/cancel', { id: v.challenge }, { cookie: v.cookie });
      if (mode === 'reject') worldAccepts = false;
      if (mode === 'expire') clock += 121_000;
      const r = await post(base, '/world-approval/verify', { id: v.challenge, proof: {} }, { cookie: v.cookie });
      worldAccepts = true;
      assert.ok(r.status >= 400); assert.equal(settlements, before);
      assert.notEqual(store.get(v.id)?.resolution, 'approved');
      return { status: r.status, settlementsAdded: settlements - before };
    });
  }
  await test('fees remain accounting only', async () => {
    const b = await (await fetchTimed(base + '/fees')).json() as any;
    assert.ok(b.vouchers > 0); assert.equal(b.broadcast, false); assert.equal(b.authorizedVouchers, 0);
    return { vouchers: b.vouchers, broadcast: false, collected: false };
  });
  await test('architecture discovery endpoint', async () => {
    const r = await fetchTimed(base + '/.well-known/agent-card.json');
    assert.equal(r.status, 200);
    const card = await r.json() as any;
    assert.equal(card.protocolVersion, '0.3.0');
    const response = await post(base, '/a2a', {
      jsonrpc: '2.0', id: 'audit', method: 'message/send',
      params: { message: { kind: 'message', messageId: 'audit-card', role: 'user', parts: [{ kind: 'data', data: routine('a2a', { what: DEMO_POLICY.forbid[0] }) }] } },
    }, { 'X-A2A-Extensions': card.capabilities.extensions[0].uri });
    const result = await response.json() as any;
    assert.equal(result.result.status.state, 'rejected');
    return { status: r.status, protocolVersion: card.protocolVersion, transport: 'JSON-RPC', routedVerdict: 'deny' };
  });
  await test('missing payment source behavior', async () => {
    const before = settlements, scansBefore = scans;
    const r = await paidRequest(routine('unscreened', { payoutAddress: undefined }));
    const b = await r.json() as any;
    assert.equal(settlements, before + 1);
    assert.ok(scans > scansBefore, 'Signed payer must be screened when no source is declared');
    assert.equal(b.verdict, 'auto');
    return { status: r.status, scans: scans - scansBefore };
  });
  await test('expired or malformed intake deadline behavior', async () => {
    const observed = [];
    for (const deadline of [new Date(clock - 60_000).toISOString(), 'not-a-date']) {
      const before = settlements;
      const r = await paidRequest(routine(`deadline-${observed.length}`, { deadline }));
      const b = await r.json() as any;
      observed.push({ deadline, status: r.status, verdict: b.verdict, settlementsAdded: settlements - before });
    }
    assert.ok(observed.every(x => x.settlementsAdded === 0));
    assert.deepEqual(observed.map(x => x.status), [410, 400]);
    return observed;
  });
  await test('same request ID with fresh payment authorization', async () => {
    const before = settlements;
    await paidRequest(routine('duplicate'));
    await paidRequest(routine('duplicate'));
    assert.equal(settlements - before, 1);
    return { payments: settlements - before };
  });
  await test('queue cap after previous requests were answered', async () => {
    for (let i = 0; i < 3; i++) await post(base, '/requests', routine(`cap-${i}`, { what: `unknown/cap-${i}`, who: `new-${i}` }));
    const first = await (await fetchTimed(base + '/ledger/' + DEMO_POLICY.owner)).json() as any;
    assert.equal(first.needsYou.length, DEMO_POLICY.dailyCap);
    // Model the state after decisions; this probes accounting across calls, not authentication.
    for (const bundle of first.needsYou) for (const id of bundle.ids) store.get(id)!.resolution = 'ignored';
    const second = await (await fetchTimed(base + '/ledger/' + DEMO_POLICY.owner)).json() as any;
    assert.equal(second.needsYou.length, 0, 'Answering requests cannot create extra slots on the same day');
    return { first: first.needsYou.length, second: second.needsYou.length };
  });
}

async function liveAudit() {
  const directory = read('docs/koe/directory.json');
  const publicBase: string = directory.profiles[0].router;
  await test('live public deployment health', async () => {
    const r = await fetchTimed(publicBase + '/health');
    assert.equal(r.status, 200);
    const health = await r.json();
    return { endpoint: publicBase, health, cors: r.headers.get('access-control-allow-origin') };
  });
  await test('live Intercepta -> HTTP router clean/flagged', async () => {
    const config = interceptaFromEnv(process.env);
    if (!config) throw new Error('Screening configuration missing');
    const screening = new InterceptaScreening(config);
    const base = await listen(createApp({ policy: DEMO_POLICY, store: new Store(KNOWN_PARTIES), screening, screeningWired: true }));
    const observations = [];
    for (const [label, address] of [['clean', FIXTURES.clean], ['flagged', FIXTURES.flagged]] as const) {
      assert.ok(address);
      const r = await post(base, '/requests', { who: KNOWN_PARTIES[0], what: DEMO_POLICY.allow[0],
        purpose: 'demand-estimation', price: { amount: 120, currency: 'JPYC' },
        deadline: new Date(Date.now() + 600_000).toISOString(), payoutAddress: address });
      const b = await r.json() as any;
      assert.equal(b.verdict, label === 'clean' ? 'auto' : 'deny');
      assert.equal(b.rule, label === 'clean' ? 8 : 4);
      observations.push({ fixture: label, status: r.status, verdict: b.verdict, rule: b.rule, reason: b.reason });
    }
    return { observations, payment: 'disabled' };
  });
  await test('live ENS -> HTTP revoked delegation denial', async () => {
    const deployment = read('config/ens-deployment.json');
    const evidence = read('docs/build/evidence/ens-delegation.json');
    const client = createPublicClient({ chain: sepolia, transport: http(process.env.SEPOLIA_RPC_URL ??
      read('config/ens-suggestions.json').rpc.value, { retryCount: 0, timeout: 15_000 }) });
    const port = new EnsPermissions(client, { name: deployment.name, resolver: deployment.resolver });
    const revoked = await port.isDelegationRevoked(deployment.name, evidence.delegate);
    assert.equal(revoked, true);
    const base = await listen(createApp({ policy: serverPolicy(deployment.name),
      store: new Store(KNOWN_PARTIES), screening: new MockScreening(),
      delegation: { port, account: evidence.delegate } }));
    const b = await (await post(base, '/requests', { who: KNOWN_PARTIES[0], what: DEMO_POLICY.allow[0],
      purpose: 'demand-estimation', price: { amount: 120, currency: 'JPYC' },
      deadline: new Date(Date.now() + 600_000).toISOString(), actingAs: 'delegate', writeTarget: 'proposal' })).json() as any;
    assert.equal(b.verdict, 'deny'); assert.equal(b.rule, 0);
    return { name: deployment.name, revoked, blockNumber: String(await client.getBlockNumber()), verdict: b.verdict, rule: b.rule };
  });
  await test('live World RP registration and local approval configuration', async () => {
    const config = read('config/world-idkit.json');
    const url = new URL(config.verifyBaseUrl);
    url.pathname = url.pathname.replace(/\/verify$/, '/rp-status/') + config.rpId;
    const r = await fetchTimed(String(url));
    assert.equal(r.status, 200);
    const status = await r.json() as any;
    const opts = await idkitApprovalFromEnv({ ...process.env, WORLD_IDKIT_DEMO_ENABLED: 'true',
      WORLD_IDKIT_DEPLOYMENT: 'local', WORLD_IDKIT_ORIGIN: 'http://127.0.0.1:8426' });
    assert.ok(opts); assert.ok(opts.assets.js.length); assert.ok(opts.assets.wasm.length);
    assert.equal(status.production_status, 'registered');
    return { rpStatus: status.production_status, signerAndBundle: 'valid', freshHumanProof: 'not performed' };
  });
  await test('live x402 facilitator support', async () => {
    const values = read('config/x402-suggestions.json').values;
    const r = await fetchTimed(values.X402_FACILITATOR_URL.value + '/supported');
    assert.equal(r.status, 200);
    const b = await r.json() as any;
    assert.ok(b.kinds.some((k: any) => k.x402Version === 2 && k.scheme === 'exact' && k.network === values.X402_NETWORK.value));
    return { network: values.X402_NETWORK.value, x402Version: 2, scheme: 'exact', newPayment: false };
  });
  await test('re-read historical World/payment and screening/payment receipts', async () => {
    const client = createPublicClient({ chain: baseSepolia,
      transport: http(process.env.BASE_SEPOLIA_RPC_URL ?? baseSepolia.rpcUrls.default.http[0], { retryCount: 0, timeout: 15_000 }) });
    const world = read('docs/build/evidence/world-public-payment.json');
    const screen = read('docs/build/evidence/screening-with-settlement.json');
    const abi = parseAbi(['event Transfer(address indexed from, address indexed to, uint256 value)']);
    const cases = [
      { hash: world.receipt.transaction, value: '4200', asset: world.receipt.asset, to: world.receipt.transfers[0].to },
      { hash: screen.cleared.settlement.transaction, value: '120', asset: screen.cleared.settlement.asset,
        to: screen.cleared.confirmedFromTheChain.transferLog.split(' -> ')[1].split(',')[0] },
    ];
    const observations = await Promise.all(cases.map(async c => {
      const receipt = await client.getTransactionReceipt({ hash: c.hash as Hex });
      assert.equal(receipt.status, 'success');
      const transfer = receipt.logs.filter(l => l.address.toLowerCase() === c.asset.toLowerCase()).some(l => {
        try {
          const e = decodeEventLog({ abi, data: l.data, topics: l.topics });
          return e.args.value === BigInt(c.value) && e.args.to.toLowerCase() === c.to.toLowerCase();
        } catch { return false; }
      });
      assert.ok(transfer);
      return { transaction: c.hash, blockNumber: String(receipt.blockNumber), amountAtomic: c.value, transferMatches: transfer };
    }));
    return { observations, newPayment: false, note: 'Receipts re-read now; World proof is historical evidence only.' };
  });
}

try {
  await localAudit();
  if (live) await liveAudit();
} catch (error) {
  results.push({ name: 'audit setup', status: 'blocked', detail: error instanceof Error ? error.name : 'unknown error' });
} finally {
  for (const server of servers.reverse()) {
    server.closeAllConnections();
    if (server.listening) await new Promise<void>(r => server.close(() => r()));
  }
}
const counts = { pass: 0, gap: 0, blocked: 0, fail: 0 };
for (const r of results) counts[r.status]++;
const report = { checkedAt: new Date().toISOString(),
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  includesWorkingTreeChanges: Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()),
  mode: live ? 'local-simulated-providers-and-live-read-only-probes' : 'local-simulated-providers',
  automatedChecksPassed: !counts.gap && !counts.blocked && !counts.fail, counts, results,
  limitations: ['Local proof verifier and facilitator are simulated; no new human proof or blockchain payment.',
    'No private key, browser cookie, raw proof or payment authorization is included.',
    'Live health describes configuration, not successful end-to-end execution.'] };
const output = option('--output', '/tmp/yohaku-integration-audit.json');
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ counts, automatedChecksPassed: report.automatedChecksPassed, output }));
process.exitCode = counts.fail || counts.blocked ? 1 : counts.gap ? 2 : 0;
