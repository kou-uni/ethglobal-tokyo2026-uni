# エージェントは、何をきっかけに、どの規約で人に聞くのか

**調べた日: 2026-09-26。** 「たぶんこうなる」ではなく、**すでに仕様として書かれているもの**だけを集めた。

**結論を先に3つ。**

1. **「人に聞け」という条件には、もう仕様上の名前がある** — AP2 の **`unresolved_constraint`**
2. **Yohaku が座っている場所にも名前がある** — AP2 の **Trusted Surface**。しかも仕様は
   **「必ず non-agentic でなければならない」**と書いている
3. **ただし、どの規約も相手を「事業者」だと思っている。** 相手が**個人**である規約は、まだ無い

---

## ❶ 何をきっかけに、何を持って人に聞くのか

### A. AP2 — 「制約が解けなかったとき」に人を戻す

**Agent Payments Protocol v0.2**（Google、2025-09-16 発表、PayPal / Mastercard / Amex /
Adyen / Coinbase / Salesforce など**60社以上**）。

フローは2つしかない。

| | 誰が承認するか |
|---|---|
| **Human Present**（direct） | **人が、閉じた Mandate を直接承認する** |
| **Human Not Present**（autonomous） | 人は**開いた** Mandate を先に承認し、エージェントが自律で閉じる |

そして**戻る条件が仕様に書いてある。**

> *"A Human Not Present flow can be turned into a Human Present flow by the Merchant
> (or Credential Provider) returning an **`unresolved_constraint`** error and bringing the
> User back into the loop to approve the closed Mandates."*

**これが ❶ の答え。** 人が呼ばれるのは「大事だから」ではなく、**先に承認した制約の中で
解ききれなかったから**。Yohaku の rule 5（機微）・6（閾値超え）・7（初対面）・9（不一致）は、
全部これの具体例になる。

**持ってくる中身**は Mandate Content — 何を、いくらで、どの相手と。Merchant 署名の
`checkout_jwt` とハッシュで縛られ、**後から差し替えられない**。

### B. MCP elicitation — 「途中で足りなくなったら聞く」。ただし個人情報は禁止

**Model Context Protocol** の elicitation は、サーバがツール実行を**一時停止して人に問う**
仕組み。JSON Schema で検証される。

そして、ここが重要。

> **"Servers must not require sensitive information: Elicitation is not a vehicle for
> requesting personally identifiable information (PII), credentials, or any other sensitive
> data. Servers MUST NOT request such information through elicitation."**

**「エージェントが人に聞く」唯一の既成の口が、我々のやることを名指しで禁止している。**
これは我々にとって不利な事実ではなく、**なぜ別の面が要るのかの証明**になる。
個人データの依頼は elicitation ではなく、**同意のための面**を通らなければならない。

### C. 人であることの証明 — もう学術的な下地がある

**Personhood credentials**（[arXiv:2408.07892](https://arxiv.org/abs/2408.07892)、2024-08、
**OpenAI・MIT・Microsoft・Harvard など32名**）。

> 「個人情報を明かさずに、自分が実在の人間であることを示せる資格情報」。
> 成立の根拠は **AI が最先端の暗号を破れないこと、そして現実世界で人として通れないこと**。

World ID はこの実装の一つ。**我々の「人間しか登録できない」は思いつきではなく、
この系譜の上にある。**

## ❷ どの規約で運ばれるのか — 層はもう埋まっている

| 層 | 規約 | 状態 |
|---|---|---|
| **好みの表明** | **IETF AIPREF WG** — AI 利用の好みを表す語彙と、**robots.txt / HTTP ヘッダ**での運び方 | 標準化作業中 |
| **発見・交渉・精算** | **UCP**（Google + Shopify/Etsy/Target/Walmart ほか20社以上）／**ACP**（OpenAI + Stripe + Meta、Apache 2.0） | 稼働中 |
| **同意** | **AP2 Mandate**。**non-agentic な Trusted Surface** で取る | v0.2 |
| **人であること** | Personhood credentials / World ID | 実装あり |
| **支払い** | **x402**。HTTP 402、ステーブルコイン。**Linux Foundation が 2026-04-02 に正式発足**。Base で**1.19億件**、Solana で3,500万件、年換算 約$6億、**プロトコル手数料ゼロ** | 稼働中 |

**「エージェントが払う」はもう議論ではない。** 動いている。

## なぜ Yohaku が要るのか — 仕様の言葉で言える

AP2 は5つの役割を定義し、**Trusted Surface だけに MUST を付けている。**

> *"**Trusted Surface (TS):** The Trusted Surface role is a UI surface that is trusted to get
> informed user consent for an Intent before creating a user-signed Mandate."*
>
> *"The following role **MUST be non-agentic**: Trusted Surface"*

理由も書いてある。

> *"when either role is agentic, then **the Agent itself is a potential attacker**."*

**Yohaku は AP2 の Trusted Surface です。** そして我々が最初から守ってきた性質は、
偶然この MUST と一致している。

| Yohaku の設計 | AP2 の要求 |
|---|---|
| `route()` は純粋関数。10段を順に評価し、LLM は rule 9 にしか居ない | **non-agentic**（判定は決定的なコードで行われる） |
| AI が返せる値に `pass` が存在しない。スキーマに無い | **エージェントは攻撃者になりうる**前提 |
| 承認の瞬間に人であることを証明させる（`auth_time` 120秒） | **informed consent** を取ってから Mandate に署名 |
| 全部の故障経路が deny に落ちる | 制約が解けなければ人に戻す |

## ⚠️ そして、誰も埋めていない穴

**UCP も ACP も AP2 も、相手が Merchant であることを前提にしている。**
商品カタログがあり、カートがあり、在庫と価格の責任者がいる。

**個人は、そのどれでもない。**

| 穴 | 具体的に無いもの |
|---|---|
| **売り手が個人である規約が無い** | Merchant 役を個人が担う想定が無い。カタログも在庫も無い |
| **「聞いてよい条件」を個人が宣言する語彙が無い** | AIPREF は**発行者側**（robots.txt）。「私に、この目的なら、この値段で聞いてよい」を表す語彙は無い |
| **個人データの依頼口が塞がれている** | MCP elicitation は PII を明示的に禁止 |
| **人の注意の量を保護する仕組みが無い** | AP2 は1件ごとの同意は定義するが、**1日に何件まで人を呼んでよいか**は誰も定義していない |

**最後の1行が Yohaku の主張です。** 1件の同意を正しく取る規約は揃った。
**1日に何件まで人を呼ぶかは、まだ誰のものでもない。**

## 市場の側の裏付け

- **Cloudflare が AI データ市場 Human Native を買収**（2026-01-15, CNBC）。
  インフラ事業者が「AI 開発者は作り手に払うべきだ」側に張った
- **Cloudflare pay per crawl に x402 の後払い方式を統合中**
- **Mastercard 予測: 2030年までに10人に1人が AI エージェントで日常的に買い物と支払いをする**
- 規制は追いついていない。スペイン AEPD（2026-02）は
  **「エージェントの自律性は新しい法的カテゴリを作らない。個人データ処理の技術的手段であり、
  導入した組織が全責任を負う」**と明言 → **同意の証跡を誰が持つかが争点になる**

## ⚠️ 確かめていないこと

- AP2 の Mandate を**個人が売り手として**発行した実例を、我々は見ていない
- UCP / ACP に個人出品者の拡張が計画されているかは未確認
- AIPREF の語彙が最終的に何を表現できるかは、まだドラフト段階

## 出典

- AP2 仕様 — `google-agentic-commerce/AP2` `docs/ap2/specification.md` / `flows.md` / `agent_authorization.md`、
  <https://ap2-protocol.org/>、[Google Cloud 発表](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol)
- MCP elicitation — <https://gofastmcp.com/servers/elicitation>、<https://workos.com/blog/mcp-elicitation>
- Personhood credentials — <https://arxiv.org/abs/2408.07892>、[MIT Technology Review](https://www.technologyreview.com/2024/09/02/1103466/how-personhood-credentials-could-help-prove-youre-a-human-online/)
- IETF AIPREF — <https://datatracker.ietf.org/wg/aipref/about/>、<https://www.ietf.org/blog/aipref-wg/>
- x402 — [Coinbase + Cloudflare](https://www.coinbase.com/blog/coinbase-and-cloudflare-will-launch-x402-foundation)、<https://developers.cloudflare.com/agents/tools/payments/x402/>
- UCP — <https://docs.stripe.com/agentic-commerce/protocol>、[Google 発表](https://blog.google/products/ads-commerce/agentic-commerce-ai-tools-protocol-retailers-platforms/)
- ACP — [Stripe + OpenAI](https://stripe.com/newsroom/news/stripe-openai-instant-checkout)
- Cloudflare / Human Native — <https://www.cnbc.com/2026/01/15/cloudflare-ai-human-native-acquisition.html>
- Mastercard 予測 — <https://www.mastercard.com/news/europe/en/newsroom/press-releases/en/2026/mastercard-report-predicts-that-one-in-10-people-will-routinely-use-ai-agents-to-shop-and-pay-by-2030/>
