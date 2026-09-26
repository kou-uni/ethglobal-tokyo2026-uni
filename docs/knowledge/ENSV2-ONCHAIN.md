# ENSv2 — Sepolia の現物から確かめたこと

> **追記 2026-09-26：指定SDKの配布物と、以下で参照する main ソースの不一致を確認しました。**
> 付与関数・resource・スコープを混在させて実装しないでください。
> [実物の比較と診断コマンド](../build/ENS-SDK-COMPATIBILITY.md)を先に確認してください。

**確かめた日: 2026-09-26。** 記事は全部古いという前提で、**公式デプロイ一覧・デプロイ済み
バイトコード・`ensdomains` のソース**の3つから取りました。

**結論から: [../build/ENSV2-SPIKE.md](../build/ENSV2-SPIKE.md) の未確認4点のうち3点が潰れ、
残る1点は「設計の答え」が見つかりました。ブースを待たずに書き始められます。**

---

## 1. Sepolia（ENSv2 beta）のアドレス — デプロイを確認済み

| コントラクト | アドレス | `eth_getCode` |
|---|---|---|
| ETHRegistry | `0x657ea849311d3d5823348dded7c2aaafb3ede09e` | **32,002 chars** |
| ETHRegistrar | `0xabe76f6c8dfced81aa5a2bb8034202a7136b94ca` | **16,076 chars** |
| PermissionedResolverImpl | `0x14f09fd05d4585759e54844dc9b00147131cf243` | **31,218 chars** |
| UniversalResolverV2 | `0x5d25c1d6acbb71b7a28aa7899618a3412a8303e3` | — |
| PublicResolverV2 | `0xd7e590ad0e92a6ac1d81f4483a9b951d3585a50f` | — |
| BatchRegistrar | `0xbe68ff9afc7d5a1864ffef5c82de0a1c13e6b529` | — |

一覧は docs、**「本当に生きているか」は Sepolia の `eth_getCode` で別途確認**しました
（一覧に載っているだけのアドレスを信用しない）。

## 2. `ROLE_SET_TEXT = 1 << 4` — 我々の想定どおり ✅

`contracts-v2` の `post-audit-2`、`PermissionedResolverLib` 由来。

```ts
export const RESOLVER_ROLE_SET_ADDRESS   = 1n << 0n
export const RESOLVER_ROLE_SET_TEXT      = 1n << 4n   // ← これ
export const RESOLVER_ROLE_SET_CONTENTHASH = 1n << 8n
export const RESOLVER_ROLE_SET_DATA      = 1n << 24n
export const RESOLVER_ROLE_UPGRADE       = 1n << 124n
export const RESOLVER_ROLE_SET_TEXT_ADMIN = RESOLVER_ROLE_SET_TEXT << 128n
```

**ニブル単位（4bit刻み）で詰めてある**のがポイントで、レジストリの role とは意味が違うので
混ぜてはいけないと明記されています。**admin role は `<< 128n`。**

## 3. text キーの resource 計算 — 我々の想定どおり ✅

```ts
case 'text': case 'data': return BigInt(keccak256(stringToHex(scope.key)))
```

`PermissionedResolverLib.resource()` は `keccak256(abi.encodePacked(argument))`。
text キーなら**キーの生バイト列**。我々の `keccak256(bytes(key))` と一致します。

```
yh:proposal → 0xa2019504f332dc97edb538b8bc1f8e47debaf01976eaa027df67bf34ea3f546a
yh:policy   → 0xb27a895adcbf565bbbc4478618795cfe8a2e4dc3fc8d3e7f5c289e7054221582
```

## 4. ⚠️ per-key の付与関数 — **我々の想定が違っていた**

我々は「resource と role ビットマップを渡す」と想定していました。**違います。**
関数は2つに分かれていて、**per-key 側は role を渡しません。**

| 使い分け | 関数 | 渡すもの |
|---|---|---|
| resolver 上の全名前・全レコード | `grantRootRoles` | role のビットマップ |
| **キー1つだけに絞る** | **`grantSetterRoles`** | **setter の引数だけ。role は setter から決まる** |

> *"Grant one setter's role for a single argument (a coin type, a text key, ...) across every
> name on the resolver. **The role is implied by the setter.**"*

**我々の `PermissionsPort` の呼び出し形が変わります。**「`yh:proposal` という text キーを
指定して付与」であって、「`ROLE_SET_TEXT` を resource に付与」ではない。
refusal の意味は同じなので、`route()` より上は変わりません。

## 5. ⚠️ resolver のスコープ — 開いていた問いに、答えがあった

[../product/CONCEPT.md](../product/CONCEPT.md) §7 に「キー権限はインスタンス内の全名前に
及ぶので、独立した売り手を1つの resolver に相乗りさせてはいけない」と警告を書いていました。
**その警告は正しく、そして ENS 側の答えはこうです。**

> *"A role is held either on the root resource (every name on the resolver) or on the resource
> of a single setter argument; **there is no per-name scope, because a resolver is already per
> account.**"*

**per-name のスコープは存在せず、そもそも resolver がアカウント単位。**
つまり**売り手1人につき resolver 1つ**が設計上の正解で、相乗りは「やってはいけない」
ではなく「そういう使い方ではない」。未確認4点の4番目は、これで閉じます。

## 6. 使う SDK — バージョンが1つしかない

自分で viem を書く必要はありません。公式アクションがあります。

| version | `./public/v2`（読み） | `./wallet/v2`（書き） |
|---|---|---|
| `4.3.1`（latest） | ✗ | ✗ |
| `5.0.0-alpha.1` | ✓ | **✗** |
| **`5.0.0-sepolia-fix.1`** | ✓ | **✓** |

> **`@ensdomains/ensjs@5.0.0-sepolia-fix.1` が唯一の選択肢です。**
> `latest` を入れると v2 が何も無く、`alpha` を入れると付与ができません。
> dist-tag は `sepolia-fix`。

使うアクション: `grantResolverRoles` / `revokeResolverRoles` / `hasRoles`（読み取りなので
**ガス無しで付与を検証できる**）。

## ⚠️ 確かめられなかったこと

- **role ビットはソースから読んだもので、チェーンに聞いたものではない。**
  `PermissionedResolverImpl` に12個のセレクタで `eth_call` したが**全部 revert**した。
  実装コントラクトはプロキシの裏で、role 定数も public getter ではない。
  **実際に resolver を1つ立てたら、`hasRoles` で読んで裏を取ること**（ガス不要）
- **登録の支払い通貨と価格。** ETH では登録できない（USDC/DAI）という想定のままで、
  金額を確認していない。**ここが着手前の最後の壁**
- `decodeSetter` が各 setter の必要 role ビットマップを返すとソースにある。
  これを resolver 実体に対して呼べば**ビットをチェーンから確定できる**。まだやっていない

## 出典

- アドレス一覧 — <https://docs.ens.domains/learn/deployments>（Sepolia ENSv2 Beta）
- role 定数 — `ensdomains/ensjs` `packages/ensjs/src/utils/v2/roles/resolverRoles.ts`
- resource 計算 — 同 `resolverResource.ts`
- 付与関数 — 同 `packages/ensjs/src/actions/wallet/v2/resolver/grantResolverRoles.ts`
- コントラクト本体 — `ensdomains/contracts-v2` `contracts/src/resolver/PermissionedResolver.sol`,
  `contracts/src/resolver/libraries/PermissionedResolverLib.sol`
- デプロイ確認 — Sepolia `eth_getCode`（public RPC）
- SDK バージョン — `npm view @ensdomains/ensjs`
