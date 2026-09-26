import { createPublicClient, createWalletClient, http, toHex, type Address, type Hash, type Hex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { KEYS, OWNER_ONLY_KEYS } from '../src/ports/permissions.js';
import { textSetter } from '../src/adapters/ens-resolver.js';
import {
  assertDeployment, DELEGATION_GAS, expectPermissionDenial, readDelegateRoles,
  type DelegationDeployment, type prepareDelegation,
} from '../src/adapters/ens-delegation-proof.js';

declare global {
  interface Window { ethereum?: { request(args: { method: string; params?: unknown[] }): Promise<unknown> } }
}
type Plan = Awaited<ReturnType<typeof prepareDelegation>>;
interface State { key: Hex; plan: Plan; value: string; index: number; hashes: Hash[]; pending?: Hash; verified?: unknown }
const $ = (id: string) => document.getElementById(id)!;
const button = (id: string) => $(id) as HTMLButtonElement;
const storageKey = 'yohaku-ens-delegation-v1';
const titles = [
  '所有者 → 検証用ガスを送る', '所有者 → 提案権限だけ付与',
  '委任先 → 提案を書き込む', '委任先 → ポリシー変更が拒否されることを確認',
  '所有者 → 提案権限を取り消す', '委任先 → 提案も拒否されることを確認',
];
let state: State | undefined;
try { state = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null') ?? undefined; } catch { /* fresh tab */ }
const config: DelegationDeployment = await (await fetch('/config')).json();
const client = createPublicClient({ chain: sepolia, transport: http(config.rpc, { timeout: 15000, retryCount: 0 }) });
const save = () => sessionStorage.setItem(storageKey, JSON.stringify(state));
function status(text: string) { $('status').textContent = text; }
function same(a: string, b: string) { return a.toLowerCase() === b.toLowerCase(); }

async function ownerWallet(): Promise<Address> {
  const provider = window.ethereum;
  if (!provider) throw new Error('MetaMaskなどがあるブラウザーで開いてください。');
  const addresses = await provider.request({ method: 'eth_requestAccounts' }) as Address[];
  if (!addresses[0] || !same(addresses[0], config.owner)) throw new Error('登録した所有者のアカウントを選んでください。');
  if (await provider.request({ method: 'eth_chainId' }) !== toHex(sepolia.id)) {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: toHex(sepolia.id) }] });
  }
  return addresses[0];
}

function currentTx() {
  if (!state) throw new Error('No plan');
  const p = state.plan;
  if (state.index === 0) return { from: p.owner, to: p.delegate, value: toHex(BigInt(p.funding)), data: '0x' as Hex };
  if (state.index === 1 || state.index === 4) {
    return { from: p.owner, to: p.resolver, value: '0x0', data: state.index === 1 ? p.grant : p.revoke };
  }
  return {
    from: p.delegate, to: p.resolver, value: '0x0',
    data: textSetter(p.name, state.index === 3 ? KEYS.policy : KEYS.proposal, state.value),
  };
}

function render() {
  $('summary').textContent = `${config.name}\n所有者: ${config.owner}\nresolver: ${config.resolver}\nEthereum Sepolia（11155111）`;
  if (!state) return;
  button('start').hidden = true; $('workflow').hidden = false;
  $('summary').textContent += `\n委任先: ${state.plan.delegate}\n検証用ガス: ${state.plan.fundingETH} ETH`;
  $('steps').replaceChildren(...titles.map((title, i) => {
    const li = document.createElement('li');
    li.textContent = `${i < state!.index ? '✓ ' : i === state!.index ? '→ ' : ''}${title}`;
    if (state!.hashes[i]) li.textContent += `\n${state!.hashes[i]}`;
    return li;
  }));
  button('next').hidden = !!state.verified;
  button('next').textContent = state.index === 6 ? '6件の証拠を再確認' : state.pending ? '送信済みの取引を再確認' : titles[state.index]!;
  $('tx').textContent = state.index < 6 ? JSON.stringify(currentTx(), null, 2) : '署名・送信は完了。チェーン上の証拠を照合します。';
  if (state.verified) { $('done').hidden = false; $('proof').textContent = JSON.stringify(state.verified, null, 2); }
}

button('start').onclick = async () => {
  button('start').disabled = true;
  try {
    await ownerWallet(); status('登録状態とガスの見積もりを確認しています…');
    const key = generatePrivateKey();
    const delegate = privateKeyToAccount(key).address;
    const res = await fetch('/plan', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ delegate }),
    });
    const plan = await res.json();
    if (!res.ok) throw new Error(plan.error);
    state = { key, plan, value: `yohaku-delegation-demo:${crypto.randomUUID()}`, index: 0, hashes: [] };
    save(); render(); status('表示された委任先とテストETHの金額を確認して進めてください。');
  } catch (e) { status(e instanceof Error ? e.message : '準備に失敗しました'); }
  finally { button('start').disabled = false; }
};

async function executeStep() {
  if (!state) throw new Error('No state');
  const p = state.plan;
  if (!same(p.owner, config.owner) || !same(p.resolver, config.resolver) || p.name !== config.name) {
    throw new Error('保存したプランと現在の登録設定が異なります。');
  }
  const ownerStep = [0, 1, 4].includes(state.index);
  const refusal = [3, 5].includes(state.index);
  const account = privateKeyToAccount(state.key);
  if (!same(account.address, p.delegate)) throw new Error('保存された委任先が一致しません。');
  await assertDeployment(client, config);
  if (!state.pending) {
    const tx = currentTx();
    if (ownerStep) {
      await ownerWallet();
      await client.call({ account: p.owner, to: tx.to, data: tx.data, value: BigInt(tx.value) });
      const accounts = await window.ethereum!.request({ method: 'eth_accounts' }) as Address[];
      const chain = await window.ethereum!.request({ method: 'eth_chainId' });
      if (!accounts[0] || !same(accounts[0], p.owner) || chain !== toHex(sepolia.id)) {
        throw new Error('所有者またはチェーンが変更されました。');
      }
      state.pending = await window.ethereum!.request({ method: 'eth_sendTransaction', params: [tx] }) as Hash;
    } else {
      const { roles } = await readDelegateRoles(client, config, p.delegate);
      if (OWNER_ONLY_KEYS.some((key) => roles[key])) throw new Error('委任先に余分な権限があります。検証を中断します。');
      if (state.index === 2 && !roles[KEYS.proposal]) throw new Error('提案権限が付与されていません。');
      if (state.index === 5 && roles[KEYS.proposal]) throw new Error('提案権限がまだ残っています。');
      if (refusal) {
        await expectPermissionDenial(client, config, p.delegate, state.index === 3 ? KEYS.policy : KEYS.proposal, state.value);
      } else await client.call({ account: p.delegate, to: p.resolver, data: tx.data });
      const fees = await client.estimateFeesPerGas();
      if (fees.maxFeePerGas > BigInt(p.funding) / DELEGATION_GAS.totalBudget) throw new Error('ガス価格が予算を超えました。時間を置いて再確認してください。');
      const gas = refusal ? DELEGATION_GAS.refusal : DELEGATION_GAS.proposal;
      if (await client.getBalance({ address: p.delegate }) < gas * fees.maxFeePerGas) throw new Error('委任先のテストETHが不足しています。');
      const signer = createWalletClient({ account, chain: sepolia, transport: http(config.rpc, { retryCount: 0 }) });
      state.pending = await signer.sendTransaction({ to: p.resolver, data: tx.data, value: 0n, gas, ...fees });
    }
    save();
  }
  status(`${titles[state.index]}\n取引の確定を待っています: ${state.pending}`);
  const receipt = await client.waitForTransactionReceipt({ hash: state.pending, timeout: 180000, pollingInterval: 2500 });
  if (receipt.status !== (refusal ? 'reverted' : 'success')) {
    throw new Error('想定と異なる実行結果です。再送・次の工程には進みません。');
  }
  if (refusal && receipt.gasUsed >= DELEGATION_GAS.refusal) throw new Error('ガス不足による失敗の可能性があります。成功扱いにはしません。');
  state.hashes.push(state.pending); delete state.pending; state.index++; save(); render();
}

button('next').onclick = async () => {
  button('next').disabled = true;
  try {
    if (!state) throw new Error('No state');
    if (state.index < 6) await executeStep();
    // Delegate-only operations continue automatically. Every owner operation still opens the wallet.
    while ([2, 3, 5].includes(state.index)) await executeStep();
    if (state.index === 6) {
      status('チェーン上の6件の取引と、取消後の権限を照合しています…');
      const response = await fetch('/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delegate: state.plan.delegate, value: state.value, hashes: state.hashes }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      state.verified = result; save(); render(); status('証拠をローカルのリポジトリにも保存しました。');
    } else status('確認できました。次は所有者のウォレットで署名してください。');
  } catch (e) { status(e instanceof Error ? e.message : '確認できませんでした'); render(); }
  finally { button('next').disabled = false; }
};
render();
