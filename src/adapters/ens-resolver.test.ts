import { describe, expect, it } from 'vitest';
import { createPublicClient, custom, decodeFunctionData, encodeFunctionResult, toHex } from 'viem';
import { sepolia } from 'viem/chains';
import { keyResource, KEYS } from '../ports/permissions.js';
import { probeResolver, proposalTransactions, resolverAbi } from './ens-resolver.js';

const address = '0x1111111111111111111111111111111111111111' as const;
function rpc(mode: 'good' | 'wrong-role' | 'wrong-chain' | 'empty' | 'offline' = 'good') {
  return createPublicClient({ chain: sepolia, transport: custom({ async request({ method, params }) {
    if (mode === 'offline') throw new Error('offline');
    if (method === 'eth_chainId') return toHex(mode === 'wrong-chain' ? 1 : sepolia.id);
    if (method === 'eth_blockNumber') return '0x10';
    if (method === 'eth_getCode') return mode === 'empty' ? '0x' : '0x6000';
    if (method === 'eth_call') {
      const [call, block] = params as [{ data: `0x${string}` }, string];
      expect(block).toBe('0x10');
      const decoded = decodeFunctionData({ abi: resolverAbi, data: call.data });
      if (decoded.functionName !== 'decodeSetter') throw new Error('Unexpected call');
      const setter = decodeFunctionData({ abi: resolverAbi, data: decoded.args[0] });
      if (setter.functionName !== 'setText') throw new Error('Unexpected setter');
      const key = setter.args[1];
      return encodeFunctionResult({ abi: resolverAbi, functionName: 'decodeSetter',
        result: [toHex(key), BigInt(keyResource(key)), mode === 'wrong-role' ? 32n : 16n] });
    }
    throw new Error(`Unexpected RPC: ${method}`);
  } }, { retryCount: 0 }) });
}

describe('post-audit-2 resolver', () => {
  it('grants only a text setter and revokes the same resource and account', () => {
    const tx = proposalTransactions('alice.yohaku.eth', address);
    const grant = decodeFunctionData({ abi: resolverAbi, data: tx.grant });
    expect(grant.functionName).toBe('grantSetterRoles');
    if (grant.functionName !== 'grantSetterRoles') throw new Error('wrong grant');
    const setter = decodeFunctionData({ abi: resolverAbi, data: grant.args[0] });
    expect(setter.functionName).toBe('setText');
    expect(setter.args[1]).toBe(KEYS.proposal);
    expect(grant.args[1]).toBe(address);
    expect(decodeFunctionData({ abi: resolverAbi, data: tx.revoke }).args)
      .toEqual([BigInt(keyResource(KEYS.proposal)), 16n, address]);
  });

  it('checks every key at one block', async () => {
    const report = await probeResolver(rpc(), address);
    expect(report.keys).toHaveLength(5);
    expect(report.blockNumber).toBe(16n);
  });

  it.each(['wrong-role', 'wrong-chain', 'empty', 'offline'] as const)(
    'does not report readiness on %s', async (mode) => {
      await expect(probeResolver(rpc(mode), address)).rejects.toThrow();
    },
  );
});
