/* Offline explanation only. No signer, payment payload, backend call or fee collection. */
(()=>{
const COPY={
 ja:{
  title:'報酬は、本人へ。<br><em>判断の対価は、別に。</em>',
  intro:'エージェントから人へ、x402で直接支払う。YOHAKUは人の報酬を預からず、依頼を捌く仕事を収益にする。',
  badge:'説明再生 · 実送金なし',jump:'次は、お金の流れ →',focus:'大きく見る',close:'戻る',play:'支払いの流れを再生',pause:'一時停止',restart:'最初から再生',result:'結論を見る',timeline:'支払いの説明の再生位置',
  auto:'任せられる依頼',human:'人の回答が必要',deny:'断る依頼',optional:'別の手数料認可を付ける例',scenarios:'依頼の種類',
  graphTitle:'本人への直接送金と、YOHAKUへの別の手数料認可',
  graphDesc:'緑の資金はエージェントのウォレットから本人へ直接移る。YOHAKUは署名と判定を扱い、facilitatorが実行する。紫の別署名は手数料台帳へ。点線の回収は未実装。',
  agent:'エージェントの財布',signer:'独立したウォレット／署名者',offer:'提示額の例 P = 0.00012 test USDC',person:'本人の財布',direct:'x402 · exact · 本人あて',humanAmount:'この説明での受取額',
  auth:'本人あての署名認可',notMoney:'署名 ≠ 送金',facilitator:'検証・チェーンへ送信・ガス負担',execute:'決済の実行',inside:'YOHAKU · 判断と手数料の台帳',gate:'支払う条件を満たしたか？',gateAuto:'方針内の委任 → 個別の追加承認なし',gateHuman:'必要な本人確認＋回答・同意を確認',gateDeny:'審査・方針で拒否 → 本人への送金なし',
  feeAuth:'別の任意署名',ledger:'手数料台帳',recorded:'判定1件を記録',unrecorded:'判定待ち',retained:'署名を検証・保持',unsigned:'署名なし／任意',future:'将来の回収先',futureLabel:'まとめ回収 · 未実装',futureAmount:'回収額は 0',feePrice:'例 f = 0.000001 test USDC',
  legendMoney:'本人への資金移動',legendAuth:'署名認可・実行指示',legendFuture:'将来設計・未実装',pan:'図は横にスクロールできます。',
  sellerMetric:'本人への支払いの例',sellerSub:'約束したPをそのまま受け取る',feeMetric:'別の手数料署名の例',feeSub:'保持した認可。入金ではない',collectedMetric:'YOHAKUの手数料回収',collectedSub:'未実装。再生しても送金しない',
  steps:['価格を提示','署名だけ渡す','支払う条件','本人へ送金','別の手数料','将来の回収'],
  captions:[
   ['依頼と一緒に、価格を提示する。','これは1件の説明です。上の50件すべてに送金する表示ではありません。本人への報酬Pと、別の手数料fを分けます。'],
   ['エージェントは、本人あてに署名する。','USDCの宛先・金額・期限を固定した認可を渡します。この時点では資金は動かず、本人の報酬をYOHAKUに預けません。'],
   ['YOHAKUが、支払う条件を確認する。','本人の判断が必要な依頼は、確認と回答を待つ。任せられる依頼は許可範囲で進める。審査や方針が拒否したら、本人への送金は進めません。'],
   ['本人へ、x402で直接届く。','facilitatorが認可を検証して送信し、USDCはエージェントの財布から本人の財布へ。YOHAKUの財布は、この資金の経路に入りません。'],
   ['YOHAKUは、判断の仕事を別に記録する。','エージェントが任意で付けた、YOHAKUあての別署名を検証・保持。本人の報酬Pから差し引きません。現在は回収せず、署名なしでも本体の処理は変えません。'],
   ['小さな手数料を、あとでまとめる構想。','将来は小額の手数料をまとめて回収する設計です。現在の別exact署名を、そのままbatch-settlementと呼ぶことはできません。回収経路の実装が必要です。']
  ],
  deniedTitle:'断った依頼では、本人へ送らない。',deniedBody:'本人への報酬は0。断った判定も、依頼を捌いた仕事として台帳には1件を記録します。別の手数料署名は任意で、回収は未実装です。',
  boundary:'仕組みの説明です。本人への支払いは既存x402経路、手数料台帳は通常の /requests 経路。新しいスマホデモ /experience は手数料台帳を呼びません。金額は説明用の例で、料金表・実売上ではありません。',
  businessTitle:'売るのは、<br>「依頼を捌く仕事」。',businessBody:'本人の報酬が高いほど儲かる形にすると、高額な依頼をわざと人に上げる動機が生まれる。YOHAKUは判定件数に対して、薄く別払いにする設計です。',
  formula:'本人の報酬 P ＋ 別の処理料 f',formulaNote:'人の取り分はPのまま。fの回収は将来の実装。',
  stateTitle:'どこまで動いている？',stateLines:['本人あてのexact送金：既存のテストネット実証あり','通常依頼の手数料台帳・任意署名の保持：実装済み','手数料の回収・batch-settlement：未実装'],
  why:'なぜ、本人の支払いと分けるのか',whyBody:'今回のUSDC／EIP-3009 exact署名は、受取先と金額を固定します。同じ署名で途中からマージンを引くことはできません。x402全体が手数料を禁止しているという意味ではなく、本人への直接送金を守るためにYOHAKUが選んだ設計です。',
  batchBody:'batch-settlementの共通仕様は、認可を蓄積して後から決済する考え方を定義します。具体的な資金の裏付け・署名・期限・回収はネットワーク別の方式が必要です。今ある署名の保持は、資金の確保や回収の成功を保証しません。',
  businessLink:'Kouのビジネスモデルを見る ↗',sourceLink:'仕様と実装の根拠 ↗',back:'50件の振り分けへ戻る ↑'
 },
 en:{
  title:'The person gets paid.<br><em>The decision is priced separately.</em>',
  intro:'Agents pay people directly over x402. YOHAKU earns from handling requests, without holding the person’s reward.',
  badge:'EXPLANATION · NO TRANSFERS',jump:'Next: follow the money →',focus:'Present',close:'Close',play:'Play the payment flow',pause:'Pause',restart:'Replay from start',result:'Show the result',timeline:'Payment explanation timeline',
  auto:'Delegated request',human:'Needs a human answer',deny:'Refused request',optional:'Include a separate optional fee signature',scenarios:'Request scenario',
  graphTitle:'Direct payment to the person and a separate fee authorization for YOHAKU',
  graphDesc:'Green funds move directly from agent wallet to person. YOHAKU handles authorization and decisions; the facilitator executes. A separate purple signature goes to the fee ledger. Dashed collection is not implemented.',
  agent:'Agent wallet',signer:'Separate wallet / secure signer',offer:'Example P = 0.00012 test USDC',person:'Person’s wallet',direct:'x402 · exact · to the person',humanAmount:'Receipt in this illustration',
  auth:'Authorization for the person',notMoney:'Signature ≠ transfer',facilitator:'Verifies · broadcasts · pays gas',execute:'Executes settlement',inside:'YOHAKU · DECISIONS AND FEE ACCOUNTING',gate:'Are payment conditions met?',gateAuto:'Within the grant → no extra approval',gateHuman:'Required proof, answer and consent',gateDeny:'Risk / policy refusal → no seller payment',
  feeAuth:'Separate optional signature',ledger:'Fee ledger',recorded:'One decision recorded',unrecorded:'Awaiting decision',retained:'Signature checked and retained',unsigned:'Unsigned / optional',future:'Future fee recipient',futureLabel:'Batch collection · NOT BUILT',futureAmount:'Collected: 0',feePrice:'Example f = 0.000001 test USDC',
  legendMoney:'Funds to the person',legendAuth:'Authorization / execution instruction',legendFuture:'Proposed, not implemented',pan:'Scroll horizontally to explore the diagram.',
  sellerMetric:'Illustrated payment to person',sellerSub:'Receives the full agreed price P',feeMetric:'Separate fee authorization',feeSub:'Retained signature, not received money',collectedMetric:'YOHAKU fees collected',collectedSub:'Not implemented. Playback sends nothing.',
  steps:['Offer a price','Authorize','Check conditions','Pay the person','Separate fee','Future collection'],
  captions:[
   ['An agent offers a price with its request.','This illustrates one request, not fifty payments from the animation above. The person’s reward P is separate from the handling fee f.'],
   ['The agent authorizes payment to the person.','The USDC recipient, value and expiry are signed. No funds move yet, and the person’s reward is not deposited with YOHAKU.'],
   ['YOHAKU checks whether payment should proceed.','A personal decision waits for verification and an answer. A delegated request stays inside its grant. Risk or policy refusal stops payment to the person.'],
   ['x402 pays the person directly.','The facilitator verifies and broadcasts. USDC moves from the agent wallet to the person’s wallet. YOHAKU’s wallet is not on that path.'],
   ['YOHAKU records its work separately.','The agent can provide a separate optional signature for YOHAKU’s fee. It is checked and retained, never deducted from P. Collection is disabled; omitting it does not change the main request.'],
   ['Small fees could be collected together, later.','Batch collection is the proposed next step. Today’s separate exact signatures are not batch-settlement. The redemption mechanism still needs to be implemented.']
  ],
  deniedTitle:'Refusal means no payment to the person.',deniedBody:'The person receives zero. The refusal still records one handled decision. A separate fee signature is optional; collection remains unimplemented.',
  boundary:'An explanation of the design. Existing x402 rails pay the person; fee accounting belongs to /requests. The new mobile /experience demo does not invoke that ledger. Amounts are examples, not pricing or revenue.',
  businessTitle:'The product is<br>handling the request.',businessBody:'A percentage of the reward would make expensive interruptions profitable. YOHAKU instead proposes a small, separate price per decision handled.',
  formula:'Person’s reward P + handling fee f',formulaNote:'The person keeps P. Collecting f is future work.',
  stateTitle:'What actually exists?',stateLines:['Exact payments to the person: existing testnet evidence','Request fee ledger and optional signature retention: implemented','Fee redemption and batch-settlement: not implemented'],
  why:'Why separate the two payments?',whyBody:'This USDC / EIP-3009 exact authorization fixes the recipient and value. Its signature cannot be reused to skim a margin on the way. This is not a ban on fees across x402: it is YOHAKU’s design choice to preserve direct payment to the person.',
  batchBody:'The common batch-settlement specification describes retaining commitments and settling later. Backing, signature format, expiry and redemption depend on a network-specific binding. Retaining a signature today neither reserves funds nor guarantees collection.',
  businessLink:'Kou’s business model ↗',sourceLink:'Protocol and implementation sources ↗',back:'Back to the 50-request flow ↑'
 }
};
const root=document.createElement('section');root.id='payments';root.className='section wrap payments-section';
root.innerHTML=`
 <div class="section-head"><span class="eyebrow">FOLLOW THE MONEY / x402</span><h2 data-pay-html="title"></h2><p data-pay="intro"></p></div>
 <div class="pay-player" id="payPlayer">
  <div class="pay-top"><span class="badge" data-pay="badge"></span><div><button id="payLang" type="button"></button> <button id="payFocus" type="button" aria-expanded="false"></button></div></div>
  <div class="pay-options" id="payOptions" role="group"><button data-pay-scenario="auto" type="button" data-pay="auto"></button><button data-pay-scenario="human" type="button" data-pay="human"></button><button data-pay-scenario="deny" type="button" data-pay="deny"></button><label><input id="payFee" type="checkbox" checked><span data-pay="optional"></span></label></div>
  <div class="pay-caption" aria-live="polite" aria-atomic="true"><h3 id="payTitle"></h3><p id="payCaption"></p></div>
  <div class="pay-controls"><div><button id="payPlay" type="button"></button> <button id="payResult" type="button" data-pay="result"></button></div><output id="payClock" for="payTime"></output></div>
  <input id="payTime" class="pay-timeline" type="range" min="0" max="30" step=".1" value="0">
  <div class="pay-map" tabindex="0" role="region" aria-labelledby="paySvgTitle"><svg viewBox="0 0 1120 565" role="img" aria-labelledby="paySvgTitle paySvgDesc">
   <title id="paySvgTitle" data-pay="graphTitle"></title><desc id="paySvgDesc" data-pay="graphDesc"></desc>
   <defs><marker id="payArrowMoney" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#dcf58e"/></marker><marker id="payArrowAuth" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#baa0d8"/></marker></defs>
   <path id="payMoneyPath" class="pay-money-rail" d="M260 118H850" marker-end="url(#payArrowMoney)"/>
   <text x="560" y="87" text-anchor="middle" data-pay="direct"></text>
   <path id="payAuthPath" class="pay-auth-rail" d="M150 185V354H326" marker-end="url(#payArrowAuth)"/>
   <text x="166" y="238" class="pay-tiny" data-pay="auth"></text><text x="166" y="258" class="pay-tiny" data-pay="notMoney"></text>
   <path id="payFeePath" class="pay-auth-rail" d="M105 185V480H326" marker-end="url(#payArrowAuth)"/>
   <text x="122" y="431" class="pay-tiny" data-pay="feeAuth"></text><text x="122" y="452" class="pay-tiny" data-pay="notMoney"></text>
   <path class="pay-auth-rail" d="M560 310V258" marker-end="url(#payArrowAuth)"/>
   <path class="pay-auth-rail" d="M560 176V132" marker-end="url(#payArrowAuth)"/>
   <text x="576" y="163" class="pay-tiny" data-pay="execute"></text>
   <rect x="20" y="55" width="240" height="130" rx="20" class="pay-node"/>
   <text x="40" y="86" class="pay-label" data-pay="agent"></text><text x="40" y="109" class="pay-tiny" data-pay="signer"></text>
   <text x="40" y="150" class="pay-tiny" data-pay="offer"></text>
   <rect id="payPersonNode" x="860" y="55" width="240" height="130" rx="20" class="pay-node"/>
   <text x="880" y="86" class="pay-label" data-pay="person"></text><text x="880" y="110" class="pay-tiny" data-pay="humanAmount"></text>
   <text id="payPersonValue" x="880" y="153" class="pay-amount">0</text><text x="1069" y="174" text-anchor="end" class="pay-tiny">test USDC</text>
   <rect id="payFacilitatorNode" x="417" y="176" width="286" height="82" rx="16" class="pay-node"/>
   <text x="438" y="208" class="pay-label">Facilitator</text><text x="438" y="236" class="pay-tiny" data-pay="facilitator"></text>
   <rect x="305" y="282" width="510" height="265" rx="22" class="pay-product"/>
   <text x="330" y="302" class="pay-tiny" data-pay="inside"></text>
   <rect id="payGateNode" x="330" y="318" width="460" height="81" rx="16" class="pay-core"/>
   <text x="350" y="350" class="pay-label pay-core-ink" data-pay="gate"></text><text id="payGateText" x="350" y="378" class="pay-tiny pay-core-ink"></text>
   <rect id="payLedgerNode" x="330" y="438" width="460" height="85" rx="16" class="pay-node"/>
   <text x="350" y="466" class="pay-label" data-pay="ledger"></text><text id="payLedgerStatus" x="350" y="490" class="pay-tiny"></text><text x="350" y="511" class="pay-tiny" data-pay="feePrice"></text>
   <path d="M790 480H858" class="pay-future-rail"/>
   <rect x="865" y="438" width="235" height="85" rx="16" class="pay-proposed"/>
   <text x="880" y="466" class="pay-future" data-pay="future"></text><text x="880" y="489" class="pay-tiny pay-future" data-pay="futureLabel"></text><text x="880" y="512" class="pay-tiny pay-future" data-pay="futureAmount"></text>
   <g id="payMoneyPacket" aria-hidden="true"><circle r="8" fill="#dcf58e"/><circle cx="-15" r="5" fill="#dcf58e" opacity=".5"/><circle cx="-27" r="3" fill="#dcf58e" opacity=".2"/></g>
   <g id="payAuthPacket" aria-hidden="true"><rect x="-7" y="-9" width="14" height="18" rx="3" fill="#d9baff"/><path d="M-3 -3H3M-3 2H3" stroke="#694f83" stroke-width="2"/></g>
   <g id="payFeePacket" aria-hidden="true"><rect x="-7" y="-9" width="14" height="18" rx="3" fill="#d9baff"/><path d="M-3 -3H3M-3 2H3" stroke="#694f83" stroke-width="2"/></g>
  </svg></div>
  <p class="pay-pan" data-pay="pan"></p>
  <div class="pay-legend"><span><i></i><b data-pay="legendMoney"></b></span><span><i></i><b data-pay="legendAuth"></b></span><span><i></i><b data-pay="legendFuture"></b></span></div>
  <div class="pay-metrics"><article><small data-pay="sellerMetric"></small><strong id="payReward">0</strong><p data-pay="sellerSub"></p></article><article><small data-pay="feeMetric"></small><strong id="payAuthorized">0</strong><p data-pay="feeSub"></p></article><article><small data-pay="collectedMetric"></small><strong>0 test USDC</strong><p data-pay="collectedSub"></p></article></div>
  <div class="pay-steps" id="paySteps"></div><p class="pay-boundary" data-pay="boundary"></p>
 </div>
 <div class="pay-business"><article><span class="eyebrow">BUSINESS MODEL</span><h3 data-pay-html="businessTitle"></h3><p data-pay="businessBody"></p><div class="pay-formula" data-pay="formula"></div><p data-pay="formulaNote"></p></article><article><span class="eyebrow">IMPLEMENTATION</span><h3 data-pay="stateTitle"></h3><ul id="payStateLines"></ul></article></div>
 <details class="pay-details"><summary data-pay="why"></summary><p data-pay="whyBody"></p><p data-pay="batchBody"></p></details>
 <div class="pay-links"><a href="business.html" data-pay="businessLink"></a><a href="knowledge/X402-PAYMENT-FLOW.md" data-pay="sourceLink"></a><a href="#traffic" data-pay="back"></a></div>`;
document.getElementById('traffic').after(root);
const jump=document.createElement('a');jump.href='#payments';jump.className='pay-jump';document.querySelector('.traffic-after').append(jump);
const $=id=>document.getElementById(id),STARTS=[0,4,8,13,19,25],DURATION=30;
const motion=matchMedia('(prefers-reduced-motion: reduce)');
let lang=document.documentElement.lang==='en'?'en':'ja',scenario='human',fee=true,time=motion.matches?DURATION:0,playing=false,frame=0,last=0,lastScene=-1,focused=false,previousFocus=null;
const paths=Object.fromEntries(['Money','Auth','Fee'].map(n=>{const path=$('pay'+n+'Path');return [n,{path,length:path.getTotalLength()}];}));
const text=(id,value)=>{const e=$(id);if(e.textContent!==String(value))e.textContent=String(value);};
const scene=()=>Math.max(0,STARTS.findLastIndex(n=>time>=n));
function move(name,progress,enabled=true){
 const packet=$('pay'+name+'Packet');packet.style.display=enabled&&progress>=0&&progress<1?'':'none';
 if(progress<0||progress>=1||!enabled)return;
 const p=paths[name].path.getPointAtLength(paths[name].length*progress);packet.setAttribute('transform',`translate(${p.x} ${p.y})`);
}
function playLabel(){text('payPlay',motion.matches?COPY[lang].result:playing?COPY[lang].pause:time>=DURATION?COPY[lang].restart:COPY[lang].play);}
function caption(){
 const t=COPY[lang],s=scene(),deny=scenario==='deny'&&s===3,c=deny?[t.deniedTitle,t.deniedBody]:t.captions[s];
 text('payTitle',c[0]);text('payCaption',c[1]);
 root.querySelectorAll('[data-pay-step]').forEach(b=>{if(Number(b.dataset.payStep)===s)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
}
function draw(){
 const t=COPY[lang],paid=time>=17.5&&scenario!=='deny',authorized=time>=23&&fee;
 move('Money',(time-13.5)/4,scenario!=='deny');move('Auth',(time-4)/3.5);move('Fee',(time-19.5)/3.5,fee);
 $('payMoneyPath').style.opacity=scenario==='deny'?'.15':time>=13? '1':'.3';
 $('payPersonNode').classList.toggle('pay-lit',paid);$('payFacilitatorNode').classList.toggle('pay-lit',scenario!=='deny'&&time>=13&&time<18);
 $('payGateNode').classList.toggle('pay-gate-active',scenario!=='deny'&&time>=8);
 $('payGateNode').classList.toggle('pay-gate-denied',scenario==='deny'&&time>=8);
 $('payLedgerNode').classList.toggle('pay-fee-lit',authorized);
 text('payGateText',t[scenario==='auto'?'gateAuto':scenario==='human'?'gateHuman':'gateDeny']);
 text('payLedgerStatus',time<12?t.unrecorded:authorized?t.retained:!fee?t.unsigned:t.recorded);
 text('payPersonValue',paid?'0.00012':'0');text('payReward',(paid?'0.00012':'0')+' test USDC');text('payAuthorized',(authorized?'0.000001':'0')+' test USDC');
 $('payTime').value=String(time);text('payClock',`${Math.floor(time).toString().padStart(2,'0')} / ${DURATION} s`);
 if(lastScene!==scene()){lastScene=scene();caption();}
}
function labels(){
 const t=COPY[lang];root.querySelectorAll('[data-pay]').forEach(e=>e.textContent=t[e.dataset.pay]);root.querySelectorAll('[data-pay-html]').forEach(e=>e.innerHTML=t[e.dataset.payHtml]);
 text('payLang',lang==='ja'?'EN':'日本語');$('payLang').setAttribute('aria-label',lang==='ja'?'Switch to English':'日本語に切り替える');text('payFocus',focused?t.close:t.focus);jump.textContent=t.jump;
 $('payOptions').setAttribute('aria-label',t.scenarios);$('payTime').setAttribute('aria-label',t.timeline);
 root.querySelectorAll('[data-pay-scenario]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.payScenario===scenario)));
 $('paySteps').innerHTML=t.steps.map((label,i)=>`<button type="button" data-pay-step="${i}">0${i+1} / ${label}</button>`).join('');
 root.querySelectorAll('[data-pay-step]').forEach(b=>b.onclick=()=>seek(STARTS[Number(b.dataset.payStep)]));
 $('payStateLines').innerHTML=t.stateLines.map(line=>`<li>${line}</li>`).join('');
 if(focused)$('payPlayer').setAttribute('aria-label',t.graphTitle);
 caption();draw();playLabel();
}
function pause(){playing=false;cancelAnimationFrame(frame);playLabel();}
function seek(value){pause();time=value;draw();caption();playLabel();}
function tick(now){
 if(!playing)return;time=Math.min(DURATION,time+Math.min((now-last)/1000,.1));last=now;draw();
 if(time>=DURATION){pause();return;}frame=requestAnimationFrame(tick);
}
function play(){
 if(motion.matches){seek(DURATION);return;}document.dispatchEvent(new CustomEvent('launch-playback',{detail:'payments'}));
 if(time>=DURATION)time=0;playing=true;last=performance.now();playLabel();cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);
}
function setFocus(on){
 focused=on;const player=$('payPlayer');player.classList.toggle('is-focused',on);document.body.classList.toggle('payments-presenting',on);$('payFocus').setAttribute('aria-expanded',String(on));
 if(on){previousFocus=document.activeElement;player.setAttribute('role','dialog');player.setAttribute('aria-modal','true');player.setAttribute('aria-label',COPY[lang].graphTitle);}
 else{player.removeAttribute('role');player.removeAttribute('aria-modal');player.removeAttribute('aria-label');}
 text('payFocus',on?COPY[lang].close:COPY[lang].focus);(on?$('payFocus'):previousFocus??$('payFocus')).focus({preventScroll:true});
}
root.querySelectorAll('[data-pay-scenario]').forEach(b=>b.onclick=()=>{scenario=b.dataset.payScenario;pause();labels();});
$('payFee').onchange=e=>{fee=e.target.checked;draw();};$('payPlay').onclick=()=>playing?pause():play();$('payResult').onclick=()=>seek(DURATION);$('payTime').oninput=e=>seek(Number(e.target.value));$('payFocus').onclick=()=>setFocus(!focused);
$('payLang').onclick=()=>document.querySelector(`[data-lang="${lang==='ja'?'en':'ja'}"]`).click();
document.addEventListener('launch-language',e=>{lang=e.detail;labels();});
document.addEventListener('launch-playback',e=>{if(e.detail!=='payments')pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
motion.addEventListener('change',()=>{pause();if(motion.matches)seek(DURATION);});
document.addEventListener('keydown',e=>{
 if(!focused)return;if(e.key==='Escape'){e.preventDefault();setFocus(false);return;}
 if(e.key==='Tab'){const items=[...$('payPlayer').querySelectorAll('button,input,[tabindex="0"]')].filter(e=>e.getClientRects().length),first=items[0],last=items.at(-1);
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
});
new IntersectionObserver(entries=>{if(!entries[0].isIntersecting&&!focused)pause();},{threshold:.1}).observe($('payPlayer'));
labels();draw();
})();
