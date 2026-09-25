# Architecture

> **One layer was missing.** Identity, permission, settlement and ledger all exist today.
> **Nothing stands between an agent's request and a person's attention.**
> Yohaku is that layer.

![Overview](../assets/overview.svg)

---

## 1. Layers, and who answers what

| Layer | The question it answers | Provided by | Sponsor |
|---|---|---|---|
| **L1 Identity** | *Is this a real person?* | World ID | **World** |
| **L2 Permission** | *What is this party allowed to ask for?* | ENSv2 + EAC | **ENS** |
| **L3 Routing** ★ | ***Pass it, ask her, or drop it?*** | **Yohaku** | **— (the gap)** |
| **L4 Settlement** | *May this money move, and under what limits?* | x402 + MultiBaas | **Curvegrid** |
| **L5 Ledger / Learning** | *What happened, and what did she decide?* | Ledger, decision store | **Curvegrid** |

**The three sponsors do not overlap.** Each answers a different question, and each can be
explained in one sentence. That separation is deliberate — it is also why payment screening
was not made the third slot: it would have sat on top of L4 and blurred Curvegrid's story.

## 2. Actors and trust boundaries

```mermaid
flowchart LR
  subgraph UNTRUSTED["Untrusted — outside"]
    A1["Buyer agent<br/>buys data, pays via x402"]
    A4["Third party<br/>judge / auditor — read only"]
  end
  subgraph SEMI["Semi-trusted — delegated"]
    A3["Delegate agent<br/>may propose, may not widen its own rights"]
  end
  subgraph TRUSTED["Trusted — the owner"]
    A2["Seller — a person<br/>proven human, writes the policy, approves"]
  end

  A1 -->|"request (5 fields)"| Y["Yohaku — L3"]
  A3 -.->|"proposals only"| Y
  A2 -->|"policy, approvals"| Y
  Y -->|"verdict + reason"| A1
  Y -->|"at most N per day"| A2
  A4 -->|"verifies on-chain, without us"| Y
```

**A1 and A3 are judged on different axes.** A buyer agent is asking *for* something;
a delegate agent may be trying to change *what is allowed*. Rule 0 exists for the second case.

## 3. Components

```mermaid
flowchart TB
  IN["C1 Request Intake<br/>POST /requests"] --> RE["C3 Rule Engine<br/>10 ordered rules"]
  PS["C2 Policy Store<br/>hash on ENS, body off-chain"] --> RE
  DS["C8 Decision Store<br/>what she decided before"] --> RE

  RE -->|auto| ST["C6 Settlement<br/>x402 + MultiBaas"]
  RE -->|human| EQ["C4 Escalation Queue<br/>bundle / rank / cap / schedule"]
  RE -->|deny| DR["dropped<br/>with a reason"]

  EQ --> VF["C5 Verification<br/>fresh proof of personhood"]
  VF -->|approved| ST
  EQ -->|deadline passes| DR

  ST --> LG["C7 Ledger"]
  VF --> DS
  DR --> DS
  DS --> RP["C9 Reputation<br/>rejection rate"]
  DS --> PR["C10 Pricing<br/>demand → price"]

  style RE fill:#FFF2CC,stroke:#B37C00,stroke-width:3px
  style EQ fill:#FFF2CC,stroke:#B37C00,stroke-width:3px
```

**C3 and C4 are the product.** Everything else is either a sponsor's layer or bookkeeping.
C10 is out of scope for the hackathon; C8 and C9 ship as a single chart and a single panel.

## 4. Routing — ten ordered rules

**Evaluated top-down. The first match decides.**

```mermaid
flowchart TB
  R["request"] --> R0{"0 — delegate tried to rewrite<br/>the owner's own permissions?"}
  R0 -->|yes| D["deny"]
  R0 -->|no| R1{"1 — revoked?"}
  R1 -->|yes| D
  R1 -->|no| R2{"2 — forbidden category?"}
  R2 -->|yes| D
  R2 -->|no| R3{"3 — grant expired?"}
  R3 -->|yes| D
  R3 -->|no| R4{"4 — payment source failed screening?"}
  R4 -->|yes| D
  R4 -->|no| R5{"5 — sensitive domain?"}
  R5 -->|yes| H["human"]
  R5 -->|no| R6{"6 — above the amount threshold?"}
  R6 -->|yes| H
  R6 -->|no| R7{"7 — first time seeing this party?"}
  R7 -->|yes| H
  R7 -->|no| R8{"8 — matches the allow list?"}
  R8 -->|yes| A["auto"]
  R8 -->|no| H

  style D fill:#FFE2E2,stroke:#C94141,stroke-width:2px
  style H fill:#FFF2CC,stroke:#B37C00,stroke-width:2px
  style A fill:#DCF5DF,stroke:#2E8B44,stroke-width:2px
  style R0 fill:#EDE6FF,stroke:#9B7BF0,stroke-width:3px
```

Two things are worth noticing.

**Rule 0 is on a different axis from the rest.** Rules 1–9 judge a request arriving from
outside. Rule 0 judges the delegate on the inside. Handing work to an AI and letting an AI
widen its own authority are different events, and only the second one is an attack.

**Rule 9 — "nothing matched" — falls to `human`, never to `auto`.** A system that routes the
unknown to `auto` is a system nobody can explain after an incident.

### Which of these are actually new

Ten rules are too many to narrate in four minutes. Three of them are new to the agent economy;
the rest are ordinary access control and would work the same way in a web2 product.

| The shift | Rules |
|---|---|
| **"I stopped" does not propagate.** A person says it once and is done. **Agents keep arriving, unaware** | 0, 1, 3 |
| **First-time counterparties never stop arriving.** A person meets a few strangers a year; **new agents are born daily** | 7, 9 |
| **You must decide in advance what silence means.** People sleep. Agents cannot wait | defaults (§5) |

## 5. Failure — everything falls to `deny`

```mermaid
flowchart LR
  subgraph F["what broke"]
    F1["rule engine down"]
    F2["screening API down"]
    F3["identity check fails"]
    F4["person does not answer<br/>before the deadline"]
    F5["settlement fails after approval"]
  end
  F1 --> D["deny"]
  F2 --> D
  F3 --> D
  F4 --> D
  F5 --> RB["not settled<br/>grant not consumed<br/>agent told why"]
  style D fill:#FFE2E2,stroke:#C94141,stroke-width:3px
```

**There is no path that fails open.** This is the answer to the hardest question a judge can
ask — *what happens when your service is down?* — and it is the same answer every time.

**Silence is not consent.** A signal that cannot distinguish "quiet" from "dead" is not a signal.

## 6. Permission boundary — what ENSv2 is for here

**We do not claim that revocation is unique to ENSv2.** Comparable arrangements exist in v1.
The claim is narrower, and it is the one that matters when an AI holds the keyboard:

> **You can delegate to an AI without letting the AI rewrite what it is allowed to do.**

| Actor | May | May not |
|---|---|---|
| Owner's admin account | Update policy; grant and revoke delegation | — |
| **Delegate agent** | **Update the proposal key only** | **Update permission keys or the payout address** |
| Buyer agent | Read the published terms | Write anything |

```mermaid
flowchart LR
  OWN["owner<br/>admin"] -->|grants, revokes| DEL["delegate agent"]
  DEL -->|"write: proposal key"| OK["accepted"]
  DEL -->|"write: permission key"| NO["rejected by the contract"]
  DEL -->|"write: payout address"| NO
  OWN -->|revoke delegation| GONE["even proposals stop"]
  style NO fill:#FFE2E2,stroke:#C94141,stroke-width:2px
  style OK fill:#DCF5DF,stroke:#2E8B44
```

**Rejected by the contract, not by our server.** A third party can verify the boundary
without trusting us — which is also the demo.

⚠️ Key permissions on a permissioned resolver apply across **every name in that instance**.
Independent sellers must be scoped, never pooled into one resolver without isolation.

## 7. One night, end to end

```mermaid
sequenceDiagram
  autonumber
  participant B as Buyer agents
  participant Y as Yohaku (L3)
  participant E as ENS (L2)
  participant S as Settlement (L4)
  participant P as Seller (asleep)
  participant W as World ID (L1)

  Note over B,Y: 02:00 — requests keep arriving (today: ~50)
  B->>Y: request (who / what / purpose / price / deadline)
  Y->>E: read policy hash + grants
  E-->>Y: scope, expiry, delegation state
  Y-->>B: verdict + reason (synchronous, even when held)
  Y->>S: 36 × execute under constraints
  S-->>Y: settled
  Y->>Y: 12 × deny, with reasons
  Y->>Y: 2 × hold, bundled

  Note over P: she is asleep — nothing reaches her
  Note over Y,P: 07:00 — one notification, under her daily cap
  Y->>P: "2 requests need you"
  P->>W: approve → prove personhood, now
  W-->>Y: fresh proof
  Y->>S: execute
  S-->>Y: settled
  Note over Y: the other one is left alone → deadline → deny
  Y->>P: ledger — what arrived overnight
```

**The synchronous verdict on step 4 is the part people miss.** An agent that is left waiting
is an agent that is stuck, so even `human` returns immediately: *held, deadline at T*.

## 8. Data flow

```mermaid
flowchart LR
  RQ["Request<br/>5 fields"] --> VD["Verdict<br/>decision + reason"]
  PO["Policy<br/>categories, threshold,<br/>expiry, daily cap"] --> VD
  VD --> AP["Approval<br/>with fresh proof"]
  VD --> DRec["DecisionRecord<br/>what was decided, and why"]
  AP --> PM["Payment<br/>tx hash"]
  PM --> LD["Ledger"]
  DRec --> LD
  DRec --> RS["ReputationSignal<br/>rejection rate per agent"]
  DRec -.->|"feeds back"| VD
  style DRec fill:#EDE6FF,stroke:#9B7BF0,stroke-width:2px
```

**The dotted line is the flywheel.** Past decisions become inputs to future routing, which is
why escalations fall over time. What accumulates is *a record of when a human said no* —
the one thing that cannot be synthesised.

## 9. State machines

Three separate lifecycles. **Keeping them apart is what keeps the implementation honest.**

### 9-1. Request

```mermaid
stateDiagram-v2
  [*] --> received
  received --> evaluating
  evaluating --> auto: rule 8
  evaluating --> held: rules 5,6,7,9
  evaluating --> denied: rules 0-4
  auto --> settling
  settling --> settled
  settling --> failed: settlement error
  held --> bundled
  bundled --> surfaced: at the notification hour, within the daily cap
  surfaced --> approved
  surfaced --> denied: deadline passes
  approved --> settling
  settled --> [*]
  denied --> [*]
  failed --> [*]
```

### 9-2. Grant

```mermaid
stateDiagram-v2
  [*] --> none
  none --> granted
  granted --> active
  active --> expired: term ends
  active --> revoked: owner revokes
  expired --> [*]
  revoked --> [*]
```

### 9-3. Delegation

```mermaid
stateDiagram-v2
  [*] --> none
  none --> delegated: proposal key only
  delegated --> delegated: proposes (accepted)
  delegated --> delegated: attempts to widen rights (rejected on-chain)
  delegated --> revoked: owner revokes
  revoked --> [*]
```

## 10. Screens

```mermaid
flowchart LR
  S1["1 Policy<br/>set once"] --> S2["2 Morning inbox<br/>bundled, top 3"]
  S2 --> S3["3 Ledger<br/>what happened overnight"]
  S4["4 Agent side<br/>submit a request, see the verdict"] -.->|"what a judge touches"| S2
  style S2 fill:#FFF2CC,stroke:#B37C00,stroke-width:3px
  style S4 fill:#CFEBFA,stroke:#1A73C4,stroke-width:3px
```

**Screen 4 is the one that wins the booth.** Judging happens one person at a time; asking a
judge to type *"give me her health data"* lets them draw `human` with their own hands.

## 11. Where each sponsor lands

| Sponsor | Layer | The moment it shows up in the demo |
|---|---|---|
| **World** | L1 | **Approving at 07:00 triggers a fresh verification**, and the ignored request shows the **denied path where the protected action does not occur** |
| **ENS** | L2 | **A delegate's write to a permission key is rejected on-chain**, and anyone can check it in the ENS app |
| **Curvegrid** | L4, L5 | **36 settlements execute inside the owner's constraints**, and the morning ledger shows what needs attention |
| *(intercepta — alternative)* | inside rule 4 | A payment is screened **before signing**, and the result decides what happens next |

---

## 12. What is deliberately not here

| | Why |
|---|---|
| Dynamic pricing (C10) | Strong, but the night works without it |
| Delivery of the purchased data | Mocked — not the subject |
| Multi-category policies | One category (purchase intent) for 36 hours |
| Reputation API | One panel in the UI; the API is roadmap |
| ER diagram, deployment topology | A table covers it until the implementation settles |

*Numbers referenced here are demo values. Their basis is recorded in [ASSUMPTIONS.md](ASSUMPTIONS.md).*
