# 委任境界の実証画面

```bash
npm run setup:ens-delegation
```

同じPCのブラウザーで **http://127.0.0.1:4177** を開きます。
登録済みの `yohaku-minta-2026.eth` と、その所有者のウォレットを使用します。

## 所有者が署名する3件

1. ブラウザーで生成した検証専用の委任先に、表示されたガスを送る。
2. resolverの `yh:proposal` だけに `ROLE_SET_TEXT` を付与。
3. proposalとpolicyの検証後、proposalの権限を取り消す。

ガス送付は見積もりで決め、最小0.001、最大0.005の**Ethereum SepoliaテストETH**です。
見積もりが上限を超えると、プランを作りません。所有者の署名画面にも送付先と金額を表示します。
所有者操作以外の3件は、検証画面が委任先として署名します。

## 委任先の3件

- **proposalへの書き込み：成功**を期待する。
- **policyへの書き込み：revert**を期待する。
- 所有者が取り消した後、**proposalへの書き込み：revert**を期待する。

拒否される取引は、まず `eth_call` で正確な
`EACUnauthorizedAccountRoles(resource, 16, delegate)` を確認してから送ります。
実際にrevertする取引にもガスを使います。RPCの通信失敗や別のエラーを拒否の成功とは扱いません。

## 鍵と再開

委任先の秘密鍵はブラウザーで生成し、そのタブのsessionStorageにだけ保存します。
所有者の秘密鍵の入力欄はありません。サーバーが受け取るのは公開アドレス・提案文字列・取引ハッシュです。

**完了まで同じタブを開いておいてください。** 再読み込みでは進捗を復元しますが、
タブを閉じると復元できない場合があります。委任先は検証専用で、実資産を入れないでください。
この実装では残ったテストETHの払い戻し機能は提供していません。

送信ハッシュを保持してからreceiptを待ちます。タイムアウト時には同じ取引を再確認し、
ハッシュが保存されている取引を再送しません。予期しない実行結果では手順を止めます。

## 証拠の検証

全6件が終わると、ローカルサーバーが独立して次を確認します。

- 名前の登録先resolverと所有者が、現在も想定どおりか。
- 6件のハッシュが全て異なり、順番が正しいか。
- 各取引のfrom/to/value/calldataが、検証対象そのものか。所有者のgrant/revokeは、
  設定済みのウォレットDelegationManager経由も検証する。単一の通常CALLで、
  内側のresolver・金額0・calldataが完全一致し、登録済みresolver自身から
  proposal権限の正確な変更イベントが1件出た場合だけ認める。
- 期待した成功／revertのreceiptになっているか。
- ガス不足による失敗ではないか。
- 拒否取引のブロックで `eth_call` を再実行し、想定した権限不足エラーが返るか。
- 最終的に委任先のproposal／owner-onlyキーのtext権限が無いか。
- 成功したproposalの内容が、実際にresolverから読めるか。

確認できた場合だけ `docs/build/evidence/ens-delegation.json` を保存します。
既存の検証を再実行しても過去の成功を推測で補うことはしません。

## この段階の検証結果

- 192テスト、型チェック、10項目の整合確認が成功。
- 実resolverへ読み取りのみ実行し、権限のない例示アドレスからpolicy書き込みを試すと
  正確な `EACUnauthorizedAccountRoles` が返ることを確認（ブロック11783314で準備）。
- 実送信を全て遮断したブラウザーテストで、署名キャンセル、所有者3件、委任先3件、
  2件のrevert、送信JSONに鍵がないこと、モバイル幅を検証。

**2026-09-26、実チェーン上の6件も検証完了。**
ユーザーが送信したブロック11783334〜11783339の取引を、11783370時点で独立照合しました。
[証拠JSON](evidence/ens-delegation.json)に全ハッシュ・成功／revert・取消後の権限を保存しています。
proposal書き込み成功、policy拒否、取消後のproposal拒否を確認しました。

最初の照合は「Transaction 2 does not match」で停止しました。ウォレットがgrant/revokeを
`redeemDelegations`で包んでいたためです。上記の内側CALLとイベント検証を追加し、
既存の6取引を再送せずに検証しました。未知の送信先・複数実行・無視可能な失敗モード・
偽のイベント・異なる権限は拒否します。

これはENS権限の実証です。実AIへの接続、HTTP呼出者の認証、公開アプリの登録名設定は別途必要です。

## 出典

デプロイ情報は `config/ens-deployment.json` と登録証拠、
ABIと拒否エラーは `ensdomains/contracts-v2@71a3b7339dbc55ab47667abdfe8303bac4f4c24e` の
`PermissionedResolver.sol` / `IEnhancedAccessControl.sol` に基づきます。
