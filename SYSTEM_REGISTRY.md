# STEPシステム資産管理台帳

最終更新: 2026-08-01
正式な資産管理ポータル: https://stepkobetsu-hub.github.io/step-system-registry/  
管理リポジトリ: https://github.com/stepkobetsu-hub/step-system-registry  
公開ブランチ: `main`（GitHub Pages、リポジトリ直下）

この文書にはAPIキー、パスワード、秘密鍵、セッショントークンを記載しない。ポータル認証は権限2・3・4を対象とし、ログイン時とAPI呼び出しごとの権限再確認を維持する。

## 登録システム（17件）

| 正式名称 | 状態 | 利用者向け本番URL | リポジトリ | 本番ブランチ | ソース・主要ファイル | 管理 | 更新方法 | 本番確認日 | 旧版・試作版との区別 |
|---|---|---|---|---|---|---|---|---|---|
| 生徒マスタ | 本番使用中 | 要確認 | 要確認 | 該当なし | Google Sheet `☆マスタ`、関連Apps Scriptは要確認 | Apps Script管理（要確認） | 正本確認後にSheet／Apps Scriptで更新 | 2026-07-20 | 正本未確定のため候補を変更しない |
| 学習進捗管理 | 本番 | https://stepkobetsu-hub.github.io/foresta-step-progress/ | [foresta-step-progress](https://github.com/stepkobetsu-hub/foresta-step-progress) | `main` | `index.html`、`README.md`、`package.json`、`tests/`、Apps Script Webアプリ（詳細要確認） | GitHub＋Apps Script＋Google Sheet（正本：Google Sheet「システム台帳」） | Pages更新。API変更時は既存GASデプロイを更新し、本人限定・権限テストを確認 | 2026-07-31 | 旧称：フォレスタステップ進捗管理／夏休み進捗管理。通常授業用フォレスタの講師向け管理は別システム |
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
| 出退くんQR作成・読取 | 本番使用中 | https://stepkobetsu-hub.github.io/student-QR/my_qr.html | [student-QR](https://github.com/stepkobetsu-hub/student-QR) | `main` | `my_qr.html`、`student_qr_register.html`、`tablet_checkin.html`、`gas/MyQrApi.js`、入退室ログ2 | GitHub＋Apps Script＋Google Sheet | Pagesと既存Apps Scriptデプロイを更新し、塾生本人QR・スタッフ登録・タブレット読取を確認 | 2026-08-01 | 塾生用 `my_qr.html` とスタッフ用 `student_qr_register.html` を分離。塾生は期限付きセッションのみ端末保存 |
| 講師予定・夏休み出勤登録 | 本番使用中 | https://stepkobetsu-hub.github.io/teacher_schedule/teacher_app.html | [teacher_schedule](https://github.com/stepkobetsu-hub/teacher_schedule) | `main` | `teacher_app.html`、Supabase関連コード | GitHub＋Supabase＋Apps Script出力 | PagesとSupabaseを更新し、校舎別Sheet転記を確認 | 2026-07-22 | 現行はSupabase経路。旧GAS入力Webアプリ群は旧版 |
| 請求管理システムV3.1 | 本番使用中 | https://script.google.com/macros/s/AKfycbxzkE1tQRyB_Ca4bfPKYWIkpTukIVPMWKf2ETE7yN7qROJk0VyOlvxaJ9GGI5p-6pGb/exec | GitHub正本なし（Apps Script管理） | 該当なし | Spreadsheet `請求書202608_請求 NEW`、Apps Script project `1FQElz87j5yB-FNwuDE9LJ3_nD8rzF_vIGTTWKDr15KDygGxXnZLlXhIp`、`コード.gs`、`BillingV31_Index.html`、`BillingV31_InvoiceMail.gs` | Google SheetバインドApps Script | Sheetの「拡張機能→Apps Script」で編集し、新バージョンを作成して既存デプロイIDを更新 | 2026-07-22 | 上記プロジェクトと本番デプロイIDを現行正本とし、旧版・試作を変更しない |
| お問い合わせ管理 | 本番使用中 | https://stepkobetsu-hub.github.io/step-form/contact_form.html | [step-form](https://github.com/stepkobetsu-hub/step-form) | `main` | `contact_form.html`、`問い合わせ.gs` | GitHub＋Google SheetバインドApps Script | Pagesと既存GASデプロイを整合させる | 2026-07-20 | 生徒管理側の連絡先を優先する現行設計 |
| STEP統合管理ポータル | 本番使用中 | https://stepkobetsu-hub.github.io/step-hub/system/ | [step-hub](https://github.com/stepkobetsu-hub/step-hub) | `main` | `system/index.html`、`system/data.js` | GitHub Pages | `main`へ反映してPages確認 | 2026-07-22 | 資産台帳の正本は本リポジトリへ移転。統合入口として継続 |

## 登録詳細：出退くんQR作成・読取

- ID: `qr-register`
- 状態: 本番使用中
- 塾生用URL: https://stepkobetsu-hub.github.io/student-QR/my_qr.html
- スタッフ用QR登録・発行URL: https://stepkobetsu-hub.github.io/student-QR/student_qr_register.html
- タブレット読取URL: https://stepkobetsu-hub.github.io/student-QR/tablet_checkin.html
- GitHub: https://github.com/stepkobetsu-hub/student-QR （本番ブランチ `main`）
- Apps Script: 非公開の本番プロジェクト、バージョン18
- デプロイ: 既存デプロイIDを維持。具体的なIDと `/exec` URLは非公開の運用記録で管理
- 生徒マスタ: 非公開の本番スプレッドシートを参照。認証列・QR保存列・列構成は非公開
- 本人認証: 初回は生徒ID・パスワード。在籍中のみ許可し、パスワードは端末保存しない。端末には6時間の期限付きセッショントークンだけを保存
- アクセス制御: サーバーはトークンに紐づく生徒IDから本人のQRデータを取得し、クライアント指定の生徒IDを使用しない。他生徒のQR取得を禁止
- QR生成: 本人のQRデータをブラウザ内でQR画像化。未登録の場合は自動発行せず、教室への案内を表示
- スタッフ機能: 既存のQR登録・発行・確認ページと既存スタッフ認証経路は維持
- 変更前バックアップ: 2026-08-01取得。Apps Script Head、マニフェスト、既存デプロイ（v15）を保存してから更新
- 検証: 自動テスト10件、APIヘルスチェック、未認証管理API拒否、改ざん・失効・期限切れ拒否、既存入退室API応答を確認（バージョン18）
- 確認日: 2026-08-01

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
- 調査時main: `1e55b1f3193910d6df24b91613e62605fe669109`
- 正本ファイル: `index.html`、`README.md`、`package.json`、`tests/`、`apps-script/code.gs`、`apps-script/appsscript.json`、`apps-script/README.md`
- 最新版の場所: `stepkobetsu-hub/foresta-step-progress` の `main` 直下
- 通信方法: GitHub Pagesの `index.html` からApps Script WebアプリへJSON API通信。Apps Script HTML Service／iframeは不使用。
- 認証方式: アプリ独自認証、期限付きセッション、サーバー側権限確認、本人studentId一致確認。Googleアカウントは不要。
- Apps Script: プロジェクト名「フォレスタステップ進捗管理【開発】」、プロジェクトID `1xu7BtCOMrB9bzWMcB_c0gcj-Df0Ql93yZp4CyPIgjWcf6EqMDSyRETIB`、編集URL https://script.google.com/home/projects/1xu7BtCOMrB9bzWMcB_c0gcj-Df0Ql93yZp4CyPIgjWcf6EqMDSyRETIB/edit、公開API version 47、既存デプロイID `AKfycbwu8lfhiH3_7m4ogHNtbgeo3ehx_VBMnt1mPXsvIlL_kMSpxFdrRD4rO_I6q_JUXIWHmg`、WebアプリURL https://script.google.com/macros/s/AKfycbwu8lfhiH3_7m4ogHNtbgeo3ehx_VBMnt1mPXsvIlL_kMSpxFdrRD4rO_I6q_JUXIWHmg/exec。実行ユーザーはデプロイ実行者（stepkobetsu@gmail.com）、アクセス設定は全員（匿名ユーザーを含む）。アプリ独自認証・期限付きセッション・本人studentId照合を維持
- 保存先Spreadsheet: 「フォレスタステップ進捗管理DB【開発】」、Spreadsheet ID `1axZz8nGy15srgo2DVladaY_KQ3XXVbNrOrk3zL1GqaI`、URL https://docs.google.com/spreadsheets/d/1axZz8nGy15srgo2DVladaY_KQ3XXVbNrOrk3zL1GqaI/edit
- 使用シートと役割: `設定`（アプリ設定）、`単元マスタ`（教材・科目・単元設定）、`生徒プロフィール`（表示用プロフィール）、`標準範囲`（学年別標準範囲）、`生徒別目標`（個別目標範囲）、`学習進捗`（Point・WARM UP・TRY・LCT・学習日・周回）、`宿題`（宿題項目・本人申告・講師確認）、`セッション`（ハッシュ化トークン・期限・失効）、`操作履歴`（監査ログ）、`学年要確認`（生徒マスタ学年競合）、`エラーログ`（予期しない内部エラー）、`達成節目`（達成メッセージ・キャラクター）
- 参照マスタ: 生徒マスタSpreadsheet ID `1CIJkTlYUcUkbb8jBdFc6L8D5ubTGsxwNxFv01ten-Zk` の `☆マスタ`、講師マスタSpreadsheet ID `1L5aFDXAmfUDkBg8d7X3WqJgMhdMq5tM5sfUZ2G-M58E` の `講師マスター`。認証用パスワードや秘密値はScript Propertiesで管理し、台帳・GitHubへ記載しない
- Apps Script正本のGitHub保存先: https://github.com/stepkobetsu-hub/foresta-step-progress/tree/main/apps-script
- バックアップ方法: デプロイ前にApps Script各ファイルとマニフェストを `apps-script/` へ保存し、取得日・元バージョン・デプロイIDを `apps-script/README.md` に記録。Script Propertiesの値と個人情報は保存しない
- 更新方法: GitHub正本とApps Script Headを同期し、開発用テスト生徒で認証・宿題・ダッシュボード・権限制御を確認後、新バージョンを作成して既存デプロイIDを更新する。新規デプロイIDは作成しない
- 現在確認済みの機能: 生徒本人による進捗入力、教科別進捗率表示、学年別進捗表示、今日の学習集計、次回の宿題、進捗入力、目標範囲管理、Point／WARM UP／TRY／Exercise管理、TRY赤×直し、Exercise、LCT入力・集計、学習日の自動記録、自動保存、宿題確認、達成率・励まし表示、スマートフォン対応、本人IDとstudentId一致によるアクセス制御、他生徒データの閲覧・更新拒否。
- セキュリティ設計（公開コード・READMEで確認）: 本人データ限定、講師・管理者権限のサーバー側処理、未ログイン・他生徒データ・権限外操作の拒否。
- 今後の改良予定: アプリ用アイコンの差し替え、スマートフォン版タブ文字の拡大、「夏期範囲」から「目標範囲」への名称整理、フォレスタゴール5教科追加、ステップ英語の暗記マーク対応、ゴール英語のMy単語帳対応、ゴール英語でLCTを非表示・集計対象外にする処理、教材別設定による表示・宿題項目の切り替え、通常授業用フォレスタの別アプリ化。
- 台帳正本への反映: 2026-07-31更新済み。公開カードの正本はGoogle Sheet「システム台帳」であり、本Markdownは構成確認・保守用の台帳文書。`getSystemRegistry` は正本Sheetを読み込む。登録前14件、登録後15件、ID `learning-progress` の重複なしを確認。
- 調査根拠: Issue #1、対象GitHub `main`、GitHub Pages公開画面、公開コード。
- 確認日: 2026-07-31

### 2026-07-31 管理画面・表示高速化

- 生徒画面の教材タグに、教材・科目ごとの目標範囲単元数を表示。
- 管理者の生徒個人画面は閲覧専用で開始し、教科行右端の「管理者編集」を押した場合のみ、次回の宿題・進捗入力・目標範囲を編集可能。
- 編集ボタン付近に赤字1行で「閲覧専用です。変更する場合は、右の「管理者編集」を押してください。」と表示。
- 「全体進捗へ戻る」を設定付近に配置し、目立つ色へ変更。
- 「生徒別目標」を「生徒検索」へ改称。検索入力時は画面全体を再描画せず結果だけを更新し、連続して文字入力できるよう修正。
- 生徒検索結果を、氏名・ID・学年・校舎・個人画面ボタンの横1行表示へ変更。
- 全体進捗と生徒検索からの個人画面表示に、事前読込と共通キャッシュを追加。
- 宿題チェックに5分キャッシュと事前読込を追加。宿題の確認状態を変更した場合はキャッシュを破棄して再取得。
- 「学年要確認」は通常メニューから設定内へ移動。開いた時点で生徒マスタJ列・K列の学年不一致を自動照合し、修正は生徒マスタ側で行う。
- GitHub Pages最新コミット: `1e55b1f3193910d6df24b91613e62605fe669109`
- Apps Script本番: v47、既存デプロイID維持。今回Apps Scriptコードの変更なし。

## 資産管理ポータル自体の更新

- 画面: `index.html`
- アイコン: `images/system-portal/`
- 台帳文書: `SYSTEM_REGISTRY.md`
- 認証API: `seiseki-kanri` のApps Script。権限2・3・4、API呼び出しごとのセッショントークン再確認を維持する。
- 更新方法: このリポジトリの `main` に反映し、GitHub Pagesの公開結果をPC／スマートフォン幅で確認する。

