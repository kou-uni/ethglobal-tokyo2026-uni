# World Appを使うIDKit本番認証テスト

審査員向けにYohakuの依頼承認へつなぐ手順は
[WORLD-IDKIT-DEMO.md](WORLD-IDKIT-DEMO.md)。この文書は認証単体のテスト。

確認日：2026-09-26。
YohakuのIDKitアプリと署名者をDeveloper Portalで登録した。
画面の署名者とローカル鍵の公開アドレスが一致し、公式RP status APIは
本番・stagingともに `registered` を返した。公開設定は `config/world-idkit.json`。

ChromeでQRを生成し、**2026-09-26 12:46:23 JSTに本番verify APIで証明の成功を確認した。**
結果は `verified: true / environment: production / protocolVersion: 3.0 / credential: orb`。
記録は [evidence/world-idkit.json](evidence/world-idkit.json)。
スマホでアプリが開いたか、具体的にどの操作をしたかは本人の観測確認待ち。
246件の自動テストと10件のclaim検証も通過した。これらと本番証明の結果は区別している。

## 起動とスマホ操作

このMacでは秘密鍵を `.env` に作成済み。再生成や送金は不要。
別の開発環境で設定するときは、独自の鍵とそれに対応するRP登録が必要。
共有RPの署名者を勝手に変更しない。

```sh
npm install
# 未設定の環境でのみ。公開アドレスを表示し、秘密鍵を.gitignore対象の.envへ保存する。
npm run setup:idkit-key
npm run probe:idkit
```

1. このPCのChromeで `http://127.0.0.1:4178` を開く。
2. 「本番のWorld IDで試す」を押す。
3. スマホのWorld AppでQRを読み取り、表示された認証依頼を確認する。
4. PC側に「World本番APIで証明を検証できました」と表示されることを確認する。
5. World Appが実際に開いたか、本人がどんな操作をしたかは実機観測として別途記録する。

QRは約4分で待機終了。期限切れの場合はボタンから新しいテストを始める。
スマホからPCのlocalhostを開く必要はない。PCがWorldへの接続と結果の取得を行う。
この検証のために公開サーバーを変更する必要はない。

## この検証で分かること／分からないこと

分かるのは、今回作った認証依頼に対応するOrb / Proof of Human証明を、
Worldの本番verify APIが有効と判定したかどうか。
対応資格を持つWorld Appが必要で、アプリが入っているだけで全員が成功するとは限らない。

このテストは決済・依頼承認・アカウント連携・ENS権限付与を実行しない。
特定の所有者本人との一致や、一人一回の特典付与、エージェントへの委任は検証範囲外。
既存の `/try` は従来のsandbox設定を使う。
IDKitの接続だけでWorld ID for Agentsの賞の要件を満たしたとは主張しない。

## 実装上の境界

- 専用鍵は認証依頼の署名用。ブラウザーへ渡さず、資金は入れない。
- HostとOriginをloopback画面に限定し、HttpOnly/SameSite cookieで開始ブラウザーと結び付ける。
- ランダムnonce・signal、action、5分の有効期限を検査し、一度検証に使った依頼を再使用しない。
- SDKの暗号処理用WASMも同じローカルサーバーから配信する。
- 本番環境、想定した資格、signal hashを確認後、証明を公式verify APIへ送る。
- HTTP成功だけでなく、返った個別の資格判定も成功であることを確認する。
- キャンセル、異なるnonce・signal・action、期限切れ、API障害を成功として扱わない。
- 生の証明・nullifier・個人識別子をファイルやログに保存しない。
- 成功時だけ `docs/build/evidence/world-idkit.json` に日時・方式・資格種別・成功判定・公開App/RP IDを保存する。

Agents OIDCの本番クライアントとは異なる仕組み。
`WORLD_IDKIT_SIGNING_KEY` を `WORLD_PRODUCTION_CLIENT_SECRET` として使わない。
OIDC方式の未完了事項は [WORLD-PRODUCTION-PROBE.md](WORLD-PRODUCTION-PROBE.md)。
