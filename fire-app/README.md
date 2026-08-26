# 出退くん Fireアプリ

Amazon Fireタブレット向けのWebViewラッパーを再生成するための正本です。5時間操作・QR読取がなければWeb側がカメラを停止し、アプリ側は画面点灯維持を解除します。画面タップで両方を再開します。

- アプリ名: 出退くん
- バージョン: 1.0.3
- package: jp.stepkobetsu.shuttaikun.fire
- minSdk: 22（Fire OS 5系を対象）
- 読取先: https://step-checkin-edge-staging.stepkobetsu.workers.dev/legacy-tablet
- アイコン正本: `shuttaikun-icon.png`（ユーザー承認済み画像を無加工で使用）

`.github/workflows/build-fire-app.yml` でAPKを生成し、`downloads/Shuttaikun-Fire-v1.0.3.apk` と旧直リンク互換用 `downloads/Dekakun-Fire-v1.0.1.apk` を同じ新APKへ更新します。

ビルド時は正本PNGをリサイズ、切り抜き、SVG化せず、そのままAndroid launcher iconとインストール案内ページへコピーします。
