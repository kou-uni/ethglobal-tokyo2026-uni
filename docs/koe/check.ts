/** Run: node --import tsx docs/koe/check.ts. --live checks three unsigned public requests. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createApp } from '../../src/server/app.js';
import { Store } from '../../src/server/state.js';
import { ASKS, DEMO_POLICY, KNOWN_PARTIES } from '../../src/core/night.js';
import { MockScreening } from '../../src/ports/screening.js';
const dir = JSON.parse(readFileSync(new URL('./directory.json', import.meta.url), 'utf8'));
const groups = { answers: ['auto', DEMO_POLICY.allow], needsToBeAsked: ['human', DEMO_POLICY.sensitive], willNotAnswer: ['deny', DEMO_POLICY.forbid] } as const;
const requests: { handle: string; base: string; expected: string; body: Record<string, unknown> }[] = [];
for (const p of dir.profiles) {
  assert.equal(p.interruptionsPerDay, DEMO_POLICY.dailyCap);
  for (const [group, [expected, allowed]] of Object.entries(groups)) {
    for (const topic of p[group]) {
      const ask = ASKS.find(a => a.what === topic);
      assert.ok(ask, `Unknown category ${topic}`);
      assert.equal(dir.howToAsk.purposeByTopic[topic], ask.purpose);
      assert.ok(allowed.includes(topic), `${p.handle}.${group} disagrees with policy: ${topic}`);
      if (expected === 'auto') assert.ok(p.priceFrom.amount <= DEMO_POLICY.amountThreshold);
      requests.push({ handle: p.handle, base: p.router, expected, body: {
        who: dir.howToAsk.exampleWho, what: topic, purpose: ask.purpose,
        price: p.priceFrom, deadline: new Date(Date.now() + 15 * 60_000).toISOString(),
      } });
    }
  }
}
assert.ok(KNOWN_PARTIES.includes(dir.howToAsk.exampleWho));
const live = process.argv.includes('--live');
const server = live ? undefined : createApp({ policy: DEMO_POLICY, store: new Store(KNOWN_PARTIES), screening: new MockScreening() });
if (server) await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
const selected = live ? ['auto', 'human', 'deny'].map(v => requests.find(r => r.expected === v)!) : requests;
const evidence = [];
try {
  for (const item of selected) {
    const base = server ? `http://127.0.0.1:${(server.address() as { port: number }).port}` : item.base;
    const response = await fetch(base + '/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item.body), signal: AbortSignal.timeout(20_000) });
    const body = await response.json() as Record<string, unknown>;
    assert.equal(body.verdict, item.expected, JSON.stringify({ topic: item.body.what, status: response.status, body }));
    assert.ok(item.expected === 'auto' ? [200, 402].includes(response.status) : response.status === (item.expected === 'human' ? 202 : 200));
    evidence.push({ topic: item.body.what, expected: item.expected, status: response.status, verdict: body.verdict, rule: body.rule ?? null, reason: body.reason, id: body.id, settlement: body.settlement ?? null });
  }
  if (live) writeFileSync(new URL('./evidence.json', import.meta.url), JSON.stringify({ checkedAt: new Date().toISOString(), endpoint: selected[0]!.base + '/requests', unsigned: true, paymentsSent: false, note: 'Three actual HTTP requests. No PAYMENT-SIGNATURE supplied. Category matching does not prove screening, personhood, content delivery or payment. Results are point-in-time observations.', results: evidence }, null, 2) + '\n');
  console.log(`${live ? 'Public' : 'Local'} HTTP: ${selected.length} requests matched the directory. No payment signatures sent.`);
  if (live) console.log(JSON.stringify(evidence, null, 2));
} finally {
  if (server) { server.closeAllConnections(); await new Promise<void>(r => server.close(() => r())); }
}
