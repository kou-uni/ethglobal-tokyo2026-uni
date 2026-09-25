/**
 * Run the classifier against a real request, for real.
 *
 *   npm run classify -- "health/sleep-tracking" 2400
 *
 * Prints what the model said and what actually happened to the request. The second part is
 * the point: the model's answer is an input to a decision it does not get to make.
 */

import { route } from '../src/core/rules.js';
import { DEMO_POLICY, NIGHT, demoContext } from '../src/core/night.js';
import { applyClassification, MockClassifier, type ClassifierPort } from '../src/ports/classifier.js';
import { ClaudeClassifier } from '../src/adapters/claude-classifier.js';
import type { AgentRequest } from '../src/core/types.js';

const what = process.argv[2] ?? 'unlisted/something-new';
const amount = Number(process.argv[3] ?? 200);

const req: AgentRequest = {
  id: 'cli',
  who: 'market-research.acme.eth',
  what,
  purpose: 'market-research',
  price: { amount, currency: 'JPYC' },
  deadline: new Date(NIGHT.getTime() + 12 * 3_600_000).toISOString(),
  payoutAddress: `0x${'1'.repeat(40)}`,
};

const hasKey = Boolean(process.env['ANTHROPIC_API_KEY'] || process.env['ANTHROPIC_AUTH_TOKEN']);
const classifier: ClassifierPort = hasKey ? new ClaudeClassifier() : new MockClassifier();

const first = route(req, DEMO_POLICY, demoContext(NIGHT));

console.log(`\n  request   ${req.what}  ·  ${req.price.amount} ${req.price.currency}`);
console.log(`  rules     ${first.verdict}  (rule ${first.rule})  — ${first.reason}`);

if (first.rule !== 9) {
  console.log(`\n  A rule decided this. The model is not consulted.\n`);
  process.exit(0);
}

if (!hasKey) {
  console.log('\n  ANTHROPIC_API_KEY is not set — using the mock, so no model ran.\n');
}

const c = await classifier.classify(req);
const final = applyClassification(first, c);

console.log(`\n  model     ${hasKey ? 'claude-opus-5' : 'mock'}`);
console.log(`    category      ${c.category}`);
console.log(`    sensitivity   ${c.sensitivity}`);
console.log(`    suggestion    ${c.suggestion}      <- only 'ask' or 'drop' exist`);
console.log(`    reasoning     ${c.reasoning}`);
console.log(`\n  outcome   ${final.verdict}  — ${final.reason}`);
console.log(`\n  The model narrowed this, or left it alone. It has no way to widen it.\n`);
