# 生徒情報検索の高速表示用データベース

## 何のためのものか

生徒情報検索で候補を選んでから詳細が開くまで約7秒かかっていたため、Google Sheet「生徒マスタ」の内容を管理者専用のSupabaseデータベースにも保持する。2026-09-28に330人分を初期取り込みし、利用者から「非常に速くなりました」と本番で確認を受けた。確認環境では詳細描画が先読みなし522ms、先読み済み4ms（通信・端末条件で変動、面談記録の別取得を除く）。

## すぐ開く

| 対象 | リンク・識別子 | 用途 |
| --- | --- | --- |
| 生徒情報検索 | https://stepkobetsu-hub.github.io/seiseki-kanri/student_directory.html | 管理者が生徒を検索・確認・保存 |
| 原本「生徒マスタ」 | https://docs.google.com/spreadsheets/d/1CIJkTlYUcUkbb8jBdFc6L8D5ubTGsxwNxFv01ten-Zk/edit#gid=829117795 | ☆マスタ。保護者の登録内容と管理者の直接修正の原本 |
| Supabase管理画面 | https://supabase.com/dashboard/project/wisedgcgwaebtkprdhth/editor | プロジェクトID `wisedgcgwaebtkprdhth`。管理権限でログインしてテーブルを確認 |
| 表示用テーブル | `public.student_directory_details` | `student_code`をキーに詳細JSONを保持 |
| 同期状態テーブル | `public.student_directory_sync_state` | 最終成功時刻と件数を保持 |
| Edge Functionソース | https://github.com/stepkobetsu-hub/seiseki-kanri/tree/main/supabase/functions/seiseki-admin-runtime-v1 | 管理者認証、検索・同期・保存時のデータベース更新 |
| Apps Scriptソース | https://github.com/stepkobetsu-hub/seiseki-kanri/blob/main/gas_code.js | 原本一括読み取り・定期同期 |
| Apps Scriptプロジェクト | https://script.google.com/home/projects/1ubtigRpAoZ8rKIJ1d2vvEFp_Fk36e0jZJJ92Lef_brg9pssxF5OPaiFh/edit | トリガー・実行履歴を確認。既存WebアプリURLの公開版v72 |
| 変更記録 | https://github.com/stepkobetsu-hub/step-system-registry/blob/main/docs/student-directory-20260928.md | 作業経過と測定条件 |

## 原本と更新の流れ

1. 保護者は既存の生徒登録アプリで登録し、生徒マスタの☆マスタへ記入する。管理者の少しの修正も引き続きGoogle Sheetで行える。
2. Apps Scriptの時間主導型トリガー `syncStudentDirectoryToMirror_` が約5分ごとに☆マスタと時間割マスタを読み込み、Supabase Edge Function `seiseki-admin-runtime-v1` の `ingestStudentDirectory` へ安全な同期キー付きで送る。画面を開いている間も原本を確認して更新する。
3. 生徒情報検索は管理者認証を経たEdge Function `getStudentDirectoryDetail` から高速表示用データを読む。保存時は `saveStudentDirectory` がまず原本の競合・数式保護付き保存を行い、その確定結果を表示用データにも反映する。
4. Google Sheetが唯一の原本。同期には最大約5分＋処理時間の遅れがあり、失敗すると古い表示が残る。画面の「最新情報を取得」で再同期を促せる。

2026-09-28 23:07 JST、管理者の追加承認後に画面を閉じたままトリガーが成功し、同期状態の最終成功時刻 `2026-09-28 14:07:43 UTC`、件数330を確認した。Apps Script実行履歴では14:07の時間主導型実行を確認。以前の13:57/14:02の失敗はGoogle外部通信権限の未承認によるもの。

## 権限と他アプリ

詳細には保護者の連絡先などが含まれるため、テーブルのRLSを有効にし、`anon`・`authenticated`からの直接読み取りを許可しない。管理者セッションを検証するEdge Functionだけが表示・更新する。URLや同期キーだけでブラウザからテーブルを読む設計ではない。キー、個人情報、パスワードを公開台帳には記載しない。

他のアプリもこのプロジェクトの表示用データを共用できるが、**現在切り替え済みなのは生徒情報検索だけ**。他アプリを接続するときは、必要な項目だけを返す専用APIとその利用者に合う認証・権限を実装する。生徒・保護者向けアプリに管理者用の詳細JSONをそのまま公開しない。

## 運用と復旧

- トリガー実行履歴: 上記Apps Scriptプロジェクトの「実行数」で `syncStudentDirectoryToMirror_` を確認。失敗時は権限・外部通信・Sheet読み取り・Edge Functionの応答を調べる。
- 最終同期: Supabaseの `student_directory_sync_state.last_success_at` と `row_count` を確認。生徒件数が原本と合うかも確認する。
- データを修正する場所: 原本Google Sheet。表示用テーブルを直接編集すると次回同期で上書きされ得る。
- Apps Scriptコード変更: GitHubの `gas_code.js` とプロジェクトを一致させ、既存のWebアプリデプロイIDを新バージョンに更新する。定期トリガーの登録状態も確認する。
- Edge Function変更: `seiseki-admin-runtime-v1` の認証と秘密値を維持して公開し、管理者画面で取得・同期を検証する。

初回導入時のコード: Apps Script `8b0686c0adf16a409abbcde5c40defba9c2ed99f` と実行確認入口 `4f903797b7197a4ade0991e4503774d8286ddee7`、Edge `8a41a82e50bf35b5f2eb4569d880adfe733f02a6`、画面 `318de01df694a14264e978907e9b55d2c78aca75`。
