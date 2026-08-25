# 出退くん Fireアプリ

Amazon Fireタブレット向けのWebViewラッパーを再生成するための正本です。

- アプリ名: 出退くん
- バージョン: 1.0.2
- package: jp.stepkobetsu.shuttaikun.fire
- minSdk: 22（Fire OS 5系を対象）
- 読取先: https://step-checkin-edge-staging.stepkobetsu.workers.dev/legacy-tablet
- アイコン正本: `shuttaikun-icon.svg`

`.github/workflows/build-fire-app.yml` でAPKを生成し、`downloads/Shuttaikun-Fire-v1.0.2.apk` と旧直リンク互換用 `downloads/Dekakun-Fire-v1.0.1.apk` を同じ新APKへ更新します。
