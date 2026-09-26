# Yohaku launch page

Open `../launch.html`. The page works from disk or GitHub Pages without external libraries or
fonts. Japanese and English cover navigation, journey, technology, NEO, prize fit and evidence.
The chosen language survives reload in the URL. Playback starts only when requested, pauses
when the tab is hidden, and respects reduced-motion settings for visual movement.

## Reproduce the replay data

From the repository root, with dependencies installed:

```sh
node --import tsx docs/launch/build.ts
npm run check
```

`build.ts` runs the actual `route`, `surface`, `onDeadline` and seeded-night generator. It writes
`fixtures.js`. The presentation has four illustrative journeys and precomputed attention-cap
results. This is not a live provider result, World proof or payment receipt. Recorded live
operations are linked separately. Source evidence can be read in `../build/evidence/`.

The download feature emits a proposed handoff format marked `simulation: true`, `executable:
false`, `signed: false` and `neoIntegration: false`. It contains no signature, private key,
nullifier, real profile or settlement payload. It is not a NEO API contract or authorization.

## Copy and sources

Main `1778364`, Kou's product / architecture / Curvegrid discussion, actual core and adapters,
and existing evidence informed the page. The user set the customer as the agent and sponsor
priority as Curvegrid → Intercepta → World. See `../build/LAUNCH-PRIZE-MAP.md` for exact official
categories, requirement mapping, technical scope and remaining work.

We do not repeat unsupported market-size, traction or world-first claims from older materials.
The risk-screening input is currently declared; payer binding is an explicit gap. World proves
personhood, not answer truth. NEO is proposed, not connected. The 52→2 display is a generated
night, not observed customer usage. No live backend availability is asserted by this static page.

## Validation

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
