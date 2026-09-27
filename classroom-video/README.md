# STEP 教室間ビデオ通話（Issue #45 初版）

Fire HD 8 第10世代の神領校・大手町校2台を、1タップで固定ルームにつなぐ初版です。映像・音声は WebRTC P2P、認証・シグナリング・呼び出し通知は Cloudflare Worker / Durable Object を使用します。映像はサーバーを通りません（TURNリレーが必要な場合を除く）。

## 初版に含む機能

- ログイン・会議コードなしの「教室をつなぐ」ボタン
- 相手映像全画面、自分映像右下、360p〜480p・最大20fps
- マイク／カメラのON/OFF
- マイク状態に依存しない穏やかな呼び出し音、画面表示、確認応答、10秒クールダウン
- Wi-Fi瞬断、WebSocket・WebRTC切断時の自動再接続（1〜15秒の指数バックオフ）
- Wake Lock と Android `FLAG_KEEP_SCREEN_ON`
- 端末固定トークン、15分の署名済み接続チケット、HTTPS、秘密情報をリポジトリに保存しない構成
- PWAとFire OS用APKラッパー（同じ画面・同じバックエンド）

## Cloudflareへ配置

Node.js 22以降で実行します。

```bash
cd classroom-video
npm ci
npm test
npm run check
npx wrangler secret put DEVICE_TOKENS
npx wrangler secret put SESSION_SECRET
npx wrangler secret put ICE_SERVERS_JSON
npx wrangler deploy
```

`DEVICE_TOKENS` は次の形式です。各トークンは `openssl rand -hex 32` 等で個別に生成し、再利用しません。

```json
[
  {"id":"shinryo","name":"神領校","token":"64文字以上のランダム値"},
  {"id":"otemachi","name":"大手町校","token":"別の64文字以上のランダム値"}
]
```

`SESSION_SECRET` も32バイト以上のランダム値にします。`ICE_SERVERS_JSON` はSTUNだけで接続できない回線のためのTURN設定です。例（値はTURN事業者から取得）:

```json
[{"urls":["turn:turn.example.jp:3478?transport=udp","turns:turn.example.jp:443?transport=tcp"],"username":"端末用ユーザー","credential":"秘密値"}]
```

TURNなしでも同一Wi-Fiや一般的なNAT間では接続できますが、異なる回線で確実につなぐ完成条件にはTURNが必要です。TURN転送量には事業者の利用料金がかかります。設定後、UDPを遮断した回線でも `relay` candidate で映像・音声が継続することを確認してください。

## 端末への設定（初回だけ）

1. Fire HD 8を横向きにし、公開URLを開く。
2. カメラとマイクを許可する。
3. 端末IDと対応するトークンを入力し「この端末に保存」を押す。
4. PWAならブラウザの「ホーム画面に追加」を実行する。
5. 設定をやり直す場合だけ `https://公開URL/?setup=1` を開く。

管理者が直接セットアップする場合は一度だけ `https://公開URL/#device=shinryo&token=...` を開くこともできます。フラグメントはサーバーに送信されず、保存後すぐURLから消えます。トークンをメールやチャットに残さず、使用後は共有履歴を削除してください。

## APKへ切り替える場合

`android/app/build.gradle` の `APP_URL` を実際のWorker URLへ変更し、GitHub Actionsの **Build classroom video** からAPKを取得します。正式配布時は組織のkeystoreでrelease署名し、keystoreとパスワードはGitHub Secretsで管理してください。Fire端末では「不明なアプリのインストール」を一時的に許可してAPKを導入し、導入後は許可を戻します。

ブラウザ/PWAで5時間試験中に、画面消灯、カメラ停止、WebView終了が再現した場合はAPKを採用します。APKは全画面・横向き固定・画面点灯維持・戻るキー無効化を追加しています。ただし映像エンジンはFire OSのSystem WebViewを使うため、端末のSystem WebView更新も確認してください。

## 5〜8時間の実機受け入れ試験

各端末を給電し、バッテリー最適化対象外にして次を記録します。

1. 2台で接続し、映像・音声、マイクOFF、カメラOFF、両方向の呼び出しと確認を確認。
2. 30分後、片方のWi-Fiを20秒OFF→ON。操作なしで「接続済み」に戻り、音声・映像も戻ることを確認。
3. 2時間後と4時間後にも同じ瞬断試験を行う。
4. 最低5時間（本採用前は8時間推奨）連続し、画面消灯、音声停止、映像固着、端末過熱、メモリ不足による終了がないことを記録。
5. Cloudflare Workers Logsで認証失敗や例外を確認。トークンやチケットそのものはログへ記録しない。

ブラウザ版とAPK版を同じ条件で各1回実施し、停止回数が少ない方を採用します。重大停止が1回でもあれば合格にせず、発生時刻、画面状態、Wi-Fi状態、端末温度、復旧操作を残します。

## 現時点の制約

- 自動テストは認証・署名とビルド整合性までです。Fire HD 8実機2台のカメラ、回線、5〜8時間連続運転は現地での受け入れ試験が必要です。
- 初版UIは1対1用です。Durable Objectは複数端末を扱えますが、3〜4台の映像表示にはSFUまたは複数Peer接続の別実装が必要です。
- `ICE_SERVERS_JSON` の固定TURN資格情報は認証済み端末へだけ返しますが、端末から抽出可能です。本番ではTURN事業者の短期資格情報を推奨します。
