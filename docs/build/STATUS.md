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
| Live screening | Delegated to minta with the delivered key — [Issue #14](https://github.com/kou-uni/ethglobal-tokyo2026-uni/issues/14) |
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
| **A decision model on rule 9** | `src/adapters/jev.ts` + 2 LLM adapters | 19 tests, and **called for real**: `claude-opus-5` and `gpt-6-astra`. They disagreed; neither could produce `auto` |
| **Proof of personhood** | `src/ports/identity.ts`, `adapters/world-oidc.ts` | 18 tests. **Issuer discovery fetched live** — `auth_time` and `acr` confirmed available |
| **Payment screening shape** | `src/ports/screening.ts` | 9 tests. `clean` passes; `flagged` and `unavailable` both stop |
| **Claims match the code** | `scripts/verify.ts` | **10** claims re-derived by running the code. **Checked by breaking each one on purpose** |
| **Touchable console** | `demo/index.html` | One file, no server, no CDN. Runs the same `route()` the tests run |
| **World ID, end to end** ⭐ | `src/adapters/world-oidc.ts` | **A person pressed it on a phone and it came back.** Discovery read live, ID token verified against the issuer's JWKS with `jose`, `acr = orb-v3` required, `auth_time` ≤ 120s checked against the server clock. **PKCE turned out to be mandatory and undocumented** — found by probing 8 combinations ([knowledge/WORLD-SANDBOX.md](../knowledge/WORLD-SANDBOX.md)) |
| **The two screens a person sees** | `src/server/pages.ts` | Today's offer count, the one being asked about, and a fold with what was handled without her. Service copy and demo tutorial are **separate surfaces** |
| **Past nights, replayed not typed** | `src/core/history.ts` | 8 tests. Each night runs through the real `route()` + `surface()`. **Across 14 nights arrivals move and what reaches her is the cap, every time** |
| **x402 settlement — money actually moved** ⭐⭐ | `src/ports/settlement.ts`, `src/adapters/x402.ts` | **Two transfers on Base Sepolia, both verified from the chain rather than from the facilitator's word.** `auto`: [`0x79c1e323…`](https://sepolia.basescan.org/tx/0x79c1e3239ef89cdc1b8a5fc14321093b06504a3c68a24644ba6390caf90393fa) — 120 atomic, settled inside the request. Held: [`0x5c79fddf…`](https://sepolia.basescan.org/tx/0x5c79fddfc8d6e6f64c1dd23752fae688a9b94ec5bc770f24fd1c2595b00d1d88) — **4,200 atomic, and it moved only when a person pressed Yes.** Before that press the seller's balance was 120; after it, 4,320. **The buyer's ETH balance is still 0** — 102,844 gas was paid by the facilitator, so "the buyer needs no ETH" is measured, not quoted |
| **The server, on the public internet** | `src/server/` | `POST /requests`, `POST /approvals/:id`, `GET /ledger/:name`, `GET /approve/:id`, `GET /auth/world/callback`. 12 tests, including **HTTP and in-process agreeing about the same night** |

**5,438 lines of source, 156 tests, 55 commits.**

## ❌ Not running

| | Blocked on | Who |
|---|---|---|
| **ENSv2 public app integration** | Registration and all six delegation-proof transactions verified. Local server now uses the registered owner and reads live Sepolia permissions. Left: deploy/configure the public server and run the integrated demo | **minta / spark** — [ENS-DELEGATION-DEMO.md](ENS-DELEGATION-DEMO.md) |
| **World ID: a real app approval** | The sandbox never hands off to World ID app. It answers `amr: ["pop"]` with `auth_time` re-stamped, through Safari, Safari private and Chrome alike, with `prompt=login` **and** `max_age=0` sent. **Production `auth.world.org` exists and has the same shape** — three `.env` values would switch it — but its portal sign-in is gated. **Ask at the booth**; the claim on screen has already been corrected to what we can prove | **spark** — booth |
| **Payment screening, live** | Key delivered 2026-09-26 and handed to minta. Rule 4, its 9 tests and the `/health` flag are already in place; the adapter, the setup page and the two confirmed addresses are not | **minta** — [Issue #14](https://github.com/kou-uni/ethglobal-tokyo2026-uni/issues/14) |


## The one thing that would embarrass us

**Two things, and both are better said first than found.**

**1. `amr: pop`.** World ID answers with a held credential presented freshly, not an approval
in the app — so what the screen can honestly claim is *"a credential only an orb-verified
person holds was presented at that moment"*, and it says exactly that. We asked for more with
`prompt=login` and `max_age=0` and were given this.

**2. The ENSv2 delegate boundary is still against a mock**, and the mock says so. The name,
the resolver and the role bits are on chain; the refusal is not yet.

Everything else on the screen is checkable, and volunteering these two is what buys the rest.

## Next, in order — 2026-09-26 11:40 JST、締切まで約21時間

**ENSの登録・委任境界は実チェーンで検証済み。残るENS作業は公開アプリへの接続です。**

1. **minta / spark — ENSの証拠を取り込み、公開アプリへ接続する。** Issue #5の4件は
   [実証JSON](evidence/ens-delegation.json)で完了。PR #3を取り込み、policy.ownerとENS設定を
   登録名に合わせて、公開デモを一周確認する。追加のfaucet・登録・実証用署名は不要。
2. **spark — ブース巡回。** 各スポンサーに「何を探しているか」を逐語で。World には
   **`amr: pop` の件**を持っていく（再現手順つきの実測なので、これが一番強い）
3. **両方 — 足すのをやめる。** 製品の主張は揃い、金も動いた

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
