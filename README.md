# Noren — an escalation router for the agent economy

**Agents never sleep. People do.** Noren sits between them.

When AI agents start buying information from people 24/7, a human seller cannot answer
every request. Answering all of them by hand does not scale; approving all of them
automatically is not safe. **Noren routes each incoming agent request into `auto`, `human`,
or `deny`** — and controls how much ever reaches the person.

> 52 requests arrived overnight. **She was asked about 2.**

📄 **[docs/CONCEPT.md](docs/CONCEPT.md) — product design (request schema, routing, queue control)**

📄 **[docs/INTERCEPTA.md](docs/INTERCEPTA.md) — seller-side payment screening: evidence, prize requirements, and integration proposal (Japanese; not implemented yet)**

📄 **[docs/ENS-VS-INTERCEPTA.md](docs/ENS-VS-INTERCEPTA.md) — prize-focused comparison from zero implementation, with a recommendation and validation gates (Japanese; decision pending)**

---

## Status

**Built from scratch during ETHGlobal Tokyo 2026 (Sept 25–27).** This repository starts at
the hackathon kickoff. Nothing is carried over from before the event.

🚧 **Work in progress.** Sections marked TODO are not implemented yet. This README is
updated as things actually land — **if it is not checked here, it does not exist.**

- [ ] Permission policy (ENS name space)
- [ ] Routing (`auto` / `human` / `deny`)
- [ ] Human queue control (bundling, ranking, deadline fallback)
- [ ] Fresh human verification at the moment of approval (World ID)
- [ ] Payment execution under constraints (MultiBaas)
- [ ] Morning ledger

## How it is built

TODO — record here how each part was produced (generated, hand-written, number of
iterations). Kept deliberately, so the method stays visible and not just the result.

## Tech

| Layer | What it answers | Using |
|---|---|---|
| **Who** | Is this a real person? | **World ID** |
| **What is allowed** | Scope, expiry, revocation, cascading revocation | **ENSv2** |
| **How much moved** | Execution under constraints, ledger | **Curvegrid MultiBaas** |
| **Payment rail** | Agent pays for what it buys | **x402** |

## MultiBaas usage

TODO — which MultiBaas features are used and what friction they removed.

## Setup

TODO — prerequisites, environment variables, install, run, test.

## Team

| | Role | GitHub |
|---|---|---|
| **minta** | CEO / CTO / CDO — implementation & design lead | [@mintannn](https://github.com/mintannn) |
| **kou (spark)** | CSO / architect — structure, infrastructure, strategy | [@kou-uni](https://github.com/kou-uni) |

TODO — social handles.

## Feedback to sponsors

TODO — time to first success, friction, missing capabilities, top improvement.

## License

[MIT](LICENSE)
