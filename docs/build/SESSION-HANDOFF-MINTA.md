# minta セッション引き継ぎ — 2026-09-26 14:50 JST頃

## 最初に読むもの

- `PUBLIC-DEMO-HANDOFF.md`：最新の実証結果と残作業。
- PR #13：`minta/public-demo-handoff`。公開反映はKouが担当。
- Issue #9：Koeとデモ導線の依頼・報告。Issue #11：手数料台帳。

## 今回までに確認できたこと

- PR #10（Koe登録）と #12（手数料台帳）はmainに取り込み・公開済み。
- Koeのproduction World / Orb認証は、ローカル14:24:39 JST、公開14:36:56 JSTに成功。
  公開JSONとGitHub Pagesの参加者カードにも反映された。証拠は `evidence/koe-registration-*.json`。
- **公開YohakuでWorld認証→承認→送金まで同一リクエストで成功**。
  `try-e30e5ea1`、14:43:04 JST、production / protocol 3.0 / Orb。
  RPC receiptの成功と、参加者への4,200 atomic（0.0042テストUSDC）のTransferを照合済み。
  証拠は `evidence/world-public-payment.json`。
- コミット `7445905`：上記証拠と、依頼価格JPYCと実送金トークン量を区別する表示修正。
- PR #13にはhealthのCORS修正、審査向け案内、Koeの位置づけ明記も含む。
- 変更前後の `npm run check` 成功。391 tests / 12 claims。

## 次にすること

1. PR #13の最新状態とKouのIssueコメントを確認してから作業する。
2. マージ・公開サーバー再起動後、health CORSと金額表示の修正を確認する。
3. 必要なら新しい公開リクエストでCancel verificationを試し、未承認のままであることを確認。
   今回成功したリクエストを再送金しない。
4. Koeの実機削除は未確認。本人の操作で一時掲載の削除を確認できる。

## 説明上の境界

提出プロダクトはYohaku、Koeはエージェント向けの発見・名簿デモ。
Koeでの人間認証は動作するが、プロフィールの真偽・一人一件・個人別の質問配送・回答配送は保証しない。
全員共通のデモルーターで、夜のシミュレーションとも別。台帳は公開済みだが手数料回収は未実装。
screeningは公開healthでfalse。今回の送金はテストネットであり売上ではない。

## 作業環境と注意

- 作業リポ：`kou-uni/ethglobal-tokyo2026-uni`。
- 公開サーバー：`https://mac-studio.taila649e1.ts.net`。受取先と取引は証拠JSON参照。
- World Appの本人操作はmintaが行う。秘密鍵・生proof・nullifier・cookieを記録しない。
- サーバーのメモリ内に依頼と一時プロフィールがあるため、認証中に再起動しない。
- ローカル8411はKoe実機認証用、8410は静的プレビューとして使用していた。
  次回はプロセスの稼働を確認し、既存プロセスを無断で停止しない。
- 本作業と別のローカル変更として `design/yohaku-v3/README.md` と未追跡
  `design/yohaku/`、`design/yohaku-v2/`、`design/yohaku-v4/` が残っている。
  今回のPRには混ぜていない。採用済みv3の既存アセットはリポにある。
