# Yohaku — product design

> In Japanese painting, *yohaku* — the empty space — is not what's left over.
> **It is what the painter decided not to draw.**
>
> **Agents never sleep. They will fill every hour you have.**
> **Yohaku decides what not to show you.**

## 0. Why anyone pays a person for this

Training costs have no ceiling. As models get better, **what gets expensive is not compute —
it is data nobody already has.** And the open web stopped being that some time ago.

**An agent scraping the web cannot tell what a human wrote.** Synthetic text is free,
abundant, and indistinguishable at scale. So the scarce thing is no longer *information*.
It is **information you can prove came from a person.**

That is the whole reason this market exists:

> **Scraping is free, and contaminated.**
> **So an agent will pay — for something it can prove was not generated.**

Which makes one property the entire product:

> **Only humans can register here.** Proof of personhood at the door, and
> **the ability to take a name away** when someone poisons the well.

Note what that second half is doing. Proof-of-personhood shows *the account holder* is a
person; it does not show *the content* is. **The guarantee is not the signup — it is that a
name can be revoked.** Personhood here is maintained, not certified once.

And there is a second scarcity underneath, which is what §5 is about: as agents do more of
the deciding, **a record of when a human said no** becomes the thing that cannot be
synthesised either.

## 0-B. Where this sits: the finances of an AI agent

**An agent's finances are not a balance to be watched.** An agent that works around the
clock is spending and earning around the clock, and the question that decides everything is
not *how much* — it is **where a person still has to be involved.**

Yohaku is that involvement point.

| | |
|---|---|
| **Not** | a wallet, a treasury dashboard, or an execution layer |
| **Is** | the layer that decides **which of an agent's money movements a human has to see at all** — and holds that number to what the person can actually absorb |

The morning ledger is the smallest possible form of it: **one screen of what an agent moved
overnight, and the two things that needed a person.** Scale that from one seller to a team
to a company and the shape does not change — only the number of people whose attention is
being spent.

**That is the part nobody has built.** Identity, permissions, execution and custody all
exist. *"The missing layer decides whether money should move"* — and deciding whether money
should move means deciding, first, whether to ask.

## 1. The asymmetry this exists for

|  | Today | **Agent economy** |
|---|---|---|
| Requests reaching one person | **A few a year.** A human thinks of you, a human contacts you | **~50 a day** |
| Missed opportunity | Small — there was not much to miss | **Anyone without an open counter loses every one of them** |
| How you handle it | Read every one | **Read 2. The rest pass or drop by themselves** |

<sub>Where ~50 comes from: standard survey sample size (n≈400) × research tasks run per day ÷ registered sellers in that category. **The fewer the sellers, the more each one receives.** The input varies with all three — what this product fixes is the **output**.</sub>

**Yohaku is not a way to close the door. It is what makes opening it possible.**
Open a counter in the agent economy and some 50 requests arrive overnight — so only those
who can triage them can take the business.

## 2. What it sells is empty space

The value is not what you did. It is **what you never had to look at.**
~50 requests, 2 seen — **48 requests worth of empty space.**

**The interesting number is 2, not 50.** How many arrive is not ours to control; how many reach a person is.

| | Action | In terms of *yohaku* |
|---|---|---|
| **`auto`** | ~33 pass automatically | **Creates space** — she is never asked |
| **`human`** | **2 are raised** — her daily cap | **Occupies space** — worth her attention |
| **`deny`** | ~8 are dropped | **Protects space** — never reaches her |

The rest of the design says the same thing in other words:

- **Bundling** (3 companies → 1 notification) — does not eat into the space
- **Deadline fallback** (silence → `deny`) — pending items never pile up. **The space holds**
- **Accumulated decisions** — **what moves first is not what she sees.** The cap holds her
  mornings at two from day one; what grows is **how many she never had to be asked about**:
  0.1 a day in week one, **6.3 a day by week four**. Only then do the mornings themselves
  get quieter *(2.0 → 2.0 → 1.9 → 0.9)*

## 3. Request schema

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

## 4. Routing

Rules are evaluated top-down. **The first match decides.**

```
0. A delegated agent tried to rewrite the owner's own permissions  → deny   ★
1. The grant has been revoked                                      → deny
2. Category explicitly forbidden by the owner                      → deny
3. The grant expired                                               → deny
4. Payment source failed screening                                 → deny
5. Sensitive domain (health / finance / employment)                → human
6. Amount above the owner's threshold                              → human
7. First-time counterparty                                         → human  (once)
8. Matches the allow list                                          → auto
9. Nothing matched                                                 → human  ← not auto
```

**Rule 0 is on a different axis.** Rules 1–9 judge requests arriving from outside;
**rule 0 judges the delegate on the inside.** Handing work to an AI and letting an AI widen
its own authority are different things — **separating them is what ENSv2 is for here.**

**Rule 9 matters as much.** Routing the unknown to `auto` is how a system becomes
impossible to explain after an incident.

### Defaults when something breaks — all `deny`

| Situation | Result |
|---|---|
| Routing engine down | **deny** |
| Screening API down | **deny** |
| **The person does not answer before the deadline** | **deny** — silence is not consent |
| Identity verification fails | **deny** |

### What is actually new here

Ten rules are too many to narrate. **Only three of them are new to the agent economy.**

| | The shift | Rules |
|---|---|---|
| 1 | **"I stopped" does not propagate.** A person says it once and is done. **Agents keep arriving, unaware** | 0, 1, 3 |
| 2 | **First-time counterparties never stop arriving.** A person meets a few strangers a year; **new agents are born daily** | 7, 9 |
| 3 | **You must decide in advance what silence means.** People sleep. Agents cannot wait | defaults |

The other rules are needed to run, but they are not the story. Rule 6 (amount threshold) is
the same approval workflow enterprises have always had. Rule 2 is ordinary access control.

## 5. Human queue control

Three-way routing is easy. **The product is what happens after `human`.**

| Behaviour | Detail |
|---|---|
| **Bundle** | "**3 companies are asking for the same health category**" — one notification, not three |
| **Rank** | value × counterparty reputation × deadline. **Only the top few are shown** |
| **Time** | Hold overnight. **Surface once, at 07:00** |
| **Cap** | **The owner sets how many may reach them per day. Default 2** |
| **Fall back on deadline** | **Decide in advance what silence means. Default is `deny`** |

## 6. Surface

Three endpoints.

| | Purpose | Returns |
|---|---|---|
| `POST /requests` | An agent submits the five fields | **Synchronously** `auto` / `human` / `deny` + reason |
| `POST /approvals/:id` | The person answers, with a proof of personhood | Execution result |
| `GET /ledger/:name` | Ledger | Counts, income, escalation trend |

**`POST /requests` answers synchronously even when the verdict is `human`** — it returns
"held, deadline at T". An agent that is left hanging is an agent that is stuck.

The console (`demo/index.html`) is one page with five things a judge can touch.

| # | Screen | For | Contents |
|---|---|---|---|
| 1 | Policy | The person, once | Category rules, amount threshold, expiry |
| 2 | **Morning inbox** ⭐ | The person, daily | **Bundled escalations. Top 3. Approve** |
| 3 | Ledger | The person | daily counts, income, the escalation trend. **Not necessarily a list** — the useful shape may be an answer to *"which payments need me today?"* rather than a table |
| 4 | **Agent side** | **Judges, at the booth** | Submit a request, watch the verdict come back |
| 5 | **Delegate** | **Judges, at the booth** | Try to widen a delegate's rights — and be refused |

## 7. Permission model

```
alice.yohaku.eth
  text "yh:policy"     hash of the policy (the body stays off-chain)
  text "yh:price"      0.5 JPYC per record
  text "yh:license"    commercial-ok, no-training
  text "avatar"        on-chain SVG — visible in the ENS app, without going through us

  health.alice.yohaku.eth      not offered
  purchase.alice.yohaku.eth    active, 30 days
```

**Only the hash goes on-chain.** Putting the whole policy on-chain would spend the hackathon
on writes.

### What we claim, and what we do not

**We do not claim that revocation itself is unique to ENSv2** — comparable setups exist in v1.
The claim is narrower and stronger:

> **You can delegate to an AI without letting the AI rewrite what it is allowed to do.**

| Actor | May | May not |
|---|---|---|
| The owner's admin account | Update the policy, grant and revoke delegation | — |
| **A delegated agent** | **Update the proposal key only** | **Update permission keys or the payout address** |

That boundary is what rule 0 enforces, and it is verifiable on-chain by anyone.

⚠️ Key permissions on a permissioned resolver apply across every name in that instance.
Independent sellers must not be pooled into one resolver instance without scoping.

## 8. Demo walkthrough

```
02:00   agent requests keep arriving           49 tonight

        Yohaku handles them
          auto   33   settle immediately, executed under constraints
          deny    8   revoked / out of scope — never reaches her
          human   8   bundled — 2 will surface, her daily cap

        she is asleep

07:00   one notification
        "2 requests need you."

          1 approved  → fresh proof of personhood → payment executes
          1 ignored   → deadline passes → auto-denied

        ledger:  2,291 JPYC arrived overnight
        spared:  never had to ask — 0.1/day in week 1, 6.3/day by week 4
```

**Opening line:**

> **"Fifty came in overnight. She saw two."**

### Design rule

> **"Don't trust our demo. Check it yourself."**
>
> Everything should be verifiable **without going through our app** — on-chain, in the ENS
> app, in a block explorer. Judging happens one person at a time at the booth;
> **what matters is whether they can touch it.**

**Do not push fifty real transactions first.** Get *pass / ask / stop* genuinely working on a
handful of requests. Volume and the learning curve come after.

---

*Counts in this document are a demo scenario, not measurements. Show them as a number that **varies by day** — never burn a fixed figure into the UI.*
