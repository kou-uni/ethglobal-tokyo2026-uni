/**
 * Run one night through the real router and print what came out.
 *
 *   npm run seed            # today
 *   npm run seed -- 6       # the night used in the pitch
 *
 * Nothing here decides anything — generation lives in src/core/night.ts, shared with
 * the demo console, and every count below comes out of route().
 */

import { writeFileSync } from 'node:fs';
import { surface } from '../src/core/queue.js';
import { route } from '../src/core/rules.js';
import { DEMO_POLICY, MORNING, NIGHT, demoContext, generateNight } from '../src/core/night.js';
import type { HeldRequest } from '../src/core/types.js';

const seed = Number(process.argv[2] ?? Math.floor(Date.now() / 86_400_000));
const requests = generateNight(seed);
const ctx = demoContext(NIGHT);

const decided = requests.map((r) => ({ request: r, decision: route(r, DEMO_POLICY, ctx) }));
const auto = decided.filter((d) => d.decision.verdict === 'auto');
const denied = decided.filter((d) => d.decision.verdict === 'deny');
const held: HeldRequest[] = decided
  .filter((d) => d.decision.verdict === 'human')
  .map((d) => ({ ...d, heldAt: NIGHT.toISOString() }));

const morning = surface(held, DEMO_POLICY, MORNING);

const byRule = new Map<number, number>();
for (const d of decided) byRule.set(d.decision.rule, (byRule.get(d.decision.rule) ?? 0) + 1);

console.log(`\n  seed ${seed} — one night, run through the real router\n`);
console.log(`  arrived            ${decided.length}`);
console.log(`    auto             ${auto.length}   settled while she slept`);
console.log(`    deny             ${denied.length}   never reached her`);
console.log(`    human            ${held.length}   held`);
console.log(`\n  07:00 — daily cap ${DEMO_POLICY.dailyCap}`);
console.log(`    surfaced         ${morning.surfaced.length}  ${morning.surfaced.map((b) => b.category).join(', ')}`);
console.log(`    deferred         ${morning.deferred.length}`);
console.log(`    expired -> deny  ${morning.expired.length}`);
console.log(`\n  by rule`);
for (const rule of [...byRule.keys()].sort((a, b) => a - b)) {
  console.log(`    rule ${rule}           ${byRule.get(rule)}`);
}
console.log('');

writeFileSync('scripts/night.json', JSON.stringify({ seed, policy: DEMO_POLICY, decided, morning }, null, 2));
console.log('  -> scripts/night.json\n');
