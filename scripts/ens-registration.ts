/** Read-only registration quotes and optional mint simulation. Never sends a transaction. */
import { readFileSync } from 'node:fs';
import { createPublicClient, formatUnits, http, isAddress, parseAbi, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { loadEnv } from '../src/core/env.js';

loadEnv();
const config = JSON.parse(readFileSync(new URL('../config/ens-suggestions.json', import.meta.url), 'utf8'));
const registrarAbi = parseAbi([
  'function MIN_REGISTER_DURATION() view returns (uint64)',
  'function MIN_COMMITMENT_AGE() view returns (uint64)',
  'function MAX_COMMITMENT_AGE() view returns (uint64)',
  'function rentPriceOracle() view returns (address)',
  'function isAvailable(string label) view returns (bool)',
  'function getRegisterPrice(string label, uint64 duration, address paymentToken) view returns (uint256 base, uint256 premium)',
]);
const tokenAbi = parseAbi([
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address owner) view returns (uint256)',
  'function mint(address to, uint256 amount)',
  'function isPaymentToken(address token) view returns (bool)',
]);

async function main() {
  const label = process.env.ENS_LABEL ?? 'yohaku-minta-2026';
  if (!/^[a-z0-9-]+$/.test(label)) throw new Error('ENS_LABEL must be a single ASCII label');
  const registrar = config.registrar.value as Address;
  const ownerValue = process.env.ENS_OWNER_ADDRESS;
  if (ownerValue && !isAddress(ownerValue)) throw new Error('Invalid owner');
  const owner = ownerValue as Address | undefined;
  const client = createPublicClient({ chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL ?? config.rpc.value, { retryCount: 0, timeout: 15000 }) });
  if (await client.getChainId() !== sepolia.id) throw new Error('Wrong chain');
  const blockNumber = await client.getBlockNumber();
  const read = { address: registrar, abi: registrarAbi, blockNumber };
  const [minDuration, minCommitmentAge, maxCommitmentAge, oracle, available] = await Promise.all([
    client.readContract({ ...read, functionName: 'MIN_REGISTER_DURATION' }),
    client.readContract({ ...read, functionName: 'MIN_COMMITMENT_AGE' }),
    client.readContract({ ...read, functionName: 'MAX_COMMITMENT_AGE' }),
    client.readContract({ ...read, functionName: 'rentPriceOracle' }),
    client.readContract({ ...read, functionName: 'isAvailable', args: [label] }),
  ]);
  const duration = process.env.ENS_DURATION_SECONDS ? BigInt(process.env.ENS_DURATION_SECONDS) : 31536000n;
  if (duration < minDuration) throw new Error('Duration below registration minimum');
  const report: Record<string, unknown> = {
    checkedAt: new Date().toISOString(), scope: 'read-only quote; registration and mint not executed',
    chainId: sepolia.id, blockNumber, label, registrar, oracle,
    available, duration, minDuration, minCommitmentAge, maxCommitmentAge,
  };
  if (owner) report.ownerGasBalanceETH = formatUnits(await client.getBalance({ address: owner, blockNumber }), 18);
  const tokens: Record<string, unknown>[] = [];
  for (const entry of config.paymentTokens as { value: Address }[]) {
    const token = entry.value;
    const supported = await client.readContract({
      address: oracle, abi: tokenAbi, functionName: 'isPaymentToken', args: [token], blockNumber,
    });
    if (!supported) { tokens.push({ token, supported }); continue; }
    const [symbol, decimals] = await Promise.all([
      client.readContract({ address: token, abi: tokenAbi, functionName: 'symbol', blockNumber }),
      client.readContract({ address: token, abi: tokenAbi, functionName: 'decimals', blockNumber }),
    ]);
    const result: Record<string, unknown> = { token, supported, symbol, decimals };
    if (available) {
      const [base, premium] = await client.readContract({
        ...read, functionName: 'getRegisterPrice', args: [label, duration, token],
      });
      const total = base + premium;
      Object.assign(result, { base, premium, totalAtomic: total, totalTokens: formatUnits(total, decimals) });
      if (owner) {
        result.ownerBalance = formatUnits(await client.readContract({
          address: token, abi: tokenAbi, functionName: 'balanceOf', args: [owner], blockNumber,
        }), decimals);
        await client.simulateContract({
          address: token, abi: tokenAbi, functionName: 'mint',
          args: [owner, total], account: owner, blockNumber,
        });
        result.mintSimulation = 'eth_call succeeded; no mint transaction submitted';
      }
    }
    tokens.push(result);
  }
  report.tokens = tokens;
  console.log(JSON.stringify(report, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
}
main().catch(() => {
  console.error('ENS quote failed. Check RPC, label, duration, token and ABI configuration. No transaction sent.');
  process.exitCode = 1;
});
