import { feesFromEnv } from '../core/fees.js';
import { RoutingFees } from './routing-fees.js';
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

import { KNOWN_PARTIES } from '../core/night.js';
import { serverPolicy } from './policy.js';
import { pastNights } from '../core/history.js';
import { chooseProvider } from '../ports/provider.js';
import { MockScreening } from '../ports/screening.js';
import { InterceptaScreening, interceptaFromEnv } from '../adapters/intercepta.js';
import { MockIdentity, type FreshnessPolicy } from '../ports/identity.js';
import { WorldIdentity } from '../adapters/world-oidc.js';
import { createApp } from './app.js';
import { X402Settlement, x402FromEnv } from '../adapters/x402.js';
import { Store } from './state.js';
import { AttentionBudget } from './attention.js';
import { createPublicClient, http, isAddress } from 'viem';
import { sepolia } from 'viem/chains';
import { EnsPermissions } from '../adapters/ens-permissions.js';
import { productionProbeFromEnv } from './world-production-config.js';
import { idkitApprovalFromEnv } from './idkit-config.js';
import { ownerAuthFromEnv } from './owner-config.js';

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
const feePolicy = feesFromEnv(process.env);
const fees = feePolicy ? new RoutingFees(feePolicy, settlement?.quote(1, 'JPYC')) : undefined;

const resolverAddress = process.env.ENS_RESOLVER_ADDRESS;
const delegateAddress = process.env.ENS_DELEGATE_ADDRESS;
const policy = serverPolicy(process.env.ENS_NAME);
const ensName = process.env.ENS_NAME?.trim() ? policy.owner : undefined;
const ensRpc = process.env.SEPOLIA_RPC_URL;
const delegation = ensRpc && ensName
  && resolverAddress && isAddress(resolverAddress)
  && delegateAddress && isAddress(delegateAddress)
  ? {
      port: new EnsPermissions(
        createPublicClient({ chain: sepolia, transport: http(ensRpc, { retryCount: 0, timeout: 15000 }) }),
        { name: ensName, resolver: resolverAddress },
      ),
      account: delegateAddress,
    }
  : undefined;

/*
 * Rule 4 against the real thing, or not at all.
 *
 * With the key present, every declared payment address is checked by a live call before
 * anything can settle. Without it we keep the stand-in and `/health` keeps reporting
 * `screening: false` — a server that cannot screen should say so rather than imply a check
 * it never made.
 */
const intercepta = interceptaFromEnv(process.env);
if (settlement && !intercepta) throw new Error('Live settlement requires live screening configuration');
const screening = intercepta ? new InterceptaScreening(intercepta) : new MockScreening();

const idkitDemo = await idkitApprovalFromEnv(process.env);
if (settlement && !idkitDemo) throw new Error('Live settlement requires production IDKit approval; mock identity is not allowed');
if (idkitDemo) {
  const owner = ownerAuthFromEnv(process.env, idkitDemo.origin);
  if (owner) idkitDemo.owner = owner;
}
const app = createApp({
  ...(fees ? { fees } : {}),
  ...(idkitDemo ? { idkitDemo } : {}),
  productionProbe: productionProbeFromEnv(process.env),
  ...(delegation ? { delegation } : {}),
  policy,
  store: new Store(KNOWN_PARTIES, new AttentionBudget(process.env.ATTENTION_STATE_FILE ?? '.yohaku/attention.json'),
    process.env.REQUEST_STATE_FILE ?? '.yohaku/requests.json'),
  screening,
  screeningWired: Boolean(intercepta),
  // Replayed through the same route(), so the fold shows the router's output, not a fixture.
  nights: pastNights(new Date(), 4, policy),
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
  console.log(`    owner       ${policy.owner}`);
  console.log(`    daily cap   ${policy.dailyCap}`);
  console.log(`    ENS reader  ${delegation ? `configured for ${policy.owner}` : 'not configured — delegate requests are denied'}`);
  console.log(`    classifier  ${provider.live ? `${provider.provider} / ${provider.model}` : 'not configured — rule 9 stays with the owner'}`);
  console.log(`    identity    ${idkitDemo ? `IDKit production — visitor demos${idkitDemo.owner ? ' and wallet-authenticated owner inbox at /owner' : ' only'}` : worldConfigured && redirectUri ? `World ID → ${redirectUri}` : 'mock — approvals are not proving anything yet'}`);
  console.log(
    `    screening   ${
      intercepta
        ? 'live — every declared payment address is checked before anything settles'
        : 'not configured — rule 4 runs against the stand-in, /health says screening: false'
    }`,
  );
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
