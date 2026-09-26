# Agent-customer presentation — 2026-09-26

`../value-map.html` supplements the existing product hub, `stack.html` and `flow.html`.
It now has three views: **concept, alternative technical map, presentation**. Every view has
Japanese and English copy. The previous static Japanese sheet is superseded in this file.

## Positioning, clarified by the user

**The agent is the customer.** The human is the participant whose attention and authority
are protected. Developers and marketplaces are potential collaborators, not additional
customers in this narrative. Operators supply the agent's funds.

Agents hiring people is our future-market thesis, not a claim of established traction.
The closing invitation is to build the MIT-licensed OSS together: connect an agent, add an
adapter, contribute adversarial requests, or describe boundaries people need to preserve.
Fee accounting and optional separate authorizations exist; collection and willingness to pay
remain unvalidated. Personal question/answer delivery is not connected.

## Basis and boundaries

Reviewed main `32300f5` and PR #19 (screening in the diagrams). Existing diagrams are kept for
comparison; this PR does not replace their files or Kou's pitch and submission copy.

- `../product/CONCEPT.md`, `JOURNEY.md`: requests, rules and attention cap.
- `../product/ECONOMICS.md`: separate per-decision fee, not a share of the person's payment.
- `../../src/adapters/jev.ts`: ask/drop outputs, with no option that grants access.
- `evidence/world-public-payment.json`: production Orb proof and payment in one request.
- `evidence/screening-with-settlement.json`: live screening plus settlement on Kou's machine.
  The source is declared input; we do not claim it is cryptographically bound to the payer.
  Screening stopped the service receiving/settling, not the buyer signing beforehand.
- Existing ENS evidence: proposal writes allowed, policy writes refused, revocation enforced.
- `../../LICENSE`: MIT.

World proves personhood, not the truth or authorship of an answer. MultiBaas / NEO are not in
the current payment path. Live public backend availability was not established during the
initial audit: the product page was readable but health returned a TLS connection error.
Dated transaction evidence is distinct from current deployment health.

## Presentation implementation

A single scene state drives captions, highlights and payment status. Seven scenes use fixed
CSS-grid boxes, not moving particles with computed screen coordinates. Each scene lasts eight
seconds in autoplay. Play/pause, back/next, restart and direct scene selection are available.
It stops after the final scene and pauses when the document becomes hidden. Reduced-motion
preferences disable visual transitions; playback starts only at the user's request.

Language switching preserves the view and current scene. Language and view persist in the
URL across reload; a reloaded presentation starts at the first scene. No browser storage,
external font, tracking, identity operation, request creation or payment is used.

## Validation

- `node --check docs/value-map/app.js` succeeded.
- `npm run check` passed before and after the changes.
- Chrome: English map layout, Japanese presentation layout, scene selection, mid-scene
  language switching and autoplay progression from request to settlement were observed.
- The map labels auto/human/deny as request outcomes; only the human branch uses World.
- Presentation desktop layout keeps the caption, diagram, payment state and controls compact;
  narrow screens stack boxes without coordinate-based overlaps. Mobile geometry has not been
  independently measured on a phone.

The logo is copied from the adopted `design/yohaku-v3/mark.svg` into the Pages docs root.
