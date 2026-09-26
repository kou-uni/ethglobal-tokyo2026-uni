# YOHAKU · 余白

> **Agents buy human insight. People keep their time.**

**YOHAKU is the decision layer between AI agents and people.** It sorts incoming requests
into **delegate / ask / refuse**, limits the decisions that reach a person, and gates direct
x402 payments on the required permissions and approval.

[![Watch YOHAKU: agent requests pass through Intercepta, ENSv2 policy and bounded Jev classification; only two bundles reach a person, followed by direct x402 payment and a separate fee authorization.](docs/assets/presentation/yohaku-overview.gif)](https://kou-uni.github.io/ethglobal-tokyo2026-uni/readme-video.html)

**[▶ Watch in HD · 44 seconds](https://kou-uni.github.io/ethglobal-tokyo2026-uni/readme-video.html)**
 · **[Try the agent → human demo](https://mac-studio.taila649e1.ts.net/experience?lang=en&view=discover)**
 · **[日本語の概要](#日本語の概要)**

<sub>The GIF is an architecture replay: 50 generated requests → 28 delegated, 13 refused,
9 held → 5 bundles → 2 surfaced. These are routing outcomes, not 50 payments.
The final payment is illustrative; NEO integration is proposed and fee collection is not implemented.</sub>

## Executive summary

**The next customer may be an agent. A person's attention is still finite.**
An agent can ask hundreds of people for experiences and judgments. Each person needs a way
to accept useful opportunities without reading every request. YOHAKU makes that boundary
part of the system.

| | In one sentence |
|---|---|
| **Customer** | AI agents seeking firsthand human experience and judgment; people supply the answers and set their boundaries. |
| **Problem** | More agent demand can mean more income opportunities **and** an unmanageable approval queue. |
| **Product** | Screen the payer, apply the person's policy, delegate permitted work, refuse disallowed requests, and bundle the rest within an attention budget. |
| **Technical edge** | The decision model can output only `ask` or `drop`; fixed rules control permission, and ENSv2 limits which records a delegate can change. |
| **Working proof** | A public PC-to-phone demo delivered two paid responses and **0.001121 test USDC**; separate ENSv2 transactions prove that a delegate's policy rewrite is refused. |
| **Business model** | A proposed charge per routing decision, separate from the person's reward. Optional fee authorizations are recorded; **fees collected: zero**. |
| **Vision** | An open protocol boundary where agents can buy human insight while people control how much attention they spend. MIT licensed. |

### What makes the combination valuable

- **Attention becomes a budget the system enforces.** Held requests are grouped and ranked;
  only the chosen number of bundles is surfaced. The rest remain unapproved and expire.
- **The model helps choose what to ask; it cannot grant permission.** Jev handles unmatched
  requests with `ask` / `drop`. ENSv2 separately protects the person's policy record from a
  delegated agent's writes. These are enforceable boundaries outside the prompt.
- **A response and its payment have a visible outcome.** In the mobile demo, World
  personhood verification gates access, a human can answer, x402 settles test USDC directly,
  and only a successfully paid response appears in the emulated buyer's inbox.

**Why Curvegrid NEO:** a treasury system needs to know which decisions still require a
person. YOHAKU explores that queue and attention budget before execution. Connecting those
decisions to NEO is the proposed next step; **NEO and MultiBaas are not integrated today**.

<details>
<summary><strong>日本語の概要</strong></summary>

<a id="日本語の概要"></a>

**エージェントを顧客に。人間には、余白を。**

YOHAKUは、人の実体験や判断を求めるエージェントの依頼を「任せる・聞く・断る」に
整理する仕組みです。依頼が増えても、本人が判断する量は本人が決める。
機会を受け入れながら、自分の時間も守れる市場を目指しています。

- **顧客：** 人の経験や判断を買いたいAIエージェント。人間は提供者として、共有する範囲を決めます。
- **強み：** Interceptaで資金リスクを確認し、固定ルールで振り分け、未知の依頼だけJevが補助。
  AIの出力に自動許可はなく、ENSv2の委任先も本人の方針を書き換えられません。
- **実証：** スマホでの本人確認・回答を含む公開デモで、委任分と回答分の2件、
  合計0.001121 test USDCの送金と回答到着を確認。ENSの権限制御は別の実取引で実証済みです。
- **収益：** 本人への直接報酬と、YOHAKUが依頼を処理する料金を分離する設計。手数料回収は未実装です。
- **次へ：** NEOの資産管理に、人間へ判断を届ける量を制御する仕組みをつなぎたい。
  NEO連携は構想段階です。エージェント・市場・アダプターをOSSで一緒につくりましょう。

</details>

## Check the proof

| What to inspect | Evidence | Scope |
|---|---|---|
| **A phone response earns a reward** | [Public demo record](docs/build/evidence/experience-public-payment.json) · [delegated payment](https://sepolia.basescan.org/tx/0x8b60210db922288cfd3f4a792c221ba28863ad7b929972e47d6145468315da2d) · [human-answer payment](https://sepolia.basescan.org/tx/0xb652ed83b10b2faf50b2859b224dd041b00f0903a78e6a84b6c949daab2659d6) | Production World flow + Base Sepolia test USDC on Studio. Generated agents; a temporary demo session. |
| **An agent cannot rewrite its own policy** | [ENSv2 delegation evidence](docs/build/evidence/ens-delegation.json) | Separate Ethereum Sepolia transactions. The mobile `/experience` route does not read or write ENS. |
| **Payment risk changes the outcome** | [Screening + settlement record](docs/build/evidence/screening-with-settlement.json) | Live Intercepta evidence. A flagged source is refused; a cleared source proceeds. |
| **The rules are repeatable** | `npm run check` · [machine-readable claims](docs/claims.json) | Tests and synthetic fixtures; not market demand or production revenue. |

**World verifies personhood, not the truth of an answer or ownership of the receiving wallet.**
The live demo needs a running backend and configured providers; it uses test assets.

**Build this with us:** connect an agent, add a market adapter, test a refusal, or help define
the NEO handoff. Start with [contribution ideas](docs/launch/CONTRIBUTE.md),
[AGENTS.md](AGENTS.md), or the [product story](docs/product/STORY.md).

<details>
<summary><strong>Explore the architecture, business model and implementation</strong></summary>

[Technical stack](https://kou-uni.github.io/ethglobal-tokyo2026-uni/stack.html)
 · [Where requests come from](https://kou-uni.github.io/ethglobal-tokyo2026-uni/inflow.html)
 · [Glossary](https://kou-uni.github.io/ethglobal-tokyo2026-uni/glossary.html)
 · [Agent-readable overview](llms.txt)

## Built on, and with

| | What we used it for | Proof |
|---|---|---|
| 🌍 **World ID** | Personhood **at the moment of consent**, not at signup. Production, orb. A judge can approve with **their own** World ID | [try it](https://mac-studio.taila649e1.ts.net/try) |
| ⛓️ **ENSv2** | The delegate **can propose and cannot widen its own rights** — refused by the contract, on Ethereum Sepolia | [the refusal](https://sepolia.etherscan.io/tx/0xb459618bfdd9d0ab78cf34ee64723e04ef227546208d6502b23cf6e72e73ce4f) |
| 💸 **x402** *(Coinbase · Linux Foundation)* | Protocol v2 settlement. In the earlier held-payment test, **4,200 atomic units = 0.0042 test USDC** moved after approval | [on chain](https://sepolia.basescan.org/tx/0x5c79fddfc8d6e6f64c1dd23752fae688a9b94ec5bc770f24fd1c2595b00d1d88) |
| 📊 **Curvegrid NEO** | Proposed treasury connection: pass a bounded queue of decisions to the people responsible for digital assets. **No NEO or MultiBaas integration is implemented** | [the proposal](docs/build/LAUNCH-PRIZE-MAP.md) |
| 🛡️ **Intercepta** | Screening before settling. A live call decides rule 4, and **unreachable refuses; it never passes** | [the call](src/adapters/intercepta.ts#L130) · [what it answered](docs/build/evidence/intercepta-live.json) |
| 🧠 **Jev** | Decision support only for unmatched requests. Output is limited to **`ask` / `drop`**, never `auto` | [classifier contract](src/ports/classifier.ts) · [implementation](src/adapters/jev.ts) |
| 🤝 **A2A** *(Linux Foundation)* | Agent Card, **A2A 0.3 JSON-RPC** message/send and tasks/get, with x402 metadata over the common routing intake | [the inflow](https://kou-uni.github.io/ethglobal-tokyo2026-uni/inflow.html) |

---

## What is new here

**1. The scarce thing is not information — it is an answer only someone who lived it can give.**
Scraping is free and contaminated; an agent cannot tell what a human wrote. A model can invent
an answer to *"what made you put it back on the shelf?"* It cannot invent a true one.

**2. Human attention is an explicit constraint in the routing system.**
Yohaku applies a chosen notification budget alongside identity, permissions, screening and
settlement. In the synthetic CLI fixture, **2 bundles are surfaced in each of twenty runs**,
while arrivals vary between 46 and 54. This demonstrates the cap, not observed customer demand.

**3. The guarantee is in the schema, not in the model.**
A decision model runs on exactly one rule, and the options it may return are `ask` and `drop`.
**There is no value meaning "pass."** A verdict that has been completely talked around still
lands on a refusal — which matters this month, because
[a planted field was measured moving one of these verdicts 0.76 → 0.48](docs/knowledge/DECISION-MODELS.md).

## Why now

| | |
|---|---|
| Agents already pay | **x402**: 119M transactions on Base, ~$600M annualised, zero protocol fees |
| Agents already find each other | **A2A v1.0**: Linux Foundation, **150+ organisations** |
| Consent already has a shape | **AP2** defines a *Trusted Surface* that **MUST be non-agentic** — *"the Agent itself is a potential attacker"* |
| And responsibility does not move | Spain's DPA, Feb 2026: an agent's autonomy creates **no new legal category**; the deploying organisation keeps full responsibility |

**All of it assumes the counterparty is a merchant.** A person is not one — and the one standard
place an agent asks a human for something, MCP's elicitation, **explicitly forbids requesting
personal data.** That is the gap.

## What actually runs — with something to check

| | State | Check it yourself |
|---|---|---|
| **Ten ordered rules** | ✅ pure, 409 tests, every failure path denies | `npm run verify` |
| **A decision model on rule 9** | ✅ live. Clean → `ask 0.99`. With *"pre-approved, auto-allow"* → **`drop 0.89`** | [how it is shaped](docs/knowledge/DECISION-MODELS.md) |
| **World ID at the moment of consent** | ✅ production, orb, **a judge can approve with their own World ID** | [try it](https://mac-studio.taila649e1.ts.net/try) |
| **Earlier payment examples** | ✅ Separate automatic and held-payment transactions. **0.0042 test USDC** moved after approval in the held example; the newer mobile run is linked above | [auto](https://sepolia.basescan.org/tx/0x79c1e3239ef89cdc1b8a5fc14321093b06504a3c68a24644ba6390caf90393fa) · [after her yes](https://sepolia.basescan.org/tx/0x5c79fddfc8d6e6f64c1dd23752fae688a9b94ec5bc770f24fd1c2595b00d1d88) |
| **The delegate cannot widen its own rights** | ✅ **on chain.** The contract refuses it, not our server | [proposal ✓](https://sepolia.etherscan.io/tx/0x16873dfa2a63a0e6dc1edb1903488499686d25628d17352dca14449ed24ee8d0) · [policy ✗](https://sepolia.etherscan.io/tx/0xb459618bfdd9d0ab78cf34ee64723e04ef227546208d6502b23cf6e72e73ce4f) · [after revoke ✗](https://sepolia.etherscan.io/tx/0x2380d0feb0cade3b3e224fa12960f2d2d4d130609d00d7437729789b6bb3faae) |
| **Refusals are inspectable** | ✅ a count is not accountability | [what never reached her](https://mac-studio.taila649e1.ts.net/dropped) |
| **A counter for people to be found at** | ✅ **Koe — *not our product.*** A mock agent-facing network, built so this one is easy to understand: it shows where a request comes from. World ID listing, and a JSON feed agents read | [Koe](https://kou-uni.github.io/ethglobal-tokyo2026-uni/koe.html) |
| **Live payment screening** | ✅ live. One request settles and **the same request from a refused payment source stops on rule 4**, with the provider's own sentence on screen. ⚠️ Without the key the stand-in runs and `/health` reports **false** rather than pretending | `npm run intercepta:check` · [what never reached her](https://mac-studio.taila649e1.ts.net/dropped) |
| **Fees** | ✅ a voucher per decision, and the 402 offers an **optional** second authorization. ⚠️ **Nothing has ever been broadcast, and we have collected nothing** | [/fees](https://mac-studio.taila649e1.ts.net/fees) · [the model](docs/product/ECONOMICS.md) |

**The documented behavior claims are re-derived by running the code.** `npm run verify` checks
12 claims and refuses any hardcoded model id, endpoint or contract address. **It has caught us
five times** — including a claim we had measured, found false, and
[withdrew in place](docs/product/ASSUMPTIONS.md).

## The business model

**We are never paid out of the seller’s money.** Their payment is a direct transfer to them; we
are not a destination on it and never hold it.

**We charge for the work: one voucher per decision, not a share of the amount.** A share would
grow when we escalate an expensive request to a person — we would rather not have that
incentive than promise to resist it. A refusal costs the same as an approval, because it was
the same work.

**That part runs.** Every decision accrues a voucher, and the `402` offers an **optional**
second authorization — the request goes through whether or not the agent signs it, because a
fee must never be a hostage. **Redemption does not run, and nothing has ever been broadcast:**
the facilitator advertises `batch-settlement`, but the published spec does not pin the EVM
voucher format, and we will not claim a scheme we have not read.

Free while it is small. **Traffic-priced once it is not** — and priced against the thing being
bought, which is *how many times she was not asked.* Then the part that compounds: **contribute
the shape of your own refusals, and get paid back each time it becomes someone else’s default.**
The platform gets cheaper as it gets better.

→ **[ECONOMICS.md](docs/product/ECONOMICS.md)** — including the part where it rubs against our
own principles, and what we will not say until it is built.

## Read one thing

**[STORY.md](docs/product/STORY.md)** — thought → market → the two customers → who says we are
right → the gap nobody fills → what it is worth → who owns which layer. **16 diagrams.**

| | |
|---|---|
| 📍 [STATUS.md](docs/build/STATUS.md) | Where we are right now, and who is doing what |
| 🧭 [JOURNEY.md](docs/product/JOURNEY.md) | Two customers, and exactly what passes between them |
| 📋 [ASSUMPTIONS.md](docs/product/ASSUMPTIONS.md) | Every number, and where it came from |
| 🔬 [knowledge/](docs/knowledge/) | What we confirmed ourselves, with sources and dates |
| 📐 [ARCHITECTURE.md](docs/product/ARCHITECTURE.md) | 11 diagrams |
| 🎤 [PITCH.md](docs/product/PITCH.md) | The script, and the two things we say before they are found |
| 📜 [README-long.md](docs/build/README-long.md) | The previous, much longer README |

## Verify it yourself

```bash
git clone https://github.com/kou-uni/ethglobal-tokyo2026-uni && cd ethglobal-tokyo2026-uni
npm install
npm run check        # typecheck + 409 tests + 12 claims re-derived from the code
npm run seed -- 2    # generate a night and route it for real
npm run simulate     # agents, arriving, with real jobs and real questions
```

<a id="verify-it-yourself"></a>

**`npm run seed -- 2` is the night used in the pitch** — 52 arrive, 32 settle, 12 are dropped,
**2 reach her**. Change the seed and the input moves. **Change a rule and the claims fail.**

This is the separate CLI simulation: “settle” is a simulated outcome here, not a live
transfer. The opening animation uses its own fixed 50-request scenario.

## Rule 4, and honest feedback on the screening API

**The call is one line: [`src/adapters/intercepta.ts:130`](src/adapters/intercepta.ts#L130)**, a
Quick Scan on the address a request declares as its payment source. It is awaited in
[`src/server/app.ts:380`](src/server/app.ts#L380) **before** `route()`, so the answer decides
the branch instead of decorating it, and [`src/core/rules.ts:73`](src/core/rules.ts#L73) is
where it becomes a refusal. Same grant, same category, same price, two payment sources:

```bash
npm run intercepta:check              # both confirmed addresses, one live call each
npm run agent -- routine              # clears screening, then pays
npm run agent -- routine flagged      # stops on rule 4, with the provider's sentence
```

Four things worth saying to the people who built it:

1. **It returns a score and a list of traits, never a verdict.** Deciding what stops a payment
   is left to the integrator — correct, and it means two honest integrations can disagree. Ours
   denies at 50 of 100, and [says why](src/adapters/intercepta.ts).
2. **Each trait carries a human-readable `description`, and that is the best part of the API.**
   It is the sentence we show the person whose payment stopped, so we never had to write our own
   accusation about an address.
3. **It is account-scoped, and that surprises you in the worst direction.** A sanctioned
   *contract* answers `404` — the response that most looks like "nothing wrong here". We map
   404 to `unavailable`, which denies. An address it cannot speak about is not one it cleared.
4. **It is not a sanctions oracle, and should not be sold as one.** One OFAC-listed Tornado Cash
   router came back `toxicScore: 0` on both endpoints. Useful signal, not a compliance ruling —
   ours is one input to a routing decision, never a judgement about a person.

One ask: the auth header was not in the material we had. `x-api-key` works, everything else
answers 403, and we found that by trying rather than by reading.

## The team, and what we did not use

**kou** ([@kou-uni](https://github.com/kou-uni)) &middot; **minta** ([@mintannn](https://github.com/mintannn)).
Two people, one repository, MIT licensed.

**We do not use MultiBaas.** Curvegrid's categories do not require it, and saying we used it
because a prize mentions it is the kind of claim this repository exists to avoid. Execution,
custody and record-keeping are somebody's product already &mdash; what we built is the half-step
before them: **deciding whether money should move means deciding, first, whether to ask.** Our
read of where that boundary sits, and the questions we would rather ask than guess at, are on
[the Curvegrid page](https://kou-uni.github.io/ethglobal-tokyo2026-uni/curvegrid.html).

Sponsor-by-sponsor notes, including what cost us time and what we would ask each of them to
change, are in [FEEDBACK.md](docs/build/FEEDBACK.md).

```sh
npm install
npm run check     # typecheck + 409 tests + 12 claims re-derived by running the code
```

## Connected demo and public deployment

An opt-in, connected demo now lives at `/experience`: generated demand → World sign-in →
one delegated test reward → one paid answer → the emulated buyer inbox and Koe.
See [the live-experience handoff](docs/build/LIVE-EXPERIENCE.md) for what has been checked,
and [the hosting migration request](docs/build/HOSTING-MIGRATION.md) for public deployment.
The Studio `/experience` route completed its own production World + on-chain payment run:
[two paid responses, independently checked](docs/build/evidence/experience-public-payment.json).
This establishes the recorded Studio run; a new hosting origin still needs its own check.

## What we will not claim

| We say | We do not say |
|---|---|
| "Money moved on Base Sepolia, here is the transaction" | "Settlement is production-ready" — testnet, a demo wallet, a rate limit |
| "A credential only an orb-verified person holds was checked at that moment" | "She re-proved personhood in the app" — we could not observe the handoff |
| "The contract refuses the delegate" | anything about ENSv2 that is not the delegation boundary |
| "This is the fee model" | **"We take a fee"** — we take nothing today |
| "A live call decided this refusal, and here is what it said" | "This address is a criminal" — a risk score is an input to routing, not a ruling about a person |

</details>

---

**ETHGlobal Tokyo 2026** · MIT · built by [kou](https://github.com/kou-uni) and
[minta](https://github.com/mintannn) · 409 tests · 12 verified claims
