import { IDKit, orbLegacy } from '@worldcoin/idkit-core';
import QRCode from 'qrcode';
const COPY = {
  ja: {
    title:'機会は、届き続ける。<br><em>あなたには、余白を。</em>',
    intro:'エージェントがあなたに質問し、報酬を提示する。YOHAKUが選別し、あなたの判断が必要なものだけを残します。',
    stages:['依頼が届く','Worldでログイン','委任分の報酬','回答して受け取る'],
    startTitle:'あなたのデモを始める', startNote:'このブラウザ専用に50件の依頼を生成します。受取先はこの体験中は変更できません。ウォレット接続やガス代は不要です。',
    receiver:'テスト報酬の受取アドレス', start:'50件の依頼を受け取る',consent:'例の方針と、公開済みのサンプル回答を使うデモに参加します。実送金対象は委任分1件と本人回答分1件。金額は認証前に表示され、送金は自分のボタン操作で始まります。',
    flowTitle:'依頼を、仕組みで選ぶ。',flowNote:'エージェントの発生はエミュレーション。色と件数はサーバーの実判定です。',auto:'任せる',human:'人に聞く',deny:'断る',autoShort:'方針の範囲内',humanShort:'未承認のまま保留',denyShort:'本人へ届けない',flowActual:'許可された件数 ≠ 入金した件数',
    continue:'処理を続ける', loginTitle:'あなたの受信箱を開く。',loginBody:'World IDで人間であることを確認し、表示した委任分1件のテスト報酬を受け取って、ダッシュボードへ進みます。本人回答分は、後で自分が回答したときだけ送金します。',
    login:'Worldでログインして委任分を受け取る',openWorld:'World Appを開く',scan:'World AppでQRをスキャンしてください。対応するOrb資格が必要です。',cancel:'認証を取り消す',loginLimit:'このデモ専用の15分間のアクセスです。ENSの所有者権限や、他の参加者へのアクセスは付与しません。',
    fundingNote:'上記はテストトークンです。50件すべてへの送金ではありません。価格条件のJPYC表示はデモの見積単位で、着金トークン量とは別です。',
    welcome:'ようこそ。すべてを見る必要はありません。',verified:'World ID · 人間性を確認済み',received:'実際に受け取った合計',receivedNote:'x402の成功結果がある分だけを集計。',autoReward:'委任で受け取った報酬',autoRewardNote:'方針内のサンプル回答への対価。',answerReward:'自分の回答で受け取った報酬',answerRewardNote:'回答後、決済に成功した分のみ。',
    delegatedTitle:'任せた分にも、対価が届く。',delegatedBody:'既知の相手・許可カテゴリ・金額上限内。追加回答なしで共有できるサンプルに、エージェントが支払います。',
    sampleLabel:'公開サンプル / あなた個人の回答ではありません',sample:'一人で使うには包装が大きすぎたので、買うのをやめました。',
    collect:'委任分のテスト報酬を受け取る',questionsTitle:'この判断は、あなたへ。',capNote:'通知上限は{cap}束。この体験では枠を固定し、回答しても次々に補充しません。資金付きの1件を実際に回答できます。',
    receiptTitle:'入金まで、見える。',inboxTitle:'依頼元へ、回答が届く。',inboxNote:'この体験のエミュレートされたエージェント用受信箱。サーバーに保存された受渡し結果です。',
    routingTitle:'なぜ、この行き先になった？',koeTitle:'エージェントは、どこで人を見つける？',koeBody:'Koeは人を発見するための名簿デモ。この体験の質問は生成されたもので、Koe参加者へ送ってはいません。名簿を見て、このタブの体験へ戻れます。',koe:'Koeを見に行く ↗',
    boundary:'エージェントの需要は生成データ、判断は実コア。外部サービスの使用状況は画面に表示します。報酬は設定されたテストネットの実送金で、実売上ではありません。セッションは30分で失効します。回答はこのデモ内だけで使われます。Worldは回答の真偽や受取ウォレットの所有を証明しません。',
    technical:'技術的な記録を見る',all:'すべて',details:'理由',hide:'閉じる',processing:'サーバーが実際の審査・ルールを処理しています…',complete:'50件の判断が完了しました。Worldで本人の画面へ進めます。',checking:'Worldの証明をサーバーで検証しています…',preparing:'World認証を準備しています…',cancelled:'認証を取り消しました。アクセスや送金は行いません。',waiting:'World Appでの操作を待っています。',
    paying:'支払い元を再審査 → 認可を署名・検証 → x402で決済中。結果が出るまで再送しません。',paid:'報酬を受け取り、回答をエージェントの受信箱へ届けました。',failure:'入金を確認できませんでした。受取額に加算せず、回答も届けていません。追加送金を避けるため自動再試行しません。',unpaid:'まだ入金はありません。',ready:'送金対象 · 未入金',notFunded:'この依頼には送金資金を設定していません',settled:'入金確認済み',failed:'入金未確認',busyPayment:'決済処理中',refused:'辞退済み · 送金なし',answer:'回答を書いてください（3〜1,000文字）',answerConsent:'この回答を、支払い成功後にこのデモのエージェントへ共有します。',submit:'回答してテスト報酬を受け取る',decline:'今回は答えない',noQuestion:'この体験で回答できる依頼はありません。判断一覧で理由を確認できます。',noDelivery:'支払いが成功すると、ここに回答が届きます。',delivered:'回答受取済み',chain:'取引をエクスプローラーで確認 ↗',live:'実API',mock:'モック',unconfigured:'未設定',fixed:'固定ルール',atomic:'最小単位',quote:'今回の送金対象',noFunding:'このサーバーに送金資金が設定されていません。入金は発生しません。',count:'件',screen:'資金審査',model:'分類補助',rule:'ルール',sessionExpired:'セッションが期限切れです。ページを再読込してください。',networkError:'接続を確認できませんでした。再読込でサーバーの現在の結果を確認できます。送金は自動再試行しません。',
    loginOnly:'Worldでログイン（送金なし）',loginUnfunded:'この環境は送金未設定です。Worldでこのブラウザのダッシュボードへログインできますが、報酬は発生しません。',more:'残りの依頼も表示',fewer:'6件だけ表示',
    questions:{'experience/why-you-put-it-back':'買いかけた商品を、買わずに戻した理由は？','experience/the-time-it-failed-you':'期待していたのに、うまく使えなかった体験を教えてください。','experience/why-you-stopped':'その商品やサービスを使うのをやめた理由は？','corpus/your-own-words':'自分で書いた文章を、学習用途で提供できますか？','experience/what-changed-your-mind':'考えが変わったきっかけを教えてください。','contact/where-you-live':'自宅の住所を教えてください。'},
  },
  en: {
    title:'Opportunities keep coming.<br><em>Keep your space.</em>',intro:'Agents ask for your experience and offer to pay. YOHAKU filters the demand and keeps only the decisions that need you.',
    stages:['Requests arrive','World sign-in','Delegated reward','Answer & receive'],
    startTitle:'Start your own demo',startNote:'Generate 50 requests for this browser. The recipient is fixed for this run. No wallet connection or gas is needed.',receiver:'Your test reward address',start:'Receive 50 requests',consent:'Use the example policy and public sample answer. One delegated request and one personal answer can receive test payments. Amounts appear before sign-in. Only my button actions start payments.',
    flowTitle:'Let the rules sort it out.',flowNote:'Agent arrivals are emulated. Colors and counts come from actual server decisions.',auto:'Delegate',human:'Ask a person',deny:'Refuse',autoShort:'Inside policy',humanShort:'Held, not approved',denyShort:'Does not reach you',flowActual:'Permitted requests ≠ completed payments',
    continue:'Continue processing',loginTitle:'Open your own inbox.',loginBody:'Verify personhood with World ID, collect the displayed delegated test reward, and enter your dashboard. The personal-answer reward is paid only when you later submit your answer.',
    login:'Sign in with World & collect delegated reward',openWorld:'Open World App',scan:'Scan with World App. A compatible Orb credential is required.',cancel:'Cancel verification',loginLimit:'15-minute access to this demo only. No ENS owner authority or access to another participant.',
    fundingNote:'These are test tokens. We do not pay all 50 requests. JPYC prices are demo quote units, separate from the token amounts transferred.',
    welcome:'Welcome. You do not need to review everything.',verified:'World ID · Personhood verified',received:'Total actually received',receivedNote:'Only successful x402 results count.',autoReward:'Received through delegation',autoRewardNote:'Payment for the allowed sample answer.',answerReward:'Received for your answer',answerRewardNote:'Only after an answer and successful payment.',
    delegatedTitle:'Delegated work can earn, too.',delegatedBody:'Known buyer. Allowed topic. Within the amount limit. An agent pays for the sample you already allowed to be shared.',
    sampleLabel:'PUBLIC SAMPLE / NOT YOUR PERSONAL ANSWER',sample:'I put it back because the packaging was too large for one person.',
    collect:'Collect delegated test reward',questionsTitle:'This decision is yours.',capNote:'Your cap is {cap} bundles. This run keeps those slots fixed rather than refilling them after every answer. One funded request can be answered for a test payment.',
    receiptTitle:'See the money arrive.',inboxTitle:'The agent gets the answer.',inboxNote:'The emulated buyer’s inbox for this run. These delivery records are stored by the server.',
    routingTitle:'Why did it go there?',koeTitle:'Where do agents discover people?',koeBody:'Koe demonstrates discovery. This run generates its own requests; it does not message people listed in Koe. Explore the directory and return to this tab.',koe:'Explore Koe ↗',
    boundary:'Agent demand is generated; decisions use the real core. Provider status is shown. Configured testnet transfers are real, not revenue. Sessions expire after 30 minutes. Answers are used only within this demo. World does not prove answer truth or ownership of the receiving wallet.',
    technical:'Inspect technical records',all:'All',details:'Reason',hide:'Close',processing:'The server is running screening and policy checks…',complete:'All 50 decisions are ready. Use World to enter your dashboard.',checking:'Verifying the World proof on the server…',preparing:'Preparing World verification…',cancelled:'Verification cancelled. No access or payment granted.',waiting:'Waiting for your action in World App.',
    paying:'Re-screening payer → signing and checking authorization → settling over x402. No duplicate send while waiting.',paid:'Payment received. The answer has reached the agent inbox.',failure:'Payment was not confirmed. No reward counted or answer delivered. We do not retry automatically after an uncertain transfer.',unpaid:'No payment received yet.',ready:'Funded · not paid yet',notFunded:'This request is not funded in the demo',settled:'Payment confirmed',failed:'Payment unconfirmed',busyPayment:'Settlement in progress',refused:'Declined · no payment',answer:'Write your answer (3–1,000 characters)',answerConsent:'Share this answer with the demo agent only after its payment succeeds.',submit:'Answer and receive test reward',decline:'Not this time',noQuestion:'No answer is available in this run. Inspect the routing reasons below.',noDelivery:'A successful payment delivers the answer here.',delivered:'Answer received',chain:'View transaction in explorer ↗',live:'Live API',mock:'Mocked',unconfigured:'Not configured',fixed:'Fixed rules',atomic:'atomic units',quote:'Funded in this run',noFunding:'This server has no configured demo funding. No payment will occur.',count:'requests',screen:'Screening',model:'Decision support',rule:'Rule',sessionExpired:'This session expired. Reload the page.',networkError:'Connection unavailable. Reload to read the current server result. Payments are never retried automatically.',
    loginOnly:'Sign in with World (no payment)',loginUnfunded:'Payment is not configured here. You can use World to enter this browser’s dashboard, but no reward will be transferred.',more:'Show remaining requests',fewer:'Show only six',
    questions:{} as Record<string,string>,
  },
};
type Copy = typeof COPY.en;
interface Quote { amount:string; asset:string; network:string; payTo:string; extra?:Record<string,unknown> }
interface Item {id:string;who:string;category:string;question:string;kind:string;decision:{verdict:string;rule:number;reason:string}|null;screening:string|null;screeningReason?:string;model?:string;payment:{status:string;requirement?:Quote;transaction?:string;error?:string};resolved?:string;delivered?:string;explorer?:string}
interface State {id?:string;receiver?:string;processed:number;total:number;complete:boolean;authenticated:boolean;items:Item[];surfaced:string[];policy:{cap:number};wired:{screening:boolean;classifier:boolean;classifierProvider?:string;payment:boolean};totals:{amount:string;automated:string;answered:string;asset:string;network:string}[];tokenDisplay:{asset:string;network:string;symbol:string;decimals:number};koe:string}
const $ = (id:string) => document.getElementById(id)!;
const esc = (v:unknown) => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
let lang:'ja'|'en'=new URL(location.href).searchParams.get('lang')==='en'?'en':'ja';
let state:State|undefined,busy=false,generation=0,attempt:string|undefined,filter='all',shown=0,draft='',expanded=false;
const t=()=>COPY[lang] as Copy;
const msg=(text:string,error=false)=>{ $('message').hidden=!text;$('message').textContent=text;$('message').classList.toggle('error',error); };
async function post(path:string,body:Record<string,unknown>={}) {
 const r=await fetch('/experience/'+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({run:state?.id,...body})});
 const data=await r.json(); if(!r.ok)throw new Error(data.error??'operation_refused');return data;
}
function money(q:{amount:string;asset:string;network:string}|undefined) {
 if(!q)return '—'; const d=state?.tokenDisplay;
 if(d&&q.asset.toLowerCase()===d.asset.toLowerCase()&&q.network===d.network){
  const s=q.amount.padStart(d.decimals+1,'0');return `${s.slice(0,-d.decimals)}.${s.slice(-d.decimals).replace(/0+$/,'')||'0'} ${d.symbol}`;
 }
 return `${q.amount} ${t().atomic}`;
}
function total(key:'amount'|'automated'|'answered'){return state?.totals.length?state.totals.map(q=>money({...q,amount:q[key]})).join(' + '):'0';}
const question=(i:Item)=>t().questions[i.category]??i.question;
const status=(i:Item)=>i.resolved==='declined'?t().refused:({ready:t().ready,settled:t().settled,failed:t().failed,processing:t().busyPayment,'not-funded':t().notFunded}[i.payment.status]??i.payment.status);
function labels(){
 document.documentElement.lang=lang;
 document.querySelectorAll<HTMLElement>('[data-t]').forEach(e=>e.textContent=String(t()[e.dataset.t as keyof Copy]));
 document.querySelectorAll<HTMLElement>('[data-html]').forEach(e=>e.innerHTML=String(t()[e.dataset.html as keyof Copy]));
 $('language').textContent=lang==='ja'?'EN':'日本語';
 try{const u=new URL(location.href);u.searchParams.set('lang',lang);history.replaceState(null,'',u);}catch{}
}
function render(){
 labels();
 const step=!state?.complete?0:!state.authenticated?1:state.items.some(i=>i.delivered&&i.decision?.verdict==='human')?4:state.items.some(i=>i.payment.status==='settled')?3:2;
 $('stages').innerHTML=t().stages.map((s,i)=>`<li class="${i===step?'active':i<step?'done':''}">${String(i+1).padStart(2,'0')} / ${s}</li>`).join('');
 if(state?.koe)for(const id of ['koeTop','koeBottom'])($ (id) as HTMLAnchorElement).href=state.koe;
 if(!state?.id)return;
 $('setup').hidden=true;$('flow').hidden=false;$('routing').hidden=false;
 const items=state.items;
 $('processed').textContent=String(state.processed);$('progress').style.width=`${state.processed/state.total*100}%`;
 $('particles').innerHTML=items.map((i,n)=>`<div class="particle ${i.decision?.verdict??''} ${n>=shown&&n<state!.processed?'fresh':''} ${n===state!.processed&&!state!.complete?'current':''}" title="${esc(i.who)} · ${esc(i.decision?.verdict??'waiting')}"></div>`).join('');shown=state.processed;
 for(const v of ['auto','human','deny'])$(v+'Count').textContent=String(items.filter(i=>i.decision?.verdict===v).length);
 $('tech').innerHTML=`<span>YOHAKU · ${t().fixed}</span><span>Intercepta · ${state.wired.screening?t().live:t().mock}</span><span>${state.wired.classifierProvider==='jev'?'Jev':esc(state.wired.classifierProvider??'Classifier')} · ${state.wired.classifier?t().live:t().unconfigured}</span>`;
 $('liveLine').textContent=state.complete?t().complete:t().processing;
 $('continue').hidden=state.complete||busy;
 $('login').hidden=!state.complete||state.authenticated;
 const funded=items.filter(i=>i.payment.requirement);
 if(!funded.length){$('verify').textContent=t().loginOnly;document.querySelector('[data-t="loginBody"]')!.textContent=t().loginUnfunded;}
 (document.querySelector('[data-t="fundingNote"]') as HTMLElement).hidden=!funded.length;
 $('funding').innerHTML=funded.length?`<p>${t().quote}</p>`+funded.map(i=>`<p>${i.decision?.verdict==='auto'?t().autoReward:t().answerReward}<br><b>${esc(money(i.payment.requirement))}</b><br>${esc(i.payment.requirement!.network)}</p>`).join(''):`<p>${t().noFunding}</p>`;
 $('dashboard').hidden=!state.authenticated;
 $('wallet').textContent=state.receiver??'';
 $('received').textContent=total('amount');$('autoReward').textContent=total('automated');$('answerReward').textContent=total('answered');
 const automatic=items.find(i=>i.decision?.verdict==='auto'&&i.payment.requirement);
 $('autoQuote').textContent=money(automatic?.payment.requirement);$('autoStatus').textContent=automatic?status(automatic):t().noFunding;
 ($('collect') as HTMLButtonElement).disabled=busy||automatic?.payment.status!=='ready';
 $('capNote').textContent=t().capNote.replace('{cap}',String(state.policy.cap));
 const personal=items.filter(i=>state!.surfaced.includes(i.id)&&i.payment.requirement);
 $('questions').innerHTML=personal.length?personal.map(i=>`<article class="answer-card ${i.delivered?'done-card':''}"><div class="question-meta"><span>${esc(i.who)}</span><span class="tag">${t().rule} ${i.decision?.rule}</span></div><h3>${esc(question(i))}</h3><b>${esc(money(i.payment.requirement))}</b><p class="reason">${esc(i.decision?.reason)}</p>${i.resolved||i.payment.status!=='ready'?`<p>${esc(status(i))}</p>`:`<form data-answer="${i.id}"><label class="note" for="answerText">${t().answer}</label><textarea id="answerText" required minlength="3" maxlength="1000">${esc(draft)}</textarea><label class="consent"><input type="checkbox" required><span>${t().answerConsent}</span></label><div class="answer-actions"><button class="button" ${busy?'disabled':''}>${t().submit}</button><button class="button ghost" type="button" data-decline="${i.id}" ${busy?'disabled':''}>${t().decline}</button></div></form>`}</article>`).join(''):`<p class="empty">${t().noQuestion}</p>`;
 $('receipts').innerHTML=funded.filter(i=>i.payment.status==='settled').map(i=>`<article class="receipt"><div class="receipt-head"><strong>${esc(money(i.payment.requirement))}</strong><span class="tag">${t().settled}</span></div><p>${i.decision?.verdict==='auto'?t().autoReward:t().answerReward} · ${esc(i.who)}</p><p>${esc(i.payment.requirement!.network)} · x402</p>${i.explorer?`<a href="${esc(i.explorer)}" target="_blank" rel="noopener">${t().chain}</a>`:`<p>${esc(i.payment.transaction)}</p>`}</article>`).join('')||`<p class="empty">${t().unpaid}</p>`;
 $('inbox').innerHTML=items.filter(i=>i.delivered).map(i=>`<article class="inbox"><small>${esc(i.who)} · ${i.id.slice(-5)}</small><blockquote>${esc(i.delivered)}</blockquote><span class="tag">${t().delivered}</span></article>`).join('')||`<p class="empty">${t().noDelivery}</p>`;
 $('filters').innerHTML=['all','auto','human','deny'].map(v=>`<button type="button" data-filter="${v}" class="${v===filter?'active':''}">${t()[v as 'all'|'auto'|'human'|'deny']}</button>`).join('');
 const visible=items.filter(i=>i.decision&&(filter==='all'||i.decision.verdict===filter));
 $('routeCount').textContent=`${visible.length} ${t().count}`;
 $('requests').innerHTML=(expanded?visible:visible.slice(0,6)).map(i=>`<article class="request-row ${i.decision!.verdict}"><span class="decision">${t()[i.decision!.verdict as 'auto'|'human'|'deny']}</span><div>${esc(question(i))}<small>${esc(i.who)} · ${esc(status(i))}</small></div><button type="button" data-detail="${i.id}">${t().details}</button><div class="request-detail" id="detail-${i.id}" hidden><b>${t().rule} ${i.decision!.rule}</b> · ${esc(i.decision!.reason)}<br>${t().screen}: ${esc(i.screening)}${i.screeningReason?' · '+esc(i.screeningReason):''}${i.model?'<br>'+t().model+': '+esc(i.model):''}</div></article>`).join('')+(visible.length>6?`<button class="button ghost" id="moreRequests" type="button">${expanded?t().fewer:t().more}</button>`:'');
 $('evidence').hidden=false;$('raw').textContent=JSON.stringify(state,null,2);
 $('questions').querySelector('textarea')?.addEventListener('input',e=>draft=(e.target as HTMLTextAreaElement).value);
 $('questions').querySelectorAll<HTMLFormElement>('form[data-answer]').forEach(f=>f.onsubmit=e=>{e.preventDefault();void action('answer',{id:f.dataset.answer,answer:draft,consent:true},true);});
 $('questions').querySelectorAll<HTMLButtonElement>('[data-decline]').forEach(b=>b.onclick=()=>void action('decline',{id:b.dataset.decline}));
 $('filters').querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.onclick=()=>{filter=b.dataset.filter!;render();});
 if($('moreRequests'))$('moreRequests').onclick=()=>{expanded=!expanded;render();};
 $('requests').querySelectorAll<HTMLButtonElement>('[data-detail]').forEach(b=>b.onclick=()=>{const e=$('detail-'+b.dataset.detail);e.hidden=!e.hidden;b.textContent=e.hidden?t().details:t().hide;});
}
function error(e:unknown){const m=e instanceof Error?e.message:'';msg(m==='run_expired_or_changed'||m==='world_login_required'?t().sessionExpired:/^[a-z_]+$/.test(m)?`${lang==='ja'?'処理を進められませんでした':'Action refused'}: ${m}`:t().networkError,true);}
async function advance(){
 if(busy)return;busy=true;
 try{while(state?.id&&!state.complete){state=await post('advance');render();if(!state!.complete)await new Promise(r=>setTimeout(r,650));}}catch(e){error(e);}finally{busy=false;render();}
}
async function action(path:string,data:Record<string,unknown>={},payment=false){
 if(busy)return;busy=true;render();msg(payment?t().paying:'');
 try{state=await post(path,data);render();if(payment)msg(state!.items.some(i=>i.payment.status==='failed')?t().failure:t().paid,state!.items.some(i=>i.payment.status==='failed'));}
 catch(e){error(e);}finally{busy=false;render();}
}
($('startForm') as HTMLFormElement).onsubmit=async e=>{
 e.preventDefault();if(busy)return;busy=true;($('start') as HTMLButtonElement).disabled=true;msg(t().processing);
 try{state=await post('start',{receiver:($('receiver') as HTMLInputElement).value.trim(),consent:($('startConsent') as HTMLInputElement).checked});render();msg('');}
 catch(e){error(e);}finally{busy=false;($('start') as HTMLButtonElement).disabled=false;}
 if(state?.id)void advance();
};
$('continue').onclick=()=>void advance();
$('collect').onclick=()=>void action('collect',{},true);
$('language').onclick=()=>{lang=lang==='ja'?'en':'ja';render();};
$('cancel').onclick=async()=>{generation++;const id=attempt;attempt=undefined;try{if(id)await post('cancel',{id});msg(t().cancelled);}catch(e){error(e);}finally{busy=false;($('verify') as HTMLButtonElement).disabled=false;$('connection').hidden=true;}};
$('verify').onclick=async()=>{
 if(busy)return;busy=true;const run=++generation;($('verify') as HTMLButtonElement).disabled=true;
 try{
  msg(t().preparing);const c=await post('challenge');attempt=c.id;
  const request=await IDKit.request({app_id:c.appId,action:c.action,rp_context:c.rp_context,allow_legacy_proofs:true,environment:'production'}).preset(orbLegacy({signal:c.signal}));
  if(run!==generation)return;
  const uri=new URL(request.connectorURI);if(uri.protocol!=='https:'||!['world.org','worldcoin.org'].some(d=>uri.hostname===d||uri.hostname.endsWith('.'+d)))throw new Error('invalid_world_link');
  ($('connect') as HTMLAnchorElement).href=uri.toString();await QRCode.toCanvas($('qr') as HTMLCanvasElement,uri.toString(),{width:280,margin:2});
  $('connection').hidden=false;msg(t().waiting);
  const completed=await request.pollUntilCompletion({pollInterval:1500,timeout:110000});
  if(run!==generation)return;if(!completed.success)throw new Error('world_verification_incomplete');
  msg(t().checking);state=await post('verify',{id:c.id,proof:completed.result});
  if(run!==generation)return;attempt=undefined;$('connection').hidden=true;
  if(state!.items.some(i=>i.decision?.verdict==='auto'&&i.payment.status==='ready')){
   msg(t().paying);state=await post('collect');
  }
  render();msg(state!.items.some(i=>i.payment.status==='failed')?t().failure:'',state!.items.some(i=>i.payment.status==='failed'));
  $('dashboard').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(e){if(run===generation)error(e);}finally{if(run===generation){busy=false;$('connection').hidden=true;($('verify') as HTMLButtonElement).disabled=false;render();}}
};
labels();
void fetch('/experience/state').then(async r=>{if(!r.ok)throw new Error('state_unavailable');state=await r.json();render();}).catch(error);
