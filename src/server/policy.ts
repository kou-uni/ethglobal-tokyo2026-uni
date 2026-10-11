import { normalize } from 'viem/ens';
import { DEMO_POLICY } from '../core/night.js';
import type { Policy } from '../core/types.js';

/**
 * The configured ENS name is also the router's owner; keep all other rules intact.
 *
 * The cap is configurable for one reason: each host keeps its own attention file, and that
 * file is what enforces "at most two a day reach the owner". Run a second host for the same
 * owner and the promise quietly becomes four. A host that is not an entry point to the owner
 * declares it with `0` — `AttentionBudget.surface` then selects nothing, and the Koe listing
 * advertises zero interruptions — rather than leaving it to whoever remembers not to open
 * the other inbox.
 */
export function serverPolicy(
  ensName?: string,
  attention: { dailyCap?: string; notifyHour?: string } = {},
): Policy {
  const base: Policy = {
    ...DEMO_POLICY,
    dailyCap: whole('YOHAKU_DAILY_CAP', attention.dailyCap, DEMO_POLICY.dailyCap, 0, Infinity),
    notifyHour: whole('YOHAKU_NOTIFY_HOUR', attention.notifyHour, DEMO_POLICY.notifyHour, 0, 23),
  };
  if (!ensName?.trim()) return base;
  const owner = normalize(ensName.trim());
  if (!owner.endsWith('.eth') || owner === 'eth') throw new Error('ENS_NAME must be an .eth name');
  return { ...base, owner };
}

/**
 * An unreadable value is refused, never coerced.
 *
 * `Number('two')` is NaN and `Number('')` is 0 — either one slipping through would mute the
 * owner completely while the server reported a cap it was not honouring.
 */
function whole(name: string, raw: string | undefined, fallback: number, min: number, max: number): number {
  if (raw === undefined || !raw.trim()) return fallback;
  const value = Number(raw.trim());
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}
