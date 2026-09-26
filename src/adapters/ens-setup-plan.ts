/** Browser-wallet setup plan. Calldata only; this module cannot sign or send. */
import {
  encodeAbiParameters, encodeFunctionData, formatUnits, keccak256, parseAbi,
  zeroAddress, zeroHash, type Address, type Hex, type PublicClient,
} from 'viem';
import { ROLE } from '../ports/permissions.js';
import { probeResolver } from './ens-resolver.js';

export const factoryAbi = parseAbi([
  'function deployProxy(address implementation, uint256 salt, bytes data) returns (address proxy)',
]);
export const setupResolverAbi = parseAbi([
  'function initialize((address account, uint256 roleBitmap)[] grants, bytes[] calls)',
]);
export const setupRegistrarAbi = parseAbi([
  'function MIN_COMMITMENT_AGE() view returns (uint64)',
  'function isAvailable(string label) view returns (bool)',
  'function getRegisterPrice(string label, uint64 duration, address paymentToken) view returns (uint256 base, uint256 premium)',
  'function makeCommitment(string label, address owner, bytes32 secret, address subregistry, address resolver, uint64 duration, bytes32 referrer) pure returns (bytes32)',
  'function commit(bytes32 commitment)',
  'function register(string label, address owner, bytes32 secret, address subregistry, address resolver, uint64 duration, address paymentToken, bytes32 referrer) returns (uint256 tokenId)',
]);
export const setupTokenAbi = parseAbi([
  'function mint(address to, uint256 amount)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
]);
export type SetupContracts = { registrar: Address; factory: Address; implementation: Address; token: Address };
export type SetupInput = { owner: Address; label: string; secret: Hex; salt: bigint };
export type SetupStep = { title: string; to: Address; data: Hex; waitAfterPreviousSeconds?: number };
export interface SetupPlan {
  owner: Address;
  name: string;
  resolver: Address;
  chainId: string;
  quotedAtBlock: string;
  quotedTokens: string;
  tokenLimit: string;
  token: Address;
  minCommitmentAge: number;
  steps: SetupStep[];
}

export async function createEnsSetupPlan(
  client: PublicClient, contracts: SetupContracts, input: SetupInput,
): Promise<SetupPlan> {
  if (!/^[a-z0-9](?:[a-z0-9-]{3,61}[a-z0-9])$/.test(input.label)) {
    throw new Error('Use an ASCII label of 5–63 characters');
  }
  if (input.owner === zeroAddress) throw new Error('Owner cannot be zero');
  if (!/^0x[0-9a-fA-F]{64}$/.test(input.secret) || input.secret === zeroHash) throw new Error('Invalid commitment secret');
  const { blockNumber } = await probeResolver(client, contracts.implementation);
  const duration = 31536000n;
  const params = { address: contracts.registrar, abi: setupRegistrarAbi, blockNumber };
  if (!await client.readContract({ ...params, functionName: 'isAvailable', args: [input.label] })) {
    throw new Error('Name is not available');
  }
  const [price, minAge, decimals] = await Promise.all([
    client.readContract({ ...params, functionName: 'getRegisterPrice', args: [input.label, duration, contracts.token] }),
    client.readContract({ ...params, functionName: 'MIN_COMMITMENT_AGE' }),
    client.readContract({ address: contracts.token, abi: setupTokenAbi, functionName: 'decimals', blockNumber }),
  ]);
  const total = price[0] + price[1];
  // Exact displayed allowance ceiling, with a 10% buffer for price movement before reveal.
  const limit = total + total / 10n + 1n;
  const init = encodeFunctionData({
    abi: setupResolverAbi, functionName: 'initialize',
    // Only the owner receives text + text-admin. No delegate and no upgrade grant.
    args: [[{ account: input.owner, roleBitmap: ROLE.SET_TEXT | (ROLE.SET_TEXT << 128n) }], []],
  });
  const deployArgs = [contracts.implementation, input.salt, init] as const;
  const simulated = await client.simulateContract({
    account: input.owner, address: contracts.factory, abi: factoryAbi,
    functionName: 'deployProxy', args: deployArgs, blockNumber,
  });
  const resolver = simulated.result;
  const commitmentArgs = [input.label, input.owner, input.secret, zeroAddress, resolver, duration, zeroHash] as const;
  const commitment = keccak256(encodeAbiParameters([
    { type: 'string' }, { type: 'address' }, { type: 'bytes32' }, { type: 'address' },
    { type: 'address' }, { type: 'uint64' }, { type: 'bytes32' },
  ], commitmentArgs));
  const onChainCommitment = await client.readContract({
    ...params, functionName: 'makeCommitment', args: commitmentArgs,
  });
  if (commitment !== onChainCommitment) throw new Error('Commitment encoding does not match registrar');
  await client.simulateContract({
    account: input.owner, address: contracts.token, abi: setupTokenAbi,
    functionName: 'mint', args: [input.owner, limit], blockNumber,
  });
  return {
    owner: input.owner, name: `${input.label}.eth`, resolver, chainId: '0xaa36a7',
    quotedAtBlock: blockNumber.toString(), quotedTokens: formatUnits(total, decimals),
    tokenLimit: formatUnits(limit, decimals), token: contracts.token, minCommitmentAge: Number(minAge),
    steps: [
      { title: '登録用MockUSDCを取得', to: contracts.token,
        data: encodeFunctionData({ abi: setupTokenAbi, functionName: 'mint', args: [input.owner, limit] }) },
      { title: '所有者用resolverを作成', to: contracts.factory,
        data: encodeFunctionData({ abi: factoryAbi, functionName: 'deployProxy', args: deployArgs }) },
      { title: '登録料金の上限額を承認', to: contracts.token,
        data: encodeFunctionData({ abi: setupTokenAbi, functionName: 'approve', args: [contracts.registrar, limit] }) },
      { title: '名前の登録を予約（commit）', to: contracts.registrar,
        data: encodeFunctionData({ abi: setupRegistrarAbi, functionName: 'commit', args: [commitment] }) },
      { title: '名前を1年間登録', to: contracts.registrar, waitAfterPreviousSeconds: Number(minAge),
        data: encodeFunctionData({ abi: setupRegistrarAbi, functionName: 'register',
          args: [input.label, input.owner, input.secret, zeroAddress, resolver, duration, contracts.token, zeroHash] }) },
    ],
  };
}
