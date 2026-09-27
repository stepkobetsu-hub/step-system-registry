# STEP 教室間ビデオ通話（Issue #45 初版）

Fire HD 8 第10世代の神領校・大手町校2台を、1タップで固定ルームにつなぐ初版です。映像・音声は WebRTC P2P、認証・シグナリング・呼び出し通知は Cloudflare Worker / Durable Object を使用します。映像はサーバーを通りません（TURNリレーが必要な場合を除く）。

- 本番URL: `https://step-classroom-video.stepkobetsu.workers.dev/`

## 初版に含む機能

- ログイン・会議コードなしの「教室をつなぐ」ボタン
- 相手映像全画面、自分映像右下、360p〜480p・最大20fps
- マイク／カメラのON/OFF
- マイク状態に依存しない穏やかな呼び出し音、画面表示、確認応答、10秒クールダウン。APKでは通話のメディア音量と分離したアラーム音量を使用
- Wi-Fi瞬断、WebSocket・WebRTC切断時の自動再接続（1〜15秒の指数バックオフ）
- Wake Lock と Android `FLAG_KEEP_SCREEN_ON`
- 5〜12時間から選べる連続動作時間（標準6時間）と、終了後にカメラ・マイク・WebRTC・WebSocket・Wake Lockを解放する休止画面
- 休止状態と終了予定時刻を端末に保存し、翌日／プロセス再起動後も自動復帰せず、全画面1タップで新しい運転を開始
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
npx wrangler secret put TURN_KEY_ID
npx wrangler secret put TURN_KEY_API_TOKEN
npx wrangler deploy
```

`DEVICE_TOKENS` は次の形式です。各トークンは `openssl rand -hex 32` 等で個別に生成し、再利用しません。

```json
[
  {"id":"shinryo","name":"神領校","token":"64文字以上のランダム値"},
  {"id":"otemachi","name":"大手町校","token":"別の64文字以上のランダム値"}
]
```

`SESSION_SECRET` も32バイト以上のランダム値にします。本番ではCloudflare TURNキーのIDを `TURN_KEY_ID`、APIトークンを `TURN_KEY_API_TOKEN` に保存します。Workerが認証済み端末ごとに有効期間13時間の短期ICE資格情報を生成し、長期TURNキーを端末へ渡しません。ブラウザでタイムアウトしやすい53番ポートはWorker側で除外します。

`ICE_SERVERS_JSON` は緊急時の代替TURN設定用で、本番のCloudflare TURN利用時は `[]` を設定します。別TURN事業者へ切り替える場合の形式:

```json
[{"urls":["turn:turn.example.jp:3478?transport=udp","turns:turn.example.jp:443?transport=tcp"],"username":"端末用ユーザー","credential":"秘密値"}]
```

TURNなしでも同一Wi-Fiや一般的なNAT間では接続できますが、異なる回線で確実につなぐ完成条件にはTURNが必要です。TURN転送量には利用料金がかかる場合があります。設定後、UDPを遮断した回線でも `relay` candidate で映像・音声が継続することを確認してください。

## 端末への設定（初回だけ）

1. Fire HD 8を横向きにし、公開URLを開く。
2. カメラとマイクを許可する。
3. 端末ID、対応するトークン、連続動作時間（5〜12時間、標準6時間）を入力し「この端末に保存」を押す。
4. PWAならブラウザの「ホーム画面に追加」を実行する。
5. 設定をやり直す場合だけ `https://公開URL/?setup=1` を開く。

管理者が直接セットアップする場合は一度だけ `https://公開URL/#device=shinryo&token=...&hours=6` を開くこともできます。フラグメントはサーバーに送信されず、保存後すぐURLから消えます。トークンをメールやチャットに残さず、使用後は共有履歴を削除してください。

## APKへ切り替える場合

`android/app/build.gradle` の `APP_URL` は本番Worker URLに固定済みです。GitHub Actionsの **Build classroom video** からAPKを取得します。正式配布時は組織のkeystoreでrelease署名し、keystoreとパスワードはGitHub Secretsで管理してください。Fire端末では「不明なアプリのインストール」を一時的に許可してAPKを導入し、導入後は許可を戻します。

ブラウザ/PWAで連続試験中に、画面消灯、カメラ停止、WebView終了が再現した場合はAPKを採用します。APKは全画面・横向き固定・通話中の画面点灯維持・戻るキー無効化を追加しています。WebViewは設定したWorkerと同一originへの遷移だけを許可し、カメラ／マイク権限もそのoriginの必要なリソースだけへ限定します。呼び出し音は `STREAM_ALARM` で再生し、アラーム音量が低い場合だけ最大の65%へ一時的に上げ、3.5秒後に元の値へ戻します。おやすみモードや端末ポリシーによる拒否は突破せず、画面通知で補完します。ただし映像エンジンはFire OSのSystem WebViewを使うため、端末のSystem WebView更新も確認してください。

## 5〜12時間の実機受け入れ試験

各端末を給電し、バッテリー最適化対象外にして次を記録します。

1. 2台で接続し、映像・音声、マイクOFF、カメラOFF、両方向の呼び出しと確認を確認。接続から時間が経った状態でも、画面通知だけでなく呼び出し音が確実に鳴ることを確認する。
   - メディア音量を小さくした状態と0に近い状態で、アラーム系の呼び出し音が聞こえること。
   - アラーム音量を低くして呼び出し、実用的な音量で鳴った後に元のアラーム音量へ戻ること。
   - おやすみモード等で音が禁止される場合も、大きな呼び出し表示・穏やかな点滅・確認ボタンが残ること。
2. 30分後、片方のWi-Fiを20秒OFF→ON。操作なしで「接続済み」に戻り、音声・映像も戻ることを確認。
3. 2時間後と4時間後にも同じ瞬断試験を行う。
4. 標準6時間で開始し、到達時にカメラ・マイクの利用表示が消え、通信が終了して「休止中」へ移ることを確認する。アプリを終了・再起動しても休止中のままであることを確認する。
5. 翌日、休止画面全体を1回タップし、追加ログインなしで「接続準備中」から接続済みへ戻り、新しい6時間タイマーが始まることを確認する。
6. 必要に応じて5時間と12時間の設定保存も確認し、画面消灯、音声停止、映像固着、端末過熱、メモリ不足による終了がないことを記録する。
7. Cloudflare Workers Logsで認証失敗や例外を確認。トークンやチケットそのものはログへ記録しない。

ブラウザ版とAPK版を同じ条件で各1回実施し、停止回数が少ない方を採用します。重大停止が1回でもあれば合格にせず、発生時刻、画面状態、Wi-Fi状態、端末温度、呼び出し音の有無、復旧操作を残します。

## 現時点の制約

- 自動テストは認証・署名とビルド整合性までです。Fire HD 8実機2台のカメラ、回線、5〜12時間連続運転は現地での受け入れ試験が必要です。
- 初版UIは1対1用です。Durable Objectは複数端末を扱えますが、3〜4台の映像表示にはSFUまたは複数Peer接続の別実装が必要です。
- `ICE_SERVERS_JSON` の固定TURN資格情報は認証済み端末へだけ返しますが、端末から抽出可能です。本番ではTURN事業者の短期資格情報を推奨します。
