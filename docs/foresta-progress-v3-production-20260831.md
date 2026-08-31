# フォレスタ進捗管理 V3 本番移行・高速化 完全引継ぎ資料

最終更新: 2026-08-31
状態: **V3本番稼働中（Supabase標準経路／旧GASロールバック可）**
台帳ID: `foresta-progress-v2`

## 1. 現在の結論

通常授業用「フォレスタ進捗管理」は、2026-08-31に従来の **GitHub Pages → Google Apps Script → Google Sheet** 中心の構成から、**GitHub Pages → Supabase V3** を通常の読込・保存経路とする構成へ切り替えた。

- 本番URL: https://stepkobetsu-hub.github.io/foresta-progress-v2/
- 本番GitHub: https://github.com/stepkobetsu-hub/foresta-progress-v2
- 本番ブランチ: `main`
- 本番切替コミット: `7ae277815d380eb3a07504593c0fd43f677e8f1a`
- 本番Supabase project: `wisedgcgwaebtkprdhth`
- 本番Edge Function: `foresta-runtime-v3`（v4確認）
- Apps Script: v17確認
- 緊急ロールバック: 通常URL末尾に `?legacy=1` を付けると旧GAS経路を使用
- 旧Google Sheet・旧GASは削除せず、移行期間の互換・復旧用として保全

通常アクセスでは `?fastv3=1` は不要。V3が既定ONになっている。V3障害時に自動でGASへ戻る仕様にはせず、意図しない旧経路復帰を防ぐため、運用者が明示的に `?legacy=1` を付けた場合だけ旧経路を使う。

## 2. 本番切替前の旧構成

2026-08-15に通常授業用フォレスタを新規構築した時点では次の構成だった。

```text
ブラウザー
  ↓
GitHub Pages
  ↓
Google Apps Script Web API
  ├─ 認証
  ├─ 読込
  ├─ 保存
  ├─ 生徒・時間割マスタ参照
  └─ 講師マスタ参照
       ↓
専用Google Sheet（授業・進捗・宿題・CT・目標・コメント等）
```

この方式は機能面では動いていたが、授業保存・宿題・目標範囲・アーカイブ等で「保存を待たされる」「保存完了表示後に再ログインすると元へ戻る」「端末保存済み・クラウド未同期」等が繰り返し発生した。

旧専用保存Sheetは `フォレスタ進捗管理 v2 保存データ（新規構築 2026-08-15）`。授業記録、授業実施単元、CT、学校進度、宿題、生徒・講師チェック、目標点、コメント、注意事項、操作履歴等を保存していた。2026-08-23には `生徒周回進捗` を追加し計22シートとなった。

## 3. V3移行前までに行った機能改善

高速化とは別に、8月中に以下を本番へ反映していた。V3移行時もこれらを維持することを必須条件とした。

- 生徒・講師・管理者の役割別画面。
- 講師の生徒検索を漢字・ひらがな・カタカナ・ローマ字対応。
- 複数生徒タブ切替。
- 進行表、学校現在地、テスト予想範囲・決定範囲、CT、宿題、目標点、講師コメント、注意事項。
- 1〜3周目の進捗記録と日付保存。
- 100%=1周目、200%=2周目、300%=3周目の周回進捗表示。
- テスト範囲外単元を確認付きで入力可能。
- 2周目以降の宿題自動作成。
- 宿題の生徒チェック → 講師チェック → 完了の流れ。
- 宿題アーカイブ・復元。
- 生徒宿題は全科目表示、講師宿題は現在選択中の授業科目だけ表示。
- 宿題は新しいものを上に表示。
- 小学生画面で「科目／担当講師」を学校単元テスト欄より上へ移動。
- 小学生の科目選択・担当講師選択を保存後／再読込後も維持。
- 小学生の宿題でTRY赤×直し・exercise等の既定宿題を講師が外して保存できる仕様。
- 小学生の自由記述宿題。
- 小学生の進捗保存は既存の `elementary-progress` Supabase Edge Functionを利用する方式へ先行移行し、通常フォレスタV3とは別系統として壊さない方針を採用。

## 4. 受講科目キャッシュ問題と「時間割マスタ正本」への変更

V3移行前、1180 飯田杏について、実際の時間割では **算数＋国語** なのに画面上で国語しか出ない問題が発生した。

調査結果:

- `時間割マスタ` には算数と国語が存在していた。
- 問題は `時間割マスタ` の読み方ではなく、専用保存Sheetの `受講科目キャッシュ` が古く、国語のみになっていたこと。
- 1180の算数をキャッシュへ補正し、他にも時間割とキャッシュがずれていた小学生を同期した。
- 一時対策として `時間割マスタ → 受講科目キャッシュ` の定期補正も設定した。
- GitHub側のApps Scriptソースも、受講科目取得時にキャッシュより時間割の生データを優先するよう変更した。

ただし、V3本番ではこの旧キャッシュ運用自体を終了方向とし、**`★生徒マスタ202606- / 時間割マスタ` を正本、Supabaseの `foresta_v3_enrollments` を高速参照先**とする構成へ変更した。

現在の時間割同期仕様:

- 正本: Google Sheet `時間割マスタ`
- A列: 生徒ID
- E:AB列: 受講科目
- AO列: 英語レベル
- AP列: 数学レベル
- Supabase格納先: `foresta_v3_enrollments`
- 同期状態: `foresta_v3_sync_status`
- 同期は全件を検証してから1トランザクションで置換。
- 取得・検証・DB更新のどこかで失敗した場合、前回正常値を保持する。
- 1180が算数＋国語でないデータはDB側で同期全体を拒否する安全条件を設定。
- 管理者の旧「受講科目更新」はV3の強制同期へ置換。
- 定期同期は15分単位の設計。再試行は1・2・4・8・15分のバックオフを想定。

## 5. Codexへ依頼する前に行った高速化調査

2026-08-31、先に安定化していた「ステップ＆ゴール進捗管理 V3」の構造を再調査し、通常フォレスタの遅さが単なる通信速度ではなく**保存・読込の設計**にあると判断した。

旧 `app.js` では、日常APIが基本的にGASへPOSTされ、授業保存後にキャッシュを捨て、画面を閉じた後さらに `openView("selected")` でダッシュボードを丸ごと再取得していた。つまり「保存そのもの」だけでなく「保存後の全再読込」まで利用者が待つ構造だった。

採用したV3原則:

- 通常保存でGAS完了を待たない。
- 認証済みセッションを高速側で保持し、毎回Googleへ再認証しない。
- 保存後にダッシュボード全体を同期再取得しない。
- 読込スナップショットを持つ。
- ブラウザは stale-while-revalidate で手元キャッシュを先に表示。
- mutation ID / idempotency keyで重複保存を防止。
- Googleは移行中の互換・ミラー・復旧先に限定する。

## 6. Codex前に作成したSupabase V3試験ランタイム

本番切替前に `foresta-runtime-v3-staging` を作り、既存通常URLを壊さない状態で `?fastv3=1` の明示ON試験を行った。

当時の主な試験テーブル:

- `foresta_v3_sessions`
- `foresta_v3_dashboard_snapshots`
- `foresta_v3_progression_snapshots`
- `foresta_v3_reference_snapshots`
- `foresta_v3_mutations`
- `foresta_v3_metrics`

試験版で行ったこと:

- GASログイン後のトークンをSHA-256ハッシュ化し、Supabase側セッションを利用。
- 生トークン・パスワードをDBへ保存しない。
- DB制約でも `token` / `password` / `adminToken` を保存できないよう保護。
- ダッシュボード、進行表、生徒検索、講師本日、生徒宿題アーカイブをスナップショット化。
- `sessionStorage` を使ったブラウザSWR。
- 授業、訂正、学校位置、範囲、CT、生徒宿題チェック、講師宿題チェック等をmutation queueへ先に受付。
- バックグラウンドでGASへミラー。
- PENDING/ERRORが残った場合、次の認証済みアクセスで再試行。
- queueへ生トークンを保存しない。

### 試験実測（ダミー1320）

- GASログイン: 約2.54秒
- ダッシュボード初回cache miss: 約14.31秒
- ダッシュボードcache hit: 約0.57秒
- 進行表初回cache miss: 約7.74秒
- 進行表cache hit: 約0.51秒
- 宿題チェック保存受付: 約0.69秒
- 保存後のGASミラー: 約2.2秒でSYNCED確認

この段階で「2回目以降の読込」と「保存受付」は十分速くなったが、**初回読込がまだGASを呼ぶため7〜14秒かかる**ことが残課題となった。

## 7. Codex前に本番へ入れた安全な試験コード

試験版クライアントを本番Pagesへ入れたが、当初は通常利用へ影響しないよう `?fastv3=1` の時だけ有効とした。

- 本番mainに試験クライアントを入れた時点のコミット: `99737f646ee07b3c6b025a7180314b439252d68b`
- 通常URL: 従来GAS
- `?fastv3=1`: Supabase高速試験
- 高速試験失敗時: 当時はGASへ自動フォールバック

この段階の目的は「現行運用を壊さずにV3経路を実測すること」であり、まだSupabaseを正本にはしていなかった。

## 8. 本番移行を決定した理由

初回cache missがGAS律速のままでは、キャッシュが無い端末や初回授業で遅さが残る。そのため、単なるキャッシュ追加ではなく、**日常読込に必要なデータをSupabaseへ事前生成し、通常の読込・保存をSupabase中心にする**ことを決定した。

本番移行の条件:

1. 現在のGoogleデータを失わずSupabaseへ移す。
2. 通常画面の初回読込をGoogle待ちにしない。
3. 通常保存をSupabaseへ先に受け付ける。
4. GAS反映は非同期化する。
5. 再試行と冪等化を必須にする。
6. `時間割マスタ` を受講科目の正本にする。
7. 旧GAS／Googleデータはロールバック用に残す。
8. 小学生既存Supabaseデータを壊さない。

## 9. Codex PR #8 で行った本番実装

PR: https://github.com/stepkobetsu-hub/foresta-progress-v2/pull/8

Codexへ「調査だけで止めず、本番移行・データ移行・同期・テスト・ロールバックまで完了する」条件で依頼した。途中、Codex Cloud Environmentの外部接続制限があったため、Environmentをインターネット無制限・全HTTPメソッドへ変更して再実行した。

主な実装:

- `foresta-runtime-v3` を本番Edge Function化。
- `foresta-timetable-sync` を追加。
- `foresta_v3_snapshots` を本番読込モデルとして導入。
- `foresta_v3_entities` をV3エンティティ格納用として導入。
- `foresta_v3_mutations` を耐久保存キューとして導入。
- `foresta_v3_migrations` と `foresta_v3_quarantine` を導入。
- `foresta_v3_enrollments` / `foresta_v3_sync_status` を導入。
- V3テーブルはRLSを有効化し、ブラウザのanon/authenticatedから直接アクセスできないようにし、service role Edge Function経由に限定。
- セッションは生トークンではなくハッシュで保存。
- mutation IDで再送時の重複処理を防止。
- GAS側へ `exportSnapshotsV3` / `applyMutationV3` 等を追加。
- GAS側のミラーでもmutation IDを記録し、同じmutationの二重反映を防止。
- 保存失敗時は `failed`、`last_error`、`next_attempt_at` を保持し指数バックオフで再試行。
- 通常アクセス時にも残キューを回収。
- 保存後は対象生徒のスナップショットを再生成。

最終実装コミット:

- `7ae277815d380eb3a07504593c0fd43f677e8f1a` — `Implement Supabase snapshot and save queue workers`

## 10. 本番データ生成・移行結果

公開切替前に現在の生徒データから読込用スナップショットを生成した。

- 時間割上の在籍ID: 77
- 正常生成: 75名
- 生成スナップショット: 289件
- 1205 / 1317: 時間割にIDだけ残り、氏名空欄かつ旧GASの有効生徒に存在しないため `quarantine` へ隔離
- 1180: **算数・国語** の両方を読込確認。実データは変更せずREAD ONLY検証

1205 / 1317はV3処理失敗ではなく、元マスタ側に有効生徒情報がない不整合として隔離したもの。元マスタを直す場合は、その後の時間割同期で再評価する。

## 11. 保存キューの本番検証

ダミー1320で既存目標点を同値再保存し、次を確認した。

- V3が保存を `accepted`
- GASミラーが完了し `mirrored`
- `attempts=1`
- 保存後のスナップショット再生成
- 同一mutation IDの再送でも重複保存しない
- 人工的な失敗行で `failed` / `last_error` / `next_attempt_at` を確認
- 失敗試験用データは確認後に削除

## 12. 本番速度・テスト結果

本番認証付きで1320のダッシュボードと数学進行表を確認。

- HTTP 200
- 認証付き読込: **約1.1秒**
- `npm test`: 全件成功
- Supabase Security Advisor: Foresta V3のERROR解消。service-role専用テーブルのINFOのみ

試験段階の14.31秒／7.74秒だった初回GAS依存を、事前生成済みSupabaseスナップショットで日常経路から外した。

## 13. 2026-08-31 本番公開切替

PR #8での検証後、`main` を `7ae2778` へfast-forwardした。

比較結果:

- 旧main: `99737f646ee07b3c6b025a7180314b439252d68b`
- 新main: `7ae277815d380eb3a07504593c0fd43f677e8f1a`
- 5コミット先
- behind 0
- fast-forward可能な状態で切替

GitHub Pages run `33352221976`:

- build: success
- report-build-status: success
- deploy: success

公開後の `app.js` では、通常アクセスはSupabase V3を使用し、`legacy=1` の場合のみ旧GASへ切り替える。

## 14. 現在の本番構成

```text
利用者ブラウザー
  │
  ├─ ログイン系 → 既存Apps Script
  │
  └─ 通常の授業読込・保存
        ↓
      Supabase Edge Function `foresta-runtime-v3`
        ├─ `foresta_v3_sessions`       認証済みセッションキャッシュ
        ├─ `foresta_v3_snapshots`      画面表示用読込スナップショット
        ├─ `foresta_v3_entities`       V3エンティティ
        ├─ `foresta_v3_mutations`      保存キュー／再試行／冪等化
        ├─ `foresta_v3_enrollments`    時間割由来の受講科目・レベル
        ├─ `foresta_v3_sync_status`    時間割同期状態
        ├─ `foresta_v3_migrations`     移行記録
        └─ `foresta_v3_quarantine`     不整合データ隔離
              │
              └─ 非同期ミラー → Apps Script v17 → 旧Google保存Sheet

時間割マスタ
  ↓
`foresta-timetable-sync`
  ↓
`foresta_v3_enrollments`
```

## 15. 通常運用とロールバック

### 通常利用

https://stepkobetsu-hub.github.io/foresta-progress-v2/

このURLがV3本番。`?fastv3=1` は不要。

### 緊急時

https://stepkobetsu-hub.github.io/foresta-progress-v2/?legacy=1

これで旧GAS経路を明示的に利用できる。SupabaseデータもGoogleデータも削除しないため、ロールバックは非破壊。

コード自体を戻す場合も、切替コミットをrevertすればよく、SupabaseやGoogleのデータ削除は不要。

## 16. セキュリティ方針

- パスワード・生セッショントークン・service role key・同期secretをGitHubや公開台帳へ書かない。
- Supabaseセッションではトークンハッシュを使用。
- V3テーブルはanon/authenticatedへ直接公開しない。
- Edge Functionはservice role経由でDBを扱う。
- mutation payloadへ生トークンを保存しない。
- 旧Googleデータは移行後も削除しない。

## 17. 今後の保守で守ること

- 日常保存のたびにGAS完了を待つ構造へ戻さない。
- 保存後にダッシュボード全体を同期再読込する設計へ戻さない。
- `受講科目キャッシュ` をV3の正本に戻さない。正本は `時間割マスタ`。
- 時間割同期はlast-known-goodを守り、部分的な壊れたデータで全置換しない。
- mutation IDによる冪等性を外さない。
- 生トークンをDB queueへ保存しない。
- 小学生の既存Supabaseテーブルを通常フォレスタV3 migrationで消さない。
- 1205 / 1317は元マスタ修正までは隔離扱いとする。
- 1180は算数＋国語が時間割同期の安全確認基準。

## 18. 関連資料

- 旧V2引継ぎ: `docs/foresta-progress-v2-20260815.md`
- 3周進捗対応: `docs/foresta-progress-v2-three-rounds-20260823.md`
- Codex前の高速化試験: `docs/foresta-progress-v3-fast-runtime-20260831.md`
- 本番リポジトリRunbook: `foresta-progress-v2/docs/FORESTA_V3_PRODUCTION_RUNBOOK.md`
- 時間割同期仕様: `foresta-progress-v2/docs/FORESTA_V3_TIMETABLE_SYNC.md`
- 本番PR: `foresta-progress-v2` PR #8

この資料を2026-08-31以降の「フォレスタ進捗管理」V3運用の優先引継ぎ資料とする。
