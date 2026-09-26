// Rebuild with: node --import tsx docs/launch/build.ts
// Read-only fixtures from the real core. Never calls a provider or signs a payment.
import {writeFileSync, readFileSync} from 'node:fs';
import {route} from '../../src/core/rules.js';
import {surface,onDeadline} from '../../src/core/queue.js';
import {DEMO_POLICY,NIGHT,MORNING,demoContext,generateNight} from '../../src/core/night.js';
import type {AgentRequest} from '../../src/core/types.js';
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
const decided=generateNight(2).map(request=>({request,decision:route(request,DEMO_POLICY,ctx),heldAt:NIGHT.toISOString()}));
const held=decided.filter(d=>d.decision.verdict==='human');
const night={arrived:decided.length,auto:decided.filter(d=>d.decision.verdict==='auto').length,deny:decided.filter(d=>d.decision.verdict==='deny').length,caps:[0,1,2,3,4].map(dailyCap=>({cap:dailyCap,surfaced:surface(held,{...DEMO_POLICY,dailyCap},MORNING).surfaced.length}))};
if(cases.auto.verdict!=='auto'||cases.human.verdict!=='human'||cases.risk.rule!==4||cases.silence.verdict!=='deny'||cases.unknown.verdict!=='deny')throw Error('Core behavior changed; review the presentation.');
const data={generatedFrom:'src/core/rules.ts + queue.ts + night.ts',seed:2,simulation:true,executable:false,cases,night};
writeFileSync('docs/launch/fixtures.js','window.YOHAKU_REPLAY = '+JSON.stringify(data,null,2)+';\n');
console.log(JSON.stringify({cases,night},null,2));
