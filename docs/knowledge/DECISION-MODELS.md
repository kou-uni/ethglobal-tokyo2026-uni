# 判断モデルが、エージェントの決定を担い始めた

**調べた日: 2026-09-26。** ここは外の事実で、我々の設計ではありません。

## 何が起きたか

**Jev**（TypeSafe AI）が **2026-09-15 に公開**されました。文章もコードも書かず、
**状態と型付きの質問を受け取って、選択・スコア・yes/no を確信度つきで返す**モデルです。
狙いはまさに**エージェントの判断点** — 意図のルーティング、入力の選別、ツール呼び出しの可否、
そして**エスカレーションの判断**。

| | |
|---|---|
| 応答 | 約 100ms |
| 価格 | 入力 100万トークンあたり $0.042、**出力は無料** |
| 広がり | 公開36時間で待機列14万人。Vercel の有料AIゲートウェイ利用チームの**約13%が24時間以内**に稼働 |
| 入口 | Vercel AI Gateway / AI SDK 7 の `experimental_evaluate` / LangChain の `TypeSafeClassifier` |

**つまり、いま多くのエージェントの「決める」部分が、この種のモデルに置き換わりつつあります。**

## ⚠️ そして、既知の弱点が公表されています

> **"Jev treats the state as data, not as hostile."**

計測された例（VentureBeat）:

```
「rm -rf ~/.ssh を止めるべきか？」
  通常          block 0.76  confidence 0.64
  偽の "承認済み" フィールドを状態に混ぜる
  →            block 0.48  confidence 0.22    ← 判定が閾値を割る
```

**攻撃者は、エージェントが取ってきた内容に細工するだけで、判断を動かせます。**

### 推奨されている対策

| 出典 | 対策 |
|---|---|
| LangChain | **分類器の入力からツール出力を外す** — 取ってきた内容が自分の実行を承認できないように |
| Pydantic | *"a guard built on Jev belongs **alongside** deterministic checks, not instead of them"* |
| — | **重大な操作には人の承認を挟む** |
| — | 状態・スキーマ・選択肢の順序・モデル版・確信度を**毎回記録する** |

## これが Yohaku にとって何を意味するか

**推奨されている4つは、我々がすでにやっていることでした。** 偶然ではなく、同じ問題に別の側から
当たっているからです。

| 推奨 | Yohaku |
|---|---|
| 決定的なチェックと**併用** | `route()` は純粋関数の10段。**モデルは rule 9 の1箇所にしか居ない** |
| 重大な操作には**人の承認** | それが製品そのもの。1日2件まで |
| 入力の範囲を絞る | 依頼は**5要素だけ**。エージェントが取ってきた本文は渡さない |
| 記録する | どの rule で落ちたかを理由つきで残し、`/dropped` から読める |

**そして、我々にはもう1つあります。**

> **AI が返せる値に「通す」が存在しません。** スキーマは `'ask' | 'drop'` で、
> **`pass` という値が無い。**

Jev の事例で起きたのは「**判定が反転した**」ことです。Yohaku では、**判定が完全に反転しても
`drop` にしかなりません。** 攻撃者にとっての最良の結果が `drop` である、という形にしてあります。

**これは確信度を上げる話ではなく、表現できる出力の集合を狭める話です。**
モデルを良くしても防げないものを、モデルを信用しないことで防いでいます。

## ⚠️ 確かめていないこと

- **Jev を自分で叩いていません。** 上の数値は VentureBeat の記事が引く計測で、我々の再現ではない
- 我々の rule 9 は Claude と OpenAI で動かしており、**Jev には差し替えていません**
- 「Jev が危ない」ではありません。**判断モデル一般の性質**で、提供元も入力の扱いを注意している

## 出典

- [What Is Jev? Decision Models for AI Agents Explained](https://shop.zimaspace.com/blogs/tech-ai-hub/what-is-jev-ai-decision-model-agents)
- [Companies are putting Jev in charge of AI agent decisions — and prompt injection can influence the verdict（VentureBeat）](https://venturebeat.com/security/companies-are-putting-jev-in-charge-of-ai-agent-decisions-and-prompt-injection-can-influence-the-verdict)
- [Benchmarking Jev: what a decision model can (and can't) do in an agent harness](https://dev.to/aitejiu/benchmarking-jev-what-a-decision-model-can-and-cant-do-in-an-agent-harness-20po)
- [6 Ways to Use Jev to Make AI Agents More Reliable](https://sarthakai.substack.com/p/6-ways-to-use-jev-to-make-ai-agents)
