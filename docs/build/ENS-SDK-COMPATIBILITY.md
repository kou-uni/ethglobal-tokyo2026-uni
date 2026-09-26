# ENS SDK compatibility — 2026-09-26

Issue #1 の指定バージョンをインストールして確認したところ、既存の調査メモと公開パッケージは別のインターフェースでした。**「未確認は登録費用だけ」という前提を保留します。**

| | インストールした `@ensdomains/ensjs@5.0.0-sepolia-fix.1` | 既存調査が参照する main ソース |
|---|---|---|
| text 権限付与 | `authorizeTextRoles(DNS名, key, account, true)` | `grantSetterRoles(setter, account)` |
| 取り消し | 同じ関数に `false` | setter の権限取り消し |
| スコープ | 名前とキー | キー（resolver 内全名前） |
| resource | `keccak256(namehash(name) ‖ keccak256(bytes(key)))` | `keccak256(bytes(key))` |

`ROLE_SET_TEXT = 16` は共通ですが、他の role の配置まで共通とは限りません。
既存の `MockPermissions` と `plannedSetup()` はデモ用モデルであり、接続先にそのまま送れる実装ではありません。

## 今回動かせるもの

```bash
npm run ens:check
```

鍵・資金不要。固定の例示アドレスで、**実際にインストールした公式SDK**から付与／取り消し calldata と各キーの resource を生成します。ネットワーク通信や署名はしません。

実際の所有者・委任先・resolver が分かったら `.env` に以下を設定します。

```dotenv
SEPOLIA_RPC_URL=
ENS_NAME=
ENS_OWNER_ADDRESS=
ENS_DELEGATE_ADDRESS=
ENS_RESOLVER_ADDRESS=
```

```bash
npm run ens:check -- --rpc
```

Sepolia の chain ID とコードの存在を確認し、同一ブロックに対して所有者からの付与／取り消しを `eth_call` します。秘密鍵は不要で、トランザクションは送信しません。resolver は売り手が所有する実体を指定し、実装コントラクトのアドレスで代用しません。

**シミュレーションの成功だけでは互換性や権限制御の証明にはなりません。** fallback が呼び出しを受ける場合もあります。2回の呼び出しは独立しており、付与後の状態で取り消しを検証するものでもありません。

## 未完了

ローカル検証：`npm run check`（型チェック・136テスト・10項目の整合確認）と
`npm run ens:check` が成功。`--rpc` は未実行。オンチェーン操作の成功はまだ主張しません。

- 接続先のデプロイと、対応するソース／ABIのバージョンの特定。
- 名前の登録費用・資金調達、resolver の用意。
- 実際の付与後の `hasRoles`、proposal 書き込み成功、policy 拒否、取り消し後の proposal 拒否。
- `PermissionsPort` の実チェーン実装とサーバーへの接続。

## 再確認できる根拠

npm 配布物内の以下のファイルを確認しました。`package-lock.json` にバージョンと integrity を固定しています。

- `node_modules/@ensdomains/ensjs/src/actions/wallet/v2/grantResolverRoles.ts`
- 同 `revokeResolverRoles.ts`
- `node_modules/@ensdomains/ensjs/src/utils/v2/roles/resolverResource.ts`
- 同 `resolverRoles.ts`

比較した公式 main:
<https://github.com/ensdomains/ensjs/blob/main/packages/ensjs/src/actions/wallet/v2/resolver/grantResolverRoles.ts>

main の変更と npm の公開は同時とは限りません。どちらが現在のデプロイに合うかは、この比較だけでは決定しません。
