import { createHash, randomBytes } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ProbeAttempt, ProductionIdentity } from '../adapters/world-production.js';

export type ProductionProbeHandler = (req: IncomingMessage, res: ServerResponse) => Promise<boolean>;
const base = '/world-production';
const cookieName = '__Secure-YohakuWorldProbe';
const ttl = 5 * 60 * 1000;
const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const digest = (s: string) => createHash('sha256').update(s).digest('hex');

function page(title: string, text: string, action?: { path: string; label: string }) {
  return `<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Yohaku — World ID 本番テスト</title><style>
body{font:17px/1.8 system-ui,sans-serif;background:#f8f7f3;color:#242329;margin:0;padding:32px 20px}
main{max-width:620px;margin:5vh auto;background:white;border:1px solid #e2e0d8;border-radius:24px;padding:28px}
h1{font-size:26px;line-height:1.4}p{white-space:pre-wrap;overflow-wrap:anywhere}
button{font:inherit;background:#242329;color:white;border:0;border-radius:14px;padding:14px 20px;cursor:pointer}
small{color:#6e6c75}a{color:#4e42a8}</style><main><small>余白 · World ID 本番テスト</small>
<h1>${escape(title)}</h1><p>${escape(text)}</p>
${action ? `<form method="post" action="${action.path}"><button>${escape(action.label)}</button></form>` : ''}
<p><small>この画面は認証の確認専用です。決済・依頼の承認・権限付与は行いません。
氏名・識別子・認証トークンは表示・保存しません。</small></p>
<a href="${base}">テストの入口へ</a></main></html>`;
}

export function createProductionProbe(
  options?: { identity: ProductionIdentity; redirectUri: string },
  now: () => number = Date.now,
): ProductionProbeHandler {
  const pending = new Map<string, ProbeAttempt & { browser: string }>();
  const browserStarts = new Map<string, number>();
  const origin = options ? new URL(options.redirectUri).origin : '';
  const send = (res: ServerResponse, status: number, title: string, text: string, action?: { path: string; label: string }) => {
    res.writeHead(status, { 'content-type': 'text/html; charset=utf-8' });
    res.end(page(title, text, action));
  };
  return async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname !== base && !url.pathname.startsWith(`${base}/`)) return false;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
    const time = now();
    for (const [key, p] of pending) if (time - p.startedAt >= ttl) pending.delete(key);
    for (const [key, started] of browserStarts) if (time - started >= ttl) browserStarts.delete(key);
    const cookie = req.headers.cookie?.split(';').map((s) => s.trim()).find((s) => s.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    const browser = cookie && /^[a-f0-9]{64}$/.test(cookie) ? digest(cookie) : undefined;
    if (!options) {
      send(res, 503, '本番テストは準備中です', '本番用のアプリ登録とサーバー設定が必要です。普段のデモは引き続き利用できます。');
      return true;
    }
    if (req.method === 'GET' && url.pathname === base) {
      send(res, 200, 'あなたのWorld IDで接続を試す', 'Worldの本番認証画面へ進みます。\n対応するWorld IDアプリと、互換性のあるOrb認証資格が必要です。確認の途中でキャンセルできます。', { path: `${base}/start`, label: '本番のWorld IDで確認する' });
      return true;
    }
    if (req.method === 'POST' && url.pathname === `${base}/start`) {
      if (req.headers.origin !== origin) {
        send(res, 403, '開始できませんでした', 'このサイトのテスト入口から操作してください。'); return true;
      }
      if (pending.size >= 100 || browserStarts.size >= 500 || (browser && time - (browserStarts.get(browser) ?? -Infinity) < 15000)) {
        send(res, 429, '少し待ってからお試しください', '認証の開始回数が多いため、今は開始できません。'); return true;
      }
      const rawCookie = browser ? cookie! : randomBytes(32).toString('hex');
      const browserKey = digest(rawCookie);
      for (const [key, p] of pending) if (p.browser === browserKey) pending.delete(key);
      const state = randomBytes(32).toString('hex');
      const attempt = { nonce: randomBytes(32).toString('hex'), verifier: randomBytes(32).toString('base64url'), startedAt: time, browser: browserKey };
      pending.set(state, attempt); browserStarts.set(browserKey, time);
      try {
        const destination = await options.identity.begin(state, attempt);
        res.setHeader('Set-Cookie', `${cookieName}=${rawCookie}; Path=${base}; HttpOnly; Secure; SameSite=Lax; Max-Age=300`);
        res.writeHead(303, { location: destination }); res.end();
      } catch {
        pending.delete(state);
        send(res, 502, 'Worldに接続できませんでした', '少し待ってから、テスト入口からやり直してください。認証成功にはしていません。');
      }
      return true;
    }
    if (req.method === 'GET' && url.pathname === `${base}/callback`) {
      const state = url.searchParams.get('state') ?? '';
      const attempt = pending.get(state);
      if (!attempt || !browser || attempt.browser !== browser) {
        send(res, 400, 'この認証を確認できませんでした', '開始したブラウザーと一致しないか、期限切れ・使用済みです。テスト入口からやり直してください。');
        return true;
      }
      pending.delete(state); // Consume before exchange. Never retry an uncertain code redemption.
      const code = url.searchParams.get('code');
      if (url.searchParams.has('error') || !code) {
        send(res, 200, '認証は完了していません', 'キャンセルまたは認証エラーで終了しました。決済・依頼の承認は行っていません。');
        return true;
      }
      try {
        const result = await options.identity.complete(code, attempt, time);
        send(res, 200, '本番World IDの認証を確認しました',
          `署名・宛先・今回の認証との対応・鮮度を確認しました。\n認証時刻: ${result.authTime}\n認証クラス: ${result.acr}\n認証方法: ${result.amr.join(', ')}\n\nWorld Appが実際に開いたかも教えてください。認証方法の値だけから、画面での操作や生体認証の有無は判断しません。`);
      } catch {
        send(res, 400, '本番認証を確認できませんでした', '署名・今回の認証との対応・鮮度・Worldへの通信のいずれかを確認できませんでした。成功扱いにはしていません。');
      }
      return true;
    }
    send(res, 404, 'ページが見つかりません', 'テスト入口から操作してください.');
    return true;
  };
}
