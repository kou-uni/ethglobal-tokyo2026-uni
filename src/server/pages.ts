/**
 * Yohaku — the two screens a person actually sees.
 *
 * These have been rewritten twice. The first version listed facts; the second explained
 * them. Both read like a system report, and a person glancing at a phone at 7am does not
 * read a report — they look at one picture and decide.
 *
 * So: one picture per screen, a handful of words, and the animation carrying the meaning.
 * Fifty dots settle and one stays lit; that is the whole product argument, and it needs no
 * sentence. What is left in words is only what a picture cannot say — who is asking, for
 * what, and why this one was not decided by a rule.
 *
 * The sound and the squish are not decoration. Pressing a button that moves, on a page that
 * chimes once, is how it stops feeling like filling in a form.
 */

import type { NightSummary } from '../core/history.js';

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@700;800;900&display=swap');
:root{
  --ink:#242329; --ink2:#5F5D6B; --ink3:#A6A3B4;
  --paper:#F8F7F3; --card:#FFFFFF; --line:#E8E5DC;
  --lilac:#BCB2FA; --lilacD:#6B5BD6; --lilacL:#EDE9FF;
  --lime:#DDF691; --limeD:#7FA326; --limeL:#F2FBD9;
  --grey:#D6D3CA;
  --sh:0 6px 0 rgba(36,35,41,.09),0 12px 28px rgba(36,35,41,.13);
  --shS:0 4px 0 rgba(36,35,41,.08),0 8px 18px rgba(36,35,41,.11);
}
*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0;color:var(--ink);
  background:linear-gradient(180deg,#EFEBFF 0%,#F6F4EC 46%,var(--paper) 100%);
  background-attachment:fixed;
  font-family:"M PLUS Rounded 1c",-apple-system,BlinkMacSystemFont,"Hiragino Maru Gothic ProN",sans-serif;
  font-size:17px;line-height:1.75;font-weight:700;-webkit-font-smoothing:antialiased;
  overflow-x:hidden;display:flex;flex-direction:column;
  padding:20px 20px calc(30px + env(safe-area-inset-bottom));max-width:470px;margin:0 auto;
}
/* drifting shapes, the way kamishibai has clouds */
.blob{position:fixed;border-radius:50%;filter:blur(34px);pointer-events:none;z-index:0;opacity:.5}
.b1{width:60vw;height:28vw;max-width:400px;max-height:200px;top:4%;left:-16%;
  background:var(--lilac);animation:dr1 26s ease-in-out infinite}
.b2{width:44vw;height:22vw;max-width:320px;max-height:160px;bottom:10%;right:-14%;
  background:var(--lime);animation:dr2 33s ease-in-out infinite}
@keyframes dr1{0%,100%{transform:translate(0,0)}50%{transform:translate(38px,22px)}}
@keyframes dr2{0%,100%{transform:translate(0,0)}50%{transform:translate(-32px,-26px)}}
header,main,footer,.guide,.gpanel{position:relative;z-index:1}

header{display:flex;align-items:center;gap:9px}
header svg{width:23px;height:23px}
header b{font-size:17px;font-weight:900;letter-spacing:-.2px}
main{flex:1;display:flex;flex-direction:column;justify-content:center;padding:14px 0}

/* "these came in for you" */
.lede{text-align:center;margin-bottom:6px}
.pill{display:inline-block;font-size:12px;font-weight:900;letter-spacing:.14em;color:#fff;
  background:var(--ink);padding:4px 16px;border-radius:99px;margin-bottom:10px}
.count{font-weight:900;font-size:clamp(76px,24vw,124px);line-height:.92;color:#4A3BAE;
  text-shadow:0 7px 0 var(--lilac),0 13px 24px rgba(36,35,41,.18);
  animation:drop .7s cubic-bezier(.2,1.7,.4,1) backwards}
@keyframes drop{0%{transform:translateY(-34px) scale(.7);opacity:0}70%{transform:translateY(6px) scale(1.06)}100%{transform:none;opacity:1}}
.lede .sub{font-size:16.5px;font-weight:800;color:var(--ink2);line-height:1.5;margin-top:4px}

/* the fold — reference, not the job in front of her */
details.roll{margin-top:22px;background:var(--card);border-radius:24px;box-shadow:var(--shS);
  overflow:hidden}
details.roll summary{list-style:none;cursor:pointer;padding:16px 20px;font-size:15.5px;
  font-weight:900;color:var(--ink2);display:flex;align-items:center;gap:10px}
details.roll summary::-webkit-details-marker{display:none}
details.roll summary::after{content:'▾';margin-left:auto;font-size:17px;color:var(--ink3);
  transition:transform .2s cubic-bezier(.2,1.5,.4,1)}
details.roll[open] summary::after{transform:rotate(180deg)}
details.roll summary b{background:var(--lime);color:#3F5413;border-radius:99px;
  padding:1px 11px;font-size:14px}
.rollin{padding:2px 20px 20px;animation:op .3s ease}
@keyframes op{from{opacity:0;transform:translateY(-6px)}}
.h2{font-size:11.5px;font-weight:900;letter-spacing:.14em;color:var(--ink3);
  margin:14px 0 9px;padding-top:12px;border-top:2px dashed var(--line)}
.rollin .h2:first-child{border-top:0;padding-top:4px;margin-top:4px}
.row{display:flex;align-items:baseline;gap:10px;font-size:15.5px;font-weight:800;
  padding:6px 0;color:var(--ink2)}
.row i{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;font-size:14px;font-weight:900;font-style:normal;flex:0 0 auto}
.row i.a{background:var(--lime);color:#3F5413}
.row i.d{background:#EFEDE6;color:var(--ink3)}
.row i.w{background:var(--lilacL);color:var(--lilacD)}
.row b{font-size:19px;font-weight:900;color:var(--ink)}
.row .amt{margin-left:auto;font-weight:900;color:var(--limeD);white-space:nowrap}
.nights{width:100%;border-collapse:collapse;font-size:14px;font-weight:800;
  font-variant-numeric:tabular-nums}
.nights th{font-size:10.5px;letter-spacing:.09em;color:var(--ink3);text-align:right;
  padding:0 0 6px;font-weight:900}
.nights th:first-child{text-align:left}
.nights td{padding:6px 0;text-align:right;color:var(--ink2);
  border-top:1px solid var(--line)}
.nights td:first-child{text-align:left;color:var(--ink);font-weight:900}
.nights td.ask{color:var(--lilacD);font-weight:900}
.cav{font-size:13.5px;font-weight:800;line-height:1.55;color:#8A6A12;background:#FFF6DC;
  border-radius:14px;padding:10px 13px;margin-top:10px}
.cav b{font-weight:900;color:#6E520A}
.note{margin-top:14px;background:var(--limeL);border-radius:16px;padding:12px 15px;
  font-size:14.5px;font-weight:800;line-height:1.6;color:#41530F}
.note b{font-weight:900;color:#2F3D09}

/* the picture */
.dots{display:grid;grid-template-columns:repeat(10,1fr);gap:9px;margin:0 0 24px}
.dots i{display:block;aspect-ratio:1;border-radius:50%;background:#C9C6D4;
  transform:scale(.44);opacity:.55;animation:settle .6s cubic-bezier(.3,1.5,.5,1) backwards}
.dots i.d{background:var(--grey);transform:scale(.3);opacity:.5}
.dots i.you{background:var(--lilac);transform:scale(1.55);opacity:1;
  box-shadow:0 3px 0 var(--lilacD),0 0 0 6px var(--lilacL);
  animation:pop .75s cubic-bezier(.2,1.7,.4,1) .5s backwards}
@keyframes settle{from{transform:scale(1);opacity:.9}}
@keyframes pop{0%{transform:scale(.4);opacity:.2}62%{transform:scale(1.9)}100%{transform:scale(1.55);opacity:1}}

h1{font-weight:900;line-height:1.3;font-size:clamp(32px,9vw,46px);margin:0 0 20px;
  letter-spacing:-.02em;text-wrap:balance}
h1 em{font-style:normal;display:inline-block;color:#fff;background:var(--lilacD);
  padding:0 15px 3px;border-radius:16px;box-shadow:0 5px 0 #4A3BAE,0 10px 20px rgba(36,35,41,.22);
  transform:rotate(-1.4deg)}
h1 .sm{display:block;font-size:13px;font-weight:900;letter-spacing:.16em;color:var(--ink3);
  margin-bottom:10px}

.card{background:var(--card);border-radius:28px;padding:20px 21px;box-shadow:var(--sh);
  animation:bg .55s cubic-bezier(.2,1.6,.4,1) both}
@keyframes bg{from{opacity:0;transform:translateY(22px) scale(.9)}to{opacity:1;transform:none}}
.card .k{display:inline-block;font-size:12.5px;font-weight:900;letter-spacing:.05em;color:#fff;
  background:var(--ink);padding:3px 14px;border-radius:99px;margin-bottom:11px;
  max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.card .v{font-weight:900;font-size:24px;line-height:1.3;letter-spacing:-.3px;word-break:break-word}
.card .p{font-weight:900;font-size:34px;letter-spacing:-.8px;margin-top:10px;color:var(--lilacD)}
.card .p span{font-size:15px;color:var(--ink3)}
.why{background:var(--lilacL);border-radius:18px;padding:13px 16px;margin-top:15px;
  font-size:15px;line-height:1.6;color:#3B3456;font-weight:800}

.btns{display:grid;gap:12px;margin-top:24px}
a.b,button.b{display:block;width:100%;text-align:center;text-decoration:none;font:inherit;
  font-size:20px;font-weight:900;padding:17px;border-radius:22px;border:0;cursor:pointer;
  letter-spacing:-.2px;background:var(--ink);color:#fff;
  box-shadow:0 6px 0 #0F0E14,0 10px 20px rgba(36,35,41,.2);
  transition:transform .09s cubic-bezier(.3,1.5,.5,1),box-shadow .09s}
a.b:active,button.b:active{transform:translateY(5px);box-shadow:0 1px 0 #0F0E14,0 3px 8px rgba(36,35,41,.2)}
a.g,button.g{background:var(--card);color:var(--ink2);box-shadow:0 6px 0 var(--grey),0 10px 20px rgba(36,35,41,.12)}
a.g:active,button.g:active{box-shadow:0 1px 0 var(--grey),0 3px 8px rgba(36,35,41,.12)}
form{margin:0}

/* the result */
.big{width:136px;height:136px;border-radius:50%;margin:0 auto 22px;display:flex;
  align-items:center;justify-content:center;position:relative}
.big.ok{background:var(--lime);box-shadow:0 8px 0 var(--limeD),0 16px 32px rgba(36,35,41,.2);
  animation:bloom .7s cubic-bezier(.2,1.6,.4,1) backwards,bob 3.4s ease-in-out .7s infinite}
.big.none{background:transparent;border:4px dashed var(--grey);animation:fade .7s ease backwards}
.big svg{width:62px;height:62px}
@keyframes bloom{0%{transform:scale(.2);opacity:0}70%{transform:scale(1.14)}100%{transform:scale(1)}}
@keyframes bob{0%,100%{transform:translateY(0) rotate(-1.5deg)}50%{transform:translateY(-10px) rotate(1.5deg)}}
@keyframes fade{from{opacity:0;transform:scale(1.18)}}
.star{position:absolute;width:10px;height:10px;pointer-events:none;
  animation:fly .9s cubic-bezier(.2,.9,.4,1) forwards}
@keyframes fly{from{transform:translate(0,0) scale(.3);opacity:1}
  to{transform:translate(var(--dx),var(--dy)) scale(1);opacity:0}}

.when{text-align:center;margin-bottom:24px}
.when .n{font-weight:900;font-size:clamp(72px,22vw,120px);line-height:1;color:#4D6416;
  text-shadow:0 7px 0 var(--lime),0 13px 24px rgba(36,35,41,.18);
  animation:bob 3s ease-in-out infinite}
.when .u{font-size:16px;color:var(--ink2);margin-top:10px;font-weight:800}

.trio{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.trio div{background:var(--card);border-radius:22px;padding:15px 8px;text-align:center;
  box-shadow:var(--shS);animation:bg .55s cubic-bezier(.2,1.6,.4,1) both}
.trio div:nth-child(1){animation-delay:.3s}
.trio div:nth-child(2){animation-delay:.42s}
.trio div:nth-child(3){animation-delay:.54s}
.trio .s{font-size:26px;font-weight:900;line-height:1;color:var(--ink3)}
.trio .s.on{color:var(--limeD)}
.trio .l{font-size:12.5px;color:var(--ink2);margin-top:8px;line-height:1.4;font-weight:800}

footer{font-size:14px;color:var(--ink2);line-height:1.65;text-align:center;padding-top:20px;
  font-weight:700}
footer b{color:var(--ink);font-weight:900}
footer .warn{color:#B37C00}

/* the guide — for someone watching a demo, not for the person using it */
.guide{position:fixed;left:18px;bottom:calc(18px + env(safe-area-inset-bottom));z-index:20}
.gbtn{width:58px;height:58px;border-radius:50%;border:0;background:var(--lilac);
  color:var(--ink);font-size:25px;font-weight:900;cursor:pointer;display:flex;
  align-items:center;justify-content:center;font-family:inherit;
  box-shadow:0 6px 0 var(--lilacD),0 12px 24px rgba(36,35,41,.24);
  transition:transform .1s cubic-bezier(.3,1.5,.5,1),box-shadow .1s}
.gbtn:active{transform:translateY(5px);box-shadow:0 1px 0 var(--lilacD),0 4px 10px rgba(36,35,41,.2)}
.gbtn.pulse{animation:nudge 2.8s ease-in-out infinite}
@keyframes nudge{0%,86%,100%{transform:translateY(0)}90%{transform:translateY(-7px)}94%{transform:translateY(0)}}
.gpanel{position:fixed;inset:auto 18px calc(88px + env(safe-area-inset-bottom)) 18px;
  max-width:434px;margin:0 auto;background:var(--card);border-radius:28px;padding:22px;
  box-shadow:0 10px 0 rgba(36,35,41,.1),0 20px 44px rgba(36,35,41,.24);z-index:19;
  transform:translateY(16px) scale(.94);opacity:0;pointer-events:none;
  transition:all .24s cubic-bezier(.2,1.5,.35,1)}
.gpanel.on{transform:none;opacity:1;pointer-events:auto}
.gpanel .tag{display:inline-block;font-size:12px;font-weight:900;letter-spacing:.09em;
  color:#fff;background:var(--lilacD);padding:3px 14px;border-radius:99px;margin-bottom:12px}
.gpanel p{margin:0 0 11px;font-size:15.5px;line-height:1.72;font-weight:700;color:var(--ink2)}
.gpanel p:last-of-type{margin-bottom:0}
.gpanel b{color:var(--ink);font-weight:900}
.gnav{display:flex;align-items:center;gap:10px;margin-top:17px}
.gnav button{flex:1;font:inherit;font-size:15px;font-weight:900;padding:11px;border-radius:15px;
  border:0;background:var(--ink);color:#fff;cursor:pointer;
  box-shadow:0 4px 0 #0F0E14;transition:transform .09s,box-shadow .09s}
.gnav button:active{transform:translateY(3px);box-shadow:0 1px 0 #0F0E14}
.gnav button:first-child{background:var(--card);color:var(--ink2);box-shadow:0 4px 0 var(--grey)}
.gnav button:first-child:active{box-shadow:0 1px 0 var(--grey)}
.gnav button:disabled{opacity:.35}
.gdot{font-size:13px;font-weight:900;color:var(--ink3);white-space:nowrap;
  font-variant-numeric:tabular-nums}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;

const MARK = `<svg viewBox="0 0 256 256" fill="#242329" aria-hidden="true"><defs><path id="q"
d="M112 92C100 92 92 100 92 112H62C38 112 20 94 20 70V62C20 38 38 20 62 20H70C94 20 112 38 112 62Z"/>
</defs><use href="#q"/><use href="#q" transform="rotate(90 128 128)"/>
<use href="#q" transform="rotate(180 128 128)"/><use href="#q" transform="rotate(270 128 128)"/></svg>`;

/** One chime, synthesised. No audio file, no CDN, no autoplay on load. */
const CHIME = `
function chime(){try{
  const C=new (window.AudioContext||window.webkitAudioContext)(),t=C.currentTime;
  [784,988,1175,1568].forEach((f,i)=>{const o=C.createOscillator(),g=C.createGain();
    o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t+i*0.07);
    g.gain.linearRampToValueAtTime(.16,t+i*0.07+0.02);
    g.gain.exponentialRampToValueAtTime(.001,t+i*0.07+0.5);
    o.connect(g);g.connect(C.destination);o.start(t+i*0.07);o.stop(t+i*0.07+0.55)});
  const o=C.createOscillator(),g=C.createGain();o.type='triangle';o.frequency.value=2349;
  g.gain.setValueAtTime(.09,t+.3);g.gain.exponentialRampToValueAtTime(.001,t+1.5);
  o.connect(g);g.connect(C.destination);o.start(t+.3);o.stop(t+1.5);
}catch(e){}}
function burst(el){if(!el)return;for(let i=0;i<12;i++){
  const s=document.createElement('i');s.className='star';
  const a=(Math.PI*2*i)/12,d=58+Math.random()*34;
  s.style.setProperty('--dx',(Math.cos(a)*d).toFixed(0)+'px');
  s.style.setProperty('--dy',(Math.sin(a)*d).toFixed(0)+'px');
  s.style.background=i%2?'#BCB2FA':'#DDF691';s.style.borderRadius='50%';
  s.style.animationDelay=(i*12)+'ms';el.appendChild(s);
  setTimeout(()=>s.remove(),1200)}}
`;

/**
 * Two audiences look at this screen, and they need different things.
 *
 * **The person using it** needs enough to act: what pressing Yes will ask of them, that
 * doing nothing is also an answer, and — after — whether money actually moved. That stays
 * on the screen, in one line, because a product that explains nothing is not minimal, it
 * is unusable.
 *
 * **Someone watching a demo** wants to know why it is built this way. That is everything
 * else, and it goes behind a button, so it is available without being in the way.
 */
interface GuideCard {
  tag: string;
  lines: string[];
}

const guide = (cards: GuideCard[]) => `
<button class="gbtn pulse" id="gb" aria-label="What is happening here">?</button>
<div class="gpanel" id="gp"></div>
<script>
const CARDS=${JSON.stringify(cards)};let gi=0;
const gp=document.getElementById('gp'),gb=document.getElementById('gb');
function draw(){const c=CARDS[gi];
  gp.innerHTML='<div class="tag">'+c.tag+'</div>'+c.lines.map(l=>'<p>'+l+'</p>').join('')+
  '<div class="gnav"><button id="gprev">Back</button>'+
  '<span class="gdot">'+(gi+1)+' / '+CARDS.length+'</span>'+
  '<button id="gnext">'+(gi===CARDS.length-1?'Close':'Next')+'</button></div>';
  document.getElementById('gprev').disabled=gi===0;
  document.getElementById('gprev').onclick=()=>{if(gi>0){gi--;draw()}};
  document.getElementById('gnext').onclick=()=>{
    if(gi===CARDS.length-1){gp.classList.remove('on');gb.textContent='?'}else{gi++;draw()}};
}
gb.onclick=()=>{const on=gp.classList.toggle('on');gb.classList.remove('pulse');
  gb.textContent=on?'\u00d7':'?';if(on)draw()};
</script>`;

const shell = (title: string, body: string, cards: GuideCard[], script = '') =>
  `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title}</title><style>${STYLE}</style></head><body>
<div class="blob b1"></div><div class="blob b2"></div>
<header>${MARK}<b>yohaku</b></header>${body}
<script>${CHIME}${script}</script>${guide(cards)}</body></html>`;

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** How long ago, as two pieces so the number can be set large. */
function ago(then: Date, now = new Date()): { n: string; u: string } {
  const s = Math.max(0, Math.round((now.getTime() - then.getTime()) / 1000));
  if (s < 90) return { n: String(s), u: s === 1 ? 'second ago' : 'seconds ago' };
  const m = Math.round(s / 60);
  if (m < 90) return { n: String(m), u: m === 1 ? 'minute ago' : 'minutes ago' };
  const h = Math.round(m / 60);
  return { n: String(h), u: h === 1 ? 'hour ago' : 'hours ago' };
}

function hoursLeft(deadline: string, now = new Date()): string {
  const h = Math.round((new Date(deadline).getTime() - now.getTime()) / 3_600_000);
  if (h <= 0) return 'gone';
  return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
}

/** The picture: what was handled without her, and the one that was not. */
function dots(handled: number): string {
  const total = Math.min(Math.max(handled + 1, 12), 49);
  const denied = Math.round((total - 1) * 0.2);
  const cells: string[] = [];
  for (let i = 0; i < total - 1; i++) {
    cells.push(`<i class="${i < denied ? 'd' : ''}" style="animation-delay:${i * 11}ms"></i>`);
  }
  cells.push('<i class="you"></i>');
  return `<div class="dots">${cells.join('')}</div>`;
}

const TICK = `<svg viewBox="0 0 24 24" fill="none" stroke="#4A5C1E" stroke-width="3.2"
stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5.5 5.5L20 6.5"/></svg>`;

/** Today, as it actually happened on this server. Not a figure anyone typed. */
export interface TodaySummary {
  arrived: number;
  auto: number;
  deny: number;
  waiting: number;
  /**
   * What the accepted offers were **worth** — not what arrived in a wallet.
   *
   * Every entry on this server carries `settlement: 'not-wired'`, so summing them and
   * calling it income would put money on the screen that never moved. The screen says
   * "worth", and says underneath that nothing was transferred.
   */
  worth: number;
  currency: string;
  settlementWired: boolean;
}

const num = (n: number) => n.toLocaleString('en-US');

/** The fold: what was handled without her, tonight and on the nights before. */
function fold(today: TodaySummary, nights: NightSummary[]): string {
  const asked = [...new Set(nights.map((n) => n.asked))];
  const everyNight =
    nights.length > 1 && asked.length === 1
      ? `<div class="note">You were asked about <b>${asked[0]}</b>
         ${asked[0] === 1 ? 'thing' : 'things'} on every one of these nights.
         <b>That is your cap, not ours</b> — the number arriving moves, the number
         reaching you does not.</div>`
      : '';

  const rows = nights.length
    ? `<div class="h2">THE NIGHTS BEFORE</div>
<table class="nights"><tr><th>Night</th><th>Came in</th><th>Accepted</th><th>Dropped</th><th>Asked you</th></tr>
${nights
  .map(
    (n) => `<tr><td>${esc(n.label)}</td><td>${n.arrived}</td><td>${n.auto}</td>
<td>${n.deny}</td><td class="ask">${n.asked}</td></tr>`,
  )
  .join('')}</table>${everyNight}`
    : '';

  return `<details class="roll">
<summary>What we handled without you <b>${today.auto + today.deny}</b></summary>
<div class="rollin">
  <div class="h2">OVERNIGHT, FOR YOU</div>
  <div class="row"><i class="a">✓</i><b>${today.auto}</b> accepted on your rules
    ${
      today.worth > 0
        ? `<span class="amt">${num(today.worth)} ${esc(today.currency)}${today.settlementWired ? '' : ' worth'}</span>`
        : ''
    }</div>
  <div class="row"><i class="d">✕</i><b>${today.deny}</b> dropped before they reached you</div>
  <div class="row"><i class="w">⏳</i><b>${today.waiting}</b> still waiting for you</div>
  ${
    today.settlementWired
      ? ''
      : '<div class="cav">Nothing has been transferred. <b>Payment is not connected yet</b> — the amount above is what those offers are worth, not what you have been paid.</div>'
  }
  ${rows}
</div></details>`;
}

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
  handledWithoutYou?: number;
  today: TodaySummary;
  nights?: NightSummary[];
}): string {
  const id = encodeURIComponent(p.id);
  const handled = p.handledWithoutYou ?? p.today.auto + p.today.deny;
  const nights = p.nights ?? [];
  return shell(
    'yohaku',
    `<main>
<div class="lede">
  <div class="pill">TODAY&rsquo;S OFFERS FROM AGENTS</div>
  <div class="count">${p.today.arrived}</div>
  <div class="sub">${p.today.arrived === 1 ? 'offer' : 'offers'} from agents came in<br>while you were asleep.</div>
</div>
${dots(handled)}
<h1 style="text-align:center">Only <em>this one</em><br>needs you.</h1>

<div class="card">
  <div class="k">${esc(p.who)}</div>
  <div class="v">${esc(p.what)}</div>
  <div class="p">${num(p.amount)} <span>${esc(p.currency)} · ${hoursLeft(p.deadline)} left</span></div>
  <div class="why">${esc(p.reason)}</div>
</div>

<div class="btns">
  <a class="b" href="/approve/${id}/verify">Yes</a>
  <form method="post" action="/approve/${id}/decline"><button class="b g" type="submit">No</button></form>
</div>
${fold(p.today, nights)}
</main>
<footer>${
      p.identityWired
        ? '<b>Yes</b> will ask you to confirm it is you before anything is sent.'
        : '<span class="warn"><b>Identity is not connected on this instance</b> — Yes would not verify anyone.</span>'
    }<br>Leave it alone and it is refused when the time runs out.</footer>`,
    [
      {
        tag: 'WHAT YOU ARE LOOKING AT',
        lines: [
          'Agents asked this person for things all night. <b>Each dot is one request.</b>',
          'The small ones went through on her own rules, or never reached her at all. <b>The lit one is the only thing she is being asked about.</b>',
        ],
      },
      {
        tag: 'WHY THIS ONE',
        lines: [
          `Ten ordered rules decide every request. This one hit: <b>${esc(p.reason)}</b>`,
          'A rule could not settle it, so it waits for her. <b>Nothing waits for her by default</b> — the rules have to fail first.',
        ],
      },
      {
        tag: 'THE FOLD, AND WHERE ITS NUMBERS COME FROM',
        lines: [
          '<b>Overnight</b> is this server: whatever was actually posted to it, split by the router.',
          '<b>The nights before</b> are generated nights <b>replayed through the same <code>route()</code></b> — no count in that table was typed in. Real traffic does not exist yet, and we would rather say so than show a number you cannot trace.',
          'Change a rule and that table changes. <b>Except the last column</b> — the cap fixes it.',
        ],
      },
      {
        tag: 'WHY ASK NOW',
        lines: [
          'Proving personhood at signup says a person opened the account once. <b>Proving it here says a person is present at the moment money would move.</b>',
          'That is why the next screen shows how many <b>seconds</b> ago, not a date.',
        ],
      },
      {
        tag: 'TRY IT',
        lines: [
          'Press <b>No</b> and look at what the next screen lists. Absence is invisible, so it names each thing that did not happen.',
          'Then come back and press <b>Yes</b> on another one.',
        ],
      },
    ],
  );
}

export function resultPage(p: {
  outcome: 'approved' | 'declined' | 'expired' | 'refused';
  detail: string;
  verifiedAt?: Date;
  acr?: string;
  what?: string;
  amount?: string;
}): string {
  if (p.outcome === 'approved') {
    const t = p.verifiedAt ? ago(p.verifiedAt) : undefined;
    return shell(
      'yohaku',
      `<main>
<div class="big ok" id="b">${TICK}</div>
<h1 style="text-align:center"><span class="sm">IT WAS YOU</span>${
        p.what ? esc(p.what) : 'Approved'
      }</h1>
${
  t
    ? `<div class="when"><div class="n">${t.n}</div><div class="u">${t.u} · you proved it</div></div>`
    : ''
}
<div class="trio">
  <div><div class="s on">✓</div><div class="l">person<br>verified</div></div>
  <div><div class="s on">✓</div><div class="l">answer<br>kept</div></div>
  <div><div class="s">—</div><div class="l">payment<br>not wired</div></div>
</div>
</main>
<footer><b>You have not been paid.</b> Payment is not connected yet, so nothing was
transferred.<br>Your permission was recorded, and you will not be asked this again.</footer>`,
      [
        {
          tag: 'THAT NUMBER',
          lines: [
            'It is how long ago she authenticated — <b>seconds, not days.</b>',
            '<b>It did not come from us.</b> It is a signed claim from the identity provider, checked against this server\u2019s clock. We cannot make it smaller than it is.',
          ],
        },
        {
          tag: 'WHY IT MATTERS',
          lines: [
            'Proving personhood at signup says a person opened the account once.',
            '<b>Proving it here says a person is present now</b> — at the moment money would move. That is the difference the whole flow exists for.',
          ],
        },
        {
          tag: 'THE THIRD TILE',
          lines: [
            'Payment is <b>not wired</b>, and the screen says so.',
            'Everything up to the signature happened; the signature did not. <b>We would rather you heard that from the product than found it.</b>',
          ],
        },
      ],
      `setTimeout(()=>{chime();burst(document.getElementById('b'))},420);`,
    );
  }

  const lede =
    p.outcome === 'expired' ? 'TIME RAN OUT' : p.outcome === 'declined' ? 'YOU SAID NO' : 'NOT COMPLETED';

  return shell(
    'yohaku',
    `<main>
<div class="big none"></div>
<h1 style="text-align:center"><span class="sm">${lede}</span>Nothing<br><em>happened.</em></h1>
<div class="trio">
  <div><div class="s">—</div><div class="l">nothing<br>signed</div></div>
  <div><div class="s">—</div><div class="l">no money<br>moved</div></div>
  <div><div class="s">—</div><div class="l">no consent<br>recorded</div></div>
</div>
</main>
<footer><b>Your answer was kept.</b> You will be asked about this kind of thing less
often, not more.</footer>`,
    [
      {
        tag: 'SHOWING AN ABSENCE',
        lines: [
          '<b>Nothing happening is hard to see</b>, so each thing that did not happen is named.',
          'No signature. No transfer. No permission for the counterparty to point at later.',
        ],
      },
      {
        tag: 'THE SAME PATH FOR EVERY FAILURE',
        lines: [
          'Refusing, running out of time, a failed identity check, an unreachable provider — <b>all of them land here.</b>',
          '<b>Silence is not consent.</b> If she never answers, the deadline refuses it for her.',
        ],
      },
      {
        tag: 'A REFUSAL IS ALSO DATA',
        lines: [
          'Her answer was kept. <b>She will be asked about this less, not more.</b>',
          'What accumulates is a record of when a person says no — the part that cannot be synthesised.',
        ],
      },
    ],
  );
}
