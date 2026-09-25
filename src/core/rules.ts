/**
 * Yohaku — the routing rules.
 *
 * Ten ordered rules. The first match decides. Safe outcomes are evaluated first,
 * so that anything ambiguous has already been caught by the time we reach `auto`.
 *
 * Two properties matter more than the individual rules:
 *
 *   1. Rule 0 is on a different axis. Rules 1–9 judge a request arriving from outside;
 *      rule 0 judges the owner's own delegate. Handing work to an AI and letting an AI
 *      widen its own authority are different events, and only the second is an attack.
 *
 *   2. Rule 9 — "nothing matched" — falls to `human`, never to `auto`. A router that
 *      sends the unknown to `auto` cannot be explained after an incident.
 */

import type {
  AgentRequest,
  Decision,
  Grant,
  Policy,
  RoutingContext,
} from './types.js';

const deny = (rule: number, reason: string): Decision => ({ verdict: 'deny', rule, reason });
const human = (rule: number, reason: string): Decision => ({ verdict: 'human', rule, reason });
const auto = (rule: number, reason: string): Decision => ({ verdict: 'auto', rule, reason });

/** A grant covers a request when the category matches and the grantee is not narrower. */
function grantFor(policy: Policy, req: AgentRequest): Grant | undefined {
  return policy.grants.find(
    (g) => g.category === req.what && (g.grantee === undefined || g.grantee === req.who),
  );
}

/**
 * Decide what happens to one request.
 *
 * Pure. No I/O, no clock of its own — everything variable arrives through `ctx`,
 * so the same inputs always produce the same decision and the demo is reproducible.
 */
export function route(req: AgentRequest, policy: Policy, ctx: RoutingContext): Decision {
  // ── 0. The delegate may propose. It may not widen its own rights. ──────────
  // Rejected on-chain as well; this is the server agreeing with the contract.
  if (req.actingAs === 'delegate') {
    if (ctx.delegationRevoked) {
      return deny(0, 'delegation has been revoked — even proposals stop');
    }
    if (req.writeTarget !== undefined && req.writeTarget !== 'proposal') {
      return deny(0, `a delegate may not write to "${req.writeTarget}"`);
    }
  }

  const grant = grantFor(policy, req);

  // ── 1. Revoked ────────────────────────────────────────────────────────────
  if (grant?.revoked) {
    return deny(1, `the grant for "${req.what}" was revoked`);
  }

  // ── 2. Explicitly forbidden ───────────────────────────────────────────────
  if (policy.forbid.includes(req.what)) {
    return deny(2, `"${req.what}" is never offered`);
  }

  // ── 3. Expired ────────────────────────────────────────────────────────────
  if (grant && new Date(grant.expiresAt).getTime() <= ctx.now.getTime()) {
    return deny(3, `the grant for "${req.what}" expired on ${grant.expiresAt}`);
  }

  // ── 4. Payment source ─────────────────────────────────────────────────────
  // `unavailable` is not a pass. If we cannot check, we do not move money.
  const screening = ctx.screen(req.payoutAddress);
  if (screening === 'flagged') {
    return deny(4, 'the payment source failed screening');
  }
  if (screening === 'unavailable') {
    return deny(4, 'screening was unavailable — we do not settle unchecked');
  }

  // ── 5. Sensitive domain ───────────────────────────────────────────────────
  if (policy.sensitive.includes(req.what)) {
    return human(5, `"${req.what}" is a sensitive domain`);
  }

  // ── 6. Above the owner's threshold ────────────────────────────────────────
  if (req.price.amount > policy.amountThreshold) {
    return human(6, `${req.price.amount} ${req.price.currency} is above the threshold`);
  }

  // ── 7. First time seeing this counterparty ────────────────────────────────
  if (!ctx.seenBefore(req.who)) {
    return human(7, `first request from ${req.who}`);
  }

  // ── 8. Inside the allow list ──────────────────────────────────────────────
  if (policy.allow.includes(req.what) && grant !== undefined) {
    return auto(8, `within the standing grant for "${req.what}"`);
  }

  // ── 9. Nothing matched. Ask, do not assume. ───────────────────────────────
  return human(9, 'no rule matched — the unknown goes to a person, never to auto');
}

/**
 * What a failure means.
 *
 * Every path falls to `deny`. This is the answer to "what happens when your service
 * is down?", and it is the same answer every time. Silence is not consent: a signal
 * that cannot tell "quiet" from "dead" is not a signal.
 */
export type Failure =
  | 'routing-engine-down'
  | 'screening-unavailable'
  | 'identity-check-failed'
  | 'deadline-passed';

export function onFailure(kind: Failure): Decision {
  const reasons: Record<Failure, string> = {
    'routing-engine-down': 'the router could not decide',
    'screening-unavailable': 'the payment source could not be checked',
    'identity-check-failed': 'the person could not be verified at that moment',
    'deadline-passed': 'the deadline passed without an answer — silence is not consent',
  };
  return deny(-1, reasons[kind]);
}
