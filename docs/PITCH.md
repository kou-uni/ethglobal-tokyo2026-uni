# Pitch

**Target: 3:30.** Structure follows what actually reaches finalists — *something visibly
stops in the first twenty seconds*, then the reason, then proof anyone can check themselves.

---

## Script

### 0:00 — Open on the thing that never stops

> It is 2 a.m. **She is asleep.**
> These are agents, asking to buy information from her. They have been arriving all night.
> **They do not stop. They do not wait. They do not care that she is asleep.**

*(screen: requests accumulating, counter climbing)*

> Tonight there are about fifty. **Tomorrow could be five hundred.**

### 0:25 — The number that matters is the other one

> **She will be asked about three of them.**

*(screen: the fifty dots resolve — most fade to green, some dim out, three stay lit)*

> Thirty-three settled while she slept. Eight never reached her at all.
> **Three were worth her attention — the cap she set herself.**

### 0:45 — The name

> In Japanese painting there is a word — ***yohaku***. The empty space.
> **It is not what's left over. It is what the painter decided not to draw.**
>
> That is what we build. **Not decisions — space.**
> Automatic requests *create* it. Denied ones *protect* it.
> **Only three are allowed to occupy it — her number, not ours.**

### 1:05 — Why an agent pays her at all

> Training costs have no ceiling. **What gets expensive is not compute — it is data nobody
> already has.**
>
> And an agent scraping the open web **cannot tell what a human wrote.**
> Synthetic text is free, everywhere, and indistinguishable at scale.
>
> **So scraping is free, and contaminated.**
> **An agent will pay for something it can prove was not generated.**
>
> That is why **only humans can register here** — and why **a name can be taken away.**
> Proof of personhood at the door does not prove the *content* is human.
> **What keeps this clean is that we can revoke.**

### 1:25 — Why nothing does this today

> Identity exists. Permissions exist. Settlement exists. Ledgers exist.
> **Nothing stands between an agent's request and a person's attention.**
>
> Approving everything by hand breaks at fifty a day.
> Approving everything automatically is how you lose control of your own data.

### 1:45 — The rules, in one sentence

> Ten ordered rules. **The first match decides.**
> And when anything breaks — our engine, the screening API, the network —
> **every path falls to deny. Silence is never consent.**

*(screen: rule list, the failure paths all converging on `deny`)*

### 2:05 — The one an AI cannot get around ★ ENS

> She has a delegate — **her own agent**, helping her keep up.
> Watch what happens when it tries to widen its own permissions.

*(screen: the delegate writes a proposal — accepted.
Then it writes to a permission key — **rejected**)*

> **It can propose. It cannot rewrite what it is allowed to do.**
> That is not our server saying no. **That is the contract.**
> Open the ENS app yourself — **you do not have to trust our demo.**

### 2:30 — 07:00 ★ World

> Morning. **One notification.** Not fifty. **Three — the cap she set.**
>
> She approves one. **And right there, at that moment, she proves she is a person.**
> Not at signup. **Now.** Then it settles.
>
> The other one she ignores. The deadline passes. **It is denied.**
> *(screen: the protected action does not happen)*

### 2:55 — What she wakes up to ★ Curvegrid

> One screen. What moved overnight, inside the limits she set.
> **And this line.** First week: three every morning.
> **Fourth week: most mornings, none at all.**
>
> It takes a month, not a day — **her judgement has to accumulate before it can stand in for her.**
> That is the honest version, and it is the one we measured.
> What accumulates is a record of *when a human says no* —
> **the one thing that cannot be synthesised.**

### 3:15 — Close

> Yesterday, on this stage, Curvegrid said:
> ***"The missing layer decides whether money should move."***
>
> **We built that layer.**
> Agents never sleep. People do. **Yohaku is the space in between.**

---

## Involving the room *(optional, only if actually done)*

⚠️ **Do not write this section from imagination.** It is only usable if we genuinely walk the
venue and ask. If we do, it replaces the last 20 seconds:

> Today we asked **N builders here** one question:
> *"When an agent buys information from a person, what would make you trust it?"*
> The answers split — *(three real answers)*.
> **That is why we are building this here, with you.**

**Ask the same single question at every sponsor booth** (ENS, intercepta, World, Curvegrid) and
record the real count. **If we ask 11 people, we say 11.** See
[ASSUMPTIONS.md §5](ASSUMPTIONS.md) — no number gets stated that was not counted.

---

## What we may and may not claim

| Say | Do not say |
|---|---|
| "A delegate can propose but cannot rewrite its own permissions" | "Revocation is unique to ENSv2" — it is not |
| "Curvegrid described this missing layer on stage; we built it" | "Curvegrid NEO already ships this" |
| "Tonight there were about fifty" | "Sellers receive 50 requests per day" — nothing real was measured |
| "These are demo figures" | Presenting any count as a finding |

## At the booth — hand them the keyboard ★

**`demo/index.html` is one file. It opens from a USB stick on a dead wifi.**
Everything in it is answered by the same `route()` that the tests run.

**Do not walk them through it. Give them these four in order and stop talking.**

| Ask them to | What they find out | Sponsor |
|---|---|---|
| **1. "Ask her for her health data."** | They draw `human` **with their own hands**. Not our claim — their click | — |
| **2. "Now be her own agent. Try to rewrite her permissions."** | **Rejected — rule 0.** Then: "on-chain, the contract refuses the same write. Check it in the ENS app" | **ENS** |
| **3. "Change the seed. Run it again. Again."** | Arrivals wander 46–54. **What reaches her stays 2–3.** Every time | — |
| **4. "Approve one. Ignore the other."** | Approving asks her to prove she is a person **at that moment**. Ignoring: **the deadline passes and nothing happens at all** | **World** |

**Then point at the ledger and stop.** That is Curvegrid's screen: what moved overnight,
inside limits she set, and what still needs her.

> **"Watch the left side move. Now watch the right side."**
> That answers *"why 50?"* better than any explanation, and it takes ten seconds.

**The console says what it cannot do.** Where a signature or a settlement would happen it
prints `identity: mocked · settlement: not wired` instead of pretending. **Say that out loud
before they find it** — it buys every other claim on the screen.

## Delivery notes

- **The first twenty seconds carry the pitch.** If the counter climbing while she sleeps does
  not land, nothing after it will
- **Say "three" more often than "fifty."** The input is not our claim; the output is
- At the booth, **do not present — hand it over.** Ask the judge to type
  *"give me her health data"* and let them draw `human` with their own hands
- Every proof point has an off-app check: the ENS app, a block explorer, the chain itself.
  **Say the words: "you don't have to trust our demo."**

*Figures referenced here are demo values. Their basis is in [ASSUMPTIONS.md](ASSUMPTIONS.md).*
