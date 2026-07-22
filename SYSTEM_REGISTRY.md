# STEPシステム資産管理台帳

最終更新: 2026-07-22  
正式な資産管理ポータル: https://stepkobetsu-hub.github.io/step-system-registry/  
管理リポジトリ: https://github.com/stepkobetsu-hub/step-system-registry  
公開ブランチ: `main`（GitHub Pages、リポジトリ直下）

この文書にはAPIキー、パスワード、秘密鍵、セッショントークンを記載しない。ポータル認証は権限2・3・4を対象とし、ログイン時とAPI呼び出しごとの権限再確認を維持する。

## 登録システム（16件）

| 正式名称 | 状態 | 利用者向け本番URL | リポジトリ | 本番ブランチ | ソース・主要ファイル | 管理 | 更新方法 | 本番確認日 | 旧版・試作版との区別 |
|---|---|---|---|---|---|---|---|---|---|
| 生徒マスタ | 本番使用中 | 要確認 | 要確認 | 該当なし | Google Sheet `☆マスタ`、関連Apps Scriptは要確認 | Apps Script管理（要確認） | 正本確認後にSheet／Apps Scriptで更新 | 2026-07-20 | 正本未確定のため候補を変更しない |
| スタッフ用アプリ | 本番使用中 | https://stepkobetsu-hub.github.io/seiseki-kanri/ | [seiseki-kanri](https://github.com/stepkobetsu-hub/seiseki-kanri) | `main` | `index.html`、`gas_code.js` | GitHub＋Apps Script | GitHub Pagesを更新し、GAS変更時は既存デプロイを更新 | 2026-07-22 | `index.html`を現行入口とする |
| 成績管理 | 本番使用中 | https://stepkobetsu-hub.github.io/seiseki-kanri/ | [seiseki-kanri](https://github.com/stepkobetsu-hub/seiseki-kanri) | `main` | `index.html`、`admin.html`、`gas_code.js` | GitHub＋Apps Script | Pagesと既存GASデプロイを同時に整合させる | 2026-07-22 | 一般入口 `index.html`、管理入口 `admin.html` |
| 面談メモ | 本番使用中 | https://stepkobetsu-hub.github.io/seiseki-kanri/meeting_memo.html | [seiseki-kanri](https://github.com/stepkobetsu-hub/seiseki-kanri) | `main` | `meeting_memo.html`、成績管理共通GAS | GitHub＋Apps Script | Pages更新。GAS変更は成績管理への影響も確認 | 2026-07-22 | 成績管理と同じGASへ接続する現行版 |
| エントリーシート読み取り | 本番使用中 | https://stepkobetsu-hub.github.io/seiseki-kanri/entry_import.html | [seiseki-kanri](https://github.com/stepkobetsu-hub/seiseki-kanri) | `main` | `entry_import.html`、成績管理リポジトリ内一式 | GitHub＋Google Sheet | Pages更新後、対象Sheetとの接続確認 | 2026-07-20 | `entry_import.html`を現行版とする |
| 受付カード読み取り | 本番使用中 | https://docs.google.com/spreadsheets/d/16K335J5meUGgGPFBZzRnDfFQb_Pzh8WtwmKZjWC1e9I/edit | なし | 該当なし | 受付カードGoogle SheetのバインドApps Script | Apps Script管理 | Sheetの「拡張機能→Apps Script」から既存デプロイを更新 | 2026-07-21 | GitHubの試作候補を正本扱いしない |
| 過去問保管DB | 本番使用中 | https://stepkobetsu-hub.github.io/seiseki-kanri/past_exam_db.html | [seiseki-kanri](https://github.com/stepkobetsu-hub/seiseki-kanri) | `main` | `past_exam_db.html`、`past_exam_upload.html`、バインドApps Script | GitHub＋Apps Script＋Drive | Pagesと既存Webアプリを更新し、2つのDrive用途を確認 | 2026-07-22 | 現行Webアプリ v129。内蔵学生提出画面とPages登録画面を区別 |
| STEP配信システム | 本番使用中 | https://stepkobetsu-hub.github.io/step-message-center/ | [step-message-center](https://github.com/stepkobetsu-hub/step-message-center) | `main` | `index.html`、`api.js`、Apps Script Webアプリ | GitHub＋Apps Script＋Brevo | Pages更新。API変更時は既存GASと配信基盤も確認 | 2026-07-20 | `step-message-center`を現行正本とする |
| 不達メール管理 | 本番使用中 | https://stepkobetsu-hub.github.io/student-QR/delivery_failures.html?v=575679fd | [student-QR](https://github.com/stepkobetsu-hub/student-QR) | `main` | `delivery_failures.html`、入退室ログ2「不達メール管理」 | GitHub＋Apps Script＋Brevo | Pages更新後、保存先Sheetと配信連携を確認 | 2026-07-21 | STEP配信システムとの関連機能として区別 |
| 講師ポータル | 本番使用中 | https://stepkobetsu-hub.github.io/teacher-portal/ | [teacher-portal](https://github.com/stepkobetsu-hub/teacher-portal) | `main` | リポジトリ内一式 | GitHub Pages | `main`へ反映してPages確認 | 2026-07-20 | 空の `eacher-portal` は正本ではない |
| 講師マスター／給与明細 | 本番使用中 | 要確認 | なし（要確認） | 該当なし | 給与明細Webアプリ関連Apps Script | Apps Script管理 | 正本Sheet／プロジェクト確定後、既存デプロイを更新 | 2026-07-20 | 正本未確定の候補は変更しない |
| 出退くんQR作成・読取 | 本番使用中 | https://stepkobetsu-hub.github.io/student-QR/student_qr_register.html | [student-QR](https://github.com/stepkobetsu-hub/student-QR) | `main` | `student_qr_register.html`、`tablet_checkin.html`、入退室ログ2 | GitHub＋Google Sheet | Pages更新後、`tablet_checkin`保存を確認 | 2026-07-21 | 上記2ファイルを現行入口として扱う |
| 講師予定・夏休み出勤登録 | 本番使用中 | https://stepkobetsu-hub.github.io/teacher_schedule/teacher_app.html | [teacher_schedule](https://github.com/stepkobetsu-hub/teacher_schedule) | `main` | `teacher_app.html`、Supabase関連コード | GitHub＋Supabase＋Apps Script出力 | PagesとSupabaseを更新し、校舎別Sheet転記を確認 | 2026-07-22 | 現行はSupabase経路。旧GAS入力Webアプリ群は旧版 |
| 請求管理システムV3.1 | 本番使用中 | https://script.google.com/macros/s/AKfycbxzkE1tQRyB_Ca4bfPKYWIkpTukIVPMWKf2ETE7yN7qROJk0VyOlvxaJ9GGI5p-6pGb/exec | GitHub正本なし（Apps Script管理） | 該当なし | Spreadsheet `請求書202608_請求 NEW`、Apps Script project `1FQElz87j5yB-FNwuDE9LJ3_nD8rzF_vIGTTWKDr15KDygGxXnZLlXhIp`、`コード.gs`、`BillingV31_Index.html`、`BillingV31_InvoiceMail.gs` | Google SheetバインドApps Script | Sheetの「拡張機能→Apps Script」で編集し、新バージョンを作成して既存デプロイIDを更新 | 2026-07-22 | 上記プロジェクトと本番デプロイIDを現行正本とし、旧版・試作を変更しない |
| お問い合わせ管理 | 本番使用中 | https://stepkobetsu-hub.github.io/step-form/contact_form.html | [step-form](https://github.com/stepkobetsu-hub/step-form) | `main` | `contact_form.html`、`問い合わせ.gs` | GitHub＋Google SheetバインドApps Script | Pagesと既存GASデプロイを整合させる | 2026-07-20 | 生徒管理側の連絡先を優先する現行設計 |
| STEP統合管理ポータル | 本番使用中 | https://stepkobetsu-hub.github.io/step-hub/system/ | [step-hub](https://github.com/stepkobetsu-hub/step-hub) | `main` | `system/index.html`、`system/data.js` | GitHub Pages | `main`へ反映してPages確認 | 2026-07-22 | 資産台帳の正本は本リポジトリへ移転。統合入口として継続 |

## 資産管理ポータル自体の更新

- 画面: `index.html`
- アイコン: `images/system-portal/`
- 台帳文書: `SYSTEM_REGISTRY.md`
- 認証API: `seiseki-kanri` のApps Script。権限2・3・4、API呼び出しごとのセッショントークン再確認を維持する。
- 更新方法: このリポジトリの `main` に反映し、GitHub Pagesの公開結果をPC／スマートフォン幅で確認する。

