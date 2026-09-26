/**
 * Read-only permission port for a configured seller's post-audit-2 resolver.
 * Binding is trusted server configuration, not name registration proof or caller authentication.
 */
import {
  decodeFunctionResult, encodeFunctionData, namehash, parseAbi, toHex,
  type Address, type PublicClient,
} from 'viem';
import { normalize, packetToBytes } from 'viem/ens';
import { KEYS, ROLE, keyResource, type PermissionsPort } from '../ports/permissions.js';
import { probeResolver, resolverAbi } from './ens-resolver.js';

const textAbi = parseAbi(['function text(bytes32 node, string key) view returns (string)']);

export class EnsPermissions implements PermissionsPort {
  private readonly seller: string;

  constructor(
    private readonly client: PublicClient,
    private readonly binding: { name: string; resolver: Address },
  ) {
    this.seller = normalize(binding.name);
    if (!this.seller) throw new Error('Seller name is required');
  }

  private async check(name: string) {
    if (normalize(name) !== this.seller) throw new Error('Name outside configured seller binding');
    // Never cache a successful check across requests: revocation and upgrades can happen.
    return probeResolver(this.client, this.binding.resolver);
  }

  async canWrite(name: string, account: Address, key: string): Promise<boolean> {
    const { blockNumber } = await this.check(name);
    // hasRoles includes effective root grants in the deployed EAC implementation.
    return this.client.readContract({
      address: this.binding.resolver, abi: resolverAbi, functionName: 'hasRoles',
      args: [BigInt(keyResource(key)), ROLE.SET_TEXT, account], blockNumber,
    });
  }

  async isDelegationRevoked(name: string, account: Address): Promise<boolean> {
    // No grant and revoked grant both disable proposals. This is not an event-history query.
    return !(await this.canWrite(name, account, KEYS.proposal));
  }

  async readText(name: string, key: string): Promise<string | undefined> {
    const { blockNumber } = await this.check(name);
    const encoded = await this.client.readContract({
      address: this.binding.resolver, abi: resolverAbi, functionName: 'resolve',
      args: [toHex(packetToBytes(this.seller)), encodeFunctionData({
        abi: textAbi, functionName: 'text', args: [namehash(this.seller), key],
      })], blockNumber,
    });
    const result = decodeFunctionResult({ abi: textAbi, functionName: 'text', data: encoded });
    return result || undefined;
  }
}
