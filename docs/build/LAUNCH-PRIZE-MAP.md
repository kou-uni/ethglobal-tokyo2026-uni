# LPの価値訴求と賞要件の対応 — 2026-09-26

最新main `1778364`（KouのCurvegrid対話ページを含む）を参照したLP用の整理。
**今回のユーザー指定優先順位は Curvegrid → Intercepta → World。**
古い `PRIZE-READINESS.md` の優先順位・実装状況を、そのまま現在値として使わない。

## 一言と差別化

> 顧客はエージェント。人間には、余白を。

Yohakuはエージェントの依頼を、任せる・聞く・断るに分けるOSSの判断窓口。
エージェントには即時の結果／保留期限を返し、人には本人が設定した範囲の判断だけを届ける。
事業仮説は、エージェントが人の経験・意見を購入する市場。実顧客の需要・支払意思は未検証。

独自性の主張は「人への問い合わせ量の制御」と「AIに許可を出せない出力型」と
「権限／リスク／人の判断／決済の分離」の組み合わせ。世界初や競合不在の証明ではない。
Jevに判定を誤らせたとき、最悪でも必ずdropになる、とは言わない。askにもなりうるが、
autoにはならない。通知量の制御は別途必要。

## 1. Curvegrid — Best AI Agent Project

公式の「Some Ideas to Explore」のうち **Policy-Aware Transaction Agent** が最も直接対応。
トレジャリー操作の推薦、ステーブルコイン決済という例にも接点がある。
NEOは賞の独立カテゴリでも必須SDKでもなく、Yohakuの発展先を説明する補完製品として扱う。

| 公式の章／条件（要約） | Yohakuの価値と示せるもの | 残作業・境界 |
| --- | --- | --- |
| AI Agentの用途例：方針・上限・相手・人の承認に従う取引 | core rules、初回相手保留、署名認可の保持、承認後のx402送金 | デモ用サーバーの設定を当日確認 |
| Qualification Requirements：アイデアと技術実装を評価 | 公開production World→承認→Base Sepolia送金、ENS権限境界、記録済みの審査分岐 | シミュレーションとライブ証拠を分ける |
| 公開成果物と充実したREADME | コード、テスト、証拠JSONがある | 一文概要、チーム/social、起動・テスト手順の提出時照合 |
| MultiBaasの使用・体験は使用した場合に記載 | 現在は未使用。使用必須ではない | 使用したとは書かない |

**発表の一言：資産運用を自動化するとき、人を何回呼んでよいかまで制御する。**
Best Digital Asset Dashboardは朝の台帳・対応すべき項目の可視化として補助候補。
RWA発行は今回の中核ではない。

NEOはJeffの紹介動画（3:22–4:09）で企業向けデジタル資産トレジャリー管理として紹介された。
12:59–13:32の方針・人の承認・secure signerの説明は設計思想として参照し、出荷済み機能一覧とはしない。
NEOへのAPI接続、正式な連携仕様、採用・提携の合意はない。LPのJSON出力は未署名・実行不能の構想サンプル。

## 2. Intercepta — Safe Agent-to-Agent Payments with x402

公式の用途説明 **The paid agent or service** に最も近い。買い手の署名を止めた実証ではなく、
サービスが受け入れ・決済へ進むかを判定する側。

| Qualification Requirements（掲載順に要約） | 既存の証拠 | 残作業・境界 |
| --- | --- | --- |
| 動作するエージェント決済。x402推奨、testnet可 | `evidence/screening-with-settlement.json` | 公開ホストの現在の状態は別途確認 |
| 署名または受入前に実APIを呼び、結果が分岐を決める | Kou環境のlive clean→決済、flagged→rule 4拒否 | 再生画面だけではこの条件を満たさない |
| データはmainnet対象。testnet決済でも実mainnetアドレスを検査 | mainnetの既知fixtureを検査した記録 | 検査対象と実payerの対応が未強制 |
| 通過する決済と停止／保留、理由をデモする | 通過のreceiptと、providerの理由付き拒否 | 同じ実行環境で再現可能にする |
| 公開GitHub。READMEに実装場所と3〜5行のAPI体験 | `src/adapters/intercepta.ts`、呼出は`src/server/app.ts` | 本当の初回成功時間・困りごとでfeedbackを整える |

**最重要の不足：現在の`payoutAddress`は申告値。実際のEIP-3009 payerから導いた値ではない。**
cleanなmainnetアドレスを名乗るだけでよい状態は、実資金を守る強い説明にならない。
署名されたauthorizationの`from`とscreening対象を一致させる方式、または署名で検証可能な
対応関係を定義する必要がある。これはLPの見せ方で解決済みにしてはいけない。
今回のLPでは明記し、バックエンドの支払い経路は変更していない。

## 3. World — Best Use of IDKit

公式の「real trust moment」：保護された操作が成立する直前の、人への必要十分な信頼確認に対応。
World ID for Agentsは別枠で、公式のイベントdev環境への統合が必要。本番IDKitの証拠で代替しない。

| Qualification Requirements（掲載順に要約） | Yohakuの対応 | 残作業・境界 |
| --- | --- | --- |
| 動作するアプリ等へIDKitを統合 | `/world-approval`とサーバー検証 | 展示環境の稼働確認 |
| 対応資格を使いサーバー／チェーン検証 | production / protocol 3.0 / Orb | 本人性は回答の真偽・著者・ENS所有者を証明しない |
| 信頼が必要なイベントと最小限の資格を説明 | その依頼への承認。氏名・旅券属性は不要 | 「誰でも登録」と「誰でも他人の依頼を承認」を混同しない |
| 成功＋意味のある別経路 | 公開承認＋送金、別のlocal取消証拠 | 審査用公開環境で取消／未承認のままを再実演 |
| integration debrief | 既存Worldドキュメントの実体験がある | 初回成功時間、friction、欠けた機能、最大の改善案にまとめる |

## 技術の選定理由

- **Intercepta**：権限の有無では分からない資金リスクを、実APIの理由付き判定として追加する。
- **World ID**：その依頼の承認に人が関与した証拠を、バックエンドで検証する。
- **Jev**：曖昧な依頼の「聞く価値」を型付きで選別する。安全性の境界はモデル能力ではなく出力型と固定ルール。
- **ENSv2**：委任先に提案だけ許可し、方針の書換えをチェーン側で拒否する。
- **x402**：依頼と支払いの認可を結び、承認待ちと送金を分ける。
- **NEO**：企業の資産管理と判断記録を結ぶ将来の接続先。現在の依存ライブラリではない。

## 新しいLPで追加したもの

`docs/launch.html`：日英LP、coreの結果から作った4シナリオのジャーニー、注意上限の操作、
技術ごとの通信表示、要件カード、独立した証拠リンク、NEO向けの未署名サンプルJSON出力。
このLP自体は認証・API呼出・署名・決済をしない。既存の公開実機デモへのリンクを別に置く。

## 一次資料

2026-09-26に本文を再取得。表内の番号づけは掲載順の整理で、公式に番号があると主張しない。

- https://ethglobal.com/events/tokyo2026/prizes/curvegrid
- https://ethglobal.com/events/tokyo2026/prizes/intercepta
- https://ethglobal.com/events/tokyo2026/prizes/world
- https://www.youtube.com/watch?v=fFiGBkEpBlU （ユーザー提供の文字起こしを参照）
