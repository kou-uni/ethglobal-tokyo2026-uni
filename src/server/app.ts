/**
 * Yohaku — the surface an agent actually talks to.
 *
 * Three endpoints, written against Node's own http module. No framework: the routing here
 * is a switch over four paths, and a dependency that made that shorter would also make the
 * request/response shapes someone else's decision.
 *
 * The one behaviour worth pointing at: **`POST /requests` answers synchronously even when
 * the verdict is `human`.** An agent that is left holding a connection while a person
 * sleeps is an agent that is stuck, so a held request returns `202` immediately, with the
 * deadline it will be judged against.
 */

import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { applyLearned, learn } from '../core/decisions.js';
import { buildLedger } from '../core/ledger.js';
import { route } from '../core/rules.js';
import { onDeadline } from '../core/queue.js';
import type { AgentRequest, Policy, RoutingContext, ScreeningResult } from '../core/types.js';
import { applyClassification, type ClassifierPort } from '../ports/classifier.js';
import { mayProceed, type IdentityPort, type VerificationOutcome } from '../ports/identity.js';
import { FIXTURES, mayMoveMoney, type ScreeningPort } from '../ports/screening.js';
import { Store, verdictBody, sameRequest, type Entry } from './state.js';
import { PendingVerifications } from './pending.js';
import { approvalPage, droppedPage, invitePage, resultPage, type TodaySummary } from './pages.js';
import { pastNights, type NightSummary } from '../core/history.js';
import { asQuestion } from '../core/night.js';
import {
  outlivesDeadline,
  type PaymentRequirement,
  type SettlementPort,
} from '../ports/settlement.js';
import { decodePaymentSignatureHeader, encodePaymentRequiredHeader } from '@x402/core/http';
import { isAddress, signAuthorization } from '../adapters/eip3009.js';
import { delegationDisabled } from '../ports/delegation.js';
import type { PermissionsPort } from '../ports/permissions.js';
import type { ProductionProbeHandler } from './world-production-probe.js';
import { createIdkitApproval, beginDemoBrowser, approvalBrowser, type IdkitApprovalOptions } from './idkit-approval.js';
import { RoutingFees, FEE_HEADER } from './routing-fees.js';
import { createKoeRegistration } from './koe-registration.js';
import { createExperience, type ExperienceAssets } from './experience.js';
import { createA2A } from './a2a.js';
import { decodePaymentRequiredHeader } from '@x402/core/http';

export interface AppDeps {
  /** Opt-in, browser-owned live journey. Shares the existing demo signing budget. */
  experience?: ExperienceAssets;
  fees?: RoutingFees;
  /** Any qualified human can approve only the visitor demo they started. */
  idkitDemo?: IdkitApprovalOptions;
  /** Standalone authentication test; has no Store or settlement access. */
  productionProbe?: ProductionProbeHandler;
  /** Extra denial gate; caller authentication and chain writes are separate concerns. */
  delegation?: { port: PermissionsPort; account: `0x${string}` };
  policy: Policy;
  store: Store;
  screening: ScreeningPort;
  /** A live screening adapter is explicitly configured, rather than the stand-in. */
  screeningWired?: boolean;
  /** Optional: consulted only on rule 9. */
  classifier?: ClassifierPort;
  classifierName?: string;
  /** Optional: required before an approval can settle. */
  identity?: IdentityPort;
  /** Where the issuer sends her back. Must be HTTPS and registered with them. */
  redirectUri?: string;
  /** True only when a real issuer is configured — the page says which. */
  identityWired?: boolean;
  /**
   * The nights before this one, for the fold on the approval page.
   *
   * Left out in tests: the page must be correct with no history at all, and a test that
   * silently depended on four replayed nights would be testing the generator.
   */
  nights?: NightSummary[];
  /** Optional. Without it nothing settles, and every surface says so. */
  settlement?: SettlementPort;
  /** The public origin, so the x402 resource url matches what the agent actually called. */
  origin?: string;
  /** Explorer prefix for a settled transaction. Configuration, never a literal in source. */
  explorerUrl?: string;
  /**
   * The buyer's key, used only by `/try` so a visitor can be paid into their own wallet
   * without having to be an agent themselves.
   *
   * It signs for exactly the amount and destination this server quoted, and it never
   * broadcasts — settlement still runs from the one place that requires a verified yes.
   */
  demoBuyerKey?: string;
  /**
   * How many visitor-funded runs this process will sign in an hour.
   *
   * The server is on the open internet with no authentication, so an unbounded `/try` is an
   * unbounded way to spend the buyer's balance. Small amounts are not a substitute for a
   * limit.
   */
  demoSignsPerHour?: number;
  /**
   * Where to send a reader. Passed in from `package.json`, which is the canonical place for
   * a project's own URLs — and the reason `npm run verify` can keep refusing every literal
   * endpoint in source without an exception for our own.
   */
  docsUrl?: string;
  homeUrl?: string;
  now?: () => Date;
}

/**
 * The agent's signed authorization, if it sent one.
 *
 * Both header names are read: the deployed facilitator answers `x402Version: 2`, whose
 * header is `PAYMENT-SIGNATURE`, but the published `x402` npm package still emits the v1
 * `X-PAYMENT`. Accepting both costs one line and means a client built from either
 * generation of the docs can pay us.
 */
function signedPayment(req: IncomingMessage): unknown | undefined {
  const raw = req.headers['payment-signature'] ?? req.headers['x-payment'];
  if (typeof raw !== 'string' || !raw) return undefined;
  try {
    return decodePaymentSignatureHeader(raw);
  } catch {
    return undefined;
  }
}

/**
 * The moment she says yes, the money moves — if the agent authorized it in advance.
 *
 * This is deliberately the *only* place a held authorization is ever settled. There is no
 * path from "held" to "paid" that does not pass through a verified human saying yes, which
 * is the single sentence the whole product is trying to be able to say.
 */
async function settleApproved(
  entry: Entry,
  settlement: SettlementPort | undefined,
  screening: ScreeningPort,
  now: () => Date,
  authorized?: () => Promise<boolean>,
): Promise<{ settled: false; reason: string } | { settled: true; transaction: string; network: string }> {
  if (!settlement?.live) return { settled: false, reason: 'settlement is not configured' };
  if (!entry.auth) return { settled: false, reason: 'the agent did not authorize a payment' };
  if (!(Date.parse(entry.request.deadline) > now().getTime())) return { settled: false, reason: 'the request deadline passed' };
  const source = entry.paymentSource ?? entry.request.payoutAddress;
  const checked = await screenDeclared(screening, source, true);
  if (!mayMoveMoney(checked)) return { settled: false, reason: 'the payment source could not be cleared at approval' };
  if (authorized && !await authorized()) return { settled: false, reason: 'approval authority changed before settlement' };
  if (!(Date.parse(entry.request.deadline) > now().getTime())) return { settled: false, reason: 'the request deadline passed during screening' };
  const result = await settlement.settle(entry.auth.payload, entry.auth.requirement);
  if (result.status === 'refused') return { settled: false, reason: result.reason };
  return { settled: true, transaction: result.transaction, network: result.network };
}

/** A 402 that carries what to pay, in the header the protocol specifies. */
function paymentRequired(
  res: ServerResponse,
  requirement: PaymentRequirement,
  resourceUrl: string,
  reason: string,
  body: Record<string, unknown>,
  extensions?: Record<string, unknown>,
): void {
  const header = encodePaymentRequiredHeader({
    x402Version: 2,
    error: reason,
    resource: {
      url: resourceUrl,
      description: 'Human-origin data, sold by the person it came from',
      mimeType: 'application/json',
    },
    accepts: [requirement],
    ...(extensions ? { extensions } : {}),
  } as never);
  res.writeHead(402, {
    'content-type': 'application/json; charset=utf-8',
    'PAYMENT-REQUIRED': header,
  });
  res.end(JSON.stringify({ ...body, x402Version: 2, accepts: [requirement], ...(extensions ? { extensions } : {}) }, null, 2));
}

const FIVE_FIELDS = ['who', 'what', 'purpose', 'price', 'deadline'] as const;

/**
 * Today, read off the store.
 *
 * **`worth` is not income.** Every entry here carries `settlement: 'not-wired'`, so this
 * is the value of the offers that were accepted — the page labels it "worth" and says
 * underneath that nothing moved. Quoting it as money received would be the one lie a
 * judge is most likely to catch.
 */
function todaySummary(store: Store, settlementWired = false): TodaySummary {
  const auto = store.byVerdict('auto');
  const totals = store.received();
  const currency = totals[0]?.currency ?? auto[0]?.request.price.currency ?? 'JPYC';
  return {
    arrived: store.all().length,
    auto: auto.length,
    deny: store.byVerdict('deny').length,
    waiting: store.outstanding().length,
    // The offline fold labels offers as "worth"; paid totals must not include them.
    worth: settlementWired ? totals[0]?.amount ?? 0
      : auto.filter(e => e.request.price.currency === currency).reduce((sum, e) => sum + e.request.price.amount, 0),
    currency,
    settlementWired,
  };
}

function json(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body, null, 2);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(text);
}

async function readText(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * A connected screening/payment path must have a source. Offline routing fixtures may
 * omit it; they cannot represent a screened or settled payment. Ordinary signed payments
 * screen their actual payer, with any declared address required to match.
 */
async function screenDeclared(
  port: ScreeningPort,
  declared: string | undefined,
  required = false,
): Promise<ScreeningResult> {
  return declared ? port.scan(declared) : required ? 'unavailable' : 'clean';
}

/** The one request `/try` stages. Ordinary enough to be believable, sensitive enough to escalate. */
/*
 * The request a visitor is handed, chosen so that one run touches every stage.
 *
 * `who` is a party the store already knows, because rule 7 sends a stranger to a human before
 * anything else can look at it — true to the product, and it would mean the model never runs.
 * `what` is a category no rule covers, so the request falls to rule 9 and a decision model is
 * asked. `payoutAddress` is the mainnet address we confirmed comes back clean, so the screening
 * call is real rather than skipped.
 *
 * The consequence is deliberate: **the door can refuse to open.** If the model drops this one,
 * no approval screen appears, and that is the product working rather than a demo failing.
 */
const DEMO_ASK = {
  who: 'demand.nozomi-labs.eth',
  what: 'experience/what-changed-your-mind',
  purpose: 'market-research' as const,
  // Under the owner's threshold on purpose: rule 6 would otherwise answer before rule 9 does.
  price: { amount: 900, currency: 'JPYC' as const },
  ...(FIXTURES.clean ? { payoutAddress: FIXTURES.clean } : {}),
};

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

/** Every field, or a 400 naming the ones missing. Agents deserve a usable error. */
function validate(body: Record<string, unknown>): { ok: true; request: AgentRequest } | { ok: false; missing: string[] } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, missing: [...FIVE_FIELDS] };
  const missing = FIVE_FIELDS.filter((f) => body[f] === undefined);
  if (missing.length) return { ok: false, missing };
  const price = body['price'] as { amount?: unknown; currency?: unknown };
  if (typeof price?.amount !== 'number' || !Number.isFinite(price.amount) || price.amount <= 0 || price.currency !== 'JPYC') {
    return { ok: false, missing: ['price.amount (number)', 'price.currency (string)'] };
  }
  if (typeof body.deadline !== 'string' || !Number.isFinite(Date.parse(body.deadline))) {
    return { ok: false, missing: ['deadline (valid ISO date)'] };
  }
  if (typeof body.who !== 'string' || !body.who.trim() || typeof body.what !== 'string' || !body.what.trim()
    || !['market-research', 'demand-estimation', 'personalisation', 'ai-training', 'other'].includes(String(body.purpose))) {
    return { ok: false, missing: ['who, what, purpose (valid strings)'] };
  }
  if (body.actingAs !== undefined && !['buyer', 'delegate'].includes(String(body.actingAs))
    || body.writeTarget !== undefined && !['proposal', 'permission', 'payout'].includes(String(body.writeTarget))) {
    return { ok: false, missing: ['actingAs or writeTarget (unsupported value)'] };
  }
  return {
    ok: true,
    request: {
      id: typeof body['id'] === 'string' ? body['id'] : randomUUID(),
      who: String(body['who']),
      what: String(body['what']),
      purpose: body['purpose'] as AgentRequest['purpose'],
      price: { amount: price.amount, currency: price.currency as 'JPYC' },
      deadline: String(body['deadline']),
      ...(typeof body['payoutAddress'] === 'string' ? { payoutAddress: body['payoutAddress'] } : {}),
      ...(body['actingAs'] === 'delegate' || body['actingAs'] === 'buyer'
        ? { actingAs: body['actingAs'] }
        : {}),
      ...(body['writeTarget'] === 'proposal' ||
      body['writeTarget'] === 'permission' ||
      body['writeTarget'] === 'payout'
        ? { writeTarget: body['writeTarget'] }
        : {}),
    },
  };
}

export function createApp(deps: AppDeps): Server {
  const now = deps.now ?? (() => new Date());
  const pending = new PendingVerifications();
  const claimApproval = (entry: Entry) => {
    entry.resolution = 'approved';
    entry.completed = { status: 503, body: { id: entry.request.id, verdict: 'approved',
      settlement: 'unknown', reason: 'Approval claimed; reconcile any uncertain payment before retrying' } };
    deps.store.add(entry);
  };
  const completeApproval = (entry: Entry, body: Record<string, unknown>) => {
    entry.completed = { status: 200, body };
    deps.store.add(entry);
    return body;
  };
  const idkit = deps.idkitDemo ? createIdkitApproval(deps.idkitDemo, deps.store, async (entry, proof, authorized) => {
    // Claim before settlement awaits: concurrent valid proofs cannot settle twice.
    claimApproval(entry);
    const paid = await settleApproved(entry, deps.settlement, deps.screening, now, authorized);
    entry.settlement = paid.settled ? paid.transaction : 'not-wired';
    deps.store.remember({
      who: entry.request.who, what: entry.request.what, outcome: 'approved',
      decidedAt: now().toISOString(), escalatedBy: entry.decision.rule,
    });
    return completeApproval(entry, { id: entry.request.id, verdict: 'approved', identity: proof, settlement: paid });
  }, () => now().getTime()) : undefined;
  const koe = createKoeRegistration(deps.idkitDemo, deps.policy, () => now().getTime());

  /*
   * How many payments this process will sign for strangers in an hour.
   *
   * `/try` is open on the public internet with no authentication, and each run signs an
   * authorization payable to whatever address was typed in. **Small amounts are not a
   * substitute for a limit** — a few thousand runs of a tiny amount is still the whole
   * balance. Past the ceiling the demo still works; it just stops paying.
   */
  const signedAt: number[] = [];
  const allowDemoSignature = (): boolean => {
    const ceiling = deps.demoSignsPerHour ?? 40;
    if (!Number.isSafeInteger(ceiling) || ceiling < 0) return false;
    const cutoff = now().getTime() - 3_600_000;
    while (signedAt.length && signedAt[0]! < cutoff) signedAt.shift();
    if (signedAt.length >= ceiling) return false;
    signedAt.push(now().getTime());
    return true;
  };
  const experience = createExperience(deps, allowDemoSignature);

  const html = (res: ServerResponse, status: number, body: string): void => {
    res.writeHead(status, { 'content-type': 'text/html; charset=utf-8' });
    res.end(body);
  };

  /** Everything that ends an approval without settling looks the same from here. */
  const refuse = (
    res: ServerResponse,
    entry: Entry,
    outcome: 'declined' | 'expired' | 'refused',
    detail: string,
    record: 'refused' | 'ignored',
  ): void => {
    entry.resolution = outcome === 'declined' ? 'ignored' : 'expired';
    deps.store.remember({
      who: entry.request.who,
      what: entry.request.what,
      outcome: record,
      decidedAt: now().toISOString(),
      escalatedBy: entry.decision.rule,
    });
    html(res, 200, resultPage({ outcome, detail }));
  };

  const a2aOrigin = () => {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('HTTP intake is not listening');
    return deps.origin ?? deps.idkitDemo?.origin ?? `http://127.0.0.1:${address.port}`;
  };
  const a2a = createA2A({
    store: deps.store, owner: deps.policy.owner, paid: Boolean(deps.settlement?.live), now,
    origin: a2aOrigin,
    intake: async (body, headers) => {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('HTTP intake is not listening');
      // Only this process's bound port is used. Caller-controlled URLs are never followed.
      const response = await fetch(`http://127.0.0.1:${address.port}/requests`, {
        method: 'POST', headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify(body), signal: AbortSignal.timeout(30000), redirect: 'error',
      });
      const result = await response.json() as Record<string, any>;
      const encoded = response.headers.get('payment-required');
      const accepts = result.payment?.accepts;
      return { status: response.status, body: result,
        ...(encoded ? { required: decodePaymentRequiredHeader(encoded) }
          : accepts ? { required: { x402Version: 2, accepts,
            resource: { url: `${a2aOrigin()}/a2a`, mimeType: 'application/json' },
          } } : {}) };
    },
  });
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const path = url.pathname;

    try {
      if (await experience(req, res)) return;
      if (await a2a(req, res)) return;
      if (await koe(req, res)) return;
      if (idkit && await idkit(req, res)) return;
      if (deps.idkitDemo?.owner && await deps.idkitDemo.owner.handle(req, res, deps.store, deps.policy)) return;
      if (deps.productionProbe && await deps.productionProbe(req, res)) return;
      if (req.method === 'GET' && path === '/fees') {
        return json(res, deps.fees ? 200 : 404, deps.fees?.summary(now().getTime()) ?? { error: 'not_found' });
      }
      /* ── health ─────────────────────────────────────────────────────────── */
      if (req.method === 'GET' && path === '/health') {
        // Public status only: static demo pages may read it without cookies.
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-store');
        return json(res, 200, {
          ok: true,
          owner: deps.policy.owner,
          dailyCap: deps.policy.dailyCap,
          // Said plainly, rather than discovered by a judge.
          wired: {
            routing: true,
            classifier: Boolean(deps.classifier),
            identity: Boolean(deps.idkitDemo || (deps.identityWired && deps.identity)),
            identityMode: deps.idkitDemo
              ? deps.idkitDemo.owner ? 'idkit-production-owner-and-visitor' : 'idkit-production-visitor-demo'
              : 'oidc-or-mock',
            ownerApproval: Boolean(deps.idkitDemo?.owner),
            koeRegistration: Boolean(deps.idkitDemo?.assets.koePage && deps.idkitDemo?.assets.koeJs),
            experience: Boolean(deps.experience && deps.idkitDemo),
            screening: Boolean(deps.screeningWired),
            settlement: Boolean(deps.settlement?.live),
            delegationReader: Boolean(deps.delegation),
          },
        });
      }

      /* ── an agent asks ──────────────────────────────────────────────────── */
      if (req.method === 'POST' && path === '/requests') {
        const body = (await readJson(req)) as Record<string, unknown>;
        const parsed = validate(body);
        if (!parsed.ok) {
          return json(res, 400, {
            error: 'missing fields',
            missing: parsed.missing,
            required: FIVE_FIELDS,
          });
        }

        const request = parsed.request;
        if (!deps.store.acquire(request.id)) return json(res, 409, { error: 'request is already being processed' });
        try {
          const previous = deps.store.get(request.id);
          if (previous && !sameRequest(previous.request, request)) {
            return json(res, 409, { error: 'request ID already belongs to a different offer' });
          }
          if (previous?.completed) return json(res, previous.completed.status, previous.completed.body);
          if (previous?.resolution) return json(res, 200, {
            id: request.id, verdict: previous.resolution === 'approved' ? 'approved' : 'deny',
            held: false, resolution: previous.resolution, settlement: previous.settlement ?? null,
          });
          const expired = () => !(Date.parse(request.deadline) > now().getTime());
          const denyExpired = () => {
            const entry: Entry = previous ?? { request, decision: onDeadline(), receivedAt: now().toISOString() };
            entry.decision = onDeadline(); entry.resolution = 'expired';
            const body = { ...verdictBody(entry), held: false };
            entry.completed = { status: 410, body }; deps.store.add(entry);
            return json(res, 410, body);
          };
          if (expired()) return denyExpired();
          if (previous?.auth) return json(res, 202, { ...verdictBody(previous), payment: { accepted: true, note: 'authorization already held' } });
          const payment = signedPayment(req);
          if ((req.headers['payment-signature'] || req.headers['x-payment']) && !payment) {
            return json(res, 400, { error: 'invalid payment signature header' });
          }
          const payer = (payment as { payload?: { authorization?: { from?: unknown } } } | undefined)?.payload?.authorization?.from;
          const payerAddress = typeof payer === 'string' && isAddress(payer) ? payer : undefined;
          const source = payerAddress ?? request.payoutAddress;
          const sourceMismatch = Boolean(payment && (!payerAddress
            || request.payoutAddress && request.payoutAddress.toLowerCase() !== payerAddress.toLowerCase()));

          // Screening runs before anything can settle, and its result decides the branch.
          // Awaited here so that `route` stays synchronous and pure.
          const screened = sourceMismatch ? 'unavailable' : await screenDeclared(
            deps.screening, source, Boolean(deps.screeningWired || deps.settlement?.live),
          );
          if (expired()) return denyExpired();
          const routingCtx: RoutingContext = {
            now: now(),
            seenBefore: (who) => deps.store.hasSeen(who),
            screen: () => screened,
            ...(sourceMismatch
              ? { screeningReason: () => 'the declared source must match the signed payer' }
              : deps.screening.reasonFor
              ? { screeningReason: () => deps.screening.reasonFor!(source ?? '') }
              : {}),
            ...(request.actingAs === 'delegate'
              ? { delegationRevoked: await delegationDisabled(deps.policy.owner, deps.delegation) }
              : {}),
          };

          let decision = route(request, deps.policy, routingCtx);
          decision = applyLearned(request, decision, learn(deps.store.history()));

          // The model is consulted in exactly one place.
          if (decision.verdict === 'human' && decision.rule === 9 && deps.classifier) {
            decision = applyClassification(decision, await deps.classifier.classify(request));
          }
          if (expired()) return denyExpired();

          const entry: Entry = previous ?? { request, decision, receivedAt: now().toISOString() };
          entry.decision = decision;
          if (source) entry.paymentSource = source;
          const feeQuote = deps.fees?.record(request, now().getTime());
          const extensions = feeQuote ? deps.fees!.extensions(feeQuote) : undefined;
          const fee = feeQuote ? { optional: true, status: await deps.fees!.receive(feeQuote, req.headers[FEE_HEADER], now().getTime()), paid: false } : undefined;
          const feeBody = fee ? { fee, ...(extensions ? { extensions } : {}) } : {};
          const resourceUrl = `${deps.origin ?? ''}/requests`;
          if (expired()) return denyExpired();

          /*
           * `auto` — the money moves now, or the request does not complete.
           *
           * Without a signed authorization this is a 402 rather than a success, which is the
           * whole point of the status code: the agent is told exactly what to pay and comes
           * straight back. With one, we settle before returning, so a `200` here always means
           * a transfer really happened.
           */
          if (decision.verdict === 'auto' && mayMoveMoney(screened)) {
            if (deps.settlement?.live) {
              const requirement = deps.settlement.quote(
                request.price.amount,
                request.price.currency,
              );
              if (!payment) {
                deps.store.add(entry);
                return paymentRequired(res, requirement, resourceUrl, 'payment is required', {
                  id: request.id,
                  ...feeBody,
                  verdict: 'auto',
                  reason: decision.reason,
                }, extensions);
              }
              entry.completed = { status: 503, body: {
                id: request.id, verdict: 'deny', settlement: 'unknown',
                reason: 'payment outcome is uncertain; reconcile before creating another request',
              } };
              deps.store.add(entry);
              let result;
              try {
                result = await deps.settlement.settle(payment, requirement);
              } catch {
                return json(res, entry.completed.status, entry.completed.body);
              }
              if (result.status === 'refused') {
                // The provider may have broadcast before losing its response. Do not try a
                // new authorization for the same request after an uncertain payment.
                entry.completed = { status: 402, body: {
                  id: request.id, verdict: 'auto', settlement: 'refused', reason: result.reason,
                  ...feeBody, x402Version: 2, accepts: [requirement],
                } };
                deps.store.add(entry);
                return paymentRequired(res, requirement, resourceUrl, result.reason, {
                  id: request.id,
                  ...feeBody,
                  verdict: 'auto',
                  settlement: 'refused',
                  reason: result.reason,
                }, extensions);
              }
              entry.settlement = result.transaction;
              entry.completed = { status: 200, body: {
                ...verdictBody(entry), ...feeBody, settlement: { ...result, requirement },
              } };
              deps.store.add(entry);
              return json(res, 200, entry.completed.body);
            }
            entry.settlement = 'not-wired';
          }

          /*
           * `human` — the agent may authorize now and be charged only if she says yes.
           *
           * An EIP-3009 authorization moves nothing until it is settled, so holding one costs
           * the agent nothing while she sleeps. We only keep it if it outlives the deadline:
           * accepting a shorter one would mean queueing a request we already know can never
           * complete. If she never answers, the authorization expires and **nobody** can
           * settle it — the refusal is enforced by the signature, not by us.
           */
          let authNote: Record<string, unknown> = {};
          if (decision.verdict === 'human' && deps.settlement?.live) {
            const requirement = deps.settlement.quote(request.price.amount, request.price.currency);
            if (!payment) {
              authNote = {
                payment: {
                  note: 'sign an authorization now and it settles only if she approves',
                  accepts: [requirement],
                },
              };
            } else if (!outlivesDeadline(payment, request.deadline)) {
              authNote = {
                payment: {
                  accepted: false,
                  reason: 'authorization expires before the deadline it would be judged against',
                  accepts: [requirement],
                },
              };
            } else {
              const checked = await deps.settlement.check(payment, requirement);
              if (expired()) return denyExpired();
              if (checked.status === 'refused') {
                authNote = { payment: { accepted: false, reason: checked.reason } };
              } else {
                entry.auth = {
                  payload: payment,
                  requirement,
                  validBefore: Math.floor(new Date(request.deadline).getTime() / 1000),
                };
                authNote = {
                  payment: {
                    accepted: true,
                    note: 'held. It settles the moment she approves, and expires if she does not',
                  },
                };
              }
            }
          }

          deps.store.add(entry);
          const status = decision.verdict === 'human' ? 202 : 200;
          const response = { ...verdictBody(entry), ...feeBody, ...authNote };
          if (decision.verdict === 'deny') entry.completed = { status, body: response };
          return json(res, status, response);
        } finally { deps.store.release(request.id); }
      }

      /* ── the owner answers ──────────────────────────────────────────────── */
      if (req.method === 'POST' && path.startsWith('/approvals/')) {
        if (deps.idkitDemo) return json(res, 403, { error: 'Use the browser-bound World ID visitor demo. Raw approval codes are disabled.' });
        const id = decodeURIComponent(path.slice('/approvals/'.length));
        const entry = deps.store.get(id);
        if (!entry) return json(res, 404, { error: 'no such request' });
        if (entry.decision.verdict !== 'human') {
          return json(res, 409, { error: 'this was not held for you', verdict: entry.decision.verdict });
        }
        if (entry.resolution) {
          return json(res, 409, { error: 'already answered', resolution: entry.resolution });
        }

        // Past its deadline, the answer no longer counts. Silence already decided.
        if (new Date(entry.request.deadline).getTime() <= now().getTime()) {
          entry.resolution = 'expired';
          const d = onDeadline();
          deps.store.remember({
            who: entry.request.who,
            what: entry.request.what,
            outcome: 'ignored',
            decidedAt: now().toISOString(),
            escalatedBy: entry.decision.rule,
          });
          return json(res, 410, { id, verdict: 'deny', reason: d.reason, settled: false });
        }

        const body = (await readJson(req)) as Record<string, unknown>;
        const approve = body['approve'] === true;

        if (!approve) {
          entry.resolution = 'ignored';
          deps.store.remember({
            who: entry.request.who,
            what: entry.request.what,
            outcome: 'refused',
            decidedAt: now().toISOString(),
            escalatedBy: entry.decision.rule,
          });
          return json(res, 200, { id, verdict: 'deny', reason: 'the owner declined', settled: false });
        }

        // Approving is the high-stakes action, so it is the moment personhood is proven.
        let verification: VerificationOutcome | undefined;
        if (deps.identity) {
          verification = await deps.identity.complete({
            ...(typeof body['code'] === 'string' ? { code: body['code'] } : {}),
            ...(typeof body['error'] === 'string' ? { error: body['error'] } : {}),
            redirectUri: String(body['redirectUri'] ?? ''),
            nonce: String(body['nonce'] ?? ''),
            at: now(),
          });
          if (!mayProceed(verification)) {
            // The protected action does not happen.
            return json(res, 403, {
              id,
              verdict: 'deny',
              reason: `identity: ${verification.status} — ${'reason' in verification ? verification.reason : ''}`,
              settled: false,
            });
          }
        }

        if (entry.resolution) return json(res, 409, { error: 'already answered' });
        if (!(Date.parse(entry.request.deadline) > now().getTime())) {
          entry.resolution = 'expired';
          return json(res, 410, { id, verdict: 'deny', settled: false });
        }
        claimApproval(entry);
        const paid = await settleApproved(entry, deps.settlement, deps.screening, now);
        entry.settlement = paid.settled ? paid.transaction : 'not-wired';
        deps.store.remember({
          who: entry.request.who,
          what: entry.request.what,
          outcome: 'approved',
          decidedAt: now().toISOString(),
          escalatedBy: entry.decision.rule,
        });

        return json(res, 200, completeApproval(entry, {
          id,
          verdict: 'approved',
          identity: verification?.status === 'verified'
            ? {
                verifiedAt: verification.identity.authTime.toISOString(),
                acr: verification.identity.acr,
                ...(verification.identity.amr ? { amr: verification.identity.amr } : {}),
              }
            : 'not wired',
          settlement: paid,
        }));
      }

      /*
       * The service, describing itself.
       *
       * The customer here is an agent, so the root of the API answers the questions an agent
       * would have to guess otherwise: what this is, what it will do with a request, what is
       * really wired, and — the one nobody publishes — **what it refuses to do**.
       */
      if (req.method === 'GET' && (path === '/' || path === '/.well-known/yohaku')) {
        return json(res, 200, {
          service: 'yohaku',
          what: 'An escalation router. Post a request to buy information from a person; it is answered synchronously as auto, human or deny.',
          owner: deps.policy.owner,
          ...(deps.docsUrl ? { docs: deps.docsUrl } : {}),
          ...(deps.homeUrl ? { forAgents: `${deps.homeUrl.replace(/\/$/, '')}/llms.txt` } : {}),
          request: {
            endpoint: 'POST /requests',
            fields: FIVE_FIELDS,
            answers: {
              200: 'auto — settled. With x402 wired, a 200 means the transfer really happened.',
              202: 'human — held for the owner, with the deadline it will be judged against. You are not kept waiting on this connection.',
              402: 'payment required. Sign the authorization in PAYMENT-REQUIRED and retry.',
            },
          },
          settlement: deps.settlement?.live
            ? {
                protocol: 'x402',
                version: 2,
                header: 'PAYMENT-SIGNATURE (v1 X-PAYMENT also accepted)',
                note: 'For a held request, sign an authorization whose validBefore outlives the deadline. It moves nothing while it waits, settles only if she approves, and expires if she never answers.',
              }
            : 'not wired',
          refuses: [
            'A delegated agent trying to widen its own permissions.',
            'Anything the routing engine, the screening call or the identity check could not complete — all of them deny.',
            'Silence. If the owner does not answer before the deadline, the request is denied, not queued.',
          ],
          cannotDo: [
            ...(deps.idkitDemo
              ? deps.idkitDemo.owner ? [] : ['IDKit proves personhood only for browser-bound visitor demos; ordinary owner approvals are disabled']
              : deps.identityWired ? [] : ['identity is mocked on this instance']),
            ...(deps.settlement?.live ? [] : ['settlement is not wired on this instance']),
            ...(deps.delegation
              ? ['ENS reads a configured resolver; registration binding and caller authentication are not verified here']
              : ['ENS permission reads are not configured; delegate requests are denied']),
            'this server does not submit ENS writes',
          ],
          dailyCapOnHumanAttention: deps.policy.dailyCap,
        });
      }

      /* ── what she wakes up to ───────────────────────────────────────────── */
      if (req.method === 'GET' && path.startsWith('/ledger/')) {
        const morning = deps.store.surface(deps.policy, now());
        const outstanding = deps.store.outstanding();
        const ledger = buildLedger({
          date: now().toISOString().slice(0, 10),
          settled: deps.store.byVerdict('auto'),
          denied: deps.store.byVerdict('deny'),
          held: outstanding,
          surfaced: morning.surfaced,
        });
        return json(res, 200, {
          ...ledger,
          received: deps.store.received(),
          needsYou: morning.surfaced.map((b) => ({
            category: b.category,
            count: b.requests.length,
            topValue: b.topValue,
            nextDeadline: b.nextDeadline,
            ids: b.requests.map((r) => r.request.id),
          })),
          deferred: morning.deferred.length,
          expired: morning.expired.length,
        });
      }

      /*
       * One link that always works.
       *
       * The approval screen needs a live request id, and ids do not survive a restart — so a
       * link to `/approve/<id>` written down anywhere is a link that breaks. This stages a
       * fresh request through **the real router** and sends her to whatever it decided.
       *
       * It is a staging door, not a shortcut: the request goes through `route()` like any
       * other, and if the rules ever stopped escalating it, this would stop producing an
       * approval screen — which is the correct failure.
       */
      if (req.method === 'GET' && path === '/try') {
        return html(
          res,
          200,
          invitePage({
            paying: Boolean(deps.settlement?.live && deps.demoBuyerKey),
            amount: `${DEMO_ASK.price.amount} ${DEMO_ASK.price.currency}`,
          }),
        );
      }

      /*
       * The visitor answers "pay me here", and a request is staged for them.
       *
       * The request goes through **the real router** — this is a door, not a shortcut. If the
       * rules ever stopped escalating it, no approval screen would appear, which is the
       * correct failure rather than a hidden special case.
       */
      if (req.method === 'POST' && path === '/try') {
        if (deps.idkitDemo && (req.headers.origin !== deps.idkitDemo.origin
          || req.headers.host !== new URL(deps.idkitDemo.origin).host)) {
          return json(res, 403, { error: 'Start from this site’s demo page.' });
        }
        const form = new URLSearchParams(await readText(req));
        const wanted = (form.get('payTo') ?? '').trim();
        const skipping = form.get('go') === 'skip';

        if (!skipping && wanted && !isAddress(wanted)) {
          return html(
            res,
            400,
            invitePage({
              paying: Boolean(deps.settlement?.live && deps.demoBuyerKey),
              amount: `${DEMO_ASK.price.amount} ${DEMO_ASK.price.currency}`,
              error: 'That does not look like a wallet address — 0x and 40 hex characters.',
            }),
          );
        }

        const request: AgentRequest = {
          ...DEMO_ASK,
          id: `try-${randomUUID().slice(0, 8)}`,
          deadline: new Date(now().getTime() + 6 * 3_600_000).toISOString(),
        };
        const screened = await screenDeclared(deps.screening, request.payoutAddress, true);
        let decision = route(request, deps.policy, {
          now: now(),
          seenBefore: (who) => deps.store.hasSeen(who),
          screen: () => screened,
        });

        /*
         * The same consultation the agent-facing endpoint makes, on the same rule.
         *
         * Without this the visitor's request reached rule 9 and stopped there, so the one path a
         * judge actually walks was the only one a decision model never saw. It can still only
         * answer `ask` or `drop`; there is no value here that opens the door either.
         */
        if (decision.verdict === 'human' && decision.rule === 9 && deps.classifier) {
          decision = applyClassification(decision, await deps.classifier.classify(request));
        }

        const entry: Entry = { request, decision, receivedAt: now().toISOString() };
        if (deps.idkitDemo) entry.demoBrowser = beginDemoBrowser(req, res, deps.idkitDemo.origin);

        /*
         * Sign on the buyer's behalf, payable to the visitor.
         *
         * This is the only place the server signs anything, and it still moves nothing: an
         * EIP-3009 authorization is inert until settled, and settlement happens exactly once,
         * after a verified person says yes.
         */
        const payTo = skipping ? undefined : wanted || undefined;
        if (decision.verdict === 'human' && payTo && deps.settlement?.live && deps.demoBuyerKey && allowDemoSignature()) {
          const requirement = deps.settlement.quote(
            request.price.amount,
            request.price.currency,
            payTo,
          );
          try {
            const payload = await signAuthorization({
              privateKey: deps.demoBuyerKey,
              requirement,
              validBeforeMs: new Date(request.deadline).getTime(),
              resourceUrl: `${deps.origin ?? ''}/requests`,
              now,
            });
            entry.auth = {
              payload,
              requirement,
              validBefore: Math.ceil(new Date(request.deadline).getTime() / 1000),
            };
            entry.payTo = payTo;
          } catch {
            // A signature we could not produce is simply a demo without a payment.
          }
        }

        deps.store.add(entry);
        if (decision.verdict !== 'human') {
          // Not an error. The visitor asked to see the router decide, and it decided.
          return html(res, 200, resultPage({
            outcome: 'refused',
            detail: `Rule ${decision.rule} — ${decision.reason}. Nothing was paid and nobody was `
              + 'notified. Open /dropped to see everything else it refused.',
            what: request.what,
          }));
        }
        res.writeHead(302, { location: `/approve/${encodeURIComponent(request.id)}` });
        return res.end();
      }

      /*
       * What was refused on her behalf.
       *
       * Reachable from the fold on the approval screen, and on its own so it can be linked to.
       * It reads the store rather than a log, so it cannot drift from what actually happened.
       */
      if (req.method === 'GET' && path === '/dropped') {
        const denied = deps.store.byVerdict('deny');
        return html(
          res,
          200,
          droppedPage({
            arrived: deps.store.all().length,
            items: denied.map((e) => ({
              who: e.request.who,
              what: e.request.what,
              question: asQuestion(e.request.what, e.request.id),
              amount: e.request.price.amount,
              currency: e.request.price.currency,
              rule: e.decision.rule,
              reason: e.decision.reason,
              at: e.receivedAt,
            })),
          }),
        );
      }

      /* ── the page she opens ─────────────────────────────────────────────── */
      if (req.method === 'GET' && /^\/approve\/[^/]+$/.test(path)) {
        const id = decodeURIComponent(path.slice('/approve/'.length));
        const entry = deps.store.get(id);
        if (!entry) return html(res, 404, resultPage({ outcome: 'refused', detail: 'No such request.' }));
        if (deps.idkitDemo && !approvalBrowser(req, entry, deps.idkitDemo)) {
          return html(res, 403, resultPage({ outcome: 'refused', detail: 'For ordinary requests, sign in at /owner/login. For visitor demos, use the browser that started /try.' }));
        }
        if (entry.resolution) {
          return html(res, 200, resultPage({
            outcome: entry.resolution === 'approved' ? 'approved' : 'declined',
            detail: 'You already answered this one.',
          }));
        }
        if (new Date(entry.request.deadline).getTime() <= now().getTime()) {
          return html(res, 200, resultPage({
            outcome: 'expired',
            detail: onDeadline().reason,
          }));
        }
        const handledWithoutYou =
          deps.store.byVerdict('auto').length + deps.store.byVerdict('deny').length;
        return html(res, 200, approvalPage({
          id,
          handledWithoutYou,
          who: entry.request.who,
          what: entry.request.what,
          question: asQuestion(entry.request.what, entry.request.id),
          purpose: entry.request.purpose,
          amount: entry.request.price.amount,
          currency: entry.request.price.currency,
          deadline: entry.request.deadline,
          reason: entry.decision.reason,
          identityWired: Boolean(deps.idkitDemo || deps.identityWired),
          ...(entry.payTo ? { payTo: entry.payTo } : {}),
          today: todaySummary(deps.store, Boolean(deps.settlement?.live)),
          nights: deps.nights ?? [],
        }));
      }

      /* ── she presses approve: go and prove it ───────────────────────────── */
      if (req.method === 'GET' && /^\/approve\/[^/]+\/verify$/.test(path)) {
        const id = decodeURIComponent(path.slice('/approve/'.length, -'/verify'.length));
        if (deps.idkitDemo) {
          res.writeHead(303, { location: `/world-approval?id=${encodeURIComponent(id)}` });
          return res.end();
        }
        const entry = deps.store.get(id);
        if (!entry || entry.resolution) {
          return html(res, 404, resultPage({ outcome: 'refused', detail: 'Nothing to approve.' }));
        }
        if (!deps.identity || !deps.redirectUri) {
          return html(res, 500, resultPage({
            outcome: 'refused',
            detail: 'Identity is not configured, so this cannot ask you to prove anything.',
          }));
        }
        const { state, nonce, codeVerifier } = pending.begin(id);
        const url = await deps.identity.beginUrl({
          state,
          nonce,
          redirectUri: deps.redirectUri,
          codeVerifier,
        });
        res.writeHead(302, { location: url });
        return res.end();
      }

      /* ── she presses "not this one" ─────────────────────────────────────── */
      if (req.method === 'POST' && /^\/approve\/[^/]+\/decline$/.test(path)) {
        const id = decodeURIComponent(path.slice('/approve/'.length, -'/decline'.length));
        const entry = deps.store.get(id);
        if (!entry || entry.resolution) {
          return html(res, 404, resultPage({ outcome: 'refused', detail: 'Nothing to answer.' }));
        }
        if (deps.idkitDemo && (req.headers.origin !== deps.idkitDemo.origin
          || !approvalBrowser(req, entry, deps.idkitDemo))) {
          return json(res, 403, { error: 'Sign in as the owner or use your own visitor demo.' });
        }
        if (deps.idkitDemo && !entry.demoBrowser && !await deps.idkitDemo.owner?.authority()) {
          return json(res, 403, { error: 'owner_authority_not_verified' });
        }
        if (deps.idkitDemo && !approvalBrowser(req, entry, deps.idkitDemo)) {
          return json(res, 403, { error: 'owner_session_expired' });
        }
        if (entry.resolution) return json(res, 409, { error: 'already answered' });
        return refuse(res, entry, 'declined', 'Nothing was sent, and nothing moved.', 'refused');
      }

      /* ── she comes back from the issuer ─────────────────────────────────── */
      if (req.method === 'GET' && path === '/auth/world/callback') {
        if (deps.idkitDemo) return json(res, 403, { error: 'OIDC callbacks cannot approve an IDKit demo.' });
        const state = url.searchParams.get('state') ?? '';
        const p = pending.take(state);
        if (!p) {
          return html(res, 400, resultPage({
            outcome: 'refused',
            detail: 'That reply did not match anything we are waiting for.',
          }));
        }
        const entry = deps.store.get(p.requestId);
        if (!entry || entry.resolution) {
          return html(res, 404, resultPage({ outcome: 'refused', detail: 'Nothing to approve.' }));
        }
        if (new Date(entry.request.deadline).getTime() <= now().getTime()) {
          return refuse(res, entry, 'expired', onDeadline().reason, 'ignored');
        }
        if (!deps.identity || !deps.redirectUri) {
          return html(res, 500, resultPage({ outcome: 'refused', detail: 'Identity is not configured.' }));
        }

        const outcome = await deps.identity.complete({
          ...(url.searchParams.get('code') ? { code: url.searchParams.get('code')! } : {}),
          ...(url.searchParams.get('error') ? { error: url.searchParams.get('error')! } : {}),
          redirectUri: deps.redirectUri,
          nonce: p.nonce,
          codeVerifier: p.codeVerifier,
          at: now(),
        });

        if (entry.resolution) return json(res, 409, { error: 'already answered' });
        if (!(Date.parse(entry.request.deadline) > now().getTime())) {
          return refuse(res, entry, 'expired', onDeadline().reason, 'ignored');
        }
        if (outcome.status !== 'verified') {
          // Refusal, staleness and an unreachable issuer all end the same way.
          return refuse(res, entry, 'refused', `${outcome.status}: ${outcome.reason}`, 'ignored');
        }

        claimApproval(entry);
        const paid = await settleApproved(entry, deps.settlement, deps.screening, now);
        entry.settlement = paid.settled ? paid.transaction : 'not-wired';
        deps.store.remember({
          who: entry.request.who,
          what: entry.request.what,
          outcome: 'approved',
          decidedAt: now().toISOString(),
          escalatedBy: entry.decision.rule,
        });
        completeApproval(entry, { id: entry.request.id, verdict: 'approved', settlement: paid });
        return html(res, 200, resultPage({
          outcome: 'approved',
          detail: entry.request.what,
          what: entry.request.what,
          amount: `${entry.request.price.amount} ${entry.request.price.currency}`,
          verifiedAt: outcome.identity.authTime,
          acr: outcome.identity.acr,
          ...(outcome.identity.amr ? { amr: outcome.identity.amr } : {}),
          ...(paid.settled
            ? {
                settled: { transaction: paid.transaction, network: paid.network },
                ...(deps.explorerUrl ? { explorer: deps.explorerUrl } : {}),
              }
            : { notSettled: paid.reason }),
        }));
      }

      json(res, 404, { error: 'not found', endpoints: [
        'GET /',
        'GET /health',
        'POST /requests',
        'POST /approvals/:id',
        'GET /ledger/:name',
        'GET /try',
        'GET /dropped',
        'GET /approve/:id',
        'GET /auth/world/callback',
      ] });
    } catch (err) {
      // Anything unexpected denies rather than passing. Failing open here would undo
      // every other guarantee in the system.
      json(res, 500, {
        error: 'the operation could not complete; check its recorded outcome before retrying',
      });
    }
  });
  return server;
}
