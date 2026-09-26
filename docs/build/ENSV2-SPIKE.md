# ENSv2 spike — what is already standing, and what is left

> **2026-09-26 update:** the pinned published SDK differs from the main-branch source
> cited below. Registration payment is not the only remaining uncertainty.
> Read [ENS-SDK-COMPATIBILITY.md](ENS-SDK-COMPATIBILITY.md) before sending transactions.

**The claim we are making is narrow:** a delegated agent can propose, and cannot rewrite what
it is allowed to do. Not "revocation is new" — that is false, and saying it would cost us the
room. See [ENSV2-DIFFERENTIATION.md](../decisions/ENSV2-DIFFERENTIATION.md).

---

## Already done (runs offline, no keys, no gas)

```bash
npm test          # repository tests, 13 of them on the permission boundary
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

## 未確認4点 — 3つ潰れ、1つは設計の答えが出た（2026-09-26 更新）

**ブースを待つ必要はもう無い。** 全部 [../knowledge/ENSV2-ONCHAIN.md](../knowledge/ENSV2-ONCHAIN.md)
に出典つきで置いてある。

| # | 問い | 状態 |
|---|---|---|
| 1 | Sepolia の現アドレス | ✅ **取得済み・`eth_getCode` でデプロイも確認**。ETHRegistry `0x657ea8…`, ETHRegistrar `0xabe76f…`, PermissionedResolverImpl `0x14f09f…` |
| 2 | `ROLE_SET_TEXT` は `1 << 4` か | ✅ **そのとおり**（`contracts-v2` post-audit-2）。ニブル刻み、admin は `<< 128n` |
| 3 | per-key 付与はどの関数か | ⚠️ **想定が違っていた。** `grantSetterRoles` で、**role は渡さない**（setter から決まる）。root 全体は `grantRootRoles` |
| 4 | resolver のスコープ分離 | ✅ **per-name のスコープは存在しない。resolver がアカウント単位**＝売り手1人に resolver 1つが設計上の正解 |

**加えて、自分で viem を書く必要が無くなった。** 公式アクションがある。ただし
**`@ensdomains/ensjs@5.0.0-sepolia-fix.1` だけ**が書き込み側（`./wallet/v2`）を持つ。
`latest` は v2 が無く、`alpha` は読み取りだけ。

**残る壁は1つだけ: 登録の支払い通貨と金額。** ETH では登録できない想定のまま、金額を
確認していない。**着手前にここだけ確かめる。**

## ⚠️ The mock is NOT enough for the ENS prize

The prize page is explicit, and this changes the calculus:

> - *"Project must be **built on ENSv2 (Sepolia)**"*
> - *"Your demo must be **functional and not just include hard-coded values**"*
> - *"a link to a **live demo**"*

**An earlier version of this file said we could keep the mock and simply say so out loud.
That is wrong for the prize.** Saying it out loud remains the right thing to do for honesty —
but a mocked boundary does not qualify for Best Use of ENSv2. **Either it runs on Sepolia,
or this slot is not ours.**

The mock still earns its place: it is what lets the console demonstrate the boundary, and it
is what `route()` is tested against. It just cannot stand in for the chain when the prize
requires the chain.

## If it does not land

**Stop at 90 minutes.** The decision is already written down
([ENS-VS-INTERCEPTA.md](../decisions/ENS-VS-INTERCEPTA.md) §7): if the loop does not close and intercepta
has a key ready, switch. If neither lands, **drop the third slot and finish the product** —
a submission that works beats a third prize box that does not.

**And intercepta keys no longer need the booth.** Free sandbox at **intercepta.io/ethglobal**
— 1,000 requests, keys arrive within hours. **Request one before starting the ENS spike**, so
the fallback is already in hand if the spike stalls.
