/** Shared by the local verifier and browser. No private-key handling here. */
import {
  BaseError, ContractFunctionRevertedError, decodeFunctionData, encodePacked, formatEther, labelhash,
  parseAbi, parseEventLogs, parseEther, toHex,
  type Address, type Hash, type Hex, type PublicClient, type TransactionReceipt,
} from 'viem';
import { packetToBytes } from 'viem/ens';
import { KEYS, OWNER_ONLY_KEYS, ROLE, keyResource } from '../ports/permissions.js';
import { EnsPermissions } from './ens-permissions.js';
import { probeResolver, proposalTransactions, resolverAbi, textSetter } from './ens-resolver.js';

export interface DelegationDeployment {
  name: string; owner: Address; resolver: Address; registry: Address; rpc: string;
  walletDelegationManager?: Address;
}
export const registryAbi = parseAbi([
  'function getResolver(string label) view returns (address)',
  'function getState(uint256 anyId) view returns ((uint8 status,uint64 expiry,address latestOwner,uint256 tokenId,uint256 resource) state)',
  'function ownerOf(uint256 tokenId) view returns (address)',
]);
export const DELEGATION_GAS = { proposal: 250000n, refusal: 150000n, totalBudget: 600000n };
export const MAX_DELEGATION_FUND = parseEther('0.005');
const equal = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

// MetaMask DelegationManager.redeemDelegations; source recorded in ens-deployment.json.
export const walletDelegationAbi = parseAbi([
  'function redeemDelegations(bytes[] permissionContexts, bytes32[] modes, bytes[] executionCallDatas)',
]);
export const roleEventAbi = parseAbi([
  'event EACRolesChanged(uint256 indexed resource, address indexed account, uint256 oldRoles, uint256 newRoles)',
]);

function matchesWrappedOwnerCall(
  d: DelegationDeployment, tx: { to: Address | null; input: Hex },
  receipt: TransactionReceipt, data: Hex, delegate: Address, granting: boolean,
) {
  if (!d.walletDelegationManager || !tx.to || !equal(tx.to, d.walletDelegationManager)) return false;
  try {
    const { args: [contexts, modes, executions] } = decodeFunctionData({ abi: walletDelegationAbi, data: tx.input });
    // Only one atomic, ordinary CALL. No batch, delegatecall, or try/ignore-failure mode.
    if (contexts.length !== 1 || modes.length !== 1 || executions.length !== 1 || BigInt(modes[0]!) !== 0n) return false;
    if (!equal(executions[0]!, encodePacked(['address', 'uint256', 'bytes'], [d.resolver, 0n, data]))) return false;
    // A successful outer receipt alone is insufficient: the real resolver must emit
    // exactly the intended role transition. Logs from the wrapper cannot substitute.
    const events = parseEventLogs({
      abi: roleEventAbi, logs: receipt.logs.filter((log) => equal(log.address, d.resolver)), strict: true,
    });
    if (events.length !== 1) return false;
    const { resource, account, oldRoles, newRoles } = events[0]!.args;
    return resource === BigInt(keyResource(KEYS.proposal)) && equal(account, delegate)
      && oldRoles === (granting ? 0n : ROLE.SET_TEXT) && newRoles === (granting ? ROLE.SET_TEXT : 0n);
  } catch { return false; }
}

export async function assertDeployment(client: PublicClient, d: DelegationDeployment) {
  const { blockNumber } = await probeResolver(client, d.resolver);
  if (!d.name.endsWith('.eth') || d.name.slice(0, -4).includes('.')) throw new Error('Expected a registered .eth label');
  const label = d.name.slice(0, -4);
  const read = { address: d.registry, abi: registryAbi, blockNumber };
  const [resolver, state] = await Promise.all([
    client.readContract({ ...read, functionName: 'getResolver', args: [label] }),
    client.readContract({ ...read, functionName: 'getState', args: [BigInt(labelhash(label))] }),
  ]);
  const owner = await client.readContract({ ...read, functionName: 'ownerOf', args: [state.tokenId] });
  if (!equal(resolver, d.resolver) || !equal(owner, d.owner)) throw new Error('Registered owner or resolver changed');
  const admin = await client.readContract({
    address: d.resolver, abi: resolverAbi, functionName: 'hasRoles',
    args: [0n, ROLE.SET_TEXT << 128n, d.owner], blockNumber,
  });
  if (!admin) throw new Error('Owner does not hold text-admin');
  return blockNumber;
}

export async function readDelegateRoles(client: PublicClient, d: DelegationDeployment, delegate: Address) {
  const blockNumber = await assertDeployment(client, d);
  const pairs = await Promise.all(Object.values(KEYS).map(async (key) => [
    key, await client.readContract({
      address: d.resolver, abi: resolverAbi, functionName: 'hasRoles',
      args: [BigInt(keyResource(key)), ROLE.SET_TEXT, delegate], blockNumber,
    }),
  ] as const));
  return { blockNumber, roles: Object.fromEntries(pairs) };
}

export async function prepareDelegation(client: PublicClient, d: DelegationDeployment, delegate: Address) {
  if (equal(delegate, d.owner)) throw new Error('Delegate must be separate from owner');
  const { blockNumber, roles } = await readDelegateRoles(client, d, delegate);
  if (Object.values(roles).some(Boolean)) throw new Error('Use a fresh delegate with no existing text permissions');
  const fees = await client.estimateFeesPerGas();
  const needed = fees.maxFeePerGas * DELEGATION_GAS.totalBudget * 12n / 10n;
  const funding = needed > parseEther('0.001') ? needed : parseEther('0.001');
  if (funding > MAX_DELEGATION_FUND) throw new Error('Fee estimate exceeds the 0.005 test-ETH funding cap');
  return {
    ...d, delegate, checkedBlock: blockNumber.toString(),
    funding: funding.toString(), fundingETH: formatEther(funding),
    ...proposalTransactions(d.name, delegate),
  };
}

export function isPermissionDenial(error: unknown, delegate: Address, key: string): boolean {
  if (!(error instanceof BaseError)) return false;
  const revert = error.walk((e) => e instanceof ContractFunctionRevertedError);
  if (!(revert instanceof ContractFunctionRevertedError)) return false;
  const data = revert.data;
  if (data?.errorName !== 'EACUnauthorizedAccountRoles' || !data.args) return false;
  const [resource, role, account] = data.args as readonly [bigint, bigint, Address];
  return resource === BigInt(keyResource(key)) && role === ROLE.SET_TEXT && equal(account, delegate);
}

export async function expectPermissionDenial(
  client: PublicClient, d: DelegationDeployment, delegate: Address, key: string, value: string,
  blockNumber?: bigint,
) {
  try {
    await client.simulateContract({
      address: d.resolver, abi: resolverAbi, functionName: 'setText',
      args: [toHex(packetToBytes(d.name)), key, value],
      account: delegate, ...(blockNumber !== undefined ? { blockNumber } : {}),
    });
  } catch (error) {
    if (isPermissionDenial(error, delegate, key)) return;
    throw new Error('Failure was not the expected EAC permission error');
  }
  throw new Error('Write unexpectedly succeeded; refusing to send a supposed refusal test');
}

export interface DelegationProofInput {
  delegate: Address;
  value: string;
  /** fund, grant, proposal success, policy revert, revoke, proposal revert */
  hashes: Hash[];
}

export async function verifyDelegationProof(
  client: PublicClient, d: DelegationDeployment, input: DelegationProofInput,
) {
  if (equal(input.delegate, d.owner) || input.hashes.length !== 6 || new Set(input.hashes).size !== 6) {
    throw new Error('Expected six distinct transactions and a separate delegate');
  }
  if (!/^yohaku-delegation-demo:[a-zA-Z0-9-]{1,80}$/.test(input.value)) throw new Error('Invalid proof value');
  await assertDeployment(client, d);
  const txs = await Promise.all(input.hashes.map((hash) => client.getTransaction({ hash })));
  const receipts = await Promise.all(input.hashes.map((hash) => client.getTransactionReceipt({ hash })));
  const { grant, revoke } = proposalTransactions(d.name, input.delegate);
  const expected = [
    { from: d.owner, to: input.delegate, data: '0x', status: 'success' },
    { from: d.owner, to: d.resolver, data: grant, status: 'success' },
    { from: input.delegate, to: d.resolver, data: textSetter(d.name, KEYS.proposal, input.value), status: 'success' },
    { from: input.delegate, to: d.resolver, data: textSetter(d.name, KEYS.policy, input.value), status: 'reverted' },
    { from: d.owner, to: d.resolver, data: revoke, status: 'success' },
    { from: input.delegate, to: d.resolver, data: textSetter(d.name, KEYS.proposal, input.value), status: 'reverted' },
  ];
  for (let i = 0; i < expected.length; i++) {
    const tx = txs[i]!, receipt = receipts[i]!, e = expected[i]!;
    const direct = tx.to && equal(tx.to, e.to) && equal(tx.input, e.data);
    const wrapped = [1, 4].includes(i) && matchesWrappedOwnerCall(
      d, tx, receipt, e.data as Hex, input.delegate, i === 1,
    );
    if (!equal(tx.from, e.from) || (!direct && !wrapped) || receipt.status !== e.status) {
      throw new Error(`Transaction ${i + 1} does not match the delegation proof`);
    }
    if (i === 0 ? tx.value <= 0n || tx.value > MAX_DELEGATION_FUND : tx.value !== 0n) throw new Error('Unexpected transfer value');
    if (i > 0) {
      const prev = receipts[i - 1]!;
      if (receipt.blockNumber < prev.blockNumber ||
          (receipt.blockNumber === prev.blockNumber && receipt.transactionIndex <= prev.transactionIndex)) {
        throw new Error('Proof transactions are out of order');
      }
    }
    if (e.status === 'reverted' && receipt.gasUsed >= tx.gas) throw new Error('Revert may be out of gas');
  }
  for (const [i, key] of [[3, KEYS.policy], [5, KEYS.proposal]] as const) {
    await expectPermissionDenial(client, d, input.delegate, key, input.value, receipts[i]!.blockNumber);
  }
  const { blockNumber, roles } = await readDelegateRoles(client, d, input.delegate);
  if (roles[KEYS.proposal] || OWNER_ONLY_KEYS.some((k) => roles[k])) throw new Error('Delegate retains text access');
  const port = new EnsPermissions(client, { name: d.name, resolver: d.resolver });
  if (await port.readText(d.name, KEYS.proposal) !== input.value) throw new Error('Proposal record does not match successful write');
  return {
    checkedAt: new Date().toISOString(), chainId: 11155111, blockNumber: blockNumber.toString(),
    name: d.name, owner: d.owner, resolver: d.resolver, delegate: input.delegate, proposal: input.value,
    rolesAfterRevocation: roles,
    transactions: receipts.map((r, i) => ({
      step: ['fund', 'grant', 'proposal-write', 'policy-refused', 'revoke', 'proposal-refused'][i],
      hash: r.transactionHash, blockNumber: r.blockNumber.toString(), status: r.status,
      gasUsed: r.gasUsed.toString(),
      submission: txs[i]!.to && equal(txs[i]!.to!, expected[i]!.to) ? 'direct' : 'wallet-delegation-manager',
    })),
    permissionErrorsVerified: true,
  };
}
