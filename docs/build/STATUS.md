# Status — 2026-09-26

Integration update on `minta/integration-audit-20260926`: owner approval, A2A 0.3 intake,
expiry, payment-source binding, persistent request replay protection and daily attention
accounting are implemented and tested. See [the fix report](INTEGRATION-FIXES-2026-09-26.md).
Public deployment of these changes and the new real-owner walkthrough remain separate steps.
The sections below also contain historical deployment evidence.

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
| Live screening **and** settlement in one run | [screening-with-settlement.json](evidence/screening-with-settlement.json) · [Base Sepolia transaction](https://sepolia.basescan.org/tx/0xa6b97b7c07716a8456c9f6b78157366e3ac760f2be3dfbb77b63eedcbb8d0087) | The gap PR #15 recorded as open. A cleared payment source settled 120 atomic USDC; the flagged one was denied on rule 4 in the provider's own words. Receipt read from the chain: status 0x1, gas 85,756 paid by the relayer |

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
| Live screening on the public instance | **Done, with one boundary left.** Public `/health` reported `screening: true` — that is configuration evidence, not a run. The screening-plus-settlement run was exercised locally ([evidence](evidence/screening-with-settlement.json)); `npm run agent -- routine` and `npm run agent -- routine flagged` reproduce both halves on the public host |
| Seller signup, actual content delivery | Not implemented; not prerequisites for the current limited demonstration |

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

---

## ✅ Running

| | Where | Evidence |
|---|---|---|
| **Ten ordered rules** | `src/core/rules.ts` | 24 tests — each rule, the evaluation order, and every failure path landing on `deny` |
| **Human queue control** | `src/core/queue.ts` | 8 tests — bundling, ranking, the daily cap, deadline fallback |
| **Morning ledger** | `src/core/ledger.ts` | used by the console |
| **Learning over a month** | `src/core/decisions.ts`, `week.ts` | 16 tests. 30 nights replayed: the cap binds for two weeks, being spared grows 0.1 → 6.3/day |
| **Delegation boundary** | `src/ports/permissions.ts` | 13 tests. A delegate writes `yh:proposal` and is refused on the permission and payout keys — **and what the resolver refuses, rule 0 denies** |
| **A decision model on rule 9** | `src/adapters/jev.ts` + 2 LLM adapters | 10 tests on the model itself, and **called for real**: `claude-opus-5` and `gpt-6-astra`. They disagreed; neither could produce `auto` |
| **Proof of personhood** | `src/ports/identity.ts`, `adapters/world-oidc.ts` | 27 tests. **Issuer discovery fetched live** — `auth_time` and `acr` confirmed available |
| **Payment screening — a live call decides rule 4** ⭐ | `src/ports/screening.ts`, `src/adapters/intercepta.ts` | 24 tests on the adapter, 11 on the port. `clean` passes; `flagged` and `unavailable` both stop. **Called for real**: an ordinary mainnet wallet clears at `toxicScore 0`, an OFAC-listed exploiter is refused at 100, and a sanctioned *contract* answers 404 — which maps to `unavailable`, never to clean. The refusal shows the provider's own sentence, quoted. Raw bodies in [evidence/intercepta-live.json](evidence/intercepta-live.json) |
| **Claims match the code** | `scripts/verify.ts` | **10** claims re-derived by running the code. **Checked by breaking each one on purpose** |
| **Touchable console** | `demo/index.html` | One file, no server, no CDN. Runs the same `route()` the tests run |
| **World ID, end to end** ⭐ | `src/adapters/world-oidc.ts` | **A person pressed it on a phone and it came back.** Discovery read live, ID token verified against the issuer's JWKS with `jose`, `acr = orb-v3` required, `auth_time` ≤ 120s checked against the server clock. **PKCE turned out to be mandatory and undocumented** — found by probing 8 combinations ([knowledge/WORLD-SANDBOX.md](../knowledge/WORLD-SANDBOX.md)) |
| **The two screens a person sees** | `src/server/pages.ts` | Today's offer count, the one being asked about, and a fold with what was handled without her. Service copy and demo tutorial are **separate surfaces** |
| **Past nights, replayed not typed** | `src/core/history.ts` | 8 tests. Each night runs through the real `route()` + `surface()`. **Across 14 nights arrivals move and what reaches her is the cap, every time** |
| **x402 settlement — money actually moved** ⭐⭐ | `src/ports/settlement.ts`, `src/adapters/x402.ts` | **Two transfers on Base Sepolia, both verified from the chain rather than from the facilitator's word.** `auto`: [`0x79c1e323…`](https://sepolia.basescan.org/tx/0x79c1e3239ef89cdc1b8a5fc14321093b06504a3c68a24644ba6390caf90393fa) — 120 atomic, settled inside the request. Held: [`0x5c79fddf…`](https://sepolia.basescan.org/tx/0x5c79fddfc8d6e6f64c1dd23752fae688a9b94ec5bc770f24fd1c2595b00d1d88) — **4,200 atomic, and it moved only when a person pressed Yes.** Before that press the seller's balance was 120; after it, 4,320. **The buyer's ETH balance is still 0** — 102,844 gas was paid by the facilitator, so "the buyer needs no ETH" is measured, not quoted |
| **The server, on the public internet** | `src/server/` | `POST /requests`, `POST /approvals/:id`, `GET /ledger/:name`, `GET /approve/:id`, `GET /auth/world/callback`. 15 tests, including **HTTP and in-process agreeing about the same night** |

**391 tests across 37 files.** Source lines and commit counts are deliberately not quoted
here: they change with every push, and a number nobody re-derives is a fossil. `npm run check`
prints the live figures, and `npm run verify` now fails if any document quotes a test count the
run did not produce.

## ❌ Not running

| | Blocked on | Who |
|---|---|---|
| **ENSv2 public app integration** | Registration and all six delegation-proof transactions verified. Local server now uses the registered owner and reads live Sepolia permissions. Left: deploy/configure the public server and run the integrated demo | **minta / spark** — [ENS-DELEGATION-DEMO.md](ENS-DELEGATION-DEMO.md) |
| **World ID: an in-app approval in the Agents dev environment** | Production IDKit already reached approved (rows above). What is missing is the dev environment: the sandbox never hands off to World ID app. It answers `amr: ["pop"]` with `auth_time` re-stamped, through Safari, Safari private and Chrome alike, with `prompt=login` **and** `max_age=0` sent. **Production `auth.world.org` exists and has the same shape** — three `.env` values would switch it — but its portal sign-in is gated. **Ask at the booth**; the claim on screen has already been corrected to what we can prove | **spark** — booth |


## The one thing that would embarrass us

**Two things, and both are better said first than found.**

**1. `amr: pop`.** World ID answers with a held credential presented freshly, not an approval
in the app — so what the screen can honestly claim is *"a credential only an orb-verified
person holds was presented at that moment"*, and it says exactly that. We asked for more with
`prompt=login` and `max_age=0` and were given this.

**2. The ENSv2 delegate is revoked, so the boundary can only be shown refusing.** The six
transactions are real — including the refused policy write and the refused proposal after
revocation — but a *fresh successful* proposal would need rights granted again. Offer the
read-only denial, which needs no transaction, and say why the happy path is not live.

**3. Payment screening is not running.** Rule 4 is the one refusal that is not about
permission, it has 9 tests, and it is still answered by a stand-in. The key exists; the
adapter does not.

Everything else on the screen is checkable, and volunteering these two is what buys the rest.

## Next, in order

Submission closes **2026-09-27 09:00 JST**. No countdown is written here, because a countdown
is wrong within the hour and this file is read by people deciding what to do next.

ENS registration and the delegation boundary are verified on chain. The remaining ENS work is
connecting the public app.

1. **minta / spark — connect the public app to the verified ENS evidence.** The four items in
   Issue #5 are settled by [the proof JSON](evidence/ens-delegation.json). Merge PR #3, align
   `policy.owner` and the ENS configuration with the registered name, and walk the public demo
   once. No further faucet, registration or proof transactions are needed.
2. **minta — make rule 4 live.** [Issue #14](https://github.com/kou-uni/ethglobal-tokyo2026-uni/issues/14):
   the key works, `x-api-key` is confirmed, both a clean and a flagged address are confirmed.
   What is left is the adapter and one of the twelve denials becoming a screening refusal.
3. **spark — the booth round.** Ask every sponsor what they are looking for, verbatim. Take the
   `amr: pop` finding to World; it is a measured result with reproduction steps, which makes it
   the strongest thing we have to offer them.
4. **Both — stop adding.** The product claims are complete and the money has moved.

## What changed today, and why it is written down

Three claims in this repository were wrong and are now corrected in place, with the old
version left visible:

- **"escalations fall 12 → 5 → 2 in a week"** — replaying 30 nights showed the cap binds
  first and nothing moves for two weeks
- **"revocation is unique to ENSv2"** — it is not; the claim is the *delegation boundary*
- **a two-generation-stale model name**, defaulted in code

The first two were caught by measuring. The third now fails `npm run verify`, along with any
hardcoded model id, endpoint or address. **"Remember to check" is not a mechanism.**

The test runner prints the current count; avoid stale source-line, commit or test counts as
substitutes for a passing run.
