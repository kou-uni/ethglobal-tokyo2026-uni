# Integration feedback

**This file is filled in while building, not afterwards.** Each section is written the moment
that integration first works — otherwise the friction is forgotten and the feedback becomes
polite and useless.

> ⚠️ **Nothing below is written in advance.** Empty sections mean that integration has not
> been done yet. They are never filled from imagination.
>
> World, x402 and ENS observations are recorded below. Production IDKit follow-up is
> included here and in `docs/product/SUBMISSION.md`.

## Production IDKit follow-up — 2026-09-26

- Trust moment: a visitor approves an agent's request. Personhood is relevant; passport
  information and nationality are not. We use Orb/PoH without adding unrelated credentials.
- First verified production proof: **12:46:23 JST**. First proof-to-Yohaku-approval:
  **12:57:56 JST**. Total time from starting integration was not timed. These milestones
  are 11m33s apart, not a claim about total implementation time.
- Success and an alternative path were exercised: production proof approved the local
  visitor request; cancelling a later verification left that request unapproved.
  See `evidence/world-idkit-approval.json` and `evidence/world-idkit-cancel.json`.
- We confused the Agents OIDC portal with the IDKit Developer Portal, and separately
  misinterpreted `amr=pop`. The correction below applies to the latter.
- Our esbuild bundle initially omitted the SDK WASM asset route. Serving that asset fixed
  our setup; this is a bundling integration issue, not a confirmed SDK defect.
- The most useful documentation improvement would be one comparison page linking each
  product to its portal, dev/production environment, credentials and success/failure example.
- PR #7 is merged. Public IDKit deployment is unconfirmed, and the combined production-IDKit + payment run remains pending.

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

## World ID — `prompt=login` も `max_age=0` も効かず、`auth_time` だけが新しくなる

**2026-09-26 実測。sandbox issuer。3回再現。**

```
送信: prompt=login, max_age=0, acr_values=https://world.org/oidc/acr/orb-v3
応答: amr=["pop"], auth_time=iat-2  （World App は開かない）
```

`prompt_values_supported` に `login` が載っているのに、**再認証は起きません。**
それ自体より重いのは、**`auth_time` が押し直されること**です。

> **`auth_time` を「人がいま承認した証拠」として使う実装は、そう作れてしまいます。**
> 我々も一度そう書きました。`amr` を見るまで気づきませんでした。

**⚠️ ここは我々の側を先に訂正します。** 当初「`amr` が `pop` だから再認証されていない」と
書きましたが、**公式ガイドが `amr` を `["pop"]` と規定している**以上、pop からは何も言えません。
その推論は誤りでした。

**残る観測はこれだけです。** sandbox の Agents OIDC フローで、**World App が開きませんでした**
（Safari・プライベート・Chrome）。理由は分かっていません。

**提案。**

1. **sandbox の Agents フローで、どの条件なら World App に引き継がれるのかを書いてほしい。**
   開かない場合に、それが正常なのか設定不足なのかが、応答からは判別できません
2. **`amr` の意味を1行足してほしい。** 「これは常に `pop` であり、再認証の有無を示さない」と
   書いてあれば、我々のような誤読は起きません。実際にこちらは半日それで誤りました
3. PKCE 必須の件（下記）は変わらず、**エラーにならないまま間違った実装ができあがる**種類の穴です

**本番の IDKit では通りました。** 2026-09-26 12:46:23 JST、production / protocol 3.0 / orb。

## x402 — 公開パッケージが v1 のまま、デプロイ済み facilitator は v2

**2026-09-26 実測。**

```
npm   x402@1.2.0        → X-PAYMENT のみ（v1）
live  x402.org/facilitator/supported → {"x402Version":2, ...}  ヘッダは PAYMENT-SIGNATURE
```

記事どおりに作ると噛み合いません。**`@x402/core@2.27.0` が v2 で依存が zod だけ**なので、
そこに辿り着けば済みますが、**検索して最初に出るのは `x402` のほう**です。

**提案。** `x402` の README 冒頭に「このパッケージは v1。v2 は `@x402/core`」と1行。

### 拒否理由のフィールド名が verify と settle で違う

```
settle → errorReason
verify → invalidReason
```

片方しか読まないと、原因が **`insufficient_balance` なのか payload の不正なのか**
見分けられなくなります。我々は最初それで潰しました。**揃えるか、両方に別名で入れてほしい。**

### 良かったところ

- **`insufficient_balance` という拒否理由が返ること。** これがあったので「facilitator まで届いて、
  要件も署名も受理され、残高だけが無い」と切り分けられました。理由が潰れていたら丸1日溶けていました
- **EIP-3009 の gasless が本当に gasless。** 買い手の ETH 残高 0 のまま 102,844 gas を facilitator が
  払い、着金しました。ブースで財布を出してもらうときに、これが効きます

## ENSv2 — 配布 SDK と実デプロイで付与関数が違う

**minta 調べ。** `@ensdomains/ensjs@5.0.0-sepolia-fix.1` の `authorizeTextRoles` と、
実デプロイの `grantSetterRoles` が別物でした。**どちらを見て実装するかで詰まります。**

また **`5.0.0-sepolia-fix.1` だけが書き込みを持ちます**（`latest` は v2 が無く、`alpha` は読み取りのみ）。
dist-tag が `sepolia-fix` であることは、ドキュメントから辿れません。

### 良かったところ

- **`decodeSetter` が読み取りで role ビットマップを返すこと。** 実装コントラクトへの `eth_call` は
  プロキシの裏で全部 revert しますが、これのおかげで**ガス無しにチェーンから確定**できました
