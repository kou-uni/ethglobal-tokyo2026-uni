/**
 * Yohaku — run it.
 *
 *   npm start
 *
 * Wires the real router to whatever is actually configured. Anything not configured runs
 * with a stand-in that refuses in the same cases, and `GET /health` says which is which —
 * so a judge can see what is wired without reading the source.
 */

import { loadEnv } from '../core/env.js';
loadEnv();

import { DEMO_POLICY, KNOWN_PARTIES } from '../core/night.js';
import { pastNights } from '../core/history.js';
import { chooseProvider } from '../ports/provider.js';
import { MockScreening } from '../ports/screening.js';
import { MockIdentity, type FreshnessPolicy } from '../ports/identity.js';
import { WorldIdentity } from '../adapters/world-oidc.js';
import { createApp } from './app.js';
import { Store } from './state.js';

const PORT = Number(process.env['PORT'] ?? 8402);

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

const app = createApp({
  policy: DEMO_POLICY,
  store: new Store(KNOWN_PARTIES),
  screening: new MockScreening(),
  // Replayed through the same route(), so the fold shows the router's output, not a fixture.
  nights: pastNights(new Date()),
  ...(provider.live ? { classifier: provider.create() } : {}),
  ...(redirectUri ? { redirectUri } : {}),
  identityWired: worldConfigured && Boolean(redirectUri),
  identity: worldConfigured
    ? new WorldIdentity({
        issuer: process.env['WORLD_ISSUER']!,
        clientId: process.env['WORLD_CLIENT_ID']!,
        clientSecret: process.env['WORLD_CLIENT_SECRET']!,
        policy: freshness,
      })
    : new MockIdentity(freshness),
});

app.listen(PORT, () => {
  console.log(`\n  yohaku — listening on http://127.0.0.1:${PORT}\n`);
  console.log(`    owner       ${DEMO_POLICY.owner}`);
  console.log(`    daily cap   ${DEMO_POLICY.dailyCap}`);
  console.log(`    classifier  ${provider.live ? `${provider.provider} / ${provider.model}` : 'not configured — rule 9 stays with the owner'}`);
  console.log(`    identity    ${worldConfigured && redirectUri ? `World ID → ${redirectUri}` : 'mock — approvals are not proving anything yet'}`);
  console.log(`    screening   mock`);
  console.log(`    settlement  not wired`);
  console.log(`\n  the page she opens:   ${redirectUri ? redirectUri.replace(/\/auth\/world\/callback$/, '') : `http://127.0.0.1:${PORT}`}/approve/<id>`);
  console.log(`\n  try it:\n`);
  console.log(`    curl -s localhost:${PORT}/health | jq`);
  console.log(`    curl -s localhost:${PORT}/requests -X POST -H 'content-type: application/json' \\`);
  console.log(`      -d '{"who":"market-research.acme.eth","what":"purchase-intent/groceries",`);
  console.log(`           "purpose":"demand-estimation","price":{"amount":80,"currency":"JPYC"},`);
  console.log(`           "deadline":"2026-09-27T00:00:00Z"}' | jq\n`);
});
