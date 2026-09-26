/* Optional layer over the original SVG. Its 50 request paths and clock remain unchanged. */
(()=>{
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const player=$('trafficPlayer'),map=player.querySelector('svg'),boundary=map.querySelector('.product-boundary'),background=map.querySelector('rect');
const COPY={
 ja:{
  mode:'＋ 支払いまで見る',note:'同じ図に支払いを重ねた版 · 緑は本人への資金、紫は別の手数料署名。',
  ready:'支払いの実行条件',readySub:'方針内、または本人が回答・同意',readyWait:'通知しただけでは、まだ送らない',
  readyYes:'この1件：World確認＋回答済み（例）',readyZero:'通知上限0：本人の回答待ちのまま',
  fee:'YOHAKUの処理料 f',feeWait:'判定件数への別料金 · 署名は任意',feeHeld:'別署名を保持 · 回収は未実装',
  feeValue:'例：0.000001 test USDC · 回収 0',
  wallet:'依頼したエージェントの財布',signer:'本人向けPと、処理料fを別に署名',
  person:'回答した本人の財布',personWait:'この例の受取額：0 test USDC',personPaid:'この例の受取額：0.00012 test USDC',
  price:'本人へ P = 0.00012 test USDC',direct:'x402 · 直接送金 · YOHAKUは預からない',
  facilitator:'Facilitatorが検証・送信',signature:'本人向けP / 別の処理料f',signatureNotCash:'2つの別署名 · 署名 ≠ 送金',
  quote:'50件の振り分けの後、1件の支払い例を重ねます。',
  paidTitle:'本人へ直接。YOHAKUの処理料は、別に。',
  paidBody:'World確認と回答が済んだ1件の例。本人はPを全額受け取り、YOHAKUは別の任意手数料fを記録します。署名の保持まで実装済み、回収は未実装です。',
  zeroTitle:'通知上限が0なら、この回答例は進めない。',
  zeroBody:'本人に届けなかった依頼を、回答済みとして扱いません。本人への送金例は0のまま。判定の仕事への別手数料と、本人の報酬は別です。',
  foot:'50件の判定結果は元の再生データのまま。追加部分は任意の1件の説明で、承認・送金・手数料回収を実行しません。手数料台帳は通常の /requests にあり、スマホ /experience には未接続です。',
  overview:'図全体を見る',follow:'動きに合わせる',jump:'支払いの仕組みを詳しく見る ↓',chapter:'支払いの場面へ',desc:'下段に1件の支払い例を追加。条件成立後、エージェントから本人へ直接USDC。YOHAKUには別の任意手数料署名を保持。手数料回収は未実装。',
 },
 en:{
  mode:'+ Follow the payment',note:'Payment overlay · Green is money to the person; purple is a separate fee authorization.',
  ready:'Conditions for payment',readySub:'Within policy, or a person answers / consents',readyWait:'A notification is not permission to pay',
  readyYes:'This example: World check + answer',readyZero:'Cap 0: still waiting for the person',
  fee:'YOHAKU handling fee f',feeWait:'Priced per decision · optional signature',feeHeld:'Separate signature retained · not collected',
  feeValue:'Example: 0.000001 test USDC · collected 0',
  wallet:'Requesting agent’s wallet',signer:'Sign reward P and handling fee f separately',
  person:'Responding person’s wallet',personWait:'Illustrated receipt: 0 test USDC',personPaid:'Illustrated receipt: 0.00012 test USDC',
  price:'Person gets P = 0.00012 test USDC',direct:'x402 · direct payment · no YOHAKU custody',
  facilitator:'Facilitator verifies and broadcasts',signature:'Two separate authorizations',signatureNotCash:'Signature ≠ transfer',
  quote:'After the 50 requests, follow one illustrative payment.',
  paidTitle:'Pay the person directly. Price the handling separately.',
  paidBody:'One illustrative request after a World check and an answer. The person keeps all of P; YOHAKU records a separate optional fee f. Signature retention is implemented; fee collection is not.',
  zeroTitle:'A cap of zero cannot produce a human answer here.',
  zeroBody:'A request that was not surfaced is not treated as answered. This payment illustration stays at zero. Accounting for a decision is separate from rewarding the person.',
  foot:'The original 50 routing outcomes are unchanged. The added example executes no approval, payment or fee collection. Fee accounting belongs to /requests; it is not wired into the mobile /experience demo.',
  overview:'Show whole diagram',follow:'Follow the action',jump:'Explore the payment mechanics ↓',chapter:'Jump to payment',desc:'One payment example below. Once conditions are met, USDC moves directly from agent to person. A separate optional YOHAKU fee signature is retained; fee collection is not implemented.',
 }
};
let lang=document.documentElement.lang==='en'?'en':'ja',enabled=false,frame=0,visible=true,lastKey='',overview=false;
const button=document.createElement('button');button.type='button';button.id='trafficMoneyToggle';button.setAttribute('aria-pressed','false');button.setAttribute('aria-controls','trafficFlowPanel');$('trafficModes').append(button);
const hint=document.createElement('div');hint.className='traffic-money-hint';hint.hidden=true;
hint.innerHTML='<span id="trafficMoneyNote"></span><div><button type="button" id="trafficMoneyOverview" aria-pressed="false"></button> <button type="button" id="trafficMoneyChapter"></button></div>';
$('trafficModes').after(hint);
const extra=document.createElementNS(NS,'g');extra.id='trafficMoneyLayer';extra.style.display='none';
extra.innerHTML=`
 <defs><marker id="trafficMoneyArrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0L5 2.5L0 5Z" fill="#dcf58e"/></marker></defs>
 <path class="money-condition" d="M934 355H900V568H498"/>
 <path class="money-condition" d="M818 114H886V520H386V535"/>
 <rect id="trafficMoneyReady" class="node" x="273" y="535" width="255" height="75" rx="15"/>
 <text x="291" y="558" class="heavy" data-money="ready"></text>
 <text x="291" y="580" class="tiny" data-money="readySub"></text>
 <text x="291" y="598" class="tiny" id="trafficMoneyReadyState"></text>
 <rect id="trafficMoneyFee" class="node" x="590" y="535" width="293" height="75" rx="15"/>
 <text x="608" y="558" class="heavy" data-money="fee"></text>
 <text x="608" y="580" class="tiny" id="trafficMoneyFeeState"></text>
 <text x="608" y="598" class="tiny" data-money="feeValue"></text>
 <path d="M400 610V644H568V683" class="money-condition"/>
 <rect x="418" y="635" width="300" height="26" rx="13" class="node"/>
 <text x="568" y="653" class="tiny" text-anchor="middle" data-money="facilitator"></text>
 <path id="trafficMoneyCashPath" d="M217 703H930" class="money-cash" marker-end="url(#trafficMoneyArrow)"/>
 <text x="570" y="690" class="money-price" text-anchor="middle" data-money="price"></text>
 <text x="570" y="731" class="tiny" text-anchor="middle" data-money="direct"></text>
 <path id="trafficMoneyFeePath" d="M116 646V574H273" class="money-fee-path"/>
 <path id="trafficMoneyRetainPath" d="M116 646V520H737V535" class="money-fee-path"/>
 <text x="30" y="553" class="tiny" data-money="signature"></text>
 <text x="30" y="572" class="tiny" data-money="signatureNotCash"></text>
 <rect class="node money-wallet" x="16" y="646" width="201" height="107" rx="18"/>
 <text x="30" y="673" class="money-wallet-title" data-money="wallet"></text>
 <text x="30" y="699" class="tiny">P + f</text>
 <text x="30" y="729" class="money-wallet-note" data-money="signer"></text>
 <rect id="trafficMoneyPerson" class="node money-wallet" x="934" y="646" width="219" height="107" rx="18"/>
 <text x="950" y="673" class="money-wallet-title" data-money="person"></text>
 <text x="950" y="704" class="money-wallet-note" id="trafficMoneyReceipt"></text>
 <text x="950" y="729" class="tiny">P</text>
 <g id="trafficMoneyCashPacket" aria-hidden="true"><circle r="6" fill="#dcf58e"/><circle cx="-14" r="4" fill="#dcf58e" opacity=".55"/><circle cx="-24" r="2.5" fill="#dcf58e" opacity=".25"/></g>
 <g id="trafficMoneySignPacket" aria-hidden="true"><rect x="-6" y="-8" width="12" height="16" rx="3" fill="#d9baff"/><path d="M-3 -2H3M-3 3H3" stroke="#624579" stroke-width="1.5"/></g>
 <g id="trafficMoneyRetainPacket" aria-hidden="true"><rect x="-6" y="-8" width="12" height="16" rx="3" fill="#d9baff"/><path d="M-3 -2H3M-3 3H3" stroke="#624579" stroke-width="1.5"/></g>`;
map.append(extra);
const foot=document.createElement('p');foot.className='traffic-note traffic-money-foot';foot.hidden=true;$('trafficFlowPanel').append(foot);
const text=(id,s)=>{if($(id).textContent!==s)$(id).textContent=s;};
const paths=Object.fromEntries(['Cash','Fee','Retain'].map(n=>{const p=$('trafficMoney'+n+'Path');return[n,{p,length:p.getTotalLength()}];}));
function move(id,path,p,on=true){
 const packet=$(id);packet.style.display=on&&p>=0&&p<1?'':'none';if(!on||p<0||p>=1)return;
 const pt=paths[path].p.getPointAtLength(paths[path].length*p);packet.setAttribute('transform',`translate(${pt.x} ${pt.y})`);
}
function render(){
 if(!enabled)return;const time=Number($('trafficTime').value),cap=Number($('trafficCap').value),t=COPY[lang],canAnswer=cap>0,paid=canAnswer&&time>=37.5,retained=time>=39.8;
 const pan=Math.max(0,Math.min(1,(time-33.5)/1.5)),y=260*pan*pan*(3-2*pan);
 map.style.setProperty('--traffic-aspect',overview?String(1170/775):String(1170/515));
 map.setAttribute('viewBox',overview?'0 0 1170 775':`0 ${y.toFixed(2)} 1170 515`);
 move('trafficMoneySignPacket','Fee',(time-33.5)/1.5,canAnswer);
 move('trafficMoneyCashPacket','Cash',(time-35)/2.5,canAnswer);
 move('trafficMoneyRetainPacket','Retain',(time-37.8)/2);
 $('trafficMoneyCashPath').style.opacity=canAnswer&&time>=35?'1':'.2';
 $('trafficMoneyReady').classList.toggle('money-ready',canAnswer&&time>=35);
 $('trafficMoneyPerson').classList.toggle('money-ready',paid);
 $('trafficMoneyFee').classList.toggle('money-retained',retained);
 text('trafficMoneyReceipt',paid?t.personPaid:t.personWait);
 text('trafficMoneyReadyState',!canAnswer?t.readyZero:time>=35?t.readyYes:t.readyWait);
 text('trafficMoneyFeeState',retained?t.feeHeld:t.feeWait);
 const key=[time>=33.5,canAnswer,lang].join();
 if(key!==lastKey){lastKey=key;if(time>=33.5){text('trafficTitle',canAnswer?t.paidTitle:t.zeroTitle);text('trafficCaption',canAnswer?t.paidBody:t.zeroBody);}
 else{
  // Return to the original chapter copy without changing its timer or particles.
  const s=[0,3,20.2,27,30].findLastIndex(v=>time>=v),flow=window.YOHAKU_REPLAY.traffic,q=flow.caps.find(c=>c.cap===cap);
  const vars={held:flow.items.filter(i=>i.verdict==='human').length,bundles:flow.bundles.length,cap:q.surfaced.length,deferred:q.deferred.length};
  const fill=s=>s.replace(/\{(\w+)\}/g,(_,k)=>vars[k]);
  text('trafficTitle',fill(window.TRAFFIC_COPY[lang].captions[s][0]));text('trafficCaption',fill(window.TRAFFIC_COPY[lang].captions[s][1]));
 }}
}
function tick(){render();if(enabled&&visible&&!document.hidden)frame=requestAnimationFrame(tick);}
function start(){cancelAnimationFrame(frame);if(enabled&&visible&&!document.hidden)frame=requestAnimationFrame(tick);}
function labels(){
 const t=COPY[lang];button.textContent=t.mode;text('trafficMoneyNote',t.note);text('trafficMoneyChapter',t.chapter);text('trafficMoneyOverview',overview?t.follow:t.overview);foot.textContent=t.foot;
 extra.querySelectorAll('[data-money]').forEach(e=>e.textContent=t[e.dataset.money]);
 const items=window.YOHAKU_REPLAY.traffic.items,values={auto:items.filter(i=>i.verdict==='auto').length,deny:items.filter(i=>i.verdict==='deny').length,held:items.filter(i=>i.verdict==='human').length,bundles:window.YOHAKU_REPLAY.traffic.bundles.length};
 $('trafficSvgDesc').textContent=window.TRAFFIC_COPY[lang].graphDesc.replace(/\{(\w+)\}/g,(_,k)=>values[k])+(enabled?' '+t.desc:'');
 lastKey='';render();
}
function setEnabled(on){
 enabled=on;button.setAttribute('aria-pressed',String(on));player.classList.toggle('traffic-with-money',on);hint.hidden=!on;foot.hidden=!on;extra.style.display=on?'':'none';
 map.setAttribute('viewBox',on?'0 0 1170 775':'0 0 1170 515');boundary.setAttribute('height',on?'618':'498');background.setAttribute('height',on?'775':'515');
 if(on)document.querySelector('[data-traffic-mode="flow"]').setAttribute('aria-pressed','false');
 else $('trafficTime').dispatchEvent(new Event('input'));
 try{const url=new URL(location.href);if(on)url.searchParams.set('money','1');else url.searchParams.delete('money');history.replaceState(null,'',url);}catch{}
 labels();start();
}
button.onclick=()=>{document.querySelector('[data-traffic-mode="flow"]').click();setEnabled(true);};
document.querySelectorAll('[data-traffic-mode]').forEach(b=>b.addEventListener('click',()=>setEnabled(false)));
$('trafficMoneyChapter').onclick=()=>{$('trafficTime').value='35';$('trafficTime').dispatchEvent(new Event('input'));lastKey='';render();};
$('trafficMoneyOverview').onclick=()=>{overview=!overview;$('trafficMoneyOverview').setAttribute('aria-pressed',String(overview));labels();};
$('trafficTime').addEventListener('input',()=>{lastKey='';render();});
$('trafficResult').addEventListener('click',()=>{lastKey='';render();});
document.addEventListener('launch-language',e=>{lang=e.detail;labels();});
document.addEventListener('launch-cap',()=>{lastKey='';render();});
document.addEventListener('visibilitychange',start);
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;start();},{threshold:0}).observe(player);
labels();if(new URLSearchParams(location.search).get('money')==='1'){document.querySelector('[data-traffic-mode="flow"]').click();setEnabled(true);}
})();
