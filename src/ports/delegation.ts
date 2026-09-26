import type { Address } from 'viem';
import { KEYS, type PermissionsPort } from './permissions.js';

/**
 * Additional denial gate for the server-configured helper account.
 * A positive result does not authenticate the HTTP caller or authorize a transaction.
 */
export async function delegationDisabled(
  name: string,
  binding: { port: PermissionsPort; account: Address } | undefined,
): Promise<boolean> {
  if (!binding) return true;
  try {
    return await binding.port.isDelegationRevoked(name, binding.account)
      || !(await binding.port.canWrite(name, binding.account, KEYS.proposal));
  } catch {
    return true; // RPC failure, unknown seller or incompatible resolver all deny.
  }
}
