# STEPシステム資産管理台帳

最終更新: 2026-07-28  
正式な資産管理ポータル: https://stepkobetsu-hub.github.io/step-system-registry/  
管理リポジトリ: https://github.com/stepkobetsu-hub/step-system-registry  
公開ブランチ: `main`（GitHub Pages、リポジトリ直下）

この文書にはAPIキー、パスワード、秘密鍵、セッショントークンを記載しない。ポータル認証は権限2・3・4を対象とし、ログイン時とAPI呼び出しごとの権限再確認を維持する。

## 登録システム（17件）

| 正式名称 | 状態 | 利用者向け本番URL | リポジトリ | 本番ブランチ | ソース・主要ファイル | 管理 | 更新方法 | 本番確認日 | 旧版・試作版との区別 |
|---|---|---|---|---|---|---|---|---|---|
| 生徒マスタ | 本番使用中 | 要確認 | 要確認 | 該当なし | Google Sheet `☆マスタ`、関連Apps Scriptは要確認 | Apps Script管理（要確認） | 正本確認後にSheet／Apps Scriptで更新 | 2026-07-20 | 正本未確定のため候補を変更しない |
| 学習進捗管理 | 本番 | https://stepkobetsu-hub.github.io/foresta-step-progress/ | [foresta-step-progress](https://github.com/stepkobetsu-hub/foresta-step-progress) | `main` | `index.html`、`README.md`、`package.json`、`tests/`、Apps Script Webアプリ（詳細要確認） | GitHub＋Apps Script＋Google Sheet（正本：Google Sheet「システム台帳」） | Pages更新。API変更時は既存GASデプロイを更新し、本人限定・権限テストを確認 | 2026-07-28 | 旧称：フォレスタステップ進捗管理／夏休み進捗管理。通常授業用フォレスタの講師向け管理は別システム |
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

## 登録詳細：学習進捗管理

- ID: `learning-progress`
- 正式名称: 学習進捗管理
- 旧称・参考名: フォレスタステップ進捗管理／夏休み進捗管理
- 分類: 生徒・指導管理
- 状態: 本番（正本で使用中の正式値。GitHub Pages公開画面とApps Script API接続を確認）
- 利用者: 生徒、講師、管理者
- 運用担当: 管理者
- 概要: 生徒がフォレスタステップとフォレスタゴールの学習進捗、宿題、目標範囲、LCT等を入力・確認する、自主学習・講習・受験勉強用の進捗管理アプリ。通常授業用フォレスタの講師向け進捗管理は対象外。
- GitHub Pages URL: https://stepkobetsu-hub.github.io/foresta-step-progress/
- GitHub URL: https://github.com/stepkobetsu-hub/foresta-step-progress
- 本番ブランチ: `main`
- 調査時main: `e3d76a80593e2a309f91ee210dcbcbb703c48bd0`
- 正本ファイル: `index.html`、`README.md`、`package.json`、`tests/`
- 最新版の場所: `stepkobetsu-hub/foresta-step-progress` の `main` 直下
- 通信方法: GitHub Pagesの `index.html` からApps Script WebアプリへJSON API通信。Apps Script HTML Service／iframeは不使用。
- 認証方式: アプリ独自認証、期限付きセッション、サーバー側権限確認、本人studentId一致確認。Googleアカウントは不要。
- Apps Script: プロジェクト名「フォレスタステップ進捗管理【開発】」、編集画面と公開Webアプリ接続を確認、公開API version 31。実行ユーザー・アクセス設定は要確認
- 保存先Spreadsheet名・Spreadsheet ID・Google Sheet URL・使用シート名・各シートの役割: 管理者確認待ち
- 現在確認済みの機能: 生徒本人による進捗入力、教科別進捗率表示、学年別進捗表示、今日の学習集計、次回の宿題、進捗入力、目標範囲管理、Point／WARM UP／TRY／Exercise管理、TRY赤×直し、Exercise、LCT入力・集計、学習日の自動記録、自動保存、宿題確認、達成率・励まし表示、スマートフォン対応、本人IDとstudentId一致によるアクセス制御、他生徒データの閲覧・更新拒否。
- セキュリティ設計（公開コード・READMEで確認）: 本人データ限定、講師・管理者権限のサーバー側処理、未ログイン・他生徒データ・権限外操作の拒否。
- 今後の改良予定: アプリ用アイコンの差し替え、スマートフォン版タブ文字の拡大、「夏期範囲」から「目標範囲」への名称整理、フォレスタゴール5教科追加、ステップ英語の暗記マーク対応、ゴール英語のMy単語帳対応、ゴール英語でLCTを非表示・集計対象外にする処理、教材別設定による表示・宿題項目の切り替え、通常授業用フォレスタの別アプリ化。
- 台帳正本への反映: 2026-07-28登録済み。公開カードの正本はGoogle Sheet「システム台帳」であり、本Markdownは構成確認・保守用の台帳文書。`getSystemRegistry` は正本Sheetを読み込む。登録前14件、登録後15件、ID `learning-progress` の重複なしを確認。
- 調査根拠: Issue #1、対象GitHub `main`、GitHub Pages公開画面、公開コード。
- 確認日: 2026-07-28

## 資産管理ポータル自体の更新

- 画面: `index.html`
- アイコン: `images/system-portal/`
- 台帳文書: `SYSTEM_REGISTRY.md`
- 認証API: `seiseki-kanri` のApps Script。権限2・3・4、API呼び出しごとのセッショントークン再確認を維持する。
- 更新方法: このリポジトリの `main` に反映し、GitHub Pagesの公開結果をPC／スマートフォン幅で確認する。

