# 公開デモは既存Studioを更新する

**mintaがデモの見え方を確定しました。公開反映の保留を解除し、以下の手順でStudioを更新します。**

2026-09-26。mintaの最新方針は、移行よりも「映えて、分かりやすく、実処理で一連を完走するデモ」を優先すること。
**当面は既存のStudioの公開HTTPS URLを使用します。Renderへの移行は必須ではありません。**
Renderアカウントは作成済みですが、サービス作成・課金契約・秘密値の移送・公開切替は行っていません。

**Kou向けの実行手順・確認コマンド・完了報告テンプレートは
[STUDIO-DEPLOY-RUNBOOK.md](STUDIO-DEPLOY-RUNBOOK.md) にまとめています。まずこちらから進めてください。**

## 反映する内容

このPR #28に、PR #23（説明・アニメーション）、PR #27（通常依頼の決済・所有者認証・永続化修正）と
Kouの提出用資料を含むmain `1ff17a0` を統合しています。承認済みアプリの実装は `f6211ea`。
`/experience` にエージェントの仕事場と人間のスマホWebアプリがあり、Koe名簿、実判定モニター、
スマホ引き継ぎ、Worldログイン、本人回答、テストUSDC報酬とExplorerをつなぎます。
Kouの22:42 JSTの返答は設定情報の引き継ぎです。新しいデモの公開完了ではありません。

| 項目 | 確認できた状態 |
| --- | --- |
| 公開origin | `https://mac-studio.taila649e1.ts.net` |
| Kou報告の稼働commit | `9182afa`。新しい体験画面より古い |
| 起動 | リポ直下の `npm start`、PORT 8402、Tailscale Funnel経由 |
| 接続 | Jev・Intercepta・production World・x402・ENS読取は既存healthで有効 |
| 新しい体験画面 | healthに `experience` がまだない。反映が必要 |
| PR #27の保存ファイル | Kou報告時点では未使用。移す旧ファイルはない |

## Kouへお願いする公開作業

1. このPRの統合内容をmainへ反映する。#23や#27との競合はこのブランチで解消済み。
2. 現在認証中・決済中のデモがないことを確認してから、Studioのコードを更新する。
3. **`YOHAKU_EXPERIENCE_ENABLED=true` を追加する。** 既存のJev・Intercepta・買い手鍵・x402設定は維持する。
   Worldは `WORLD_IDKIT_DEPLOYMENT=public`、`WORLD_IDKIT_DEMO_ENABLED=true`、
   `WORLD_IDKIT_ORIGIN=https://mac-studio.taila649e1.ts.net` を維持する。秘密値をGitHubへ転記する必要はない。
4. PR #27用の `REQUEST_STATE_FILE` と `ATTENTION_STATE_FILE` をStudio内の非公開・書込可能な保存先へ設定する。
   例はリポ直下の `.yohaku/requests.json` と `.yohaku/attention.json`。通常依頼と日次表示枠を保存する。
   新しい体験のWorld待ち・回答・セッションは一時データのまま。保存範囲を混同しない。
5. 支払いに使うプロセスは1つで起動する。`DEMO_SIGNS_PER_HOUR` を確認し、デモ中の自動再起動を避ける。
6. `/health` の `experience / classifier / identity / screening / settlement` を確認する。
7. `/experience` を外部端末から開けることを確認して、反映commitとhealthの非秘密の結果をPRへ返す。

Funnelの自動復旧スクリプトが古いtailscaledを指していた件は、Kou側で修正予定との返答でした。
大会中のスリープ防止・Funnelの稼働と、外部のスマホからの到達を確認してください。

## 公開反映後の実機確認

審査で開く予定のURL：**`https://mac-studio.taila649e1.ts.net/experience`**。
反映前は旧版のため、新しいデモが稼働済みとは扱いません。

1. Koeでエージェントが人の体験を発見する場面を見せる。登録は任意で、実演の必須手順にはしない。
2. 受取先を指定し50件を生成。実処理の件数・理由と、それに対応するアニメーションを見る。
3. World認証を始める前に「スマホへ引き継ぐ」を押し、スマホのブラウザで引き継ぐ。
4. 表示された受取先と2件のテストUSDC額を確認してWorld認証。World Appから元のスマホのブラウザへ戻り、委任分1件を受け取る。
5. 人間の受信箱で本人回答を入力して送信する。再審査・x402決済後、スマホの報酬履歴とPCの買い手用受信箱を確認する。
6. ExplorerまたはRPCで2取引の受取先・金額を独立照合する。

実行結果・取引リンクを記録してください。旧 `/try` の成功を新経路の完走証拠にはしません。
失敗や不明な送金を、新しい署名を作る自動再送で回復させません。

説明ページはGitHub Pages、操作するデモはStudioの `/experience` に揃えます。
`docs/experience-origin.js` は既にStudioを向いているため、今回ホスト移行のためのリンク変更は不要です。
提出フォームのデプロイURL欄が必須かはログイン後のフォームで要確認です。公開URLの存在と、実演の完走確認は別です。

## 接続設定の所在

| 用途 | 環境変数 |
| --- | --- |
| 新デモ | `YOHAKU_EXPERIENCE_ENABLED=true` |
| World | `WORLD_IDKIT_DEMO_ENABLED`, `WORLD_IDKIT_DEPLOYMENT`, `WORLD_IDKIT_ORIGIN`, `WORLD_IDKIT_SIGNING_KEY` |
| 署名と上限 | `AGENT_PRIVATE_KEY`, `DEMO_SIGNS_PER_HOUR` |
| x402 | `X402_FACILITATOR_URL`, `X402_NETWORK`, `X402_ASSET`, `X402_PAYOUT_ADDRESS`, `X402_ASSET_NAME`, `X402_ASSET_VERSION`, `X402_ATOMIC_PER_UNIT`, `X402_EXPLORER_URL` |
| Intercepta | `INTERCEPTA_API_KEY`, `INTERCEPTA_BASE_URL`, `INTERCEPTA_SCAN_PATH`, `INTERCEPTA_AUTH_HEADER` |
| Jev | `JEV_API_KEY`, `JEV_BASE_URL`, `JEV_MODEL`, `YOHAKU_PROVIDER=jev` |
| ENS読取 | `SEPOLIA_RPC_URL`, `ENS_NAME`, `ENS_RESOLVER_ADDRESS`, `ENS_DELEGATE_ADDRESS` |
| PR #27の所有者・保存先 | 必要に応じて `OWNER_WALLET_ADDRESS`、`REQUEST_STATE_FILE`、`ATTENTION_STATE_FILE` |

秘密値はサーバー専用。買い手の支払い鍵、World署名鍵、APIキーは別のものです。
元のホストを使い続けるため、秘密値の移送・新しい鍵・Render招待は今回不要です。

## Renderを使う場合の予備手順

後日移行する場合、mintaのアカウントでサービスを作り、KouがEnvironmentへ秘密設定を直接入力する案があります。
移行時点でプラン・費用・必要なアクセスを確認します。今は実行しません。

- DockerfileはNode 22、非root、`npm ci --include=dev`、`npm start`。tsx/esbuildが起動に必要です。
- 1インスタンスと永続ディスクを使用し、`/app/.yohaku` をnodeユーザーが書き込めるようにします。
- Worldのorigin、既存OIDCのcallback、公開リンクを新URLと照合します。
- 進行中の決済を完了してから切替。使用済みの通常依頼・日次表示枠のファイルは非公開で移します。
- 同じ支払い鍵を使うStudioとRenderを、両方とも実演の入口として同時運用しません。
- Docker CLIがこの作業環境にないため、イメージのビルドは未検証です。

複数台や長期運用には、認証・回答・支払い意図と結果のDB保存、原子的な一度だけの処理が必要です。
今回のデモは単一プロセス・ブラウザごとの一時セッションです。
