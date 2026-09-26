/* Offline, core-generated explanation. No wallet, provider or network calls. */
(()=>{
const data=window.YOHAKU_REPLAY,flow=data.traffic,COPY=window.TRAFFIC_COPY;
const root=document.createElement('section');
root.id='traffic';root.className='section wrap traffic-section';
root.innerHTML=`
 <div class="section-head"><span class="eyebrow">02 / MANY AGENTS. ONE HUMAN.</span><h2 data-traffic-html="title"></h2><p data-traffic="intro"></p></div>
 <div class="traffic-player" id="trafficPlayer">
  <div class="traffic-top"><span class="badge" data-traffic="badge"></span><div><button id="trafficLang" type="button">EN</button> <button id="trafficFocus" type="button" aria-expanded="false" data-traffic="open"></button></div></div>
  <div class="traffic-caption" aria-live="polite" aria-atomic="true"><h3 id="trafficTitle"></h3><p id="trafficCaption"></p></div>
  <div class="traffic-map" tabindex="0" role="region" aria-labelledby="trafficSvgTitle">
   <svg viewBox="0 0 1170 515" role="img" aria-labelledby="trafficSvgTitle trafficSvgDesc">
    <title id="trafficSvgTitle" data-traffic="graphTitle"></title><desc id="trafficSvgDesc" data-traffic="graphDesc"></desc>
    <defs><pattern id="trafficDots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#52465e"/></pattern></defs>
    <rect x="0" y="0" width="1170" height="515" fill="url(#trafficDots)" opacity=".4"/>
    <g aria-hidden="true" id="trafficInputRails"></g>
    <path id="trafficPath-auto" class="rail auto-rail" d="M498 296 C550 296 532 120 590 120"/>
    <path id="trafficPath-human" class="rail held-rail" d="M498 296 C539 296 550 326 604 326"/>
    <path id="trafficPath-deny" class="rail deny-rail" d="M498 296 C550 296 537 439 590 439"/>
    <path class="rail held-rail muted-rail" d="M818 323 C875 323 864 283 933 283"/>
    <rect class="node" x="16" y="65" width="182" height="355" rx="18"/>
    <text x="35" y="94" data-traffic="incoming"></text>
    <g aria-hidden="true" id="trafficAgents"></g>
    <text x="30" y="447" class="small" data-traffic="source"></text>
    <text x="30" y="479" class="number" id="trafficArrived">0</text>
    <text x="90" y="476" class="small">/ ${flow.items.length}</text>
    <rect class="engine" x="273" y="192" width="225" height="168" rx="20"/>
    <text x="294" y="220" class="engine-small" data-traffic="engine"></text>
    <text x="293" y="253" class="heavy engine-ink" style="font-size:30px">Yohaku</text>
    <text x="294" y="280" class="engine-small" data-traffic="enforced"></text>
    <text x="294" y="311" class="engine-small" data-traffic="checks"></text>
    <text x="294" y="340" class="engine-small">auto | human | deny</text>
    <rect class="node" x="590" y="63" width="228" height="105" rx="16"/>
    <text x="608" y="94" data-traffic="auto"></text>
    <text x="798" y="102" class="number" style="fill:#dcf58e" text-anchor="end" id="trafficAuto">0</text>
    <text x="608" y="124" class="tiny" data-traffic="autoSub"></text>
    <g id="trafficAutoDots" aria-hidden="true"></g>
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
    <text x="865" y="473" class="tiny" data-traffic="wait"></text>
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
  <div class="traffic-timeline"><input id="trafficTime" type="range" min="0" max="36" step=".1" value="0"><output id="trafficClock" for="trafficTime"></output></div>
  <div class="traffic-steps" id="trafficSteps"></div><p class="traffic-note" data-traffic="capNote"></p>
 </div>
 <div class="traffic-after"><p data-traffic="foot"></p><a href="#journey" data-traffic="detail"></a></div>
 <div class="ai-boundary"><span class="eyebrow">JEV / BOUNDED DECISION SUPPORT</span><h3 data-traffic="aiTitle"></h3><p data-traffic="aiIntro"></p>
  <div class="ai-track"><div class="ai-card"><small data-traffic="aiRule"></small><strong data-traffic="aiInput"></strong><code>verdict: human</code></div><div class="ai-arrow" aria-hidden="true">→</div><div class="ai-card"><small data-traffic="aiOutput"></small><div class="ai-choices"><button type="button" data-ai-choice="ask">ask</button><button type="button" data-ai-choice="drop">drop</button></div><small data-traffic="aiNoAuto"></small></div><div class="ai-arrow" aria-hidden="true">→</div><div class="ai-card ai-result" id="trafficAiResult"><strong id="trafficAiTitle"></strong><code id="trafficAiCode"></code><p id="trafficAiCap"></p></div></div>
  <div class="ai-verdict" id="trafficAiVerdict" aria-live="polite"></div><p class="micro" data-traffic="aiNote"></p>
 </div>
 <details class="traffic-record"><summary data-traffic="record"></summary><p data-traffic="recordIntro"></p><pre id="trafficRecord"></pre></details>`;
document.getElementById('journey').before(root);

const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg',DURATION=36,STARTS=[0,3,24,28];
const motion=matchMedia('(prefers-reduced-motion: reduce)');
let lang=document.documentElement.lang==='en'?'en':'ja',time=motion.matches?DURATION:0,playing=false,frame=0,lastFrame=0;
let cap=2,focused=false,hasInteracted=false,aiChoice='ask',lastScene=-1,previousFocus=null;
const svg=(tag,attrs,parent)=>{const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));parent.append(el);return el;};
const incoming=flow.agents.map((agent,i)=>{
 const y=135+i*40;
 const p=svg('path',{d:`M166 ${y} C227 ${y} 219 296 273 296`,class:'rail'},$('trafficInputRails'));
 svg('rect',{x:35,y:y-12,width:26,height:26,rx:8,class:'source-ring'},$('trafficAgents'));
 svg('circle',{cx:43,cy:y,r:2,class:'agent-eye'},$('trafficAgents'));svg('circle',{cx:53,cy:y,r:2,class:'agent-eye'},$('trafficAgents'));
 const text=svg('text',{x:72,y:y+4,class:'agent-name'},$('trafficAgents'));text.textContent=agent.split('.')[0];
 const title=svg('title',{},text);title.textContent=agent;
 return {path:p,length:p.getTotalLength()};
});
const outgoing=Object.fromEntries(['auto','human','deny'].map(v=>{const p=$('trafficPath-'+v);return [v,{path:p,length:p.getTotalLength()}];}));
const packets=flow.items.map((item,i)=>({
 ...item,start:.65+i*(18.36/Math.max(1,flow.items.length-1)),duration:4.8,
 trails:[0,1,2,3].map(j=>svg('circle',{r:j===0?4:3-j*.5,opacity:1-j*.22},$('trafficPackets')))
}));
const heldItems=flow.items.filter(i=>i.verdict==='human');
const autoDots=flow.items.filter(i=>i.verdict==='auto').map((item,i)=>({id:item.id,el:svg('circle',{cx:609+(i%16)*12,cy:144+Math.floor(i/16)*9,r:2.2,fill:'#dcf58e'},$('trafficAutoDots'))}));
const denyDots=flow.items.filter(i=>i.verdict==='deny').map((item,i)=>({id:item.id,el:svg('circle',{cx:609+i*16,cy:472,r:2.5,fill:'#f1a7b8'},$('trafficDenyDots'))}));
const heldDots=heldItems.map((item,i)=>({id:item.id,index:i,bundle:flow.bundles.findIndex(b=>b.category===item.category),el:svg('circle',{cx:611+i*26,cy:326,r:4,fill:'#c6a0f0'},$('trafficHeldDots'))}));
const bundleSlots=flow.bundles.map((b,i)=>{
 const x=608+i*49,y=311,g=svg('g',{},$('trafficBundleSlots'));
 const box=svg('rect',{x,y,width:37,height:24,rx:6,class:'bundle-box'},g);
 const count=svg('text',{x:x+18.5,y:y+17,class:'bundle-count'},g);count.textContent=b.ids.length;
 const title=svg('title',{},g);title.textContent=`${b.category}: ${b.ids.join(', ')}`;
 const p=svg('path',{d:`M${x+18.5} ${y+12} C866 323 865 305 1022 312`,fill:'none',stroke:'none'},$('trafficMovingBundles'));
 const moving=svg('g',{},$('trafficMovingBundles'));
 svg('rect',{x:-14,y:-11,width:28,height:22,rx:6,fill:'#decaef',stroke:'#f4eaff'},moving);
 const label=svg('text',{x:0,y:5,'text-anchor':'middle',class:'human-ink',style:'font-size:12px;font-weight:700'},moving);label.textContent=b.ids.length;
 return {category:b.category,g,box,moving,path:p,length:p.getTotalLength()};
});
const text=(id,value)=>{const el=$(id),s=String(value);if(el.textContent!==s)el.textContent=s;};
const fill=(s,vars)=>s.replace(/\{(\w+)\}/g,(_,key)=>String(vars[key]));
const totals={all:flow.items.length,auto:data.night.auto,deny:data.night.deny,held:heldItems.length,bundles:flow.bundles.length};
const selected=()=>flow.caps.find(c=>c.cap===cap);
function scene(){return time<3?0:time<24?1:time<28?2:3;}
function draw(){
 const completed=new Set(packets.filter(p=>time>=p.start+p.duration).map(p=>p.id));
 const counts={auto:0,human:0,deny:0};let arrived=0;
 packets.forEach(p=>{
  if(time>=p.start)arrived++;if(completed.has(p.id))counts[p.verdict]++;
  p.trails.forEach((el,j)=>{
   const progress=(time-p.start-j*.07)/p.duration;
   const visible=progress>=0&&progress<=1&&!(progress>.48&&progress<.61);
   el.style.display=visible?'':'none';if(!visible)return;
   const before=progress<=.48,path=before?incoming[p.agent]:outgoing[p.verdict];
   const f=before?progress/.48:(progress-.61)/.39,pt=path.path.getPointAtLength(path.length*Math.max(0,Math.min(1,f)));
   el.setAttribute('cx',pt.x);el.setAttribute('cy',pt.y);el.setAttribute('class','packet'+(before?'':' '+p.verdict));
  });
 });
 text('trafficArrived',arrived);text('trafficAuto',counts.auto);text('trafficDeny',counts.deny);text('trafficHeld',counts.human);
 for(const dot of [...autoDots,...denyDots,...heldDots])dot.el.style.opacity=completed.has(dot.id)?'1':'.12';
 const groupProgress=Math.max(0,Math.min(1,(time-24)/1.5)),ease=groupProgress*groupProgress*(3-2*groupProgress);
 for(const dot of heldDots){dot.el.setAttribute('cx',(611+dot.index*26)*(1-ease)+(626.5+dot.bundle*49)*ease);dot.el.setAttribute('cy',326-3*ease);}
 $('trafficHeldDots').style.opacity=String(1-Math.max(0,Math.min(1,(time-25.5)/.7)));
 const q=selected();let delivered=0;
 bundleSlots.forEach((b,i)=>{
  const rank=q.surfaced.indexOf(b.category),chosen=rank>=0,start=28+rank*.65,p=(time-start)/2.8;
  b.box.classList.toggle('selected',chosen);
  b.moving.style.display=chosen&&p>=0&&p<1?'':'none';
  if(chosen&&p>=0&&p<1){const pt=b.path.getPointAtLength(b.length*p);b.moving.setAttribute('transform',`translate(${pt.x} ${pt.y})`);}
  if(chosen&&p>=1)delivered++;
  b.g.style.opacity=String(Math.max(0,Math.min(1,(time-25.5)/.8))*(chosen&&p>=1?.25:1));
 });
 text('trafficHuman',delivered);text('trafficGateCount',cap);
 $('trafficTime').value=String(time);text('trafficClock',`${Math.floor(time).toString().padStart(2,'0')} / 36 s`);
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
 hasInteracted=true;if(motion.matches){seek(DURATION);return;}
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
function setCap(value){cap=value;$('trafficCap').value=String(value);caption();draw();}
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
  const items=[...$('trafficPlayer').querySelectorAll('button:not([disabled]),input,select,[tabindex="0"]')],first=items[0],last=items.at(-1);
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 }
});
// One automatic preview when the visible flow enters the viewport; explicit controls take over.
const observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting&&!hasInteracted&&!document.hidden&&!motion.matches)play();else if(!e.isIntersecting&&!focused)pause();}},{threshold:.25});
observer.observe($('trafficPlayer'));
document.querySelectorAll('a[href="#traffic"]').forEach(a=>a.addEventListener('click',()=>{if(!playing)play();}));
labels();draw();
})();
