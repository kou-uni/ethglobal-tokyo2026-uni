import { randomBytes, createHash } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Policy } from '../core/types.js';
import type { Store } from './state.js';

export interface OwnerAuthOptions {
  origin: string;
  address: `0x${string}`;
  name: string;
  verify(message: string, signature: `0x${string}`): Promise<boolean>;
  authority(): Promise<boolean>;
}
const digest = (s: string) => createHash('sha256').update(s).digest('hex');
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const page = (body: string) => `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Yohaku — owner</title><body><main><h1>Your Yohaku inbox</h1>${body}</main></body></html>`;
const loginJs = `
document.querySelector('button').onclick = async () => {
  const status = document.querySelector('[role=status]');
  try {
    if (!window.ethereum) throw new Error('Open this page in a browser with your owner wallet.');
    const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const r = await fetch('/owner/challenge', { method: 'POST' });
    const challenge = await r.json();
    if (!r.ok) throw new Error(challenge.error);
    if (account.toLowerCase() !== challenge.address.toLowerCase()) throw new Error('Select the configured owner wallet: ' + challenge.address);
    const bytes = new TextEncoder().encode(challenge.message);
    const message = '0x' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    const signature = await window.ethereum.request({ method: 'personal_sign', params: [message, account] });
    const result = await fetch('/owner/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ signature }) });
    if (!result.ok) throw new Error((await result.json()).error);
    location.assign('/owner');
  } catch (e) { status.textContent = e.message || 'Sign-in could not be completed.'; }
};`;

/** Wallet authority and personhood are separate checks. This session proves only the former. */
export class OwnerAuth {
  private challenges = new Map<string, { message: string; expires: number }>();
  private sessions = new Map<string, number>();
  constructor(readonly options: OwnerAuthOptions, private now: () => number = Date.now) {}
  private cookieName() { return new URL(this.options.origin).protocol === 'https:' ? '__Host-YohakuOwner' : 'YohakuOwner'; }
  private token(req: IncomingMessage) {
    const name = this.cookieName();
    const value = req.headers.cookie?.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='))?.slice(name.length + 1);
    return value && /^[a-f0-9]{64}$/.test(value) ? digest(value) : undefined;
  }
  private cookie(res: ServerResponse, seconds: number) {
    const token = randomBytes(32).toString('hex');
    res.setHeader('Set-Cookie', `${this.cookieName()}=${token}; Path=/; HttpOnly; SameSite=Strict; ${new URL(this.options.origin).protocol === 'https:' ? 'Secure; ' : ''}Max-Age=${seconds}`);
    return digest(token);
  }
  browser(req: IncomingMessage): string | undefined {
    if (req.headers.host !== new URL(this.options.origin).host) return undefined;
    const token = this.token(req);
    return token && (this.sessions.get(token) ?? 0) > this.now() ? token : undefined;
  }
  async authority() {
    try { return await this.options.authority(); } catch { return false; }
  }
  async handle(req: IncomingMessage, res: ServerResponse, store: Store, policy: Policy): Promise<boolean> {
    const path = new URL(req.url ?? '/', this.options.origin).pathname;
    if (path !== '/owner' && !path.startsWith('/owner/')) return false;
    const json = (status: number, body: unknown) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
    const html = (body: string) => { res.setHeader('content-type', 'text/html; charset=utf-8'); res.end(page(body)); };
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.headers.host !== new URL(this.options.origin).host
      || (req.method !== 'GET' && req.headers.origin !== this.options.origin)) {
      json(403, { error: 'wrong_origin' }); return true;
    }
    for (const [key, c] of this.challenges) if (c.expires <= this.now()) this.challenges.delete(key);
    for (const [key, expiry] of this.sessions) if (expiry <= this.now()) this.sessions.delete(key);
    if (req.method === 'GET' && path === '/owner/app.js') {
      res.setHeader('content-type', 'text/javascript'); res.end(loginJs); return true;
    }
    if (req.method === 'GET' && path === '/owner/login') {
      html(`<p>Sign in as ${esc(this.options.name)} with wallet ${esc(this.options.address)}.</p><p>This signature signs you in for 30 minutes. Approving each request still requires World ID.</p><button type="button">Connect owner wallet</button><p role="status"></p><script src="/owner/app.js"></script>`); return true;
    }
    if (req.method === 'POST' && path === '/owner/challenge') {
      if (this.challenges.size >= 100) { json(429, { error: 'try_later' }); return true; }
      const old = this.token(req);
      if (old) { this.challenges.delete(old); this.sessions.delete(old); }
      const token = this.cookie(res, 300), expires = this.now() + 300000;
      const message = [
        'Sign in to your Yohaku owner inbox', `Origin: ${this.options.origin}`,
        `Name: ${this.options.name}`, `Wallet: ${this.options.address}`,
        `Nonce: ${randomBytes(32).toString('hex')}`, `Issued at: ${new Date(this.now()).toISOString()}`,
        `Expires at: ${new Date(expires).toISOString()}`,
        'This grants inbox access for 30 minutes. Each approval still requires World ID.',
      ].join('\n');
      this.challenges.set(token, { message, expires });
      json(200, { address: this.options.address, message }); return true;
    }
    if (req.method === 'POST' && path === '/owner/session') {
      const token = this.token(req), c = token && this.challenges.get(token);
      if (!c) { json(403, { error: 'expired_or_used_challenge' }); return true; }
      this.challenges.delete(token); // Consume before signature and authority network checks.
      try {
        let raw = '';
        for await (const chunk of req) { raw += chunk; if (raw.length > 65536) throw new Error('too_large'); }
        const { signature } = JSON.parse(raw);
        if (typeof signature !== 'string' || !/^0x[0-9a-f]+$/i.test(signature)
          || !await this.options.verify(c.message, signature as `0x${string}`)
          || !await this.authority() || c.expires <= this.now()) {
          json(403, { error: 'owner_authority_not_verified' }); return true;
        }
        if (this.sessions.size >= 100) { json(429, { error: 'try_later' }); return true; }
        this.sessions.set(this.cookie(res, 1800), this.now() + 1800000);
        json(200, { authenticated: true }); return true;
      } catch { json(403, { error: 'sign_in_failed' }); return true; }
    }
    if (req.method === 'POST' && path === '/owner/logout') {
      const token = this.token(req);
      if (token) { this.sessions.delete(token); this.challenges.delete(token); }
      this.cookie(res, 0); json(200, { signedOut: true }); return true;
    }
    if (req.method === 'GET' && path === '/owner') {
      if (!this.browser(req)) { res.writeHead(303, { location: '/owner/login' }); res.end(); return true; }
      if (!await this.authority() || !this.browser(req)) { json(403, { error: 'owner_authority_not_verified' }); return true; }
      const queue = store.surface(policy, new Date(this.now()));
      html(`<p>${queue.deferred.length} categories waiting. New invitations appear from ${policy.notifyHour}:00 ${esc(policy.timeZone ?? 'Asia/Tokyo')}, up to ${policy.dailyCap} per day.</p>${queue.surfaced.map(b => `<section><h2>${esc(b.category)}</h2><ul>${b.requests.filter(h => !store.get(h.request.id)?.demoBrowser).map(h => `<li><a href="/approve/${encodeURIComponent(h.request.id)}">${esc(h.request.who)} · ${h.request.price.amount} ${esc(h.request.price.currency)}</a></li>`).join('')}</ul></section>`).join('') || '<p>No requests to answer now.</p>'}<form method="post" action="/owner/logout"><button>Sign out</button></form>`);
      return true;
    }
    json(404, { error: 'not_found' }); return true;
  }
}
