/**
 * Yohaku — the permission port.
 *
 * Rule 0 says a delegate may write a proposal and nothing else. On our side that is a
 * branch in `route()`. On chain it has to be the resolver refusing the write, because
 * a rule only we enforce is a rule a judge has to take our word for.
 *
 * ENSv2 makes that possible through Enhanced Access Control: the *same* role bit granted
 * at *different* resources yields independent permissions, and for a text key the resource
 * is `keccak256(bytes(key))`. So `ROLE_SET_TEXT` on `keccak256("yh:proposal")` lets an
 * account write that one key and no other.
 *
 * The deployed implementation's text decoder was checked on Sepolia (see
 * docs/build/ENS-SDK-COMPATIBILITY.md). Seller-specific grants and registration
 * remain unverified. Use adapters/ens-resolver.ts for current calldata; the old
 * plannedSetup below is historical model data, not an executable setup recipe.
 */

import { keccak256, toBytes } from 'viem';

/** Permissioned Resolver roles, from the ENSv2 docs. Unverified against a deployment. */
export const ROLE = {
  SET_ADDRESS: 1n << 0n,
  SET_TEXT: 1n << 4n,
  SET_CONTENTHASH: 1n << 8n,
  SET_ABI: 1n << 12n,
  SET_INTERFACE: 1n << 16n,
  SET_NAME: 1n << 20n,
  SET_DATA: 1n << 24n,
  LINK: 1n << 28n,
  CAN_NAME: 1n << 120n,
  UPGRADE: 1n << 124n,
} as const;

/** The text keys Yohaku writes, and who is allowed to write each one. */
export const KEYS = {
  /** What the delegate may touch: its suggestion, awaiting her decision. */
  proposal: 'yh:proposal',
  /** Her policy. Owner only — this is the one an AI must not be able to rewrite. */
  policy: 'yh:policy',
  /** Where money goes. Owner only. */
  payout: 'yh:payout',
  price: 'yh:price',
  license: 'yh:license',
} as const;

export type KeyName = keyof typeof KEYS;

/** Resource identifier for a text key: keccak256(bytes(key)). */
export function keyResource(key: string): `0x${string}` {
  return keccak256(toBytes(key));
}

/** What the delegate is granted, and — more importantly — what it is not. */
export const DELEGATE_GRANTS: { key: string; roles: bigint }[] = [
  { key: KEYS.proposal, roles: ROLE.SET_TEXT },
];
export const OWNER_ONLY_KEYS: string[] = [KEYS.policy, KEYS.payout, KEYS.price, KEYS.license];

/**
 * What Yohaku needs to know from the chain to decide rule 0.
 *
 * Deliberately small. The router does not read the chain itself — it is handed the answer,
 * so the same routing logic runs identically in a test, in the console, and against Sepolia.
 */
export interface PermissionsPort {
  /** Is this account allowed to write this text key on this name? */
  canWrite(name: string, account: `0x${string}`, key: string): Promise<boolean>;
  /** Has the owner revoked the delegation entirely? */
  isDelegationRevoked(name: string, account: `0x${string}`): Promise<boolean>;
  /** Read a text record. */
  readText(name: string, key: string): Promise<string | undefined>;
}

/**
 * In-memory stand-in with the same semantics, so the whole flow runs without a chain.
 *
 * It enforces exactly what the resolver is supposed to enforce: a grant is per (account,
 * key), never per account. If this mock and the deployment ever disagree, the deployment
 * is right and this file is the bug.
 */
export class MockPermissions implements PermissionsPort {
  private grants = new Map<string, Set<string>>();
  private revoked = new Set<string>();
  private text = new Map<string, string>();

  private id(name: string, account: string): string {
    return `${name}|${account.toLowerCase()}`;
  }

  grant(name: string, account: `0x${string}`, key: string): void {
    const id = this.id(name, account);
    const keys = this.grants.get(id) ?? new Set();
    keys.add(key);
    this.grants.set(id, keys);
  }

  revokeDelegation(name: string, account: `0x${string}`): void {
    this.revoked.add(this.id(name, account));
  }

  async canWrite(name: string, account: `0x${string}`, key: string): Promise<boolean> {
    const id = this.id(name, account);
    if (this.revoked.has(id)) return false;
    return this.grants.get(id)?.has(key) ?? false;
  }

  async isDelegationRevoked(name: string, account: `0x${string}`): Promise<boolean> {
    return this.revoked.has(this.id(name, account));
  }

  async readText(name: string, key: string): Promise<string | undefined> {
    return this.text.get(`${name}|${key}`);
  }

  /** Simulates the resolver refusing a write, rather than us refusing it. */
  async setText(
    name: string,
    account: `0x${string}`,
    key: string,
    value: string,
  ): Promise<void> {
    if (!(await this.canWrite(name, account, key))) {
      throw new Error(`resolver refused: ${account} may not write "${key}" on ${name}`);
    }
    this.text.set(`${name}|${key}`, value);
  }
}

/**
 * The calls to make against a real deployment.
 *
 * Left as data rather than executed code on purpose: the addresses and the exact helper
 * are the two things we have not confirmed, and writing a wrapper around an ABI we have
 * not called would look finished while being untested.
 */
export function plannedSetup(params: {
  name: string;
  owner: `0x${string}`;
  delegate: `0x${string}`;
}): { call: string; args: unknown[]; why: string }[] {
  return [
    {
      call: 'grantRoles',
      args: [keyResource(KEYS.proposal), ROLE.SET_TEXT, params.delegate],
      why: 'the delegate may write its proposal, and only that key',
    },
    ...OWNER_ONLY_KEYS.map((key) => ({
      call: '(no grant)',
      args: [keyResource(key), ROLE.SET_TEXT, params.delegate],
      why: `deliberately NOT granted — "${key}" stays with the owner`,
    })),
    {
      call: 'revokeRoles',
      args: [keyResource(KEYS.proposal), ROLE.SET_TEXT, params.delegate],
      why: 'what the owner calls to take the delegation back; proposals stop too',
    },
  ];
}
