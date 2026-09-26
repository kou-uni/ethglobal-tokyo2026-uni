# Public demo handoff — 2026-09-26

Current audit based on main `fcce626` and the observed public deployment. This supersedes the
rollout status in `DEMO-REMAINING.md`; that older document is retained as history.

## What is confirmed

- PR #10 is merged. Public `/health` reports `identityMode=idkit-production-visitor-demo`
  and `koeRegistration=true`; the registration page returns HTTP 200.
- Routing, classifier, settlement and ENS delegation reader are configured. Screening is false.
  Health is configuration evidence, not proof of successful authorization, payment or screening.
- Real **Koe registration on the local server** succeeded with production World, protocol 3.0,
  Orb at **14:24:39 JST**. Chrome showed the listed profile, and the local JSON feed independently
  contained its matching verification summary. See `evidence/koe-registration-local.json`.
  This is the local app/RP, not the separately registered public app/RP. No payment occurred.
- Earlier local Yohaku proof-to-approval and cancellation evidence, ENS delegation transactions,
  and the two x402 testnet transfers remain separate evidence. They do not establish a new
  public production-IDKit-plus-payment run.

- Public Koe registration also succeeded at **14:36:56 JST**, production protocol 3.0 / Orb.
  The public registration page, public JSON feed and GitHub Pages participant card were all
  checked. See `evidence/koe-registration-public.json`. No payment occurred.
- Public Yohaku approval **and payment in the same run** succeeded at **14:43:04 JST**:
  request `try-e30e5ea1`, production World / protocol 3.0 / Orb, followed by a successful
  Base Sepolia transaction. An independent RPC receipt confirmed the configured USDC asset's
  Transfer event sent **4,200 atomic units (0.0042 testnet USDC)** to the participant's receiver.
  See `evidence/world-public-payment.json`. No personal answer was delivered.
- PR #12 is merged and enabled publicly. An observed `/fees` response reported 9 unsigned
  vouchers, zero signed authorizations, zero redeemed and `broadcast=false`. This is accounting,
  not revenue. Counts are point-in-time observations.

## Fixed here

The `/try` page previously claimed the quoted 4,200 JPYC would arrive in the wallet.
It now distinguishes demo pricing from scaled token settlement; the World approval page
shows the actual held amount in atomic units, asset, network and receiver before approval.
This display fix needs deployment; the successful run above used the previous wording.

The public health response lacked `Access-Control-Allow-Origin`, while `product.html` fetched
it from GitHub Pages. A browser could report the service as down even when direct HTTP returned
200. The fix grants anonymous cross-origin reads **only to GET /health**, without credentials
or cookies, and prevents caching. Write routes and identity origin/browser checks are unchanged.
The page now distinguishes an unreadable status from a server known to be down.

`try-it.html` walks through discovery → simulated routing → a fresh visitor-owned approval →
cancellation. Both Koe and the product page link to it. Koe's top notice explicitly identifies
it as a supporting discovery demo, not the submitted product.

## Remaining, in order

| Task | Status / finish condition |
| --- | --- |
| Public Koe registration | **Confirmed** with public app/RP, JSON feed and GitHub Pages participant card. |
| Real-device removal/cancellation | Not yet observed for the new Koe registration. Keep the original browser. Removal deletes its temporary listing; do not claim it reverses copies already read by others. |
| Public visitor approval with production World | **Confirmed**, in the paid run below. A Koe listing does not authorize this different operation. |
| Public proof plus testnet payment | **Confirmed** with production Orb proof, approved request, successful receipt and matching USDC Transfer event to the participant. |
| Cancellation alternative | New request, app Cancel verification, confirm still unapproved. This is distinct from rejection inside World App. |
| PR #12 routing fees | **Merged and enabled publicly.** Unsigned vouchers observed in `/fees`; C/collection remains unimplemented. No fee collected. |
| This handoff/CORS PR | Merge and restart backend for the header fix; Pages deploys the static guide. Confirm `/health` has the CORS header and the product status renders. |

Kou owns public deployment, filming and submission copy. This PR does not edit the pitch or
create another personal router/marketplace implementation. The user performs World App actions.

## Presentation boundary

- **Yohaku:** submitted routing product. **Koe:** discovery demonstrator with working personhood
  registration. “Mock network” does not mean its World proof verifier is mocked.
- All participants currently share a demo router. Selecting one does not deliver an individual
  question to that person; no personal answer is delivered to the buyer.
- The night is seeded simulation. Its queue is not populated from the visitor's Koe registration.
- World proves personhood, not truth, authorship, ownership of the ENS name or one profile per human.
- Monetary amounts in the receipts are atomic testnet USDC units, not whole USDC or yen.
- Personal provisioning, answer delivery, persistent accounts, fee redemption and live compliance
  screening are outside this demo. They are not prerequisites for presenting the existing boundary.

Public observations: `evidence/public-rollout.json`. No raw proof, nullifier or browser cookie
is committed. Avoid restarts during an active World attempt: requests and listings live in memory.
