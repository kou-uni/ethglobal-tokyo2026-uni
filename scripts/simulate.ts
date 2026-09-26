/**
 * Agents, arriving.
 *
 *   npm run simulate                    one night, as fast as the server will take it
 *   npm run simulate -- --live --rate 6 six an hour, in real time, until you stop it
 *   npm run simulate -- --count 20 --seed 3
 *
 * Every request goes through the public endpoint, so what you watch is the router deciding —
 * not a script printing what it would have decided.
 */

import { loadEnv } from '../src/core/env.js';
loadEnv();

import { generateJobs } from '../src/core/simulator.js';

const arg = (n: string, d?: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1]! : d;
};
const has = (n: string) => process.argv.includes(`--${n}`);

const url = (
  arg('url') ??
  process.env['AGENT_TARGET'] ??
  process.env['WORLD_REDIRECT_URI']?.replace(/\/auth\/world\/callback$/, '') ??
  ''
).replace(/\/$/, '');
if (!url) {
  console.error('set --url, or AGENT_TARGET, so this knows where to send work');
  process.exit(1);
}

const seed = Number(arg('seed', String(Math.floor(Date.now() / 60000) % 1000)));
const count = Number(arg('count', '52'));
const live = has('live');
const perHour = Number(arg('rate', '60'));
const gap = live ? Math.max(250, 3_600_000 / perHour) : 120;

const MARK: Record<string, string> = {
  auto: '✓ auto ', human: '↑ human', deny: '✗ deny ',
};

async function main() {
  const jobs = generateJobs(seed, count);
  console.log(`\n  ${jobs.length} agents → ${url}`);
  console.log(live ? `  live, about ${perHour}/hour\n` : `  seed ${seed}\n`);

  const tally: Record<string, number> = {};
  for (const [i, job] of jobs.entries()) {
    const res = await fetch(`${url}/requests`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(job.request),
    }).catch(() => undefined);

    // A 402 is an `auto` waiting to be paid for. Staging decisions, not transfers.
    const body = res ? ((await res.json().catch(() => ({}))) as { verdict?: string; reason?: string }) : {};
    const verdict = res?.status === 402 ? 'auto' : (body.verdict ?? 'unreachable');
    tally[verdict] = (tally[verdict] ?? 0) + 1;

    console.log(
      `  ${String(i + 1).padStart(3)}  ${MARK[verdict] ?? verdict}  ${job.buyer.sector}`,
    );
    console.log(`        "${job.question}"`);
    console.log(`        ${job.buyer.who} · ${job.request.price.amount} JPYC · ${body.reason ?? ''}`);
    if (gap) await new Promise((r) => setTimeout(r, gap));
  }

  console.log('\n  ' + Object.entries(tally).sort().map(([k, v]) => `${k} ${v}`).join('  ·  '));
  console.log(`\n  what she was asked about:  ${url}/ledger/${process.env['ENS_NAME'] ?? 'alice.yohaku.eth'}`);
  console.log(`  what never reached her:    ${url}/dropped\n`);
}

main().catch((e) => {
  console.error(`\n  stopped: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
