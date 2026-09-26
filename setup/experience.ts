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
    fundingNote:'表示額はBase SepoliaのテストUSDCです。送金対象は2件だけ。未入金の見積額は、受取額に含めません。',
    welcome:'ようこそ。すべてを見る必要はありません。',verified:'World ID · 人間性を確認済み',received:'実際に受け取った合計',receivedNote:'x402の成功結果がある分だけを集計。',autoReward:'委任で受け取った報酬',autoRewardNote:'方針内のサンプル回答への対価。',answerReward:'自分の回答で受け取った報酬',answerRewardNote:'回答後、決済に成功した分のみ。',
    delegatedTitle:'任せた分にも、対価が届く。',delegatedBody:'既知の相手・許可カテゴリ・金額上限内。追加回答なしで共有できるサンプルに、エージェントが支払います。',
    sampleLabel:'公開サンプル / あなた個人の回答ではありません',sample:'一人で使うには包装が大きすぎたので、買うのをやめました。',
    collect:'委任分のテスト報酬を受け取る',questionsTitle:'この判断は、あなたへ。',capNote:'通知上限は{cap}束。この体験では枠を固定し、回答しても次々に補充しません。選ばれた質問に、あなたの体験を回答してください。',
    receiptTitle:'入金まで、見える。',inboxTitle:'依頼元へ、回答が届く。',inboxNote:'この体験のエミュレートされたエージェント用受信箱。サーバーに保存された受渡し結果です。',
    routingTitle:'なぜ、この行き先になった？',koeTitle:'エージェントは、どこで人を見つける？',koeBody:'Koeは人を発見するための名簿デモ。この体験の質問は生成されたもので、Koe参加者へ送ってはいません。名簿を見て、このタブの体験へ戻れます。',koe:'Koeを見に行く ↗',
    boundary:'エージェントの需要は生成データ、判断は実コア。外部サービスの使用状況は画面に表示します。報酬は設定されたテストネットの実送金で、実売上ではありません。セッションは30分で失効します。回答はこのデモ内だけで使われます。Worldは回答の真偽や受取ウォレットの所有を証明しません。',
    technical:'技術的な記録を見る',all:'すべて',details:'理由',hide:'閉じる',processing:'サーバーが実際の審査・ルールを処理しています…',complete:'50件の判断が完了しました。Worldで本人の画面へ進めます。',checking:'Worldの証明をサーバーで検証しています…',preparing:'World認証を準備しています…',cancelled:'認証を取り消しました。アクセスや送金は行いません。',waiting:'World Appでの操作を待っています。',
    paying:'支払い元を再審査 → 認可を署名・検証 → x402で決済中。結果が出るまで再送しません。',paid:'報酬を受け取り、回答をエージェントの受信箱へ届けました。',failure:'入金を確認できませんでした。受取額に加算せず、回答も届けていません。追加送金を避けるため自動再試行しません。',unpaid:'まだ入金はありません。',ready:'送金対象 · 未入金',notFunded:'この依頼には送金資金を設定していません',settled:'入金確認済み',failed:'入金未確認',busyPayment:'決済処理中',refused:'辞退済み · 送金なし',answer:'回答を書いてください（3〜1,000文字）',answerConsent:'この回答を、支払い成功後にこのデモのエージェントへ共有します。',submit:'回答してテスト報酬を受け取る',decline:'今回は答えない',noQuestion:'この体験で回答できる依頼はありません。判断一覧で理由を確認できます。',noDelivery:'支払いが成功すると、ここに回答が届きます。',delivered:'回答受取済み',chain:'取引をエクスプローラーで確認 ↗',live:'実API',mock:'モック',unconfigured:'未設定',fixed:'固定ルール',atomic:'最小単位',quote:'今回の送金対象',noFunding:'このサーバーに送金資金が設定されていません。入金は発生しません。',count:'件',screen:'資金審査',model:'分類補助',rule:'ルール',sessionExpired:'セッションが期限切れです。ページを再読込してください。',networkError:'接続を確認できませんでした。再読込でサーバーの現在の結果を確認できます。送金は自動再試行しません。',
    loginOnly:'Worldでログイン（送金なし）',loginUnfunded:'この体験は送金対象がありません。World認証後に質問を確認し、下書きを保存できます。報酬の送金・回答の配信は行いません。',more:'残りの依頼も表示',fewer:'6件だけ表示',
    discoverTab:'Koe · エージェント目線',monitorTab:'依頼モニター',workTab:'人間の受信箱',receiptsTab:'受取履歴',
    discoverTitle:'エージェントは、誰に聞く？',discoverBody:'Koeの公開名簿を読み、人が提供できる体験と境界を知る。ここから先は、あなた専用に生成した依頼を追います。名簿の人への質問配送ではありません。',
    directoryLoading:'Koeの公開名簿を読み込んでいます…',directoryUnavailable:'名簿を読み込めませんでした。既存のKoeページから確認できます。',directoryLoaded:'公開名簿から取得したプロフィール',directoryEmpty:'このサーバーの認証済み参加者はまだいません。',
    fictional:'架空の例 · 未認証',participant:'World確認済み · 自己申告プロフィール',topics:'話せる体験',boundaries:'答えないこと',
    startJourney:'依頼が届く様子を見る →',externalKoe:'Koeの全画面を開く ↗',registerKoe:'自分もKoeに掲載する',registerNote:'任意。公開する内容に同意して、登録用のWorld認証へ進みます。',
    readiness:'この環境で未設定：{missing}。送金できない場合も、World認証と回答の下書きを確認できます。',paymentService:'報酬送金',screeningService:'資金審査',
    goHuman:'自分の受信箱を開く →',monitorReady:'このデモの振り分け結果です。件数・判定時刻・理由はサーバーの処理結果から取得しています。',
    saveDraft:'下書きを保存（送金・配信なし）',draftConsent:'このブラウザ専用の下書きとして一時保存します。エージェントには配信しません。',
    draftSaved:'下書きを保存しました。送金もエージェントへの配信も行っていません。',draftLabel:'下書き保存済み · 未配信',previewQuote:'参考のテスト報酬 · 未入金',
    thresholdReason:'提示額 {price} が、委任できる上限 {threshold} を超えるため、本人に聞きます。',
    surveyHint:'いつ、何が起きて、なぜそう感じたか。あなたが実際に経験したことを書いてください。',
    receiptsNote:'成功した送金だけがここに残ります。リンク先のBlock Explorerで、送金先とテストUSDCの移動を確認できます。',
    mapScreen:'支払い元を審査',mapPolicy:'あなたの方針',mapRules:'権限・カテゴリ・金額',mapJev:'Jev：未分類だけ ask / drop',mapBoundary:'AIには、許可を広げる出力がない。',mapSwipe:'図は横にスクロールできます。',
    decisionRecord:'SERVER DECISION / 実際の判定記録',replayRoutes:'判定の流れを再生',replaying:'記録済みの判定を再生中。依頼の追加・再判定・送金は行いません。',
    finishTitle:'あなたの体験が、エージェントの答えに。',finishBody:'回答を届け、テスト報酬を受け取りました。受渡しと送金の記録を確認できます。',seeReceipt:'受取と回答の到着を見る →',
    questions:{'experience/why-you-put-it-back':'買いかけた商品を、買わずに戻した理由は？','experience/the-time-it-failed-you':'期待していたのに、うまく使えなかった体験を教えてください。','experience/why-you-stopped':'その商品やサービスを使うのをやめた理由は？','corpus/your-own-words':'自分で書いた文章を、学習用途で提供できますか？','experience/what-changed-your-mind':'考えが変わったきっかけを教えてください。','contact/where-you-live':'自宅の住所を教えてください。'},
  },
  en: {
    title:'Opportunities keep coming.<br><em>Keep your space.</em>',intro:'Agents ask for your experience and offer to pay. YOHAKU filters the demand and keeps only the decisions that need you.',
    stages:['Requests arrive','World sign-in','Delegated reward','Answer & receive'],
    startTitle:'Start your own demo',startNote:'Generate 50 requests for this browser. The recipient is fixed for this run. No wallet connection or gas is needed.',receiver:'Your test reward address',start:'Receive 50 requests',consent:'Use the example policy and public sample answer. One delegated request and one personal answer can receive test payments. Amounts appear before sign-in. Only my button actions start payments.',
    flowTitle:'Let the rules sort it out.',flowNote:'Agent arrivals are emulated. Colors and counts come from actual server decisions.',auto:'Delegate',human:'Ask a person',deny:'Refuse',autoShort:'Inside policy',humanShort:'Held, not approved',denyShort:'Does not reach you',flowActual:'Permitted requests ≠ completed payments',
    continue:'Continue processing',loginTitle:'Open your own inbox.',loginBody:'Verify personhood with World ID, collect the displayed delegated test reward, and enter your dashboard. The personal-answer reward is paid only when you later submit your answer.',
    login:'Sign in with World & collect delegated reward',openWorld:'Open World App',scan:'Scan with World App. A compatible Orb credential is required.',cancel:'Cancel verification',loginLimit:'15-minute access to this demo only. No ENS owner authority or access to another participant.',
    fundingNote:'Amounts are test USDC on Base Sepolia. Only two requests are funded. Unpaid quotes never count as received money.',
    welcome:'Welcome. You do not need to review everything.',verified:'World ID · Personhood verified',received:'Total actually received',receivedNote:'Only successful x402 results count.',autoReward:'Received through delegation',autoRewardNote:'Payment for the allowed sample answer.',answerReward:'Received for your answer',answerRewardNote:'Only after an answer and successful payment.',
    delegatedTitle:'Delegated work can earn, too.',delegatedBody:'Known buyer. Allowed topic. Within the amount limit. An agent pays for the sample you already allowed to be shared.',
    sampleLabel:'PUBLIC SAMPLE / NOT YOUR PERSONAL ANSWER',sample:'I put it back because the packaging was too large for one person.',
    collect:'Collect delegated test reward',questionsTitle:'This decision is yours.',capNote:'Your cap is {cap} bundles. These slots stay fixed rather than refilling after each answer. Share your own experience with the selected question.',
    receiptTitle:'See the money arrive.',inboxTitle:'The agent gets the answer.',inboxNote:'The emulated buyer’s inbox for this run. These delivery records are stored by the server.',
    routingTitle:'Why did it go there?',koeTitle:'Where do agents discover people?',koeBody:'Koe demonstrates discovery. This run generates its own requests; it does not message people listed in Koe. Explore the directory and return to this tab.',koe:'Explore Koe ↗',
    boundary:'Agent demand is generated; decisions use the real core. Provider status is shown. Configured testnet transfers are real, not revenue. Sessions expire after 30 minutes. Answers are used only within this demo. World does not prove answer truth or ownership of the receiving wallet.',
    technical:'Inspect technical records',all:'All',details:'Reason',hide:'Close',processing:'The server is running screening and policy checks…',complete:'All 50 decisions are ready. Use World to enter your dashboard.',checking:'Verifying the World proof on the server…',preparing:'Preparing World verification…',cancelled:'Verification cancelled. No access or payment granted.',waiting:'Waiting for your action in World App.',
    paying:'Re-screening payer → signing and checking authorization → settling over x402. No duplicate send while waiting.',paid:'Payment received. The answer has reached the agent inbox.',failure:'Payment was not confirmed. No reward counted or answer delivered. We do not retry automatically after an uncertain transfer.',unpaid:'No payment received yet.',ready:'Funded · not paid yet',notFunded:'This request is not funded in the demo',settled:'Payment confirmed',failed:'Payment unconfirmed',busyPayment:'Settlement in progress',refused:'Declined · no payment',answer:'Write your answer (3–1,000 characters)',answerConsent:'Share this answer with the demo agent only after its payment succeeds.',submit:'Answer and receive test reward',decline:'Not this time',noQuestion:'No answer is available in this run. Inspect the routing reasons below.',noDelivery:'A successful payment delivers the answer here.',delivered:'Answer received',chain:'View transaction in explorer ↗',live:'Live API',mock:'Mocked',unconfigured:'Not configured',fixed:'Fixed rules',atomic:'atomic units',quote:'Funded in this run',noFunding:'This server has no configured demo funding. No payment will occur.',count:'requests',screen:'Screening',model:'Decision support',rule:'Rule',sessionExpired:'This session expired. Reload the page.',networkError:'Connection unavailable. Reload to read the current server result. Payments are never retried automatically.',
    loginOnly:'Sign in with World (no payment)',loginUnfunded:'No payment is available in this run. After World verification you can review the question and save a private draft. No reward or answer delivery will occur.',more:'Show remaining requests',fewer:'Show only six',
    discoverTab:'Koe · Agent view',monitorTab:'Request monitor',workTab:'Human inbox',receiptsTab:'Payment history',
    discoverTitle:'Who should an agent ask?',discoverBody:'Read Koe’s public directory to discover human experience and boundaries. The next steps follow requests generated for your own demo, not messages to the listed people.',
    directoryLoading:'Reading Koe’s public directory…',directoryUnavailable:'The directory could not be loaded. You can open the existing Koe page.',directoryLoaded:'Profiles fetched from the public directory',directoryEmpty:'No verified participants are currently listed on this server.',
    fictional:'Fictional example · unverified',participant:'World verified · self-reported profile',topics:'Experiences offered',boundaries:'Will not answer',
    startJourney:'Watch requests arrive →',externalKoe:'Open the full Koe directory ↗',registerKoe:'List yourself in Koe',registerNote:'Optional. Review public profile consent, then complete the separate World registration.',
    readiness:'Not configured here: {missing}. When payment is unavailable, you can still verify with World and save a private answer draft.',paymentService:'reward payments',screeningService:'screening',
    goHuman:'Open my human inbox →',monitorReady:'Routing results for this demo. Counts, decision times and reasons come from server processing.',
    saveDraft:'Save draft (no payment or delivery)',draftConsent:'Temporarily save a private draft for this browser. Do not deliver it to the agent.',
    draftSaved:'Draft saved. No payment was sent and no answer was delivered to the agent.',draftLabel:'Draft saved · not delivered',previewQuote:'Example test reward · not received',
    thresholdReason:'The offer of {price} exceeds the delegated limit of {threshold}, so a person must decide.',
    surveyHint:'What happened, when did it happen, and why did you feel that way? Describe something you actually experienced.',
    receiptsNote:'Only successful payments appear here. Open Block Explorer to check the recipient and the test USDC transfer.',
    mapScreen:'Screen the payer',mapPolicy:'Your policy',mapRules:'Permissions · topic · amount',mapJev:'Jev: unmatched → ask / drop',mapBoundary:'AI cannot output wider permission.',mapSwipe:'Scroll horizontally to explore the diagram.',
    decisionRecord:'SERVER DECISION / Recorded result',replayRoutes:'Replay the decisions',replaying:'Replaying recorded decisions. No new requests, checks or payments.',
    finishTitle:'Your experience became an agent’s answer.',finishBody:'Your answer was delivered and the test reward arrived. See both sides of the exchange.',seeReceipt:'See the reward & delivered answer →',
    questions:{} as Record<string,string>,
  },
};
type Copy = typeof COPY.en;
interface Quote { amount:string; asset:string; network:string; payTo:string; extra?:Record<string,unknown> }
interface Reward {amount:string;asset:string;network:string;preview?:boolean}
interface Item {id:string;who:string;category:string;question:string;kind:string;decision:{verdict:string;rule:number;reason:string}|null;screening:string|null;screeningReason?:string;model?:string;modelReason?:string;decidedAt?:string;reward?:Reward;draft?:string;payment:{status:string;requirement?:Quote;transaction?:string;error?:string};resolved?:string;delivered?:string;explorer?:string}
interface State {id?:string;receiver?:string;processed:number;total:number;complete:boolean;authenticated:boolean;items:Item[];surfaced:string[];policy:{cap:number;displayThreshold?:Reward};wired:{screening:boolean;classifier:boolean;classifierProvider?:string;payment:boolean};totals:{amount:string;automated:string;answered:string;asset:string;network:string}[];tokenDisplay:{asset:string;network:string;symbol:string;decimals:number};koe:string;koeDirectory:string|null;koeRegistration:string;liveDirectory:string}
type View='discover'|'monitor'|'work'|'receipts';
interface Profile {name:string;headline:string;answers:string[];willNotAnswer:string[];live:boolean}
const $ = (id:string) => document.getElementById(id)!;
const esc = (v:unknown) => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
let lang:'ja'|'en'=new URL(location.href).searchParams.get('lang')==='en'?'en':'ja';
let state:State|undefined,busy=false,generation=0,attempt:string|undefined,filter='all',shown=0,draft='',draftFor='',expanded=false;
let view:View='discover',profiles:Profile[]=[],directoryStatus:'loading'|'ready'|'failed'='loading',liveDirectoryLoaded=false;
let motionTimers:ReturnType<typeof setTimeout>[]=[],replaying=false,spotlight:Item|undefined;
const initialView=new URL(location.href).searchParams.get('view');
if(initialView&&['discover','monitor','work','receipts'].includes(initialView))view=initialView as View;
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
const ruleExplanationsJa:Record<number,string>={
 0:'委任範囲を超える操作、または取り消された権限のため、断りました。',
 1:'この内容を共有する許可は取り消されています。',
 2:'「共有しない」と決めた内容なので、本人には届けません。',
 3:'この内容を共有する許可の期限が切れています。',
 4:'支払い元の安全性を確認できないため、断りました。審査元の詳細は理由欄で確認できます。',
 5:'個別の同意が必要な内容なので、自動共有せず本人に聞きます。',
 7:'初めての相手からの依頼なので、本人に聞きます。',
 8:'許可済みの相手・内容・金額の範囲内なので、任せられます。',
 9:'既存の方針では判断できない内容です。分類補助も自動許可を出すことはできません。',
};
const reason=(i:Item)=>i.decision?.rule===6?t().thresholdReason.replace('{price}',money(i.reward)).replace('{threshold}',money(state?.policy.displayThreshold)):
 lang==='ja'&&i.decision?(ruleExplanationsJa[i.decision.rule]??i.decision.reason):i.decision?.reason??'';
const status=(i:Item)=>i.resolved==='declined'?t().refused:({ready:t().ready,settled:t().settled,failed:t().failed,processing:t().busyPayment,'not-funded':t().notFunded}[i.payment.status]??i.payment.status);
function stopMotion(){motionTimers.forEach(clearTimeout);motionTimers=[];$('routePackets').replaceChildren();replaying=false;}
function showDecision(i:Item){
 spotlight=i;const verdict=i.decision!.verdict as 'auto'|'human'|'deny';
 $('spotlightWho').textContent=`${i.who} → ${t()[verdict]}`;
 $('spotlightReason').textContent=`${t().rule} ${i.decision!.rule} · ${reason(i)}${i.model?' · '+(state?.wired.classifierProvider??'Classifier')+': '+i.model:''}`;
}
function animateDecisions(items:Item[],replay=false){
 if(!items.length)return;
 if(replay){stopMotion();replaying=true;$('liveLine').textContent=t().replaying;}
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 for(const [n,i] of items.entries()){
  const timer=setTimeout(()=>{
   if(view!=='monitor')return;if(!replay||n%8===0||n===items.length-1)showDecision(i);
   if(reduced)return;
   const verdict=i.decision!.verdict;
   const y=verdict==='auto'?66:verdict==='human'?134:204;
   const path=`M58 134H623C660 134 655 ${y} 704 ${y}H790`;
   const ns='http://www.w3.org/2000/svg',circle=document.createElementNS(ns,'circle'),motion=document.createElementNS(ns,'animateMotion');
   circle.setAttribute('r','5');circle.setAttribute('fill',verdict==='auto'?'#def09b':verdict==='human'?'#c8a8ef':'#d294a8');circle.classList.add('packet');
   motion.setAttribute('path',path);motion.setAttribute('dur','1.6s');motion.setAttribute('begin','indefinite');motion.setAttribute('fill','freeze');
   circle.append(motion);$('routePackets').append(circle);motion.beginElement();
   motionTimers.push(setTimeout(()=>circle.remove(),1650));
  },n*(replay?170:110));motionTimers.push(timer);
 }
 if(replay)motionTimers.push(setTimeout(()=>{replaying=false;$('liveLine').textContent=t().monitorReady;},(items.length-1)*170+1650));
}
function changeView(next:View){if(busy)return;stopMotion();view=next;msg('');render();window.scrollTo({top:0,behavior:'smooth'});}
function renderDirectory(){
 $('directoryStatus').textContent=directoryStatus==='loading'?t().directoryLoading:directoryStatus==='failed'?t().directoryUnavailable:t().directoryLoaded;
 $('directoryEmpty').hidden=!liveDirectoryLoaded||profiles.some(p=>p.live);
 $('profiles').innerHTML=profiles.map(p=>`<article class="profile-card"><span class="profile-avatar">${esc(p.name.slice(0,1))}</span><span class="tag">${p.live?t().participant:t().fictional}</span><h3>${esc(p.name)}</h3><p>${esc(p.headline)}</p><small>${t().topics}</small><ul>${p.answers.map(v=>`<li>${esc(t().questions[v]??v.split('/').at(-1)?.replaceAll('-',' '))}</li>`).join('')}</ul><details><summary>${t().boundaries}</summary><ul>${p.willNotAnswer.map(v=>`<li>${esc(t().questions[v]??v)}</li>`).join('')}</ul></details></article>`).join('');
}
async function loadDirectory(){
 const read=async(url:string)=>{const r=await fetch(url,{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error('directory_unavailable');return r.json();};
 const results=await Promise.allSettled([state?.koeDirectory?read(state.koeDirectory):Promise.reject(),read(state?.liveDirectory??'/koe-registration/directory.json')]);
 profiles=[];liveDirectoryLoaded=results[1]?.status==='fulfilled';
 for(const [n,r] of results.entries())if(r.status==='fulfilled'&&Array.isArray(r.value.profiles)){
  for(const p of r.value.profiles.slice(0,100)){
   if(typeof p.name!=='string'||typeof p.headline!=='string'||!Array.isArray(p.answers)||!Array.isArray(p.willNotAnswer))continue;
   if(n===1&&(p.verification?.environment!=='production'||!['orb','proof_of_human'].includes(p.verification?.credential)||!(Date.parse(p.expiresAt)>Date.now())))continue;
   profiles.push({name:p.name,headline:p.headline,answers:p.answers.filter((v:unknown)=>typeof v==='string'),willNotAnswer:p.willNotAnswer.filter((v:unknown)=>typeof v==='string'),live:n===1});
  }
 }
 profiles.sort((a,b)=>Number(b.live)-Number(a.live));
 directoryStatus=results.some(r=>r.status==='fulfilled')?'ready':'failed';renderDirectory();
}
function labels(){
 document.documentElement.lang=lang;
 document.querySelectorAll<HTMLElement>('[data-t]').forEach(e=>e.textContent=String(t()[e.dataset.t as keyof Copy]));
 document.querySelectorAll<HTMLElement>('[data-html]').forEach(e=>e.innerHTML=String(t()[e.dataset.html as keyof Copy]));
 $('language').textContent=lang==='ja'?'EN':'日本語';
 try{const u=new URL(location.href);u.searchParams.set('lang',lang);u.searchParams.set('view',view);history.replaceState(null,'',u);}catch{}
}
function render(){
 if(state&&!state.id&&(view==='work'||view==='receipts'))view='discover';
 labels();
 document.body.dataset.view=view;
 document.querySelector<HTMLElement>('.hero')!.hidden=view!=='discover';
 document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-current',b.dataset.view===view?'page':'false');b.disabled=busy||(b.dataset.view==='work'&&!state?.complete)||(b.dataset.view==='receipts'&&!state?.authenticated);});
 $('discovery').hidden=view!=='discover';$('setup').hidden=view!=='monitor'||Boolean(state?.id);
 $('flow').hidden=view!=='monitor'||!state?.id;$('routing').hidden=view!=='monitor'||!state?.id;
 $('dashboard').hidden=!(state?.authenticated&&(view==='work'||view==='receipts'));
 $('login').hidden=!(state?.complete&&!state.authenticated&&view==='work');
 $('answerColumn').hidden=view==='receipts';$('workspaceColumns').classList.toggle('receipts-only',view==='receipts');
 $('koeFooter').hidden=view!=='work';$('evidence').hidden=!state?.id||view!=='monitor';
 $('journeyFinish').hidden=view!=='work'||!state?.items.some(i=>i.delivered&&i.decision?.verdict==='human');
 const missing=state?[...(!state.wired.classifier?['Jev']:[]),...(!state.wired.screening?[t().screeningService]:[]),...(!state.wired.payment?[t().paymentService]:[])]:[];
 $('readiness').hidden=!missing.length;$('readiness').textContent=t().readiness.replace('{missing}',missing.join(' / '));
 if(state){($('koeExternal') as HTMLAnchorElement).href=state.koe;for(const id of ['registerKoe','registerKoeFooter'])($(id) as HTMLAnchorElement).href=state.koeRegistration;}
 renderDirectory();
 const step=!state?.complete?0:!state.authenticated?1:state.items.some(i=>i.delivered&&i.decision?.verdict==='human')?4:state.items.some(i=>i.payment.status==='settled')?3:2;
 $('stages').innerHTML=t().stages.map((s,i)=>`<li class="${i===step?'active':i<step?'done':''}">${String(i+1).padStart(2,'0')} / ${s}</li>`).join('');
 if(state?.koe)for(const id of ['koeTop','koeBottom'])($ (id) as HTMLAnchorElement).href=state.koe;
 if(!state?.id)return;
 const items=state.items;
 $('processed').textContent=String(state.processed);$('progress').style.width=`${state.processed/state.total*100}%`;
 const restoring=shown===0&&state.complete;
 const newDecisions=items.slice(shown,state.processed).filter(i=>i.decision);
 $('particles').innerHTML=items.map((i,n)=>`<div class="particle ${i.decision?.verdict??''} ${n>=shown&&n<state!.processed?'fresh':''} ${n===state!.processed&&!state!.complete?'current':''}" title="${esc(i.who)} · ${esc(i.decision?.verdict??'waiting')}"></div>`).join('');shown=state.processed;
 if(view==='monitor'&&newDecisions.length)animateDecisions(newDecisions,restoring);
 if(!spotlight&&state.processed)spotlight=items[state.processed-1];
 if(spotlight)showDecision(spotlight);
 for(const v of ['auto','human','deny'])$(v+'Count').textContent=String(items.filter(i=>i.decision?.verdict===v).length);
 $('tech').innerHTML=`<span>YOHAKU · ${t().fixed}</span><span>Intercepta · ${state.wired.screening?t().live:t().mock}</span><span>${state.wired.classifierProvider==='jev'?'Jev':esc(state.wired.classifierProvider??'Classifier')} · ${state.wired.classifier?t().live:t().unconfigured}</span>`;
 $('liveLine').textContent=replaying?t().replaying:state.complete?t().monitorReady:t().processing;
 $('replayRoutes').hidden=!state.complete;
 ($('replayRoutes') as HTMLButtonElement).disabled=busy;
 $('continue').hidden=state.complete||busy;
 $('goHuman').hidden=!state.complete;
 const funded=items.filter(i=>i.payment.requirement);
 if(!funded.length){$('verify').textContent=t().loginOnly;document.querySelector('[data-t="loginBody"]')!.textContent=t().loginUnfunded;}
 (document.querySelector('[data-t="fundingNote"]') as HTMLElement).hidden=!funded.length;
 $('funding').innerHTML=funded.length?`<p>${t().quote}</p>`+funded.map(i=>`<p>${i.decision?.verdict==='auto'?t().autoReward:t().answerReward}<br><b>${esc(money(i.payment.requirement))}</b><br>${esc(i.payment.requirement!.network)}</p>`).join(''):`<p>${t().noFunding}</p>`;
 $('wallet').textContent=state.receiver??'';
 $('received').textContent=total('amount');$('autoReward').textContent=total('automated');$('answerReward').textContent=total('answered');
 const automatic=items.find(i=>i.decision?.verdict==='auto'&&i.payment.requirement);
 $('autoQuote').textContent=money(automatic?.payment.requirement);$('autoStatus').textContent=automatic?status(automatic):t().noFunding;
 ($('collect') as HTMLButtonElement).disabled=busy||automatic?.payment.status!=='ready';
 $('capNote').textContent=t().capNote.replace('{cap}',String(state.policy.cap));
 const eligible=items.filter(i=>state!.surfaced.includes(i.id));
 const personal=(eligible.some(i=>i.payment.requirement)?eligible.filter(i=>i.payment.requirement):eligible).slice(0,1);
 if(personal[0]&&draftFor!==personal[0].id){draftFor=personal[0].id;draft=personal[0].draft??'';}
 $('questions').innerHTML=personal.length?personal.map(i=>`<article class="answer-card ${i.delivered?'done-card':''}"><div class="question-meta"><span>${esc(i.who)}</span><span class="tag">${t().rule} ${i.decision?.rule}</span></div><h3>${esc(question(i))}</h3><b>${esc(money(i.payment.requirement??i.reward))}</b>${!i.payment.requirement?`<p class="note">${t().previewQuote}</p>`:''}<p class="reason">${esc(reason(i))}</p>${i.draft?`<p class="tag">${t().draftLabel}</p>`:''}${i.resolved||['processing','settled','failed'].includes(i.payment.status)?`<p>${esc(status(i))}</p>`:`<form data-answer="${i.id}" data-operation="${i.payment.requirement?'answer':'draft'}"><p class="note">${t().surveyHint}</p><label class="note" for="answerText">${t().answer}</label><textarea id="answerText" required minlength="3" maxlength="1000">${esc(draft)}</textarea><label class="consent"><input type="checkbox" required><span>${i.payment.requirement?t().answerConsent:t().draftConsent}</span></label><div class="answer-actions"><button class="button" ${busy?'disabled':''}>${i.payment.requirement?t().submit:t().saveDraft}</button><button class="button ghost" type="button" data-decline="${i.id}" ${busy?'disabled':''}>${t().decline}</button></div></form>`}</article>`).join(''):`<p class="empty">${t().noQuestion}</p>`;
 $('receipts').innerHTML=funded.filter(i=>i.payment.status==='settled').map(i=>`<article class="receipt"><div class="receipt-head"><strong>${esc(money(i.payment.requirement))}</strong><span class="tag">${t().settled}</span></div><p>${i.decision?.verdict==='auto'?t().autoReward:t().answerReward} · ${esc(i.who)}</p><p>${esc(i.payment.requirement!.network)} · x402</p>${i.explorer?`<a href="${esc(i.explorer)}" target="_blank" rel="noopener">${t().chain}</a>`:`<p>${esc(i.payment.transaction)}</p>`}</article>`).join('')||`<p class="empty">${t().unpaid}</p>`;
 $('inbox').innerHTML=items.filter(i=>i.delivered).map(i=>`<article class="inbox"><small>${esc(i.who)} · ${i.id.slice(-5)}</small><blockquote>${esc(i.delivered)}</blockquote><span class="tag">${t().delivered}</span></article>`).join('')||`<p class="empty">${t().noDelivery}</p>`;
 $('filters').innerHTML=['all','auto','human','deny'].map(v=>`<button type="button" data-filter="${v}" class="${v===filter?'active':''}">${t()[v as 'all'|'auto'|'human'|'deny']}</button>`).join('');
 const visible=items.filter(i=>i.decision&&(filter==='all'||i.decision.verdict===filter));
 $('routeCount').textContent=`${visible.length} ${t().count}`;
 $('requests').innerHTML=(expanded?visible:visible.slice(0,6)).map(i=>`<article class="request-row ${i.decision!.verdict}"><span class="decision">${t()[i.decision!.verdict as 'auto'|'human'|'deny']}</span><div>${esc(question(i))}<small>${esc(i.who)} · ${esc(money(i.reward))} · ${esc(status(i))}</small><small>${i.decidedAt?esc(new Date(i.decidedAt).toLocaleTimeString(lang)):''}</small></div><button type="button" data-detail="${i.id}">${t().details}</button><div class="request-detail" id="detail-${i.id}" hidden><b>${t().rule} ${i.decision!.rule}</b> · ${esc(reason(i))}<br>${t().screen}: ${esc(i.screening)}${i.screeningReason?' · '+esc(i.screeningReason):''}${i.model?'<br>'+t().model+': '+esc(i.model)+' · '+esc(i.modelReason??''):''}</div></article>`).join('')+(visible.length>6?`<button class="button ghost" id="moreRequests" type="button">${expanded?t().fewer:t().more}</button>`:'');
 $('raw').textContent=JSON.stringify(state,null,2);
 $('questions').querySelector('textarea')?.addEventListener('input',e=>draft=(e.target as HTMLTextAreaElement).value);
 $('questions').querySelectorAll<HTMLFormElement>('form[data-answer]').forEach(f=>f.onsubmit=e=>{e.preventDefault();const operation=f.dataset.operation!;void action(operation,{id:f.dataset.answer,answer:draft,consent:true},operation==='answer');});
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
 try{state=await post(path,data);render();if(path==='draft')msg(t().draftSaved);else if(payment){msg(state!.items.some(i=>i.payment.status==='failed')?t().failure:t().paid,state!.items.some(i=>i.payment.status==='failed'));$('dashboard').scrollIntoView({behavior:'smooth',block:'start'});}}
 catch(e){error(e);}finally{busy=false;render();}
}
($('startForm') as HTMLFormElement).onsubmit=async e=>{
 e.preventDefault();if(busy)return;busy=true;($('start') as HTMLButtonElement).disabled=true;msg(t().processing);
 try{state=await post('start',{receiver:($('receiver') as HTMLInputElement).value.trim(),consent:($('startConsent') as HTMLInputElement).checked});render();msg('');$('flow').scrollIntoView({behavior:'smooth',block:'start'});}
 catch(e){error(e);}finally{busy=false;($('start') as HTMLButtonElement).disabled=false;}
 if(state?.id)void advance();
};
$('continue').onclick=()=>void advance();
$('collect').onclick=()=>void action('collect',{},true);
$('language').onclick=()=>{lang=lang==='ja'?'en':'ja';render();};
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.onclick=()=>changeView(b.dataset.view as View));
$('startJourney').onclick=()=>changeView('monitor');
$('goHuman').onclick=()=>changeView('work');
$('replayRoutes').onclick=()=>{if(!busy&&state?.complete){$('flow').scrollIntoView({behavior:'smooth',block:'start'});animateDecisions(state.items.filter(i=>i.decision),true);}};
$('seeReceipt').onclick=()=>changeView('receipts');
for(const id of ['koeTop','koeBottom'])$(id).onclick=e=>{e.preventDefault();changeView('discover');};
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
  view='work';render();msg(state!.items.some(i=>i.payment.status==='failed')?t().failure:'',state!.items.some(i=>i.payment.status==='failed'));
  $('dashboard').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(e){if(run===generation)error(e);}finally{if(run===generation){busy=false;$('connection').hidden=true;($('verify') as HTMLButtonElement).disabled=false;render();}}
};
labels();
void fetch('/experience/state').then(async r=>{if(!r.ok)throw new Error('state_unavailable');state=await r.json();render();void loadDirectory();}).catch(error);
