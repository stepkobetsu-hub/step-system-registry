# フォレスタ進捗管理 V3 高速化試験（2026-08-31）

> **この資料は本番移行前の途中経過です。** 2026-08-31にSupabase V3を通常URLの標準経路へ切り替え、本番移行は完了しました。現在の構成・データ移行・時間割同期・速度・ロールバックを含む最終引継ぎは `docs/foresta-progress-v3-production-20260831.md` を参照してください。

## 背景

通常授業用 `foresta-progress-v2` は、進捗・宿題・学校進度などの日常保存が Google Apps Script（GAS）経由になっており、保存完了待ちや保存後の画面再取得が体感速度を悪化させる構造が残っていた。

夏期に安定化した「ステップ＆ゴール進捗管理 V3」の履歴を再確認し、同じ原則を通常フォレスタ側へ適用する高速化試験を開始した。

## ステップ＆ゴール V3 から採用した原則

- 通常保存経路から GAS 待ちを外す。
- 認証後のセッションを高速ストア側へ保持し、毎回 Google 認証をやり直さない。
- 保存操作後にダッシュボード全体を同期再取得しない。
- 読み込み結果をスナップショット化し、2回目以降は即時表示する。
- ブラウザ側も stale-while-revalidate 方式で、手元キャッシュを即表示しながら裏で更新する。
- 冪等キーを使い、二重保存を防ぐ。
- Google 側は互換・移行期間のミラー先として残す。

## 2026-08-31 時点の構成

### 本番画面

- `https://stepkobetsu-hub.github.io/foresta-progress-v2/`
- 通常アクセスは従来経路のまま（V3高速化は既定OFF）。
- `?fastv3=1` を付けた場合だけ高速試験経路を有効化する。
- 高速経路が失敗した場合は従来 GAS API へ自動フォールバックする。

### 高速ランタイム

Supabase project `wisedgcgwaebtkprdhth` に Edge Function `foresta-runtime-v3-staging` を作成。

主なテーブル:

- `foresta_v3_sessions`
- `foresta_v3_dashboard_snapshots`
- `foresta_v3_progression_snapshots`
- `foresta_v3_reference_snapshots`
- `foresta_v3_mutations`
- `foresta_v3_metrics`

### 認証

- ログイン自体は既存 GAS を使用。
- 初回の高速ランタイム利用時に既存セッショントークンを GAS で検証し、その後はトークンの SHA-256 ハッシュをキーに Supabase 側セッションを利用する。
- 生トークン・パスワードは V3 テーブルへ保存しない制約を追加済み。

### 読み込み

高速スナップショット対象:

- `getStudentDashboard`
- `getProgression`
- `searchStudents`
- `getTeacherToday`
- `getHomeworkArchive`

ブラウザ側は `getStudentDashboard` / `getProgression` を `sessionStorage` に保持し、再読み込み時は手元キャッシュを先に表示して裏で更新する。

### 保存

試験対象の日常保存:

- 授業・進捗保存 (`saveLesson`)
- 授業訂正 (`updateLessonCorrection`)
- 学校位置 (`saveSchoolPosition`)
- テスト範囲 (`saveRange`)
- CT (`saveCt`)
- 生徒宿題チェック (`studentCheckHomework`)
- 講師宿題チェック (`teacherCheckHomework`)

高速経路では Supabase の mutation queue への耐久保存を先に完了し、画面を待たせず応答する。その後 `EdgeRuntime.waitUntil` で GAS へ同期する。

30秒以上残った `PENDING/ERROR` は、同じ生徒の次回認証済みアクセス時に最新の生トークンを使って再同期する。トークン自体は queue へ保存しない。

## 実測（ダミー 1320 / 2026-08-31）

認証済み smoke test を GitHub Actions から実施。

- ログイン: 約 2.54 秒（GAS、従来経路）
- ダッシュボード初回: 約 14.31 秒（GAS cache miss）
- ダッシュボード2回目: 約 0.57 秒（V3 cache hit）
- 進行表初回: 約 7.74 秒（GAS cache miss）
- 進行表2回目: 約 0.51 秒（V3 cache hit）
- 宿題チェック保存受付: 約 0.69 秒
- 同保存はバックグラウンドで GAS へ正常同期（`SYNCED`）確認済み。

したがって、保存受付と2回目以降の読み込みは「ステップ＆ゴール V3」級まで短縮できる見込みを確認した。一方、初回 cache miss は依然 GAS が律速であり、ここが次段階の主要課題。

## 次段階

1. `?fastv3=1` で実端末・ダミー生徒を使い、授業保存・宿題・進行表・範囲保存を連続確認する。
2. 初回表示の GAS 依存を減らすため、日常データを Supabase 側の正本へ段階移行する。
3. 静的な単元マスタ・学校範囲などは高速参照用スナップショットへ移す。
4. 安定確認後、V3高速経路を既定ONへ切り替える。
5. 旧 GAS 経路はロールバック用として一定期間残す。

## 安全策

- 通常URLは現時点では従来挙動のまま。
- 高速経路は query flag で明示的に有効化する。
- 高速ランタイム障害時は GAS へ自動フォールバックする。
- V3用テーブル名は `foresta_v3_*` に分離し、既存小学生 Supabase テーブルと衝突させない。
- smoke test 用関数は検証後に無効化済み。
