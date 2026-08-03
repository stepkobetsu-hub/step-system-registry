# STEPシステム資産管理台帳

最終更新: 2026-08-04
正式な資産管理ポータル: https://stepkobetsu-hub.github.io/step-system-registry/  
管理リポジトリ: https://github.com/stepkobetsu-hub/step-system-registry  
公開ブランチ: `main`（GitHub Pages、リポジトリ直下）

この文書にはAPIキー、パスワード、秘密鍵、セッショントークンを記載しない。ポータル認証は権限2・3・4を対象とし、ログイン時とAPI呼び出しごとの権限再確認を維持する。

## 登録システム（19件）

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
| STEP請求書PDF作成・配信システム | テスト運用 | https://stepkobetsu-hub.github.io/invoice-pdf/ | [invoice-pdf](https://github.com/stepkobetsu-hub/invoice-pdf) | `main` | `index.html`、`assets/`、`apps-script/`、Apps Script v6 | GitHub Pages＋Apps Script＋Google Sheet＋非公開Google Drive | GitHub mainとPagesを確認し、Apps Scriptは既存デプロイIDを新バージョンへ更新。本番メール送信は別途承認まで無効 | 2026-08-02 | 10円単位四捨五入、期限付きトークン、再送時旧URL無効化。非公開資産の識別子、個人情報、CSV、PDFはGitHubへ保存しない |
| お問い合わせ管理 | 本番使用中 | https://stepkobetsu-hub.github.io/step-form/contact_form.html | [step-form](https://github.com/stepkobetsu-hub/step-form) | `main` | `contact_form.html`、`問い合わせ.gs` | GitHub＋Google SheetバインドApps Script | Pagesと既存GASデプロイを整合させる | 2026-07-20 | 生徒管理側の連絡先を優先する現行設計 |
| STEP統合管理ポータル | 本番使用中 | https://stepkobetsu-hub.github.io/step-hub/system/ | [step-hub](https://github.com/stepkobetsu-hub/step-hub) | `main` | `system/index.html`、`system/data.js` | GitHub Pages | `main`へ反映してPages確認 | 2026-07-22 | 資産台帳の正本は本リポジトリへ移転。統合入口として継続 |
| STEP塾生アプリ（step-hub） | 本番使用中 | https://stepkobetsu-hub.github.io/step-hub/ | [step-hub](https://github.com/stepkobetsu-hub/step-hub) | `main` | `index.html`、`my_qr.html`、`manifest.webmanifest`、`sw.js` | GitHub Pages＋各機能の既存本番基盤 | `main`へ反映し、共通ログイン・本人限定表示・PWA・各リンクを確認 | 2026-08-01 | 本項目はデザイン変更開始前までの確定仕様。以後のデザイン試作・画像・画面レイアウト履歴とは分離 |

## 登録詳細：STEP塾生アプリ（step-hub）開発記録

- ID: `step-student-app`
- 更新日・仕様基準日: 2026年8月1日
- 状態: 本番使用中
- 目的: 既存の塾生向けシステムを一つにまとめ、スマートフォンのホーム画面から利用できる塾生専用PWAとして運用する。ホームページのリンク集ではなく、塾生専用アプリを正本とする。
- 利用者向けURL: https://stepkobetsu-hub.github.io/step-hub/
- GitHub: https://github.com/stepkobetsu-hub/step-hub （本番ブランチ `main`）
- 正本ファイル: `index.html`、`my_qr.html`、`manifest.webmanifest`、`sw.js`

### 採用対象

- 成績管理: 塾生本人用ページ。共通ログイン対応
- 学習進捗管理: 塾生本人ページ。共通ログイン対応
- フォレスタプラス: 森塾システムへの入口。外部サービスのため従来のログイン方式を継続
- お知らせ・リンク集: 年間予定、休み講習、その他案内
- 自分のQR: 入退室用QR表示

### 確定した共通ログイン仕様

- 初回のみ生徒ID・パスワードを入力する。
- 以降は、自分のQR・成績管理・学習進捗管理を再入力なしで利用できる。
- フォレスタプラスは共通ログイン対象外。
- パスワードは端末へ保存せず、期限付きセッショントークンだけを利用する。

### 自分のQR・高速化・権限制御

- 塾生専用ページで本人専用QRだけを表示する。
- 他人のQR取得、URL改ざん、他生徒ID指定を拒否する。
- セッション失効・期限切れ時は再ログインを要求する。
- キャッシュ、共通ログイン、即時表示、ログアウト時のキャッシュ削除、セッション期限管理を実装済み。
- 塾生アプリから管理者画面へ入れてしまう重大不具合を修正済み。API側でも本人確認を行い、本人だけにアクセスを許可する。

### デザイン変更前に完了していた画面改善

- QR画面: ログアウトを右上へ移動、戻るボタンを大型化、生徒ID・氏名・校舎名を表示、QRデザインを改善。
- STEP塾生アプリ: フォレスタプラス・学習進捗・成績管理の用途別アイコンへ変更し、STEPカラーへ統一。

### 追加済みメニュー

- 愛知全県模試: 全県模試日程、全県模試範囲、高校コード表
- 愛知県入試制度: 高校入試情報、マークシート方式、入試制度変更
- 学習資料: 年間カレンダー、休み講習、高校入試過去問

### PWA・完了済み機能

- ホーム画面追加、manifest、Service Worker、キャッシュ管理に対応済み。
- 共通ログイン、QR、QR高速化、本人限定アクセス、成績管理、学習進捗管理、フォレスタプラス入口、愛知県入試制度、愛知全県模試、学習資料、PWAを完了済み機能として扱う。

### 記録範囲

- 本記録は、2026年8月1日時点でデザイン変更開始前までに確定したシステム仕様を保存するもの。
- 以後のデザイン試作、画像作成、画面レイアウト検討、アイコン画像の試作および採用デザイン実装は本記録に含めず、別の変更履歴として管理する。
- 公開台帳には非公開のSpreadsheet ID、Apps ScriptプロジェクトID、デプロイID、バックエンドURL、認証列構成を記載しない。

### 別管理の変更履歴：デザイン全面変更の採用撤回・安定版復元

- 判断日: 2026年8月1日
- 方針: STEP塾生アプリのデザイン全面変更を中止し、ChatGPTデザイン試作、採用画像ベース実装、派生レイアウトを不採用とした。
- 機能安定基準: `step-hub` コミット `2f55e36`
- 本番復元コミット: `a85e3bd`
- 復元方法: Git履歴は残したまま、`index.html`、`manifest.webmanifest`、`sw.js`、関連自動試験を機能安定基準へ戻した。PWA端末へ確実に復元版を配信するため、Service Workerのキャッシュ名だけを `step-student-v15-rollback` へ更新した。
- 維持した機能: 共通ログイン、期限付きセッション、パスワード非保存、本人限定QR、QR高速化、アプリ内QR表示、成績管理・学習進捗管理への共通ログイン接続、フォレスタプラス入口、愛知全県模試、愛知県入試制度、学習資料、QR画面の生徒ID・氏名・校舎名表示とログアウト時キャッシュ削除。
- 非対象: QR本体ページ、本人限定API、認証API、成績管理、学習進捗管理、フォレスタプラス外部ログイン方式には復元による変更を加えていない。
- 検証: 自動試験6件合格、インラインJavaScript・manifest構文検査合格、375px・390px・412pxで横方向のはみ出しなし、公開版の各リンク・資料・PWAキャッシュ・QR iframe・未ログイン保護を確認。ブラウザー警告・エラーなし。
- Issue記録: `step-hub` Issue #14へ採用撤回と復元結果を記録し、クローズ理由を `not planned` へ変更。
- 管理上の扱い: 上記はデザイン変更前の確定仕様を上書きせず、その後の方針変更・復元履歴として分離して保存する。

## 登録詳細：出退くんQR作成・読取

- ID: `qr-register`
- 状態: 本番使用中
- 塾生用URL: https://stepkobetsu-hub.github.io/student-QR/my_qr.html
- スタッフ用QR登録・発行URL: https://stepkobetsu-hub.github.io/student-QR/student_qr_register.html
- タブレット読取URL: https://stepkobetsu-hub.github.io/student-QR/tablet_checkin.html
- GitHub: https://github.com/stepkobetsu-hub/student-QR （本番ブランチ `main`）
- Apps Script: 非公開の本番プロジェクト、バージョン42。既存の本番デプロイIDを維持
- デプロイ: 既存デプロイIDを維持。具体的なIDと `/exec` URLは非公開の運用記録で管理
- 生徒マスタ: 非公開の本番スプレッドシートを参照。認証列・QR保存列・列構成は非公開
- 本人認証: 初回は生徒ID・パスワード。在籍中のみ許可し、パスワードは端末保存しない。端末には6時間の期限付きセッショントークンだけを保存
- アクセス制御: サーバーはトークンに紐づく生徒IDから本人のQRデータを取得し、クライアント指定の生徒IDを使用しない。他生徒のQR取得を禁止
- QR生成: 本人のQRデータをブラウザ内でQR画像化。未登録の場合は自動発行せず、教室への案内を表示
- スタッフ機能: 既存のQR登録・発行・確認ページと既存スタッフ認証経路は維持
- 変更前バックアップ: 2026-08-01取得。Apps Script Head、マニフェスト、既存デプロイ（v15）を保存してから更新
- QR読取: jsQR 1.4.0。背面カメラ、1280×720、12fps（最大20fps）、対応端末の連続オートフォーカスを使用。未検出フレームは無視し、4秒後に穏やかな案内、10秒後に認識案内を表示
- 受付制御: 読取成功直後に解析を停止し、受付完了後はカメラを再起動せず解析のみ再開。同一QRは5秒間無視。受付IDを保存し、同じIDの再送は二重記録しない。タイムアウト時は保存状態を照会して未保存の場合だけ同じIDで再送
- サーバー処理: マスタ索引と当日状態をキャッシュし、同一リクエスト内の重複読込みを削減。入退室ログは必要値をまとめて1回で書込み。受付・QR検証・対象検索・判定・保存・メールキュー・応答の区間時間を匿名化ログへ記録
- メール処理: 入退室保存と通知メールを分離。送信待ち・送信済み・送信失敗をキューへ保存し、受付IDを冪等性キーとして二重メールを防止。メール失敗でも保存済みの入退室記録は受付成功として保持
- 検証: v42ダミー成功系20回は保存20、平均5,311.1ms、中央値4,787.5ms、最大11,503.3ms、タイムアウト0、エラー0、二重記録0、二重メール0。同じ受付IDの再送20回は全件を既処理判定。保存成功・メール設定失敗は受付成功／通知失敗として表示。実在生徒・講師・保護者へのメール送信試験は未実施
- GitHub: PR #4、mainマージSHA `f88560e8df68a9de4c84ec8ad00561d6c9ee6366`
- 確認日: 2026-08-04

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
- 参照マスタ: 非公開の本番生徒マスタと講師マスタ。具体的なSpreadsheet ID・シート名・列構成・認証情報は非公開の運用記録およびScript Propertiesで管理し、台帳・GitHubへ記載しない
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

