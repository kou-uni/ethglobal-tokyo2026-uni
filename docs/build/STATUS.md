# Status — 2026-09-26

Latest audit: main `05d18d8`, including merged PR #7. This distinguishes code, local execution, and public
operation. Check `/health` on the instance used for judging; this file is not live telemetry.

## Verified work

| Capability | Evidence | Scope |
|---|---|---|
| Ordered rules, queue cap, ledger and simulated learning | `npm run check`, `scripts/verify.ts` | Repeatable synthetic traffic; not observed demand or revenue |
| AI classification limited to ask/drop | `src/ports/classifier.ts`, existing provider tests and run records | Cannot grant `auto`; a server with no provider key still uses a stand-in |
| ENSv2 name registration | [ens-registration.json](evidence/ens-registration.json) | Ethereum Sepolia, `yohaku-minta-2026.eth` |
| ENSv2 delegation boundary | [ens-delegation.json](evidence/ens-delegation.json) | Six verified transactions, including policy refusal and proposal refusal after revocation |
| ENS permission read influences rule 0 | [ens-server.json](evidence/ens-server.json) | Local HTTP with live Sepolia reads; kou also reported public deployment complete in Issue #6 |
| World Agents OIDC flow | [WORLD-SANDBOX](../knowledge/WORLD-SANDBOX.md) | Official event dev environment, not production personhood evidence |
| Production IDKit proof | [world-idkit.json](evidence/world-idkit.json) | 12:46:23 JST, production / 3.0 / orb |
| Production IDKit → visitor approval | [world-idkit-approval.json](evidence/world-idkit-approval.json) | 12:57:56 JST; browser-bound local demo, no payment |
| IDKit cancellation | [world-idkit-cancel.json](evidence/world-idkit-cancel.json) | App cancel button; request remains unapproved. Not a World App rejection |
| x402 automatic payment | [Base Sepolia transaction](https://sepolia.basescan.org/tx/0x79c1e3239ef89cdc1b8a5fc14321093b06504a3c68a24644ba6390caf90393fa) | Previously verified transfer of 120 atomic USDC units |
| x402 held payment | [Base Sepolia transaction](https://sepolia.basescan.org/tx/0x5c79fddfc8d6e6f64c1dd23752fae688a9b94ec5bc770f24fd1c2595b00d1d88) | Previously verified transfer of 4,200 atomic USDC units after the dev-flow approval |

Production IDKit and those x402 payments are **separate runs**. Do not claim the combined
production-IDKit + on-chain settlement has been demonstrated yet.

## Pending

| Work | Owner / next action |
|---|---|
| Public IDKit deployment (PR #7 merged at 13:05:05 JST) | kou: retain the working Agents configuration; follow [WORLD-IDKIT-DEMO](WORLD-IDKIT-DEMO.md) if enabling IDKit |
| Signing-key handoff | Private server configuration only. Never put the key in GitHub, Issue or PR text |
| External judge-device success and cancellation | After deployment, start from `/try` in that browser |
| IDKit + Base Sepolia payment in one run | Only after the no-payment path passes on the public instance |
| Final live demo URL and video | Use [PITCH](../product/PITCH.md); don't substitute static screenshots for the ENS live-demo requirement |
| Live screening, seller signup, actual content delivery | Not implemented; not prerequisites for the current limited demonstration |

A qualified visitor may approve their own browser's demo. This does not authenticate them
as the ENS owner. Repeat visits are allowed; this is not one payment per unique person.

## Current judging materials

- [PRIZE-READINESS](PRIZE-READINESS.md): official requirements against actual work, plus remaining gaps.
- [PITCH](../product/PITCH.md): 60-second script, longer walkthrough, success/cancellation demonstration.
- [SUBMISSION](../product/SUBMISSION.md): English submission copy and integration debrief.
- [FEEDBACK](FEEDBACK.md): sponsor-specific observations.

## Corrections that matter

- `amr=pop` does not establish whether a fresh proof occurred. The observed sandbox result
  was that World App did not open; the previous causal interpretation was unsupported.
- The ENS rejected writes are now real Sepolia transactions, not only a mock.
- A `not-wired` settlement is not revenue. The ledger regression now excludes it from paid
  offer totals. These totals are in the offer currency, not an onchain token-balance reader.
- The seeded night is simulation. “32 settle” in the reproducible fixture is not 32 live transfers.
- MultiBaas is not used. Curvegrid's official categories permit that.

```sh
npm install
npm run check
```

The test runner prints the current count; avoid stale source-line, commit or test counts as
substitutes for a passing run.
