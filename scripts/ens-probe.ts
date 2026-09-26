import { readFileSync } from 'node:fs';
import { createPublicClient, http, isAddress } from 'viem';
import { sepolia } from 'viem/chains';
import { loadEnv } from '../src/core/env.js';
import { probeResolver } from '../src/adapters/ens-resolver.js';

loadEnv();
const config = JSON.parse(readFileSync(new URL('../config/ens-suggestions.json', import.meta.url), 'utf8'));
async function main() {
  const target: string = process.env.ENS_PROBE_ADDRESS ?? config.resolverImplementation.value;
  if (!isAddress(target)) throw new Error('Invalid probe address');
  const client = createPublicClient({ chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL ?? config.rpc.value, { retryCount: 0, timeout: 15000 }) });
  const result = await probeResolver(client, target);
  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    scope: 'decodeSetter compatibility only; no seller registration or grants verified',
    ...result,
  }, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
}
main().catch(() => {
  console.error('ENS probe failed: check RPC, chain and resolver ABI. No transaction was sent.');
  process.exitCode = 1;
});
