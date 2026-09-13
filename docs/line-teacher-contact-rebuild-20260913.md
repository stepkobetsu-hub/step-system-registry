# LINE講師連絡システム 再構築記録（2026-09-13）

## 結論

2026年9月13日、講師へLINEで個別・一斉連絡する「LINE講師連絡システム」を、旧Google Apps Script送信経路の継ぎ足し方式から切り離し、GitHub Pages＋Supabase＋LINE Messaging APIを中心とする構成へ再構築した。

本番画面:
- https://stepkobetsu-hub.github.io/step-form/teacher_line_contact.html

GitHub正本:
- https://github.com/stepkobetsu-hub/step-form
- `teacher_line_contact.html`
- `teacher_line_contact_v3.js`

送信API:
- Supabase Edge Function `line-teacher-api`

## 「コマ数報告してない連絡」との区別

「コマ数報告してない連絡」は、当日のQR出勤と授業コマ数報告を照合し、22:10ごろに未報告講師へ自動通知する既存システムであり、今回の再構築後も別システムとして残す。

今回の「LINE講師連絡システム」は、管理者・スタッフが講師を検索・選択し、任意の文章または画像を手動で個別／複数送信するシステムである。

## 講師一覧

- LINE登録済み講師をSupabase `line_teacher_recipients` に保持する。
- 通常起動は端末キャッシュを先に表示し、Supabaseの同期済み一覧で更新するため、講師マスター全体を毎回読んで待たせない。
- 「講師情報を強制更新」を押した場合だけ、講師マスターの最新情報を即時取得する。
- 講師マスターの対応列:
  - C列: よみ
  - D列: 在籍。`1` の講師だけ表示対象
  - R列: 教室
- D列の `1` を付ける／消す変更は、強制更新ボタンでその場で反映する。
- LINE登録情報自体の変更は、管理シートからSupabaseへバックグラウンド同期する。通常の画面操作速度には影響させない。

## 検索・選択

- 講師番号
- 漢字氏名
- ひらがな
- カタカナ
- ローマ字
- 教室（神領／大手）

で検索・絞り込み可能。

選択中講師を氏名チップで表示し、「表示中を全員選択」「選択解除」に対応する。

## LINE送信

- LINE Messaging APIへサーバー側から直接送信する。
- LINEチャネルアクセストークンは初回だけ設定し、サーバー側の非公開設定へ保存する。
- アクセストークン、LINE利用者ID、スタッフセッションはGitHub・公開画面・本台帳へ記載しない。
- LINE APIの実成功応答を確認できた場合だけ、画面に「送信しました」と表示する。
- 送信結果は `line_teacher_send_logs` に保存する。
- 旧履歴2件を新DBへ移行済み。

## 画像送信

- JPEG / PNG 1枚に対応。
- ブラウザ側でLINE送信用に縮小・圧縮し、プレビュー後に送信する。
- 画像のみの送信にも対応する。
- 新構成では送信用画像をSupabase Storageへ置き、LINE Messaging APIから参照させる。
- 旧Google Drive一時保存方式は廃止した。

## スタッフ認証

- 初回は既存の講師番号・パスワードでスタッフ権限を確認する。
- 確認後は新システム専用セッションを端末に保持する。
- **利用者が画面上の「ログアウト」を押さない限り、日数経過だけを理由にスタッフ確認画面へ戻さない。**
- ログアウト時だけサーバー側セッションを無効化し、端末側認証情報を削除する。

## Supabaseの主データ

- `line_teacher_recipients`: LINE登録済み講師と在籍・よみ・教室
- `line_teacher_send_logs`: 手動LINE送信履歴
- `line_teacher_private_config`: LINE送信用の非公開設定
- `line_teacher_staff_sessions`: スタッフ用セッション
- Edge Function `line-teacher-api`: ログイン、一覧、強制更新、履歴、LINE送信、初回LINE設定を一本化

## 高速化方針

通常起動では講師マスターを読まない。端末キャッシュ→Supabase一覧の順で表示する。

講師情報は月1～2件程度の変更を想定し、重いマスター確認を毎回実行しない。必要時に「講師情報を強制更新」で即時反映する。

## 廃止・削除した旧実装

step-formから以下を削除した。

- `gas/TeacherLineContact.gs`
- `teacher_line_contact.js`
- `teacher_line_contact_v2.js`
- `teacher_line_registered.json`
- `teacher_roster_direct.js`
- `teacher_roster_snapshot.json`
- `teacher_send_fix.js`
- 旧実装用 `tests/teacher_line_contact.test.mjs`

Supabase側の途中実装:
- `line-teacher-send`
- `line-teacher-auth`
- `probe-line-gas`

は現行画面から参照せず、HTTP 410を返す廃止エンドポイントへ変更した。現行は `line-teacher-api` のみを使用する。

## 残すもの

- `teacher_line_contact.html`: 現行のLINE講師連絡画面
- `teacher_line_contact_v3.js`: 現行フロントエンド
- `teacher_line_register.html`: 講師自身がLINE通知を登録する既存ページ。手動連絡システム再構築後も必要なため残す。
- Google Sheet「講師LINE通知管理」: LINE登録元・既存自動通知の管理に使用するため残す。
- 「コマ数報告してない連絡」の既存Apps Script: 22:10の未報告自動通知で使用するため残す。

## 2026-09-13確認

- 新画面へ切替後、利用者によるLINE送信成功を確認。
- 講師一覧の高速表示を確認。
- 講師マスターD列の在籍判定を強制更新で即時反映する構成を確認。
- ログアウトボタンを上部に配置。
- 文章・画像添付・送信プレビュー・送信履歴を新構成へ統合。
- 旧送信経路・旧応急ファイルを整理し、現行正本を一本化した。
