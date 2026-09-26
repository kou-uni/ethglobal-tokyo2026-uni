# Studio：公開サーバーの常駐化（起動・停止・落ちたときの見方）

**2026-09-27 01:00 JST に切り替えました。** 公開サーバーは launchd の常駐サービスになり、
Claude Code のセッションや Antigravity IDE とは独立して動きます。

## なぜ変えたか

00:39 の公開反映で起動したサーバーは、**IDE の中の Claude Code セッションの子プロセス**でした。

```
Antigravity IDE (Electron) -> claude -> zsh -> npm -> node src/server/main.ts
```

セッションを閉じる、IDE を再起動する、そのコマンドを中断する——どれでも公開デモが一緒に落ちます。
Funnel の見張り (`funnel_watchdog.sh`) は「バックエンドが落ちているのは Funnel の故障ではない」と
判断して**意図的に手を出さない**設計なので、自動復旧もしません。大会当日に無人で落ちる経路でした。

## いまの構成

| | |
| --- | --- |
| サービス名 | `com.uni.yohaku` |
| 定義 | `~/Library/LaunchAgents/com.uni.yohaku.plist`（リポジトリ外。秘密値は含みません） |
| 起動コマンド | `node node_modules/.bin/tsx src/server/main.ts` |
| 作業ディレクトリ | `/Users/uni/ethglobal-tokyo2026-uni`（`.yohaku/*.json` が相対パスのため必須） |
| 設定値 | **すべて `.env` から**。plist が渡すのは `PATH` だけ |
| 自動再起動 | `KeepAlive` あり。落ちても約1秒で復帰（実測） |
| ログイン時 | `RunAtLoad` あり。Mac 再起動→ログインで自動復帰 |
| 標準出力 | `~/Library/Logs/yohaku-server.log` |
| 標準エラー | `~/Library/Logs/yohaku-server.err` |

**秘密値は plist に複製していません。** 稼働プロセスの環境変数を実測して確認したとおり、
アプリ設定36項目（Jev・Intercepta・World署名鍵・買い手鍵・x402・ENS ほか）は
すべて `.env` からアプリ自身が読み込んでいて、シェルから継承しているものは1つもありません。

## 操作

```sh
# 状態を見る
launchctl print gui/501/com.uni.yohaku | grep -E 'state =|pid =|last exit'

# 再起動（コード更新後はこれ。npm start を重ねて実行しないこと）
launchctl kickstart -k gui/501/com.uni.yohaku

# 本当に止める（KeepAlive があるので kill では止まりません）
launchctl bootout gui/501/com.uni.yohaku

# 止めたあと、また動かす
launchctl bootstrap gui/501 ~/Library/LaunchAgents/com.uni.yohaku.plist
```

**`kill` は効きません。** KeepAlive が約1秒で起動し直します。
止めたいときは `bootout`、入れ直したいときは `kickstart -k` を使ってください。

## 増えたリスク：落ちても静かになった

KeepAlive は**クラッシュを繰り返している状態を、外からは健康に見せます。**
以前はセッションの画面にエラーが出ていました。いまは出ません。疑わしいときは:

```sh
tail -40 ~/Library/Logs/yohaku-server.err
launchctl print gui/501/com.uni.yohaku | grep -E 'runs =|last exit'
```

**`runs` が増え続けていたら再起動ループです。** 反映直後は 1 です。

## 二重起動について

買い手鍵を使うプロセスは1つだけ、という制約は**この構成のほうが守りやすい**です
（同じラベルの launchd サービスは二重に起動できません）。ただし
**`npm start` を手で叩くと、常駐サービスと並んで2つ目が立ちます。** 叩かないでください。

## スリープ

Mac Studio は AC 電源のみで、`sleep 0` / `displaysleep 0` / `standby 0` / `disksleep 0`。
**設定としてスリープしません。** 特定の `caffeinate` プロセスには依存していません。

## Funnel の自動復旧

`~/.hermes/scripts/funnel_watchdog.sh`（launchd `com.uni.funnel-watchdog`、2分間隔）。
9/26 に、廃止済みの tailscaled ソケットを指していた不具合と、公開されている
**全ての ingress IP を個別に検査する**判定に書き換え済みです。#22 の TLS 切断はこれが原因でした。
