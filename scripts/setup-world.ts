/**
 * A local page for putting the World ID client credentials in.
 *
 *   npm run setup:world
 *
 * Same shape as the API-key page: binds to 127.0.0.1, checks the values against the issuer
 * before saving, writes to `.env` (0600, gitignored), and never echoes the secret back or
 * logs it. Nothing leaves this machine except the discovery request.
 */

import { createServer } from 'node:http';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { loadEnv } from '../src/core/env.js';

loadEnv();

const ENV_PATH = '.env';
const PORT = 4174;
const REDIRECT = process.env['WORLD_REDIRECT_URI'] ?? '';
// No default: the issuer belongs in .env, not in here. See docs/WORLD-SETUP.md.
const ISSUER = process.env['WORLD_ISSUER'] ?? '';
const ACR = process.env['WORLD_REQUIRED_ACR'] ?? '';

function upsertEnv(pairs: Record<string, string>): void {
  let text = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, 'utf8') : '';
  for (const [key, value] of Object.entries(pairs)) {
    const line = `${key}=${value}`;
    const re = new RegExp(`^${key}=.*$`, 'm');
    text = re.test(text)
      ? text.replace(re, line)
      : `${text}${text.endsWith('\n') || text === '' ? '' : '\n'}${line}\n`;
  }
  writeFileSync(ENV_PATH, text);
  chmodSync(ENV_PATH, 0o600);
}

const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>yohaku — World ID credentials</title><style>
:root{--ink:#242329;--paper:#F8F7F3;--lilac:#BCB2FA;--lime:#DDF691;--line:#E2E0D8;
--sub:#6E6C75;--faint:#A9A7A0;--deep:#4E42A8;--mute:#ECEAE4}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);padding:34px 20px;max-width:620px;
margin:0 auto;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
h1{font-size:20px;margin:0 0 4px;display:flex;align-items:center;gap:9px;letter-spacing:-.3px}
h1 svg{width:24px;height:24px}
p.l{color:var(--sub);font-size:14px;line-height:1.65;margin:0 0 22px}
fieldset{border:1px solid var(--line);border-radius:18px;background:#fff;padding:18px;margin:0 0 14px}
legend{font-size:11px;font-weight:700;color:var(--faint);letter-spacing:1.1px;padding:0 6px}
label{display:block;font-size:11px;font-weight:700;color:var(--faint);letter-spacing:1px;margin:14px 0 6px}
label:first-of-type{margin-top:0}
input{width:100%;font:inherit;font-size:14px;padding:11px 12px;border:1px solid var(--line);
border-radius:11px;background:var(--paper);color:var(--ink);
font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
input[readonly]{color:var(--sub);background:var(--mute)}
button{font:inherit;font-size:15px;font-weight:700;padding:13px 18px;border-radius:13px;
border:1px solid var(--ink);background:var(--ink);color:var(--paper);cursor:pointer;width:100%;margin-top:18px}
button:disabled{opacity:.45;cursor:default}
.out{margin-top:16px;border-radius:14px;padding:15px;font-size:13.5px;line-height:1.65;
background:var(--mute);border:1px solid var(--line);white-space:pre-wrap}
.out.ok{background:var(--lime);border-color:#C6E472}.out.bad{background:#F6E5E5;border-color:#E2C4C4}
.note{font-size:11.5px;color:var(--faint);line-height:1.65;margin-top:20px}
.note b{color:var(--sub)}
code{background:var(--mute);padding:1px 6px;border-radius:6px;font-size:12.5px}
</style></head><body>
<h1><svg viewBox="0 0 256 256" fill="#242329"><defs><path id="q"
d="M112 92C100 92 92 100 92 112H62C38 112 20 94 20 70V62C20 38 38 20 62 20H70C94 20 112 38 112 62Z"/>
</defs><use href="#q"/><use href="#q" transform="rotate(90 128 128)"/>
<use href="#q" transform="rotate(180 128 128)"/><use href="#q" transform="rotate(270 128 128)"/></svg>
World ID credentials</h1>
<p class="l">Paste what the portal gave you. It is checked against the issuer before anything is
saved, written to <code>.env</code> on this machine only, and <b>never shown back to you or logged</b>.</p>
<form id="f">
<fieldset><legend>FROM THE PORTAL</legend>
<label>CLIENT ID</label>
<input id="cid" type="text" placeholder="app_..." autocomplete="off" spellcheck="false">
<label>CLIENT SECRET</label>
<input id="sec" type="password" placeholder="sk_..." autocomplete="off" spellcheck="false">
<button id="b" type="submit">Check and save</button>
</fieldset>
<fieldset><legend>ALREADY SET — MUST MATCH THE PORTAL EXACTLY</legend>
<label>REDIRECT URI</label>
<input id="red" type="text" readonly>
<label>ISSUER</label>
<input id="iss" type="text" readonly>
</fieldset>
</form>
<div class="out" id="o">Nothing tried yet.</div>
<p class="note"><b>What the check does.</b> It reads the issuer's discovery document and builds the exact
authorization request your server would send, with <code>max_age</code> and <code>acr_values</code> on it.
If the redirect URI here does not match the one you registered, the sign-in will fail later with a
confusing error — <b>so it is compared now, while it is still cheap to fix</b>.</p>
<script>
const $=(i)=>document.getElementById(i);
fetch('/current').then(r=>r.json()).then(d=>{$('red').value=d.redirect||'(not set)';$('iss').value=d.issuer});
$('f').addEventListener('submit',async(e)=>{
  e.preventDefault();
  const clientId=$('cid').value.trim(), clientSecret=$('sec').value.trim();
  if(!clientId||!clientSecret){return}
  $('b').disabled=true;$('o').className='out';$('o').textContent='Checking with the issuer…';
  try{
    const r=await fetch('/save',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({clientId,clientSecret})});
    const d=await r.json();
    $('o').className='out '+(d.ok?'ok':'bad');
    $('o').textContent=d.message;
    if(d.ok){$('sec').value='';$('b').textContent='Saved — tell Claude, and close this'}
  }catch(err){$('o').className='out bad';$('o').textContent=String(err)}
  finally{$('b').disabled=false}
});
</script></body></html>`;

const server = createServer(async (req, res) => {
  const send = (status: number, body: unknown, type = 'application/json') => {
    res.writeHead(status, { 'content-type': `${type}; charset=utf-8` });
    res.end(type.startsWith('application/json') ? JSON.stringify(body) : String(body));
  };

  if (req.method === 'GET' && req.url === '/current') {
    return send(200, { redirect: REDIRECT, issuer: ISSUER || '(not set)' });
  }
  if (req.method === 'GET') return send(200, PAGE, 'text/html');

  if (req.method === 'POST' && req.url === '/save') {
    const raw = await new Promise<string>((resolve) => {
      let b = '';
      req.on('data', (c) => (b += c));
      req.on('end', () => resolve(b));
    });
    const { clientId, clientSecret } = JSON.parse(raw) as {
      clientId: string;
      clientSecret: string;
    };

    if (!REDIRECT) {
      return send(200, {
        ok: false,
        message:
          'WORLD_REDIRECT_URI is not in .env yet, so there is nothing to match against.\n' +
          'It should be your public callback URL.',
      });
    }
    if (!ACR || !ISSUER) {
      return send(200, {
        ok: false,
        message: `Missing from .env: ${[!ISSUER && 'WORLD_ISSUER', !ACR && 'WORLD_REQUIRED_ACR']
          .filter(Boolean)
          .join(', ')}`,
      });
    }

    try {
      const { WorldIdentity } = await import('../src/adapters/world-oidc.js');
      const w = new WorldIdentity({
        issuer: ISSUER,
        clientId,
        clientSecret,
        policy: { maxAgeSeconds: Number(process.env['WORLD_MAX_AGE_SECONDS'] ?? 120), requiredAcr: ACR },
      });
      await w.assertAcrSupported();
      const url = await w.beginUrl({ state: 'check', nonce: 'check', redirectUri: REDIRECT });

      upsertEnv({ WORLD_CLIENT_ID: clientId, WORLD_CLIENT_SECRET: clientSecret });

      return send(200, {
        ok: true,
        message: [
          'Saved to .env (0600).',
          '',
          'The issuer offers the assurance level we require, and this is the exact',
          'request your server will send when she presses Approve:',
          '',
          url.replace(/&/g, '\n  &'),
          '',
          'Restart the server and the banner will say World ID instead of mock.',
        ].join('\n'),
      });
    } catch (err) {
      const e = err as { status?: number; message?: string };
      return send(200, {
        ok: false,
        message: `Nothing was saved.\n\n${e.message ?? String(err)}`,
      });
    }
  }
  send(404, { error: 'not found' });
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  Port ${PORT} is taken — an older copy is still running: pkill -f setup-world\n`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${PORT}`;
  console.log(`\n  Open this — it is on your machine only:\n\n    ${url}\n`);
  spawn('open', [url], { stdio: 'ignore' }).unref();
});
