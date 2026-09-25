# Integration feedback

**This file is filled in while building, not afterwards.** Each section is written the moment
that integration first works — otherwise the friction is forgotten and the feedback becomes
polite and useless.

> ⚠️ **Nothing below is written in advance.** Empty sections mean that integration has not
> been done yet. They are never filled from imagination.

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

- **What we integrated:**
- **Time to first success:** *(from opening the docs to a verified result in our backend)*
- **Friction:** *(where we got stuck, in the order it happened)*
- **Missing capabilities:** *(what we wanted and could not do)*
- **Top improvement:** *(one change, the one that would have saved the most time)*

**Note to fill in honestly:** proofs are mocked during the event
(*"Proofs are using fake identities, DO NOT rely in them for production"*), so anything about
production behaviour is out of scope for this feedback — say so rather than guessing.

---

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
