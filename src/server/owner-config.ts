import { readFileSync } from 'node:fs';
import { createPublicClient, http, isAddress } from 'viem';
import { sepolia } from 'viem/chains';
import { EnsPermissions } from '../adapters/ens-permissions.js';
import { KEYS } from '../ports/permissions.js';
import { OwnerAuth } from './owner-auth.js';

export function ownerAddress(env: NodeJS.ProcessEnv, binding: { name: string; resolver: string; owner: string }) {
  if (env.OWNER_WALLET_ADDRESS) {
    if (!isAddress(env.OWNER_WALLET_ADDRESS)) throw new Error('Invalid OWNER_WALLET_ADDRESS');
    return env.OWNER_WALLET_ADDRESS;
  }
  // Never borrow the demo owner's identity for a different configured seller.
  if (env.ENS_NAME === binding.name && env.ENS_RESOLVER_ADDRESS?.toLowerCase() === binding.resolver.toLowerCase()
    && isAddress(binding.owner)) return binding.owner;
  return undefined;
}

export function ownerAuthFromEnv(env: NodeJS.ProcessEnv, origin: string): OwnerAuth | undefined {
  const binding = JSON.parse(readFileSync(new URL('../../config/ens-deployment.json', import.meta.url), 'utf8'));
  const address = ownerAddress(env, binding);
  if (!address) return undefined;
  const name = env.ENS_NAME, resolver = env.ENS_RESOLVER_ADDRESS, rpc = env.SEPOLIA_RPC_URL;
  if (!name || !resolver || !isAddress(resolver) || !rpc) throw new Error('Owner approval requires a configured ENS resolver and RPC');
  const client = createPublicClient({ chain: sepolia, transport: http(rpc, { retryCount: 0, timeout: 15000 }) });
  const permissions = new EnsPermissions(client, { name, resolver });
  return new OwnerAuth({
    origin, address, name,
    verify: (message, signature) => client.verifyMessage({ address, message, signature }),
    authority: () => permissions.canWrite(name, address, KEYS.policy),
  });
}
