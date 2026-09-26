/**
 * Set a night up on a running server, so a recording can start from a believable state.
 *
 *   npm run stage                 → the representative night, against the configured origin
 *   npm run stage -- --seed 7     → a different one
 *   npm run stage -- --url http://127.0.0.1:8402
 *
 * **It posts through the real endpoint.** Nothing is inserted behind the router's back, so
 * what appears on screen is what the rules decided — which is the only way the recording is
 * allowed to mean anything.
 *
 * Why this exists: the store is in memory, so every restart wipes the night, and a demo that
 * takes ten minutes of manual curl to rebuild is a demo nobody re-checks before recording.
 */

import { loadEnv } from '../src/core/env.js';
loadEnv();

import { asQuestion, generateNight } from '../src/core/night.js';

const arg = (name: string, fallback?: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1]! : fallback;
};

const url = (
  arg('url') ??
  process.env['AGENT_TARGET'] ??
  process.env['WORLD_REDIRECT_URI']?.replace(/\/auth\/world\/callback$/, '') ??
  ''
).replace(/\/$/, '');

if (!url) {
  console.error('set --url, or AGENT_TARGET, so this knows which server to stage');
  process.exit(1);
}

const seed = Number(arg('seed', '2'));
/** Hours ahead, so nothing expires while the camera is running. */
const hours = Number(arg('hours', '12'));
const stamp = Date.now().toString(36);

async function main() {
  const requests = generateNight(seed).map((r, i) => ({
    ...r,
    id: `n${stamp}-${String(i + 1).padStart(3, '0')}`,
    deadline: new Date(Date.now() + hours * 3_600_000).toISOString(),
  }));

  console.log(`\n  staging seed ${seed} → ${url}`);
  console.log(`  ${requests.length} requests, deadlines ${hours}h out\n`);

  const tally: Record<string, number> = {};
  const held: { id: string; what: string }[] = [];

  for (const request of requests) {
    const res = await fetch(`${url}/requests`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
    });
    const body = (await res.json().catch(() => ({}))) as { verdict?: string };
    /*
     * A 402 is an `auto` that has not been paid for — which is exactly right here. We are
     * staging the *decisions*, and the only transfer this demo should make is the one a
     * person presses Yes on while the camera is running.
     */
    const verdict = res.status === 402 ? 'auto (unpaid)' : (body.verdict ?? String(res.status));
    tally[verdict] = (tally[verdict] ?? 0) + 1;
    if (body.verdict === 'human') held.push({ id: request.id, what: request.what });
  }

  for (const [k, v] of Object.entries(tally).sort()) console.log(`  ${String(v).padStart(3)}  ${k}`);

  const ledger = (await (await fetch(`${url}/ledger/${process.env['ENS_NAME'] ?? 'alice.yohaku.eth'}`)).json()) as {
    arrived: number;
    denyCount: number;
    needsYou: { ids: string[] }[];
  };
  console.log(`\n  ledger: ${ledger.arrived} arrived, ${ledger.denyCount} dropped`);

  /*
   * Two notifications, not two requests — bundling is the whole point of the queue, and a
   * list of six links with no explanation reads like the cap is broken.
   */
  console.log(
    `\n  she gets ${ledger.needsYou.length} notification(s), covering ${ledger.needsYou
      .flatMap((b) => b.ids)
      .length} requests:`,
  );
  for (const bundle of ledger.needsYou) {
    const what = held.find((h) => h.id === bundle.ids[0])?.what ?? '';
    console.log(`\n    "${asQuestion(what)}"  — ${bundle.ids.length} companies asking`);
    console.log(`    open: ${url}/approve/${bundle.ids[0]}`);
  }

  console.log(`\n  the drop list:  ${url}/dropped`);
  console.log(`  a fresh one:    ${url}/try\n`);
  console.log('  ⚠️  do not restart the server after this — the night lives in memory.\n');
}

main().catch((e) => {
  console.error(`\n  staging stopped: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
