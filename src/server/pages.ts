/**
 * Yohaku — the two pages a person actually sees.
 *
 * Plain HTML, served from the same process. No build step, no client framework: the whole
 * interaction is "read two lines, press one of two buttons", and anything heavier would be
 * scaffolding around a decision that takes four seconds.
 */

const STYLE = `
:root{--ink:#242329;--paper:#F8F7F3;--lilac:#BCB2FA;--lime:#DDF691;--mute:#ECEAE4;
--line:#E2E0D8;--sub:#6E6C75;--faint:#A9A7A0;--deep:#4E42A8}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);padding:36px 20px;max-width:560px;
margin:0 auto;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.mark{width:26px;height:26px}
h1{font-size:19px;margin:10px 0 2px;letter-spacing:-.3px;display:flex;align-items:center;gap:9px}
.sub{color:var(--sub);font-size:13px;margin:0 0 26px}
.card{background:#fff;border:1px solid var(--line);border-radius:20px;padding:22px;margin-bottom:14px}
.who{font-size:11px;font-weight:700;color:var(--faint);letter-spacing:1.1px;margin-bottom:8px}
.what{font-size:21px;font-weight:700;letter-spacing:-.3px;margin-bottom:6px}
.meta{color:var(--sub);font-size:13.5px;line-height:1.7}
.meta b{color:var(--ink)}
.why{background:var(--lilac);border-radius:14px;padding:13px 15px;margin-top:16px;
font-size:13px;line-height:1.6;color:#2D2A45}
.btns{display:grid;gap:9px;margin-top:20px}
a.b,button.b{display:block;text-align:center;text-decoration:none;font:inherit;font-size:15px;
font-weight:700;padding:14px;border-radius:14px;border:1px solid var(--ink);
background:var(--ink);color:var(--paper);cursor:pointer}
a.g,button.g{background:transparent;color:var(--ink)}
.note{color:var(--faint);font-size:11.5px;line-height:1.65;margin-top:22px}
.note b{color:var(--sub)}
.big{font-size:26px;font-weight:700;letter-spacing:-.5px;margin:0 0 8px}
.ok{color:#4A5C1E}.no{color:#8A8880}
code{background:var(--mute);padding:1px 6px;border-radius:6px;font-size:12.5px}
`;

const MARK = `<svg class="mark" viewBox="0 0 256 256" fill="#242329"><defs><path id="q"
d="M112 92C100 92 92 100 92 112H62C38 112 20 94 20 70V62C20 38 38 20 62 20H70C94 20 112 38 112 62Z"/>
</defs><use href="#q"/><use href="#q" transform="rotate(90 128 128)"/>
<use href="#q" transform="rotate(180 128 128)"/><use href="#q" transform="rotate(270 128 128)"/></svg>`;

const shell = (title: string, body: string) => `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title}</title><style>${STYLE}</style></head><body>
<h1>${MARK} yohaku</h1>${body}</body></html>`;

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function approvalPage(p: {
  id: string;
  who: string;
  what: string;
  purpose: string;
  amount: number;
  currency: string;
  deadline: string;
  reason: string;
  identityWired: boolean;
}): string {
  const hours = Math.max(
    0,
    Math.round((new Date(p.deadline).getTime() - Date.now()) / 3_600_000),
  );
  return shell(
    'yohaku — one thing needs you',
    `<p class="sub">One thing needs you this morning.</p>
<div class="card">
  <div class="who">${esc(p.who)}</div>
  <div class="what">${esc(p.what)}</div>
  <div class="meta">
    for <b>${esc(p.purpose)}</b><br>
    <b>${p.amount} ${esc(p.currency)}</b> · withdrawn in about <b>${hours}h</b>
  </div>
  <div class="why">${esc(p.reason)}</div>
  <div class="btns">
    <a class="b" href="/approve/${encodeURIComponent(p.id)}/verify">Approve${
      p.identityWired ? ' — prove it is you' : ''
    }</a>
    <form method="post" action="/approve/${encodeURIComponent(p.id)}/decline">
      <button class="b g" type="submit">Not this one</button>
    </form>
  </div>
</div>
<p class="note">${
      p.identityWired
        ? '<b>Approving asks you to prove you are a person, now.</b> Not at signup — at the moment money would move.'
        : '<b>Identity is not wired yet</b>, so approving here proves nothing. It is mocked, and this page says so rather than implying otherwise.'
    }<br><br>
Doing nothing is also an answer. <b>When the deadline passes it is denied</b>, and nothing happens.</p>`,
  );
}

export function resultPage(p: {
  outcome: 'approved' | 'declined' | 'expired' | 'refused';
  detail: string;
  verifiedAt?: string;
  acr?: string;
}): string {
  const head: Record<typeof p.outcome, string> = {
    approved: '<div class="big ok">Approved.</div>',
    declined: '<div class="big no">Left alone.</div>',
    expired: '<div class="big no">Too late.</div>',
    refused: '<div class="big no">Nothing happened.</div>',
  };
  return shell(
    'yohaku',
    `<p class="sub">&nbsp;</p><div class="card">
  ${head[p.outcome]}
  <div class="meta">${esc(p.detail)}</div>
  ${
    p.verifiedAt
      ? `<div class="why">You proved you are a person at <b>${esc(p.verifiedAt)}</b>.<br>
         <code>${esc(p.acr ?? '')}</code></div>`
      : ''
  }
</div>
<p class="note">${
      p.outcome === 'approved'
        ? '<b>Settlement is not wired.</b> Everything up to the signature happened; the signature did not.'
        : '<b>The protected action did not run.</b> No signature, no transaction, no record of consent.'
    }</p>`,
  );
}
