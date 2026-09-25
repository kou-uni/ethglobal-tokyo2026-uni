# Yohaku — an escalation router for the agent economy

> In Japanese painting, *yohaku* — the empty space — is not what's left over.
> **It is what the painter decided not to draw.**

**Agents never sleep. People do.** Yohaku stands in that gap.

When AI agents start buying information from people 24/7, a human seller cannot answer
every request. Answering all of them by hand does not scale; approving all of them
automatically is not safe. **Yohaku routes each incoming agent request into `auto`, `human`,
or `deny`** — and what it produces is not decisions. It is **empty space in someone's day.**

> **Some fifty requests arrived overnight. She saw two.**

**It is not a way to close the door — it is what makes opening it possible.**

**Where it sits.** An agent that works around the clock spends and earns around the clock.
The question that decides everything is not how much, but **where a person still has to be
involved.** Yohaku is that involvement point — not a wallet, not a treasury dashboard, not
an execution layer. **It decides which of an agent's money movements a human has to see at
all.** See [CONCEPT §0-B](docs/CONCEPT.md).

**Why an agent pays a person at all:** scraping is free and **contaminated** — an agent cannot
tell what a human wrote. So the scarce thing is not information, it is *information provably
from a person*. **Only humans register here, and a name can be revoked** when someone poisons
the well. See [CONCEPT §0](docs/CONCEPT.md).

![Architecture overview](docs/assets/overview.svg)

![Market](docs/assets/market.svg)

---

## Documents

| | |
|---|---|
| 🎨 **[Yohaku identity v3](design/yohaku-v3/README.md)** | **Selected logo, brand narrative, SVG assets, previews** — *Make room. For being human.* |
| 📄 **[CONCEPT.md](docs/CONCEPT.md)** | **Product design** — request schema, routing, queue control |
| 📐 **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** | **Layers, components, rules, failure paths, state machines, sequence** |
| 📈 **[MARKET.md](docs/MARKET.md)** | **Why this is a market** — supply exhaustion, buyer growth, and what an agent saves |
| 📋 **[ASSUMPTIONS.md](docs/ASSUMPTIONS.md)** | **Every number, and where it came from.** Nothing here is a measurement |
| 🔧 **[ENSV2-SPIKE.md](docs/ENSV2-SPIKE.md)** | **What already runs offline, what is unconfirmed, and the 90-minute spike** |
| 🎤 **[PITCH.md](docs/PITCH.md)** | Pitch script |
| 💬 **[FEEDBACK.md](docs/FEEDBACK.md)** | Integration feedback to sponsors *(filled in as we build)* |
| 🔎 [INTERCEPTA.md](docs/INTERCEPTA.md) | Seller-side payment screening: evidence and integration proposal *(JA)* |
| 🔎 [ENS-VS-INTERCEPTA.md](docs/ENS-VS-INTERCEPTA.md) | Prize-focused comparison, recommendation, validation gates *(JA)* |
| 🔎 [ENSV2-DIFFERENTIATION.md](docs/ENSV2-DIFFERENTIATION.md) | Official ENSv2 differentiators and a scoped agent-permissions demo *(JA)* |

---

## Status

**Built from scratch during ETHGlobal Tokyo 2026 (Sept 25–27).** This repository starts at
the hackathon kickoff. Nothing is carried over from before the event.

🚧 **Work in progress.** Unchecked items are not implemented. This README is updated as
things actually land — **if it is not checked here, it does not exist.**

- [x] **Policy model and evaluation** — `src/core/types.ts`
- [x] **Delegation boundary — modelled, mocked and tested** (`src/ports/permissions.ts`, 13 tests)
- [ ] Permission policy written to / read from ENS **on chain** — see [ENSV2-SPIKE.md](docs/ENSV2-SPIKE.md)
- [x] **Routing — ten ordered rules** (`auto` / `human` / `deny`) — `src/core/rules.ts`, 24 tests
- [x] **Human queue control** — bundling, ranking, daily cap, deadline fallback — `src/core/queue.ts`, 8 tests
- [ ] Fresh proof of personhood at the moment of approval
- [ ] Payment execution under the owner's constraints
- [x] **Morning ledger** — `src/core/ledger.ts`, used by the console
- [~] **Model on rule 9** — `src/adapters/claude-classifier.ts`, 11 tests. **Never run against the API yet — no key on this machine**

## How it is built

Kept deliberately, so that the method stays visible and not only the result.

| | |
|---|---|
| `src/core/rules.ts`, `queue.ts` | Written once, then driven by the tests. Pure functions — no I/O, no clock of their own, so a night is reproducible |
| `scripts/seed.ts` | Generates input; **does not decide anything**. Every count in the pitch comes out of `route()` |
| Distribution in ASSUMPTIONS §2 | 20 seeds, run and recorded. Not estimated |
| `docs/assets/overview.svg` | Hand-written SVG, rendered and inspected three times — an arrow was crossing a box, and two labels overlapped |

## Where the model runs, and what it cannot do

One place: **rule 9 — "nothing matched"**. That is the only point where judgement is
genuinely required, so it is the only point a model is consulted.

What it may answer is the whole safeguard:

```ts
type Suggestion = 'ask' | 'drop'
```

**There is no value meaning "let this through."** Not discouraged in a prompt — absent from
the schema. A request's own text is data, never instruction, and **the most a successful
prompt injection can achieve here is getting itself dropped.**

`applyClassification` only ever moves `human` → `deny`, and only on rule 9. It cannot reopen
a deny, cannot touch rules 0–7, and cannot produce `auto`. Tested both ways.

> **The prompt is not the security policy.** The rules are, and the model answers into a
> shape that cannot express permission.

**Either provider runs it.** Whichever key is present is used — Claude or OpenAI — because
the guarantee lives in the schema and in `applyClassification`, not in an adapter. Swapping
the model cannot weaken it, which is the reason there is a port here at all.

```bash
export ANTHROPIC_API_KEY=...   # or OPENAI_API_KEY=...
npm run classify -- "sleep/tracking-logs" 300
```

⚠️ **Not yet run against either API.** Both adapters are written and tested against a mock;
no model has been called from this machine. With no key the CLI says so and uses the mock —
**it never quietly pretends a model ran.**

## Tech

| Layer | What it answers | Using |
|---|---|---|
| **Who** | Is this a real person? | **World ID** |
| **What is allowed** | Scope, expiry, **delegation boundary** | **ENSv2 + EAC** |
| **How much moved** | Execution under constraints, ledger | **Curvegrid MultiBaas** |
| **Payment rail** | An agent pays for what it buys | **x402** |

Stack: Hardhat · Next.js · TypeScript · Vercel · npm.

**What we claim about ENSv2 is narrow**: not that revocation is unique to it, but that
**a delegated agent can propose without being able to rewrite what it is allowed to do.**
See [ARCHITECTURE.md §6](docs/ARCHITECTURE.md).

## MultiBaas usage

**Not used.** Curvegrid state plainly that *"Using our blockchain development platform
MultiBaas is not a requirement to apply for this prize"*, and we confirmed the same directly
with them at the event.

What we built instead sits **before** execution: deciding whether a payment should be put in
front of a person at all. Execution is someone else's layer, and we are not claiming it.

## Setup

```bash
npm install
npm test          # 32 tests — the ten rules, ordering, failure paths, the queue
npm run typecheck
npm run seed -- 18 # one night of requests, run through the real router
```

**`npm run seed -- 18` is the night used in the pitch** — 49 arrive, 33 settle, 8 are dropped,
**2 reach her**. Change the seed and the arrivals wander between 46 and 54; **across all 20 runs,
the number that reaches her is 2. Every time.** That is her cap, not our claim.
See [ASSUMPTIONS.md §2](docs/ASSUMPTIONS.md).

Copy `.env.example` to `.env` before touching chain or sponsor APIs. *(UI and chain
integration not yet wired.)*

## Team

| | Role | GitHub |
|---|---|---|
| **minta** | CEO / CTO / CDO — implementation and design lead | [@mintannn](https://github.com/mintannn) |
| **kou (spark)** | CSO / architect — structure, infrastructure, strategy | [@kou-uni](https://github.com/kou-uni) |

*Social handles to be added before submission.*

## Feedback to sponsors

See **[docs/FEEDBACK.md](docs/FEEDBACK.md)** — time to first success, friction, missing
capabilities, and the single change that would help most, per sponsor SDK.

## License

[MIT](LICENSE)
