import { readFileSync } from 'node:fs';
import { ProductionWorldIdentity, type ProductionWorldConfig } from '../adapters/world-production.js';
import { createProductionProbe } from './world-production-probe.js';

export function productionWorldConfig(env: NodeJS.ProcessEnv): ProductionWorldConfig | undefined {
  if (env.WORLD_PRODUCTION_ENABLED !== 'true') return undefined;
  const source = JSON.parse(readFileSync(new URL('../../config/world-production.json', import.meta.url), 'utf8'));
  const clientId = env.WORLD_PRODUCTION_CLIENT_ID?.trim();
  const clientSecret = env.WORLD_PRODUCTION_CLIENT_SECRET?.trim();
  const redirectUri = env.WORLD_PRODUCTION_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) throw new Error('Production World credentials and callback required');
  const callback = new URL(redirectUri);
  if (callback.protocol !== 'https:' || callback.pathname !== source.callbackPath
    || callback.search || callback.hash || callback.username || callback.password) {
    throw new Error('Production World callback must be HTTPS with the dedicated callback path');
  }
  return { issuer: source.issuer, requiredAcr: source.requiredAcr, clientId, clientSecret, redirectUri };
}

export function productionProbeFromEnv(env: NodeJS.ProcessEnv) {
  try {
    const config = productionWorldConfig(env);
    return createProductionProbe(config ? { identity: new ProductionWorldIdentity(config), redirectUri: config.redirectUri } : undefined);
  } catch {
    // A misconfigured optional probe must not switch or break the existing sandbox demo.
    console.error('World production test disabled: check dedicated production settings.');
    return createProductionProbe();
  }
}
