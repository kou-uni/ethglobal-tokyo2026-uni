/**
 * One browser-owned, temporary demo: emulated demand, real routing, verified access,
 * two explicitly funded examples, and an answer delivered to the emulated buyer only
 * after x402 succeeds. This is not a general owner account or a Koe marketplace.
 */
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { privateKeyToAccount } from 'viem/accounts';
import type { AppDeps } from './app.js';
import { beginDemoBrowser, demoBrowser } from './idkit-approval.js';
import type { IdkitChallenge, IdkitProofSummary } from '../adapters/idkit-proof.js';
import { isAddress, signAuthorization } from '../adapters/eip3009.js';
import { route } from '../core/rules.js';
import { surface } from '../core/queue.js';
import { asQuestion, KNOWN_PARTIES } from '../core/night.js';
import type { AgentRequest, Decision, Policy, ScreeningResult } from '../core/types.js';
import { applyClassification } from '../ports/classifier.js';
import { FIXTURES } from '../ports/screening.js';
import type { PaymentRequirement } from '../ports/settlement.js';

export interface ExperienceAssets { page: string; js: Uint8Array }
type Payment = {
  status: 'not-funded' | 'ready' | 'processing' | 'settled' | 'failed';
  requirement?: PaymentRequirement; transaction?: string; network?: string; error?: string;
};
interface Item {
  request: AgentRequest; decision?: Decision; screening?: ScreeningResult;
  screeningReason?: string; model?: string; modelReason?: string; decidedAt?: string; payment: Payment;
  kind: 'standing' | 'question' | 'forbidden' | 'risk';
  answer?: string; draft?: string; delivered?: string; resolved?: 'answered' | 'declined';
}
interface Run {
  id: string; browser: string; receiver: string; policy: Policy; expires: number;
  items: Item[]; processing: boolean; complete: boolean; surfaced: string[];
  proof?: IdkitProofSummary; proofExpires?: number; challenge?: Attempt;
  verifiedAttempt?: string;
  paired?: boolean;
}
interface Attempt extends IdkitChallenge { id: string; run: Run; browser: string; verifying?: boolean }
const digest = (text: string) => createHash('sha256').update(text).digest('hex');
const base = '/experience';
const ttl = 30 * 60 * 1000;
// Display units only for the asset/network with provenance in this configuration.
const tokenConfig = JSON.parse(readFileSync(new URL('../../config/x402-suggestions.json', import.meta.url), 'utf8'));

export function createExperience(deps: AppDeps, allowSignature: () => boolean) {
  const identity = deps.idkitDemo, assets = deps.experience;
  const now = () => (deps.now?.() ?? new Date()).getTime();
  const runs = new Map<string, Run>();
  // The desktop sees paid deliveries after handoff, never the phone's proof or drafts.
  const observers = new Map<string, Run>();
  const handoffs = new Map<string, { run: Run; expires: number }>();
  const payer = assets && deps.demoBuyerKey ? privateKeyToAccount(deps.demoBuyerKey as `0x${string}`).address : undefined;
  const authenticated = (run: Run) => Boolean(run.proof && run.proofExpires! > now() && run.expires > now());
  const supported = (q: PaymentRequirement) => q.network === tokenConfig.values.X402_NETWORK.value
    && q.asset.toLowerCase() === tokenConfig.values.X402_ASSET.value.toLowerCase();
  function configuration() {
    let payment = false;
    try {
      payment = Boolean(identity && deps.screeningWired && payer && deps.settlement?.live
        && supported(deps.settlement.quote(1, 'JPYC', payer)));
    } catch { /* Incomplete configuration never grants a payment. */ }
    return { screening: Boolean(deps.screeningWired), classifier: Boolean(deps.classifier),
      classifierProvider: deps.classifierName ?? (deps.classifier ? 'configured' : 'none'),
      identity: Boolean(identity), payment, payerBound: Boolean(payer) };
  }
  const links = () => ({
    koe: deps.homeUrl ? `${deps.homeUrl.replace(/\/$/, '')}/koe.html` : '/koe-registration',
    koeDirectory: deps.homeUrl ? `${deps.homeUrl.replace(/\/$/, '')}/koe/directory.json` : null,
    koeRegistration: '/koe-registration', liveDirectory: '/koe-registration/directory.json',
  });
  function displayReward(amount: number, receiver: string) {
    if (configuration().payment) {
      const q = deps.settlement!.quote(amount, 'JPYC', receiver);
      return { amount: q.amount, asset: q.asset, network: q.network, preview: false };
    }
    // A labelled example quote, never added to received money or used to authorize payment.
    return { amount: String(amount * Number(tokenConfig.values.X402_ATOMIC_PER_UNIT.value)),
      asset: tokenConfig.values.X402_ASSET.value, network: tokenConfig.values.X402_NETWORK.value, preview: true };
  }
  function seeds(id: string, policy: Policy): Item[] {
    return Array.from({ length: 50 }, (_, i) => {
      const kind: Item['kind'] = i < 32 ? 'standing' : i < 38 ? 'question' : i < 48 ? 'forbidden' : 'risk';
      const category = kind === 'standing' ? policy.allow[0]!
        : kind === 'forbidden' ? policy.forbid[0]!
        : kind === 'risk' ? policy.allow[0]!
        : i === 34 ? 'experience/what-changed-your-mind'
        : i === 37 ? policy.allow[0]! : policy.sensitive[(i - 32) % policy.sensitive.length]!;
      return {
        kind, payment: { status: 'not-funded' },
        request: {
          id: `${id}-${i + 1}`, who: KNOWN_PARTIES[i % KNOWN_PARTIES.length]!, what: category,
          purpose: 'market-research', price: { amount: i === 37 ? 1001 : kind === 'question' ? 900 : 120, currency: 'JPYC' },
          deadline: new Date(now() + ttl).toISOString(),
          ...((kind === 'risk' ? FIXTURES.flagged : payer ?? FIXTURES.clean)
            ? { payoutAddress: (kind === 'risk' ? FIXTURES.flagged : payer ?? FIXTURES.clean)! } : {}),
        },
      };
    });
  }
  function publicState(run: Run, observer = false) {
    const unlocked = !observer && authenticated(run);
    const buyerVisible = unlocked || observer;
    const totals = new Map<string, { amount: bigint; automated: bigint; answered: bigint; asset: string; network: string; name: string }>();
    for (const item of run.items) {
      const p = item.payment, q = p.requirement;
      if (p.status !== 'settled' || !q) continue;
      const key = q.network + ':' + q.asset;
      const t = totals.get(key) ?? { amount: 0n, automated: 0n, answered: 0n, asset: q.asset, network: q.network, name: String(q.extra?.['name'] ?? 'token') };
      t.amount += BigInt(q.amount);
      if (item.decision?.verdict === 'auto') t.automated += BigInt(q.amount); else t.answered += BigInt(q.amount);
      totals.set(key, t);
    }
    return {
      id: run.id, expires: new Date(run.expires).toISOString(), receiver: run.receiver,
      complete: run.complete, processed: run.items.filter(i => i.decision).length, total: run.items.length,
      authenticated: unlocked, identity: unlocked ? run.proof : null, observer, paired: Boolean(run.paired),
      policy: { cap: run.policy.dailyCap, threshold: run.policy.amountThreshold,
        displayThreshold: displayReward(run.policy.amountThreshold, run.receiver), allow: run.policy.allow, forbid: run.policy.forbid },
      surfaced: unlocked ? run.surfaced : [],
      wired: configuration(),
      tokenDisplay: { asset: tokenConfig.values.X402_ASSET.value, network: tokenConfig.values.X402_NETWORK.value,
        symbol: 'test USDC', decimals: 6 },
      totals: buyerVisible ? [...totals.values()].map(t => ({ ...t, amount: String(t.amount), automated: String(t.automated), answered: String(t.answered) })) : [],
      ...links(),
      items: run.items.map(i => ({
        id: i.request.id, who: i.request.who, category: i.request.what, question: asQuestion(i.request.what),
        price: i.request.price, deadline: i.request.deadline, kind: i.kind,
        decision: i.decision ?? null, screening: i.screening ?? null,
        screeningReason: i.screeningReason, model: i.model, modelReason: i.modelReason, decidedAt: i.decidedAt,
        reward: displayReward(i.request.price.amount, run.receiver),
        payment: unlocked ? i.payment : { status: i.payment.status, requirement: i.payment.requirement,
          ...(observer && i.payment.status === 'settled' ? { transaction: i.payment.transaction } : {}) },
        ...(unlocked && i.draft ? { draft: i.draft } : {}),
        resolved: i.resolved, ...(buyerVisible && i.delivered ? { delivered: i.delivered } : {}),
        ...(buyerVisible && i.payment.transaction ? {
          explorer: (deps.explorerUrl ?? tokenConfig.values.X402_EXPLORER_URL.value) + encodeURIComponent(i.payment.transaction),
        } : {}),
      })),
    };
  }
  function plan(run: Run) {
    const held = run.items.filter(i => i.decision?.verdict === 'human').map(i => ({
      request: i.request, decision: i.decision!, heldAt: new Date(now()).toISOString(),
    }));
    const morning = surface(held, run.policy, new Date(now()));
    // Keep this session's attention budget fixed: answering does not refill it.
    run.surfaced = morning.surfaced.flatMap(b => b.requests.map(r => r.request.id));
    const auto = run.items.find(i => i.decision?.verdict === 'auto');
    const human = run.items.find(i => i.request.id === run.surfaced[0]);
    // Two funded demonstration requests, not fifty fabricated payments.
    for (const i of [auto, human]) {
      if (!i || !configuration().payment || !deps.settlement) continue;
      const requirement = deps.settlement.quote(i.request.price.amount, i.request.price.currency, run.receiver);
      // These visitor rewards are testnet-only, regardless of another endpoint's config.
      if (!supported(requirement)) continue;
      i.payment = { status: 'ready', requirement };
    }
    run.complete = true;
  }
  async function pay(run: Run, item: Item, answer: string) {
    const p = item.payment;
    if (p.status !== 'ready' || !p.requirement) throw new Error('payment_not_ready');
    // Claim before any await; a lost response or duplicate click cannot sign another payment.
    p.status = 'processing';
    item.answer = answer;
    try {
      if (!authenticated(run) || !deps.settlement?.live || !deps.demoBuyerKey || !payer) throw new Error('payment_not_configured');
      const screened = await deps.screening.scan(payer);
      if (!authenticated(run) || screened !== 'clean') throw new Error('payment_screening_refused');
      if (!allowSignature()) throw new Error('demo_payment_limit_reached');
      const payload = await signAuthorization({
        privateKey: deps.demoBuyerKey, requirement: p.requirement, validBeforeMs: run.expires,
        resourceUrl: `${identity!.origin}${base}/answer`, now: () => new Date(now()),
      });
      const checked = await deps.settlement.check(payload, p.requirement);
      if (checked.status !== 'settled' || !authenticated(run)) throw new Error('payment_authorization_refused');
      const result = await deps.settlement.settle(payload, p.requirement);
      if (result.status !== 'settled' || !result.transaction) throw new Error('settlement_not_confirmed');
      p.status = 'settled'; p.transaction = result.transaction; p.network = result.network;
      item.delivered = answer; item.resolved = 'answered'; delete item.draft;
    } catch (e) {
      p.status = 'failed';
      p.error = e instanceof Error && /^[a-z_]+$/.test(e.message) ? e.message : 'payment_not_confirmed';
      // No automatic retry after an uncertain settlement, and no unpaid answer in the buyer inbox.
    }
  }
  return async (req: IncomingMessage, res: ServerResponse): Promise<boolean> => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname !== base && !url.pathname.startsWith(base + '/')) return false;
    const json = (code: number, value: unknown) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'unsafe-inline'; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    if (!identity || !assets) {
      res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<!doctype html><meta charset="utf-8"><title>Yohaku</title><h1>このデモは準備中です / Demo not enabled</h1><p>World認証と体験デモの設定が必要です。入金や認証は行っていません。</p><a href="/try">既存のデモへ / Existing demo</a>');
      return true;
    }
    if (req.headers.host !== new URL(identity.origin).host) { json(403, { error: 'wrong_host' }); return true; }
    for (const [key, r] of runs) if (r.expires <= now() && !r.processing && !r.items.some(i => i.payment.status === 'processing')) runs.delete(key);
    for (const [key, h] of handoffs) if (h.expires <= now() || h.run.expires <= now()) handoffs.delete(key);
    for (const [key, r] of observers) if (r.expires <= now()) observers.delete(key);
    if (req.method === 'GET' && url.pathname === base + '/app.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(assets.js); return true; }
    if (req.method === 'GET' && url.pathname === base + '/idkit_wasm_bg.wasm') { res.setHeader('Content-Type', 'application/wasm'); res.end(identity.assets.wasm); return true; }
    if (req.method === 'GET' && url.pathname === base) {
      beginDemoBrowser(req, res, identity.origin); res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(assets.page); return true;
    }
    const browser = demoBrowser(req, identity.origin);
    if (!browser) { json(403, { error: 'open_demo_first' }); return true; }
    let run = runs.get(browser);
    if (req.method === 'GET' && url.pathname === base + '/state') {
      const observed = observers.get(browser);
      json(200, run ? publicState(run) : observed ? publicState(observed, true)
        : { started: false, wired: configuration(), ...links() }); return true;
    }
    if (req.method !== 'POST' || req.headers.origin !== identity.origin) { json(403, { error: 'wrong_origin' }); return true; }
    try {
      let text = '';
      for await (const chunk of req) { text += chunk; if (text.length > 65536) throw new Error('too_large'); }
      const body = JSON.parse(text || '{}') as Record<string, unknown>;
      if (!body || Array.isArray(body) || typeof body !== 'object') throw new Error('invalid_body');
      if (url.pathname === base + '/handoff/claim') {
        if (run || observers.has(browser)) throw new Error('browser_already_has_a_run');
        if (typeof body.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token) || body.consent !== true) throw new Error('handoff_consent_required');
        const key = digest(body.token), h = handoffs.get(key);
        if (!h || h.expires <= now() || h.run.expires <= now() || runs.get(h.run.browser) !== h.run) throw new Error('handoff_expired');
        const r = h.run;
        if (r.proof || r.challenge || r.processing || r.items.some(i => i.draft || i.resolved || ['processing','settled','failed'].includes(i.payment.status))) throw new Error('handoff_not_available');
        handoffs.delete(key);
        runs.delete(r.browser); observers.set(r.browser, r);
        r.browser = browser; r.paired = true; runs.set(browser, r);
        json(200, publicState(r)); return true;
      }
      if (url.pathname === base + '/start') {
        if (run) { json(200, publicState(run)); return true; }
        if (runs.size >= 100) { json(429, { error: 'demo_full' }); return true; }
        if (typeof body.receiver !== 'string' || !isAddress(body.receiver) || body.consent !== true) throw new Error('receiver_and_consent_required');
        if (!deps.policy.allow.length || !deps.policy.forbid.length || !deps.policy.sensitive.length) throw new Error('demo_policy_incomplete');
        const policy = structuredClone(deps.policy), id = randomBytes(16).toString('hex');
        run = { id, browser, receiver: body.receiver.trim(), policy, expires: now() + ttl,
          items: seeds(id, policy), complete: false, processing: false, surfaced: [] };
        observers.delete(browser); runs.set(browser, run); json(200, publicState(run)); return true;
      }
      if (!run || body.run !== run.id || run.expires <= now()) { json(409, { error: 'run_expired_or_changed' }); return true; }
      if (url.pathname === base + '/handoff') {
        if (!run.complete || run.paired || run.proof || run.challenge || run.processing
          || run.items.some(i => i.draft || i.resolved || ['processing','settled','failed'].includes(i.payment.status))) throw new Error('handoff_not_available');
        for (const [key, h] of handoffs) if (h.run === run) handoffs.delete(key);
        const token = randomBytes(32).toString('hex'), expires = Math.min(run.expires, now() + 2 * 60 * 1000);
        handoffs.set(digest(token), { run, expires });
        json(200, { url: `${identity.origin}${base}?view=work&device=phone#handoff=${token}`, expires: new Date(expires).toISOString() }); return true;
      }
      if (url.pathname === base + '/advance') {
        if (run.processing) { json(409, { error: 'processing' }); return true; }
        run.processing = true;
        try {
          for (const item of run.items.filter(i => !i.decision).slice(0, 5)) {
            let screening: ScreeningResult = 'unavailable';
            try { if (item.request.payoutAddress) screening = await deps.screening.scan(item.request.payoutAddress); } catch { /* fails closed */ }
            item.screening = screening;
            const reason = deps.screening.reasonFor?.(item.request.payoutAddress ?? '');
            if (reason) item.screeningReason = reason;
            let decision = route(item.request, run.policy, {
              now: new Date(now()), seenBefore: who => KNOWN_PARTIES.includes(who), screen: () => screening,
              ...(reason ? { screeningReason: () => reason } : {}),
            });
            if (decision.rule === 9 && decision.verdict === 'human' && deps.classifier) {
              try {
                const c = await deps.classifier.classify(item.request);
                item.model = c.suggestion; item.modelReason = c.reasoning; decision = applyClassification(decision, c);
              } catch { decision = { verdict: 'deny', rule: 9, reason: 'decision support unavailable' }; item.model = 'unavailable'; }
            }
            item.decision = decision; item.decidedAt = new Date(now()).toISOString();
          }
          if (!run.complete && run.items.every(i => i.decision)) plan(run);
        } finally { run.processing = false; }
        json(200, publicState(run)); return true;
      }
      if (url.pathname === base + '/challenge') {
        if (!run.complete) throw new Error('finish_routing_first');
        const rp = identity.sign(), id = randomBytes(32).toString('hex');
        const c: Attempt = {
          id, run, browser, nonce: rp.nonce, action: identity.action,
          signal: digest(JSON.stringify(['experience-access', id, run.id, run.receiver, run.policy, run.items.filter(i => i.payment.status === 'ready').map(i => i.payment.requirement)])),
          expiresAt: Math.min(rp.expires_at, Math.floor(now() / 1000) + 120),
        };
        run.challenge = c;
        json(200, { id, signal: c.signal, appId: identity.appId, action: identity.action, rp_context: rp }); return true;
      }
      if (url.pathname === base + '/cancel') {
        if (run.challenge?.id === body.id) delete run.challenge;
        if (run.verifiedAttempt === body.id) {
          delete run.proof; delete run.proofExpires; delete run.verifiedAttempt;
        }
        json(200, { cancelled: true }); return true;
      }
      if (url.pathname === base + '/verify') {
        const c = run.challenge;
        if (!c || c.verifying || c.id !== body.id || c.expiresAt <= now() / 1000 || c.browser !== browser) throw new Error('invalid_challenge');
        // Keep active reference to let cancellation or a newer challenge invalidate an in-flight proof.
        c.verifying = true;
        c.expiresAt = Math.min(c.expiresAt, Math.floor(now() / 1000) + 120);
        const proof = await identity.verify(c, body.proof);
        if (run.challenge !== c || c.expiresAt <= now() / 1000 || run.expires <= now() || runs.get(browser) !== run) throw new Error('verification_changed');
        delete run.challenge;
        run.verifiedAttempt = c.id;
        run.proof = proof; run.proofExpires = Math.min(run.expires, now() + 15 * 60 * 1000);
        json(200, publicState(run)); return true;
      }
      if (!authenticated(run)) { json(403, { error: 'world_login_required' }); return true; }
      if (url.pathname === base + '/collect') {
        const item = run.items.find(i => i.decision?.verdict === 'auto' && i.payment.requirement);
        if (!item) throw new Error('no_funded_automatic_request');
        if (item.payment.status === 'ready') await pay(run, item, 'DEMO SAMPLE / I put it back because the packaging was too large for one person.');
        json(200, publicState(run)); return true;
      }
      if (url.pathname === base + '/answer' || url.pathname === base + '/decline' || url.pathname === base + '/draft') {
        const item = run.items.find(i => i.request.id === body.id);
        if (!item || item.decision?.verdict !== 'human' || !run.surfaced.includes(item.request.id) || Date.parse(item.request.deadline) <= now()) throw new Error('request_not_available');
        if (item.resolved || item.payment.status === 'processing' || item.payment.status === 'settled' || item.payment.status === 'failed') { json(409, { error: 'already_decided' }); return true; }
        if (url.pathname.endsWith('/decline')) {
          item.resolved = 'declined'; item.payment.status = 'not-funded'; json(200, publicState(run)); return true;
        }
        if (typeof body.answer !== 'string' || body.answer.trim().length < 3 || body.answer.length > 1000 || body.consent !== true) throw new Error('answer_and_consent_required');
        if (url.pathname.endsWith('/draft')) {
          item.draft = body.answer.trim(); json(200, publicState(run)); return true;
        }
        await pay(run, item, body.answer.trim());
        json(200, publicState(run)); return true;
      }
      json(404, { error: 'not_found' }); return true;
    } catch (e) {
      json(400, { error: e instanceof Error && /^[a-z_]+$/.test(e.message) ? e.message : 'operation_refused' }); return true;
    }
  };
}
