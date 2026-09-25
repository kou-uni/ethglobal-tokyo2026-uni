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
import { surface } from '../core/queue.js';
import { route } from '../core/rules.js';
import { onDeadline } from '../core/queue.js';
import type { AgentRequest, Policy, RoutingContext } from '../core/types.js';
import { applyClassification, type ClassifierPort } from '../ports/classifier.js';
import { mayProceed, type IdentityPort, type VerificationOutcome } from '../ports/identity.js';
import { mayMoveMoney, type ScreeningPort } from '../ports/screening.js';
import { Store, verdictBody, type Entry } from './state.js';
import { PendingVerifications } from './pending.js';
import { approvalPage, resultPage } from './pages.js';

export interface AppDeps {
  policy: Policy;
  store: Store;
  screening: ScreeningPort;
  /** Optional: consulted only on rule 9. */
  classifier?: ClassifierPort;
  /** Optional: required before an approval can settle. */
  identity?: IdentityPort;
  /** Where the issuer sends her back. Must be HTTPS and registered with them. */
  redirectUri?: string;
  /** True only when a real issuer is configured — the page says which. */
  identityWired?: boolean;
  now?: () => Date;
}

const FIVE_FIELDS = ['who', 'what', 'purpose', 'price', 'deadline'] as const;

function json(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body, null, 2);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(text);
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

/** Every field, or a 400 naming the ones missing. Agents deserve a usable error. */
function validate(body: Record<string, unknown>): { ok: true; request: AgentRequest } | { ok: false; missing: string[] } {
  const missing = FIVE_FIELDS.filter((f) => body[f] === undefined);
  if (missing.length) return { ok: false, missing };
  const price = body['price'] as { amount?: unknown; currency?: unknown };
  if (typeof price?.amount !== 'number' || typeof price?.currency !== 'string') {
    return { ok: false, missing: ['price.amount (number)', 'price.currency (string)'] };
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

  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const path = url.pathname;

    try {
      /* ── health ─────────────────────────────────────────────────────────── */
      if (req.method === 'GET' && path === '/health') {
        return json(res, 200, {
          ok: true,
          owner: deps.policy.owner,
          dailyCap: deps.policy.dailyCap,
          // Said plainly, rather than discovered by a judge.
          wired: {
            routing: true,
            classifier: Boolean(deps.classifier),
            identity: Boolean(deps.identity),
            screening: true,
            settlement: false,
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

        // Screening runs before anything can settle, and its result decides the branch.
        // Awaited here so that `route` stays synchronous and pure.
        const screened = await deps.screening.scan(request.payoutAddress ?? '');
        const routingCtx: RoutingContext = {
          now: now(),
          seenBefore: (who) => deps.store.hasSeen(who),
          screen: () => screened,
        };

        let decision = route(request, deps.policy, routingCtx);
        decision = applyLearned(request, decision, learn(deps.store.history()));

        // The model is consulted in exactly one place.
        if (decision.verdict === 'human' && decision.rule === 9 && deps.classifier) {
          decision = applyClassification(decision, await deps.classifier.classify(request));
        }

        const entry: Entry = { request, decision, receivedAt: now().toISOString() };

        // `auto` settles — or would, if settlement were wired. It is not, and the response
        // says so rather than implying a payment happened.
        if (decision.verdict === 'auto' && mayMoveMoney(screened)) {
          entry.settlement = 'not-wired';
        }
        deps.store.add(entry);

        const status = decision.verdict === 'human' ? 202 : 200;
        return json(res, status, verdictBody(entry));
      }

      /* ── the owner answers ──────────────────────────────────────────────── */
      if (req.method === 'POST' && path.startsWith('/approvals/')) {
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

        entry.resolution = 'approved';
        entry.settlement = 'not-wired';
        deps.store.remember({
          who: entry.request.who,
          what: entry.request.what,
          outcome: 'approved',
          decidedAt: now().toISOString(),
          escalatedBy: entry.decision.rule,
        });

        return json(res, 200, {
          id,
          verdict: 'approved',
          identity: verification?.status === 'verified'
            ? { verifiedAt: verification.identity.authTime.toISOString(), acr: verification.identity.acr }
            : 'not wired',
          settlement: 'not wired',
        });
      }

      /* ── what she wakes up to ───────────────────────────────────────────── */
      if (req.method === 'GET' && path.startsWith('/ledger/')) {
        const outstanding = deps.store.outstanding();
        const morning = surface(outstanding, deps.policy, now());
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

      /* ── the page she opens ─────────────────────────────────────────────── */
      if (req.method === 'GET' && /^\/approve\/[^/]+$/.test(path)) {
        const id = decodeURIComponent(path.slice('/approve/'.length));
        const entry = deps.store.get(id);
        if (!entry) return html(res, 404, resultPage({ outcome: 'refused', detail: 'No such request.' }));
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
        return html(res, 200, approvalPage({
          id,
          who: entry.request.who,
          what: entry.request.what,
          purpose: entry.request.purpose,
          amount: entry.request.price.amount,
          currency: entry.request.price.currency,
          deadline: entry.request.deadline,
          reason: entry.decision.reason,
          identityWired: Boolean(deps.identityWired),
        }));
      }

      /* ── she presses approve: go and prove it ───────────────────────────── */
      if (req.method === 'GET' && /^\/approve\/[^/]+\/verify$/.test(path)) {
        const id = decodeURIComponent(path.slice('/approve/'.length, -'/verify'.length));
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
        return refuse(res, entry, 'declined', 'Nothing was sent, and nothing moved.', 'refused');
      }

      /* ── she comes back from the issuer ─────────────────────────────────── */
      if (req.method === 'GET' && path === '/auth/world/callback') {
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

        if (outcome.status !== 'verified') {
          // Refusal, staleness and an unreachable issuer all end the same way.
          return refuse(res, entry, 'refused', `${outcome.status}: ${outcome.reason}`, 'ignored');
        }

        entry.resolution = 'approved';
        entry.settlement = 'not-wired';
        deps.store.remember({
          who: entry.request.who,
          what: entry.request.what,
          outcome: 'approved',
          decidedAt: now().toISOString(),
          escalatedBy: entry.decision.rule,
        });
        return html(res, 200, resultPage({
          outcome: 'approved',
          detail: `${entry.request.what} — ${entry.request.price.amount} ${entry.request.price.currency}`,
          verifiedAt: outcome.identity.authTime.toISOString(),
          acr: outcome.identity.acr,
        }));
      }

      json(res, 404, { error: 'not found', endpoints: [
        'GET /health',
        'POST /requests',
        'POST /approvals/:id',
        'GET /ledger/:name',
        'GET /approve/:id',
        'GET /auth/world/callback',
      ] });
    } catch (err) {
      // Anything unexpected denies rather than passing. Failing open here would undo
      // every other guarantee in the system.
      json(res, 500, {
        error: 'the router could not decide, so nothing was allowed',
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  });
}
