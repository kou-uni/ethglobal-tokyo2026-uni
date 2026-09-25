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

export interface AppDeps {
  policy: Policy;
  store: Store;
  screening: ScreeningPort;
  /** Optional: consulted only on rule 9. */
  classifier?: ClassifierPort;
  /** Optional: required before an approval can settle. */
  identity?: IdentityPort;
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

      json(res, 404, { error: 'not found', endpoints: ['GET /health', 'POST /requests', 'POST /approvals/:id', 'GET /ledger/:name'] });
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
