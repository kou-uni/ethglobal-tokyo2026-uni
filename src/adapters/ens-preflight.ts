/**
 * Read-only preparation for the PINNED published ENS SDK.
 * This does not assert that Sepolia uses the same resolver version.
 */
import { createWalletClient, encodeFunctionData, http, namehash, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { computeResolverResource } from '@ensdomains/ensjs/public/v2';
import {
  grantResolverRolesWriteParameters,
  revokeResolverRolesWriteParameters,
} from '@ensdomains/ensjs/wallet/v2';
import { KEYS, keyResource } from '../ports/permissions.js';

export function permissionPreflight(input: {
  name: string;
  owner: Address;
  delegate: Address;
  resolver: Address;
}) {
  if (!input.name.trim()) throw new Error('An explicit ENS name is required');
  if (input.owner.toLowerCase() === input.delegate.toLowerCase()) {
    throw new Error('Owner and delegate must be different accounts');
  }
  // Address-only account: cannot sign. No RPC is called while preparing parameters.
  const client = createWalletClient({ chain: sepolia, account: input.owner, transport: http() });
  const params = {
    resolverAddress: input.resolver,
    targetAccount: input.delegate,
    scope: 'text' as const,
    name: input.name,
    key: KEYS.proposal,
  };
  const grant = grantResolverRolesWriteParameters(client, params);
  const revoke = revokeResolverRolesWriteParameters(client, params);
  if (grant.functionName !== 'authorizeTextRoles' || revoke.functionName !== 'authorizeTextRoles') {
    throw new Error('Published SDK changed: review resolver compatibility before continuing');
  }
  return {
    grant: { functionName: grant.functionName, data: encodeFunctionData(grant) },
    revoke: { functionName: revoke.functionName, data: encodeFunctionData(revoke) },
    resources: Object.values(KEYS).map((key) => ({
      key,
      // Published SDK combines namehash and key hash. Main branch uses key hash alone.
      publishedSdk: computeResolverResource(namehash(input.name), keyResource(key)),
      keyOnlyModel: BigInt(keyResource(key)),
    })),
  };
}
