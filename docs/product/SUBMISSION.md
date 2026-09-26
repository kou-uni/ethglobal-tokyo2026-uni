# Submission copy — review against the deployed instance

Prepared 2026-09-26. This file is a draft for submission fields; nothing has been submitted.
Before pasting, select the World mode actually available on the live demo and add its URL.
See [prize readiness](../build/PRIZE-READINESS.md).

## One sentence

Yohaku routes incoming agent requests into automatic handling, refusal, or a limited human
queue, with onchain delegation boundaries and human verification before sensitive approvals.

## Short description

Agents can keep asking while people sleep. Yohaku lets a person decide what can happen
automatically, what should never happen, and how much should reach their attention.
Ten ordered rules route each request. An AI helps with ambiguous cases but cannot grant
permission. ENSv2 restricts a delegate to proposal records. World verification gates the
human decision, and x402 provides the payment rail. Our logo's moving shapes represent
both demands and opportunities; the clear centre represents the space a person keeps.

## How it is built

TypeScript and Node's HTTP server power the router and browser experience. ENSv2 contracts on
Ethereum Sepolia enforce limited record permissions. World has two explicitly separated
integrations: the event's Agents OIDC dev flow and an opt-in production IDKit visitor flow.
The latter binds each proof to a browser-owned demo request and validates it on the backend.
x402 v2 settles signed authorizations on Base Sepolia. MultiBaas is not used.

## Evidence

- ENS: six verified transactions show grant, successful proposal, policy refusal,
  revocation, and refusal of a later proposal. See `docs/build/evidence/ens-delegation.json`.
- World IDKit: production Orb proof led to a local request approval at 12:57:56 JST on
  September 26. A separate cancelled attempt remained unapproved. Neither run sent money.
- x402: existing auto and human-approved testnet transfers moved 120 and 4,200 atomic USDC
  units. These were separate from the production IDKit run.
- The traffic and learning charts are seeded simulations, not user research or real revenue.

## World integration debrief

**Trust moment:** approval of an agent's request. Personhood is needed; names, nationality,
and passport details are not. We use the Orb/PoH route and do not collect extra credentials.
We do not claim that personhood proves the requested data was human-authored or accurate.

**First success:** the production proof was verified at 12:46:23 JST; proof-to-approval at
12:57:56 JST. Time from the very start of integration was not instrumented; we do not present
these timestamps as an elapsed-time measurement. The two measured milestones are 11m33s apart.

**Friction:** we initially conflated the Agents OIDC portal and the IDKit Developer Portal.
We also inferred too much from `amr=pop`, then corrected that interpretation against official
guides. Our custom browser bundle initially did not serve the SDK's WASM asset; adding the
asset route fixed our integration. That last issue is our bundling work, not a verified SDK defect.

**Most useful improvement:** a single entry page comparing the two products, their portals,
event development environments, credentials, and full success/failure examples.

## Sponsor fit text

**ENSv2:** a delegate may write a proposal but may not rewrite its permissions. The permission
boundary is enforced by a Sepolia resolver and influences the router, rather than ENS being a
name displayed in the UI.

**Curvegrid AI Agent:** we implement policy-aware agent requests and approval-gated payments.
The schema prevents an AI classification from authorizing a request. MultiBaas is not used;
we provide the decision layer before the payment rail.

**World IDKit:** personhood is verified at the moment a visitor approves their own demo.
A cancelled, expired, mismatched or failed proof cannot approve that request. Successful
production verification and a cancelled browser flow have been demonstrated locally.

**World Agents:** the separate official event dev integration requests verification, validates
its result on the server and gates the protected action. Dev identities are not evidence of
real production personhood. Do not substitute the IDKit clip for this category's dev-flow demo.

## Team and links to fill in the submission UI

- minta — implementation and design — GitHub `mintannn`.
- kou / spark — architecture and infrastructure — GitHub `kou-uni`.
- Code: `https://github.com/kou-uni/ethglobal-tokyo2026-uni`
- Product explanation: `https://kou-uni.github.io/ethglobal-tokyo2026-uni/`
- Live demo candidate: `https://mac-studio.taila649e1.ts.net/try` — verify externally before submission.
- Demo video: not recorded yet; use [PITCH.md](PITCH.md).

## Limits

Production IDKit was merged in PR #7; public deployment is still unconfirmed. Live payment screening,
seller onboarding and personal-content delivery are not implemented. The production-IDKit
and payment rails have not yet been verified together. Repeated demos are permitted;
this is not a one-reward-per-person system.
