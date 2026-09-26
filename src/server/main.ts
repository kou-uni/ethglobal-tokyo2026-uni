/**
 * Yohaku — run it.
 *
 *   npm start
 *
 * Wires the real router to whatever is actually configured. Anything not configured runs
 * with a stand-in that refuses in the same cases, and `GET /health` says which is which —
 * so a judge can see what is wired without reading the source.
 */

import { readFileSync } from 'node:fs';
import { loadEnv } from '../core/env.js';
loadEnv();

import { DEMO_POLICY, KNOWN_PARTIES } from '../core/night.js';
import { pastNights } from '../core/history.js';
import { chooseProvider } from '../ports/provider.js';
import { MockScreening } from '../ports/screening.js';
import { MockIdentity, type FreshnessPolicy } from '../ports/identity.js';
import { WorldIdentity } from '../adapters/world-oidc.js';
import { createApp } from './app.js';
import { X402Settlement, x402FromEnv } from '../adapters/x402.js';
import { Store } from './state.js';

const PORT = Number(process.env['PORT'] ?? 8402);

// Our own URLs come from package.json, not from a literal in source.
const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
  homepage?: string;
  repository?: { url?: string };
};

const provider = chooseProvider();

const freshness: FreshnessPolicy = {
  maxAgeSeconds: Number(process.env['WORLD_MAX_AGE_SECONDS'] ?? 120),
  requiredAcr: process.env['WORLD_REQUIRED_ACR'] ?? '',
};

const worldConfigured = Boolean(
  process.env['WORLD_ISSUER'] &&
    process.env['WORLD_CLIENT_ID'] &&
    process.env['WORLD_CLIENT_SECRET'] &&
    freshness.requiredAcr,
);

const redirectUri = process.env['WORLD_REDIRECT_URI'];

/*
 * Settlement is wired only when every piece of it is configured.
 *
 * A half-configured payment path is worse than none: it would let the server answer 200 to
 * an agent while nothing moved. `x402FromEnv` returns the list of what is missing, and we
 * print that list rather than starting in a state nobody can diagnose.
 */
const x402 = x402FromEnv(process.env);
const settlement = 'missing' in x402 ? undefined : new X402Settlement(x402);

const app = createApp({
  policy: DEMO_POLICY,
  store: new Store(KNOWN_PARTIES),
  screening: new MockScreening(),
  // Replayed through the same route(), so the fold shows the router's output, not a fixture.
  nights: pastNights(new Date()),
  ...(provider.live ? { classifier: provider.create() } : {}),
  ...(redirectUri ? { redirectUri } : {}),
  identityWired: worldConfigured && Boolean(redirectUri),
  ...(pkg.repository?.url ? { docsUrl: pkg.repository.url } : {}),
  ...(pkg.homepage ? { homeUrl: pkg.homepage } : {}),
  ...(settlement ? { settlement } : {}),
  ...(process.env['AGENT_PRIVATE_KEY'] ? { demoBuyerKey: process.env['AGENT_PRIVATE_KEY'] } : {}),
  ...(process.env['DEMO_SIGNS_PER_HOUR'] ? { demoSignsPerHour: Number(process.env['DEMO_SIGNS_PER_HOUR']) } : {}),
  ...(redirectUri ? { origin: redirectUri.replace(/\/auth\/world\/callback$/, '') } : {}),
  ...(process.env['X402_EXPLORER_URL'] ? { explorerUrl: process.env['X402_EXPLORER_URL'] } : {}),
  identity: worldConfigured
    ? new WorldIdentity({
        issuer: process.env['WORLD_ISSUER']!,
        clientId: process.env['WORLD_CLIENT_ID']!,
        clientSecret: process.env['WORLD_CLIENT_SECRET']!,
        policy: freshness,
      })
    : new MockIdentity(freshness),
});

/*
 * Ask the facilitator whether it supports what we are configured for, before anyone pays.
 *
 * Getting the network string wrong is a five-character mistake that only shows up at the
 * moment a judge tries to pay. This moves it to startup, where it is one line of output.
 */
if (settlement) {
  void settlement.assertSupported().then(
    () => console.log('\n  facilitator: supports exact on the configured network'),
    (e: Error) => console.error(`\n  ⚠️  facilitator check failed: ${e.message}`),
  );
}

app.listen(PORT, () => {
  console.log(`\n  yohaku — listening on http://127.0.0.1:${PORT}\n`);
  console.log(`    owner       ${DEMO_POLICY.owner}`);
  console.log(`    daily cap   ${DEMO_POLICY.dailyCap}`);
  console.log(`    classifier  ${provider.live ? `${provider.provider} / ${provider.model}` : 'not configured — rule 9 stays with the owner'}`);
  console.log(`    identity    ${worldConfigured && redirectUri ? `World ID → ${redirectUri}` : 'mock — approvals are not proving anything yet'}`);
  console.log(`    screening   mock`);
  console.log(
    `    settlement  ${
      settlement
        ? `x402 → ${(x402 as { network: string }).network}`
        : `not wired — missing ${'missing' in x402 ? x402.missing.join(', ') : ''}`
    }`,
  );
  console.log(
    `    /try        ${
      process.env['AGENT_PRIVATE_KEY'] && settlement
        ? 'pays a visitor into their own wallet, rate-limited'
        : 'shows the screens; pays nothing'
    }`,
  );
  console.log(`\n  the page she opens:   ${redirectUri ? redirectUri.replace(/\/auth\/world\/callback$/, '') : `http://127.0.0.1:${PORT}`}/approve/<id>`);
  console.log(`\n  try it:\n`);
  console.log(`    curl -s localhost:${PORT}/health | jq`);
  console.log(`    curl -s localhost:${PORT}/requests -X POST -H 'content-type: application/json' \\`);
  console.log(`      -d '{"who":"market-research.acme.eth","what":"purchase-intent/groceries",`);
  console.log(`           "purpose":"demand-estimation","price":{"amount":80,"currency":"JPYC"},`);
  console.log(`           "deadline":"2026-09-27T00:00:00Z"}' | jq\n`);
});
