# Yohaku — judging script

Updated 2026-09-26 after kou's `67ccee1` and the production IDKit approval result.
Start with Yohaku, as in [the latest diagram](../stack.html). Protocols explain why its
boundaries hold; they are not the opening story.

## 60-second pitch

Use the prepared console and already verified results. A live phone verification is a
separate interaction; do not claim that its network wait fits inside sixty seconds.

| Time | Show | Say |
|---|---|---|
| 0–12s | Incoming requests in the console | “Agents can ask all night. People need room to live. Yohaku routes their requests into automatic handling, refusal, or a small queue for a human.” |
| 12–22s | Seed 2, attention cap | “In this simulation, fifty-two requests arrive. Only two reach her attention. She chooses that limit.” |
| 22–36s | ENS delegation receipts / current rejection | “Her agent can propose changes. It cannot rewrite its permissions. We exercised that boundary on ENSv2 Sepolia, including a rejected write after revocation.” |
| 36–49s | World approval result | “For the choice that needs a human, the backend verifies a World ID proof bound to that request. Our production IDKit demo reached approved. Cancelling leaves the request unapproved.” |
| 49–60s | Logo, empty centre; separate payment receipt if time | “The movement around our logo is demand and opportunity. The space inside is what we protect. Yohaku makes room for the choices only you should make.” |

**Payment caption:** “Separate x402 testnet transfer evidence. Production IDKit + payment
in one run is pending.” Remove that caption only after that combined run actually succeeds.

## 3:30 walkthrough

### 0:00–0:30 — What the person gets

> Agents can send requests faster than a person can answer them.
> Yohaku gives that person a boundary: what can happen automatically, what should be refused,
> and how many decisions should reach them at all.
> Here is a simulated night: fifty-two requests, and two places in her attention queue.

Show the console, then the cap. These are simulated requests, not observed customer traffic.
Do not describe automatic dispositions in this simulation as actual transfers.

### 0:30–1:00 — Why the name matters

> Yohaku means blank space. In our logo, the shapes around the centre keep moving.
> They represent both demands and opportunities.
> The empty centre is deliberate: the person and their agent choose what deserves attention,
> so the person keeps room for everything else.

Show `design/yohaku-v3`. This is our interpretation of our logo, not a historical claim
about Japanese painting or a claim that every opportunity can be monetised.

### 1:00–1:40 — The boundary an agent cannot widen

> Ten ordered rules decide where a request goes. The AI only helps with an ambiguous case.
> Its output can be ask or drop. It cannot grant permission.
> The delegate has a similarly narrow role: it can write a proposal, but not its policy.
> Here is the successful proposal, the rejected policy write, and the rejected proposal
> after revocation on ENSv2 Sepolia.

Show [ENS evidence](../build/evidence/ens-delegation.json) and corresponding explorer links.
The delegate is already revoked. Do not promise a fresh successful proposal without
re-granting rights. The current read-only denial can be demonstrated without another payment.
The prototype reads one configured delegate; it is not a complete agent identity registry.

### 1:40–2:30 — Give the choice to the judge

> Now you are the person. Start your own demo. Look at the request before approving it.
> World ID checks personhood at this trust moment. We do not need your name or passport.
> The server binds the proof to the request and to the browser that started it.
> Another visitor cannot approve your demo.

**IDKit route:** `/try` → Skip → Yes → Approve with World ID → scan QR / phone link.
Let the judge operate World App. Show the validated result.
If live verification takes longer, let it finish; use the prepared evidence for the timed pitch.

**Agents fallback:** use the existing public sandbox route and label it “event dev environment”.
Show IDKit's separate production result as supporting work. Do not claim the sandbox proved
real personhood or that IDKit alone satisfies the Agents category.

### 2:30–3:00 — Show what does not happen

> Start another request and cancel verification. The request is still waiting.
> Cancellation is not an approval. If its deadline passes, it cannot complete.
> A held payment is sent only when an approval passes and a valid payment authorization exists.

The measured cancellation is the app's Cancel verification button, not rejection inside World App.
Show [cancellation evidence](../build/evidence/world-idkit-cancel.json).
Show the existing [x402 transfer evidence](../build/STATUS.md) separately:
120 and 4,200 **atomic units of testnet USDC**, not 120/4,200 USDC or yen.
No personal content is actually delivered to the buyer in this demo.

### 3:00–3:30 — Return to Yohaku

> The ledger shows what happened and what still needs a person.
> We tested the permissions boundary, the human-verification step, and the payment rail.
> Our next integration check is the production World proof and payment together on the public demo.
> Agents keep moving. Yohaku protects the room in which a person decides.

## Booth interaction checklist

1. Open the actual demo to be used; check `/health`. State whether World is IDKit production
   or Agents dev, whether the classifier is live, and whether settlement is configured.
2. Ask the judge to start their own `/try`. Use Skip first, so no funds are needed.
3. Successful World verification → show the server-validated result.
4. New demo → cancel → show it remains unapproved. Never present cancellation as final rejection
   of the whole request; the user may try again before the request deadline.
5. Show ENS receipts and current rejection. Open the explorer, not just our diagram.
6. If funded payment is enabled and the judge wants it, let them enter their own testnet wallet
   and complete the approval. Do not operate their wallet or claim an unobserved payment.

## Claims to keep exact

| Say | Avoid |
|---|---|
| Production IDKit proof led to this local demo approval | The public site already runs that flow |
| Any qualified visitor can approve the demo started in their browser | Any visitor can approve the ENS owner's requests |
| Personhood is checked at the decision boundary | The content is human-written, true, or free from AI |
| ENSv2 gives this delegate access to one record | Revocation itself is unique to ENSv2 |
| MultiBaas is not used; our Curvegrid fit is policy-aware agent payments | MultiBaas executes our transfers |
| The existing x402 testnet transfers were verified separately | The production IDKit + payment run is already proven |
| Cancelled verification leaves the request unapproved | We demonstrated rejection inside World App |

## Sponsor-specific closing line

- **ENS:** “The name carries a permission boundary our agent cannot rewrite.”
- **Curvegrid AI Agent:** “Yohaku decides when an agent's payment needs a human decision.”
- **World IDKit:** “The trust moment is approval, not merely login; failure means no approval.”
- **World Agents:** “In the event dev environment, identity verification gates an agent-requested action.”
