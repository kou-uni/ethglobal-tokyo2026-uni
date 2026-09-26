# Kou向け：既存Studioで新デモを公開する手順

**実行待ち：mintaのPCで見え方を確認して確定してから公開反映します。
この手順書があること自体を、再起動の開始連絡とは扱わないでください。**

2026-09-26。対象はPR #28の最新版。#23・#27の統合済みコードを含みます。
**Renderの作成・招待・秘密値の移送は今回の作業に含みません。**

Kouの担当は「公開反映して、こちらが実機確認できる状態にする」までです。
World Appを操作して2件の送金を確認する作業は、その後minta側で行います。

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
スマホ引き継ぎを含む現在のローカル版は409 tests・12 claimsが検証基準です。後続の変更で件数が変わった場合は、実際の結果を報告してください。
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
- 外部のスマホ回線から公開ページが開き、Koe・依頼モニター・日本語／英語の画面が表示される。
- 「この環境で未設定：報酬送金」などの設定不足表示が出ない。

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
- 設定不足の表示：なし／あり（項目名だけ）
- 通常依頼・表示枠の保存先：設定済み／未確認（秘密値は不要）
- 支払い用プロセス：1つ
- Funnel自動復旧・大会中のスリープ防止：確認済み／未確認
- 進行中の決済：なし／あり／不明
- mintaの実機確認を始められる：はい／いいえ
```

報告後、minta側で **50件の振り分け→World認証→委任報酬→本人回答報酬→回答受渡し→Explorer照合** を行います。
Kouが2件の送金まで先に実行する必要はありません。動いている間は再起動しないでください。
未確認のまま「実送金まで完走」とは報告しません。

## うまくいかないときの確認先

| 現象 | 次に確認すること |
| --- | --- |
| `/experience` が404 | 古いコード・違うサービスを見ていないか。反映commitとFunnelの転送先 |
| `/experience` が503／準備中 | 新デモの有効化、production IDKit設定、設定変更後の再起動 |
| `wrong_host` / `wrong_origin` | 公開URLと `WORLD_IDKIT_ORIGIN` の一致。余分なpath・末尾スラッシュも確認 |
| ローカルhealthは正常、公開だけ失敗 | Funnelの状態と自動復旧スクリプト。アプリの鍵を作り直す必要はない |
| Jev・審査・報酬が未設定と表示 | そのサーバープロセスが元の設定を読み込んでいるか |
| 認証が通るのに送金失敗 | 画面のエラー名、既存の署名枠、買い手のテストUSDC残高、facilitator。取引が不明なら追加署名せず照合 |

設定一覧と運用範囲は [HOSTING-MIGRATION.md](HOSTING-MIGRATION.md)、
実演の仕様は [LIVE-EXPERIENCE.md](LIVE-EXPERIENCE.md) を参照してください。
