// Rebuild with: node --import tsx docs/launch/build.ts
// Read-only fixtures from the real core. Never calls a provider or signs a payment.
import {writeFileSync, readFileSync} from 'node:fs';
import {route} from '../../src/core/rules.js';
import {surface,onDeadline} from '../../src/core/queue.js';
import {DEMO_POLICY,NIGHT,MORNING,demoContext,generateNight} from '../../src/core/night.js';
import {applyClassification} from '../../src/ports/classifier.js';
import type {AgentRequest,ScreeningResult} from '../../src/core/types.js';
const base:AgentRequest={id:'launch-replay',who:'market-research.acme.eth',what:DEMO_POLICY.allow[0],purpose:'market-research',price:{amount:120,currency:'JPYC'},deadline:'2026-09-26T12:00:00+09:00'};
const screening=JSON.parse(readFileSync('docs/build/evidence/screening-with-settlement.json','utf8'));
const ctx=demoContext(NIGHT);
const cases={
 auto:route(base,DEMO_POLICY,{...ctx,screen:()=> 'clean'}),
 human:route({...base,who:'first-contact.newco.eth'},DEMO_POLICY,{...ctx,screen:()=> 'clean'}),
 risk:route(base,DEMO_POLICY,{...ctx,screen:()=> 'flagged',screeningReason:()=>screening.refused.reason.replace(/^the payment source failed screening — /,'')}),
 silence:onDeadline(),
 unknown:route(base,DEMO_POLICY,{...ctx,screen:()=> 'unavailable'}),
};
// A deliberately fixed 50-request presentation, not a change to the canonical night.
// Two added unknown-category requests expose the real classifier boundary using mock choices.
const classification={category:'experience/a-new-question',sensitivity:'unclear' as const,reasoning:'Illustrative model choice; no model was called'};
const unknownRequests=(['ask','drop'] as const).map(suggestion=>({...base,id:`launch-unknown-${suggestion}`,what:classification.category,payoutAddress:'0x0000000000000000000000000000000000000031'}));
const requests=[...generateNight(2).slice(0,48),...unknownRequests];
const decided=requests.map(request=>{
 const initial=route(request,DEMO_POLICY,ctx);
 const modelChoice=request.id==='launch-unknown-ask'?'ask':request.id==='launch-unknown-drop'?'drop':null;
 if((initial.rule===9)!==Boolean(modelChoice))throw Error('The classifier scenario no longer matches rule 9.');
 const decision=modelChoice?applyClassification(initial,{...classification,suggestion:modelChoice}):initial;
 return {request,decision,initial,modelChoice,screening:ctx.screen(request.payoutAddress),heldAt:NIGHT.toISOString()};
});
const held=decided.filter(d=>d.decision.verdict==='human');
const night={arrived:decided.length,auto:decided.filter(d=>d.decision.verdict==='auto').length,deny:decided.filter(d=>d.decision.verdict==='deny').length,caps:[0,1,2,3,4].map(dailyCap=>({cap:dailyCap,surfaced:surface(held,{...DEMO_POLICY,dailyCap},MORNING).surfaced.length}))};
if(cases.auto.verdict!=='auto'||cases.human.verdict!=='human'||cases.risk.rule!==4||cases.silence.verdict!=='deny'||cases.unknown.verdict!=='deny')throw Error('Core behavior changed; review the presentation.');
const queued=surface(held,DEMO_POLICY,MORNING);
const agents=[...new Set(decided.map(d=>d.request.who))];
const bundles=[...queued.surfaced,...queued.deferred].map(b=>({category:b.category,ids:b.requests.map(h=>h.request.id)}));
const unmatched=route({...base,what:'experience/a-new-question'},DEMO_POLICY,{...ctx,screen:()=> 'clean'});
const traffic={
 scenario:'50 explanatory requests: 48 from seed 2 + two rule-9 requests with illustrative ask/drop choices; screening is mocked',
 agents,
 items:decided.map(({request,decision,initial,modelChoice,screening})=>({id:request.id,agent:agents.indexOf(request.who),category:request.what,verdict:decision.verdict,rule:decision.rule,initialVerdict:initial.verdict,modelChoice,screening})),
 bundles,
 caps:[0,1,2,3,4].map(dailyCap=>{const q=surface(held,{...DEMO_POLICY,dailyCap},MORNING);return {cap:dailyCap,surfaced:q.surfaced.map(b=>b.category),deferred:q.deferred.map(b=>b.category),expired:q.expired.map(h=>h.request.id)};}),
 ai:{initial:unmatched,ask:applyClassification(unmatched,{...classification,suggestion:'ask'}),drop:applyClassification(unmatched,{...classification,suggestion:'drop'})},
};
if(unmatched.rule!==9||traffic.ai.ask.verdict!=='human'||traffic.ai.drop.verdict!=='deny')throw Error('Classifier boundary changed; review the presentation.');
if(night.auto+night.deny+held.length!==night.arrived||bundles.flatMap(b=>b.ids).length!==held.length)throw Error('Replay requests must be conserved.');
if(night.arrived!==50||decided.filter(d=>d.modelChoice).length!==2||decided.some(d=>d.modelChoice&&d.decision.verdict==='auto'))throw Error('The fixed 50-request classifier replay changed.');
const bundledIds=bundles.flatMap(b=>b.ids);
if(new Set(bundledIds).size!==held.length||held.some(h=>!bundledIds.includes(h.request.id)))throw Error('Every held request must belong to exactly one bundle.');
if(traffic.caps.some(c=>c.surfaced.length>c.cap||c.surfaced.length+c.deferred.length!==bundles.length||c.expired.length))throw Error('The cap replay now differs from the displayed queue; review it.');
const definitions=[
 {id:'routine',amount:120,category:'allowed',party:'known',risk:'clean',grant:'valid',model:'ask',rule:8,verdict:'auto'},
 {id:'limit',amount:1000,category:'allowed',party:'known',risk:'clean',grant:'valid',model:'ask',rule:8,verdict:'auto'},
 {id:'over',amount:1001,category:'allowed',party:'known',risk:'clean',grant:'valid',model:'ask',rule:6,verdict:'human'},
 {id:'stranger',amount:120,category:'allowed',party:'new',risk:'clean',grant:'valid',model:'ask',rule:7,verdict:'human'},
 {id:'sensitive',amount:120,category:'sensitive',party:'known',risk:'clean',grant:'valid',model:'ask',rule:5,verdict:'human'},
 {id:'forbidden',amount:120,category:'forbidden',party:'known',risk:'clean',grant:'valid',model:'ask',rule:2,verdict:'deny'},
 {id:'risk',amount:120,category:'allowed',party:'known',risk:'flagged',grant:'valid',model:'ask',rule:4,verdict:'deny'},
 {id:'unavailable',amount:120,category:'allowed',party:'known',risk:'unavailable',grant:'valid',model:'ask',rule:4,verdict:'deny'},
 {id:'revoked',amount:120,category:'allowed',party:'known',risk:'clean',grant:'revoked',model:'ask',rule:1,verdict:'deny'},
 {id:'expired',amount:120,category:'allowed',party:'known',risk:'clean',grant:'expired',model:'ask',rule:3,verdict:'deny'},
 {id:'ask',amount:120,category:'unknown',party:'known',risk:'clean',grant:'valid',model:'ask',rule:9,verdict:'human'},
 {id:'drop',amount:120,category:'unknown',party:'known',risk:'clean',grant:'valid',model:'drop',rule:9,verdict:'deny'},
 {id:'combined',amount:1001,category:'allowed',party:'new',risk:'flagged',grant:'valid',model:'ask',rule:4,verdict:'deny'},
] as const;
const categoryMap={allowed:DEMO_POLICY.allow[0]!,sensitive:DEMO_POLICY.sensitive[0]!,forbidden:DEMO_POLICY.forbid[0]!,unknown:classification.category};
const examples=definitions.map(spec=>{
 const request:AgentRequest={...base,id:'criteria-'+spec.id,what:categoryMap[spec.category],who:spec.party==='known'?base.who:'first-contact.newco.eth',price:{amount:spec.amount,currency:'JPYC'}};
 const policy={...DEMO_POLICY,grants:DEMO_POLICY.grants.map(g=>g.category===request.what?{...g,revoked:spec.grant==='revoked',expiresAt:spec.grant==='expired'?'2025-01-01T00:00:00Z':g.expiresAt}:g)};
 const initial=route(request,policy,{...ctx,seenBefore:()=>spec.party==='known',screen:()=>spec.risk as ScreeningResult});
 const modelChoice=initial.rule===9?spec.model:null;
 const decision=modelChoice?applyClassification(initial,{...classification,suggestion:modelChoice}):initial;
 if(initial.rule!==spec.rule||decision.verdict!==spec.verdict)throw Error(`Criteria example changed: ${spec.id}`);
 const {rule:_rule,verdict:_verdict,model:_model,...input}=spec;
 return {id:spec.id,input,request,initial,decision,modelChoice};
});
const criteria={threshold:DEMO_POLICY.amountThreshold,dailyCap:DEMO_POLICY.dailyCap,notificationHour:DEMO_POLICY.notifyHour,examples};
const data={generatedFrom:'src/core/rules.ts + queue.ts + night.ts + src/ports/classifier.ts',seed:2,simulation:true,executable:false,cases,night,traffic,criteria};
writeFileSync('docs/launch/fixtures.js','window.YOHAKU_REPLAY = '+JSON.stringify(data,null,2)+';\n');
console.log(JSON.stringify({cases,night},null,2));
