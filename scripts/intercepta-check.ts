/**
 * Ask the screening provider about an address, for real.
 *
 *   npm run intercepta:check                 # both confirmed fixtures
 *   npm run intercepta:check -- 0xabc…       # any address you want to look at
 *
 * One live call per address, and it prints the verdict, the provider's own words and how long
 * it took. This is the command that answers "is rule 4 actually wired?" without starting a
 * server — and the one to run before filming, because a key that has run out of requests fails
 * the same way a network does: `unavailable`, which denies.
 *
 * The key is read from `.env` and never printed.
 */

import { loadEnv } from '../src/core/env.js';
loadEnv();

import { InterceptaScreening, interceptaFromEnv, DENY_AT } from '../src/adapters/intercepta.js';
import { FIXTURES } from '../src/ports/screening.js';

const config = interceptaFromEnv(process.env);
if (!config) {
  console.error(
    '\n  Screening is not configured — run `npm run setup:intercepta` and paste the key.\n' +
      '  Without it rule 4 runs against the stand-in and /health reports screening: false.\n',
  );
  process.exit(1);
}

const asked = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const targets = asked.length
  ? asked.map((address) => ({ label: 'asked for', address }))
  : [
      { label: 'confirmed clean fixture', address: FIXTURES.clean },
      { label: 'confirmed flagged fixture', address: FIXTURES.flagged },
    ].flatMap((t) => (t.address ? [{ label: t.label, address: t.address }] : []));

if (!targets.length) {
  console.error('\n  No address to check, and no fixtures in config/intercepta-suggestions.json.\n');
  process.exit(1);
}

const port = new InterceptaScreening(config);

console.log(`\n  screening → ${config.baseUrl}`);
console.log(`  deny at ${DENY_AT} out of 100 — see src/adapters/intercepta.ts for why that line\n`);

let settled = 0;
for (const { label, address } of targets) {
  const started = Date.now();
  const result = await port.scan(address);
  const mark = result === 'clean' ? '✓ clean      ' : result === 'flagged' ? '✕ flagged    ' : '· unavailable';
  if (result === 'clean') settled += 1;
  console.log(`  ${mark}  ${address}`);
  console.log(`                  ${label}, ${Date.now() - started}ms`);
  console.log(`                  ${port.reasonFor(address) ?? 'no reason given'}\n`);
}

console.log(`  Only clean lets a payment through. ${settled} of ${targets.length} would settle.`);
console.log('  A verdict here is one input to a routing decision — not a judgement about a person.\n');
