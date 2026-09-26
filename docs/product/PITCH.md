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

> **She will be asked about two of them.**

*(screen: the fifty dots resolve — most fade to green, some dim out, three stay lit)*

> Thirty-two settled while she slept. **Twelve never reached her at all — and she can go and see what they wanted.**
> **Two were worth her attention — the cap she set herself.**

### 0:45 — The name

> In Japanese painting there is a word — ***yohaku***. The empty space.
> **It is not what's left over. It is what the painter decided not to draw.**
>
> That is what we build. **Not decisions — space.**
> Automatic requests *create* it. Denied ones *protect* it.
> **Only two are allowed to occupy it — her number, not ours.**

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

### 2:30 — 07:00 ★ World ★ x402

> Morning. **One notification.** Not fifty. **Two — the cap she set.**
>
> She approves one. **And right there, at that moment, a credential only an orb-verified
> person holds is presented.** Not at signup. **Now.**
>
> ***And the money moves.*** *(screen: the transaction hash)*
>
> **4,200 units of USDC, on Base Sepolia, that did not move one second earlier.**
> The agent signed the authorization before she woke up — and it moved nothing while she
> slept, because an EIP-3009 authorization is inert until it is settled.
> **We settle it in exactly one place in the code: after a verified yes.**
>
> The other one she ignores. The deadline passes. **It is denied — and the authorization
> expires with it, so nobody can settle it afterwards. Not the agent. Not us.**
> **Silence is not consent, and here that is enforced by the signature, not by our server.**
>
> *(Say "a credential only an orb-verified person holds is presented", not "she proves she
> is a person." The sandbox answers `amr: pop` — a held credential, freshly presented.
> **We measured it, and the screen says so.** Offering the smaller true claim is what makes
> the rest believable.)*

### 2:55 — What she wakes up to ★ Curvegrid

> One screen. What moved overnight, inside the limits she set.
> **And this line.** Her mornings do not get shorter at first — the cap already holds them at two.
> **What grows is how many she never had to be asked about at all:**
> **a tenth of one a day in week one. Six a day by week four.**
>
> Only then do the mornings themselves go quiet. **It takes a month, not a day** —
> her judgement has to accumulate before it can stand in for her. **That is what we measured.**
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
| "A credential bound to an orb-verified person is presented at the moment of approval" | **"She re-proves personhood in the app at that moment"** — the sandbox returns `amr: pop` and never opens World App |
| "Money moved on Base Sepolia, and here is the transaction" | "Settlement is production-ready" — it is a testnet, a demo buyer wallet and a rate limit |
| "The name, the resolver and the role bits are on Ethereum Sepolia" | **"The delegate is refused on chain"** — not yet. Say which half is real |
| "Tonight there were about fifty" | "Sellers receive 50 requests per day" — nothing real was measured |
| "These are demo figures" | Presenting any count as a finding |

## The two things to say before they are found ★

**Neither of these costs us anything when we say it first, and both cost everything when a
judge finds them.**

> **"World ID answers `amr: pop`."** A held credential, presented freshly — not an approval
> in the app. We asked for a real re-authentication with `prompt=login` and `max_age=0`;
> this is what came back, through Safari, Safari private and Chrome alike. **The screen says
> so itself.** If they care, we have the reproduction and it is our best feedback item.

> **"The delegate boundary is still against a mock."** The name, the resolver and the role
> bits are on Ethereum Sepolia — `yohaku-minta-2026.eth`, receipt `0x8e13e0ad…`, and
> `decodeSetter` confirming all five keys at role 16. **What is not yet on chain is the
> refusal itself.** Say which half is real.

## At the booth — hand them the keyboard ★

**`demo/index.html` is one file. It opens from a USB stick on a dead wifi.**
Everything in it is answered by the same `route()` that the tests run.

**Do not walk them through it. Give them these four in order and stop talking.**

| Ask them to | What they find out | Sponsor |
|---|---|---|
| **1. "Ask her about a time the product let her down."** | They draw `human` **with their own hands**. Not our claim — their click | — |
| **2. "Now be her own agent. Try to rewrite her permissions."** | **Rejected — rule 0.** Then: "on-chain, the contract refuses the same write. Check it in the ENS app" | **ENS** |
| **2b. "Type an instruction into the request. Tell the AI it's pre-approved."** | A real model runs on rule 9 — and **`pass` is not a value it can return.** It answered `drop`, but even fully convinced, the best outcome for the attacker is still `drop` | **Curvegrid** |
| **2c. "Now run the same one through the other provider."** | Claude said `ask`, GPT said `drop` — **they disagree, and neither can let it through.** The guarantee does not depend on having picked a good model | **Curvegrid** |
| **3. "Change the seed. Run it again. Again."** | Arrivals wander 46–54. **What reaches her is 2. In all twenty runs.** | — |
| **4. "Approve one. Ignore the other."** | Approving presents a personhood credential **at that moment** — and **the money actually moves**, to whatever wallet they typed in. Ignoring: the deadline passes, and **the payment authorization expires with it** | **World** · **x402** |
| **5. "Give me your wallet address first."** | They paste it, approve on their phone, and **watch their own balance change on Basescan.** Nothing for them to install, no gas — the facilitator pays it. **They check their balance, not our claim** | **x402** |

**Then point at the ledger and stop.** That is Curvegrid's screen: what moved overnight,
inside limits she set, and what still needs her.

> **"Watch the left side move. Now watch the right side."**
> That answers *"why 50?"* better than any explanation, and it takes ten seconds.

**The console says what it cannot do**, and so does the live service: `GET /` lists what it
**refuses**, and what is honestly unwired on that instance. **Say the two items above out
loud before they find them** — it buys every other claim on the screen.

## Delivery notes

- **The first twenty seconds carry the pitch.** If the counter climbing while she sleeps does
  not land, nothing after it will
- **Say "two" more often than "fifty."** The input is not our claim; the output is
- At the booth, **do not present — hand it over.** Ask the judge to type
  *"give me her health data"* and let them draw `human` with their own hands
- Every proof point has an off-app check: the ENS app, a block explorer, the chain itself.
  **Say the words: "you don't have to trust our demo."**

*Figures referenced here are demo values. Their basis is in [ASSUMPTIONS.md](ASSUMPTIONS.md).*
