# World Appが開かない件：公開情報による再評価

確認日：2026-09-26。mintaのスマホでも、ブラウザーだけで認証フローが完了した。
これはユーザーの観測。今回、その端末のIDトークンや通信ログは取得していない。

## 結論

最有力は、**架空のIDを使うsandboxに、本番World Appの証明体験を期待していたこと**。
サーバー内部の証明生成経路は公開されていないため、アプリが開かない直接原因まで断定しない。
一方、従来の「amrがpopだから再認証されていない」「パラメーターが無視された」
という説明には、公式ガイドに照らして訂正が必要。

## 確認できた事実

1. 公式フロントエンドの環境表示関数は `sandbox.auth.world.org` に対して
   `Sandbox` / **“Uses fake identities.”** を返す。本番ホストにはこの注意表示がない。
   他のテストホストにはmock proofsを含む別の注意表示がある。後者の文言をsandboxの
   バックエンド実装の証明として流用しない。
2. 公式 `getting-started` ガイドは、非本番のテスト証明を本番のverificationの証拠に
   できないと明記している。sandboxの署名付きトークンや `orb-v3` だけでは、
   実際のOrb登録済み人間を確認したとは主張できない。
3. 公式 `step-up` ガイドは、`max_age=0` と `prompt=login` のどちらも新しいWorld proofを
   要求すると説明している。同じガイドで `amr` は `["pop"]` と規定している。
   **popはfresh proofの否定ではない。** MFAや生体認証を意味する値でもない。
4. 同ガイドではセッション再利用は元の `auth_time` を保持する。時刻が更新されたという
   観測だけでセッションの時刻偽装・パラメーター無視と断定できない。
5. 現在のYohaku実装は、discovery経由のauthorization endpointにS256 PKCE、
   nonce、`max_age=0`、対応advertisementがある場合の `prompt=login` を指定する。
   この基本的な方式選択・パラメーターには公式ガイドとの明白な不一致はない。

## 何を直すべきか

### まず説明の訂正

- 「popだから人は何もしていない」を削除する。観測した「World Appが開かなかった」と、
  tokenの認証方法の意味を分ける。
- 「sandboxで実際のOrb登録済み人間を確認した」ではなく、
  「sandboxのテストIDを使い、OIDCの署名・nonce・鮮度などを検証した」とする。
- `mfa` を必須にして直そうとしない。このWorld認証クラスの契約にない値を要求すると、
  正常なWorld proofまで拒否する。

### 本物のWorld Appで検証する場合

第一候補は、現在のOIDC方式を維持し、本番で登録したクライアントを使って試すこと。
issuer・client ID・secretを同一環境に揃える。sandboxのsecretを本番へそのまま流用しない。
本番ポータルの利用資格と、互換性のあるWorld IDアプリ／legacy World ID 3.0 Orb credentialが
必要。**World Appがインストール済みという事実だけでは、この互換性は確認できない。**
本番で必ず解決することは未検証。

第二候補は、同じIdPの **device authorization grant**。
公式 `oidc` ガイドでは、ユーザーコードの照合、新しいproof、明示的な承認／拒否があり、
既存ブラウザーcookieはfresh proofを代替しない。エージェントの操作を人間が許可する
用途には適合するが、device開始・期限付きpolling・結果と依頼の結び付けが必要。
**sandboxのまま方式だけ替えても、本番の本人確認の証拠にはならない。**
この時点では全面移行の判断は保留した。その後のIDKit登録結果は末尾に記載する。

### 自分たちの検証ロジックにも残る課題

公式step-upは、再認証前後の `(iss, sub)` と対象操作を結び付け、
`max_age=0` の場合は今回の認証開始以後のproofかを確認するよう求める。
現在の実装はnonceと120秒の鮮度を確認するが、認証開始時刻との比較を行わず、
所有者に事前連携したWorldアカウントとの一致も確認しない。
これは「アプリが開かない原因」とは別の実装課題。
任意の来場者が試せるデモと、特定所有者しか承認できない製品を区別する必要がある。

## 出典・再現方法

ログイン不要の公式一次資料だけを使用。外部への認証、クライアント登録、秘密情報の取得はしていない。

- 公式入口：`https://sandbox.auth.world.org/llms.txt`
- OIDC discovery：`https://sandbox.auth.world.org/.well-known/openid-configuration`
- 公開MCP：`https://sandbox.auth.world.org/mcp`
  - `tools/call` → `get_idp_guide`、引数 `{"id":"getting-started"}` / `{"id":"oidc"}` / `{"id":"step-up"}`。
  - ガイド識別子は `worldid://guides/getting-started` / `oidc` / `step-up`。
  - JSONレスポンスの `result.structuredContent.content` を読んだ。
- 公開ページ：`https://sandbox.auth.world.org/`
- 同ページが読み込むJS：`https://sandbox.auth.world.org/assets/index-B7TTCPa6.js`
  - 確認箇所：環境表示関数 `$g`。配信ファイル名は更新される可能性がある。
- 実装：`src/adapters/world-oidc.ts`、`src/server/app.ts`。

取得データのSHA-256（後日のドキュメント更新と区別するため）：

```text
frontend f80429b66a7aeb564fbb8e0c385e571d084dccbde73b82b072623bbe1af00e29
oidc     44c7a52fa8638c997616e077582d7d61741a34a092d369ce0cfcb80449bdd4e0
step-up  e8e22ed9f13f9a3e3b42a1548b68341c3e22a5ffa5ecb0f6d8ef143af41c9d75
```

この調査では公開サーバーや認証方式の変更は行っていない。

## 追記：IDKitの本番登録はできた（2026-09-26）

以下は上記の公開情報調査に続いて、本人のログイン後に確認した事実。
`auth.world.org/portal` のAgents OIDC開発者アクセスと、
`developer.world.org` のIDKit開発者アクセスは別の入口だった。
後者でWorldによるログイン、Yohakuアプリの作成、署名者の登録が完了した。
公開RP status APIでも `production_status: registered` を確認した。
登録だけで本人の実機証明の成功とはしない。

公式IDKitガイドに沿い、秘密鍵はサーバーに置き、認証依頼に署名する。
ブラウザーでQRを表示し、返った証明をサーバーから本番verify APIへ送って検証する。
この方法を認証単体テストとして追加した。既存のAgents OIDCデモとは接続していない。
手順・制約は [WORLD-IDKIT-PROBE.md](../build/WORLD-IDKIT-PROBE.md)。

追加の一次資料：

- `https://docs.world.org/world-id/idkit/integrate`
- `https://docs.world.org/world-id/idkit/signatures`
- `https://docs.world.org/api-reference/developer-portal/verify`
- `https://developer.world.org/api/v4/rp-status/rp_b14f684c8aeb60f0`
