import { describe, expect, it } from 'vitest';
import {
  createPublicClient, custom, decodeFunctionData, encodeAbiParameters,
  encodeFunctionResult, toHex,
} from 'viem';
import { sepolia } from 'viem/chains';
import { keyResource, KEYS } from '../ports/permissions.js';
import { resolverAbi } from './ens-resolver.js';
import { EnsPermissions } from './ens-permissions.js';
import { delegationDisabled } from '../ports/delegation.js';

const account = '0x1111111111111111111111111111111111111111' as const;
const resolver = '0x2222222222222222222222222222222222222222' as const;
const name = 'alice.yohaku.eth';

function harness() {
  const state = { proposalGranted: true, offline: false, text: 'a proposal' };
  const calls: string[] = [];
  const client = createPublicClient({
    chain: sepolia,
    transport: custom({ async request({ method, params }) {
      if (state.offline) throw new Error('RPC offline');
      if (method === 'eth_chainId') return toHex(sepolia.id);
      if (method === 'eth_blockNumber') return '0x20';
      if (method === 'eth_getCode') return '0x6000';
      if (method !== 'eth_call') throw new Error('Unexpected RPC');
      const [call, block] = params as [{ data: `0x${string}`; to: string }, string];
      expect(call.to.toLowerCase()).toBe(resolver);
      expect(block).toBe('0x20');
      const decoded = decodeFunctionData({ abi: resolverAbi, data: call.data });
      calls.push(decoded.functionName);
      if (decoded.functionName === 'decodeSetter') {
        const setter = decodeFunctionData({ abi: resolverAbi, data: decoded.args[0] });
        if (setter.functionName !== 'setText') throw new Error('Wrong setter');
        const key = setter.args[1];
        return encodeFunctionResult({ abi: resolverAbi, functionName: 'decodeSetter',
          result: [toHex(key), BigInt(keyResource(key)), 16n] });
      }
      if (decoded.functionName === 'hasRoles') {
        expect(decoded.args[1]).toBe(16n);
        expect(decoded.args[2]).toBe(account);
        return encodeFunctionResult({ abi: resolverAbi, functionName: 'hasRoles',
          result: state.proposalGranted && decoded.args[0] === BigInt(keyResource(KEYS.proposal)) });
      }
      if (decoded.functionName === 'resolve') {
        return encodeFunctionResult({ abi: resolverAbi, functionName: 'resolve',
          result: encodeAbiParameters([{ type: 'string' }], [state.text]) });
      }
      throw new Error('Unexpected write in read-only adapter');
    } }, { retryCount: 0 }),
  });
  return { state, calls, port: new EnsPermissions(client, { name, resolver }) };
}

describe('ENS permission reads', () => {
  it('reads the effective roles for the right key and account', async () => {
    const { port } = harness();
    expect(await port.canWrite(name, account, KEYS.proposal)).toBe(true);
    expect(await port.canWrite(name, account, KEYS.policy)).toBe(false);
  });

  it('observes a revoked grant without retaining a cached allow', async () => {
    const { port, state } = harness();
    expect(await delegationDisabled(name, { port, account })).toBe(false);
    state.proposalGranted = false;
    expect(await delegationDisabled(name, { port, account })).toBe(true);
  });

  it('denies unknown seller bindings and unavailable RPCs', async () => {
    const { port, state } = harness();
    expect(await delegationDisabled('other.eth', { port, account })).toBe(true);
    state.offline = true;
    expect(await delegationDisabled(name, { port, account })).toBe(true);
    expect(await delegationDisabled(name, undefined)).toBe(true);
  });

  it('reads text through extended resolve and treats an empty record as absent', async () => {
    const { port, state, calls } = harness();
    expect(await port.readText(name, KEYS.proposal)).toBe('a proposal');
    state.text = '';
    expect(await port.readText(name, KEYS.proposal)).toBeUndefined();
    expect(calls.filter((x) => x === 'resolve')).toHaveLength(2);
  });
});
