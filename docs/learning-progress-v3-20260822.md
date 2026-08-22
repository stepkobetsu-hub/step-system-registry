# ステップ＆ゴール進捗管理 V3 本番切替記録

更新日: 2026-08-22

## 結論

ステップ＆ゴール進捗管理は、2026-08-22に保存基盤をV3へ切り替えた。

- 本番URL: https://step-progress-api.stepkobetsu.workers.dev/
- Worker: `step-progress-api`
- 本番Version: **92**
- Version ID: `0503b822-cc27-4bcf-b15d-4ae16f8fcaed`
- Deployment ID: `7e1b40aa-7e63-48ee-8b23-339dd1df9690`
- 実装正本ブランチ: `agent/step-progress-v3-implementation`
- D1: `step-progress-db`
- V3モード: `d1-isolated-autosave`

## V3化の目的

旧構成では、画面が自動保存を行っていても、実際のブラウザー保存経路がGoogle Apps Scriptへ依存し、Cloudflare D1とのmirror / dual-write / syncも併存していた。そのため、進捗、目標範囲、宿題等で保存完了まで長く待つ、再ログイン・再読込後に値が戻る、クラウド未同期になる問題が繰り返し発生した。

V3では通常の編集状態の保存を単純化し、**Cloudflare WorkerからD1へ直接保存**する。

## V3でD1へ直接保存する項目

- 学習進捗
  - LCT
  - Point
  - WU
  - TRY
  - 周回
  - 学習日
- 目標範囲
- 宿題
  - 生徒完了
  - 対象なし
  - 講師確認
  - 宿題カードのアーカイブ

ログイン自体は既存Google認証を利用するが、ログイン後はV3セッションをD1へ保持し、通常保存のたびにGoogleへ認証確認しない。

未移行の管理系操作は既存Google APIへフォールバックする。宿題一覧は既存Google側の構造を利用しつつ、V3 D1に保存した編集状態を上書き表示する。

## D1分離方式

Cloudflare API tokenで新しいD1 databaseを作成する権限が不足していたため、既存 `step-progress-db` 内にV3専用テーブルを作り、旧本番テーブルと論理分離した。

主なV3テーブル:

- `v3_meta`
- `v3_sessions`
- `v3_progress_records`
- `v3_target_snapshot`
- `v3_target_overrides`
- `v3_homework_snapshot`
- `v3_homework_overrides`
- `v3_homework_group_archives`

旧本番テーブルは削除・初期化していない。旧Workerへ戻す場合の復旧データとして維持する。

## 最終データ移行

本番切替直前に旧本番テーブルからV3専用テーブルへ最新状態を再コピーした。

- 最終スナップショット: **2026-08-22 13:37:31 JST**
- 生徒: 34名
- 進捗: 1,267件
- 目標範囲: 7,011件
- 宿題: 2,271件
- テスト用 target override: 0件
- テスト用 homework override: 0件
- テスト用 archive override: 0件
- 一時セッション: 0件

1320で行ったスモークテストの変更は最終コピー時に消去済み。

## 自動保存と実測

- 進捗 debounce: 300ms
- 目標範囲 debounce: 350ms
- 保存ボタンを必須としない

1320のステージングスモークテストで「変更 → 保存 → 再読込 → 値が保持」を確認した。

| 対象 | サーバー処理 | 通信込み | 再読込保持 |
|---|---:|---:|---|
| 進捗 | 707ms | 979ms | OK |
| 目標範囲 | 889ms | 1,166ms | OK |
| 宿題 | 1,231ms | 1,452ms | OK |

3項目とも約2秒以内の目標を満たした。

## 目標範囲の再読込問題

V3検証中、目標範囲を保存しても再読込後の表示が一致しない問題があった。

主因は、旧ロジックが単元IDだけを主に使って対象判定しており、別教科・別教材シリーズの同一／類似IDや旧目標行が混在した場合にON状態が混ざることだった。また初期スモークテストが現在学年で画面に出ない古い単元を選ぶケースもあった。

対策:

- 目標・進捗の識別を原則 `教科 | 教材シリーズ | 単元ID` の複合キーに変更
- V3 overrideは同じ教科＋単元の旧行へ一括反映
- 進捗読込時も教材シリーズを付与
- スモークテストは1320の現在学年・有効教材・実画面に表示される単元だけを選択

この修正後、目標範囲の保存→再読込保持が成功した。

## 本番確認

本番切替後の読み取り専用診断で以下を確認した。

- 本番 `/health`: `ok=true`
- 本番 `mode`: `d1-isolated-autosave`
- 本番Version 92がtraffic 100%
- V3 stagingも正常
- 最終スナップショット時刻あり
- テストoverride 0件
- 一時セッション 0件

## staging

- Worker: `step-progress-v3-staging`
- URL: https://step-progress-v3-staging.stepkobetsu.workers.dev/
- V3の検証・比較用として残す

## ロールバック

V3直前の旧本番:

- Version: **91**
- Version ID: `7b84a8f6-3b25-4052-ab32-f02d6af55a51`
- メッセージ: `Persist homework checks after Google cloud save`
- 旧実装ブランチ: `agent/cloudflare-progress-migration`

V3は旧本番テーブルを削除していないため、重大問題時はWorkerコードをVersion 91または旧実装ブランチへ戻せる。V3テーブルを削除する必要はない。

## 次回の調査開始点

保存が遅い／戻るという報告が出た場合、最初に以下を確認する。

1. 本番 `/health` が `mode=d1-isolated-autosave` か
2. Cloudflare productionがVersion 92または後継V3 Versionか
3. `v3_progress_records` / `v3_target_overrides` / `v3_homework_overrides` へ書き込まれているか
4. 保存リクエストでGoogle Apps Script応答を待つ処理が再導入されていないか
5. 目標範囲は `教科 | 教材シリーズ | 単元ID` で判定しているか
6. まず1320等の限定データで再現し、全生徒総当たり検証はしない

## 保護事項

- 通常保存経路へ旧dual-write / mirror / 毎分syncの複雑さを戻さない
- 保存後にダッシュボード全件を再取得する設計へ戻さない
- パスワード、API token、セッショントークンの実値をGitHub・台帳へ記録しない
