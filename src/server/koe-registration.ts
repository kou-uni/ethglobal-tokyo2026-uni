import { createHash, randomBytes } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Policy } from '../core/types.js';
import { ASKS, ASK_QUESTION } from '../core/night.js';
import type { IdkitChallenge, IdkitProofSummary } from '../adapters/idkit-proof.js';
import { beginDemoBrowser, demoBrowser, type IdkitApprovalOptions } from './idkit-approval.js';

const base = '/koe-registration';
const ttl = 60 * 60 * 1000;
type Draft = { name: string; headline: string; about: string; topic: string };
type Attempt = IdkitChallenge & { id: string; browser: string; draft: Draft };
type Listing = { id: string; draft: Draft; proof: IdkitProofSummary; expiresAt: number };
const digest = (s: string) => createHash('sha256').update(s).digest('hex');

/** Reuses IDKit signing/verification; has no access to requests, approvals or settlement. */
export function createKoeRegistration(options: IdkitApprovalOptions | undefined, policy: Policy, now = Date.now) {
  const pending = new Map<string, Attempt>();
  // Kept during API verification so cancellation/removal/new attempts invalidate in-flight work.
  const active = new Map<string, Attempt>();
  const listings = new Map<string, Listing>();
  const offered = policy.allow.filter(t => ASKS.some(a => a.what === t));
  const clean = () => {
    for (const [id, c] of pending) if (c.expiresAt <= now() / 1000) pending.delete(id);
    for (const [browser, c] of active) if (c.expiresAt <= now() / 1000) active.delete(browser);
    for (const [browser, l] of listings) if (l.expiresAt <= now()) listings.delete(browser);
  };
  function parseDraft(body: Record<string, unknown>): Draft {
    if (body.consent !== true || typeof body.topic !== 'string' || !offered.includes(body.topic)) throw new Error('invalid_draft');
    const field = (key: string, max: number, min = 1) => {
      const value = body[key];
      if (typeof value !== 'string' || value.trim().length < min || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) throw new Error('invalid_draft');
      return value.trim();
    };
    return { name: field('name', 40), headline: field('headline', 100), about: field('about', 300, 0), topic: body.topic };
  }
  function profile(l: Listing) {
    return {
      handle: l.id, name: l.draft.name, headline: l.draft.headline, about: l.draft.about,
      verified: `World ID · ${l.proof.credential} · personhood only`,
      verification: { environment: l.proof.environment, protocolVersion: l.proof.protocolVersion, credential: l.proof.credential, checkedAt: l.proof.checkedAt },
      answers: [l.draft.topic], needsToBeAsked: [], willNotAnswer: [...policy.forbid],
      priceFrom: { amount: 80, currency: 'JPYC' }, interruptionsPerDay: policy.dailyCap,
      router: options!.origin, expiresAt: new Date(l.expiresAt).toISOString(),
      note: 'Temporary participant. Profile text is self-reported. Requests go to the shared demo router, not this individual. No answers are delivered.',
    };
  }
  return async (req: IncomingMessage, res: ServerResponse): Promise<boolean> => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname !== base && !url.pathname.startsWith(base + '/')) return false;
    const json = (status: number, data: unknown) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data));
    };
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'unsafe-inline'; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    if (!options?.assets.koePage || !options.assets.koeJs) {
      json(503, { error: 'Koe production World verification is not enabled on this server. No profile was published.' }); return true;
    }
    if (req.headers.host !== new URL(options.origin).host) { json(403, { error: 'wrong_host' }); return true; }
    clean();
    if (req.method === 'GET' && url.pathname === base + '/directory.json') {
      // Only intentionally public profile fields. Never send cookies, proof, nonce or nullifier.
      res.setHeader('Access-Control-Allow-Origin', '*');
      json(200, {
        service: 'koe', version: 1, updated: new Date(now()).toISOString(), temporary: true,
        note: 'Production World personhood checked. Self-reported profiles expire within one hour or on server restart. No uniqueness, authorship or truth claim. Shared demo router only.',
        profiles: [...listings.values()].map(profile),
      }); return true;
    }
    if (req.method === 'GET' && url.pathname === base + '/app.js') {
      res.setHeader('Content-Type', 'text/javascript'); res.end(options.assets.koeJs); return true;
    }
    if (req.method === 'GET' && url.pathname === base + '/idkit_wasm_bg.wasm') {
      res.setHeader('Content-Type', 'application/wasm'); res.end(options.assets.wasm); return true;
    }
    if (req.method === 'GET' && url.pathname === base) {
      beginDemoBrowser(req, res, options.origin);
      res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(options.assets.koePage); return true;
    }
    const browser = demoBrowser(req, options.origin);
    if (!browser) { json(403, { error: 'Open the registration page in this browser first.' }); return true; }
    if (req.method === 'GET' && url.pathname === base + '/me') {
      json(200, { profile: listings.has(browser) ? profile(listings.get(browser)!) : null,
        topics: offered.map(value => ({ value, label: ASK_QUESTION[value] ?? value })) }); return true;
    }
    if (req.method !== 'POST' || req.headers.origin !== options.origin) {
      json(403, { error: 'Use this site’s registration form.' }); return true;
    }
    try {
      let raw = '';
      for await (const chunk of req) { raw += chunk; if (raw.length > 65536) throw new Error('too_large'); }
      const body = JSON.parse(raw || '{}');
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid_body');
      if (url.pathname === base + '/remove') {
        const current = active.get(browser);
        if (current) pending.delete(current.id);
        active.delete(browser); listings.delete(browser);
        json(200, { removed: true }); return true;
      }
      if (url.pathname === base + '/challenge') {
        const draft = parseDraft(body);
        if (active.size >= 100 && !active.has(browser) || listings.size >= 100 && !listings.has(browser)) {
          json(429, { error: 'The demo is full. Please try again later.' }); return true;
        }
        const previous = active.get(browser);
        if (previous) pending.delete(previous.id);
        const rp = options.sign(), id = randomBytes(32).toString('hex');
        const c: Attempt = {
          id, browser, draft, nonce: rp.nonce, action: options.action,
          signal: digest(JSON.stringify(['koe-publish', draft, id, browser])),
          expiresAt: Math.min(rp.expires_at, Math.floor(now() / 1000) + 120),
        };
        active.set(browser, c); pending.set(id, c);
        json(200, { id, signal: c.signal, appId: options.appId, action: options.action, rp_context: rp }); return true;
      }
      if (url.pathname === base + '/cancel') {
        const c = active.get(browser);
        if (c && c.id === body.id) { active.delete(browser); pending.delete(c.id); }
        json(200, { cancelled: true }); return true;
      }
      if (url.pathname !== base + '/verify') { json(404, { error: 'not_found' }); return true; }
      const c = typeof body.id === 'string' ? pending.get(body.id) : undefined;
      if (!c || c.browser !== browser || active.get(browser) !== c) {
        json(409, { error: 'Expired, used or different-browser verification. Start again.' }); return true;
      }
      pending.delete(c.id); // Consume before awaiting the provider, including failed proofs.
      const proof = await options.verify(c, body.proof);
      if (active.get(browser) !== c || c.expiresAt <= now() / 1000) {
        json(409, { error: 'Registration changed or expired while verifying. Nothing published.' }); return true;
      }
      active.delete(browser);
      if (listings.size >= 100 && !listings.has(browser)) { json(429, { error: 'The demo is full. Nothing published.' }); return true; }
      if (proof.verified !== true || proof.environment !== 'production') throw new Error('invalid_summary');
      const listing = { id: 'human-' + randomBytes(8).toString('hex'), draft: c.draft, proof, expiresAt: now() + ttl };
      listings.set(browser, listing);
      json(200, { registered: true, profile: profile(listing), payment: 'none' }); return true;
    } catch {
      json(403, { error: 'Registration could not be verified. No new profile was published. Review the form and start again.' }); return true;
    }
  };
}
