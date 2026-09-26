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

## ⚠️ いちばん重要な測定 — `auth_time` が新しいことは「本人が承認した」ではない

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

> **`auth_time` が2秒前に押し直されているのに、認証方法は `pop`。**
> つまり**保持している鍵を提示しただけ**で、誰も何も承認していません。
> **新しさと、聞かれたかどうかは、別の軸です。**

### これで我々の主張がどう変わったか

**変更前（言い過ぎ）:** 「彼女はその瞬間に、自分が人間であることを証明した」

**変更後（測った範囲）:** 「**orb 検証済みの人間だけが持つ資格が、その瞬間に提示された**」

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
