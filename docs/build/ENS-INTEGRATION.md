# ENS読み取りのアプリ接続

所有者側の初期設定画面は [ENS-WALLET-SETUP.md](ENS-WALLET-SETUP.md) を参照してください。

`EnsPermissions` を追加し、`PermissionsPort` の3操作を実装しました。

- `canWrite`：実resolverの `hasRoles(resource, role, account)` を読み取る。
- `isDelegationRevoked`：proposalへの有効権限がなければ停止扱い。履歴上の取消と未付与は区別しない。
- `readText`：拡張resolverの `resolve(DNS名, encodedTextQuery)` でテキストを取得する。

各操作でSepolia・コードの存在・5キーのdecoder互換性を確認します。名前はサーバー設定に
束縛し、別の名前への読み取りは拒否します。許可のキャッシュはせず、次の依頼で取消を再評価します。

## サーバーで有効にする条件

```dotenv
SEPOLIA_RPC_URL=
ENS_NAME=alice.yohaku.eth
ENS_RESOLVER_ADDRESS=
ENS_DELEGATE_ADDRESS=
```

`ENS_NAME` は現在の `policy.owner` と一致する必要があります。
現在はデモpolicyなので `alice.yohaku.eth` です。別の名前を登録しただけでは接続されません。
実際に登録する名前にpolicyを合わせる工程が残ります。

resolverには売り手のインスタンスを設定します。公開されたimplementationのアドレスで
代用しません。`ENS_PROBE_ADDRESS` は診断対象の指定なので、サーバー接続設定とは別です。

`actingAs: delegate` の依頼では、サーバーが設定した委任先アカウントのproposal権限を確認します。
未設定・未付与・取消・RPCエラー・互換性違反はrule 0のdenyです。
policyやpayoutへの変更は、権限の読み取り結果にかかわらず既存のrule 0で拒否します。

`GET /health` の `wired.delegationReader` は**読み取り設定の有無**です。
登録済み・書き込み済み・RPC正常の証明ではありません。

## この接続がしないこと

- **HTTPの送信者認証。** `actingAs` や `who` は自己申告のままです。この読み取りは追加の
  拒否条件で、送信者がその委任先の秘密鍵を持つ証明ではありません。
- **名前とresolverの登録上の結び付きの検証。** 現在は信頼するサーバー設定を読みます。
- **ENSへの書き込み。** サーバーは署名もトランザクション送信もしません。
- policyをENSから自動ロードすること。現在のルーティングpolicyは従来通りです。

したがって、この接続だけで「ENS賞向けの実動デモ完成」とはしません。
登録・委任先の署名・コントラクトでの拒否実証が別途必要です。

## 検証

RPC transportを差し替えたテストで、resource/accountの指定、取消後の再読取、RPC障害、
未知の名前、拡張resolver経由のテキスト取得を検証します。HTTPテストでは、
未設定のdelegate拒否・設定後のproposal・policy拒否・取消・プロバイダー例外を検証します。

**売り手resolverに対する実通信はまだ実施していません。**
実通信が済んでいる範囲は実装コントラクトのdecoder確認と登録見積もりです。
