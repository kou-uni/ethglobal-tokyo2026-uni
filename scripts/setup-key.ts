/**
 * A tiny local page for putting an API key in, without it passing through anything.
 *
 *   npm run setup
 *
 * Binds to 127.0.0.1 on a random port. The key is posted to this process, **checked with one
 * real call**, and only written to `.env` (mode 0600, gitignored) if that call succeeded.
 * Which model to run is decided afterwards, from the list the key itself returns.
 * It is never echoed back to the page, never logged, and never leaves the machine except to
 * the provider you chose.
 */

import { createServer } from 'node:http';
import { existsSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { NIGHT } from '../src/core/night.js';

const ENV_PATH = '.env';
const PORT = 4173;

function upsertEnv(key: string, value: string): void {
  const existing = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, 'utf8') : '';
  const line = `${key}=${value}`;
  const next = new RegExp(`^${key}=.*$`, 'm').test(existing)
    ? existing.replace(new RegExp(`^${key}=.*$`, 'm'), line)
    : `${existing}${existing.endsWith('\n') || existing === '' ? '' : '\n'}${line}\n`;
  writeFileSync(ENV_PATH, next);
  chmodSync(ENV_PATH, 0o600);
}

const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>yohaku — add a key</title><style>
:root{--ink:#242329;--paper:#F8F7F3;--lilac:#BCB2FA;--lime:#DDF691;--line:#E2E0D8;--sub:#6E6C75;--faint:#A9A7A0;--deep:#4E42A8}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;padding:32px 20px;max-width:640px;margin:0 auto}
h1{font-size:21px;letter-spacing:-.3px;margin:0 0 4px;display:flex;align-items:center;gap:9px}
h1 svg{width:24px;height:24px}
p.l{color:var(--sub);font-size:14px;line-height:1.6;margin:0 0 24px}
fieldset{border:1px solid var(--line);border-radius:18px;background:#fff;padding:18px;margin:0 0 14px}
legend{font-size:11px;font-weight:700;color:var(--faint);letter-spacing:1.1px;padding:0 6px}
label{display:block;font-size:11px;font-weight:700;color:var(--faint);letter-spacing:1px;margin:0 0 6px}
input,select{width:100%;font:inherit;font-size:14px;padding:10px 12px;border:1px solid var(--line);border-radius:11px;background:var(--paper);color:var(--ink)}
input[type=password]{font-family:ui-monospace,Menlo,monospace}
button{font:inherit;font-size:14px;font-weight:700;padding:11px 18px;border-radius:12px;border:1px solid var(--ink);background:var(--ink);color:var(--paper);cursor:pointer;width:100%;margin-top:14px}
button:disabled{opacity:.45;cursor:default}
.out{margin-top:16px;border-radius:14px;padding:15px;font-size:13.5px;line-height:1.6;background:#ECEAE4;border:1px solid var(--line);white-space:pre-wrap}
.out.ok{background:var(--lime);border-color:#C6E472}.out.bad{background:#F6E5E5;border-color:#E2C4C4}
.note{font-size:11.5px;color:var(--faint);line-height:1.6;margin-top:20px}
.note b{color:var(--sub)}code{background:#ECEAE4;padding:1px 6px;border-radius:6px;font-size:12.5px}
</style></head><body>
<h1><svg viewBox="0 0 256 256" fill="#242329"><defs><path id="q" d="M112 92C100 92 92 100 92 112H62C38 112 20 94 20 70V62C20 38 38 20 62 20H70C94 20 112 38 112 62Z"/></defs><use href="#q"/><use href="#q" transform="rotate(90 128 128)"/><use href="#q" transform="rotate(180 128 128)"/><use href="#q" transform="rotate(270 128 128)"/></svg>add a key</h1>
<p class="l">Runs on your machine only. The key is <b>tested with one real call first</b>, and written to
<code>.env</code> (mode 0600, gitignored) only if that call works. It is never shown back to you and never logged.</p>
<form id="f">
<fieldset><legend>PROVIDER</legend>
<label>WHICH ONE</label>
<select id="p"><option value="anthropic">Anthropic</option><option value="openai">OpenAI</option></select>
<label style="margin-top:14px">API KEY</label>
<input id="k" type="password" placeholder="sk-..." autocomplete="off" spellcheck="false">
<button id="b" type="submit">Check it and save</button>
</fieldset></form>
<div class="out" id="o">Nothing tried yet.</div>
<p class="note"><b>You do not pick a model here.</b> The key is checked against the provider, the list of
models it can use is read back, and the choice is made afterwards from that list — not from a name
guessed in advance.<br><br>Add both keys if you have both: switch the provider and do it again.</p>
<script>
const $=(i)=>document.getElementById(i);
$('f').addEventListener('submit',async(e)=>{
  e.preventDefault();
  const key=$('k').value.trim(); if(!key){return}
  $('b').disabled=true; $('o').className='out'; $('o').textContent='Checking the key…';
  try{
    const r=await fetch('/save',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({provider:$('p').value,key})});
    const d=await r.json();
    $('o').className='out '+(d.ok?'ok':'bad');
    $('o').textContent=d.message;
    if(d.ok){$('k').value='';$('b').textContent='Saved — add the other one, or close this';$('b').disabled=false}
  }catch(err){$('o').className='out bad';$('o').textContent=String(err)}
  finally{$('b').disabled=false}
});
</script></body></html>`;

const server = createServer(async (req, res) => {
  if (req.method === 'GET') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(PAGE);
    return;
  }
  if (req.method === 'POST' && req.url === '/save') {
    const body = await new Promise<string>((resolve) => {
      let b = '';
      req.on('data', (c) => (b += c));
      req.on('end', () => resolve(b));
    });
    const { provider, key } = JSON.parse(body) as { provider: 'anthropic' | 'openai'; key: string };
    const reply = (ok: boolean, message: string) => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok, message }));
    };

    try {
      // Check the key by asking what it can use. Which model to run is decided afterwards,
      // from this list — never from a name guessed ahead of time.
      let ids: string[];
      if (provider === 'anthropic') {
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        const page = await new Anthropic({ apiKey: key }).models.list({ limit: 100 });
        ids = page.data.map((m) => m.id);
      } else {
        const { default: OpenAI } = await import('openai');
        const page = await new OpenAI({ apiKey: key }).models.list();
        ids = page.data.map((m) => m.id).sort();
      }

      upsertEnv(provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY', key);
      writeFileSync(
        provider === 'anthropic' ? '.models-anthropic.txt' : '.models-openai.txt',
        ids.join('\n') + '\n',
      );

      reply(
        true,
        [
          `The key works. Saved to .env (0600).`,
          ``,
          `  ${ids.length} models are available to it.`,
          `  The list is written next to this repo so the choice can be made from it.`,
          ``,
          `Add the other provider too if you have one, then close this.`,
        ].join('\n'),
      );
    } catch (err) {
      // Show the whole thing. A one-line message hides which of key / permission /
      // endpoint actually failed, and that is the only useful part.
      const e = err as { status?: number; message?: string; error?: unknown; name?: string };
      const detail = [
        e.name ? `type:    ${e.name}` : '',
        e.status ? `status:  ${e.status}` : '',
        e.message ? `message: ${e.message}` : String(err),
        e.error ? `body:    ${JSON.stringify(e.error)}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      console.error(`\n  ${provider} key check failed:\n${detail}\n`);
      reply(
        false,
        [
          `That key did not work, so nothing was saved.`,
          ``,
          detail,
          ``,
          e.status === 401
            ? `401 means the key itself was rejected. Check it was copied whole, and that it belongs to the same account as the project.`
            : e.status === 403
              ? `403 usually means the key is restricted. A key limited to /v1/chat/completions cannot read /v1/models — see below.`
              : ``,
          ``,
          `If listing models is blocked but the key is fine, set the model by hand instead:`,
          `    OPENAI_API_KEY=...   in .env`,
          `    OPENAI_MODEL=...     the exact id you want`,
          `then run:  npm run classify -- "sleep/tracking-logs" 300`,
        ]
          .filter((l) => l !== undefined)
          .join('\n'),
      );
    }
    return;
  }

  res.writeHead(404);
  res.end();
});

// Fixed port on purpose. A random one meant three versions of this page were listening at
// once, and a stale tab returned a failure that looked like a bad key. It was not.
server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  Port ${PORT} is already taken — an older copy of this page is still running.`);
    console.error(`  Stop it first:  pkill -f setup-key\n`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${PORT}`;
  console.log(`\n  Open this — it is on your machine only:\n\n    ${url}\n`);
  console.log(`  Ctrl-C when you are done.\n`);
  spawn('open', [url], { stdio: 'ignore' }).unref();
});
