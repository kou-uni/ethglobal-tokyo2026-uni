# World ID — sandbox OIDC で実際に通った条件

**確かめた日: 2026-09-25 / 2026-09-26。実機（iPhone + World App）で人が押して往復させた結果です。**

## 通った構成

| 項目 | 値 | どう確かめたか |
|---|---|---|
| issuer | `https://sandbox.auth.world.org` | 実際に往復した |
| endpoints | **書いていない。** discovery から実行時に取得 | `.well-known` を読み、3キーの存在を検証してから使う |
| 署名検証 | `jose` の `createRemoteJWKSet` → `jwtVerify` | issuer の公開鍵で ID トークンを検証している |
| acr | `https://world.org/oidc/acr/orb-v3` を必須 | これを満たさない応答は deny |
| auth_time | **120秒以内**。サーバ時刻と比較 | 古い認証は deny |

## ⚠️ 一番ハマったところ — PKCE が必須で、しかも文書に無い

**`invalid_request` だけが返り、`error_description` が無い。** 原因を切り分けるために
**8通りのパラメータ組み合わせを実際に投げて**特定しました。

> **PKCE（S256）が必須。** `code_challenge` / `code_challenge_method` を付けないと
> authorize が `invalid_request` で落ちる。**sandbox のドキュメントにこの記述が無い。**

これは我々の実装ミスではなく、**ドキュメントの穴**です。ブースで伝える一番価値のある
指摘として [../build/FEEDBACK.md](../build/FEEDBACK.md) に入れてあります。

## ⚠️ 訂正 — 「amr が pop だから再認証されていない」は誤りでした

**2026-09-26、minta さんの調査で訂正。** World の公式ガイドは **`amr` を `["pop"]` と規定**
しています。つまり **pop は fresh proof の否定ではなく、World ID のすべての認証で返る値**です。
MFA や生体を意味する値でもありません。

| こちらが書いたこと | 正しくは |
|---|---|
| ~~`amr: pop` だから誰も承認していない~~ | **pop からは何も言えない。** 仕様上そう返る |
| ~~`prompt=login` と `max_age=0` が無視された~~ | **そう断定できない。**観測できたのは別のこと |
| **World App が開かなかった**（Safari・プライベート・Chrome） | **これは観測。ここだけが残る** |

**観測と説明を混ぜたのが誤りでした。** 開かなかったのは事実で、その理由は分かっていません。
画面の文言も、`amr` に触れず「**この瞬間に World ID を検証した**」と、
「**World App の引き継ぎは得られなかった**」の2つだけを言うように直しました。

## ✅ 本番では通りました（IDKit）

**2026-09-26 12:46:23 JST、本番の verify API で成功。** `production` / protocol `3.0` / `orb`。
Developer Portal で本番アプリと署名者を登録し、公開 RP status API でも確認済み。
PC に QR を出して、実機の World App から返した証明を検証しています。

**ただし、これで賞の条件を満たすとは主張しません**（minta さんの明記）。
公開サーバへの反映、所有者アカウントとの紐付け、決済・依頼承認への接続は未実施です。

証拠: `docs/build/evidence/world-idkit.json` / 手順: `docs/build/WORLD-IDKIT-PROBE.md` /
公開資料の再評価: `docs/knowledge/WORLD-PUBLIC-DIAGNOSIS.md`（PR #7）

## ⚠️ 当初の測定（説明は上の訂正で置き換わっています）

**2026-09-26 に実機で測りました。`prompt=login` と `max_age=0` の両方を送っています。**

```
acr:        https://world.org/oidc/acr/orb-v3
amr:        ["pop"]          ← proof of possession
auth_time:  1790388649
iat:        1790388651       ← 差は 2 秒
```

**World App は開きませんでした。** 3回試して同じです。

| 我々が送ったもの | issuer が公表している対応 | 実際 |
|---|---|---|
| `prompt=login` | `prompt_values_supported: ['none','login']` ✅ | **無視された** |
| `max_age=0` | discovery に記載なし | **無視された** |

> ~~つまり保持している鍵を提示しただけで、誰も何も承認していません~~
> **この推論が誤りでした。**`pop` は World ID が常に返す値で、承認の有無を語りません。
> 残るのは「**World App が開かなかった**」という観測だけです。

### これで我々の主張がどう変わったか

**いま言えること:** 「**その瞬間に World ID が検証された**」— `acr` は orb、`auth_time` は
数秒前で、サーバ時刻と突き合わせている。**それ以上は言わない。**

小さくなりましたが、まだ意味はあります。資格は人格に紐づいており、提示はこの瞬間に
起きている。**ただし「本人がアプリで承認した」ではない。** 画面もその通りに書き換えました
（`amr: pop` のときだけ文言が変わります）。

**構造でも持てるようにしました。** `FreshnessPolicy.acceptedAmr` を足してあり、
再認証を必須にしたい実装はそこに `mfa` などを書けば `pop` を拒否できます。
**デモでは設定していません** — この issuer が返すすべてのログインを拒否することになるので。
代わりに**画面が事実を書きます。**

## ⚠️ 確かめていないこと

- **sandbox の `orb-v3` が、本番のオーブ実機検証とどこまで同じ意味を持つか。**
  acr 文字列としては一致しているが、World のドキュメントで意味を確認していない
- **本番 issuer なら World App が開くのか。** `amr` が `pop` 以外になるのか。
  **ブースで聞く一番の質問はこれです**
- 本番 issuer での挙動（sandbox しか触っていない）

## いま何をしていて、何をしていないか

**認証だけです。** 承認のたびに人が「いま自分である」ことを証明しますが、
**チェーンには何も書いていません。** 保存しているのは `verifiedAt` と `acr` だけで、
World の個人識別子（`sub`）は保存していません。

## 出典

- 実装: [`src/adapters/world-oidc.ts`](../../src/adapters/world-oidc.ts)
- 判定: [`src/ports/identity.ts`](../../src/ports/identity.ts)
- 手順: [../build/WORLD-SETUP.md](../build/WORLD-SETUP.md)
