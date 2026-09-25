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
| A2 | Cosmetics **manufacture-and-sale** licences in Japan: **4,324** (March 2024) | [Japan Cosmetic Industry Association](https://www.jcia.org/user/statistics/industry), compiled from MHLW and other government statistics | 🟢 |
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
npm run seed -- 18

  arrived            49
    auto             33   settled while she slept
    deny              8   never reached her
    human             8   held
  07:00 — daily cap 2
    surfaced          2
  settled            2,291 JPYC
```

**`npm run seed -- 18` is the night quoted in the pitch.** It was chosen as *the run closest
to the 20-seed mean* — not as the prettiest set of numbers. Any other seed gives a different
night, which is the point.

### Measured across 20 seeds

| | mean | range |
|---|---|---|
| arrived | **49.9** | 46–54 |
| auto | 32.5 | 26–37 |
| deny | 9.8 | 5–14 |
| human (held) | 7.5 | 4–11 |
| **surfaced at 07:00** | **2.00** | **2 — in all twenty runs** |
| settled | 2,617 JPYC | 1,445–4,324 |

**"About fifty arrive; she sees two" held in twenty runs out of twenty.** Arrivals wander by
±8 and settlements by ±6; **what reaches her does not move at all**, because the cap is what
fixes it — and the cap is hers, not ours.

⚠️ **What this measured, and what it did not.** These are our rules running against our own
generated input. **It is not a measurement of real demand** — A3 and A4 remain assumptions.
What it establishes is that *the router behaves as claimed*, which is the part we control.

| # | Value | Basis | Confidence |
|---|---|---|---|
| B1 | ~50 requests in one night | Generator output; 20 runs, mean 49.9 (46–54) | 🟡 |
| B2 | auto ~33 / deny ~8 / **2 reach her** | **`npm run seed -- 18`**, chosen as closest to the mean. Reproducible | 🟡 |
| B3 | **Spared** (never had to be asked) rises **0.1 → 2.6 → 4.3 → 6.3** a day; mornings themselves only fall in week four (**2.0 → 2.0 → 1.9 → 0.9**) | **Measured.** `runWeek()` replays 30 nights, feeding each morning's answers back in. **The cap binds before learning does**, so what moves first is how much she is spared — not what she sees. The earlier "12 → 5 → 2 in a week" was wrong and has been withdrawn | 🟡 |
| B4 | Amount received overnight | **Not a figure any more — the console sums what actually settled.** Any stated number must come from a run | 🟡 |
| B5 | "Rejected by 87 of 100 people" | Illustrative reputation signal | 🔴 |
| B6 | "Demand is 12× supply" | Illustrative pricing signal | 🔴 |

**Rule: none of these may be burned into the UI as a constant.** They are rendered as
"today's" values so that a judge asking "why 50?" gets the product's actual answer —
*the input varies; what we fix is the output.* **And now that answer can be demonstrated live:
run the seed again with a different number and watch the input move while the output does not.**

## 3. Defaults (product decisions, not measurements)

| # | Default | Reasoning |
|---|---|---|
| C1 | **Daily escalation cap = 2** | A person cannot absorb an unbounded number of decisions. **The owner sets this; 2 is only the starting value.** It is also what makes the output constant: in 20 runs the number reaching her was 2 every time |
| C2 | Notification time = 07:00 | One batch, in the morning. Chosen to make "she was asleep" legible in the demo |
| C3 | Request deadline = 12h | Long enough for a night to pass, short enough that an agent is not stuck |
| C4 | Prices: routine asks 80–200 JPYC, sensitive 3,000–6,000, occasional bulk ×12 | **Anchored to real survey incentives** (a respondent is typically paid ¥100–1,000). At 0.5 JPYC the ledger came to ¥17 a night, which is not a business and would not have survived a judge opening the console |
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
