# 審査員が自分のWorld IDで承認するデモ

2026-09-26。minta本人への固定はしない。対応するOrb資格を持つ来場者が、
自分で始めたデモの依頼について、人間であることを証明して承認できる。

## 体験

1. 審査員が `/try` を開く。送金を試すなら自分のBase Sepolia受取アドレスを入力する。
   認証と承認だけを試す場合は「Skip — just show me the screen」。
2. 依頼内容を見て「Yes」。
3. 「Approve with World ID」を押し、PCならWorld AppでQRを読み取る。
   スマホなら「Open World ID on your phone」から進む。
4. 本番の証明が有効なら、その依頼を承認する。保留中の支払いがある場合だけ決済を呼ぶ。
5. 成功画面で承認と送金の結果を別々に表示する。
   「Verification & payment details」には検証方式・時刻・取引結果を表示する。

アプリ内ブラウザーへ移動したあと、開始したブラウザーのタブへ戻る。
cookieを消したり別ブラウザーで続行すると、自分の依頼であることを照合できない。
QRの待機は110秒、サーバーの認証依頼は最大120秒。期限切れなら新しく開始する。
誰でも登録不要で試せるが、対応資格を持つWorld IDは必要。World Appのインストールだけでの成功は保証しない。

## 公開サーバーへの設定（kou担当）

PR #7のこの実装を取り込み、通常のサーバーと同じディレクトリで `npm ci` と
`npm run check` を実行する。World SDKとブラウザーバンドル用のesbuildも必要なので、
この構成では `--omit=dev` を使わない。

```dotenv
WORLD_IDKIT_DEMO_ENABLED=true
WORLD_IDKIT_DEPLOYMENT=public
WORLD_IDKIT_ORIGIN=https://mac-studio.taila649e1.ts.net
WORLD_IDKIT_SIGNING_KEY=<kouの公開サーバーで生成済みの専用秘密鍵・非公開設定>
```

- 公開専用アプリ `Yohaku Public Demo` の登録を確認済み。
  公開IDと出典は `config/world-idkit-public.json` にある。
  kouの署名者 `0x04991e8195205D570624fDB2731315B8723Bed32` を登録したので、
  サーバーに生成済みの鍵をそのまま使う。秘密鍵の引き渡しは不要。
- `WORLD_IDKIT_DEPLOYMENT=public` が公開アプリを選ぶ。省略時は従来のローカルアプリ。
  mintaのローカル設定 `config/world-idkit.json` とその鍵は変更しない。
  どちらの鍵もGitHub、Issue、PR、ログに貼らない。
- `npm run setup:idkit-key` はそのサーバーで新しい鍵を作るので、
  登録済みRPを使う目的で安易に実行しない。署名者が違えば起動を拒否する。
- 既存の `WORLD_*`、x402、ENS、エージェント署名鍵の設定は残す。
  IDKit有効時は来場者デモの承認がIDKitを使い、旧OIDC callbackと生コードの承認APIは拒否する。
- reverse proxyは公開サイトのHostを保持すること。信頼できないforwardedヘッダーでHost検査を迂回しない。
- 普段の起動方法で再起動する。未設定・不正設定なら起動時に失敗し、sandboxへ自動退避しない。
- `/health` の `wired.identityMode` が `idkit-production-visitor-demo` になったことを確認する。
- `/try` を最初から試す。プロセス再起動前の依頼はメモリーから消えている。

ロールバックは `WORLD_IDKIT_DEMO_ENABLED=false` に戻して再起動する。
既存のOIDC設定がそのまま残っていれば従来のsandboxデモへ戻せる。

## 保護している境界

- `/try` で作る依頼と、HttpOnly/SameSite cookieのブラウザーを結び付ける。
  HTTPSではSecure cookieを使う。別ブラウザーは閲覧・認証開始・認証完了・取消を拒否する。
- 証明のsignalには、approveという操作、依頼ID、依頼内容と支払い条件のダイジェスト、
  ランダムな今回の試行IDを結び付ける。画面表示後に内容が変われば新しく開き直す。
- サーバー発行nonce、action、signal、本番環境、Orb/PoH資格、期限、個別API成功を確認する。
- 検証中に依頼が変更・置換・取消・期限切れになった場合も承認しない。
- 検証の試行はAPIを呼ぶ前に消費し、承認状態は決済をawaitする前に確定する。
  同じ証明の再送や並行した承認で決済を二度呼ばない。
- 旧`POST /approvals/:id`と`/auth/world/callback`を有効モードでは遮断する。
  mockやsandboxを経由して本番の確認を飛ばせない。
- 個人のnullifier、証明、World IDとウォレットの対応表は保存しない。
  同じ人が複数回デモを行うことはできる。一人一回の給付の仕組みではない。
- 一般の`POST /requests`から来た所有者向けの依頼を、来場者が承認することはできない。
  自動判定の依頼は従来のルールと決済経路で処理する。

## 検証状況

- 261 tests / 10 claims通過。15件の追加テストで、別来場者、Origin違い、
  旧認証への迂回、使用済み証明、期限切れ、検証中の変更・取消、並行承認を確認した。
- 認証単体では、本番のOrb証明に成功済み：
  [world-idkit.json](evidence/world-idkit.json)。
- 新しい承認フローも12:57:56 JSTに本番Orb証明から `approved` まで成功。
  Chromeの結果詳細で確認した記録：
  [world-idkit-approval.json](evidence/world-idkit-approval.json)。
- このMacの承認テストでは送金を無効にしている。
  x402の既存オンチェーン証跡と、今回のIDKit＋送金一体の実証を混同しない。
- 公開専用RPの登録は公式status APIで確認済み。公開サーバーでの設定切替・再起動と、
  その新しいアプリでの実機認証・送金一体試験は未確認。World ID for Agents賞の適合性は別途確認する。

## Koeへの登録（追加）

同じ本番IDKit設定で `/koe-registration` が使える。既存の `/try` の承認とは別操作で、
今回入力されたプロフィール・ブラウザー・試行IDを `koe-publish` signalに束縛する。
秘密鍵・署名・本番proof verifierは既存のものを再利用する。

1. 公開内容を入力し、掲載同意をチェックして `Verify & publish with World ID`。
2. World Appで認証し、元のタブへ戻る。
3. 本番証明をサーバーで検証したときだけ、1時間限定のメモリー内プロフィールができる。
4. `/koe-registration/directory.json` から公開プロフィールを取得できる。Koeの静的画面もここを読む。
5. 同じブラウザーの `Remove my listing` で削除可能。サーバー再起動でも消える。

Koe登録ハンドラーには依頼台帳も決済アダプターも渡さない。認証でYohakuの依頼が承認されたり、
送金されたりすることはない。静的な6人は架空・未認証のまま、実参加者と別表示する。
公開プロフィールを取り下げても、第三者が取得済みのコピーまでは削除できない。
Worldはpersonhoodだけを確認し、プロフィール記述の真偽・一人一件・回答配信は保証しない。

公開確認: `/health` の `wired.koeRegistration=true`、新規登録→JSON掲載→削除、
別の試行の取消→未掲載を実機で確認する。本番無効なら503を返し、mockへは退避しない。
