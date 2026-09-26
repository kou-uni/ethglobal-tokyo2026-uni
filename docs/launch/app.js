/* Presentation only: no credentials, provider calls, payment signing or settlement. */
(()=>{
const COPY=window.LAUNCH_COPY,fixture=window.YOHAKU_REPLAY;
let lang=new URLSearchParams(location.search).get('lang')==='en'?'en':'ja';
let scenario='human',phase=0,playing=false,timer=null,focusMode=false;
const $=id=>document.getElementById(id);
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function stop(){playing=false;clearTimeout(timer);timer=null;}
function schedule(){clearTimeout(timer);if(playing)timer=setTimeout(()=>{if(phase<5){phase++;draw();schedule();}else{stop();draw();}},7000);}
function updateCap(){const n=Number($('cap').value),row=fixture.night.caps.find(c=>c.cap===n);$('capValue').value=String(n);$('surfaced').textContent=String(row.surfaced);$('arrived').textContent=String(fixture.night.arrived);}
function chosenDecision(){return scenario==='silence'&&phase<4?fixture.cases.human:fixture.cases[scenario];}
function render(){const t=COPY[lang];document.documentElement.lang=lang;document.title=lang==='ja'?'Yohaku — 顧客はエージェント。人間には、余白を。':'Yohaku — Agent commerce. Human space.';
document.querySelectorAll('[data-t]').forEach(e=>e.textContent=t[e.dataset.t]);
document.querySelectorAll('[data-html]').forEach(e=>e.innerHTML=t[e.dataset.html]);
document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
$('values').innerHTML=t.values.map(c=>`<article class="value-card"><span class="eyebrow">${c[0]}</span><h3>${c[1]}</h3><p>${c[2]}</p></article>`).join('');
$('scenarios').innerHTML=t.scenarios.map(c=>`<button data-case="${c[0]}" aria-pressed="${c[0]===scenario}">${c[1]}</button>`).join('');
$('techCards').innerHTML=t.tech.map(c=>`<article class="tech-card"><span>${c[0]}</span><h3>${c[1]}</h3><div class="why">${c[2]}</div><p>${c[3]}</p><details><summary>${t.more}</summary><code>${esc(c[4])}</code><p>${c[5]}</p><a href="${c[6]}">${t.proofLink}</a></details></article>`).join('');
$('prizeCards').innerHTML=t.prizes.map(c=>`<article class="prize"><div><span class="rank">${c[0]}</span><h3>${c[1]}</h3><a href="https://ethglobal.com/events/tokyo2026/prizes/${c[5]}">${t.official}</a></div><div><h4>${c[2]}</h4><p>${c[3]}</p><details><summary>${t.reqSummary}</summary><ul>${c[4].map(v=>`<li>${v}</li>`).join('')}</ul></details></div></article>`).join('');
$('evidenceCards').innerHTML=t.evidence.map(c=>`<article class="evidence"><span class="status">${c[0]}</span><h3>${c[1]}</h3><p>${c[2]}</p><a href="${c[3]}">${t.proofLink}</a></article>`).join('');
document.querySelectorAll('[data-case]').forEach(b=>b.addEventListener('click',()=>{scenario=b.dataset.case;phase=0;stop();document.querySelectorAll('[data-case]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));draw();}));
updateCap();draw();try{const url=new URL(location.href);url.searchParams.set('lang',lang);history.replaceState(null,'',url);}catch{}
}
function draw(){const t=COPY[lang],d=chosenDecision();
let cap=t.phaseText[phase];if(scenario==='risk'&&phase>=2)cap=t.riskCaption;else if(scenario==='silence'&&phase>=4)cap=t.silenceCaption;else if(scenario==='auto'&&phase===3)cap=t.autoCaption;
$('caption').innerHTML=`<h3>${cap[0]}</h3><p>${cap[1]}</p>`;$('sceneCount').textContent=`${t.scene} ${phase+1} / 6 · ${t.phases[phase]}`;
$('verdict').textContent=phase<2?'—':`${d.verdict.toUpperCase()} · ${d.rule<0?'deadline':'rule '+d.rule}`;
$('decisionReason').textContent=phase<2?t.pending:d.reason;
const denied=phase>=2&&d.verdict==='deny';
$('humanState').textContent=scenario==='auto'?t.humanSkipped:denied&&scenario==='risk'?t.humanNo:denied&&scenario==='silence'?t.humanExpired:phase<3?t.humanNeeded:scenario==='human'&&phase>=4?t.humanApproved:t.humanWaiting;
$('paymentState').textContent=denied?t.none:phase<4?t.held:t.ready;
const active=phase===0?'agent':phase<=2?'router':phase===3?(scenario==='auto'||scenario==='risk'?'router':'human'):phase===4?'payment':'router';
document.querySelectorAll('[data-node]').forEach(e=>{e.classList.toggle('active',e.dataset.node===active);e.classList.toggle('blocked',denied&&['router','payment'].includes(e.dataset.node));});
$('playerLang').textContent=lang==='ja'?'EN':'日本語';$('focus').textContent=focusMode?t.focusClose:t.focusOpen;$('play').textContent=playing?t.pause:phase===5?t.restart:t.play;$('back').disabled=phase===0;$('next').disabled=phase===5;
const focusStep=document.activeElement?.dataset?.phase;
$('dots').innerHTML=t.phases.map((v,i)=>`<button data-phase="${i}" aria-label="${t.scene} ${i+1}: ${v}" ${i===phase?'aria-current="step"':''}>${i+1}</button>`).join('');
document.querySelectorAll('[data-phase]').forEach(b=>b.onclick=()=>{stop();phase=Number(b.dataset.phase);draw();});
if(focusStep!==undefined)document.querySelector(`[data-phase="${focusStep}"]`)?.focus({preventScroll:true});
$('trace').textContent=JSON.stringify({mode:'core-generated replay',simulation:true,executable:false,scenario,phase:t.phases[phase],decision:phase>=2?d:null,source:fixture.generatedFrom,screening:scenario==='risk'?'recorded provider reason, not a live call':scenario==='auto'||scenario==='human'?'clean fixture':'clean fixture then no answer',paymentExecuted:false},null,2);
}
function setFocus(on){focusMode=on;const player=document.querySelector('.player');player.classList.toggle('is-focused',on);document.body.classList.toggle('presenting',on);$('focus').setAttribute('aria-expanded',String(on));if(on){player.setAttribute('role','dialog');player.setAttribute('aria-modal','true');player.setAttribute('aria-label',COPY[lang].navJourney);}else{player.removeAttribute('role');player.removeAttribute('aria-modal');player.removeAttribute('aria-label');}draw();$('focus').focus({preventScroll:true});}
$('focus').onclick=()=>setFocus(!focusMode);
$('playerLang').onclick=()=>{lang=lang==='ja'?'en':'ja';render();if(focusMode)document.querySelector('.player').setAttribute('aria-label',COPY[lang].navJourney);schedule();};
document.addEventListener('keydown',e=>{if(!focusMode)return;if(e.key==='Escape'){e.preventDefault();setFocus(false);}if(e.key==='Tab'){const items=[...document.querySelector('.player').querySelectorAll('button:not([disabled]), summary, a[href]')];const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
$('cap').addEventListener('input',updateCap);
$('back').onclick=()=>{stop();phase=Math.max(0,phase-1);draw();};$('next').onclick=()=>{stop();phase=Math.min(5,phase+1);draw();};
$('play').onclick=()=>{if(playing)stop();else{if(phase===5)phase=0;playing=true;}draw();schedule();};
document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{lang=b.dataset.lang;render();schedule();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();draw();}});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{stop();draw();});
$('export').onclick=()=>{const record={format:'yohaku-proposed-handoff-sample/v0',simulation:true,executable:false,signed:false,neoIntegration:false,scenario,decision:fixture.cases[scenario],attentionCap:Number($('cap').value),identity:{verified:false,reason:'No proof collected by this page'},settlement:{executed:false},source:fixture.generatedFrom,purpose:'Discussion sample only. Not an authorization or an agreed NEO API.'};const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)+'\n'],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='yohaku-decision-sample.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);$('export').textContent=COPY[lang].exportDone;};
render();
})();
