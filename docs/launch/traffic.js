/* Offline, core-generated explanation. No wallet, provider or network calls. */
(()=>{
const data=window.YOHAKU_REPLAY,flow=data.traffic,COPY=window.TRAFFIC_COPY;
const root=document.createElement('section');
root.id='traffic';root.className='section wrap traffic-section';
root.innerHTML=`
 <div class="section-head"><span class="eyebrow">02 / MANY AGENTS. ONE HUMAN.</span><h2 data-traffic-html="title"></h2><p data-traffic="intro"></p></div>
 <div class="traffic-player" id="trafficPlayer">
  <div class="traffic-top"><span class="badge" data-traffic="badge"></span><div><button id="trafficLang" type="button">EN</button> <button id="trafficFocus" type="button" aria-expanded="false" data-traffic="open"></button></div></div>
  <div class="traffic-modes" role="group" id="trafficModes"><button type="button" data-traffic-mode="flow" aria-controls="trafficFlowPanel" aria-pressed="true" data-traffic="flowMode"></button><button type="button" data-traffic-mode="examples" aria-controls="trafficExamplesPanel" aria-pressed="false" data-traffic="examplesMode"></button></div>
  <div id="trafficFlowPanel">
  <div class="traffic-caption" aria-live="polite" aria-atomic="true"><h3 id="trafficTitle"></h3><p id="trafficCaption"></p></div>
  <div class="traffic-map" tabindex="0" role="region" aria-labelledby="trafficSvgTitle">
   <svg viewBox="0 0 1170 515" role="img" aria-labelledby="trafficSvgTitle trafficSvgDesc">
    <title id="trafficSvgTitle" data-traffic="graphTitle"></title><desc id="trafficSvgDesc" data-traffic="graphDesc"></desc>
    <defs><pattern id="trafficDots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#52465e"/></pattern></defs>
    <rect x="0" y="0" width="1170" height="515" fill="url(#trafficDots)" opacity=".4"/>
    <rect x="230" y="7" width="687" height="498" rx="24" class="product-boundary"/>
    <text x="254" y="36" class="product-name">YOHAKU</text>
    <text x="401" y="33" class="product-promise" data-traffic="productPromise"></text>
    <g aria-hidden="true" id="trafficInputRails"></g>
    <path id="trafficPath-screened" class="rail screening-rail" d="M386 158 V192"/>
    <path id="trafficPath-auto" class="rail auto-rail" d="M498 296 C550 296 532 120 590 120"/>
    <path id="trafficPath-human" class="rail held-rail" d="M498 296 C539 296 550 326 604 326"/>
    <path id="trafficPath-deny" class="rail deny-rail" d="M498 296 C550 296 537 439 590 439"/>
    <path id="trafficPath-jev" class="rail jev-rail" d="M386 360 C386 384 411 384 411 401"/>
    <path id="trafficPath-ask" class="rail jev-rail" d="M528 425 C564 425 555 326 604 326"/>
    <path id="trafficPath-drop" class="rail deny-rail" d="M528 463 C553 463 557 439 590 439"/>
    <path class="rail held-rail muted-rail" d="M818 323 C875 323 864 283 933 283"/>
    <rect class="node" x="16" y="65" width="182" height="355" rx="18"/>
    <text x="35" y="94" data-traffic="incoming"></text>
    <g aria-hidden="true" id="trafficAgents"></g>
    <text x="30" y="447" class="small" data-traffic="source"></text>
    <text x="30" y="479" class="number" id="trafficArrived">0</text>
    <text x="90" y="476" class="small">/ ${flow.items.length}</text>
    <rect id="trafficScreenNode" class="node screening-node" x="273" y="53" width="225" height="105" rx="17"/>
    <text x="294" y="79" class="tiny" data-traffic="screenRole"></text>
    <text x="294" y="107" class="heavy">Intercepta</text>
    <text x="294" y="129" class="tiny" data-traffic="screenExchange"></text>
    <text x="294" y="147" class="tiny" data-traffic="screenFailure"></text>
    <rect class="engine" x="273" y="192" width="225" height="168" rx="20"/>
    <text x="294" y="220" class="engine-small" data-traffic="engine"></text>
    <text x="293" y="253" class="heavy engine-ink" style="font-size:25px" data-traffic="engineTitle"></text>
    <text x="294" y="280" class="engine-small" data-traffic="enforced"></text>
    <text x="294" y="311" class="engine-small" data-traffic="checks"></text>
    <text x="294" y="340" class="engine-small">ENSv2 · proposal ≠ policy</text>
    <rect id="trafficJevNode" class="node jev-node" x="300" y="401" width="228" height="87" rx="16"/>
    <text x="317" y="422" class="tiny" data-traffic="jevRole"></text>
    <text x="317" y="449" class="heavy">Jev</text>
    <text x="373" y="449" class="small">ask | drop</text>
    <text x="317" y="474" class="tiny" data-traffic="aiNoAuto"></text>
    <text x="547" y="404" class="tiny" style="fill:#ddc2ff">ask</text>
    <text x="543" y="487" class="tiny" style="fill:#f1a7b8">drop</text>
    <rect class="node" x="590" y="63" width="228" height="105" rx="16"/>
    <text x="608" y="94" data-traffic="auto"></text>
    <text x="798" y="102" class="number" style="fill:#dcf58e" text-anchor="end" id="trafficAuto">0</text>
    <text x="608" y="124" class="tiny" data-traffic="autoSub"></text>
    <g id="trafficAutoDots" aria-hidden="true"></g>
    <text x="604" y="189" class="tiny" data-traffic="paymentRole"></text>
    <rect class="node" x="590" y="211" width="228" height="133" rx="16"/>
    <text x="608" y="240" data-traffic="queue"></text>
    <text x="608" y="270" class="small" data-traffic="held"></text>
    <text x="798" y="280" class="number" style="fill:#c6a0f0" text-anchor="end" id="trafficHeld">0</text>
    <text x="608" y="294" class="tiny" data-traffic="queueSub"></text>
    <g id="trafficHeldDots" aria-hidden="true"></g>
    <g id="trafficBundleSlots" aria-hidden="true"></g>
    <rect class="node" x="590" y="388" width="228" height="100" rx="16"/>
    <text x="608" y="419" data-traffic="deny"></text>
    <text x="798" y="429" class="number" style="fill:#f1a7b8" text-anchor="end" id="trafficDeny">0</text>
    <text x="608" y="452" class="tiny" data-traffic="denySub"></text>
    <g id="trafficDenyDots" aria-hidden="true"></g>
    <path d="M866 211 V348" class="gate-line"/>
    <text x="866" y="195" class="tiny" text-anchor="middle" data-traffic="gate"></text>
    <text x="866" y="377" class="number" text-anchor="middle" style="fill:#c6a0f0" id="trafficGateCount">2</text>
    <rect class="human-zone" x="933" y="165" width="219" height="225" rx="28"/>
    <text x="1042" y="200" class="human-small" text-anchor="middle" data-traffic="human"></text>
    <text x="1042" y="265" class="number human-ink" style="font-size:62px" text-anchor="middle" id="trafficHuman">0</text>
    <text x="1042" y="288" class="human-small" text-anchor="middle" data-traffic="notify"></text>
    <text x="1042" y="355" class="human-small" text-anchor="middle" data-traffic="humanLink"></text>
    <text x="1042" y="375" class="tiny human-ink" text-anchor="middle" data-traffic="space"></text>
    <text x="605" y="369" class="tiny" data-traffic="wait"></text>
    <path d="M1042 390 V420" class="rail muted-rail"/>
    <rect x="933" y="420" width="219" height="68" rx="16" class="node muted-rail"/>
    <text x="950" y="447" class="heavy" style="fill:#c9bbd6">NEO</text>
    <text x="950" y="473" class="tiny" data-traffic="neoRole"></text>
    <g id="trafficPackets" aria-hidden="true"></g>
    <g id="trafficMovingBundles" aria-hidden="true"></g>
   </svg>
  </div>
  <p class="traffic-pan" data-traffic="pan"></p>
  <div class="traffic-legend"><span><i></i><b id="trafficLegendAuto"></b></span><span><i></i><b id="trafficLegendDeny"></b></span><span><i></i><b id="trafficLegendHuman"></b></span><span class="traffic-total" id="trafficTotals"></span></div>
  <div class="traffic-control-row">
   <div class="traffic-controls"><button class="traffic-play" id="trafficPlay" type="button"></button><button id="trafficResult" type="button" data-traffic="result"></button><label><input id="trafficLoop" type="checkbox"><span data-traffic="loop"></span></label></div>
   <label class="traffic-cap"><span data-traffic="cap"></span><select id="trafficCap">${flow.caps.map(c=>`<option value="${c.cap}"${c.cap===2?' selected':''}>${c.cap}</option>`).join('')}</select><span data-traffic="unit"></span></label>
  </div>
  <div class="traffic-timeline"><input id="trafficTime" type="range" min="0" max="40" step=".1" value="0"><output id="trafficClock" for="trafficTime"></output></div>
  <div class="traffic-steps" id="trafficSteps"></div><p class="traffic-note" data-traffic="capNote"></p>
  <p class="traffic-note product-note" data-traffic="productNote"></p>
  </div>
  <section id="trafficExamplesPanel" hidden aria-labelledby="criteriaTitle"></section>
 </div>
 <div class="traffic-after"><p data-traffic="foot"></p><a href="#journey" data-traffic="detail"></a></div>
 <div class="ai-boundary"><span class="eyebrow">JEV / BOUNDED DECISION SUPPORT</span><h3 data-traffic="aiTitle"></h3><p data-traffic="aiIntro"></p>
  <div class="ai-track"><div class="ai-card"><small data-traffic="aiRule"></small><strong data-traffic="aiInput"></strong><code>verdict: human</code></div><div class="ai-arrow" aria-hidden="true">→</div><div class="ai-card"><small data-traffic="aiOutput"></small><div class="ai-choices"><button type="button" data-ai-choice="ask">ask</button><button type="button" data-ai-choice="drop">drop</button></div><small data-traffic="aiNoAuto"></small></div><div class="ai-arrow" aria-hidden="true">→</div><div class="ai-card ai-result" id="trafficAiResult"><strong id="trafficAiTitle"></strong><code id="trafficAiCode"></code><p id="trafficAiCap"></p></div></div>
  <div class="ai-verdict" id="trafficAiVerdict" aria-live="polite"></div><p class="micro" data-traffic="aiNote"></p>
 </div>
 <details class="traffic-record"><summary data-traffic="record"></summary><p data-traffic="recordIntro"></p><pre id="trafficRecord"></pre></details>`;
document.getElementById('journey').before(root);

const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg',DURATION=40,STARTS=[0,3,20.2,27,30];
const motion=matchMedia('(prefers-reduced-motion: reduce)');
let lang=document.documentElement.lang==='en'?'en':'ja',time=motion.matches?DURATION:0,playing=false,frame=0,lastFrame=0;
let cap=2,focused=false,hasInteracted=false,aiChoice='ask',lastScene=-1,previousFocus=null;
let mode=new URLSearchParams(location.search).get('view')==='examples'?'examples':'flow';
const svg=(tag,attrs,parent)=>{const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));parent.append(el);return el;};
const incoming=flow.agents.map((agent,i)=>{
 const y=135+i*40;
 const p=svg('path',{d:`M166 ${y} C227 ${y} 219 114 273 114`,class:'rail'},$('trafficInputRails'));
 svg('rect',{x:35,y:y-12,width:26,height:26,rx:8,class:'source-ring'},$('trafficAgents'));
 svg('circle',{cx:43,cy:y,r:2,class:'agent-eye'},$('trafficAgents'));svg('circle',{cx:53,cy:y,r:2,class:'agent-eye'},$('trafficAgents'));
 const text=svg('text',{x:72,y:y+4,class:'agent-name'},$('trafficAgents'));text.textContent=agent.split('.')[0];
 const title=svg('title',{},text);title.textContent=agent;
 return {path:p,length:p.getTotalLength()};
});
const outgoing=Object.fromEntries(['auto','human','deny','screened','jev','ask','drop'].map(v=>{const p=$('trafficPath-'+v);return [v,{path:p,length:p.getTotalLength()}];}));
const ordinary=flow.items.filter(i=>!i.modelChoice),aiItems=flow.items.filter(i=>i.modelChoice);
const packets=flow.items.map((item,i)=>({
 ...item,start:item.modelChoice?16+aiItems.indexOf(item)*2:.65+ordinary.indexOf(item)*(13.8/Math.max(1,ordinary.length-1)),duration:item.modelChoice?8:5.3,
 trails:[0,1,2,3].map(j=>svg('circle',{r:j===0?(item.modelChoice?6:4):3-j*.5,opacity:1-j*.22},$('trafficPackets')))
}));
const heldItems=flow.items.filter(i=>i.verdict==='human');
const autoDots=flow.items.filter(i=>i.verdict==='auto').map((item,i)=>({id:item.id,el:svg('circle',{cx:609+(i%16)*12,cy:144+Math.floor(i/16)*9,r:2.2,fill:'#dcf58e'},$('trafficAutoDots'))}));
const denyDots=flow.items.filter(i=>i.verdict==='deny').map((item,i)=>({id:item.id,el:svg('circle',{cx:609+i*14,cy:472,r:2.5,fill:'#f1a7b8'},$('trafficDenyDots'))}));
const heldSpacing=190/Math.max(1,heldItems.length-1),bundleSpacing=196/flow.bundles.length,bundleWidth=bundleSpacing-8;
const heldDots=heldItems.map((item,i)=>({id:item.id,index:i,bundle:flow.bundles.findIndex(b=>b.category===item.category),el:svg('circle',{cx:611+i*heldSpacing,cy:326,r:4,fill:'#c6a0f0'},$('trafficHeldDots'))}));
const bundleSlots=flow.bundles.map((b,i)=>{
 const x=608+i*bundleSpacing,y=311,g=svg('g',{},$('trafficBundleSlots'));
 const box=svg('rect',{x,y,width:bundleWidth,height:24,rx:6,class:'bundle-box'},g);
 const count=svg('text',{x:x+bundleWidth/2,y:y+17,class:'bundle-count'},g);count.textContent=b.ids.length;
 const title=svg('title',{},g);title.textContent=`${b.category}: ${b.ids.join(', ')}`;
 const p=svg('path',{d:`M${x+bundleWidth/2} ${y+12} C866 323 865 305 1022 312`,fill:'none',stroke:'none'},$('trafficMovingBundles'));
 const moving=svg('g',{},$('trafficMovingBundles'));
 svg('rect',{x:-14,y:-11,width:28,height:22,rx:6,fill:'#decaef',stroke:'#f4eaff'},moving);
 const label=svg('text',{x:0,y:5,'text-anchor':'middle',class:'human-ink',style:'font-size:12px;font-weight:700'},moving);label.textContent=b.ids.length;
 return {category:b.category,g,box,moving,path:p,length:p.getTotalLength()};
});
const text=(id,value)=>{const el=$(id),s=String(value);if(el.textContent!==s)el.textContent=s;};
const fill=(s,vars)=>s.replace(/\{(\w+)\}/g,(_,key)=>String(vars[key]));
const totals={all:flow.items.length,auto:data.night.auto,deny:data.night.deny,held:heldItems.length,bundles:flow.bundles.length};
const selected=()=>flow.caps.find(c=>c.cap===cap);
function scene(){return Math.max(0,STARTS.findLastIndex(start=>time>=start));}
function position(p,progress){
 if(progress<0||progress>1)return null;
 if(progress<=.30)return {path:incoming[p.agent],fraction:progress/.30,kind:''};
 if(progress<.36)return null;
 if(progress<=.43)return {path:outgoing.screened,fraction:(progress-.36)/.07,kind:p.screening==='clean'?'screened':'deny'};
 if(progress<.51)return null;
 if(!p.modelChoice)return {path:outgoing[p.verdict],fraction:(progress-.51)/.49,kind:p.verdict};
 if(progress<=.65)return {path:outgoing.jev,fraction:(progress-.51)/.14,kind:'jev'};
 if(progress<.77)return null;
 return {path:outgoing[p.modelChoice],fraction:(progress-.77)/.23,kind:p.verdict};
}
function draw(){
 const completed=new Set(packets.filter(p=>time>=p.start+p.duration).map(p=>p.id));
 const counts={auto:0,human:0,deny:0};let arrived=0,screeningActive=false,jevActive=false;
 packets.forEach(p=>{
  if(time>=p.start)arrived++;if(completed.has(p.id))counts[p.verdict]++;
  const progress=(time-p.start)/p.duration;
  if(progress>=.30&&progress<=.43)screeningActive=true;
  if(p.modelChoice&&progress>=.51&&progress<=.77)jevActive=true;
  p.trails.forEach((el,j)=>{
   const pos=position(p,(time-p.start-j*.07)/p.duration);
   el.style.display=pos?'':'none';if(!pos)return;
   const pt=pos.path.path.getPointAtLength(pos.path.length*Math.max(0,Math.min(1,pos.fraction)));
   el.setAttribute('cx',pt.x);el.setAttribute('cy',pt.y);el.setAttribute('class','packet '+pos.kind);
  });
 });
 $('trafficScreenNode').classList.toggle('lit',screeningActive);$('trafficJevNode').classList.toggle('lit',jevActive);
 text('trafficArrived',arrived);text('trafficAuto',counts.auto);text('trafficDeny',counts.deny);text('trafficHeld',counts.human);
 for(const dot of [...autoDots,...denyDots,...heldDots])dot.el.style.opacity=completed.has(dot.id)?'1':'.12';
 const groupProgress=Math.max(0,Math.min(1,(time-27)/1.5)),ease=groupProgress*groupProgress*(3-2*groupProgress);
 for(const dot of heldDots){dot.el.setAttribute('cx',(611+dot.index*heldSpacing)*(1-ease)+(608+bundleWidth/2+dot.bundle*bundleSpacing)*ease);dot.el.setAttribute('cy',326-3*ease);}
 $('trafficHeldDots').style.opacity=String(1-Math.max(0,Math.min(1,(time-28.5)/.7)));
 const q=selected();let delivered=0;
 bundleSlots.forEach((b,i)=>{
  const rank=q.surfaced.indexOf(b.category),chosen=rank>=0,start=30+rank*.65,p=(time-start)/2.8;
  b.box.classList.toggle('selected',chosen);
  b.moving.style.display=chosen&&p>=0&&p<1?'':'none';
  if(chosen&&p>=0&&p<1){const pt=b.path.getPointAtLength(b.length*p);b.moving.setAttribute('transform',`translate(${pt.x} ${pt.y})`);}
  if(chosen&&p>=1)delivered++;
  b.g.style.opacity=String(Math.max(0,Math.min(1,(time-28.5)/.8))*(chosen&&p>=1?.25:1));
 });
 text('trafficHuman',delivered);text('trafficGateCount',cap);
 $('trafficTime').value=String(time);text('trafficClock',`${Math.floor(time).toString().padStart(2,'0')} / ${DURATION} s`);
 const s=scene();if(s!==lastScene){lastScene=s;caption();}
}
function caption(){
 const t=COPY[lang],s=scene(),q=selected();
 text('trafficTitle',fill(t.captions[s][0],totals));text('trafficCaption',fill(t.captions[s][1],{cap:q.surfaced.length,deferred:q.deferred.length}));
 root.querySelectorAll('[data-traffic-step]').forEach(b=>{if(Number(b.dataset.trafficStep)===s)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
}
function ai(){
 const t=COPY[lang],d=flow.ai[aiChoice],ask=aiChoice==='ask';
 text('trafficAiTitle',ask?t.aiHuman:t.aiDeny);text('trafficAiCode',`verdict: ${d.verdict}`);text('trafficAiCap',ask?t.aiCap:'—');
 text('trafficAiVerdict',ask?t.aiAskReason:t.aiDropReason);$('trafficAiResult').classList.toggle('ai-denied',!ask);
 root.querySelectorAll('[data-ai-choice]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.aiChoice===aiChoice));b.setAttribute('aria-label',b.dataset.aiChoice==='ask'?t.aiAsk:t.aiDrop);});
}
function labels(){
 const t=COPY[lang];root.querySelectorAll('[data-traffic]').forEach(e=>e.textContent=t[e.dataset.traffic]);
 root.querySelectorAll('[data-traffic-html]').forEach(e=>e.innerHTML=t[e.dataset.trafficHtml]);
 text('trafficLang',lang==='ja'?'EN':'日本語');text('trafficFocus',focused?t.close:t.open);
 $('trafficLang').setAttribute('aria-label',lang==='ja'?'Switch to English':'日本語に切り替える');
 $('trafficTime').setAttribute('aria-label',t.timeline);
 $('trafficModes').setAttribute('aria-label',t.viewLabel);
 ['Auto','Deny','Human'].forEach((s,i)=>text('trafficLegend'+s,t.legend[i]));
 text('trafficTotals',fill(t.totals,totals));text('trafficSvgDesc',fill(t.graphDesc,totals));
 $('trafficSteps').innerHTML=t.steps.map((s,i)=>`<button type="button" data-traffic-step="${i}">0${i+1} / ${s}</button>`).join('');
 root.querySelectorAll('[data-traffic-step]').forEach(b=>b.onclick=()=>seek(STARTS[Number(b.dataset.trafficStep)]));
 if(focused)$('trafficPlayer').setAttribute('aria-label',t.graphTitle);
 text('trafficRecord',JSON.stringify({simulation:true,executable:false,seed:data.seed,source:data.generatedFrom,...flow},null,2));
 caption();playLabel();ai();
}
function playLabel(){text('trafficPlay',motion.matches?COPY[lang].result:playing?COPY[lang].pause:time>=DURATION?COPY[lang].restart:COPY[lang].play);}
function pause(){playing=false;cancelAnimationFrame(frame);playLabel();}
function tick(now){
 if(!playing)return;time=Math.min(DURATION,time+Math.min((now-lastFrame)/1000,.1));lastFrame=now;draw();
 if(time>=DURATION){if($('trafficLoop').checked){time=0;draw();}else{pause();return;}}
 frame=requestAnimationFrame(tick);
}
function play(){
 hasInteracted=true;if(mode!=='flow')return;if(motion.matches){seek(DURATION);return;}
 document.dispatchEvent(new CustomEvent('launch-playback',{detail:'traffic'}));
 if(time>=DURATION)time=0;playing=true;lastFrame=performance.now();playLabel();cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);
}
function seek(value){hasInteracted=true;pause();time=value;draw();caption();playLabel();}
function setFocus(on){
 focused=on;const player=$('trafficPlayer');player.classList.toggle('is-focused',on);document.body.classList.toggle('traffic-presenting',on);$('trafficFocus').setAttribute('aria-expanded',String(on));
 if(on){previousFocus=document.activeElement;player.setAttribute('role','dialog');player.setAttribute('aria-modal','true');player.setAttribute('aria-label',COPY[lang].graphTitle);}
 else{player.removeAttribute('role');player.removeAttribute('aria-modal');player.removeAttribute('aria-label');}
 text('trafficFocus',on?COPY[lang].close:COPY[lang].open);
 (on?$('trafficFocus'):previousFocus??$('trafficFocus')).focus({preventScroll:true});
}
function setCap(value){cap=value;$('trafficCap').value=String(value);caption();draw();document.dispatchEvent(new CustomEvent('launch-cap',{detail:cap}));}
function setMode(next){
 mode=next;pause();$('trafficFlowPanel').hidden=mode!=='flow';$('trafficExamplesPanel').hidden=mode!=='examples';
 root.querySelectorAll('[data-traffic-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.trafficMode===mode)));
 try{const url=new URL(location.href);url.searchParams.set('view',mode);history.replaceState(null,'',url);}catch{}
}
root.querySelectorAll('[data-traffic-mode]').forEach(b=>b.onclick=()=>{hasInteracted=true;setMode(b.dataset.trafficMode);});
function followCap(){setCap(Number($('cap').value));}
$('trafficPlay').onclick=()=>{hasInteracted=true;if(playing)pause();else play();};
$('trafficResult').onclick=()=>seek(DURATION);
$('trafficTime').oninput=e=>seek(Number(e.target.value));
$('trafficCap').onchange=e=>{setCap(Number(e.target.value));$('cap').value=String(cap);$('cap').dispatchEvent(new Event('input'));};
$('cap').addEventListener('input',followCap);
$('trafficFocus').onclick=()=>setFocus(!focused);
$('trafficLang').onclick=()=>document.querySelector(`[data-lang="${lang==='ja'?'en':'ja'}"]`).click();
root.querySelectorAll('[data-ai-choice]').forEach(b=>b.onclick=()=>{aiChoice=b.dataset.aiChoice;ai();});
document.addEventListener('launch-language',e=>{lang=e.detail;labels();});
document.addEventListener('launch-playback',e=>{if(e.detail!=='traffic')pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
motion.addEventListener('change',()=>{pause();if(motion.matches)seek(DURATION);});
document.addEventListener('keydown',e=>{
 if(!focused)return;if(e.key==='Escape'){e.preventDefault();setFocus(false);return;}
 if(e.key==='Tab'){
  const items=[...$('trafficPlayer').querySelectorAll('button:not([disabled]),input,select,[tabindex="0"],summary')].filter(el=>el.getClientRects().length&&!el.closest('[hidden]')),first=items[0],last=items.at(-1);
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 }
});
// One automatic preview when the visible flow enters the viewport; explicit controls take over.
const observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting&&mode==='flow'&&!hasInteracted&&!document.hidden&&!motion.matches)play();else if(!e.isIntersecting&&!focused)pause();}},{threshold:.25});
observer.observe($('trafficPlayer'));
document.querySelectorAll('a[href="#traffic"]').forEach(a=>a.addEventListener('click',()=>{setMode('flow');if(!playing)play();}));
labels();draw();setMode(mode);
})();
