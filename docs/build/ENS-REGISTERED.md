# ENS登録完了 — 2026-09-26

ユーザーのウォレット操作後、Ethereum Sepoliaを直接読み取り、登録完了を確認しました。
初回確認ブロック11783249、追加確認ブロック11783254。

| 項目 | 確認結果 |
|---|---|
| 名前 | `yohaku-minta-2026.eth` |
| 所有者 | `0x5f52FA3c5DF22d8c89fA6c2221E2aeBd6FE722bD` |
| Registryのresolver | `0xCf853fF7BBA8f616E2814745C4FC0012D51E681e` |
| Factoryが返した実装先 | `0x14f09fd05d4585759e54844dc9b00147131cf243` |
| 有効期限 | 2027-09-26 02:14:24 UTC（11:14:24 JST） |
| 登録期間 | 31,536,000秒 |
| 支払い | 8.000021 MockUSDC |
| 登録トランザクション | `0x8e13e0ad4ef75378f6e00130f2a1e76f7664cd6d5d303cd703a1e76452267828` |
| 登録ブロック | 11783217 |
| receipt | success |

## 実際に読んだもの

- `ETHRegistry.getState(labelhash)` と `ownerOf(tokenId)`：所有者が指定アドレスに一致。
- `ETHRegistry.getResolver(label)`：resolverの結び付き。
- `eth_getCode(resolver)`：77バイトのproxyコードあり。
- `VerifiableFactory.verifyContract(resolver)`：既に検証した実装先に一致。
- `hasRoles(0, 16, owner)` とtext-admin：両方true。
- Registrarの `NameRegistered` イベントと登録receipt：名前・所有者・resolver・料金が一致。
- 実際の `EnsPermissions`：所有者のproposal／policy書き込み権限がtrue。
- 同アダプターの `readText`：proposalレコードは未設定。
- 売り手resolverに対する `decodeSetter`：全5キーが期待するresourceとrole 16に一致。

[生の読取結果](evidence/ens-registration.json)に確認時刻、ブロック、イベントを保存しています。

## まだ完了していないこと

**これは所有者側の設定完了です。委任の実証は残っています。**

1. 所有者と異なる委任先アカウントと、そのガスを用意する。
2. 委任先にproposalだけ付与し、実際に書き込む。
3. 同じ委任先でpolicyを書き換えるとrevertすることを記録する。
4. 権限取消後、proposalもrevertすることを記録する。
5. サーバーのpolicy.ownerを登録名に合わせ、接続設定を反映する。

ENS賞の動作要件を全て満たしたという主張は、上記の実行後に行います。
