# Wiring World ID — the browser round-trip

**What this finishes:** the one part of the demo where a person is actually present.
An agent asks, it is held, she opens a page, **proves she is a person at that moment**, and
only then does anything happen. The refusal path is the same page doing nothing.

That sequence is World's stated requirement, word for word:

> *"Demonstrate the complete journey: identity or verification request, user completion,
> validated result, and the protected application or agent action"*
> *"Demonstrate a denied, expired, cancelled, or otherwise unsuccessful path"*

---

## Already done

- OIDC adapter, discovery read live, `auth_time` + `acr` verified — 18 tests
- `GET /approve/:id` — the page she opens
- `GET /approve/:id/verify` — redirects to the issuer with `max_age` and `acr_values`
- `GET /auth/world/callback` — verifies the token and settles, or refuses
- `POST /approve/:id/decline` — the "not this one" path
- **Every refusal ends with the protected action not running.** One code path, shared

## Left to do — two steps, both yours

### 1. Put the server somewhere with HTTPS

The portal will not accept `http://localhost`. Tailscale Funnel is the shortest route
because the URL is already stable:

```bash
npm start              # 8402, in one terminal
tailscale funnel 8402  # in another
```

That gives you `https://<machine>.<tailnet>.ts.net` pointing at the server. **The callback
URL is that, plus `/auth/world/callback`.**

Check it from outside before going further:

```bash
curl -s https://<machine>.<tailnet>.ts.net/health | jq .wired
```

### 2. Register the OIDC client

```bash
claude plugin marketplace add worldcoin/world-id-agent-plugin
claude plugin install world-id-sandbox@world-id-demo
```

Then ask it to register, giving **the callback URL from step 1**. It returns a client id
and secret. Put all four in `.env`:

```
WORLD_ISSUER=https://sandbox.auth.world.org
WORLD_REQUIRED_ACR=https://world.org/oidc/acr/orb-v3
WORLD_MAX_AGE_SECONDS=120
WORLD_REDIRECT_URI=https://<machine>.<tailnet>.ts.net/auth/world/callback
WORLD_CLIENT_ID=...
WORLD_CLIENT_SECRET=...
```

Restart. The banner should read `identity  World ID → https://…/auth/world/callback`
instead of `mock`.

## Then walk it once

```bash
curl -s https://<host>/requests -X POST -H 'content-type: application/json' -d '{
  "id":"walk-1","who":"nozomi-labs.eth","what":"health/symptoms",
  "purpose":"market-research","price":{"amount":2400,"currency":"JPYC"},
  "deadline":"2026-09-27T00:00:00Z"}'
```

Open `https://<host>/approve/walk-1` **on your phone**, press Approve, complete the World
flow, and land back on a page that shows the `auth_time` and the `acr` it verified.

**Then do it again and press "Not this one."** That second run is half the prize requirement,
and it is the easier one to forget to show.

## What to say at the booth

- **"Approving is the high-stakes action, so that is where the proof happens."** Not at
  signup. The `auth_time` on the page is the evidence, and it is seconds old
- **Freshness is enforced twice** — `max_age` asks the issuer to re-authenticate, and
  `auth_time` is checked against our clock. Asking alone would be trusting a parameter was
  honoured
- **"Now watch me ignore one."** The deadline passes and the protected action never runs.
  No signature, no transaction, no record of consent

## If it will not land

The mock keeps the whole flow working, and the page **says so on itself** — it prints that
identity is not wired rather than implying a proof happened. Say that out loud instead of
letting a judge find it. **That is worth more than a broken live integration.**
