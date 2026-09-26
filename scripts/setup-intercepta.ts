/**
 * Where the Intercepta key goes in — on this machine only.
 *
 *   npm run setup:intercepta   → http://127.0.0.1:4178
 *
 * Same rules as the other setup pages: binds to 127.0.0.1, one pinned port so a stale copy
 * cannot quietly answer instead, writes `.env` at 0600, and **never echoes the key back** to
 * the page or the log.
 *
 * What this key is for: rule 4, the only `deny` in the router that is not about permission.
 * The grant is valid, the category is allowed, the amount is fine — and the payment still
 * does not go, because of **where the money would come from.** A licence and a payment are
 * different layers, and one can fail while the other holds.
 *
 * **Saving the key here does not make screening live.** Rule 4 currently runs against a
 * stand-in, and `/health` will keep reporting `screening: false` until the live adapter
 * exists — Issue #14. This page is only the place the credential lands, so that it never
 * has to travel through a chat window, an Issue or a shell history.
 */

import { createServer } from 'node:http';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { loadEnv } from '../src/core/env.js';
loadEnv();

const PORT = 4178;
const ENV_PATH = '.env';
const SUGGESTION_PATH = 'config/intercepta-suggestions.json';

interface Suggestion { value: string; source: string }
const FILE = existsSync(SUGGESTION_PATH)
  ? (JSON.parse(readFileSync(SUGGESTION_PATH, 'utf8')) as {
      values: Record<string, Suggestion>;
      links?: Record<string, Suggestion>;
    })
  : { values: {} };
const SUGGESTIONS = FILE.values;
const DOCS = FILE.links?.['keys']?.value ?? '';

function upsertEnv(pairs: Record<string, string>): void {
  let text = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, 'utf8') : '';
  for (const [key, value] of Object.entries(pairs)) {
    if (!value) continue;
    const re = new RegExp(`^${key}=.*$`, 'm');
    const line = `${key}=${value}`;
    text = re.test(text)
      ? text.replace(re, line)
      : `${text}${text.endsWith('\n') || text === '' ? '' : '\n'}${line}\n`;
  }
  writeFileSync(ENV_PATH, text, { mode: 0o600 });
  chmodSync(ENV_PATH, 0o600);
}

const set = (k: string) => Boolean(process.env[k]);
const val = (k: string) => process.env[k] ?? SUGGESTIONS[k]?.value ?? '';
const why = (k: string) => SUGGESTIONS[k]?.source ?? '';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const page = (msg = '') => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>yohaku — payment screening</title><style>
:root{--ink:#242329;--paper:#F8F7F3;--lilac:#BCB2FA;--lime:#DDF691;--line:#E2E0D8;
--sub:#6E6C75;--faint:#A9A7A0;--deep:#4E42A8}
*{box-sizing:border-box}
body{margin:0 auto;background:var(--paper);color:var(--ink);padding:34px 20px;max-width:660px;
font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.65}
h1{font-size:23px;margin:0 0 6px;letter-spacing:-.4px}
p.lede{color:var(--sub);margin:0 0 22px;font-size:15px}
fieldset{border:2px solid var(--line);border-radius:16px;padding:16px 18px 20px;margin:0 0 18px}
legend{font-size:11.5px;letter-spacing:.14em;color:var(--faint);padding:0 8px;font-weight:700}
label{display:block;font-size:13.5px;font-weight:700;margin:14px 0 5px}
input{width:100%;font:inherit;font-size:15px;padding:11px 13px;border:2px solid var(--line);
border-radius:11px;background:#fff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
input:focus{outline:0;border-color:var(--lilac)}
button{font:inherit;font-size:16px;font-weight:700;padding:14px 22px;border:0;border-radius:13px;
background:var(--ink);color:#fff;cursor:pointer;width:100%}
.ok{background:var(--lime);border-radius:12px;padding:12px 15px;font-size:14.5px;margin-bottom:18px;font-weight:600}
.why{background:#EDE9FF;border-radius:12px;padding:13px 16px;font-size:14.5px;margin-bottom:18px;
color:#3B3456;line-height:1.6}
.why b{color:#241f3d}
small{color:var(--sub);font-size:13px;display:block;margin-top:5px}
.done{color:var(--deep);font-weight:700;font-size:13px}
a{color:var(--deep)}
code{background:#EDE9FF;border-radius:6px;padding:1px 6px;font-size:13.5px}
</style></head><body>
<h1>Payment screening &mdash; rule 4</h1>
<p class="lede">Local only. Written to <code>.env</code> at 0600, never shown back to you,
never sent anywhere but this machine and the provider.</p>
${msg}
<div class="why"><b>Saving the key does not turn screening on.</b> Rule 4 still runs against a
stand-in, and <code>/health</code> keeps reporting <code>screening: false</code> until the live
adapter lands. This page exists so the credential never has to travel through a chat window,
an Issue, or your shell history.
<br><br><b>What rule 4 is.</b> The one refusal that is not about permission: the grant is
valid and the amount is fine, and the payment still does not go, because of where the money
would come from. <code>unavailable</code> is not a pass &mdash; if we cannot check, we do not
move money.</div>
<form method="post" action="/save">
<fieldset><legend>THE KEY</legend>
<label>API key
<input name="INTERCEPTA_API_KEY" type="password" autocomplete="off"
placeholder="${set('INTERCEPTA_API_KEY') ? 'already set — leave blank to keep it' : 'paste it here'}"></label>
<small>${set('INTERCEPTA_API_KEY') ? '<span class="done">already set</span>' : ''}${
  DOCS ? ` Docs and keys: <a href="${DOCS}" target="_blank" rel="noopener">the API reference</a>.` : ''
}</small>
</fieldset>
<fieldset><legend>ENDPOINT &mdash; NOT YET CALLED, CHECK THEM</legend>
${(['INTERCEPTA_BASE_URL', 'INTERCEPTA_SCAN_PATH', 'INTERCEPTA_AUTH_HEADER'] as const)
  .map((k) => `<label>${k}<input name="${k}" value="${esc(val(k))}"></label>${
    why(k) ? `<small>${esc(why(k))}</small>` : ''
  }`)
  .join('')}
<small><b>These are suggestions, and one of them is an outright guess.</b> Nothing here is
written into the source &mdash; <code>npm run verify</code> refuses a hardcoded endpoint, and a
value with no provenance is a value nobody can re-check. The response shape is still unknown,
so no adapter may assume a field called <code>clean</code> or <code>flagged</code>.</small>
</fieldset>
<button type="submit">Save</button>
</form>
</body></html>`;

const server = createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/save') {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const form = new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
    const pairs: Record<string, string> = {};
    for (const [k, v] of form) if (v.trim()) pairs[k] = v.trim();

    const gotKey = Boolean(pairs['INTERCEPTA_API_KEY']);
    upsertEnv(pairs);
    for (const [k, v] of Object.entries(pairs)) process.env[k] = v;

    // Presence only. The key itself is never printed.
    console.log(
      `  saved: ${Object.keys(pairs).filter((k) => k !== 'INTERCEPTA_API_KEY').join(', ') || '(nothing)'}${
        gotKey ? ', INTERCEPTA_API_KEY (hidden)' : ''
      }`,
    );
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(
      page(`<div class="ok"><b>Saved to .env at 0600.</b> Screening is still the stand-in:
      the live adapter, and the two addresses confirmed by an actual call, are Issue&nbsp;#14.</div>`),
    );
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(page());
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  Port ${PORT} is taken — an older copy is still running: pkill -f setup-intercepta\n`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  payment-screening key → http://127.0.0.1:${PORT}\n`);
});
