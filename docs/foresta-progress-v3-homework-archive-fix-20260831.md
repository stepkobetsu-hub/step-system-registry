# フォレスタ進捗管理 V3 宿題アーカイブ・講師ボタン修正（2026-08-31）

## 対象

- 本番URL: https://stepkobetsu-hub.github.io/foresta-progress-v2/
- 本番コミット: `13cfb846bbab29775e0b5a2ad9ad587e7ef9dd18`
- PR: `#9 Fix homework archive and split teacher action buttons`
- Supabase project: `wisedgcgwaebtkprdhth`
- 追加 Edge Function: `foresta-homework-adjust-v3` v1

## 発生していた不具合

1. 完了宿題をアーカイブした直後に「宿題アーカイブ」を開くと、`アーカイブされた宿題はありません。` と表示される場合があった。
2. 講師画面の `宿題・進行表を訂正` は旧 `getLessonCorrections` / 授業履歴に依存しており、小学生・Supabase V3移行後の運用と噛み合わず、`訂正できる授業記録はありません。` になっていた。

## 原因

V3の `archiveHomework` / `restoreHomework` は、まず `foresta_v3_mutations` へ保存要求を受け付けて利用者へ応答し、その後バックグラウンドでGASへミラーし、最後にスナップショットを再生成していた。

そのため、保存受付直後に `getHomeworkArchive` を読むと、まだ古い `foresta_v3_snapshots` を読む時間差があった。UIの待ち時間不足ではなく、**保存受付と読込モデル更新の順序**が原因だった。

## 修正

### アーカイブ・復元

`foresta_v3_mutations` へ archive / restore / delete を登録する同一DBトランザクション内で、次のスナップショットを先に更新するトリガーを追加した。

- `getStudentDashboard`
- `getHomeworkArchive`

これにより、アーカイブ受付が成功した時点でアーカイブ画面にも反映済みとなる。GASミラーは従来どおり非同期で継続し、画面を待たせない。

同じ mutation UUID が再送された場合の二重処理を防ぐため、トランザクションロックと既存mutation確認も維持する。

### 次回宿題を確認・調整

旧授業訂正履歴を使う方式を講師ツールバーから外した。

新しい講師操作:

- **次回宿題を確認・調整**: オレンジ系ボタン
- **進行表を開く**: 青緑系ボタン

小学生・中学生の両方へ適用。

`次回宿題を確認・調整` は現在選択中の科目だけを対象にし、講師から出した通常宿題をチェック式で確認・調整する。自主学習で自動作成された宿題は対象外。

調整結果は `foresta_v3_homework_overrides` へ保存し、Googleの旧授業履歴には依存しない。隠した宿題は通常のV3ダッシュボードスナップショットから除外し、再表示も可能。スナップショットがGASミラー等で再生成されても、DBトリガーがoverrideを再適用する。

## 本番検証

### 1001（ダミー）

DBトランザクション内に一時的な完了宿題を作成してROLLBACK試験。

- archive後: active `0` / archive `1`
- restore後: active `1` / archive `0`
- 最後にROLLBACKし、試験データを残していない。

### 1320（ダミー）

既存の英語講師宿題1件を使い、次回宿題調整を実データで確認。

- 非表示保存: `hiddenCount=1`
- ダッシュボードから該当宿題が消える: visible `0`
- override保存: `1`
- 再表示: `restoredCount=1`
- ダッシュボードへ復帰: visible `1`
- override: `0`
- 最終的に元状態へ復帰済み。

### 1180（実生徒）

書き込みなし。READ ONLYで `算数` + `国語` の受講科目を再確認。

## テスト・公開

- `node --check app.js`: 成功
- `node --check v3-homework-ui-fix.js`: 成功
- `node --check elementary-supabase.js`: 成功
- Apps Script構文確認: 成功
- `npm test`: 全件成功
- GitHub Pages build: 成功
- GitHub Pages deploy: 成功
- Supabase `foresta-homework-adjust-v3` v1: ACTIVE

## 保守上の注意

- archive / restore の即時反映を、任意の数秒待ちや同期GAS呼出しへ戻さない。
- `宿題・進行表を訂正` の旧講師ボタンを復活させない。
- 次回宿題調整は選択中科目だけを対象とする。
- 旧GASは `?legacy=1` の緊急ロールバック経路として残すが、通常運用の宿題調整はSupabase V3を正本とする。
