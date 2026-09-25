# Yohaku — an escalation router for the agent economy

> In Japanese painting, *yohaku* — the empty space — is not what's left over.
> **It is what the painter decided not to draw.**

**Agents never sleep. People do.** Yohaku stands in that gap.

When AI agents start buying information from people 24/7, a human seller cannot answer
every request. Answering all of them by hand does not scale; approving all of them
automatically is not safe. **Yohaku routes each incoming agent request into `auto`, `human`,
or `deny`** — and what it produces is not decisions. It is **empty space in someone's day.**

> **Some 50 requests arrived overnight. She saw 2.**

**It is not a way to close the door — it is what makes opening it possible.**

![Architecture overview](docs/assets/overview.svg)

---

## Documents

| | |
|---|---|
| 🎨 **[Yohaku identity v3](design/yohaku-v3/README.md)** | **Selected logo, brand narrative, SVG assets, previews** — *Make room. For being human.* |
| 📄 **[CONCEPT.md](docs/CONCEPT.md)** | **Product design** — request schema, routing, queue control |
| 📐 **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** | **Layers, components, rules, failure paths, state machines, sequence** |
| 📋 **[ASSUMPTIONS.md](docs/ASSUMPTIONS.md)** | **Every number, and where it came from.** Nothing here is a measurement |
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

- [ ] Permission policy (ENS name space)
- [ ] Routing — ten ordered rules (`auto` / `human` / `deny`)
- [ ] Human queue control — bundling, ranking, daily cap, deadline fallback
- [ ] Fresh proof of personhood at the moment of approval
- [ ] Payment execution under the owner's constraints
- [ ] Morning ledger

## How it is built

*To be recorded here as work happens: which parts were generated, which were hand-written,
and how many iterations each took.* Kept deliberately, so that the method stays visible and
not only the result.

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

*Not yet integrated.* Planned use, from [ARCHITECTURE.md §1](docs/ARCHITECTURE.md):

- **Policy-aware execution (L4)** — settle an approved request only inside the owner's
  constraints: spending limit, approved counterparties, required human approval
- **Ledger (L5)** — one morning view of what moved overnight and what still needs attention

This section is rewritten with what was actually used once the integration lands.

## Setup

*Not yet available.* Will cover: prerequisites (Node 22), environment variables, install,
run, and how to reproduce the demo scenario end to end.

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
