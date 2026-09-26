# Koe: the discovery entry for Yohaku

2026-09-26 — Issue #9. Koe is an agent-facing directory sketch, not a second submitted product.
A person describes what they can speak to; an agent discovers that profile through JSON and
sends a request to its router. **Koe never approves or pays. Yohaku makes the routing decision.**

## Implemented

- Six fictional profiles rendered from `directory.json`, with text search and topic filtering.
- An `application/json` alternate link in the page head for discovery without reading the UI.
- Topic selection builds the exact five fields, with prices and purposes from the JSON contract.
- Copyable curl with a fresh 15-minute deadline. Copy does not send a request or money.
- Existing `/try` World approval entry; no duplicate authentication implementation.
- Local assets only, no CDN/fonts/build step. GitHub Pages serves `docs/koe.html` and `docs/koe/*`.
- Explicit load failure, no-results state and clipboard fallback. Profile text is inserted as text,
  never executable HTML; router links require HTTPS and no embedded credentials.

## Agent protocol

Read the directory, select a profile and a category, then POST to `profile.router + /requests`.
The field contract is unchanged. `howToAsk.purposeByTopic` supplies the purpose for each category.
`howToAsk.exampleWho` is a preloaded **demo counterparty**, not proof of an agent's identity.

```sh
curl --fail --silent --show-error \
  'https://kou-uni.github.io/ethglobal-tokyo2026-uni/koe/directory.json'
```

The UI generates a fresh complete curl for each selected topic. A terminal-only example below
requires Node.js and curl. It sends one **unsigned** request; it does not sign a payment.

```sh
koe_deadline=$(node -e 'process.stdout.write(new Date(Date.now()+900000).toISOString())')
curl --include --request POST 'https://mac-studio.taila649e1.ts.net/requests' \
  --header 'Content-Type: application/json' \
  --data-raw "{\"who\":\"market-research.acme.eth\",\"what\":\"experience/why-you-put-it-back\",\"purpose\":\"demand-estimation\",\"price\":{\"amount\":80,\"currency\":\"JPYC\"},\"deadline\":\"$koe_deadline\"}"
```

Read `verdict`, not only the HTTP status:

| Response | Meaning |
| --- | --- |
| `402`, `auto` | Eligible under the standing rules; still needs payment. Not a sale. |
| `202`, `human` | Held for the person. Not approval. |
| `200`, `deny` | Refused. A successful HTTP exchange is not permission. |
| `200`, `auto` | Inspect settlement. A non-live instance can return `not-wired`; that is not payment. |

A refusal must not be retried with payment as though payment overrides policy. A 402 does not
itself authorize spending either: the agent still needs its own spending authorization. JPYC is
the request model currency; this demo's live rail uses testnet USDC. Read returned network,
asset and atomic amount rather than assuming a one-to-one currency conversion.

## Honest scope

All people are fictional and **not verified**. Every profile points to one shared demo router,
with the same standing policy and two bundled notification slots a day. There is no recipient
field selecting a fictional individual, personal router provisioning, content delivery or sale.
The real ENS name was removed from the fictional Alice profile to avoid implying ownership.

A topic list is descriptive, not an authorization. Auto examples assume a known counterparty,
a valid grant, an unexpired request, acceptable screening and a price within the shared threshold.
The server's earlier rules, history and configuration can change the outcome. A cap of two means
notification slots, not a promise that only two raw requests exist.

The World link reuses **Yohaku request approval**, not Koe registration. It does not prove that
someone has registered a profile merely because they opened or returned from that page. Verified
publishing, removal/revocation, storage, accounts and one-person-one-profile are not implemented;
this is stated on the page. No "verification → listing" success is simulated.

The public World app's RP registration is complete; kou still needs to select the public config
and restart. See `../build/WORLD-IDKIT-DEMO.md`. Until that deployment is verified, the live
`/try` mode must be checked on `/health`; a link alone does not prove production IDKit is live.

## Verification

```sh
npm run check
node --check docs/koe/app.js
node --import tsx docs/koe/check.ts
# Optional: sends three unsigned requests to the public demo and updates evidence.json.
node --import tsx docs/koe/check.ts --live
```

- Full project check: 283 tests and 10 claims passed with the public-config change.
- Local real HTTP router: all 33 profile/category combinations matched their advertised branches.
  The script also checks ASKS membership, purposes, policy lists, price thresholds and daily cap.
  Screening is mocked in this local contract check; settlement is not wired.
- Public HTTP: auto/402, human/202 and deny/200 observed; see `evidence.json` with timestamps.
  No payment signature or funds sent. Public screening was unconfigured in health, so these
  observations do not establish live compliance screening.
- Browser: six profiles loaded, coffee search returned Sam alone, topic selection produced Sam's
  category and price, and Copy curl refreshed the deadline and reported success.

This is a routing/discovery demo. Neither the HTTP results nor World personhood prove that
answers are accurate, human-authored or delivered.
