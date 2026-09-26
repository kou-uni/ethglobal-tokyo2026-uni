# 受賞要件と実装・証拠の対応

2026-09-26。kouのmain `2927393`（PR #7のマージと最新構成図を含む）を取り込み、PR #7の実機結果も合わせて再評価した。
公式条件は [PRIZE-REQUIREMENTS](../knowledge/PRIZE-REQUIREMENTS-2026-09-26.md)。
以下の優先度はチーム向けの提案で、受賞確率の推計や応募確定ではない。

## 推奨

**ENSv2とCurvegrid AI Agentを主軸にする。WorldはIDKitとAgentsを別々に説明する。**
IDKitの公開反映が間に合えば、審査員が自分のWorld IDで体験する導線を使う。
間に合わなければ動いているAgents版を維持し、本番IDKitのローカル実証を添える。
公開サーバーを審査直前に未確認設定へ切り替えない。

| 対象 | 現在示せるもの | まだ必要な確認／提出作業 |
|---|---|---|
| ENS / Best Use of ENSv2 | Sepoliaの登録、限定キーの委任、提案成功、policy変更revert、委任取消後の提案revert。6取引の[証跡](evidence/ens-delegation.json)。サーバーのrule 0もlive読取を使う | live demoリンクを提出欄に入れ、第三者のブラウザーで動作確認。提案だけ委任することが製品に必要な理由を説明 |
| Curvegrid / Best AI Agent Project | 10ルール、AIの出力がask/dropのみ、承認まで保留する決済、2件のx402着金実証 | 審査で使うサーバーのclassifier設定を確認。未設定ならmockと明記し、既存の実呼出記録を補足する。READMEのチーム・起動手順も提出時確認 |
| Curvegrid / Best Digital Asset Dashboard | 朝の台帳と、何を人に残すかの画面 | 広い資産ポートフォリオ管理は未実装。主応募より補助的な説明として使う提案 |
| World / Best Use of IDKit | 本番資格をサーバーで検証し、特定のデモ依頼を承認するところまで[成功](evidence/world-idkit-approval.json)。取消時は未承認のまま | 公開反映、審査端末での確認、成功＋取消の実演、資格の必要十分性、debrief |
| World / Best Use of World ID for Agents | 公式sandboxへのOIDC統合、既存の承認・x402フロー。失敗はテスト済み | 公開環境で不成功経路も見せる。sandboxと本番IDKitの結果を同一の証拠として扱わない |

Curvegrid AI Agentを優先する理由は、公式のポリシーに従う取引エージェントの例と、
Yohakuの「いつ金を動かしてよいか」が直接対応するため。
MultiBaasは未使用でよいが、使用したとは書かない。
RWAトークン発行やInterceptaを、この段階で新しく足す提案はしない。

## kouの更新を受けた判断

- `1a6f18b` / `67ccee1` の `docs/stack.html` は、Yohaku自体を中心に説明する構成。
  ピッチも「World、ENS、x402の紹介」から始めず、余白を作る製品の価値から始める。
- kouの#4コメントは、動いているAgents版を本線として残す案。
  リスク管理として維持する。一方、「IDKitはサインイン用途なので文脈が離れる」は
  今回の公式IDKit賞の対象を狭く解釈している。操作直前の信頼確認も明記されている。
- コメント時点では承認接続が未実施だったが、その後12:57:56 JSTに
  本番IDKit → Yohaku承認が完了した。新しい証拠で再判断できる。
- ENS公開反映はkouがIssue #6で完了報告済み。今回の外部health取得では本文を
  得られなかったが、後続確認ではHTTP 200で取得できた。
  [public-health.json](evidence/public-health.json) ではdelegationReader=true、
  classifier=true、settlement=true。WorldはまだIDKitモードではない。
- PR #7は13:05:05 JSTにマージ済み。IDKit公開配置の完了報告はまだなく、未確認として扱う。

## Worldの信頼確認をどう説明するか

> An agent should not approve its own request. At the approval step, Yohaku asks a
> human to present a World ID proof. The backend verifies it and binds the result
> to the exact request started in that browser.

必要なのは応答者のpersonhood。氏名、国籍、旅券情報はこの承認に不要なので要求しない。
Orb/PoH資格を選び、追加の資格を集めない。ただし人間確認だけで、
データが人間執筆だと保証したり、正しい情報だと保証したりはしない。
一人一回の特典、所有者との恒久的な紐付け、端末共有への対策は今回のデモの範囲外。
審査員ごとに自分のブラウザーで `/try` から開始する。

## 提出までの順番

最新構成図 `2927393` と公開環境に対する具体的な残作業は
[DEMO-REMAINING.md](DEMO-REMAINING.md)。

1. kou：マージ済みPR #7の公開反映。鍵は非公開で設定。手順は [WORLD-IDKIT-DEMO](WORLD-IDKIT-DEMO.md)。
2. 両者：使う環境の `/health` を確認し、成功と取消を一周する。
3. 必要ならIDKitとBase Sepolia決済を一体で確認。その前に「本番World認証後に送金済み」と言わない。
4. [PITCH](../product/PITCH.md) の60秒版を録画。Worldの認証待ちは無理に60秒へ押し込まない。
5. [SUBMISSION](../product/SUBMISSION.md) と [FEEDBACK](FEEDBACK.md) を提出欄に合わせて使う。

## 言い過ぎないための境界

- 52件・32件・2件は再現可能なシミュレーションの数。32件の実送金ではない。
- x402の実証はUSDCのatomic units。4,200 USDCでも4,200円の実売上でもない。
- ENSの取消自体がv2独自なのではなく、限定キーへの権限委任が製品の中心。
- 来場者のpersonhoodと、ENS所有者の本人認証を混同しない。
- screeningはmock。AIの実呼出実績と、現在の公開サーバーでliveかどうかも分ける。
