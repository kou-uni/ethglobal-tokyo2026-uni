import { describe, expect, it } from 'vitest';
import {
  createPublicClient, custom, decodeFunctionData, encodeAbiParameters, encodeFunctionResult,
  keccak256, toHex, zeroHash, type Hex,
} from 'viem';
import { sepolia } from 'viem/chains';
import {
  createEnsSetupPlan, factoryAbi, setupRegistrarAbi, setupResolverAbi, setupTokenAbi,
} from './ens-setup-plan.js';
import { keyResource, ROLE } from '../ports/permissions.js';
import { resolverAbi } from './ens-resolver.js';

const contracts = {
  registrar: '0x1111111111111111111111111111111111111111',
  factory: '0x2222222222222222222222222222222222222222',
  implementation: '0x3333333333333333333333333333333333333333',
  token: '0x4444444444444444444444444444444444444444',
} as const;
const owner = '0x5555555555555555555555555555555555555555' as const;
const proxy = '0x6666666666666666666666666666666666666666' as const;
const input = { owner, label: 'alice-yohaku', salt: 42n, secret: `0x${'ab'.repeat(32)}` as Hex };
const all = [...factoryAbi, ...setupRegistrarAbi, ...setupTokenAbi, ...resolverAbi] as const;

function rpc(mode: 'ok' | 'unavailable' | 'bad-commitment' = 'ok') {
  return createPublicClient({ chain: sepolia, transport: custom({
    async request({ method, params }) {
      if (method === 'eth_chainId') return toHex(sepolia.id);
      if (method === 'eth_blockNumber') return '0x40';
      if (method === 'eth_getCode') return '0x6000';
      if (method !== 'eth_call') throw new Error('No writes allowed');
      const [tx] = params as [{ data: Hex; from?: string }];
      const call = decodeFunctionData({ abi: all, data: tx.data });
      switch (call.functionName) {
        case 'decodeSetter': {
          const setter = decodeFunctionData({ abi: resolverAbi, data: call.args[0] });
          if (setter.functionName !== 'setText') throw new Error('Wrong setter');
          const key = setter.args[1];
          return encodeFunctionResult({ abi: resolverAbi, functionName: 'decodeSetter',
            result: [toHex(key), BigInt(keyResource(key)), 16n] });
        }
        case 'isAvailable': return encodeFunctionResult({ abi: setupRegistrarAbi,
          functionName: call.functionName, result: mode !== 'unavailable' });
        case 'getRegisterPrice': return encodeFunctionResult({ abi: setupRegistrarAbi,
          functionName: call.functionName, result: [8000000n, 0n] });
        case 'MIN_COMMITMENT_AGE': return encodeFunctionResult({ abi: setupRegistrarAbi,
          functionName: call.functionName, result: 60n });
        case 'decimals': return encodeFunctionResult({ abi: setupTokenAbi, functionName: 'decimals', result: 6 });
        case 'deployProxy': {
          expect(tx.from?.toLowerCase()).toBe(owner);
          const init = decodeFunctionData({ abi: setupResolverAbi, data: call.args[2] });
          expect(init.args).toEqual([[{ account: owner, roleBitmap: ROLE.SET_TEXT | (ROLE.SET_TEXT << 128n) }], []]);
          return encodeFunctionResult({ abi: factoryAbi, functionName: 'deployProxy', result: proxy });
        }
        case 'makeCommitment': return encodeFunctionResult({ abi: setupRegistrarAbi,
          functionName: call.functionName,
          result: mode === 'bad-commitment' ? zeroHash : keccak256(encodeAbiParameters([
            { type: 'string' }, { type: 'address' }, { type: 'bytes32' }, { type: 'address' },
            { type: 'address' }, { type: 'uint64' }, { type: 'bytes32' },
          ], call.args)) });
        case 'mint':
          expect(call.args).toEqual([owner, 8800001n]);
          return '0x';
        default: throw new Error(`Unexpected operation: ${call.functionName}`);
      }
    },
  }, { retryCount: 0 }) });
}

describe('wallet-only ENS setup plan', () => {
  it('binds all operations to the owner, uses a bounded allowance and waits after commit', async () => {
    const p = await createEnsSetupPlan(rpc(), contracts, input);
    expect(p.resolver).toBe(proxy);
    expect(p.steps.map((s) => s.to)).toEqual([
      contracts.token, contracts.factory, contracts.token, contracts.registrar, contracts.registrar,
    ]);
    expect(decodeFunctionData({ abi: setupTokenAbi, data: p.steps[2]!.data }).args)
      .toEqual([contracts.registrar, 8800001n]);
    const registration = decodeFunctionData({ abi: setupRegistrarAbi, data: p.steps[4]!.data });
    expect(registration.functionName).toBe('register');
    expect(registration.args[1]).toBe(owner);
    expect(registration.args[4]).toBe(proxy);
    expect(p.steps[4]!.waitAfterPreviousSeconds).toBe(60);
  });

  it.each(['unavailable', 'bad-commitment'] as const)('refuses %s plans', async (mode) => {
    await expect(createEnsSetupPlan(rpc(mode), contracts, input)).rejects.toThrow();
  });

  it('rejects ambiguous names before any plan is generated', async () => {
    await expect(createEnsSetupPlan(rpc(), contracts, { ...input, label: 'other.alice' })).rejects.toThrow();
  });
});
