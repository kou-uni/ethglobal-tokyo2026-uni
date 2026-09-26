# 公開デモへのENS反映 — kou向け

2026-09-26。登録と6件の委任実証は完了し、ローカルHTTPサーバーでも実Sepoliaを読み取る
rule 0の拒否を確認済みです。PR #3に実装・証拠・201テストをまとめています。
公開サーバーへの反映とWorld実機確認は未完了です。

## 公開サーバー上で行うこと

1. PR #3をmainへ取り込み、公開サーバーのチェックアウトを更新する。
   既存のローカル変更や稼働プロセスを確認し、現在の運用方法で更新する。
2. リポジトリ直下で実行する。

```bash
npm install
npm run check
npm run setup:ens-server -- --write
```

3. 現在の起動方法でサーバーを再起動する。既存のポート・World callback・決済設定を維持する。
   `tsx watch`が起動していても、`.env` の変更はプロセス再起動が必要。

設定コマンドは6件の実チェーン証拠を再検証し、`.env` の以下4項目だけを更新します。
秘密鍵やWorld・決済の資格情報を渡し直す必要はありません。

- `SEPOLIA_RPC_URL`
- `ENS_NAME`
- `ENS_RESOLVER_ADDRESS`
- `ENS_DELEGATE_ADDRESS`

実環境にexportされた同名変数があれば `.env` より優先されるため、古い値がないか確認してください。

## 反映後の確認

- `/health` の `owner` が `yohaku-minta-2026.eth`。
- `wired.delegationReader` が `true`。これは設定済みの表示であり、RPC正常の証明ではない。
- `actingAs: delegate` / `writeTarget: proposal` の依頼がrule 0で拒否される。
  検証済みアカウントは**取消済み**なので、この拒否が正しい結果。
- `/try` で既存のWorld・決済の体験が維持されている。

健康状態の表示も修正しています。MockIdentityやMockScreeningだけの場合は `false`。
screeningがfalseに変わっても、既存APIが壊れたという意味ではありません。

## 証拠と制限

- 登録: `docs/build/evidence/ens-registration.json`
- 委任: `docs/build/evidence/ens-delegation.json`
- ローカルHTTP接続: `docs/build/evidence/ens-server.json`

サーバーのENS操作は読み取りです。HTTP呼出者の認証、実AIの署名、ENSからのpolicy自動ロードを
実装したという主張はしていません。World Appへの引き継ぎはmintaのスマホで確認待ちです。
`amr: pop`だけでは、本人が今回の依頼をWorld Appで承認したとは確認できません。
