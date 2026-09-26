# Yohaku — 思想から、市場、ジャーニー、そして埋めるべき穴まで

> **絵と文の両方で書いてあります。** 図だけ追っても、文だけ読んでも通るように。
> 数字と引用には全部出典があります（[../knowledge/](../knowledge/)）。

**この文書の筋**

```mermaid
flowchart LR
  A["① 思想<br/>余白とは何か"] --> B["② 反転<br/>何が希少になったか"]
  B --> C["③ 市場<br/>どれだけ動いているか"]
  C --> D["④ ジャーニー<br/>二人の顧客"]
  D --> E["⑤ 権威づけ<br/>誰の仕様がそう言っているか"]
  E --> F["⑥ 穴<br/>どこが抜けているか"]
  F --> G["⑦ 価値<br/>埋めると何が起きるか"]
  G --> H["⑧ 層<br/>誰が何を持っているか"]
  classDef k fill:#EDE9FF,stroke:#6B5BD6,stroke-width:2px,color:#241f3d
  classDef v fill:#F2FBD9,stroke:#7FA326,stroke-width:2px,color:#2F3D09
  class A,B,C,D k
  class E,F,G,H v
```

---

# ① 思想 — 余白は、余りではない

日本画に **余白** という言葉があります。**描き残しではなく、描かないと決めた場所です。**
画面のどこを空けるかで、何が見えるかが決まる。

```mermaid
flowchart LR
  subgraph N["描く"]
    n1["見せる"]
  end
  subgraph Y["余白 — 描かないと決めた場所"]
    y1["見せない"]
  end
  N -.->|"どちらも作者の決定"| Y
  classDef ink fill:#242329,stroke:#242329,color:#fff
  classDef pap fill:#F8F7F3,stroke:#BCB2FA,stroke-width:3px,stroke-dasharray:6 4,color:#242329
  class n1 ink
  class y1 pap
```

**エージェントは眠りません。** 放っておけば、人の1日は全部埋まります。
だから決めるべきは「何を見せるか」ではなく、**何を見せないか**です。

> **Yohaku は判断を作るのではなく、余白を作る。**
> 自動で通した依頼は余白を**生み**、拒否した依頼は余白を**守り**、
> 人に上げた依頼だけが余白を**使う**。

```mermaid
flowchart TB
  IN["一晩の依頼<br/>約50件"]
  IN --> A["auto ≈33<br/>自動で通る"]
  IN --> D["deny ≈10<br/>本人に届かない<br/><small>あとで確認できる</small>"]
  IN --> H["human = 2<br/>本人が見る"]
  A --> SA["余白を<b>生む</b><br/>聞かれずに済んだ"]
  D --> SD["余白を<b>守る</b><br/>届く前に消えた<br/><b>——そして後から確認できる</b>"]
  H --> SH["余白を<b>使う</b><br/>上限は本人が決めた数"]
  classDef g fill:#F2FBD9,stroke:#7FA326,color:#2F3D09
  classDef r fill:#EFEDE6,stroke:#A6A3B4,color:#5F5D6B
  classDef p fill:#EDE9FF,stroke:#6B5BD6,stroke-width:3px,color:#241f3d
  class A,SA g
  class D,SD r
  class H,SH p
```

**興味深い数字は 50 ではなく 2 です。** いくつ来るかは我々が決められない。
**いくつ届くかは決められる。**

---

# ② 反転 — 高くなったのは計算ではなく、人

```mermaid
flowchart LR
  subgraph B["これまで"]
    b1["情報は希少<br/>計算は安い"]
  end
  subgraph N["いま"]
    n1["<b>情報は無限</b><br/>合成テキストは無料"]
    n2["<b>人由来だと<br/>証明できるもの</b>が希少"]
  end
  B ==>|"反転"| N
  n1 --> n2
  classDef o fill:#EFEDE6,stroke:#A6A3B4,color:#5F5D6B
  classDef n fill:#EDE9FF,stroke:#6B5BD6,stroke-width:2px,color:#241f3d
  class b1 o
  class n1,n2 n
```

**エージェントは記録を抜きに来るのではありません。調査しに来ます。**
*「棚に戻した理由は？」「最初の5分で何が起きた？」「どこで見放した？」*
**モデルはどんな答えでも作れます。本当の答えだけが作れません。**

**論理は3行です。**

1. 学習コストに上限が無い。**高くなるのは計算ではなく、まだ誰も持っていないデータ**
2. **エージェントは web を漁っても「人が書いたもの」を判別できない。** 合成テキストは無料で、
   区別がつかない
3. だから **スクレイピングは無料で、かつ汚染されている**

> **エージェントは「生成物ではないと証明できるもの」になら払う。**

そこから製品の性質が1つだけ決まります。

```mermaid
flowchart TB
  P1["登録の時点で<br/>人であることを証明"] --> Q{"それで<br/>足りるか？"}
  Q -->|"No"| P2["<b>名前を剥奪できること</b><br/>汚した人を外せる"]
  Q -.->|"証明するのは<br/>「一度人が開いた」だけ"| X["中身が人由来である<br/>保証にはならない"]
  P2 --> R["人であることは<br/><b>一度の認定ではなく、維持されるもの</b>"]
  classDef n fill:#EDE9FF,stroke:#6B5BD6,stroke-width:2px,color:#241f3d
  classDef w fill:#FFF6DC,stroke:#B37C00,color:#6E520A
  class P1,P2,R n
  class X w
```

**この系譜は我々の思いつきではありません。** OpenAI・MIT・Microsoft・Harvard ら
**32名の論文** [*Personhood credentials*](https://arxiv.org/abs/2408.07892)（2024-08）が、
**個人情報を明かさずに実在の人間であることを示す資格情報**を提案しています。
成立の根拠は「**AI は最先端の暗号を破れず、現実世界で人として通れない**」こと。

---

# ③ 市場 — もう議論ではなく、動いている

```mermaid
flowchart LR
  subgraph S["供給側（人・作り手）"]
    s1["Cloudflare が<br/><b>AIデータ市場 Human Native を買収</b><br/>2026-01"]
    s2["pay per crawl<br/>クロールを有料化"]
  end
  subgraph D["需要側（エージェント）"]
    d1["<b>x402</b>: Base で 1.19億件<br/>年換算 約$6億 / 手数料ゼロ"]
    d2["Mastercard 予測<br/><b>2030年までに10人に1人</b>が<br/>エージェントで買い物と支払い"]
  end
  S <==>|"払う経路はもう通っている"| D
  classDef s fill:#F2FBD9,stroke:#7FA326,color:#2F3D09
  classDef d fill:#EDE9FF,stroke:#6B5BD6,color:#241f3d
  class s1,s2 s
  class d1,d2 d
```

| 事実 | 出典 |
|---|---|
| **x402 が Linux Foundation で正式発足**（2026-04-02）。HTTP 402 + ステーブルコイン。**Base で1.19億件、Solana で3,500万件、年換算 約$6億、プロトコル手数料ゼロ** | [Coinbase + Cloudflare](https://www.coinbase.com/blog/coinbase-and-cloudflare-will-launch-x402-foundation) |
| **Cloudflare が AI データ市場 Human Native を買収**（2026-01-15）。インフラ事業者が「AI開発者は作り手に払うべきだ」側に張った | [CNBC](https://www.cnbc.com/2026/01/15/cloudflare-ai-human-native-acquisition.html) |
| **2030年までに10人に1人**がエージェントで日常的に買い物・支払い | [Mastercard](https://www.mastercard.com/news/europe/en/newsroom/press-releases/en/2026/mastercard-report-predicts-that-one-in-10-people-will-routinely-use-ai-agents-to-shop-and-pay-by-2030/) |
| 規制は追いつかず。**スペイン AEPD（2026-02）: 「エージェントの自律性は新しい法的カテゴリを作らない。導入した組織が全責任を負う」** | [解説](https://www.mtm.video/blog/ai-agents-data-privacy-gdpr-ai-act-compliance-guide-2026/) |

**最後の1行が効きます。** 責任が組織に残るなら、**同意の証跡を誰が持つか**が争点になる。

⚠️ **1人あたり約50件/日は、我々の生成した夜であって実需要の測定ではありません**
（[ASSUMPTIONS.md](ASSUMPTIONS.md) A3/A4）。**製品の主張は入力ではなく出力（2件）です。**

---

# ④ ジャーニー — 顧客は二人。どちらも「使いに来ない」

```mermaid
flowchart TB
  subgraph AG["🤖 顧客A — AIエージェント（払う側）"]
    a1["仕事の途中で<br/>『人由来のデータが要る』に当たった"]
    a2["<b>成功 = 詰まらないこと</b><br/>即答・理由・期限"]
    a3["1件の重み = <b>1/500</b>"]
  end
  subgraph HU["🧑 顧客B — 人間（売る側・人間証明済み）"]
    h1["寝ていた。<br/>朝、通知が1つある"]
    h2["<b>成功 = 判断が増えないこと</b><br/>収入より先に、疲れないこと"]
    h3["1件の重み = <b>2件のうちの1件</b>"]
  end
  AG <-->|"同じ1件が、<br/>まったく違う重さを持つ"| HU
  classDef a fill:#EDE9FF,stroke:#6B5BD6,stroke-width:2px,color:#241f3d
  classDef h fill:#F2FBD9,stroke:#7FA326,stroke-width:2px,color:#2F3D09
  class a1,a2,a3 a
  class h1,h2,h3 h
```

**この非対称が製品の全部です。** 片方はスループット、もう片方は回数の少なさ。

## プロセス図 — 一晩を横断する

```mermaid
flowchart TB
  subgraph T0["事前（1度だけ）"]
    P["🧑 方針を置く<br/>分野・価格・期限・<b>1日2件</b>"]
  end
  subgraph T1["02:00 — 人は寝ている"]
    R1["🤖 依頼が届き続ける"] --> RT["⬜ route() 10段<br/>最初に当たったものが決める"]
    RT --> AU["auto — 自動で通す"]
    RT --> DE["deny — 届かせない"]
    RT --> HE["human — 保留"]
    HE --> BD["束ねる → 順位づけ → <b>上限2</b>"]
  end
  subgraph T2["07:00 — 起きる"]
    N["🧑 通知1通<br/>『今日のオファー23件。要るのは1件』"]
    N --> YN{"15秒の判断"}
    YN -->|"Yes"| PV["🌍 <b>いま</b>人であることを証明<br/>auth_time ≤ 120秒"]
    YN -->|"No / 無視"| DN["期限で deny<br/><b>沈黙は同意ではない</b>"]
    PV --> ST["💸 精算"]
  end
  P --> R1
  AU --> LG["📒 朝の台帳"]
  DE --> LG
  ST --> LG
  DN --> LG
  classDef p fill:#EDE9FF,stroke:#6B5BD6,color:#241f3d
  classDef g fill:#F2FBD9,stroke:#7FA326,color:#2F3D09
  classDef r fill:#FFF0F0,stroke:#FF6B6B,color:#7a1f1f
  class RT,BD,N,YN p
  class AU,PV,ST,LG g
  class DE,DN r
```

## 遷移図 — 1件の依頼が辿る状態

```mermaid
stateDiagram-v2
  [*] --> 受信
  受信 --> 判定中
  判定中 --> 自動承諾: rule 8 一致
  判定中 --> 拒否: rule 0-4 いずれか
  判定中 --> 保留: rule 5,6,7,9
  保留 --> 束ねられた
  束ねられた --> 提示済: 上限内に入った
  束ねられた --> 拒否: 期限到来（上限外のまま）
  提示済 --> 承認済: 人が Yes + <b>人間証明</b>
  提示済 --> 拒否: 人が No
  提示済 --> 拒否: 沈黙のまま期限到来
  承認済 --> 精算済
  自動承諾 --> 精算済
  精算済 --> [*]
  拒否 --> [*]
  note right of 拒否
    エンジン停止・スクリーニング不通・
    身元確認失敗も、すべてここに落ちる
  end note
```

## 情報フロー — 各段で、何が渡るのか

```mermaid
flowchart LR
  H["🧑 人間"] -->|"<b>方針</b><br/>{分野, 最低価格,<br/>期限, dailyCap=2}<br/>→ hash のみ on-chain"| Y["⬜ Yohaku"]
  A["🤖 エージェント"] -->|"<b>依頼 5要素</b><br/>{who, what, purpose,<br/>price, deadline}"| Y
  Y -->|"<b>判定</b>（同期）<br/>{verdict, rule,<br/>reason, deadline}"| A
  Y -->|"<b>提示</b><br/>{誰が, 何を, いくら,<br/>残り時間, 理由1行}"| H
  H -->|"<b>同意</b><br/>Yes / No / 沈黙"| Y
  Y -->|"<b>人間証明の要求</b><br/>prompt=login"| W["🌍 World ID"]
  W -->|"{acr, auth_time}<br/><b>sub は保存しない</b>"| Y
  Y -->|"<b>承認の証跡</b>"| X["💸 精算"]
  X -->|"データ"| A
  Y -->|"<b>台帳</b><br/>{件数, 自動/拒否/待ち,<br/>金額}"| H
  classDef y fill:#EDE9FF,stroke:#6B5BD6,stroke-width:3px,color:#241f3d
  classDef o fill:#FFFFFF,stroke:#A6A3B4,color:#242329
  class Y y
  class H,A,W,X o
```

| 渡るもの | 中身 | 意図 |
|---|---|---|
| **方針** | 分野・最低価格・期限・**1日の上限** | 本文はオフチェーン、**hash だけ**チェーンへ |
| **依頼** | **who / what / purpose / price / deadline** の5つだけ | `deadline` が肝。**人が寝ている間に何が起きるか**を先に決める |
| **判定** | verdict / rule番号 / 理由 / 期限 | **同期で返す。**エージェントに接続を握らせない |
| **提示** | 誰が・何を・いくら・残り時間・理由1行 | 15秒で決まる量だけ |
| **人間証明** | `acr` と `auth_time`。**`sub` は保存しない** | 必要なのは「いま人が居た」ことだけ |
| **台帳** | 件数・内訳・金額（**未入金なら「worth」と表示**） | できないことを画面に書く |

---

# ⑤ 権威づけ — ジャーニーの各段は、誰かの仕様に載っている

```mermaid
flowchart TB
  subgraph J["ジャーニーの段"]
    j1["好みを置く"] --> j2["依頼が来る"] --> j3["人を呼ぶ判断"] --> j4["同意を取る"] --> j5["人であることの証明"] --> j6["支払う"]
  end
  j1 -.-> s1["<b>IETF AIPREF WG</b><br/>AI利用の好みの語彙＋<br/>robots.txt / HTTPヘッダでの運び方"]
  j2 -.-> s2["<b>UCP</b>（Google+Shopify/Target/Walmart ほか20社超）<br/><b>ACP</b>（OpenAI+Stripe+Meta, Apache 2.0）"]
  j3 -.-> s3["<b>AP2</b>: unresolved_constraint<br/>制約が解けなければ人を戻す"]
  j4 -.-> s4["<b>AP2 Mandate</b><br/>non-agentic な Trusted Surface で取る"]
  j5 -.-> s5["<b>Personhood credentials</b><br/>arXiv:2408.07892（OpenAI/MIT/MS/Harvard 32名）"]
  j6 -.-> s6["<b>x402</b><br/>Linux Foundation, 2026-04"]
  classDef j fill:#EDE9FF,stroke:#6B5BD6,stroke-width:2px,color:#241f3d
  classDef s fill:#F2FBD9,stroke:#7FA326,color:#2F3D09
  class j1,j2,j3,j4,j5,j6 j
  class s1,s2,s3,s4,s5,s6 s
```

**特に効く引用が2つあります。**

### 「人を呼び戻す条件」には、もう名前がある

**AP2**（Google、2025-09-16、PayPal / Mastercard / Amex / Adyen / Coinbase など**60社以上**）:

> *"A Human Not Present flow can be turned into a Human Present flow by the Merchant
> (or Credential Provider) returning an **`unresolved_constraint`** error and bringing the
> User back into the loop to approve the closed Mandates."*

**人が呼ばれるのは「大事だから」ではなく、先に承認した制約の中で解けなかったから。**
我々の rule 5（機微）・6（閾値）・7（初対面）・9（不一致）は、全部これの具体例です。

### 「我々が座っている場所」にも名前がある

AP2 は5つの役割のうち、**1つにだけ MUST を付けています。**

> *"**Trusted Surface (TS):** a UI surface that is trusted to get informed user consent for an
> Intent before creating a user-signed Mandate."*
> *"The following role **MUST be non-agentic**: Trusted Surface"*
> 理由 — *"when either role is agentic, then **the Agent itself is a potential attacker**."*

| 我々が先に決めていたこと | 一致する要求 |
|---|---|
| `route()` は純粋関数。10段を順に評価し、**LLM は rule 9 にしか居ない** | **non-agentic** |
| AI が返せる値に **`pass` が存在しない**（スキーマに無い） | **エージェントは攻撃者になりうる** |
| 承認の瞬間に人であることを証明させる（`auth_time` 120秒） | **informed consent** を取ってから署名 |

**設計を変える必要はありませんでした。名前が付いただけです。**

---

# ⑤.5 窓口は増える。人が持つルータは1つ

**エージェントが顧客になれば、窓口は1つでは終わりません。** パネル会社も、求人板も、
調査の市場も、**エージェント用の入口を生やします。** そしてどれも A2A を喋ります
（自分を知らないエージェントが辿り着ける方法が、それしか無いため）。

```mermaid
flowchart LR
  A["📄 リサーチ市場"] --> Y
  B["🗣 Koe"] --> Y
  C["📋 パネル会社"] --> Y
  D["💼 求人板"] --> Y
  Y["⬜ <b>Yohaku</b><br/>この人のルータは1つ"] --> P["🧑 1日2件"]
  classDef s fill:#E3EFFB,stroke:#0B6BCB,color:#0A3A66
  classDef y fill:#EDE9FF,stroke:#6B5BD6,stroke-width:3px,color:#241f3d
  classDef p fill:#F2FBD9,stroke:#7FA326,color:#2F3D09
  class A,B,C,D s
  class Y y
  class P p
```

**人は、プラットフォームごとにアカウントと方針と通知を持てません。**
Agent Card は**サイトではなく本人に属する**ので、どこから見つけられても、依頼は同じ場所に届きます。

| | |
|---|---|
| **要らないもの** | 本人に届く前に処理される |
| **良いもの** | **見ていなかったプラットフォームに来たせいで逃す、ということが起きない** |
| **人が決めるべきもの**だけ | 濾されて、**すでに社会に実装されている財布**に届く |

> **窓口が何枚になっても、人が持つのは受信箱の束ではなく、ルータ1つです。**
> これが「機能」ではなく「層」である理由です。

# ⑥ 穴 — 全部の規約が、相手を「事業者」だと思っている

```mermaid
flowchart TB
  subgraph L["層は、もう埋まっている"]
    l1["好みの表明 — AIPREF ✅"]
    l2["発見・交渉 — UCP / ACP ✅"]
    l3["同意 — AP2 Mandate ✅"]
    l4["人間証明 — personhood credentials ✅"]
    l5["支払い — x402 ✅"]
  end
  subgraph G["ただし、前提がある"]
    g1["<b>相手は Merchant</b><br/>カタログ・カート・在庫の責任者がいる"]
  end
  L --> g1
  g1 ==> H1["<b>個人は、そのどれでもない</b>"]
  H1 --> H2["❌ 売り手が個人である規約が無い"]
  H1 --> H3["❌ 個人が『この目的なら<br/>この値段で聞いてよい』と言う語彙が無い<br/><small>AIPREF は発行者側（robots.txt）</small>"]
  H1 --> H4["❌ 依頼の口が塞がれている<br/><small>MCP elicitation は PII を明示的に禁止</small>"]
  H1 --> H5["❌ <b>1日に何件まで人を呼んでよいか</b><br/>誰も定義していない"]
  classDef ok fill:#F2FBD9,stroke:#7FA326,color:#2F3D09
  classDef gap fill:#FFF0F0,stroke:#FF6B6B,stroke-width:2px,stroke-dasharray:5 4,color:#7a1f1f
  classDef mid fill:#FFF6DC,stroke:#B37C00,color:#6E520A
  class l1,l2,l3,l4,l5 ok
  class g1,H1 mid
  class H2,H3,H4,H5 gap
```

**「エージェントが人に聞く」唯一の既成の口が、我々のやることを名指しで禁止しています。**

**MCP elicitation**（サーバがツール実行を止めて人に問う仕組み）:

> *"Elicitation is **not** a vehicle for requesting personally identifiable information (PII),
> credentials, or any other sensitive data. Servers **MUST NOT** request such information
> through elicitation."*

**これは我々に不利な事実ではなく、別の同意の面が要ることの証明です。**

> **1件の同意を正しく取る規約は揃った。**
> **1日に何件まで人を呼んでよいかは、まだ誰のものでもない。**

---

# ⑦ 価値 — 埋めると何が起きるか

```mermaid
flowchart LR
  subgraph B["Yohaku が無い場合"]
    b1["🧑 朝に50件<br/>→ <b>二度と開かない</b>"]
    b2["🤖 接続を握って<br/>人の睡眠を待つ<br/>→ <b>詰まる</b>"]
    b3["誰も店を開けない<br/>→ <b>市場が立たない</b>"]
  end
  subgraph A["ある場合"]
    a1["🧑 <b>2件。</b>上限は本人が決めた数<br/>→ 続けられる"]
    a2["🤖 <b>即答。</b>理由と期限つき<br/>→ 詰まらない"]
    a3["<b>店が開く</b><br/>→ 供給が生まれる"]
  end
  B ==>|"埋める"| A
  classDef b fill:#FFF0F0,stroke:#FF6B6B,color:#7a1f1f
  classDef a fill:#F2FBD9,stroke:#7FA326,stroke-width:2px,color:#2F3D09
  class b1,b2,b3 b
  class a1,a2,a3 a
```

| 誰に | 何が起きるか | 測ったか |
|---|---|---|
| **人間** | 朝の件数が**上限で固定**される。20回の実行で**毎回2件** | ✅ `npm run verify` が再導出 |
| **人間** | 先に増えるのは収入ではなく**「聞かれずに済んだ数」**（0.1 → 6.3件/日）。朝が静かになるのは**4週目** | ✅ 30夜を再生して測定。**「1週間で12→5→2」は偽だったので撤回済み** |
| **エージェント** | 同期応答・理由つき拒否・期限。**握らされない** | ✅ HTTP とプロセス内の一致を test で固定 |
| **両方** | **委任先のAIが、自分の権限を書き換えられない** | ⚠️ 名前と resolver は**チェーンに乗った**。委任先が拒否される証拠だけ、これから |

> **Yohaku は「断る道具」ではありません。開けるようにする道具です。**
> エージェント経済で店を開けば一晩で約50件来る。**捌ける人だけが、その商売を取れる。**

---

# ⑧ 層 — 誰が何を持っているか

```mermaid
flowchart TB
  U["🧑 人間（人間証明済み）"]
  W["🌍 <b>人であることの証明</b><br/>World ID<br/><small>登録時ではなく、同意の瞬間に</small>"]
  E["⛓️ <b>権限の境界</b><br/>ENSv2 Permissioned Resolver<br/><small>委任先は提案できるが、<br/>自分の権限を書き換えられない</small>"]
  S["🛡️ <b>支払い元の審査</b><br/>スクリーニング<br/><small>汚れた金は通さない</small>"]
  Y["⬜ <b>Yohaku</b><br/>AP2 の Trusted Surface<br/><b>誰の注意を、1日何回使うか</b>"]
  F["💸 <b>精算</b><br/>x402 / HTTP 402"]
  A["🤖 エージェント"]

  A --> Y
  U --> Y
  W -.->|"いま人が居る"| Y
  E -.->|"何をしてよいか"| Y
  S -.->|"払ってよい相手か"| Y
  Y --> F
  classDef y fill:#EDE9FF,stroke:#6B5BD6,stroke-width:4px,color:#241f3d
  classDef l fill:#FFFFFF,stroke:#7FA326,stroke-width:2px,color:#2F3D09
  classDef o fill:#F8F7F3,stroke:#A6A3B4,color:#242329
  class Y y
  class W,E,S,F l
  class U,A o
```

**身元も、権限も、審査も、精算も、すでに誰かが持っています。**
**持ち主がいないのは真ん中の1つだけです** — *エージェントの依頼と、人の注意の間*。

| 層 | 問い | 状態 |
|---|---|---|
| 人であることの証明 | **いま**人が居るか | ✅ 実機で往復済み |
| 権限の境界 | 委任先は何をしてよいか | ⚠️ 未確認4点は解決。チェーンはこれから |
| 支払い元の審査 | 払ってよい相手か | ✅ 形は動く |
| **注意の配分** | **今日、何回この人を呼んでよいか** | **⬜ ここが Yohaku** |
| 精算 | どう払うか | ✅ **実際に動いた。**[auto](https://sepolia.basescan.org/tx/0x79c1e3239ef89cdc1b8a5fc14321093b06504a3c68a24644ba6390caf90393fa) と [承認後](https://sepolia.basescan.org/tx/0x5c79fddfc8d6e6f64c1dd23752fae688a9b94ec5bc770f24fd1c2595b00d1d88) |

---

# ⑨ 役割分割 — 金と、責任を、どこで切るか

**エージェントが顧客になるのが当たり前になった時代に、人とエージェントの間で切り分けが要る
ものは2つあります。金と、責任です。**

```mermaid
flowchart TB
  subgraph AG["🤖 エージェント側が持つ"]
    a1["<b>実行</b>— 探す・交渉する・買う"]
    a2["<b>速度</b>— 24時間、止まらない"]
  end
  subgraph YH["⬜ Yohaku が持つ（ここだけ）"]
    y1["<b>誰に聞くかの判断</b><br/>10段のルール。最初に当たったものが決める"]
    y2["<b>何回聞いてよいかの上限</b><br/>1日2件。本人が決めた数"]
    y3["<b>同意の証跡</b><br/>いつ・誰が・何に・人であることを証明して"]
  end
  subgraph HU["🧑 人間が持つ"]
    h1["<b>方針</b>— 分野・価格・期限・上限"]
    h2["<b>最終判断</b>— Yes / No / 沈黙"]
  end
  subgraph EX["外の層が持つ"]
    e1["💸 精算 — x402 ほか"]
    e2["⛓️ 権限の境界 — ENSv2"]
    e3["🌍 人であることの証明 — World ID"]
  end
  AG -->|依頼| YH
  HU -->|方針と答え| YH
  YH -->|承認の証跡| EX
  classDef y fill:#EDE9FF,stroke:#6B5BD6,stroke-width:3px,color:#241f3d
  classDef o fill:#FFFFFF,stroke:#A6A3B4,color:#242329
  classDef g fill:#F2FBD9,stroke:#7FA326,color:#2F3D09
  class y1,y2,y3 y
  class a1,a2,h1,h2 o
  class e1,e2,e3 g
```

**金の分割は分かりやすい。** 誰がいくら払い、誰が受け取るか。x402 や AP2 が担います。

**責任の分割のほうが重い。** スペイン AEPD は 2026-02 にこう言いました。

> **「エージェントの自律性は新しい法的カテゴリを作らない。それは個人データ処理の技術的手段であり、
> 導入した組織が全責任を負う。」**

**つまり「AIが勝手にやった」は成立しません。** 責任は人間の側に残る。
であれば決定的なのは、**同意がいつ・誰から・何に対して取られたかの証跡を誰が持つか**です。

| 分割するもの | 誰が持つか | 根拠 |
|---|---|---|
| **お金** | 精算層（x402 / AP2 Payment Mandate） | 仕様がある |
| **権限** | チェーン（ENSv2）。**委任先は自分の権限を書き換えられない** | 仕様がある |
| **人であること** | 身元層（World ID / personhood credentials） | 仕様がある |
| **責任** | **導入した組織（＝人間の側）** | AEPD 2026-02 |
| **→ その責任を支える証跡** | **⬜ Yohaku** | **ここに持ち主がいない** |

# ⑩ なぜ OSS なのか — 善意ではなく、要件だから

**Yohaku は MIT です。** 「みんなで広げよう」という話ではありません。**開いていないと成立しない**
種類の製品だからです。

```mermaid
flowchart LR
  Q["この面は<br/><b>人が見なかったもの</b>を決める"] --> R{"中身が<br/>読めるか？"}
  R -->|"読めない"| N["<b>信用できない</b><br/>何を隠したか確かめられない"]
  R -->|"読める"| Y["<b>確かめられる</b><br/>ルールを読み、走らせ、反証できる"]
  N -.->|"エージェントに<br/>決めさせるのと同じ危うさ"| N2["閉じた箱が<br/>『これは見せなくていい』と決める"]
  classDef bad fill:#FFF0F0,stroke:#FF6B6B,stroke-width:2px,color:#7a1f1f
  classDef ok fill:#F2FBD9,stroke:#7FA326,stroke-width:2px,color:#2F3D09
  classDef q fill:#EDE9FF,stroke:#6B5BD6,color:#241f3d
  class N,N2 bad
  class Y ok
  class Q,R q
```

AP2 は Trusted Surface に **MUST be non-agentic** を課しました。理由は
*"the Agent itself is a potential attacker"*。**同じ理屈が一段先まで伸びます。**

> **人が「見なかったもの」を決める面は、中身が読めなければならない。**
> 見せないと決める側は、**見せられる側**でなければならない。

だから我々は、主張を主張のまま置きません。

```bash
npm test          # 409 tests
npm run verify    # 12 claims — ドキュメントの数字をコードから再導出する
npm run seed -- 2    # 一晩を生成して route() に通す。seed を変えれば入力は動く
```

**「入力は 46〜54 で揺れる。本人に届く数は、20回とも 2 だった」は主張ではなく出力です。**
**反証も同じコマンドでできます。** ルールを書き換えて、数字が変わるのを見てください。

## 持っていってほしいもの

**製品ではなく、形のほうを使ってください。**

| 持ち出せるもの | どこにある |
|---|---|
| **順序つき10段。最初に当たったものが決める** | `src/core/rules.ts` |
| **未知は `human` に送る。`auto` ではない**（rule 9） | 同上 |
| **全部の故障経路が `deny` に落ちる。沈黙は同意ではない** | 同上 + `src/ports/` |
| **AI の返せる値に「通す」を作らない。**スキーマに無ければ、騙されても通らない | `src/ports/classifier.ts` |
| **1日に何人が何回呼ばれてよいかの上限** | `src/core/queue.ts` |
| **主張をコードから再導出する検証器** | `scripts/verify.ts` |

**この6つは Yohaku のものではありません。** エージェントが人に何かを頼む場所なら、
どこでも要るものです。**合わないと思ったら、反証して教えてください。**
我々は実際に自分の主張を2つ撤回しています（[ASSUMPTIONS.md](ASSUMPTIONS.md) B3、§5）。

---

# 落ち

エージェントは眠りません。人は眠ります。

**一晩に約50件来て、彼女が見るのは2件。**
残り48件ぶんの静けさが、この製品が売っているものです。

> **余白は、余りではない。描かないと決めた場所です。**

そして、**何を描かないかを決める場所は、誰にでも読めなければならない。**
だから MIT で、だから検証器が付いています。

**取っていってください。反証してください。** 誰かの1日が2件で済むようになるなら、
それが Yohaku である必要はありません。

---

*図の一覧は [../README.md#7-図面の一覧](../README.md#7-図面の一覧)。
数字の根拠は [ASSUMPTIONS.md](ASSUMPTIONS.md)、外部の一次情報は [../knowledge/](../knowledge/)。*
