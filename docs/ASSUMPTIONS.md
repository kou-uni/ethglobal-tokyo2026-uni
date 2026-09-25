# Assumptions

**Every number and default in this project, with where it came from.**

This file exists so that nothing in the demo can be mistaken for a measurement.
If a figure appears in the README, the pitch or the UI, it is listed here with its basis.

**Confidence levels**

| | Meaning |
|---|---|
| 🟢 **Verified** | Traceable to a public source or an official requirement quoted verbatim |
| 🟡 **Reasoned** | Derived from a verified constant plus stated assumptions |
| 🔴 **Placeholder** | Chosen for the demo. Not measured. Must never be presented as a finding |

---

## 1. Volume

| # | Value | Basis | Confidence |
|---|---|---|---|
| A1 | **Standard survey sample size n ≈ 385–400** (95% confidence, 5% margin) | Standard sample-size calculation. Universal in market research | 🟢 |
| A2 | Cosmetics-related companies in Japan ≈ 4,000 | **From memory. Not yet checked against a public statistic.** Intended source: MHLW cosmetics manufacture/sale licence counts | 🔴 **Verify or drop before submission** |
| A3 | Each company commissions research ~once a month | Deliberately conservative guess | 🔴 |
| A4 | Registered sellers in one category ≈ 1,000 | Early-stage scale, assumed | 🔴 |
| A5 | **→ ~50 requests per seller per day** | A1 × (A2 ÷ 30 days) ÷ A4 = 400 × 133 ÷ 1000 ≈ 53 | 🟡 |

**How this is presented:** only the order of magnitude ("about 50") is stated, and the
derivation is kept as a footnote. **The claim the product makes is about the output (2),
not the input.** If A2–A4 are wrong, the product's argument does not change.

> If A2 cannot be verified in time, **show the formula without the numbers**:
> *sample size × research tasks per day ÷ registered sellers.*

## 2. Demo scenario — now produced by the router, not typed in

**The counts are no longer chosen.** `npm run seed` generates a night of requests and runs
them through the real `route()`. The split is whatever the rules produce.

```
npm run seed -- 6

  arrived            50
    auto             36   settled while she slept
    deny             12   never reached her
    human             2   held
  07:00 — daily cap 3
    surfaced          2
```

**`npm run seed -- 6` reproduces every number used in the pitch.** Any other seed gives a
different night, which is the point.

### Measured across 20 seeds

| | mean | range |
|---|---|---|
| arrived | **49.9** | 46–54 |
| auto | 34.4 | 29–42 |
| deny | 9.3 | 6–13 |
| human (held) | 6.2 | 2–11 |
| **surfaced at 07:00** | **2.8** | **2–3** |

**"About fifty arrive; she sees two or three" holds across every run.** The input wanders by
±8; **the output does not**, because the daily cap is what fixes it.

⚠️ **What this measured, and what it did not.** This is our rules running against our own
generated input. **It is not a measurement of real demand** — A2–A4 remain assumptions. What
it does establish is that *the router behaves as claimed*, which is the part we control.

| # | Value | Basis | Confidence |
|---|---|---|---|
| B1 | ~50 requests in one night | Generator output; 20 runs, mean 49.9 | 🟡 |
| B2 | auto 36 / deny 12 / human 2 | **`npm run seed -- 6`.** Reproducible | 🟡 |
| B3 | Escalations 12 → 5 → 2 over 7 days | Illustrates the flywheel. **Not measured — the decision store is not implemented** | 🔴 |
| B4 | ¥42,300 received overnight | Arbitrary. Kept non-round so it reads as a sum of transactions | 🔴 |
| B5 | "Rejected by 87 of 100 people" | Illustrative reputation signal | 🔴 |
| B6 | "Demand is 12× supply" | Illustrative pricing signal | 🔴 |

**Rule: none of these may be burned into the UI as a constant.** They are rendered as
"today's" values so that a judge asking "why 50?" gets the product's actual answer —
*the input varies; what we fix is the output.* **And now that answer can be demonstrated live:
run the seed again with a different number and watch the input move while the output does not.**

## 3. Defaults (product decisions, not measurements)

| # | Default | Reasoning |
|---|---|---|
| C1 | **Daily escalation cap = 3** | A person cannot absorb an unbounded number of decisions. **The owner sets this; 3 is only the starting value** |
| C2 | Notification time = 07:00 | One batch, in the morning. Chosen to make "she was asleep" legible in the demo |
| C3 | Request deadline = 12h | Long enough for a night to pass, short enough that an agent is not stuck |
| C4 | Unit price = 0.5 JPYC / record | Illustrative. Real pricing is out of scope for the hackathon |
| C5 | **Everything fails to `deny`** | Safety choice, not a measurement. Silence is not consent |
| C6 | Sensitive domains = health / finance / employment | Chosen as domains where a wrong automatic answer is hard to undo |
| C7 | One category only: **purchase intent** | Scope control for 36 hours |

## 4. Technical assumptions

| # | Assumption | Status |
|---|---|---|
| D1 | World ID proofs are **mocked** during the hackathon | 🟢 Official: *"We are mocking proofs now… Proofs are using fake identities, DO NOT rely in them for production"* |
| D2 | Policy body stays **off-chain**; only its hash goes on-chain | 🟡 Design decision — writing full policies on-chain would consume the event |
| D3 | JPYC is not available on the testnet; a mock ERC-20 stands in | 🟡 Must be stated plainly in the README |
| D4 | ENSv2 Sepolia contracts were **redeployed 2026-09-15**; published articles are stale | 🟡 Take addresses from `ens-contracts` / docs at build time |
| D5 | ENSv2 registration is paid in **USDC/DAI, not ETH** | 🟡 Need mock USDC; ETH alone will not register a name |
| D6 | Permissioned-resolver key permissions span **every name in that instance** | 🟢 From ENS docs via `ENSV2-DIFFERENTIATION.md`. Sellers must be scoped, not pooled |
| D7 | The third prize slot is **ENS-first, decided by a timeboxed spike** | 🟡 See `ENS-VS-INTERCEPTA.md`. Not yet run |

## 5. Claims we deliberately do **not** make

| Claim | Why we avoid it |
|---|---|
| "Revocation is unique to ENSv2" | **False.** Comparable setups exist in v1. The claim is the **delegation boundary** instead |
| "Curvegrid NEO already contains this" | The talk described a design; it is not a statement of shipped features |
| "We interviewed N people" | v1 personas were **written, not interviewed**. No persona output may be cited as research |
| "This many requests actually arrive" | Nothing has been measured. Only the derivation is shown |

---

*Maintained alongside the code. If a number changes in the product, it changes here first.*
