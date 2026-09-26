# sandboxを残した本番World IDテスト

**2026-09-26追記：この文書はAgents OIDC方式についてです。**
通常のDeveloper Portalでは別方式のIDKitアプリ登録ができました。
現在の実機確認は [WORLD-IDKIT-PROBE.md](WORLD-IDKIT-PROBE.md) を使います。
IDKitのApp IDを、この文書のOIDC Client IDとして流用しないでください。

通常のデモは従来の `WORLD_*` 設定を使い続けます。
本番の確認は `/world-production` だけで行います。
本番テストの成功から、決済・依頼承認・ENS権限付与へは接続していません。
既存のStoreやsettlementへの参照も渡しません。

## 本番クライアントの登録

PCから `https://auth.world.org/portal` に入り、Googleで開発者登録します。
これはWorld Appの本人認証とは別の入口です。
本番ポータルの利用資格により登録できない場合があります。

登録する内容：

- 名前：`Yohaku production identity test`
- クライアント認証方式：`client_secret_basic`
- callback：
  `https://mac-studio.taila649e1.ts.net/world-production/callback`

既存sandboxの `/auth/world/callback` と混ぜないでください。
本番で新しく発行したClient IDとSecretを使います。
Secretは表示が一度だけなので、その場でサーバーの安全な設定に保存してください。
チャット・Issue・GitHub・ブラウザー側のJavaScriptに載せないでください。

## サーバー設定

本番テストを載せるサーバーの `.env` に以下を追加します。
従来の `WORLD_ISSUER`、`WORLD_CLIENT_ID`、`WORLD_CLIENT_SECRET`、
`WORLD_REDIRECT_URI` は変更しません。

```dotenv
WORLD_PRODUCTION_ENABLED=true
WORLD_PRODUCTION_REDIRECT_URI=https://mac-studio.taila649e1.ts.net/world-production/callback
WORLD_PRODUCTION_CLIENT_ID=<本番ポータルで発行したID>
WORLD_PRODUCTION_CLIENT_SECRET=<本番ポータルで発行したSecret>
```

本番issuerとacrは出典付き `config/world-production.json` に固定しています。
未設定、無効なcallback、enabledがtrueでない場合、専用画面は準備中（503）となります。
sandboxの認証情報へはフォールバックしません。

サーバーを現在の起動方法で再起動し、スマホで
`https://mac-studio.taila649e1.ts.net/world-production` を開きます。
既存の `/try` がsandboxのまま動くことも確認してください。

## 実機で確認すること

1. 本番の確認ボタンを押す。
2. Worldの認証画面に移動し、対応アプリの案内に従う。
3. 開始したブラウザーへ戻り、専用画面で結果を確認する。
4. 別の試行ではキャンセルし、成功扱いにならないことを確認する。

World Appが開いたかは、本人の実機観測を別途記録します。
`amr: pop` はWorld公式が規定する認証方法であり、
それだけで新規認証がなかった、生体認証があった、操作が承認された、とは判断しません。

本番フローには互換性のあるWorld IDアプリとlegacy World ID 3.0 Orb credentialが必要です。
インストール済みという理由だけで全員が通れるとは主張しません。

## 検証する境界

- nonce・S256 PKCE・ランダムstate・Secure/HttpOnly/SameSite=Lax cookieで開始ブラウザーへ結び付ける。
- 別ブラウザーのcallback、使用済みstate、5分の期限切れ、キャンセルを拒否する。
- `max_age=0` / `prompt=login`を指定し、`auth_time`が今回の開始時刻以降かつ120秒以内か確認する。
  時刻は秒精度へ揃え、未来の時刻を拒否する。
- discoveryのissuerと各endpointのorigin、本番issuer・audience・RS256署名・expiry・nonce・acr・amrを検証する。
- 外部通信は10秒で期限切れにし、コード交換の自動再送はしない。
- 完了画面に表示するのは認証時刻・acr・amrのみ。subjectとtokenは保存しない。
- 成功してもアカウント連携・APIアクセス権・支払いは作らない。特定所有者本人との照合はこのテストの範囲外。

この画面で本番の認証を確認できたとしても、一般公開可能な製品全体の認証・認可が完成したことにはなりません。

## 実行状況

本番のクライアント登録・設定・実機確認はまだ未実施です。
コードのテストでは署名付きの試験JWTと模擬HTTPを使用し、本番成功とは区別します。

### 2026-09-26 本番ポータルを実画面で確認

ユーザーがログインできたと認識していた画面は、利用者向けの `/browser-sessions` でした。
`/portal` に移動して `Continue with Google` を押すと、
Tools for Humanityの組織用Oktaログインへリダイレクトされました。
この試行では一般のGoogleアカウントによるクライアント作成画面に到達できていません。
追加のアカウント情報は入力せず、アプリ登録・Secret発行も行っていません。

公開ガイドのself-serviceという記載だけでは、この本番環境で参加者が登録可能とは確認できません。
全ての外部利用者が禁止されていると断定するものではありませんが、
現在のブロッカーは本番クライアントを発行するための開発者アクセスです。
認証トランザクションのURLやセッション情報は記録していません。

公式資料・sandbox診断は [WORLD-PUBLIC-DIAGNOSIS.md](../knowledge/WORLD-PUBLIC-DIAGNOSIS.md)。
