# Status — 2026-09-26

**What runs, what does not, and what each of us does next.** Everything marked ✅ was run;
nothing here is inferred from the code looking right.

Reproduce all of it with one command:

```bash
npm install && npm run check      # typecheck + 107 tests + 9 verified claims
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
| **Claims match the code** | `scripts/verify.ts` | 9 claims re-derived by running the code. **Checked by breaking each one on purpose** |
| **Touchable console** | `demo/index.html` | One file, no server, no CDN. Runs the same `route()` the tests run |
| **The server, on the public internet** | `src/server/` | `POST /requests`, `POST /approvals/:id`, `GET /ledger/:name`, `GET /approve/:id`, `GET /auth/world/callback`. 12 tests, including **HTTP and in-process agreeing about the same night** |

**2,527 lines of source, 107 tests, 32 commits.**

## ❌ Not running

| | Blocked on | Who |
|---|---|---|
| **ENSv2 on chain** | Sepolia addresses, mock USDC, the 90-minute spike | **minta** — [ENSV2-SPIKE.md](ENSV2-SPIKE.md) |
| **World browser round-trip** | ~~HTTPS~~ ✅ live at `https://mac-studio.taila649e1.ts.net`. Left: an OIDC client, which needs a Google sign-in through `/mcp` | **spark** — the sign-in; then I register it |
| **Payment screening, live** | The API key (requested 2026-09-26, arrives by email) | **spark** — check inbox |
| **Settlement** | Deliberately last. Nothing is claimed about it | — |

## The one thing that would embarrass us

**The console says `identity: mocked · settlement: not wired` where those would happen.**
Say it out loud at the booth before a judge finds it. Every other claim on the screen is
checkable, and volunteering the two that are not is what buys them.

## Next, in order

1. **spark — register the OIDC client** (`claude plugin install world-id-sandbox@world-id-demo`),
   get an HTTPS callback up, finish the round-trip. **World is the largest slot and has no
   external dependency left.**
2. **spark — booth round** (ENS re-visit, intercepta, World). Ask each one what they are
   *looking for*, not whether they like it — that single question changed our whole framing
   with Curvegrid
3. **minta — the ENSv2 spike, timeboxed to 90 minutes.** The third prize slot is decided by
   whether it lands
4. **both — stop adding.** The product argument is complete; what is missing is proof on
   chain, not more surface

## What changed today, and why it is written down

Three claims in this repository were wrong and are now corrected in place, with the old
version left visible:

- **"escalations fall 12 → 5 → 2 in a week"** — replaying 30 nights showed the cap binds
  first and nothing moves for two weeks
- **"revocation is unique to ENSv2"** — it is not; the claim is the *delegation boundary*
- **a two-generation-stale model name**, defaulted in code

The first two were caught by measuring. The third now fails `npm run verify`, along with any
hardcoded model id, endpoint or address. **"Remember to check" is not a mechanism.**
