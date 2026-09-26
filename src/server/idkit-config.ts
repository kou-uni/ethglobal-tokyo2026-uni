import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { signRequest } from '@worldcoin/idkit-server';
import { privateKeyToAccount } from 'viem/accounts';
import { verifyIdkitProof } from '../adapters/idkit-proof.js';
import type { IdkitApprovalOptions } from './idkit-approval.js';

/** Explicit opt-in; a broken production configuration never falls back to the sandbox. */
export async function idkitApprovalFromEnv(env: NodeJS.ProcessEnv): Promise<IdkitApprovalOptions | undefined> {
  if (env.WORLD_IDKIT_DEMO_ENABLED !== 'true') return undefined;
  const deployment = env.WORLD_IDKIT_DEPLOYMENT ?? 'local';
  if (deployment !== 'local' && deployment !== 'public') throw new Error('Unknown IDKit deployment');
  const file = deployment === 'public' ? 'world-idkit-public.json' : 'world-idkit.json';
  const config = JSON.parse(readFileSync(new URL(`../../config/${file}`, import.meta.url), 'utf8'));
  const key = env.WORLD_IDKIT_SIGNING_KEY;
  const origin = env.WORLD_IDKIT_ORIGIN;
  if (!key || !/^0x[0-9a-f]{64}$/i.test(key)
    || !origin || config.rpRegistrationVerified !== true || config.environment !== 'production') throw new Error('IDKit approval configuration is incomplete');
  const u = new URL(origin);
  if (u.origin !== origin || u.username || u.password
    || !(u.protocol === 'https:' || (u.protocol === 'http:' && u.hostname === '127.0.0.1'))) throw new Error('IDKit requires an HTTPS origin or loopback');
  if (privateKeyToAccount(key as `0x${string}`).address.toLowerCase() !== config.signerAddress.toLowerCase()) throw new Error('IDKit signer does not match the registered public configuration');
  const bundle = await build({
    entryPoints: [new URL('../../setup/idkit-approval.ts', import.meta.url).pathname],
    bundle: true, platform: 'browser', format: 'esm', target: 'es2022', minify: true, write: false,
  });
  const koeBundle = await build({
    entryPoints: [new URL('../../setup/koe-registration.ts', import.meta.url).pathname],
    bundle: true, platform: 'browser', format: 'esm', target: 'es2022', minify: true, write: false,
  });
  const experienceBundle = env.YOHAKU_EXPERIENCE_ENABLED === 'true' ? await build({
    entryPoints: [new URL('../../setup/experience.ts', import.meta.url).pathname],
    bundle: true, platform: 'browser', format: 'esm', target: 'es2022', minify: true, write: false,
  }) : undefined;
  return {
    origin, appId: config.appId, action: config.action,
    sign: () => {
      const s = signRequest({ signingKeyHex: key as `0x${string}`, action: config.action, ttl: 120 });
      return { rp_id: config.rpId, nonce: s.nonce, signature: s.sig, created_at: s.createdAt, expires_at: s.expiresAt };
    },
    verify: (c, proof) => verifyIdkitProof(config, c, proof),
    assets: {
      page: readFileSync(new URL('../../setup/idkit-approval.html', import.meta.url), 'utf8'),
      js: bundle.outputFiles[0]!.contents,
      wasm: readFileSync(new URL('../../node_modules/@worldcoin/idkit-core/dist/idkit_wasm_bg.wasm', import.meta.url)),
      koePage: readFileSync(new URL('../../setup/koe-registration.html', import.meta.url), 'utf8'),
      koeJs: koeBundle.outputFiles[0]!.contents,
      ...(experienceBundle ? {
        experiencePage: readFileSync(new URL('../../setup/experience.html', import.meta.url), 'utf8'),
        experienceJs: experienceBundle.outputFiles[0]!.contents,
      } : {}),
    },
  };
}
