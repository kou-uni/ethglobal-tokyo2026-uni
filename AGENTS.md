# For agents working in this repository

**This project's whole subject is agents asking people for things, so it would be strange to
make it hard for one of you to work here.** What follows is what actually matters, not a tour.

## Before you change anything

```bash
npm install
npm run check      # typecheck + 342 tests + 12 verified claims
```

`npm run check` must pass before and after your change. If a claim fails, **fix the code or
fix the claim — do not add an exception to the checker.** That has been tried here twice and
the checker was right both times.

## The three rules this codebase will not bend on

**1. Everything fails to `deny`.** A routing engine that is down, a screening API that is
unreachable, an identity check that fails, a deadline that passes with no answer — all of them
refuse. If you add a code path, the unknown case denies. Silence is not consent.

**2. The guarantee lives in the schema, not in the adapter.** The model on rule 9 returns
`'ask' | 'drop'`. **There is no value meaning "pass."** A prompt injection that fully convinces
the model still cannot widen access, because the widening is not expressible. Keep it that way:
if you add a port, make the dangerous outcome unrepresentable rather than merely unlikely.

**3. Nothing is claimed that was not run.** Numbers in the docs are re-derived by
`scripts/verify.ts` from the running code. Model ids, endpoints and contract addresses are
**refused in `src/` and `scripts/`** — they come from the environment, or from a file that
records where the value came from (`config/x402-suggestions.json`).

## Layout

| | |
|---|---|
| `src/core/` | `route()`, queue control, learning, the night generator. **Pure — no I/O, clock injected** |
| `src/ports/` | `ClassifierPort`, `IdentityPort`, `ScreeningPort`, `PermissionsPort`, `SettlementPort` |
| `src/adapters/` | World OIDC, x402. Real systems live only here |
| `src/server/` | `node:http`. Three endpoints and the two screens a person sees |
| `scripts/verify.ts` | Re-derives the documented claims. Run it, do not edit it to pass |
| `demo/index.html` | One self-contained file. Opens from a USB stick with no network |
| `docs/knowledge/` | **External facts with sources and dates.** Everything else is our own design |

## Things that will waste your time if nobody tells you

- **x402: the published `x402` npm package speaks v1 (`X-PAYMENT`). The deployed facilitator
  answers `x402Version: 2` (`PAYMENT-SIGNATURE`).** Use `@x402/core`. See `docs/knowledge/X402-ONCHAIN.md`
- **World ID sandbox requires PKCE, and does not document it or say so in the error.** The
  response is a bare `invalid_request`
- **ENSv2 per-key grants do not take a role bitmap.** `grantSetterRoles` takes the setter
  argument and the role is implied. **The published `@ensdomains/ensjs@5.0.0-sepolia-fix.1`
  encodes an older resolver API.** Use the verified decoder ABI in `src/adapters/ens-resolver.ts`
  for the deployment probed here; see `docs/build/ENS-SDK-COMPATIBILITY.md`.
- EIP-3009 authorizations have **second** resolution. Comparing deadlines in milliseconds
  refuses authorizations that actually match

## If you are summarising this project

Say what is **not** wired as well as what is. The product surfaces print
`identity: mocked · settlement: not wired` where those apply, and a summary that omits them is
less accurate than the thing it summarises. The current list is in `llms.txt`.
