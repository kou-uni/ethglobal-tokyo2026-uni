import { describe, expect, it } from 'vitest';
import {
  BaseError, ContractFunctionRevertedError, decodeFunctionData, encodeAbiParameters, encodeErrorResult,
  encodeFunctionData, encodePacked, encodeEventTopics, parseEther, toHex, type Hash, type PublicClient,
  type TransactionReceipt,
} from 'viem';
import {
  isPermissionDenial, prepareDelegation, verifyDelegationProof, walletDelegationAbi, roleEventAbi, type DelegationDeployment,
} from './ens-delegation-proof.js';
import { keyResource, KEYS } from '../ports/permissions.js';
import { proposalTransactions, resolverAbi, textSetter } from './ens-resolver.js';

const owner = '0x1111111111111111111111111111111111111111' as const;
const delegate = '0x2222222222222222222222222222222222222222' as const;
const resolver = '0x3333333333333333333333333333333333333333' as const;
const registry = '0x4444444444444444444444444444444444444444' as const;
const deployment: DelegationDeployment = { owner, resolver, registry, name: 'test-yohaku.eth', rpc: 'http://localhost' };
const value = 'yohaku-delegation-demo:test-run';
const hashes = Array.from({ length: 6 }, (_, i) => `0x${(i + 1).toString(16).padStart(64, '0')}` as Hash);

function denied(key: string = KEYS.policy, who: `0x${string}` = delegate) {
  return new ContractFunctionRevertedError({
    abi: resolverAbi, functionName: 'setText',
    data: encodeErrorResult({
      abi: resolverAbi, errorName: 'EACUnauthorizedAccountRoles',
      args: [BigInt(keyResource(key)), 16n, who],
    }),
  });
}

function fixture() {
  const { grant, revoke } = proposalTransactions(deployment.name, delegate);
  const txs = [
    { from: owner, to: delegate, input: '0x', value: parseEther('0.001'), gas: 21000n },
    { from: owner, to: resolver, input: grant, value: 0n, gas: 200000n },
    { from: delegate, to: resolver, input: textSetter(deployment.name, KEYS.proposal, value), value: 0n, gas: 250000n },
    { from: delegate, to: resolver, input: textSetter(deployment.name, KEYS.policy, value), value: 0n, gas: 150000n },
    { from: owner, to: resolver, input: revoke, value: 0n, gas: 200000n },
    { from: delegate, to: resolver, input: textSetter(deployment.name, KEYS.proposal, value), value: 0n, gas: 150000n },
  ];
  const receipts = hashes.map((transactionHash, i) => ({
    transactionHash, status: [3, 5].includes(i) ? 'reverted' : 'success',
    blockNumber: BigInt(i + 10), transactionIndex: 0, gasUsed: 20000n,
    logs: [] as TransactionReceipt['logs'],
  }));
  const state = { granted: false, rpcFailure: false, wrongOwner: false, recordedValue: value };
  const client = {
    getChainId: async () => 11155111,
    getBlockNumber: async () => 100n,
    getCode: async () => '0x6000',
    estimateFeesPerGas: async () => ({ maxFeePerGas: 1000000000n, maxPriorityFeePerGas: 1n }),
    getTransaction: async ({ hash }: { hash: Hash }) => txs[hashes.indexOf(hash)],
    getTransactionReceipt: async ({ hash }: { hash: Hash }) => receipts[hashes.indexOf(hash)],
    readContract: async ({ functionName, args }: { functionName: string; args: unknown[] }) => {
      if (functionName === 'getResolver') return resolver;
      if (functionName === 'getState') return { tokenId: 1n };
      if (functionName === 'ownerOf') return state.wrongOwner ? delegate : owner;
      if (functionName === 'decodeSetter') {
        const setter = decodeFunctionData({ abi: resolverAbi, data: args[0] as `0x${string}` });
        if (setter.functionName !== 'setText') throw new Error('Wrong setter');
        const key = setter.args[1];
        return [toHex(key), BigInt(keyResource(key)), 16n];
      }
      if (functionName === 'hasRoles') return args[2] === owner || state.granted;
      if (functionName === 'resolve') return encodeAbiParameters([{ type: 'string' }], [state.recordedValue]);
      throw new Error(`Unexpected read ${functionName}`);
    },
    simulateContract: async ({ args }: { args: [unknown, string, string] }) => {
      if (state.rpcFailure) throw new BaseError('RPC disconnected');
      throw denied(args[1]);
    },
  } as unknown as PublicClient;
  return { client, txs, receipts, state };
}

describe('permission error recognition', () => {
  it('accepts only the expected resource, role and account', () => {
    expect(isPermissionDenial(denied(), delegate, KEYS.policy)).toBe(true);
    expect(isPermissionDenial(denied(), delegate, KEYS.proposal)).toBe(false);
    expect(isPermissionDenial(denied(KEYS.policy, owner), delegate, KEYS.policy)).toBe(false);
    expect(isPermissionDenial(new BaseError('network failure'), delegate, KEYS.policy)).toBe(false);
  });
});

describe('delegation proof verification', () => {
  function wrappedFixture() {
    const f = fixture();
    const manager = '0x5555555555555555555555555555555555555555' as const;
    for (const i of [1, 4]) {
      const inner = f.txs[i]!.input as `0x${string}`;
      f.txs[i]!.to = manager as typeof resolver;
      f.txs[i]!.input = encodeFunctionData({
        abi: walletDelegationAbi, functionName: 'redeemDelegations',
        args: [['0x'], [toHex(0n, { size: 32 })], [encodePacked(['address', 'uint256', 'bytes'], [resolver, 0n, inner])]],
      });
      f.receipts[i]!.logs = [{
        blockHash: hashes[i]!, blockNumber: BigInt(i + 10), logIndex: 0,
        transactionHash: hashes[i]!, transactionIndex: 0, removed: false,
        address: resolver,
        topics: encodeEventTopics({ abi: roleEventAbi, eventName: 'EACRolesChanged',
          args: { resource: BigInt(keyResource(KEYS.proposal)), account: delegate } }),
        data: encodeAbiParameters([{ type: 'uint256' }, { type: 'uint256' }], i === 1 ? [0n, 16n] : [16n, 0n]),
      }] as TransactionReceipt['logs'];
    }
    return { ...f, deployment: { ...deployment, walletDelegationManager: manager } };
  }

  it('accepts single-call wallet wrapping only with matching resolver events', async () => {
    const f = wrappedFixture();
    const proof = await verifyDelegationProof(f.client, f.deployment, { delegate, value, hashes });
    expect(proof.transactions[1]!.submission).toBe('wallet-delegation-manager');
    expect(proof.transactions[4]!.submission).toBe('wallet-delegation-manager');
  });

  it.each(['missing-event', 'spoofed-event', 'wrong-role', 'extra-event', 'unknown-manager', 'wrong-target', 'nonzero-value', 'try-mode', 'batch'] as const)(
    'rejects wallet wrapping with %s', async (mode) => {
      const f = wrappedFixture();
      const log = f.receipts[1]!.logs[0]!;
      if (mode === 'missing-event') f.receipts[1]!.logs = [];
      if (mode === 'spoofed-event') log.address = delegate;
      if (mode === 'wrong-role') log.data = encodeAbiParameters([{ type: 'uint256' }, { type: 'uint256' }], [0n, 32n]);
      if (mode === 'extra-event') f.receipts[1]!.logs.push(log);
      if (mode === 'unknown-manager') delete (f.deployment as DelegationDeployment).walletDelegationManager;
      if (['wrong-target', 'nonzero-value', 'try-mode', 'batch'].includes(mode)) {
        const inner = proposalTransactions(deployment.name, delegate).grant;
        const execution = encodePacked(['address', 'uint256', 'bytes'], [
          mode === 'wrong-target' ? delegate : resolver, mode === 'nonzero-value' ? 1n : 0n, inner,
        ]);
        f.txs[1]!.input = encodeFunctionData({
          abi: walletDelegationAbi, functionName: 'redeemDelegations',
          args: [mode === 'batch' ? ['0x', '0x'] : ['0x'], [toHex(mode === 'try-mode' ? 1n : 0n, { size: 32 })], [execution]],
        });
      }
      await expect(verifyDelegationProof(f.client, f.deployment, { delegate, value, hashes })).rejects.toThrow();
    },
  );

  it('requires the six transactions, matching proposal and final revocation', async () => {
    const { client } = fixture();
    const proof = await verifyDelegationProof(client, deployment, { delegate, value, hashes });
    expect(proof.transactions.map((r) => r.status)).toEqual([
      'success', 'success', 'success', 'reverted', 'success', 'reverted',
    ]);
    expect(proof.rolesAfterRevocation[KEYS.proposal]).toBe(false);
  });

  it.each(['wrong-calldata', 'wrong-status', 'out-of-gas', 'wrong-order', 'retained-role', 'rpc-failure', 'wrong-owner', 'wrong-record'] as const)(
    'does not count %s as a successful proof', async (mode) => {
      const f = fixture();
      if (mode === 'wrong-calldata') f.txs[3]!.input = '0x';
      if (mode === 'wrong-status') f.receipts[3]!.status = 'success';
      if (mode === 'out-of-gas') f.receipts[3]!.gasUsed = f.txs[3]!.gas;
      if (mode === 'wrong-order') f.receipts[4]!.blockNumber = 1n;
      if (mode === 'retained-role') f.state.granted = true;
      if (mode === 'rpc-failure') f.state.rpcFailure = true;
      if (mode === 'wrong-owner') f.state.wrongOwner = true;
      if (mode === 'wrong-record') f.state.recordedValue = 'different';
      await expect(verifyDelegationProof(f.client, deployment, { delegate, value, hashes })).rejects.toThrow();
    },
  );

  it('rejects duplicate hashes', async () => {
    await expect(verifyDelegationProof(fixture().client, deployment, {
      delegate, value, hashes: [hashes[0]!, ...hashes.slice(0, 5)],
    })).rejects.toThrow();
  });

  it('prepares bounded funding only for a separate account without grants', async () => {
    const f = fixture();
    const plan = await prepareDelegation(f.client, deployment, delegate);
    expect(BigInt(plan.funding)).toBe(parseEther('0.001'));
    await expect(prepareDelegation(f.client, deployment, owner)).rejects.toThrow();
    f.state.granted = true;
    await expect(prepareDelegation(f.client, deployment, delegate)).rejects.toThrow();
  });
});
