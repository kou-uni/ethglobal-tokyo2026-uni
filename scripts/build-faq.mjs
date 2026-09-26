// Generates docs/faq.html from docs/ask/answers.json.
//
// The fallback page has to hold exactly what the bot holds, so it is generated rather than
// written. Edit the answers; run this.
import { readFileSync, writeFileSync } from 'node:fs';

const db = JSON.parse(readFileSync('docs/ask/answers.json', 'utf8'));
const esc = s => s.replace(/&(?![a-z]+;|#\d+;)/g, '&amp;').replace(/</g, '&lt;');
const cls = s => (s === 'NOT BUILT' ? 'NOT' : s);

const jump = db.answers
  .map(e => `<a class="q" href="#${e.id}">${esc(e.q)}</a>`)
  .join('\n  ');

const items = db.answers.map(e => `<article id="${e.id}">
  <span class="chip ${cls(e.status)}">${e.status}</span>
  <h3>${esc(e.q)}</h3>
  <p>${esc(e.a)}</p>
  <div class="ev">${e.ev.map(([label, href]) =>
    `<a href="${href}"${/^http/.test(href) ? ' target="_blank" rel="noopener"' : ''}>${esc(label)} &rarr;</a>`).join('')}</div>
</article>`).join('\n\n');

writeFileSync('docs/faq.html', `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Yohaku — every answer we have</title>
<meta name="description" content="The full set the question box answers from. ${db.answers.length} entries, each with a link you can check.">
<style>
@import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@700;800;900&display=swap');
:root{--ink:#242329;--ink2:#5F5D6B;--ink3:#A6A3B4;--paper:#F8F7F3;--card:#fff;--line:#E8E5DC;
--lilac:#BCB2FA;--lilacD:#6B5BD6;--lilacL:#EDE9FF;--limeD:#7FA326;--amber:#B08900;
--shS:0 4px 0 rgba(36,35,41,.08)}
*{box-sizing:border-box}
body{margin:0 auto;max-width:820px;padding:26px 18px 80px;color:var(--ink);
background:linear-gradient(180deg,#EFEBFF 0%,#F6F4EC 40%,var(--paper) 100%);background-attachment:fixed;
font-family:"M PLUS Rounded 1c",-apple-system,BlinkMacSystemFont,"Hiragino Maru Gothic ProN",sans-serif;
font-size:16px;line-height:1.7;font-weight:700;-webkit-font-smoothing:antialiased}
a.back{font-size:14px;color:var(--lilacD);text-decoration:none;font-weight:900}
h1{font-size:clamp(28px,6.4vw,42px);font-weight:900;letter-spacing:-.02em;margin:12px 0 6px;line-height:1.2}
h1 em{font-style:normal;display:inline-block;color:#fff;background:var(--lilacD);padding:0 12px 3px;
border-radius:15px;box-shadow:0 5px 0 #4A3BAE;transform:rotate(-1.4deg)}
p.sub{color:var(--ink2);font-size:16px;margin:10px 0 20px;max-width:52ch}
h2{font-size:12px;letter-spacing:.15em;color:var(--ink3);font-weight:900;margin:34px 0 12px}
nav{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}
a.q{font-size:13px;font-weight:800;text-decoration:none;color:var(--ink2);background:#fff;
border:2px solid var(--line);border-radius:14px;padding:6px 13px}
a.q:hover{border-color:var(--lilac);color:var(--lilacD)}
article{background:var(--card);border-radius:22px;padding:18px 21px;box-shadow:var(--shS);margin:12px 0;scroll-margin-top:18px}
.chip{display:inline-block;font-size:11px;font-weight:900;letter-spacing:.08em;color:#fff;border-radius:11px;padding:2px 10px}
.RUNNING{background:var(--limeD)}.DESIGNED{background:var(--lilacD)}.NOT{background:var(--amber)}
h3{font-size:18.5px;font-weight:900;margin:9px 0 7px;line-height:1.35;letter-spacing:-.2px}
article p{margin:0 0 12px;font-size:15.5px;color:var(--ink2);line-height:1.72}
.ev{display:flex;flex-wrap:wrap;gap:8px}
.ev a{font-size:12.5px;font-weight:900;text-decoration:none;color:var(--lilacD);background:var(--lilacL);
border-radius:11px;padding:5px 11px}
footer{margin-top:40px;padding-top:18px;border-top:2px dashed var(--line);font-size:13.5px;color:var(--ink2)}
footer a{color:var(--lilacD)}
</style></head><body>
<a class="back" href="ask.html">&larr; the question box</a>
<h1>Everything it <em>can answer.</em></h1>
<p class="sub">${db.answers.length} entries, each with a link you can check. This is the whole set
&mdash; there is no larger one behind it.</p>

<h2>JUMP</h2>
<nav>
  ${jump}
</nav>

<h2>THE ANSWERS</h2>
${items}

<footer><b>Yohaku</b> &mdash; <a href="./">overview</a> &middot;
<a href="ask.html">ask a question</a> &middot;
<a href="ask/answers.json">the raw set</a> &middot;
<a href="llms.txt">llms.txt</a><br>
Generated from <code>docs/ask/answers.json</code> by <code>npm run build:faq</code>. Do not edit by hand.</footer>
</body></html>
`);
console.log(`docs/faq.html — ${db.answers.length} answers`);
