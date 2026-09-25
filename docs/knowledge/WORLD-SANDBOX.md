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

## ⚠️ 確かめていないこと

- **sandbox の `orb-v3` が、本番のオーブ実機検証とどこまで同じ意味を持つか。**
  acr 文字列としては一致しているが、World のドキュメントで意味を確認していない。
  「本物の人間であることを証明した」と言い切る前に、ブースで聞くこと
- 本番 issuer での挙動（sandbox しか触っていない）

## いま何をしていて、何をしていないか

**認証だけです。** 承認のたびに人が「いま自分である」ことを証明しますが、
**チェーンには何も書いていません。** 保存しているのは `verifiedAt` と `acr` だけで、
World の個人識別子（`sub`）は保存していません。

## 出典

- 実装: [`src/adapters/world-oidc.ts`](../../src/adapters/world-oidc.ts)
- 判定: [`src/ports/identity.ts`](../../src/ports/identity.ts)
- 手順: [../build/WORLD-SETUP.md](../build/WORLD-SETUP.md)
