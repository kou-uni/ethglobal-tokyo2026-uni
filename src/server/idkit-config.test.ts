import { describe, expect, it, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { idkitApprovalFromEnv } from './idkit-config.js';

// Exercise deployment selection without either real server's secret key.
const account = vi.hoisted(() => ({ address: '' }));
vi.mock('viem/accounts', () => ({ privateKeyToAccount: () => account }));
vi.mock('esbuild', () => ({ build: async () => ({ outputFiles: [{ contents: new Uint8Array() }] }) }));
afterEach(() => { account.address = ''; });
const env = {
  WORLD_IDKIT_DEMO_ENABLED: 'true',
  WORLD_IDKIT_SIGNING_KEY: `0x${'1'.repeat(64)}`,
  WORLD_IDKIT_ORIGIN: 'http://127.0.0.1:8404',
};
function config(publicApp: boolean) {
  const file = publicApp ? 'world-idkit-public.json' : 'world-idkit.json';
  return JSON.parse(readFileSync(new URL(`../../config/${file}`, import.meta.url), 'utf8'));
}
describe('separate IDKit deployments', () => {
  it('preserves the local app as default and explicitly selects the public app', async () => {
    for (const publicApp of [false, true]) {
      const c = config(publicApp);
      account.address = c.signerAddress;
      const options = await idkitApprovalFromEnv({
        ...env, ...(publicApp ? { WORLD_IDKIT_DEPLOYMENT: 'public' } : {}),
      });
      expect(options?.appId).toBe(c.appId);
    }
    expect(config(false).appId).not.toBe(config(true).appId);
    expect(config(false).signerAddress).not.toBe(config(true).signerAddress);
  });
  it('refuses the local signer for the public app', async () => {
    account.address = config(false).signerAddress;
    await expect(idkitApprovalFromEnv({ ...env, WORLD_IDKIT_DEPLOYMENT: 'public' })).rejects.toThrow('signer does not match');
  });
  it('refuses an unknown selection rather than using another app', async () => {
    await expect(idkitApprovalFromEnv({ ...env, WORLD_IDKIT_DEPLOYMENT: 'typo' })).rejects.toThrow('Unknown IDKit deployment');
  });
});
