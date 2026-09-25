# ENSv2 spike — what is already standing, and what is left

**The claim we are making is narrow:** a delegated agent can propose, and cannot rewrite what
it is allowed to do. Not "revocation is new" — that is false, and saying it would cost us the
room. See [ENSV2-DIFFERENTIATION.md](ENSV2-DIFFERENTIATION.md).

---

## Already done (runs offline, no keys, no gas)

```bash
npm test          # 59 tests, 13 of them on the permission boundary
```

| | |
|---|---|
| `src/ports/permissions.ts` | Role bits, key→resource derivation, the port interface, an in-memory resolver with the **same refusal semantics**, and the exact calls planned against Sepolia |
| `src/ports/permissions.test.ts` | **The delegate writes `yh:proposal` and is refused on `yh:policy` / `yh:payout` / `yh:price` / `yh:license`.** Revoking the delegation stops proposals too |
| — | And the part that matters: **what the resolver refuses, `route()` denies at rule 0** — the two are tested against each other |

**So the whole flow already runs.** What is missing is the chain underneath it.

## Why per-key permissions work at all

From the ENSv2 docs:

> *"The same role bit granted at different resources yields independent permissions, which is
> how a single `ROLE_SET_TEXT` bit can be restricted to one specific key."*

For a text key the resource is `keccak256(bytes(key))`:

```
yh:proposal → 0xa2019504f332dc97edb538b8bc1f8e47debaf01976eaa027df67bf34ea3f546a
yh:policy   → 0xb27a895adcbf565bbbc4478618795cfe8a2e4dc3fc8d3e7f5c289e7054221582
```

Grant `ROLE_SET_TEXT` (`1 << 4`) on the first resource and withhold it on the second, and the
delegate can write one key and not the other. **That is the entire mechanism.**

## ⚠️ Four things we have NOT confirmed

**Ask these at the ENS booth before writing any chain code.** Every one of them can waste an
hour if guessed wrong.

1. **Current Sepolia addresses** for the registry and the permissioned resolver.
   Contracts were **redeployed 2026-09-15** — every article is stale
2. **Is `ROLE_SET_TEXT` still `1 << 4`** in the deployed version?
3. **Per-key grants:** `grantSetterRoles(bytes setter, address account)` or plain
   `grantRoles(resource, roleBitmap, account)`? The docs show both; we do not know which one
   a per-key grant actually goes through
4. **Resolver scoping.** Key permissions apply to **every name on the instance**, so
   independent sellers must not share one. What is the recommended way to isolate them?

## The spike itself — timebox 90 minutes

**Two accounts. No UI, no volume, no hierarchy.** Done when all four hold:

- [ ] Alice's name resolves, with a permissioned resolver she controls
- [ ] The delegate is granted `ROLE_SET_TEXT` **on `keccak256("yh:proposal")` only**
- [ ] `setText(name, "yh:proposal", …)` from the delegate **succeeds**;
      `setText(name, "yh:policy", …)` from the same account **reverts**
- [ ] `revokeRoles(...)` from Alice, and the proposal write **now reverts too**

Then swap `MockPermissions` for a viem-backed implementation of the same `PermissionsPort`.
**Nothing above `route()` changes** — that is what the port is for.

### Bring these before starting

- Sepolia ETH on two accounts
- **Mock USDC or DAI** — ENSv2 registration is **not** paid in ETH
- Node 22 (24 warns under Hardhat)
- Alchemy or Infura key; a public RPC will rate-limit

## If it does not land

**Stop at 90 minutes.** The decision is already written down
([ENS-VS-INTERCEPTA.md](ENS-VS-INTERCEPTA.md) §7): if the loop does not close and intercepta
has a key ready, switch. If neither lands, **drop the third slot and finish the product** —
a submission that works beats a third prize box that does not.

**The mock keeps working either way.** The console still demonstrates the boundary; we would
simply say, out loud, that it is enforced in our layer and not yet on chain. **Saying that is
cheaper than being caught not saying it.**
