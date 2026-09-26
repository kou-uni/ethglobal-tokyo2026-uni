/**
 * Where the settlement credentials go in — on this machine only.
 *
 * Same shape as the other two setup pages: binds to 127.0.0.1, one pinned port so a stale
 * copy cannot quietly answer instead, writes `.env` at 0600, and **never echoes a secret
 * back to the page or the log.** The private key is shown once as a masked length and then
 * only ever referred to as "set".
 *
 *   npm run setup:wallet     → http://127.0.0.1:4175
 *
 * Two different wallets are involved and confusing them is the expensive mistake:
 *
 *   - **The payout address** is where the *seller* is paid. It is public, and at a booth it
 *     is the judge's own wallet — they watch their own balance change.
 *   - **The agent private key** belongs to the *buyer*. It signs authorizations to pay the
 *     exact amount to the exact address the server quoted, and nothing else.
 */

import { createServer } from 'node:http';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { loadEnv } from '../src/core/env.js';
loadEnv();

const PORT = 4175;
const ENV_PATH = '.env';
const SUGGESTION_PATH = 'config/x402-suggestions.json';

/**
 * Starting points, read from `config/x402-suggestions.json` — not written here.
 *
 * `npm run verify` refuses an address or an endpoint anywhere in `src/` or `scripts/`, and
 * that rule is right even for a value we believe: a literal in source is a value with no
 * provenance. The file names where each one came from and when it was last confirmed.
 */
interface Suggestion { value: string; source: string }
const SUGGESTION_FILE = existsSync(SUGGESTION_PATH)
  ? (JSON.parse(readFileSync(SUGGESTION_PATH, 'utf8')) as {
      values: Record<string, Suggestion>;
      links?: Record<string, Suggestion>;
    })
  : { values: {} };
const SUGGESTIONS: Record<string, Suggestion> = SUGGESTION_FILE.values;
const FAUCET = SUGGESTION_FILE.links?.['faucet']?.value ?? '';

function upsertEnv(pairs: Record<string, string>): void {
  let text = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, 'utf8') : '';
  for (const [key, value] of Object.entries(pairs)) {
    if (!value) continue;
    const line = `${key}=${value}`;
    const re = new RegExp(`^${key}=.*$`, 'm');
    text = re.test(text)
      ? text.replace(re, line)
      : `${text}${text.endsWith('\n') || text === '' ? '' : '\n'}${line}\n`;
  }
  writeFileSync(ENV_PATH, text);
  chmodSync(ENV_PATH, 0o600);
}

const set = (k: string) => Boolean(process.env[k]);
const val = (k: string) => process.env[k] ?? SUGGESTIONS[k]?.value ?? '';
const why = (k: string) => SUGGESTIONS[k]?.source ?? '';

const page = (msg = '') => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>yohaku — settlement</title><style>
:root{--ink:#242329;--paper:#F8F7F3;--lilac:#BCB2FA;--lime:#DDF691;--line:#E2E0D8;
--sub:#6E6C75;--faint:#A9A7A0;--deep:#4E42A8;--warn:#B37C00}
*{box-sizing:border-box}
body{margin:0 auto;background:var(--paper);color:var(--ink);padding:34px 20px;max-width:660px;
font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.65}
h1{font-size:23px;margin:0 0 6px;letter-spacing:-.4px}
p.lede{color:var(--sub);margin:0 0 24px;font-size:15px}
fieldset{border:2px solid var(--line);border-radius:16px;padding:16px 18px 20px;margin:0 0 18px}
legend{font-size:11.5px;letter-spacing:.14em;color:var(--faint);padding:0 8px;font-weight:700}
label{display:block;font-size:13.5px;font-weight:700;margin:14px 0 5px}
label span{font-weight:400;color:var(--sub)}
input{width:100%;font:inherit;font-size:15px;padding:11px 13px;border:2px solid var(--line);
border-radius:11px;background:#fff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
input:focus{outline:0;border-color:var(--lilac)}
button{font:inherit;font-size:16px;font-weight:700;padding:14px 22px;border:0;border-radius:13px;
background:var(--ink);color:#fff;cursor:pointer;width:100%}
.ok{background:var(--lime);border-radius:12px;padding:12px 15px;font-size:14.5px;margin-bottom:18px;
font-weight:600}
.warn{background:#FFF6DC;border-radius:12px;padding:12px 15px;font-size:14px;margin-bottom:18px;
color:#6E520A}
.done{color:var(--deep);font-weight:700;font-size:13px}
small{color:var(--sub);font-size:13px;display:block;margin-top:5px}
a{color:var(--deep)}
</style></head><body>
<h1>Settlement — x402</h1>
<p class="lede">Local only. Written to <code>.env</code> at 0600, never shown back to you,
never sent anywhere but this machine.</p>
${msg}
<div class="warn"><b>Two different wallets.</b> The <b>payout address</b> is where the seller
gets paid — at a booth, that is the judge's own wallet. The <b>agent key</b> is the buyer's;
it can only sign a payment of the exact amount to the exact address the server quoted.</div>
<form method="post" action="/save">
<fieldset><legend>WHO GETS PAID</legend>
<label>Payout address <span>— the seller's wallet</span>
<input name="X402_PAYOUT_ADDRESS" value="${val('X402_PAYOUT_ADDRESS')}" placeholder="0x…" required></label>
<small>${set('X402_PAYOUT_ADDRESS') ? '<span class="done">already set</span>' : 'Paste a wallet you can watch. Base Sepolia.'}</small>
</fieldset>

<fieldset><legend>WHO PAYS</legend>
<label>Agent private key <span>— the buyer's wallet. Needs testnet USDC, <b>no ETH</b></span>
<input name="AGENT_PRIVATE_KEY" type="password" placeholder="${set('AGENT_PRIVATE_KEY') ? 'already set — leave blank to keep it' : '0x…'}"></label>
<small>Gas is paid by the facilitator, so this wallet only ever needs USDC.
${FAUCET ? `Get some at <a href="${FAUCET}" target="_blank" rel="noopener">the testnet faucet</a>.` : ''}</small>
</fieldset>

<fieldset><legend>NETWORK — SUGGESTED, CHECK THEM</legend>
${(['X402_FACILITATOR_URL', 'X402_NETWORK', 'X402_ASSET', 'X402_ASSET_NAME', 'X402_ASSET_VERSION', 'X402_ATOMIC_PER_UNIT', 'X402_EXPLORER_URL'] as const)
  .map(
    (k) =>
      `<label>${k}<input name="${k}" value="${val(k)}"></label>${
        why(k) ? `<small>${why(k)}</small>` : ''
      }`,
  )
  .join('')}
<small><b>These are suggestions, not defaults.</b> The server asks the facilitator at startup
whether it really supports this scheme and network, and prints the answer.</small>
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

    // Never log a key. Only its presence.
    const gotKey = Boolean(pairs['AGENT_PRIVATE_KEY']);
    upsertEnv(pairs);
    for (const [k, v] of Object.entries(pairs)) process.env[k] = v;

    console.log(
      `  saved: ${Object.keys(pairs).filter((k) => k !== 'AGENT_PRIVATE_KEY').join(', ')}${
        gotKey ? ', AGENT_PRIVATE_KEY (hidden)' : ''
      }`,
    );
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(
      page(
        `<div class="ok"><b>Saved.</b> Restart the server so it picks them up — it will
        ask the facilitator whether this network is really supported and print the answer.</div>`,
      ),
    );
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(page());
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  Port ${PORT} is taken — an older copy is still running: pkill -f setup-wallet\n`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  settlement credentials → http://127.0.0.1:${PORT}\n`);
});
