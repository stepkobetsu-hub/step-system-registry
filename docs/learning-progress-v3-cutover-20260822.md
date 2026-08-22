# ステップ＆ゴール進捗管理 V3 本番切替記録（2026-08-22）

## 結論

2026年8月22日、従来の Google Apps Script を通常保存の同期経路に含む構成から、Cloudflare Worker + D1 を通常の読込・保存の正本とする V3 へ本番切替した。

本番利用者向けURLは変更しない。

- 本番URL: https://step-progress-api.stepkobetsu.workers.dev/
- Worker: `step-progress-api`
- D1: `step-progress-db`
- D1 database ID: `028f097c-2609-4bf7-9e9b-39b565606941`
- V3実装ブランチ: `agent/step-progress-v3-implementation`
- V3本番Version: `9b0443f2-5ad1-4827-8743-92f3671c9294`
- 旧Google経由版へのロールバック候補Version: `7b84a8f6-3b25-4052-ab32-f02d6af55a51`

## V3化の目的

従来は画面側に自動保存処理が存在していても、通常のブラウザー保存が Google Apps Script の応答や D1 ミラー・同期処理と絡み、進捗・宿題・目標範囲の保存完了まで長く待つ、再読込すると古い値へ戻る、端末保存済み・クラウド未同期になる、といった問題が繰り返し発生した。

V3では「入力 → Cloudflare Worker → D1保存」を通常経路とし、ユーザーの保存完了判定を Google Apps Script の応答待ちから切り離した。

## 正本データと保存方式

V3の通常画面では D1 を正本として扱う。既存 `step-progress-db` の中に V3 専用テーブルを設け、旧テーブルを残したまま論理的に分離した。

V3専用テーブル:

- `v3_meta`
- `v3_sessions`
- `v3_progress_records`
- `v3_target_snapshot`
- `v3_target_overrides`
- `v3_homework_snapshot`
- `v3_homework_overrides`
- `v3_homework_group_archives`

通常の進捗・目標範囲・宿題操作は V3 D1 へ直接保存する。Google Apps Script はログイン時の既存認証、参照・互換用途として残すが、通常保存成功を Google 応答待ちにはしない。

## 認証

既存ログイン方式との互換性を維持するため、初回ログイン時は既存 Google Apps Script 認証を利用できる。ログイン成功後のセッションは V3 側の D1 に保持し、通常の各保存リクエストごとに Google の `getSession` へ戻らない。

パスワード、セッショントークン、APIキー等の実値は本台帳へ記録しない。

## 自動保存

- 進捗入力 debounce: 300ms
- 目標範囲 debounce: 350ms
- 画面操作は楽観的に即時反映
- 保存処理は変更をまとめて D1 へ送る
- 必須の「保存」ボタンに依存しない

## 目標範囲の再読込不具合と最終修正

V3検証中、目標範囲はD1へ保存できているのに、再読込時に元へ戻ったように見えるケースがあった。

原因は、目標範囲の同一性判定へ旧データの教材シリーズ表記まで含めていたため、保存した単元と再読込時の単元が別キー扱いになる場合があったこと。

`units.unit_id` はDB上で一意であるため、V3では目標範囲のON/OFF判定を `unit_id` を中心に行うよう簡略化した。これにより、保存後の再読込でも同じ単元へ確実に反映される。

## 1320 スモークテスト

ダミー生徒 `1320` を使用して、進捗・目標範囲・宿題の3操作を実際のV3 APIで保存し、再読込後も保持されることを確認した。

最終測定:

| 操作 | Worker内保存時間 | 通信を含む測定 | 再読込確認 |
|---|---:|---:|---|
| 進捗 | 707ms | 979ms | 成功 |
| 目標範囲 | 889ms | 1,166ms | 成功 |
| 宿題 | 1,231ms | 1,452ms | 成功 |

3項目とも目標としていた約2秒以内を満たした。

## 本番切替前の最終データコピー

本番切替直前に、旧正本側の現行データを V3 専用スナップショットへ再コピーし、テスト中に作成した V3 差分・セッションを消去してから本番化した。

最終スナップショット:

- 時刻: `2026-08-22T04:42:35.627Z`
- 生徒: 34名
- 進捗: 1,267件
- 目標範囲: 7,011件
- 宿題: 2,271件
- コピー処理: 364ms

細かな旧データの完全セル単位照合は行わず、現行データを大きく保持したうえで高速・安定保存を優先した。

## 本番切替

GitHub Actions の一時切替Workflowで以下を実施した。

1. 旧本番のCloudflare Deployment / Version一覧を記録
2. V3最終スナップショットを作成
3. `step-progress-api` へV3コードをデプロイ
4. `/health` が `ok=true` かつ `mode=d1-isolated-autosave` になることを確認
5. 新本番Versionを記録

切替実行:

- GitHub Actions run: `32552388919`
- V3本番Version: `9b0443f2-5ad1-4827-8743-92f3671c9294`
- 本番Deployment ID: `509b9dbb-178a-4cf9-bd19-ebc82293e2d5`

## ロールバック

V3に重大な問題が出た場合は、旧Google経由版のCloudflare Worker Version:

`7b84a8f6-3b25-4052-ab32-f02d6af55a51`

を `step-progress-api` の traffic 100% へ戻す候補とする。

V3専用テーブルは旧テーブルと分離しているため、旧版へ戻す際にV3テーブルを削除する必要はない。D1全体のロールバックや削除は行わない。

## 主要ソース

- `cloudflare/src/v3.ts`: V3 Worker本体
- `cloudflare/src/dashboard.ts`: D1から画面データを構成
- `cloudflare/public/index.html`: 現行UI
- `cloudflare/scripts/apply-v3-runtime-fastpath.mjs`: 通常保存時の不要な初期化確認を外すV3高速経路
- `cloudflare/scripts/apply-v3-autosave.mjs`: 自動保存debounce調整
- `cloudflare/wrangler.v3.production.jsonc`: 本番 `step-progress-api` 用設定
- `cloudflare/wrangler.v3.template.jsonc`: V3ステージング用設定
- `.github/workflows/cutover-step-progress-v3.yml`: V3切替用。切替完了後は `workflow_dispatch` の手動実行のみ
- `.github/workflows/deploy-step-progress-v3-staging.yml`: ステージング用。自動PR実行は停止し手動実行のみ

## 通知対策

検証中に GitHub Actions の失敗通知メールが複数届いたため、検証・切替完了後は staging / cutover の双方を `workflow_dispatch` の手動実行だけに変更した。

切替用PR #15 はトリガー専用であり、mainへマージせず閉じた。

## 次回の調査開始点

保存が遅い・保存後に戻る場合は、Google Apps Scriptの速度調査から始めない。次の順で確認する。

1. 本番 `/health` が `mode=d1-isolated-autosave` か
2. `cloudflare/src/v3.ts` の対象保存actionが D1 経路を使っているか
3. `v3_progress_records` / `v3_target_overrides` / `v3_homework_overrides` の該当行
4. 画面再読込が `getStudentDashboard` の V3 D1 読込になっているか
5. 目標範囲は `unit_id` で同一性判定しているか

通常保存経路へ Google 同期待ち、毎回の全件再読込、毎回のスキーマ初期化、旧 dual-write / mirror / cron 同期の複雑さを再導入しない。

## 確認日

2026-08-22
