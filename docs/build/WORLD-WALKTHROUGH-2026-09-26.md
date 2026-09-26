# 本人操作を含むWorldウォークスルー — 2026-09-26

**公開環境の「本人の本番World承認 → テスト送金 → receipt・台帳確認」が成功しました。**
依頼 `try-6ae1fe31` の承認結果JSONと、独立したRPCで取得した取引ID・networkが一致しています。
ローカルの本番World承認も成功しています。通常エージェント依頼の所有者承認など、
構成全体の未接続部分を修正したという意味ではありません。
その後の実装修正と再試験は[INTEGRATION-FIXES](INTEGRATION-FIXES-2026-09-26.md)に記録しています。

## 確認できたこと

| 時刻（JST） | 観測 |
|---|---|
| 20:24:42 | 本人がWorld Appで操作。ローカル `try-030c6e07` のproduction / protocol 3.0 / Orb証明を実verifierが受理 |
| 20:24:43 | `/world-approval/verify` が200。サーバー上の同じ依頼が `approved`。このローカル試験は送金無効 |
| 20:25頃 | 同じローカルサーバーでclean→auto、Intercepta flagged→rule 4 deny、ENS失効→rule 0 denyを確認 |
| 20:26頃 | 公開 `/health` が200に復旧。World・screening・settlement・delegationReaderが有効。Issue #22に復旧観測を追記 |
| 20:26頃 | 公開 `/requests` でclean→402、flagged→rule 4 deny、ENS失効→rule 0 deny。署名・送金なし |
| 20:28:03 | 公開来場者デモの支払い設定が有効。台帳の `received` は空。比較開始ブロックは47326897 |
| 20:29:47 | 公開 `try-6ae1fe31` が本番World / protocol 3.0 / Orb認証を経て `approved`。本人が結果JSONを提供 |
| 20:29:50 | 下記USDC TransferがBase Sepoliaブロック47326951に記録 |
| 20:30:32 | 独立したRPCでreceipt成功、送信元・受取先・atomic量を照合。公開台帳も依頼価格4,200の受領を記録 |
| 20:35:35 | 本人提供の公開結果JSONと照合し、同じ取引のreceiptをRPCで再確認。World確認時刻の3秒後にブロックへ記録 |

オンチェーンで確認した取引：

```text
tx:    0x12f1c4b90dafa3c6fff8d28e94e422c43d7f46f49fe4b5a14dee45f422d99aa1
from:  0xCD6071453028bfB2510EcD575a2B431488fBE0F7
to:    0x5f52FA3c5DF22d8c89fA6c2221E2aeBd6FE722bD
asset: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
value: 4200 atomic = 0.0042 testnet USDC
chain: Base Sepolia, chain ID 84532
```

この取引は最初にデモpayerから既知の受取先への新しい送金として発見しました。
その後、本人から提供された公開画面の結果にある `settlement.transaction` と完全一致しました。
`identity.verified=true`、`environment=production`、`credential=orb`、
`verdict=approved`、`settlement.settled=true` も結果JSONで確認しています。
ローカルの成功依頼 `try-030c6e07` と、公開で送金した `try-6ae1fe31` は別の依頼です。

## 証拠

[world-walkthrough-20260926.json](evidence/world-walkthrough-20260926.json)。
ローカルは本番の `idkitApprovalFromEnv()` / `verifyIdkitProof()` と通常の `createApp()` を使い、
検証済みの要約とレスポンス終了後のStore状態だけを外側の試験起動スクリプトで記録しました。
認証や承認のガードは変更していません。ローカル対象ソースは `6b10c2c` です。

公開サーバーではhealth、署名なしのAPI応答、台帳とチェーンを観測しています。
公開Worldの認証情報は、本人が提供したアプリの検証結果要約です。
この監査で公開の生proofを再取得・再検証したわけではありません。
公開サーバーの実行コミットはhealthに含まれず、この試験からは特定していません。
生proof・nullifier・cookie・秘密鍵・支払い署名は証拠ファイルに含めません。

## 最終照合

| 確認項目 | 結果 |
|---|---|
| 承認した依頼 | `try-6ae1fe31` |
| World | production / 3.0 / Orb、verified |
| World確認時刻 | 20:29:47 JST |
| 支払い結果と独立receiptのtransaction/network | 一致、Base Sepolia |
| receipt | success、ブロック47326951、20:29:50 JST |
| 受取先 | `0x5f52FA3c5DF22d8c89fA6c2221E2aeBd6FE722bD` |
| トークン量 | 4,200 atomic = 0.0042テストUSDC |
| 台帳 | 受領なし → 依頼価格4,200 JPYCの受領を記録。実トークン量とは別単位 |

取消経路は本人に新規ローカル依頼での「Cancel verification」を案内していますが、
この記録時点では新しいcancelイベントを観測していません。実機確認済みとはしていません。
既存の自動試験での取消・再送・期限切れ拒否と区別しています。

## このウォークスルーで保証していないこと

- World承認はブラウザーに結び付いた `/try` の来場者デモです。
  通常の `POST /requests` の保留依頼を所有者が承認する未接続部分は解消していません。
- `/try` の承認送金経路でENS権限読取やInterceptaが呼ばれたとはしていません。
  それらは同じサーバーの別リクエストで確認しています。
- 公開台帳の4,200 JPYCは依頼価格の集計であり、実送金は0.0042テストUSDCです。
- 個人の回答配送、A2A transport、treasury接続はこの試験では未実装のままです。
- 入力期限や同一依頼IDの再決済など、[結合試験の課題](INTEGRATION-AUDIT-2026-09-26.md)は未修正です。
- 今回は一件の承認と一致する一件のTransferを確認したものです。
  あらゆる再送・並行処理で決済が一回になることの保証ではありません。
