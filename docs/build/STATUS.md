# Status — 2026-09-26

> **ENS update:** the installed `5.0.0-sepolia-fix.1` SDK and the main-branch
> source cited in our research have different permission interfaces and scopes.
> The claim below that only registration payment remains is on hold.
> See [ENS-SDK-COMPATIBILITY.md](ENS-SDK-COMPATIBILITY.md).
> Follow-up: `decodeSetter` succeeded live for all five keys. Registration prices and
> free mock-token minting were also checked; see [ENS-REGISTRATION.md](ENS-REGISTRATION.md).
> Seller resolver deployment, registration, grants and writes remain unexecuted.

**What runs, what does not, and what each of us does next.** Everything marked ✅ was run;
nothing here is inferred from the code looking right.

Reproduce all of it with one command:

```bash
npm install && npm run check      # typecheck + 133 tests + 10 verified claims
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
| **A model on rule 9** | `src/ports/classifier.ts` + 2 adapters | 19 tests, and **called for real**: `claude-opus-5` and `gpt-6-astra`. They disagreed; neither could produce `auto` |
| **Proof of personhood** | `src/ports/identity.ts`, `adapters/world-oidc.ts` | 18 tests. **Issuer discovery fetched live** — `auth_time` and `acr` confirmed available |
| **Payment screening shape** | `src/ports/screening.ts` | 9 tests. `clean` passes; `flagged` and `unavailable` both stop |
| **Claims match the code** | `scripts/verify.ts` | **10** claims re-derived by running the code. **Checked by breaking each one on purpose** |
| **Touchable console** | `demo/index.html` | One file, no server, no CDN. Runs the same `route()` the tests run |
| **World ID, end to end** ⭐ | `src/adapters/world-oidc.ts` | **A person pressed it on a phone and it came back.** Discovery read live, ID token verified against the issuer's JWKS with `jose`, `acr = orb-v3` required, `auth_time` ≤ 120s checked against the server clock. **PKCE turned out to be mandatory and undocumented** — found by probing 8 combinations ([knowledge/WORLD-SANDBOX.md](../knowledge/WORLD-SANDBOX.md)) |
| **The two screens a person sees** | `src/server/pages.ts` | Today's offer count, the one being asked about, and a fold with what was handled without her. Service copy and demo tutorial are **separate surfaces** |
| **Past nights, replayed not typed** | `src/core/history.ts` | 8 tests. Each night runs through the real `route()` + `surface()`. **Across 14 nights arrivals move and what reaches her is the cap, every time** |
| **x402 settlement, against the live facilitator** ⭐ | `src/ports/settlement.ts`, `src/adapters/x402.ts` | 17 tests. **Run for real:** the facilitator confirms `exact` on the configured network at startup, and a signed EIP-3009 authorization is refused with `invalid_exact_evm_insufficient_balance` — meaning **the requirements and the signature were both accepted and only the balance is missing.** Two bugs were found by running it, not by testing it ([knowledge/X402-ONCHAIN.md](../knowledge/X402-ONCHAIN.md) §6) |
| **The server, on the public internet** | `src/server/` | `POST /requests`, `POST /approvals/:id`, `GET /ledger/:name`, `GET /approve/:id`, `GET /auth/world/callback`. 12 tests, including **HTTP and in-process agreeing about the same night** |

**3,960 lines of source, 133 tests, 38 commits.**

## ❌ Not running

| | Blocked on | Who |
|---|---|---|
| **ENSv2 on chain** | ~~Sepolia addresses~~ ~~role bits~~ ~~grant function~~ ~~resolver scoping~~ **all four resolved 9/26** ([knowledge/ENSV2-ONCHAIN.md](../knowledge/ENSV2-ONCHAIN.md)). Left: **testnet USDC/DAI and the registration price**, then the 90-minute spike | **minta / spark** — [ENSV2-SPIKE.md](ENSV2-SPIKE.md) |
| **Payment screening, live** | The API key (requested 2026-09-26, arrives by email) | **spark** — check inbox |
| **Settlement, actually landing** | ~~the protocol~~ ~~the signing~~ ~~the facilitator~~ **all proven**. Left: **testnet USDC in the buyer's wallet** | **minta** — issue #2 |

## The one thing that would embarrass us

**The console says `identity: mocked · settlement: not wired` where those would happen.**
Say it out loud at the booth before a judge finds it. Every other claim on the screen is
checkable, and volunteering the two that are not is what buys them.

## Next, in order — 2026-09-26 08:00 時点、締切まで約25時間

1. **ENSv2 を Sepolia に乗せる。** 未確認4点は潰れた。**着手前に決めるのは1つだけ:
   testnet USDC/DAI をどう手に入れるか**（ENSv2 の登録は ETH では払えない。金額が未確認）。
   付与は `@ensdomains/ensjs@5.0.0-sepolia-fix.1` の `grantResolverRoles`。
   **検証は `hasRoles` でガス無しに読める**
2. **ブース巡回。** 各スポンサーに「何を探しているか」を聞く。気に入ったかではない。
   **この1問が Curvegrid に対する我々の枠組みを丸ごと変えた。**答えは逐語で記録する
3. **intercepta を叩く。** ENS が落ちたときの差し替え先。鍵待ち（kou@texx.io）
4. **足すのをやめる。** 製品の主張は揃っている。足りないのはチェーンの証拠で、
   画面の数ではない

**World は終わった。** 実機で人が押して往復し、`auth_time` が返った。残りは本番 issuer に
するかどうかだけで、sandbox でも賞の要件は満たす。

## What changed today, and why it is written down

Three claims in this repository were wrong and are now corrected in place, with the old
version left visible:

- **"escalations fall 12 → 5 → 2 in a week"** — replaying 30 nights showed the cap binds
  first and nothing moves for two weeks
- **"revocation is unique to ENSv2"** — it is not; the claim is the *delegation boundary*
- **a two-generation-stale model name**, defaulted in code

The first two were caught by measuring. The third now fails `npm run verify`, along with any
hardcoded model id, endpoint or address. **"Remember to check" is not a mechanism.**
