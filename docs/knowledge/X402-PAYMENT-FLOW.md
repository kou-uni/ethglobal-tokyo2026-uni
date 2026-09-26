# 支払いとYOHAKUの収益を分ける

`docs/launch/payments.js` の図の根拠。公式仕様と、このリポジトリの実装を確認した。
元の50件の振り分けアニメーションは変更せず、別の説明プレイヤーを追加する。
`traffic-money.js` の統合版では、元のSVGに任意の支払いレイヤーを重ねる。
元の再生に戻すと追加レイヤーを隠し、元の表示範囲へ戻る。

## 一言でいうと

**本人への報酬はエージェントから直接。YOHAKUは、依頼を捌く仕事に別の対価を設定する。**

本人の報酬をP、別の処理料をfとすると、設計上は「P＋f」。
本人に届くのはPのままで、Pから割合を差し引くモデルではない。
fの回収はまだ実装していないため、現在の支出・売上をP＋fとして表示してはいけない。

## なぜ分けるのか

今回のUSDC決済に使うEIP-3009 `exact` 認可は、送付先・金額・期限などを署名する。
Facilitatorはその認可を検証し、トークンコントラクトの送金を実行する。
YOHAKUが途中で宛先や金額を変え、本人向けの同じ署名から手数料を引くことはできない。

これは「x402全体が手数料や分配を禁止する」という規則ではない。
別の受取先・コントラクト・決済方式を設計する余地と、現在の本人向け署名を変更できないことは別。
YOHAKUは本人の報酬を運営の財布で中継せず、別の手数料認可を用意する設計を選んでいる。

エージェントが送金を認可し、facilitatorがチェーンに送信・ガス負担する。
「直接」はトークンの送付元と受取先を指し、エージェント自身が必ずガスを払いbroadcastするという意味ではない。

## 実装と構想

| 内容 | 現在のコード |
| --- | --- |
| 本人への価格をそのまま送る | `src/server/app.ts`、`src/adapters/x402.ts`、`src/adapters/eip3009.ts` |
| 通常依頼の判定を1件として台帳に記録 | `src/core/fees.ts`、`src/server/routing-fees.ts`。同じ依頼の再送は重複記録しない |
| 別の任意手数料署名を提示・検証・保持 | アプリ独自の `yohaku-routing-fee` 拡張。本人向け認可とは別の `exact` 認可 |
| 未署名でも本体処理を継続 | 手数料認可の不在・不正は、本体の判定や本人への支払い条件を変えない |
| 手数料を回収する | 未実装。`collection: disabled`、`broadcast: false`、回収額0 |
| まとめ回収 | 将来設計。現在の別exact署名の保持を `batch-settlement` 実装とは呼ばない |

手数料の台帳対象は通常の `/requests`。auto/human/denyいずれの判定も記録する。
新しいスマホ体験 `/experience` は、この台帳を呼ばない。
したがって新しい画面は**ビジネスモデルの説明**であり、スマホデモで手数料が計上・回収された証拠ではない。

説明図のPは120 atomic＝0.00012 test USDC、fは1 atomic＝0.000001 test USDC。
fは設定可能な値の例で、正式な料金や実測ガス代ではない。
1件の説明であり、上の50件すべてを実際に決済することを意味しない。

## batch-settlementについて

公式共通仕様は、依頼時のcommitmentを検証・蓄積し、後で決済するモデルを定義している。
具体的な形式、資金の裏付け、期限、重複防止、保存、回収は各network bindingの責務。
共通仕様があるだけでは、このEVM環境でまとめ回収できることの確認にはならない。

現在のexact認可は資金を確保・予約しない。残高不足や期限切れで回収できなくなる可能性がある。
将来の回収には、対応方式の確認、状態保存、再検査、重複回収の防止、送信結果が不明な場合の処理が必要。
図の将来回収先には資金の粒を流さず、回収額は常に0とする。

## 出典

- Coinbase x402公式・EVM exact仕様：
  https://github.com/coinbase/x402/blob/main/specs/schemes/exact/scheme_exact_evm.md
- Coinbase x402公式・batch-settlement共通仕様：
  https://github.com/coinbase/x402/blob/main/specs/schemes/batch-settlement/batch_settlement.md
- チームの収益モデル：[ECONOMICS.md](../product/ECONOMICS.md)
- 手数料実装の境界：[ROUTING-FEES.md](../build/ROUTING-FEES.md)
- 既存ビジネスモデルの図：[business.html](../business.html)

公式ソースは2026-09-26に取得。図は外部API・ウォレット・署名・決済を呼び出さず、
説明用の時刻とシナリオだけで表示を切り替える。
