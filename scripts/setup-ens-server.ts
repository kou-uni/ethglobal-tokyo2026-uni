/** Validate public evidence before writing only ENS settings. Never reads or prints keys. */
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { verifyDelegationProof } from '../src/adapters/ens-delegation-proof.js';

const deployed = JSON.parse(readFileSync(new URL('../config/ens-deployment.json', import.meta.url), 'utf8'));
const sources = JSON.parse(readFileSync(new URL('../config/ens-suggestions.json', import.meta.url), 'utf8'));
const evidence = JSON.parse(readFileSync(new URL('../docs/build/evidence/ens-delegation.json', import.meta.url), 'utf8'));
const rpc = process.env.SEPOLIA_RPC_URL || sources.rpc.value;
const client = createPublicClient({ chain: sepolia, transport: http(rpc, { timeout: 15000, retryCount: 0 }) });
await verifyDelegationProof(client, { ...deployed, registry: sources.registry.value, rpc }, {
  delegate: evidence.delegate, value: evidence.proposal,
  hashes: evidence.transactions.map((t: { hash: `0x${string}` }) => t.hash),
});
const values = {
  SEPOLIA_RPC_URL: rpc,
  ENS_NAME: deployed.name,
  ENS_RESOLVER_ADDRESS: deployed.resolver,
  ENS_DELEGATE_ADDRESS: evidence.delegate,
};
if (!process.argv.includes('--write')) {
  console.log(`Verified ${deployed.name}. Use --write to save ENS settings; no changes made.`);
} else {
  const path = '.env';
  let text = existsSync(path) ? readFileSync(path, 'utf8') : '';
  for (const [key, value] of Object.entries(values)) {
    if (typeof value !== 'string' || /[\r\n]/.test(value)) throw new Error(`Invalid ${key}`);
    const re = new RegExp(`^${key}=.*$`, 'gm');
    text = re.test(text) ? text.replace(re, () => `${key}=${value}`) : `${text.trimEnd()}\n${key}=${value}\n`;
  }
  writeFileSync(path, text, { mode: 0o600 }); chmodSync(path, 0o600);
  console.log(`Saved ENS settings for ${deployed.name}. The proven delegate is revoked: requests must deny.`);
  console.log('Restart the server to apply. No transaction was signed or sent.');
}
