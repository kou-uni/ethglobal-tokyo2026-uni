/** Loopback-only proof test: the phone communicates with World; the PC polls the result. */
import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';
import { signRequest } from '@worldcoin/idkit-server';
import { privateKeyToAccount } from 'viem/accounts';
import { loadEnv } from '../src/core/env.js';
import { verifyIdkitProof, type IdkitChallenge } from '../src/adapters/idkit-proof.js';
loadEnv();
const config = JSON.parse(readFileSync(new URL('../config/world-idkit.json', import.meta.url), 'utf8'));
const key = process.env.WORLD_IDKIT_SIGNING_KEY as `0x${string}` | undefined;
const ready = !!key && config.rpRegistrationVerified === true
  && privateKeyToAccount(key).address.toLowerCase() === config.signerAddress.toLowerCase();
const origin = 'http://127.0.0.1:4178';
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
const pending = new Map<string, IdkitChallenge & { browser: string }>();
const bundle = await build({
  entryPoints: [new URL('../setup/idkit.ts', import.meta.url).pathname], bundle: true,
  format: 'esm', platform: 'browser', target: 'es2022', write: false, minify: true,
});
const page = readFileSync(new URL('../setup/idkit.html', import.meta.url));
// esbuild preserves the SDK's import.meta.url-relative WASM request.
const wasm = readFileSync(new URL('../node_modules/@worldcoin/idkit-core/dist/idkit_wasm_bg.wasm', import.meta.url));
createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'unsafe-inline'; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  const json = (code: number, data: unknown) => {
    res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(data));
  };
  if (req.headers.host !== new URL(origin).host) { json(403, { error: 'Wrong host' }); return; }
  if (req.method === 'GET' && req.url === '/') { res.setHeader('content-type', 'text/html; charset=utf-8'); res.end(page); return; }
  if (req.method === 'GET' && req.url === '/app.js') { res.setHeader('content-type', 'text/javascript'); res.end(bundle.outputFiles[0]!.contents); return; }
  if (req.method === 'GET' && req.url === '/idkit_wasm_bg.wasm') { res.setHeader('content-type', 'application/wasm'); res.end(wasm); return; }
  if (req.method === 'GET' && req.url === '/config') { json(200, { ready, appId: config.appId }); return; }
  if (req.method !== 'POST' || req.headers.origin !== origin || !['/challenge', '/verify', '/cancel'].includes(req.url ?? '')) {
    json(403, { error: 'このPCのテスト画面から開始してください' }); return;
  }
  for (const [id, c] of pending) if (c.expiresAt <= Date.now() / 1000) pending.delete(id);
  const cookie = req.headers.cookie?.split(';').map((s) => s.trim()).find((s) => s.startsWith('yohaku_idkit='))?.slice(13);
  const browser = cookie && /^[a-f0-9]{64}$/.test(cookie) ? hash(cookie) : undefined;
  try {
    let raw = ''; for await (const chunk of req) { raw += chunk; if (raw.length > 65536) throw new Error('too_large'); }
    const body = JSON.parse(raw || '{}');
    if (!ready) { json(503, { error: 'RPの署名設定は登録確認待ちです' }); return; }
    if (req.url === '/challenge') {
      if (pending.size >= 30) { json(429, { error: '少し待ってからやり直してください' }); return; }
      const browserCookie = browser ? cookie! : randomBytes(32).toString('hex');
      const bound = hash(browserCookie);
      for (const [id, c] of pending) if (c.browser === bound) pending.delete(id);
      const sig = signRequest({ signingKeyHex: key!, action: config.action, ttl: 300 });
      const id = randomBytes(32).toString('hex'), signal = randomBytes(32).toString('hex');
      pending.set(id, { nonce: sig.nonce, action: config.action, signal, expiresAt: sig.expiresAt, browser: bound });
      res.setHeader('Set-Cookie', `yohaku_idkit=${browserCookie}; HttpOnly; SameSite=Strict; Path=/; Max-Age=300`);
      json(200, { id, signal, action: config.action, rp_context: {
        rp_id: config.rpId, nonce: sig.nonce, created_at: sig.createdAt, expires_at: sig.expiresAt, signature: sig.sig,
      } }); return;
    }
    const c = typeof body.id === 'string' ? pending.get(body.id) : undefined;
    if (!c || !browser || browser !== c.browser) { json(400, { error: '期限切れ・使用済み・別ブラウザーの認証です' }); return; }
    pending.delete(body.id);
    if (req.url === '/cancel') { json(200, { cancelled: true }); return; }
    const result = await verifyIdkitProof(config, c, body.proof);
    const dir = new URL('../docs/build/evidence/', import.meta.url);
    mkdirSync(dir, { recursive: true });
    writeFileSync(new URL('world-idkit.json', dir), JSON.stringify({
      ...result, appId: config.appId, rpId: config.rpId,
      scope: 'Proof-only local test. No payment, owner binding, uniqueness benefit, or agent authorization.',
    }, null, 2) + '\n');
    json(200, result);
  } catch (error) {
    const reason = error instanceof Error ? error.message : '';
    const safe = ['expired', 'wrong_challenge', 'wrong_credential', 'verification_rejected'].includes(reason) ? reason : 'verification_unavailable';
    json(400, { error: `証明を確認できませんでした (${safe})。再送せず、新しいテストとしてやり直してください。` });
  }
}).listen(4178, '127.0.0.1', () => console.log(`IDKit proof-only test: ${origin} (${ready ? 'ready' : 'RP registration pending'})`));
