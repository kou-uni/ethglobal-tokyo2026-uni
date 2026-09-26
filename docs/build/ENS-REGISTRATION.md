# ENS登録の費用と資金 — Issue #1 手順0

**実行：2026-09-26 01:25:52 UTC。Ethereum Sepolia、ブロック11782986。**
読み取りと `eth_call` の結果です。mint・approve・登録トランザクションは送っていません。

## 登録見積もり

| 項目 | 実測結果 |
|---|---|
| 調査用の候補名（採用・取得はしていない） | `yohaku-minta-2026.eth` |
| 空き状況 | available |
| 期間 | 31,536,000秒（365日） |
| 最小登録期間 | 2,419,200秒（28日） |
| commitの最小待ち時間 | 60秒 |
| commitの最大有効時間 | 86,400秒 |
| MockUSDC支払い | **8.000021**（8,000,021 atomic、premium 0） |
| MockDAI支払い | **8.000020944**（premium 0） |

見積もりは当該ブロック・名前・期間に対する値です。登録直前に再取得します。

## トークンは専用のmock。無料mintが可能

| トークン | Ethereum Sepolia上のアドレス |
|---|---|
| MockUSDC | `0x16f95d91dba7da3aca778ec053df0ff6c6a8aa8e` |
| MockDAI | `0x278053acc97888e63ec81c80fec641bf0bf19664` |

Registrar の `rentPriceOracle()` を読み、そのoracleで両方の
`isPaymentToken(token) == true` を確認しました。
公式のmock実装は公開の `mint(address,uint256)` を持ちます。
指定された受取先をsenderにも設定して、登録料金分のmintを `eth_call` で試し、両方成功しました。
**トークンのmint自体に代金は不要ですが、実際の送信にはガス用のSepolia ETHが要ります。**

Base Sepoliaのx402用USDC、およびCircleのEthereum Sepolia USDCとは別コントラクトです。
手元のトークンを使えるかは名称ではなくコントラクトアドレスで確認します。

## 現在の不足

**後続確認：ユーザーがガスを補充し、このアドレスでEthereum Sepolia 0.05 ETHを確認しました。**
署名を行うローカル画面は [ENS-WALLET-SETUP.md](ENS-WALLET-SETUP.md) を参照してください。
以下の0残高は、補充前のブロック11782986の記録です。

ユーザー指定アドレス `0x5f52FA3c5DF22d8c89fA6c2221E2aeBd6FE722bD` について同じブロックで確認：

- Ethereum Sepolia ETH：**0**
- 上記MockUSDC／MockDAI：**どちらも0**

必要なのは、テストETHの補充、ウォレットでのmint署名、その後のresolver用意・名前登録です。
委任先からの実書き込み検証には、別アカウントとそのガスも必要です。
このアドレスを実際のENS所有者にする操作はまだしていません。

## 再確認

```bash
npm run ens:registration
```

`.env` の `ENS_OWNER_ADDRESS` があれば、所有者の残高とmintのシミュレーションも確認します。
秘密鍵は不要です。名前は `ENS_LABEL`、期間は `ENS_DURATION_SECONDS`、RPCは
`SEPOLIA_RPC_URL` で変更できます。初期値・トークン候補は
`config/ens-suggestions.json` に出典付きで保存しています。

## 次の実装

1. テストETHがある署名用ウォレットを用意する。
2. mockトークンをmintし、Registrarへの必要額のapproveを行う。
3. 所有者用のpermissioned resolverを用意し、名前をcommit→registerする。
4. `proposal`付与・書き込み、`policy`拒否、取消後の`proposal`拒否を確認する。

資金準備後も、名前登録とresolverの作成・ウォレット接続は未実装です。

## 出典

- ENS公式デプロイ一覧：<https://docs.ens.domains/learn/deployments>
- 一覧が参照する固定コミット：`ensdomains/contracts-v2@71a3b7339dbc55ab47667abdfe8303bac4f4c24e`
- 同コミットの `contracts/deployments/sepolia/MockUSDC.json` / `MockDAI.json`
- 同コミットの `contracts/test/mocks/MockERC20.sol`（無権限のmint）
- Registrar ABI：`contracts-v2/post-audit-2/contracts/src/registrar/ETHRegistrar.sol`
- oracle ABI：同 `interfaces/IRentPriceOracle.sol`
