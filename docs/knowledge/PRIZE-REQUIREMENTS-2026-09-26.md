# Tokyo 2026：今回確認した正式な賞要件

確認日：2026-09-26。ETHGlobalのスポンサー別ページの本文を取得して確認した。
以下は要約。適合性の判断は [PRIZE-READINESS.md](../build/PRIZE-READINESS.md) に分ける。

## ENS [S1]

新規開発向けは **Best Use of ENSv2**。総額$6,000、$3,000 / $2,000 / $1,000。
SepoliaのENSv2を使い、v2の機能を製品の中心に置くこと、固定値を見せるだけではない
動作するデモ、提出Showcase内のlive demoへのリンク、公開ソースが要件。

紹介例には階層レジストリ、EAC、特定text recordへの限定委任、
Permissioned Resolverなどがある。全機能を使うという要件ではない。
エージェントに名前空間・アイデンティティ・権限を与える応用も歓迎される。
残りの$4,000は既存プロジェクト向けContinuity限定の別枠。

## Curvegrid [S2]

新規開発向けに各$1,000の3カテゴリがある。

- Best RWA Tokenization Project：現実資産をプログラム可能にする用途。
- Best Digital Asset Dashboard：資産の状況、必要な操作、運用判断を理解できる画面。
- Best AI Agent Project：ブロックチェーン活動を理解し、オンチェーンで動くエージェント。
  例には支払い、ポリシーに従う取引、人間の承認を必要とする操作がある。

いずれもMultiBaas利用は必須ではない。アイデアと技術実装を評価する。
READMEには一文概要、チームとsocial handles、セットアップとテスト手順が必要。
MultiBaasを使った場合はその使い方と体験・フィードバックも説明する。

## World [S3]

**IDKitとWorld ID for Agentsは別カテゴリ。** 「Worldの賞」を一括りにしない。
新規開発向けはそれぞれ総額$5,000、最大2チームに各$2,500。
別にContinuity限定の2カテゴリがあるため、その賞金を新規枠へ足さない。

### Best Use of IDKit

操作・アクセス・体験が変わる直前に、人への信頼確認を必要とする製品が対象。
サインイン専用という要件ではない。実際に動くアプリ等にIDKitを統合し、
対応資格を1つ以上使い、バックエンドまたはオンチェーンで適切に検証する。

必要なのは、信頼確認する具体的な場面と、その場面に対してなぜ選んだ資格が
必要十分なのかの説明。資格の数を増やすこと自体を評価する賞ではない。
成功に加え、取消・資格なし・拒否等の意味のある別経路を実演する。

### Best Use of World ID for Agents

イベント提供の公式開発環境への統合が要件。
本人確認の要求、利用者の完了、結果の検証、保護される操作までを見せる。
不成功時にその操作が起きない経路も必要。バックエンドで検証し、
クライアントの未検証結果を権限として信用しない。Secretを露出させない。

公式ページは現在proofをmockしている旨を案内している。
本番IDKitの証明だけでこの開発環境への統合を代替したとはいえない。

### 両カテゴリに共通する提出フィードバック

初回成功までの時間、詰まった点、欠けている機能・文書、
最も効果の大きい改善を含む短いintegration debriefが必要。

## 一次資料と取得記録

- [S1: ENS](https://ethglobal.com/events/tokyo2026/prizes/ens)
- [S2: Curvegrid](https://ethglobal.com/events/tokyo2026/prizes/curvegrid)
- [S3: World](https://ethglobal.com/events/tokyo2026/prizes/world)

取得HTMLのSHA-256。後日のページ変更と区別するための値で、サイトの真正性証明ではない。

```text
ENS       4527cde770d46090f740193bcc53fc3a1418f0ed4138435e590f9aa59bd06d2f
Curvegrid 20d8a66d4b9127afb1104c8f48f32ff7b35c0f836a6c8645d38889bccb31ba86
World     9affd2895bcedf2866a63dcd528608e1d7878eb9205413c50675ba999ca4aa3e
```
