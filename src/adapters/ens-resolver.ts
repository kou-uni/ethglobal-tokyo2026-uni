/**
 * post-audit-2 resolver ABI. Sources: config/ens-suggestions.json.
 * This family uses DNS bytes for setters, not the published SDK's namehash ABI.
 */
import {
  encodeFunctionData, parseAbi, toHex, type Address, type PublicClient,
} from 'viem';
import { packetToBytes } from 'viem/ens';
import { KEYS, keyResource, ROLE } from '../ports/permissions.js';

export const resolverAbi = parseAbi([
  'error EACUnauthorizedAccountRoles(uint256 resource, uint256 roleBitmap, address account)',
  'function setText(bytes name, string key, string value)',
  'function grantSetterRoles(bytes setter, address account) returns (bool)',
  'function revokeRoles(uint256 resource, uint256 roleBitmap, address account) returns (bool)',
  'function decodeSetter(bytes setter) pure returns (bytes arg, uint256 resource, uint256 roleBitmap)',
  'function hasRoles(uint256 resource, uint256 roleBitmap, address account) view returns (bool)',
  'function resolve(bytes name, bytes data) view returns (bytes)',
]);

export function textSetter(name: string, key: string, value = '') {
  return encodeFunctionData({
    abi: resolverAbi, functionName: 'setText',
    args: [toHex(packetToBytes(name)), key, value],
  });
}

/** Prepares calldata only. No key, signature or transaction submission. */
export function proposalTransactions(name: string, delegate: Address) {
  if (!name.trim()) throw new Error('An explicit seller name is required');
  return {
    grant: encodeFunctionData({
      abi: resolverAbi, functionName: 'grantSetterRoles',
      args: [textSetter(name, KEYS.proposal), delegate],
    }),
    revoke: encodeFunctionData({
      abi: resolverAbi, functionName: 'revokeRoles',
      args: [BigInt(keyResource(KEYS.proposal)), ROLE.SET_TEXT, delegate],
    }),
  };
}

/** Proves ABI/resource decoding only; does not prove grants or name registration. */
export async function probeResolver(client: PublicClient, resolver: Address) {
  if (await client.getChainId() !== 11155111) throw new Error('Expected Ethereum Sepolia');
  const blockNumber = await client.getBlockNumber();
  const code = await client.getCode({ address: resolver, blockNumber });
  if (!code || code === '0x') throw new Error('No resolver code');
  const keys = [];
  // Public RPCs may refuse a burst of parallel eth_call requests. Keep the probe
  // sequential; every permission decision still reads the current block.
  for (const key of Object.values(KEYS)) {
    // The decoder ignores the name and value; confirm this using the root name.
    const [arg, resource, roleBitmap] = await client.readContract({
      address: resolver, abi: resolverAbi, functionName: 'decodeSetter',
      args: [textSetter('', key)], blockNumber,
    });
    if (arg !== toHex(key) || resource !== BigInt(keyResource(key)) || roleBitmap !== ROLE.SET_TEXT) {
      throw new Error('Resolver does not match the expected key-scoped text permissions');
    }
    keys.push({ key, arg, resource, roleBitmap });
  }
  return { chainId: 11155111, resolver, blockNumber, codeBytes: (code.length - 2) / 2, keys };
}
