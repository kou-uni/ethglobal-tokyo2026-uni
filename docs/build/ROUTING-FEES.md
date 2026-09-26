# Optional routing fees — Issue #11

2026-09-26. A/B implemented: routing accounting and optional, separately signed fee
authorizations. **No fee collection or broadcast is implemented.**

## Operator configuration

```dotenv
YOHAKU_FEE_ADDRESS=<operator's own fee recipient address>
YOHAKU_FEE_PER_DECISION=1
YOHAKU_FEE_REDEEM_ABOVE=10000
```

An absent fee address disables accounting and all fee offers; `/fees` returns 404. Invalid
addresses or non-positive/non-safe-integer amounts fail startup. Do not use a seller's address
as an intermediary: the existing seller `payTo` is unchanged. The operator must supply the
intended fee recipient; this PR does not invent one or configure the public server.

Each valid `/requests` routing decision records one voucher, regardless of auto/human/deny.
The same request ID and canonical request body on payment retry reuse that voucher. A changed
body is a separate decision. Clients should provide a stable `id`, or reuse the returned `id`
on retry; omitting an ID on every POST creates new requests. `/try` demos, registration,
invalid requests and later approvals do not create additional fee vouchers.

Values are **atomic settlement-token units**, not price units or yen. The default one unit
is an operator-selectable demo rate, not a measured gas cost. `redeemAbove` is a configured
threshold, not a gas oracle. Ledger arithmetic uses BigInt.

With a configured x402 settlement rail, the server can offer an exact fee requirement using
its network/token metadata and the separate fee recipient. Without settlement configuration,
accounting still works but it does not fabricate a payable requirement.

## API and client

`GET /fees` exposes counts and sums only: accrued work (including unsigned vouchers), signed
vouchers, unexpired signed amounts, threshold, and explicit `broadcast: false` / redeemed zero.
It does not return payer addresses, raw signatures, nonces, or individual request content.
Signed does not mean paid or funded. Balances are not checked/reserved; authorizations may
expire or become uncollectible. Memory-only storage is lost on process restart.

The optional **application-defined** extension `yohaku-routing-fee` appears in both the v2
`PAYMENT-REQUIRED` header and JSON body of 402 responses. Human/deny responses advertise it in
their JSON body too. `info` contains an exact `requirement`, reference, fixed nonce, expiry,
optional flag and the header name. This is not a standard x402 fee extension and is **not**
the `batch-settlement` scheme.

An opting-in agent signs a second EIP-3009 `TransferWithAuthorization` for that requirement.
It uses the quoted nonce, which binds it to this request's quote, and an expiry no later than
the quote's `expiresAt`. Send the base64-encoded x402 v2 payment payload in
`YOHAKU-FEE-AUTHORIZATION` on the same request. The original `PAYMENT-SIGNATURE` continues
to authorize only the seller transfer. When sending the original payment, echo the advertised
extensions as required by the v2 extension contract.

The server verifies EIP-712 cryptographically against its own token domain, chain, exact
amount, fee recipient, nonce and validity interval. Mismatches and reused authorizations do
not create extra signed vouchers. Bad/missing fee headers leave the main request's routing
and payment behavior unchanged. There is no fee `/settle` call.

The demo agent is **off by default**:

```dotenv
AGENT_PAY_ROUTING_FEE=true
AGENT_FEE_ADDRESS=<same explicitly approved fee recipient>
AGENT_FEE_MAX_ATOMIC=1
```

It also requires matching `X402_NETWORK`, `X402_ASSET`, `X402_ASSET_NAME`, `X402_ASSET_VERSION`
and the existing agent key. An offer outside that pinned destination, asset, network or cap
is skipped. These flags authorize the second signature; they do not enable collection.
**Running the existing `npm run agent` can still pay the seller**, as before. Do not run it
merely to inspect fees. Tests use a public, unfunded test key and a fake settlement port.

## Why C is deferred

The live `/supported` response advertises v2 `batch-settlement` on Base Sepolia. See
[evidence](evidence/fee-facilitator-supported.json). This is availability metadata, not a
successful commitment or redemption.

The official common specification delegates payload format, backing, replay prevention and
redemption to each network binding. The fetched repository exposed common and Cloudflare
binding documents; it did not establish the EVM binding required to collect on this instance.
A standard EIP-3009 exact authorization cannot simply be relabelled `batch-settlement`.

Therefore this implementation stores separately signed **exact** authorizations and broadcasts
nothing. It neither sends N exact settlements nor claims a one-transaction batch. Implementing
C requires a confirmed binding/rail, fresh checks for funds and expiry, redemption state,
idempotency and handling of uncertain broadcast outcomes. It must not replay seller payments.

Official sources read on 2026-09-26:

- v2 extension envelope: https://github.com/coinbase/x402/blob/main/specs/x402-specification-v2.md
- batch lifecycle and network requirements: https://github.com/coinbase/x402/blob/main/specs/schemes/batch-settlement/batch_settlement.md
- live capabilities: https://x402.org/facilitator/supported

## Validation

The HTTP suite uses real EIP-712 signatures from an unfunded test fixture. It covers all
three verdicts; optional offers; original seller destination; successful fee retention without
settlement; retry deduplication; different request binding; wrong amount/recipient/nonce/signature;
expired/overlong signatures; missing configuration; and explicit client spending limits.
Core tests cover exact large totals and unsigned/signed separation.

No real fee has been paid. Public deployment remains the operator's task.
