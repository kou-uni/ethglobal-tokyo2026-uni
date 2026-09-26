import { normalize } from 'viem/ens';
import { DEMO_POLICY } from '../core/night.js';
import type { Policy } from '../core/types.js';

/** The configured ENS name is also the router's owner; keep all other rules intact. */
export function serverPolicy(ensName?: string): Policy {
  if (!ensName?.trim()) return DEMO_POLICY;
  const owner = normalize(ensName.trim());
  if (!owner.endsWith('.eth') || owner === 'eth') throw new Error('ENS_NAME must be an .eth name');
  return { ...DEMO_POLICY, owner };
}
