/**
 * npm run ens:check           — offline SDK diagnostics with labelled fixtures
 * npm run ens:check -- --rpc  — read-only Sepolia simulation; never signs or sends
 */
import { createPublicClient, http, isAddress, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { loadEnv } from '../src/core/env.js';
import { permissionPreflight } from '../src/adapters/ens-preflight.js';

loadEnv();
const live = process.argv.includes('--rpc');
function address(key: string, fixture: Address): Address {
  const value = live ? process.env[key] : fixture;
  if (!value || !isAddress(value)) throw new Error(`Set a valid ${key}`);
  return value;
}

async function main() {
  const name = live ? process.env.ENS_NAME : 'alice.yohaku.eth';
  if (!name) throw new Error('Set ENS_NAME');
  const owner = address('ENS_OWNER_ADDRESS', '0x1111111111111111111111111111111111111111');
  const delegate = address('ENS_DELEGATE_ADDRESS', '0x2222222222222222222222222222222222222222');
  const resolver = address('ENS_RESOLVER_ADDRESS', '0x3333333333333333333333333333333333333333');
  const plan = permissionPreflight({ name, owner, delegate, resolver });
  console.log(live ? 'READ-ONLY RPC SIMULATION' : 'OFFLINE — fixture addresses, no chain evidence');
  console.log(JSON.stringify(plan, (_, v) => typeof v === 'bigint' ? `0x${v.toString(16)}` : v, 2));
  console.log('Published SDK uses authorizeTextRoles and name-scoped resources.');
  console.log('Do not use the key-only mock as a deployed permission check.');
  if (!live) return;
  const url = process.env.SEPOLIA_RPC_URL;
  if (!url) throw new Error('Set SEPOLIA_RPC_URL');
  const client = createPublicClient({ chain: sepolia, transport: http(url, { retryCount: 0, timeout: 15000 }) });
  if (await client.getChainId() !== sepolia.id) throw new Error('RPC is not Sepolia');
  const blockNumber = await client.getBlockNumber();
  const code = await client.getCode({ address: resolver, blockNumber });
  if (!code || code === '0x') throw new Error('No code at ENS_RESOLVER_ADDRESS');
  // eth_call only: neither transaction is persisted. Revoke is NOT after grant.
  for (const action of ['grant', 'revoke'] as const) {
    await client.call({ account: owner, to: resolver, data: plan[action].data, blockNumber });
    console.log(`${action}: eth_call completed at block ${blockNumber}`);
  }
  console.log('Simulation only. No grant persisted; actual writes and refusal evidence are still required.');
}

main().catch(() => {
  // Provider errors can contain credentialled RPC URLs. Never print their raw payload.
  console.error('ENS preflight failed. Check required variables, Sepolia, resolver version and owner permissions. No transaction sent.');
  process.exitCode = 1;
});
