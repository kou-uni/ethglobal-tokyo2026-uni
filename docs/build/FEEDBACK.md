# Integration feedback

**This file is filled in while building, not afterwards.** Each section is written the moment
that integration first works — otherwise the friction is forgotten and the feedback becomes
polite and useless.

> ⚠️ **Nothing below is written in advance.** Empty sections mean that integration has not
> been done yet. They are never filled from imagination.
>
> **World ID is done and written from the actual run.** The others are still empty because
> they have not happened.

**Required by sponsors**

| Sponsor | Requirement |
|---|---|
| **World** | *"Provide integration feedback covering **time to success, friction, missing capabilities, and top improvement**"* — this is part of qualifying, not a nicety |
| **Curvegrid** | README must include *"MultiBaas feedback if applicable"* |

**How to fill each section** — start the clock when you open the docs, stop it when the thing
first works end to end. Write the friction down *before* solving it, in the words you used at
the time. One improvement only: the single change that would have saved the most time.

---

## World ID for Agents

**Integrated:** OIDC authorization-code flow with PKCE, against the sandbox issuer. The
approval step in our product is the high-stakes action, so that is where the verification
runs — `prompt=login` on the request, and `auth_time` + `acr` checked on the returned
`id_token` against our own clock. Token verified through the published JWKS; the client
secret stays server-side and never reaches the browser.

**Time to first success:** about 90 minutes end to end, of which **roughly 40 were spent on
one undocumented requirement** (below). Discovery, adapter, tests and the approval pages
were the fast part.

**Friction, in the order it happened:**

1. **The docs page does not list the endpoints.** `sandbox.auth.world.org/docs` explains the
   model — pairwise `sub`, OIDC federation, RFC 9470 for freshness — but not
   `authorization_endpoint`, `token_endpoint` or the acr value. We got all of it from
   `/.well-known/openid-configuration`, which is the right answer, but the docs could say
   "start here" in one line and save the guessing.

2. **PKCE is mandatory and nothing says so.** Every authorization request without
   `code_challenge` returns `invalid_request` — with no `error_description`. We only found
   it by probing eight parameter combinations against the endpoint:

   ```
   bare / max_age / acr_values / prompt=login   →  invalid_request
   + code_challenge + code_challenge_method     →  accepted
   ```

   `code_challenge_methods_supported` is in the discovery document, but per OIDC that
   advertises support, not a requirement. **An `error_description` saying "PKCE required"
   would have turned 40 minutes into 40 seconds.** This is the single highest-impact fix.

3. **`max_age` is not advertised, so we could not tell whether it was honoured.**
   `claims_supported` includes `auth_time` and `prompt_values_supported` includes `login`,
   so we switched to `prompt=login` and kept verifying `auth_time` ourselves. That works,
   but the requirement wording ("a fresh verification at the moment") points builders at
   `max_age`, and the issuer does not list it.

**Missing capabilities / documentation:**

- No `error_description` on authorization failures. Every refusal looks identical
- The docs and the discovery document disagree about where to start; the docs win on
  concepts, discovery wins on facts, and nothing links the two
- A minimal working request — one line of query string with every required parameter —
  would have replaced all of the above

**Highest-impact improvement:** **return `error_description` on `invalid_request`.** One
string. It is the difference between a builder shipping the integration and a builder
guessing at parameters during a hackathon.

**What worked well, honestly:** the discovery document is complete and accurate, the
pairwise `sub` and `auth_time`/`acr` claims are exactly what a "prove it now" flow needs,
and once PKCE was in, the round-trip worked first time with no other surprises.

**Verified on 2026-09-26:** approval returned `auth_time` 22:11:30Z for a button pressed at
22:11, with `acr = https://world.org/oidc/acr/orb-v3`. The declined path completed with the
protected action not running.

## Curvegrid MultiBaas

- **What we integrated:**
- **Time to first success:**
- **Friction:**
- **Missing capabilities:**
- **Top improvement:**

**Specific to our use:** we are executing settlements under an owner's constraints — spending
limit, approved counterparties, required human approval. **Whether that shape fits MultiBaas
naturally, or had to be worked around, is the most useful thing we can report.**

---

## ENSv2 (if the spike lands)

- **What we integrated:**
- **Time to first success:**
- **Friction:**
- **Missing capabilities:**
- **Top improvement:**

**Specific to our use:** the claim we care about is the **delegation boundary** — a delegate
may write a proposal key but not a permission key. Two notes worth reporting either way:

1. Contracts were **redeployed on Sepolia 2026-09-15**, so most published articles are stale.
   How long it took to find current addresses is itself feedback
2. Permissioned-resolver key permissions apply across **every name in an instance** — how
   obvious that was from the docs matters for anyone building multi-tenant

---

## intercepta (only if it becomes the third slot)

- **What we integrated:**
- **Time to first success:**
- **Friction:**
- **Missing capabilities:**
- **Top improvement:**

**Specific to our use:** the call must run **before signing** and its result must decide what
happens next. Getting a real flagged mainnet address and a clean one, and confirming both
return what we expected, is the part worth timing.
