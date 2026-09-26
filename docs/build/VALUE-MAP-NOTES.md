# Value map — 2026-09-26

`../value-map.html` is a separate Japanese one-pager for explaining who benefits, who might
pay, and how the implementation supports that value. It supplements the existing diagrams;
it does not replace the English product hub, business page or PR #19.

## Basis

Reviewed main `32300f5`, the body of PR #19 (screening in the diagrams), and open Issues #17
and #18. Main now contains the business/cash-flow diagrams and explanation chatbot.
PR #13 and #15 are merged; PR #19 was open when reviewed.

- `../product/CONCEPT.md` and `JOURNEY.md`: buyer / seller problems, routing and attention cap.
- `../product/ECONOMICS.md`: separate per-decision fee; collection remains unimplemented.
- `../../src/adapters/jev.ts`: typed ask/drop outputs, no grant option.
- `evidence/world-public-payment.json`: production Orb proof and paid approval, same request.
- `evidence/screening-with-settlement.json`: actual API verdict plus settlement in Kou's local
  environment. Its scope explicitly says the service stops receiving/settling, not buyer signing.
- Existing ENS delegation evidence and `../stack.html`: key-scoped delegation boundary.

The payment source in the screening evidence is declared input; this page does not claim it
is cryptographically bound to the actual payment signer. World verifies personhood, not truth
or authorship. Customers, willingness to pay and marketplace adoption are hypotheses.

## What this adds

The existing overview explains layers, the stack explains integration evidence, and the
business page explains fees. This sheet joins those into one reading order:

1. Buyer, seller and potential integration partner: problem → benefit.
2. One concrete request through Yohaku to auto / human / deny.
3. Direct payment shown separately from request routing.
4. Each technology attached to a specific boundary and benefit.
5. Business hypothesis and missing implementation, visible without opening a disclosure.

Three illustrative buttons highlight the relevant technologies. They make no network calls
and never create requests, verify identities or send payments.

## Validation and public state

- Opened the public product hub and the local value map in Chrome.
- Visually checked upper and lower layouts and the risky-payment example switch.
- `npm run check` passed before and after the addition.
- Print CSS targets A3 landscape; exact pagination depends on browser print settings.
- The public product hub was readable. Its backend status fetch was unavailable, and a direct
  health request failed with a TLS connection error. Current public backend availability was
  therefore **not confirmed**. This does not invalidate the dated transaction evidence.

The logo is copied from the already adopted `design/yohaku-v3/mark.svg` so the published page
does not depend on a path outside the GitHub Pages `docs/` root.
