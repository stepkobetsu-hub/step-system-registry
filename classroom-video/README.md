# STEP 教室間ビデオ通話 v0.2（Issue #49）

Fire HD 8の神領校・大手町校端末を、1タップで固定ルームにつなぎます。v0.2はWebRTC meshで3台同時接続を正式対象とし、端末IDは各教室4台まで設定できます。映像・音声はWebRTC P2P、認証・シグナリング・呼び出し通知はCloudflare Worker / Durable Objectを使用します。

- 本番URL: `https://step-classroom-video.stepkobetsu.workers.dev/`

## v0.2に含む機能

- ログイン・会議コードなしの「教室をつなぐ」ボタン
- 参加端末ごとに独立したPeerConnectionを持つmesh接続と複数映像の同時表示
- 神領校 `jinryo-1`〜`jinryo-4`、大手町校 `otemachi-1`〜`otemachi-4`（表示名は教室名）
- APKのSharedPreferencesによる設定永続化、QRディープリンク、旧IDの自動移行
- 横向きimmersive fullscreen、7秒で隠れるオーバーレイ操作バー、通話中の設定画面
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
  {"id":"jinryo","name":"神領校","token":"64文字以上のランダム値"},
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

管理者が直接セットアップする場合は一度だけ `https://公開URL/#device=jinryo&token=...&hours=6` を開くこともできます。フラグメントはサーバーに送信されず、保存後すぐURLから消えます。トークンをメールやチャットに残さず、使用後は共有履歴を削除してください。

端末IDは `jinryo-1`〜`jinryo-4`、`otemachi-1`〜`otemachi-4` を使用します。既存の `shinryo` / `jinryo` / `otemachi` はそれぞれ `jinryo-1` / `otemachi-1` へ自動移行します。同じ教室の4台は既存の教室トークンを共有できますが、端末IDは重複させないでください。

## APKへ切り替える場合

`android/app/build.gradle` の `APP_URL` は本番Worker URLに固定済みです。GitHub Actionsの **Build classroom video** からAPKを取得します。正式配布時は組織のkeystoreでrelease署名し、keystoreとパスワードはGitHub Secretsで管理してください。Fire端末では「不明なアプリのインストール」を一時的に許可してAPKを導入し、導入後は許可を戻します。

APKを標準運用とします。全画面・横向き固定・通話中の画面点灯維持・戻るキー無効化に加え、WebViewのlocalStorageが消えてもSharedPreferencesから端末設定を復元します。WebViewは設定したWorkerと同一originへの遷移だけを許可し、カメラ／マイク権限もそのoriginの必要なリソースだけへ限定します。呼び出し音は `STREAM_ALARM` で再生し、アラーム音量が低い場合だけ最大の80%へ一時的に上げ、4.2秒後に元の値へ戻します。おやすみモードや端末ポリシーによる拒否は突破しません。

## 5〜12時間の実機受け入れ試験

各端末を給電し、バッテリー最適化対象外にして次を記録します。

1. `jinryo-1`、`jinryo-2`、`otemachi-1`の3台で接続し、3台すべてで相手2映像が同時表示されることを確認する。映像・音声、マイクOFF、カメラOFF、各方向の呼び出しと確認も確認する。
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

- 自動テストは認証・署名とビルド整合性までです。Fire HD 8実機3台のカメラ、回線、5〜12時間連続運転は現地での受け入れ試験が必要です。
- 端末IDは各教室4台まで発行できますが、v0.2の正式な同時通話受け入れ対象は3台です。4台以上の同時映像では端末負荷を実機評価し、必要ならSFUへ移行します。
- `ICE_SERVERS_JSON` の固定TURN資格情報は認証済み端末へだけ返しますが、端末から抽出可能です。本番ではTURN事業者の短期資格情報を推奨します。
