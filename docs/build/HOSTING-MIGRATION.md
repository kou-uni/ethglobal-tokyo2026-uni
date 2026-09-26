# Studioから固定HTTPS URLへ移す

2026-09-26。新デモと同じPRで、Kou向けの移行依頼とDockerfileを用意。
クラウドサービスの作成、課金プランの契約、秘密値の移送、公開切替はまだ行っていません。

## 提出URLについて

公式イベントページで提出期限とFAQは確認しましたが、公開ページだけでは「デプロイURL欄が必須」
かどうかは確認できませんでした。ログイン後の提出フォームで必須／任意を照合してください。
必須の断定とは別に、審査員が開いて操作できる固定HTTPS URLを用意する方針です。
説明ページはGitHub Pages、実演の提出先は新バックエンドの `/experience` を想定します。

## 今回の推奨構成

GitHub Pages（説明・Koe）→ Render Web Service等の常駐Nodeコンテナ（World、依頼、回答、x402）。
同じDockerfileは他の常駐コンテナサービスでも使用できます。

現在のStore、Worldの認証待ち、Koeの一時掲載、新デモの回答、署名回数制限はプロセス内です。
そのため今回は常駐プロセスを1インスタンスで動かす案です。Vercelでも実装は可能ですが、
この状態をそのまま複数のFunctionへ分散させないでください。永続DBへの移行と原子的な
認証消費・支払い確保が必要になります。特に支払い途中の再起動を「もう一度署名」で復旧すると、
二重送金の危険があります。Vercel Workflowsを利用する場合も、既存Mapからの移植は必要です。

DockerfileはNode 22、`npm ci --include=dev`、非root実行、`npm start`を使用します。
tsxとesbuildは現行サーバーの起動時に必要なので、devDependenciesを省略していません。
`.env`やローカルのログはイメージへコピーしません。

## Kouへ依頼する情報

秘密値をGitHubへ貼らず、以下を確認してPRへ非秘密の結果だけ返してください。

| 確認したいこと | 必要な理由 |
| --- | --- |
| Studioで稼働中のcommit、未コミット修正の有無、起動手順 | 公開版だけの変更を移行で落とさないため |
| Render等でWeb Serviceを作成できるアカウントと、決まった公開origin | Worldと同一origin制御を新URLに合わせるため |
| public用World app/RPの設定・署名者が現在のconfigと一致しているか | local用の鍵をpublic用として移さないため |
| 既存環境変数の設定有無 | 下の必須設定を移行先へ入れるため。値はホストのSecret欄へ直接入力 |
| 買い手ウォレットの公開アドレス、テストUSDC残高、デモ署名予算 | 再発行せず、既存の資金と上限を引き継ぐため |
| 現在認証中／決済中のデモがないこと | 移行時に途中の状態を破棄しないため |

オンチェーンの資産・記録とリポの証拠JSONは残ります。旧サーバーのメモリ内セッション、
生proof、cookie、保留中の署名認可をPRへ吸い出す必要はありません。
旧セッションは完了させてから切り替え、新環境では新規デモ・Koe登録を行います。
旧APIと新APIの同時開催は、署名上限が別プロセスごとになるため避けてください。

## 移す設定

| 用途 | 環境変数 |
| --- | --- |
| 新デモ | `YOHAKU_EXPERIENCE_ENABLED=true` |
| World | `WORLD_IDKIT_DEMO_ENABLED=true`, `WORLD_IDKIT_DEPLOYMENT=public`, `WORLD_IDKIT_ORIGIN`, `WORLD_IDKIT_SIGNING_KEY` |
| 署名と上限 | `AGENT_PRIVATE_KEY`, `DEMO_SIGNS_PER_HOUR` |
| x402 | `X402_FACILITATOR_URL`, `X402_NETWORK`, `X402_ASSET`, `X402_PAYOUT_ADDRESS`, `X402_ASSET_NAME`, `X402_ASSET_VERSION`, `X402_ATOMIC_PER_UNIT`, `X402_EXPLORER_URL` |
| Intercepta | `INTERCEPTA_API_KEY`, `INTERCEPTA_BASE_URL`, `INTERCEPTA_SCAN_PATH`, `INTERCEPTA_AUTH_HEADER` |
| Jev | `JEV_API_KEY`, `JEV_BASE_URL`, `JEV_MODEL`, `YOHAKU_PROVIDER=jev`。model IDは現在使える値を引き継ぐ |
| ENS読取 | `SEPOLIA_RPC_URL`, `ENS_NAME`, `ENS_RESOLVER_ADDRESS`, `ENS_DELEGATE_ADDRESS` |
| 既存機能を残す場合 | OIDCの `WORLD_*` と任意のfee設定。callback/originが旧Studioを向かないよう照合 |

秘密値はサーバー専用です。`NEXT_PUBLIC_*`、`VITE_*`などの公開変数にはしません。
Worldの署名鍵、買い手の支払い鍵、APIキーは別のものです。移行で新しい鍵を生成する必要はありません。

## Renderでの作業手順

1. 対象PRをマージ。Web Serviceをリポから作成し、Docker runtimeとルートのDockerfileを指定。
2. 1インスタンス・スリープしない稼働条件を選択。プランと費用は所有者が確認して選ぶ。
   ヘルスチェックは `/health`。デモ中に再起動しないよう自動デプロイを止める。
3. 公開URLを確定し、`WORLD_IDKIT_ORIGIN`をそのoriginへ設定。末尾スラッシュ・pathは付けない。
   World Portal側のアプリURL／許可origin等も、新しい公開URLとの整合を確認する。
4. 上の非秘密設定とSecretを入力してデプロイ。ポートはホスト指定の`PORT`を使う。
5. `/health`でexperience・production IDKit・screening・classifier・settlementが有効なことを確認。
6. 別ブラウザで新規デモを開始し、World認証→委任報酬→本人回答報酬の2取引を確認。
   エクスプローラーまたはRPCで、金額と受取先を独立照合する。取消と未回答では送金しないことも確認。
7. 新URLを `docs/experience-origin.js`、`docs/koe/directory.json`のrouterとliveDirectory/registrationUrl、
   `docs/product.html`の稼働リンク、提出フォーム、README等へ反映。証拠JSONの過去のURLは変更しない。
   旧サーバーを止める。

Renderの新規URLはまだ未確定です。PRに架空のデプロイURLを記載していません。
この環境にはDocker CLIがないため、Dockerイメージ自体のビルド検証は移行先で必要です。

## 長期運用するなら

単一プロセスでも再起動で状態を失います。恒久的なアカウントや複数台の運用には、
DBでrun、回答、認証チャレンジ、支払い意図、送金結果を保持し、原子的な一度だけの処理を実装します。
支払いが不明なものはチェーンで照合し、元の認可を確認せず新規署名を作らない設計にします。
今のPRは大会用の一時セッションの移設であり、永続化を実装済みとはしていません。

## 公式確認先

- ETHGlobal Tokyo 2026: https://ethglobal.com/events/tokyo2026
- RenderのNodeサービス: https://render.com/docs/deploy-node-express-app
- Vercel Functionsの制限とWorkflowsへの案内: https://vercel.com/docs/functions/limitations

この日の公開情報とリポの実装に基づく移行案です。提出フォームの必須項目は未確認です。
