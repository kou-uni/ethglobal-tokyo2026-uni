# Noren — product design

> **Agents never sleep. People do.**
> Noren stands in that gap.

## 1. The asymmetry this exists for

|  | Today | **Agent economy** |
|---|---|---|
| Requests reaching one person | **A few a year.** A human thinks of you, a human contacts you | **52 a day. ~20,000 a year** |
| Missed opportunity | Small — there was not much to miss | **Anyone without an open counter loses all 20,000** |
| How you handle it | Read every one | **Read 2. The rest pass or drop by themselves** |

*Noren* (暖簾) is the cloth shop curtain hung at a Japanese storefront: **it means the shop
is open.** Until now, hanging one brought a handful of customers. In the agent economy,
**customers arrive all night** — and only those who can triage them can take the business.

You duck under it (`auto`), you get called to the counter (`human`), or the curtain is
down (`deny`).

## 2. Request schema

Every agent request carries exactly five things.

```
  who       market-research-agent.acme.eth     ENS name — it identifies itself
  what      "purchase intent, cosmetics, age 30s"
  purpose   demand estimation for a new product (not AI training)
  price     0.5 JPYC per record
  deadline  withdrawn if unanswered within 12h
```

**`deadline` is the one people forget.** Agents cannot wait. A product that has not decided
**what happens while the person is asleep** does not work at all.

## 3. Routing

### `auto` — 38 of 52

| Example | Why it passes |
|---|---|
| "Purchase intent, groceries, this week" — 0.5 JPYC | Within the stated policy, low value, already aggregated |
| "A nearby café wants to know your coffee preference" — 0.2 JPYC | Low risk, **this counterparty passed before** |
| "Weekend activity range, coarse granularity" — 0.8 JPYC | Category allowed, **granularity is coarse** |

**She is asleep. She is never asked about these.**

### `human` — 2 of 52

| Example | Why it escalates |
|---|---|
| "Hay fever symptoms and OTC medication history" — 2,000 JPYC | **Sensitive category (health).** Large amount |
| "We want to use your writing for AI training" — 5,000 JPYC | **Unusual purpose.** Hard to take back once granted |
| "A company is interested in your work history" | **Affects a life, not a balance** |
| A first-time counterparty, otherwise in scope | **No precedent. Ask once** |

**07:00 — one notification. "2 requests need you."**

### `deny` — 12 of 52

| Example | Why it drops |
|---|---|
| "Bank account usage patterns" | **Category explicitly forbidden by the owner** |
| "Medical check-up results" | **The `health` subname has been revoked** |
| A counterparty granted access a year ago, asking again | **The grant expired** |
| Payment source linked to a sanctioned address | **Stopped by payment screening** |

**These 12 never reach her.** That is how "nothing was sold behind my back" becomes visible.

## 4. Human queue control

Three-way routing is easy. **The product is what happens after `human`.**

| Behaviour | Detail |
|---|---|
| **Bundle** | "**3 companies are asking for the same health category**" — one notification, not three |
| **Rank** | value × counterparty reputation × deadline. **Only the top 3 are shown** |
| **Time** | Hold overnight. **Surface once, at 07:00** |
| **Fall back on deadline** | **Decide in advance what silence means. Default is `deny`** |

**Silence is not consent.** A signal that cannot distinguish "quiet" from "dead" is not a signal.

## 5. The flywheel

Decisions made in `human` accumulate, and the same pattern lands in `auto` next time.

```
day 1    human 12    the router does not know her yet
day 3    human  5
day 7    human  2    her judgment has moved into the router
```

**The workload shrinks over time.** And what accumulates is this:

> **A database of when a human says no.**
> In an age of synthetic everything, **how a person decided** is the scarce part.

### What only the platform can see

| Signal | Where it goes |
|---|---|
| "This agent was **rejected by 87 of 100 people**" | **Reputation network** — feed back into payment screening |
| "Requests phrased this way are **rejected far above baseline**" | Early detection of abuse patterns |
| "Demand in this category is **12× supply**" | **Price discovery** → §6 |

No individual can see any of this. **The platform can.**

## 6. Turning volume into price

> Categories in demand **raise their own price.**
> She is asleep while **her information gets more expensive.**
> 07:00 — "12 companies asked for your purchase intent this week. Unit price raised 0.5 → 0.8 JPYC."

**A flood of requests becomes price discovery.** Hand-priced markets cannot do this;
it only exists because agents ask constantly.

## 7. Name space

```
alice.human.noren.eth              a person, proven human via World ID
├─ needs.alice.human.noren.eth        the bundle of grants (parent)
│  ├─ purchase.needs.alice…              purchase intent → granted to agent A, 30 days
│  └─ health.needs.alice…                health → granted to no one
└─ device.alice.human.noren.eth       her own delegated agent
```

**Revoke the parent and everything under it falls at once.** Inheritance in the name space
*is* the permission model — which is why it can be managed by intuition rather than by a
policy language.

## 8. Demo walkthrough

```
02:00   agent requests keep arriving           52

        the router handles them
          auto   38   settle immediately, executed under constraints
          deny   12   revoked / out of scope — never reaches her
          human   2   bundled, held

        she is asleep

07:00   one notification
        "2 requests need you."

          1 approved  → fresh human verification → payment executes
          1 ignored   → deadline passes → auto-denied

        ledger:  ¥42,300 arrived overnight
        graph:   escalations  12 → 5 → 2
```

**Opening line:**

> **"52 came in. She was asked about 2."**

### Design rule

> **"Don't trust our demo. Check it yourself."**
>
> Everything should be verifiable **without going through our app** — on-chain, in the ENS
> app, in a block explorer. Judging happens one person at a time at the booth;
> **what matters is whether they can touch it.**

---

*Numbers in this document (52 / 38 / 12 / 2) are the demo scenario, not measurements.*
