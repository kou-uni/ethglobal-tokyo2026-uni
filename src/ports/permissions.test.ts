import { describe, expect, it } from 'vitest';
import { KEYS, MockPermissions, OWNER_ONLY_KEYS, ROLE, keyResource, plannedSetup } from './permissions.js';
import { route } from '../core/rules.js';
import { DEMO_POLICY, NIGHT, demoContext } from '../core/night.js';
import type { AgentRequest } from '../core/types.js';

const NAME = 'alice.yohaku.eth';
const OWNER = '0x1111111111111111111111111111111111111111' as const;
const DELEGATE = '0x2222222222222222222222222222222222222222' as const;

function granted(): MockPermissions {
  const p = new MockPermissions();
  p.grant(NAME, DELEGATE, KEYS.proposal);
  for (const k of Object.values(KEYS)) p.grant(NAME, OWNER, k);
  return p;
}

describe('per-key permissions are independent', () => {
  it('a key resource is keccak256 of the key', () => {
    expect(keyResource('yh:proposal')).toBe(
      '0xa2019504f332dc97edb538b8bc1f8e47debaf01976eaa027df67bf34ea3f546a',
    );
    expect(keyResource('yh:policy')).not.toBe(keyResource('yh:proposal'));
  });

  it('ROLE_SET_TEXT is the fifth bit', () => {
    expect(ROLE.SET_TEXT).toBe(16n);
  });

  it('the delegate may write its proposal', async () => {
    await expect(granted().setText(NAME, DELEGATE, KEYS.proposal, 'buy groceries?')).resolves.toBeUndefined();
  });

  it.each(OWNER_ONLY_KEYS)('the delegate may not write %s', async (key) => {
    await expect(granted().setText(NAME, DELEGATE, key, 'anything')).rejects.toThrow(/refused/);
  });

  it('the owner may write everything', async () => {
    const p = granted();
    for (const key of Object.values(KEYS)) {
      await expect(p.setText(NAME, OWNER, key, 'v')).resolves.toBeUndefined();
    }
  });

  it('revoking the delegation stops proposals too', async () => {
    const p = granted();
    p.revokeDelegation(NAME, DELEGATE);
    await expect(p.setText(NAME, DELEGATE, KEYS.proposal, 'x')).rejects.toThrow(/refused/);
  });
});

describe('the chain state and rule 0 agree', () => {
  const req = (writeTarget: 'proposal' | 'permission' | 'payout'): AgentRequest => ({
    id: 'd', who: 'helper.alice.yohaku.eth', what: 'purchase-intent/groceries',
    purpose: 'other', price: { amount: 0, currency: 'JPYC' },
    deadline: '2026-09-27T00:00:00Z', actingAs: 'delegate', writeTarget,
  });

  it('what the resolver refuses, rule 0 also denies', async () => {
    const p = granted();
    for (const [target, key] of [['permission', KEYS.policy], ['payout', KEYS.payout]] as const) {
      await expect(p.setText(NAME, DELEGATE, key, 'x')).rejects.toThrow();
      expect(route(req(target), DEMO_POLICY, demoContext(NIGHT))).toMatchObject({
        verdict: 'deny', rule: 0,
      });
    }
  });

  it('what the resolver allows, rule 0 also allows', async () => {
    await expect(granted().setText(NAME, DELEGATE, KEYS.proposal, 'x')).resolves.toBeUndefined();
    expect(route(req('proposal'), DEMO_POLICY, demoContext(NIGHT)).verdict).not.toBe('deny');
  });

  it('a revoked delegation stops both', async () => {
    const p = granted();
    p.revokeDelegation(NAME, DELEGATE);
    await expect(p.setText(NAME, DELEGATE, KEYS.proposal, 'x')).rejects.toThrow();
    const ctx = { ...demoContext(NIGHT), delegationRevoked: true };
    expect(route(req('proposal'), DEMO_POLICY, ctx)).toMatchObject({ verdict: 'deny', rule: 0 });
  });
});

describe('the setup we will run against Sepolia', () => {
  it('grants exactly one key and withholds the rest', () => {
    const steps = plannedSetup({ name: NAME, owner: OWNER, delegate: DELEGATE });
    expect(steps.filter((s) => s.call === 'grantRoles')).toHaveLength(1);
    expect(steps.filter((s) => s.call === '(no grant)')).toHaveLength(OWNER_ONLY_KEYS.length);
  });
});
