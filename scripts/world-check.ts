/**
 * Ask the issuer what it actually supports, and check our freshness policy against it.
 *
 *   npm run world:check
 *
 * Nothing here is asserted from documentation. If the endpoints move or the assurance level
 * is renamed, this is where it shows up — before the flow is wired, not during a demo.
 */

import { loadEnv } from '../src/core/env.js';
loadEnv();

import { WorldIdentity } from '../src/adapters/world-oidc.js';
import type { FreshnessPolicy } from '../src/ports/identity.js';

const issuer = process.env['WORLD_ISSUER'];
if (!issuer) {
  console.error('\n  WORLD_ISSUER is not set. See .env.example.\n');
  process.exit(1);
}

const policy: FreshnessPolicy = {
  maxAgeSeconds: Number(process.env['WORLD_MAX_AGE_SECONDS'] ?? 120),
  requiredAcr: process.env['WORLD_REQUIRED_ACR'] ?? '',
};

const url = `${issuer.replace(/\/$/, '')}/.well-known/openid-configuration`;
const res = await fetch(url);
if (!res.ok) {
  console.error(`\n  discovery failed: ${res.status} at ${url}\n`);
  process.exit(1);
}
const d = (await res.json()) as Record<string, unknown>;

console.log(`\n  ${issuer}\n`);
for (const k of [
  'issuer',
  'authorization_endpoint',
  'token_endpoint',
  'jwks_uri',
  'userinfo_endpoint',
]) {
  if (d[k]) console.log(`    ${k.padEnd(24)} ${String(d[k])}`);
}
const acrs = (d['acr_values_supported'] as string[] | undefined) ?? [];
console.log(`\n    acr_values_supported     ${acrs.join(', ') || '(none advertised)'}`);
console.log(`    claims_supported         ${((d['claims_supported'] as string[]) ?? []).join(', ')}`);

const hasAuthTime = ((d['claims_supported'] as string[]) ?? []).includes('auth_time');
console.log(`\n  freshness can be checked: ${hasAuthTime ? 'yes — auth_time is published' : 'NO — auth_time is not in claims_supported'}`);

if (!policy.requiredAcr) {
  console.log(`\n  WORLD_REQUIRED_ACR is not set. Pick one of the above and put it in .env.\n`);
  process.exit(1);
}

const w = new WorldIdentity({ issuer, clientId: 'check', clientSecret: 'check', policy });
try {
  await w.assertAcrSupported();
  console.log(`  our required acr is offered:  yes — ${policy.requiredAcr}`);
} catch (e) {
  console.log(`  our required acr is offered:  NO — ${e instanceof Error ? e.message : e}`);
  process.exit(1);
}

const redirectUri = process.env['WORLD_REDIRECT_URI'];
if (!redirectUri) {
  // No placeholder on purpose: a stand-in URL here would make an unconfigured setup look
  // like a working one, and the portal will not accept http://localhost anyway.
  console.log(
    `\n  WORLD_REDIRECT_URI is not set, so the request cannot be shown.` +
      `\n  It must be HTTPS — the portal rejects http://localhost.\n`,
  );
  process.exit(0);
}

const begin = await w.beginUrl({ state: 'example-state', nonce: 'example-nonce', redirectUri });
console.log(`\n  the request we would send:\n\n    ${begin}\n`);
