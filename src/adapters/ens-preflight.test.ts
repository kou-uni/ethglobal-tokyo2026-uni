import { describe, expect, it } from 'vitest';
import { decodeFunctionData, parseAbi } from 'viem';
import { packetToBytes } from 'viem/ens';
import { toHex } from 'viem';
import { permissionPreflight } from './ens-preflight.js';

const input = {
  name: 'alice.yohaku.eth',
  owner: '0x1111111111111111111111111111111111111111',
  delegate: '0x2222222222222222222222222222222222222222',
  resolver: '0x3333333333333333333333333333333333333333',
} as const;
const abi = parseAbi(['function authorizeTextRoles(bytes name, string key, address account, bool authorized)']);

describe('published SDK permission preparation', () => {
  it('limits both grant and revoke to the proposal key, name and delegate', () => {
    const plan = permissionPreflight(input);
    expect(decodeFunctionData({ abi, data: plan.grant.data }).args).toEqual([
      toHex(packetToBytes(input.name)), 'yh:proposal', input.delegate, true,
    ]);
    expect(decodeFunctionData({ abi, data: plan.revoke.data }).args).toEqual([
      toHex(packetToBytes(input.name)), 'yh:proposal', input.delegate, false,
    ]);
  });

  it('exposes the difference from the key-only model instead of silently mixing versions', () => {
    const a = permissionPreflight(input).resources;
    const b = permissionPreflight({ ...input, name: 'bob.yohaku.eth' }).resources;
    expect(a.every((r) => r.publishedSdk !== r.keyOnlyModel)).toBe(true);
    expect(a[0]!.publishedSdk).not.toBe(b[0]!.publishedSdk);
    expect(a[0]!.keyOnlyModel).toBe(b[0]!.keyOnlyModel);
    expect(new Set(a.map((r) => r.publishedSdk)).size).toBe(5);
  });

  it('rejects an empty name and a delegate that is the owner', () => {
    expect(() => permissionPreflight({ ...input, name: '' })).toThrow();
    expect(() => permissionPreflight({ ...input, delegate: input.owner })).toThrow();
  });
});
