from pathlib import Path
import re

# -------- SYSTEM_REGISTRY.md --------
md_path = Path('SYSTEM_REGISTRY.md')
md = md_path.read_text(encoding='utf-8')
md = re.sub(r'最終更新: \d{4}-\d{2}-\d{2}', '最終更新: 2026-09-13', md, count=1)

section = '''## 講師LINE通知・連絡（2026-09-13最終構成）

- **「コマ数報告してない連絡」**は、QR出勤済みで当日の授業コマ数報告がない講師へ22:10ごろ自動通知する既存システムとして継続する。講師自身のLINE登録ページ `teacher_line_register.html`、既存Apps Script「講師授業報告LINE通知」、Google Sheet「講師LINE通知管理」はこの自動通知で引き続き使用する。
- **「LINE講師連絡システム」**は2026年9月13日に再構築。管理者・スタッフがLINE登録済み講師を検索・選択し、文章または画像を個別／複数送信する手動連絡システム。
- 本番画面: https://stepkobetsu-hub.github.io/step-form/teacher_line_contact.html
- GitHub正本: `stepkobetsu-hub/step-form` の `teacher_line_contact.html` と `teacher_line_contact_v3.js`。
- 送信基盤: GitHub Pages＋Supabase Edge Function `line-teacher-api`＋Postgres＋Supabase Storage＋LINE Messaging API。旧Apps Script手動送信経路は使用しない。
- 講師一覧: 通常起動は端末キャッシュを即表示し、Supabaseの同期済み一覧で更新する。講師マスター全体を毎回読まないため高速。
- **「講師情報を強制更新」**を押した場合だけ講師マスターの最新情報を即時取得する。C列=よみ、D列=在籍（`1`のみ表示）、R列=教室として反映する。D列の`1`を付ける／消す変更はボタン1回でその場で反映する。
- LINE登録情報はGoogle Sheet「講師LINE通知管理」からSupabase `line_teacher_recipients` へバックグラウンド同期する。画面操作速度には影響させない。
- 検索: 講師番号、漢字氏名、ひらがな、カタカナ、ローマ字、教室絞り込み。
- 送信: LINE Messaging APIの実成功応答を確認できた場合だけ「送信しました」と表示する。結果は `line_teacher_send_logs` に保存する。
- 画像: JPEG/PNG 1枚。ブラウザ側でLINE送信用に縮小・圧縮し、Supabase Storage経由で送信する。旧Google Drive画像一時保存方式は廃止。
- スタッフ認証: 初回に既存の講師番号・パスワードで権限確認し、その後は新システム専用セッションを保持する。**利用者が上部の「ログアウト」を自分で押さない限り、日数経過だけを理由にスタッフ確認画面へ戻さない。**
- LINEチャネルアクセストークンは初回だけ設定し、サーバー側の非公開設定に保存する。アクセストークン・LINE利用者ID・セッショントークンはGitHub・公開画面・本台帳へ記載しない。
- 現行Supabaseテーブル: `line_teacher_recipients`、`line_teacher_send_logs`、`line_teacher_private_config`、`line_teacher_staff_sessions`。
- 旧実装は整理済み。step-formから旧Apps Script連絡コード、V1/V2、固定講師スナップショット、応急送信JS、旧テストを削除。途中で作ったSupabase `line-teacher-send`、`line-teacher-auth`、`probe-line-gas` はHTTP 410を返す廃止エンドポイントへ変更し、現行は `line-teacher-api` のみを使用する。
- 2026年9月13日、利用者による新構成でのLINE送信成功を確認済み。
- 詳細: `docs/line-teacher-contact-rebuild-20260913.md`

'''
pat = r'## 講師LINE通知・連絡（[^\n]*）\n.*?(?=## 登録システム)'
md, count = re.subn(pat, section, md, count=1, flags=re.S)
if count != 1:
    raise SystemExit('SYSTEM_REGISTRY.md: 講師LINE通知・連絡 section not found')
md_path.write_text(md, encoding='utf-8')

# -------- index.html --------
index_path = Path('index.html')
html = index_path.read_text(encoding='utf-8')

new_contact = r'''  const contactEntry={
    'ID':'teacher-line-contact-system',
    'システム名':'LINE講師連絡システム',
    '正式名称':'LINE講師連絡システム',
    '分類':'講師・勤務管理',
    '状態':'本番稼働中（Supabase再構築版）',
    '概要':'LINE登録済み講師を検索・選択し、文章または画像を個別／複数へ手動送信する管理者・スタッフ向け連絡システム。2026年9月13日に旧Apps Script手動送信経路から再構築した。',
    '利用者':'管理者・スタッフ',
    '利用者向けURL':'https://stepkobetsu-hub.github.io/step-form/teacher_line_contact.html',
    '公開URL':'https://stepkobetsu-hub.github.io/step-form/teacher_line_contact.html',
    'GitHub':'https://github.com/stepkobetsu-hub/step-form',
    '正本ファイル':['teacher_line_contact.html','teacher_line_contact_v3.js'],
    '保存基盤':'GitHub Pages＋Supabase Edge Function `line-teacher-api`＋Postgres＋Supabase Storage＋LINE Messaging API',
    '送信API':'Supabase Edge Function `line-teacher-api`。LINE APIの実成功応答を確認できた場合だけ送信成功表示を出す。',
    '講師一覧':'通常起動は端末キャッシュを即表示し、Supabaseの同期済み一覧で更新する。講師マスターを毎回読まず高速表示する。',
    '強制更新':'「講師情報を強制更新」を押した場合だけ講師マスターの最新C列=よみ、D列=在籍、R列=教室を即時取得する。D列が1の講師だけ表示し、1の追加・削除はボタン1回でその場で反映する。',
    'LINE登録同期':'Google Sheet「講師LINE通知管理」のLINE登録情報をSupabase `line_teacher_recipients` へバックグラウンド同期する。通常操作速度には影響させない。',
    '検索':'講師番号・漢字氏名・ひらがな・カタカナ・ローマ字・教室で検索／絞り込み。',
    '画像添付':'JPEG・PNGを1枚選択可能。端末側でLINE送信用に縮小・圧縮し、プレビュー後にSupabase Storage経由で送信する。画像のみ送信にも対応。旧Google Drive一時保存方式は廃止。',
    '送信履歴':'Supabase `line_teacher_send_logs` に保存。旧履歴2件も新DBへ移行済み。',
    '認証・セッション':'初回だけ既存の講師番号・パスワードで権限確認。以後は新システム専用セッションを保持し、利用者が上部の「ログアウト」を押さない限り日数経過だけではスタッフ確認画面へ戻さない。ログアウト時だけサーバー・端末のセッションを破棄する。',
    'LINE送信設定':'チャネルアクセストークンは初回だけ設定し、サーバー側の非公開設定へ保存する。アクセストークン・LINE利用者ID・スタッフセッションはGitHub・画面・台帳へ記載しない。',
    'Supabase主データ':['line_teacher_recipients','line_teacher_send_logs','line_teacher_private_config','line_teacher_staff_sessions'],
    '廃止した旧実装':['gas/TeacherLineContact.gs','teacher_line_contact.js','teacher_line_contact_v2.js','teacher_line_registered.json','teacher_roster_direct.js','teacher_roster_snapshot.json','teacher_send_fix.js','旧teacher_line_contactテスト'],
    '廃止エンドポイント':['line-teacher-send（HTTP 410）','line-teacher-auth（HTTP 410）','probe-line-gas（HTTP 410）'],
    '保守上の重要事項':'手動LINE送信は旧Apps Scriptへ戻さず、line-teacher-apiを正本とする。「コマ数報告してない連絡」の22:10自動通知は別システムとして既存Apps Scriptを維持する。LINEアクセストークンやLINE利用者IDを公開ソースへ記載しない。',
    '関連カード':['コマ数報告してない連絡','講師ポータル','STEP配信システム'],
    '確認日':'2026年9月13日',
    '確認済み事項':['新Supabase基盤へ講師25名移行','端末キャッシュによる高速初期表示','D列在籍1の即時強制更新','C列よみ・R列教室の反映','かな・カナ・ローマ字検索','文章送信','画像添付・プレビュー','LINE Messaging API実成功時のみ成功表示','送信履歴DB保存','上部ログアウトボタン','明示ログアウトまでセッション維持','利用者による実送信成功','旧GitHub実装削除','旧Supabase中継をHTTP 410で無効化'],
    '確認状況':'2026年9月13日、本番再構築完了。利用者によるLINE実送信成功を確認し、旧送信経路・旧応急ファイルを整理して正本をline-teacher-apiへ一本化。',
    '詳細記録':'docs/line-teacher-contact-rebuild-20260913.md'
  };'''

pattern = r'  const contactEntry=\{.*?\n  \};(?=\r?\n  const portalIndex=)'
html, count = re.subn(pattern, new_contact, html, count=1, flags=re.S)
if count != 1:
    raise SystemExit('index.html: contactEntry block not found')

index_path.write_text(html, encoding='utf-8')
