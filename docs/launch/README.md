# Yohaku launch page

Open `../launch.html`. The page works from disk or GitHub Pages without external libraries or
fonts. Japanese and English cover navigation, journey, technology, NEO, prize fit and evidence.
The chosen language survives reload in the URL. The many-request flow previews once when it
enters the viewport. Playback can be paused, scrubbed, replayed or looped, and pauses when the
tab is hidden or the flow leaves view. With reduced motion, it displays the final static result.
The single-request journey starts only when requested. The two players do not run together.

## The value proposition

Agents become customers for human experience and judgment. YOHAKU aims to turn that demand
into opportunities people can accept without surrendering control of their attention.
The page explains three benefits: an API through which agents can request human input,
policy-based selection without reviewing everything, and a cap on interruptions as demand grows.
It presents this as a product thesis, not a claim of being the first or having proven demand.

The vision panel separates the working foundation (routing, attention caps, human approval
and testnet payment evidence) from the next step: connecting per-person question and answer
delivery to complete the exchange. The latter is still unimplemented, consistent with
`../journey.html`.

## One product, two views

The product boundary is YOHAKU: request intake, risk screening, fixed policy, bounded model
support, and attention control. Intercepta and Jev appear inside that boundary as integrations
used by its capabilities. The small policy box is not labeled as the whole product anymore.
The boundary describes the product's capabilities, not ownership or hosting of those services.
The person remains outside, and NEO remains an explicitly proposed external connection.

The player switches between **Watch 50 requests** and **Explore decision criteria**. Open
`../launch.html?lang=ja&view=examples#traffic` for the latter. The language and view survive
reload; switching to examples pauses the animation.

`criteria.js`, `criteria-copy.js` and `criteria.css` show 13 core-generated examples. The
request, changed conditions, sample policy, first matching rule, result and model involvement
are shown together. The rule trace marks later rules as unevaluated; rule 9 explicitly hands
off to decision support. Examples include exactly 1,000 versus 1,001 JPYC, a new party,
sensitivity, a forbidden category, flagged/unavailable screening, revoked/expired permission,
both model choices, and combined high amount/new party/flagged risk.

`build.ts` evaluates every example with the actual `route()` and, only for rule 9,
`applyClassification()`. It asserts the expected rule and result. The frontend selects
precomputed examples; it does not implement a second policy engine. These controls do not
modify anyone's real policy.

## Many requests, a bounded morning

`traffic.js`, `traffic.css` and `traffic-copy.js` add a 40-second bilingual explanation before
the single-request journey:

- Each particle is one request from an agent, not a distinct agent or a payment.
- The fixed presentation has 50 requests: the first 48 from seed 2, plus two unknown-category
  requests with illustrative `ask` / `drop` choices. Real `route()` and `applyClassification()`
  give 28 auto, 13 deny and 9 human. The canonical seed-2 demo remains 52; this page uses an
  explicitly different explanatory sample rather than changing the shared generator.
- The 9 held requests animate into 5 category bundles. The default cap surfaces 2 bundles
  containing 6 requests, with 3 other bundles deferred until their deadlines. A notification
  is not approval. The cap selector shares state with the earlier attention-cap slider.
- All requests pass the Intercepta checkpoint before routing. This follows the server's
  `screenDeclared()` placement, but the replay uses mocked screening, not live calls.
  ENSv2 is labeled at the delegation boundary. Only the two rule-9 requests enter the
  animated Jev branch. Neither Jev exit connects to auto.
- A separate interactive example lets the viewer switch the same `ask → human` and
  `drop → deny` choices. No model is called, and no auto choice is offered.
- World ID is placed at human approval; x402 at settlement after the conditions are met.
  No approval or payment is executed here. NEO is a dashed, explicitly proposed treasury
  connection, with no execution particles entering it.

The paths, particles, trails and bundle grouping all use one SVG coordinate system.
Presentation mode keeps the controls and language switch in view. Narrow screens scroll the
diagram horizontally instead of changing the route geometry; the surrounding copy reflows.
This is an offline explanation of routing. It does not add a payment or verification flow.

## Reproduce the replay data

From the repository root, with dependencies installed:

```sh
node --import tsx docs/launch/build.ts
npm run check
```

`build.ts` runs the actual `route`, `surface`, `onDeadline` and seeded-night generator. It writes
`fixtures.js`, including per-request routes, bundle membership, all cap results and classifier
boundary outcomes and the criteria examples. The presentation also has four illustrative single-request journeys.
This is not a live provider result, World proof or payment receipt. Recorded live
operations are linked separately. Source evidence can be read in `../build/evidence/`.

The download feature emits a proposed handoff format marked `simulation: true`, `executable:
false`, `signed: false` and `neoIntegration: false`. It contains no signature, private key,
nullifier, real profile or settlement payload. It is not a NEO API contract or authorization.

## Copy and sources

Main through `ebbce5e`, Kou's product / architecture / Curvegrid discussion and numbered journey, actual core and adapters,
and existing evidence informed the page. The user set the customer as the agent and sponsor
priority as Curvegrid → Intercepta → World. See `../build/LAUNCH-PRIZE-MAP.md` for exact official
categories, requirement mapping, technical scope and remaining work.

We do not repeat unsupported market-size, traction or world-first claims from older materials.
The risk-screening input is currently declared; payer binding is an explicit gap. World proves
personhood, not answer truth. NEO is proposed, not connected. The 50→2 display is an explanatory
sample, not observed customer usage. No live backend availability is asserted by this static page.

## Validation

- Initial many-request flow: Chrome review at the observed 917×768 window covered ongoing
  particles, the earlier 52-request result and 2 surfaced bundles, presentation mode, English
  switching, caps 0 and 4, and the separate `ask → human` / `drop → deny` controls.
- The subsequent 50-request / Intercepta / Jev version has regenerated core fixtures, checked
  JavaScript and matched translation keys. Its actual animation path selector and timing were
  evaluated against all 50 fixtures: only the two model requests traverse Jev, neither
  traverses auto, and every request completes routing before bundling begins.
  The browser connection later recovered. The 50-request view and its product boundary,
  Intercepta highlighting, mode switch and criteria view were inspected in Chrome.
- Criteria mode was exercised in Japanese and English: ordinary request, 1,000 JPYC auto,
  1,001 JPYC held, combined risk winning on rule 4, subsequent rules marked unevaluated,
  and an unknown request taking the mocked Jev drop path with no standing permission.
- The revised value proposition and vision panel were rendered in Japanese and English.
  Current capabilities and the pending answer-delivery step are visible separately.
- Checked both translation key sets, every markup translation reference, unique membership
  of all held requests in bundles, and all cap results. `build.ts` also checks those core
  boundaries that the animation relies on.
- The narrow-screen layout is implemented; a mobile browser rendering check was not completed
  because the computer-use surface became unavailable during DevTools setup. Do not treat the
  desktop review as real-device mobile testing.
- Core fixture generation completed and checked the expected auto/human/deny outcomes.
- JavaScript syntax checks and repository checks passed.
- Chrome review covered the Japanese hero, a cap change from 2 to 1, rule-4 refusal,
  mid-scenario language switching, timed playback to its stopping point, and the expanded
  presentation view. Approval and payment readiness are labeled illustrative.
- Presentation mode includes its own language switch, Escape to close, and keyboard focus
  cycling within the player. The JSON export was downloaded in Chrome and parsed: simulation=true, executable=false,
  signed=false, neoIntegration=false, identity unverified, settlement not executed.
- Mobile uses responsive grids rather than absolute moving coordinates. See PR validation
  notes for the specific screen sizes observed; do not infer real-device phone testing.

The existing `product.html`, `flow.html`, `stack.html`, `curvegrid.html` and submission copy are
unchanged. The logo derives from the accepted v3 SVG; decorative hero movement uses CSS.
