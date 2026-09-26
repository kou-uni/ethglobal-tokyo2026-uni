// docs/submit.html — the submission copy with a copy button per field.
// Generated from docs/submission.json so the page and the text cannot drift.
import { readFileSync, writeFileSync } from 'node:fs';

const db = JSON.parse(readFileSync('docs/submission.json', 'utf8'));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const cards = db.fields.map(f => {
  const over = f.limit && f.chars > f.limit;
  const under = f.min && f.chars < f.min;
  const note = f.limit ? `${f.chars} / ${f.limit}` : f.min ? `${f.chars} chars · min ${f.min}` : `${f.chars} chars`;
  return `<section>
  <div class="h"><h2>${esc(f.label)}</h2>
    <span class="n ${over || under ? 'bad' : ''}">${note}</span>
    <button data-for="${f.id}">copy</button></div>
  <pre id="${f.id}">${esc(f.text)}</pre>
</section>`;
}).join('\n');

writeFileSync('docs/submit.html', `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Yohaku — submission copy</title><meta name="robots" content="noindex">
<style>
@import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@700;800;900&display=swap');
*{box-sizing:border-box;margin:0}
body{background:#12101C;color:#EDEAF8;padding:20px 16px 60px;
font-family:"M PLUS Rounded 1c",-apple-system,BlinkMacSystemFont,"Hiragino Maru Gothic ProN",sans-serif;
font-weight:700;-webkit-font-smoothing:antialiased}
h1{font-size:26px;font-weight:900;margin-bottom:6px}
p.s{font-size:15px;color:#8B83B8;margin-bottom:22px;line-height:1.6}
section{background:#1B1830;border-radius:20px;padding:16px 16px 14px;margin-bottom:14px}
.h{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap}
h2{font-size:17px;font-weight:900;flex:1;min-width:150px}
.n{font:900 12px ui-monospace,Menlo,monospace;color:#8B83B8}
.n.bad{color:#FF8A8A}
button{font:inherit;font-size:14px;font-weight:900;background:#5B4BE0;color:#fff;border:0;
border-radius:99px;padding:9px 20px;cursor:pointer}
button.done{background:#57A80A}
pre{white-space:pre-wrap;word-break:break-word;font-family:inherit;font-weight:700;
font-size:15px;line-height:1.65;color:#C8C2E6;max-height:230px;overflow:auto;
background:#12101C;border-radius:14px;padding:13px 14px}
</style></head><body>
<h1>Submission copy</h1>
<p class="s">Tap <b>copy</b>, then paste into the form. Plain text — no markdown left in it.</p>
${cards}
<script>
document.addEventListener('click', async e => {
  const b = e.target.closest('button[data-for]');
  if (!b) return;
  const t = document.getElementById(b.dataset.for).textContent;
  try { await navigator.clipboard.writeText(t); }
  catch { const r = document.createRange(); r.selectNode(document.getElementById(b.dataset.for));
          getSelection().removeAllRanges(); getSelection().addRange(r); document.execCommand('copy'); }
  b.textContent = 'copied'; b.classList.add('done');
  setTimeout(() => { b.textContent = 'copy'; b.classList.remove('done'); }, 1600);
});
</script>
</body></html>
`);
console.log(`docs/submit.html — ${db.fields.length} fields`);
