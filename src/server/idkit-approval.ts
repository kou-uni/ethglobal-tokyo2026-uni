import { createHash, randomBytes } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RpContext } from '@worldcoin/idkit-core';
import type { IdkitChallenge, IdkitProofSummary } from '../adapters/idkit-proof.js';
import type { Entry, Store } from './state.js';
import { asQuestion } from '../core/night.js';

export interface IdkitApprovalOptions {
  origin: string;
  appId: string;
  action: string;
  sign(): RpContext;
  verify(challenge: IdkitChallenge, proof: unknown): Promise<IdkitProofSummary>;
  assets: { page: string; js: Uint8Array; wasm: Uint8Array };
}
export function demoCookieName(origin: string) {
  return new URL(origin).protocol === 'https:' ? '__Secure-YohakuDemo' : 'YohakuDemo';
}
export function demoBrowser(req: IncomingMessage, origin: string): string | undefined {
  const name = demoCookieName(origin);
  const cookie = req.headers.cookie?.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='))?.slice(name.length + 1);
  return cookie && /^[a-f0-9]{64}$/.test(cookie) ? digest(cookie) : undefined;
}
export function beginDemoBrowser(req: IncomingMessage, res: ServerResponse, origin: string): string {
  const existing = demoBrowser(req, origin);
  if (existing) return existing;
  const cookie = randomBytes(32).toString('hex');
  res.setHeader('Set-Cookie', `${demoCookieName(origin)}=${cookie}; HttpOnly; ${new URL(origin).protocol === 'https:' ? 'Secure; ' : ''}SameSite=Strict; Path=/; Max-Age=21600`);
  return digest(cookie);
}
const base = '/world-approval';
const digest = (s: string) => createHash('sha256').update(s).digest('hex');
const snapshot = (e: Entry) => digest(JSON.stringify({
  request: e.request, decision: e.decision, auth: e.auth ?? null, payTo: e.payTo ?? null,
}));
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Any qualified human may approve their own visitor demo; this is not owner authorization. */
export function createIdkitApproval(
  options: IdkitApprovalOptions, store: Store,
  finish: (entry: Entry, summary: IdkitProofSummary) => Promise<unknown>,
  now: () => number = Date.now,
) {
  const pending = new Map<string, IdkitChallenge & { browser: string; requestId: string; snapshot: string; entry: Entry }>();
  return async (req: IncomingMessage, res: ServerResponse): Promise<boolean> => {
    const url = new URL(req.url ?? '/', options.origin);
    if (url.pathname !== base && !url.pathname.startsWith(base + '/')) return false;
    const json = (code: number, body: unknown) => {
      res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(body));
    };
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'unsafe-inline'; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    if (req.headers.host !== new URL(options.origin).host) { json(403, { error: 'wrong_host' }); return true; }
    for (const [id, c] of pending) if (c.expiresAt <= now() / 1000) pending.delete(id);
    if (req.method === 'GET' && url.pathname === base + '/app.js') {
      res.setHeader('content-type', 'text/javascript'); res.end(options.assets.js); return true;
    }
    if (req.method === 'GET' && url.pathname === base + '/idkit_wasm_bg.wasm') {
      res.setHeader('content-type', 'application/wasm'); res.end(options.assets.wasm); return true;
    }
    if (req.method === 'GET' && url.pathname === base) {
      const entry = store.get(url.searchParams.get('id') ?? '');
      if (!entry || entry.resolution || entry.decision.verdict !== 'human'
        || !entry.demoBrowser || entry.demoBrowser !== demoBrowser(req, options.origin)
        || !(Date.parse(entry.request.deadline) > now())) {
        json(409, { error: 'Nothing to approve' }); return true;
      }
      const request = entry.request;
      const details = `${request.who}\n${asQuestion(request.what)}\nPurpose: ${request.purpose}\nOffer: ${request.price.amount.toLocaleString('en-US')} ${request.price.currency}\n${entry.auth ? `Approval will release the held payment to ${entry.auth.requirement.payTo}.` : 'This run has no payment. Nothing will be transferred.'}`;
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.end(options.assets.page.replace('<!--REQUEST-->', escape(details))
        .replace('<!--SNAPSHOT-->', snapshot(entry)));
      return true;
    }
    if (req.method !== 'POST' || req.headers.origin !== options.origin) {
      json(403, { error: 'このサイトの承認画面から操作してください' }); return true;
    }
    const browser = demoBrowser(req, options.origin);
    if (!browser) { json(403, { error: 'missing_browser' }); return true; }
    try {
      let raw = '';
      for await (const chunk of req) { raw += chunk; if (raw.length > 65536) throw new Error('too_large'); }
      const body = JSON.parse(raw || '{}');
      if (url.pathname === base + '/challenge') {
        const entry = store.get(body.requestId);
        if (!entry || entry.resolution || entry.decision.verdict !== 'human'
          || entry.demoBrowser !== browser
          || !(Date.parse(entry.request.deadline) > now()) || body.snapshot !== snapshot(entry)) {
          json(409, { error: '依頼が変更・終了しています。承認画面を開き直してください' }); return true;
        }
        if (pending.size >= 100) { json(429, { error: '少し待ってからお試しください' }); return true; }
        for (const [id, c] of pending) if (c.browser === browser) pending.delete(id);
        const rp = options.sign();
        const id = randomBytes(32).toString('hex');
        const signal = digest(JSON.stringify(['approve', entry.request.id, snapshot(entry), id]));
        pending.set(id, {
          entry, requestId: entry.request.id, snapshot: snapshot(entry), browser,
          nonce: rp.nonce, action: options.action, signal,
          expiresAt: Math.min(rp.expires_at, Math.floor(now() / 1000) + 120, Math.floor(Date.parse(entry.request.deadline) / 1000)),
        });
        json(200, { id, signal, appId: options.appId, action: options.action, rp_context: rp }); return true;
      }
      const c = typeof body.id === 'string' ? pending.get(body.id) : undefined;
      if (!c || c.browser !== browser) { json(400, { error: '期限切れ・使用済み・別ブラウザーの認証です' }); return true; }
      if (url.pathname !== base + '/verify' && url.pathname !== base + '/cancel') { json(404, { error: 'not_found' }); return true; }
      pending.delete(body.id); // Consume before the network request; never retry uncertain proofs.
      if (url.pathname === base + '/cancel') { json(200, { cancelled: true }); return true; }
      const summary = await options.verify(c, body.proof);
      const current = store.get(c.requestId);
      if (!current || current !== c.entry || current.resolution || current.decision.verdict !== 'human'
        || current.demoBrowser !== browser
        || snapshot(current) !== c.snapshot || !(Date.parse(current.request.deadline) > now())
        || c.expiresAt <= now() / 1000) {
        json(409, { error: '検証中に依頼が変更・終了しました。承認しませんでした' }); return true;
      }
      // finish must claim resolution synchronously before its first await.
      json(200, await finish(current, summary)); return true;
    } catch {
      json(403, { error: '承認を完了できませんでした。結果を確認してから新しい操作を始めてください。' }); return true;
    }
  };
}
