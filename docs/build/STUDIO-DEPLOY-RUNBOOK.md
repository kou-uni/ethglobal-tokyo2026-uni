# Kou向け：既存Studioで新デモを公開する手順

**公開反映を再開してください。mintaが「デモはこれで確定」と承認しました。
PR #28の待機依頼（コメント `5846982185`）は、この承認により解除です。**

対象はPR #28の最新版。承認されたアプリの実装は `f6211ea` です。
#23・#27に加え、Kouの提出用資料まで含むmain `1ff17a0` も統合済みです。
エージェントの仕事場、人間向けのスマホWebアプリ、認証前のスマホ引き継ぎを公開します。
**Renderの作成・招待・秘密値の移送は今回の作業に含みません。**

Kouの担当は「公開反映して、こちらが実機確認できる状態にする」までです。
World Appを操作して2件の送金を確認する作業は、その後minta側で行います。
承認されたのは見え方と公開反映の再開です。実機でのWorld認証・実送金の成功は、まだ未確認です。

## 先に全体の順番

1. PR #28の最新版をmainへマージ。
2. Studioでmain取得、依存更新、`npm run check`。
3. 新デモを有効化し、既存のAPI・署名・x402設定を維持。
4. 認証・決済が進行していないタイミングで既存プロセスを1つだけ再起動。
5. 公開URLのhealthとアプリ画面を確認し、下のテンプレートでPRへ返信。
6. mintaがスマホへ引き継ぎ、World認証・本人回答・2件の取引照合を実施。

## 1. 反映対象と現在地を確認

GitHubでPR #28を確認し、mainへマージしてください。#23・#27を個別に再統合する必要はありません。
以下のコマンドは、**Studio側のこのリポジトリのルート**で実行します。

```sh
git status --short
git rev-parse HEAD
```

未コミットの変更があれば、消さずに内容を確認します。現在のcommitと起動方法を控えてください。
コードの更新だけでは、起動済みのサーバーやブラウザ用JavaScriptは新しくなりません。

## 2. mainを取得して検査

```sh
git fetch origin
git switch main
git pull --ff-only origin main
npm ci --include=dev
npm run check
```

Nodeは `package.json` の条件に合うものを使用します。tsxとesbuildがサーバー起動に必要なので、
devDependenciesを省かないでください。

**完了条件：** `npm run check` が終了コード0。
スマホ引き継ぎを含む版は409 tests・38 files・12 claimsが検証基準です。後続の変更で件数が変わった場合は、実際の結果を報告してください。
`pull --ff-only` が失敗した場合は、強制リセットせずStudioのブランチ差分を確認します。

## 3. 既存の設定へ新デモの設定を追加

Studioで今使っている `.env` または起動サービスの環境変数に、次を設定します。
`.env` に書く場合は引用符を付けず、同じ項目の古い行を更新してください。

```dotenv
YOHAKU_EXPERIENCE_ENABLED=true
WORLD_IDKIT_DEMO_ENABLED=true
WORLD_IDKIT_DEPLOYMENT=public
WORLD_IDKIT_ORIGIN=https://mac-studio.taila649e1.ts.net
PORT=8402
```

通常依頼と日次表示枠の保存先は、既存の指定があれば維持します。
まだ指定がなければ、リポジトリを起動時の作業ディレクトリとして以下を使えます。

```dotenv
REQUEST_STATE_FILE=.yohaku/requests.json
ATTENTION_STATE_FILE=.yohaku/attention.json
```

```sh
mkdir -p .yohaku
test -w .yohaku
```

実際にサーバーを起動するユーザーで書き込めることを確認してください。
これらは非公開の実行時データであり、Gitへ追加しません。新デモの30分間のセッションは永続化対象ではありません。

既存の **Jev・Intercepta・World署名鍵・買い手鍵・x402・ENS** の設定値は維持します。
`DEMO_SIGNS_PER_HOUR` も既存の制限を維持。未指定時の既定値は40です。
プロセスの環境変数は `.env` より優先されるため、起動サービスに古い `false` や別originが残っていないか確認してください。
`.env` 全文や鍵をPRへ貼る必要はありません。

## 4. 既存サーバーを一度だけ再起動

切替直前に、認証中・決済中の実演がないことを確認してください。
前のプロセスを今の管理方法で正常終了し、**同じ作業ディレクトリ・設定を使って**起動し直します。
手動で `npm start` している場合は、そのターミナルで終了してから次を実行します。

```sh
npm start
```

サービス管理で起動している場合は、その既存サービスを再起動し、別途 `npm start` を重ねて実行しません。
8402のサーバーとFunnelを維持し、買い手鍵を使うサーバーを2つ同時に動かさないでください。

**完了条件：** 起動エラーがなく、8402で待受し、facilitatorの設定確認も成功していること。
ログに秘密値を含む部分があれば、そのまま貼らずエラー名だけを報告します。

## 5. ローカル接続と公開ページを確認

まず、送金もWorld認証も行わない読み取り確認です。

```sh
curl --fail --silent --show-error http://127.0.0.1:8402/health
curl --fail --silent --show-error https://mac-studio.taila649e1.ts.net/health
curl --silent --output /dev/null --write-out '%{http_code}\n' https://mac-studio.taila649e1.ts.net/experience
curl --silent --output /dev/null --write-out '%{http_code}\n' https://mac-studio.taila649e1.ts.net/experience/app.js
```

**完了条件：**

- ローカル・公開のhealthが `ok: true`。
- `wired.experience / classifier / identity / screening / settlement` がすべて `true`。
- `identityMode` がproduction IDKitのモード。owner対応追加で表示名が変わっていても問題ありません。
- `/experience` と `/experience/app.js` がHTTP **200**。
- PCで「エージェント／人間アプリ」を切り替えられ、エージェント側に「Koeで探す／依頼／回答」がある。
- 外部のスマホ回線から公開ページが開き、人間側に「受信箱／報酬／マイスペース」の下部メニューがある。
- 日本語／英語を切り替えられる。再読み込みしても旧画面のままなら、反映commitと起動プロセスを確認する。
- 「この環境で未設定：報酬送金」などの設定不足表示が出ない。
- 公開版に黄色い `REHEARSAL` 帯がない。`/tmp/yohaku-local-rehearsal.ts` はこのPCだけの確認用で、Studioには移さない。

`health` のtrueは接続設定の有無を主に表すもので、送金完了の証拠ではありません。
特に買い手鍵の不足はhealthだけでは判断できないため、画面の設定不足表示も確認します。
production originを設定しているので、localhostの `/experience` が `wrong_host` になるのは想定どおりです。
画面の確認には公開URLを使い、originをlocalhostへ変更しないでください。

## 6. ここまで終わったらPRへ報告

次を埋めて返信してください。**未確認の項目は未確認のままで構いません。**

```text
Studio反映完了
- 反映commit：
- npm run check：成功／失敗（実際の件数）
- /health：experience / classifier / identity / screening / settlement =
- 公開 /experience と app.js：HTTP
- 外部回線のページ表示・日英切替：
- エージェント画面と人間アプリの下部メニュー：表示／未確認
- 設定不足の表示：なし／あり（項目名だけ）
- 通常依頼・表示枠の保存先：設定済み／未確認（秘密値は不要）
- 支払い用プロセス：1つ
- Funnel自動復旧・大会中のスリープ防止：確認済み／未確認
- 進行中の決済：なし／あり／不明
- mintaの実機確認を始められる：はい／いいえ
```

報告後、minta側で **50件の振り分け→スマホ引き継ぎ→World認証→委任報酬→本人回答報酬→回答受渡し→Explorer照合** を行います。
Kouが2件の送金まで先に実行する必要はありません。動いている間は再起動しないでください。
未確認のまま「実送金まで完走」とは報告しません。

## 7. 反映後、minta側で行うスマホ実演

1. PCで `https://mac-studio.taila649e1.ts.net/experience?lang=ja&view=discover` を開く。
   Koeを見てから依頼を作成する。受取先はmintaのテストアドレス
   `0x5f52FA3c5DF22d8c89fA6c2221E2aeBd6FE722bD` を使う。
2. 50件の処理完了後、**World認証より先に「スマホへ引き継ぐ」** を押す。
   スマホのカメラでQRを読み、ブラウザで「この依頼を引き継ぐ」を押す。
   引き継ぎQRは一度限り・2分間。Worldの認証用QRとは別です。
3. スマホで受取先と2件の提示額を確認し、World IDを開始する。
   World Appで認証したら、**元のスマホのブラウザタブへ戻る**。自動復帰を前提にしません。
4. 受信箱で委任分の結果を確認し、質問カードから本人回答を送る。報酬・受渡し記録を開く。
5. PC側は閲覧専用になり、「回答」画面に支払い済みの回答が届く。スマホの下書き・認証操作はPCから扱えません。
6. ExplorerまたはRPCで、2件の送金先・USDC額・成功を照合する。
   依頼IDと取引リンクを記録し、未確認の送金を追加送信しません。

スマホだけで始める場合は `/experience?lang=ja&view=work&device=phone`。
PCでWorld認証を始めてしまったセッションは、その後スマホへ引き継げません。
詳しい境界は [MOBILE-APP-EXPERIENCE.md](MOBILE-APP-EXPERIENCE.md) を参照してください。

## 8. 実機確認が終わったら提出文を揃える

Kouの `docs/submission.json` にある `Demonstration link` は、現時点では説明ページの `product.html` です。
新経路の実演が完走したら、操作するデモのURLを
`https://mac-studio.taila649e1.ts.net/experience` に揃え、`npm run build:submit` でコピー用ページを更新します。
`How it's made` に残る旧OIDCの説明も、現行のIDKit/Orb経路と区別して見直してください。
新しいスマホ経路の取引は確認した結果を記載し、旧 `/try` の証拠を転用しません。
これは公開反映後の作業であり、Kouの反映完了報告を待たせる必要はありません。

## うまくいかないときの確認先

| 現象 | 次に確認すること |
| --- | --- |
| `/experience` が404 | 古いコード・違うサービスを見ていないか。反映commitとFunnelの転送先 |
| `/experience` が503／準備中 | 新デモの有効化、production IDKit設定、設定変更後の再起動 |
| `wrong_host` / `wrong_origin` | 公開URLと `WORLD_IDKIT_ORIGIN` の一致。余分なpath・末尾スラッシュも確認 |
| ローカルhealthは正常、公開だけ失敗 | Funnelの状態と自動復旧スクリプト。アプリの鍵を作り直す必要はない |
| Jev・審査・報酬が未設定と表示 | そのサーバープロセスが元の設定を読み込んでいるか |
| 認証が通るのに送金失敗 | 画面のエラー名、既存の署名枠、買い手のテストUSDC残高、facilitator。取引が不明なら追加署名せず照合 |
| スマホ引き継ぎができない | World認証開始前か、QRが2分以内か、スマホ側に別の実演セッションが残っていないか。使用済みQRを再利用しない |

設定一覧と運用範囲は [HOSTING-MIGRATION.md](HOSTING-MIGRATION.md)、
実演の仕様は [LIVE-EXPERIENCE.md](LIVE-EXPERIENCE.md) を参照してください。
