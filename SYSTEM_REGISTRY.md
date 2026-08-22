# STEPシステム資産管理台帳

最終更新: 2026-08-23
正式な資産管理ポータル: https://stepkobetsu-hub.github.io/step-system-registry/  
管理リポジトリ: https://github.com/stepkobetsu-hub/step-system-registry  
公開ブランチ: `main`（GitHub Pages、リポジトリ直下）

この文書にはAPIキー、パスワード、秘密鍵、セッショントークンを記載しない。ポータル認証は権限2・3・4を対象とし、ログイン時とAPI呼び出しごとの権限再確認を維持する。

## 登録システム（24件）

| 正式名称 | 状態 | 利用者向け本番URL | リポジトリ | 本番ブランチ | ソース・主要ファイル | 管理 | 更新方法 | 本番確認日 | 旧版・試作版との区別 |
|---|---|---|---|---|---|---|---|---|---|
| 生徒マスタ | 本番使用中 | 要確認 | 要確認 | 該当なし | Google Sheet `☆マスタ`、関連Apps Scriptは要確認 | Apps Script管理（要確認） | 正本確認後にSheet／Apps Scriptで更新 | 2026-07-20 | 正本未確定のため候補を変更しない |
| ステップ＆ゴール進捗管理 | **V3本番稼働中（D1直保存・旧進捗復元済み・グラフ高速化）** | https://step-progress-api.stepkobetsu.workers.dev/ | [foresta-step-progress](https://github.com/stepkobetsu-hub/foresta-step-progress) | `codex/homework-status-root-cause`（現行本番）／`agent/step-progress-v3-implementation`（V3基礎） | `cloudflare/src/v3.ts`、`cloudflare/src/dashboard.ts`、`cloudflare/src/summary.ts`、`cloudflare/scripts/apply-v3-autosave.mjs`、`cloudflare/scripts/apply-v3-homework-display-fix.mjs`、D1 V3テーブル | GitHub＋Cloudflare Worker＋D1 `step-progress-db`。通常保存はD1直保存。旧Supabaseは復元元として保全 | 1320で最小確認。代表5名を旧スクショと本番APIで照合。田中1100のグラフAPIを3回実測（0.756秒／1.026秒／0.862秒）し、グラフ取得開始を前倒し。利用者実画面で高速化を確認 | 2026-08-23 | 現行Version `b6ed5627-f360-4ba2-8e09-92e9d5d71340`。直前Version `fb49bfc7-73e9-4361-84ef-ef07768d1c27`。V3直前旧版 `7b84a8f6-3b25-4052-ab32-f02d6af55a51`。詳細 `docs/learning-progress-v3-stabilized-20260822.md` |
| フォレスタ進捗管理 | 本番 | https://stepkobetsu-hub.github.io/foresta-progress-v2/ | [foresta-progress-v2](https://github.com/stepkobetsu-hub/foresta-progress-v2) | `main` | `index.html`、`styles.css`、`app.js`、`domain.js`、`config.js`、`manifest.webmanifest`、`apps-script/`、`data/japanese-units.json`、`tests/` | GitHub Pages＋Apps Script＋専用Google Sheet | Pagesと既存APIデプロイを更新し、health・3入口・国英数進行表・単元1,853件を確認 | 2026-08-15 | 学校授業を先取りする通常授業用。ステップ＆ゴール進捗管理とは別ID・別URL・別保存先。詳細は `docs/foresta-progress-v2-20260815.md` |
| 定期テスト進捗管理 | 本番 | https://beautiful-blini-37eee7.netlify.app/ | 要確認 | 要確認 | 公開Webアプリ（詳細要確認） | 要確認 | 正本確認後に更新 | 要確認 | 既存登録を維持 |
| スタッフ用アプリ | 本番使用中 | https://stepkobetsu-hub.github.io/seiseki-kanri/ | [seiseki-kanri](https://github.com/stepkobetsu-hub/seiseki-kanri) | `main` | `index.html`、`gas_code.js` | GitHub＋Apps Script | GitHub Pagesを更新し、GAS変更時は既存デプロイを更新 | 2026-07-22 | `index.html` はスタッフ用ポータル。成績管理の直接入口ではなく、成績管理へ入る場合は `admin.html` へ進む |
| 成績管理 | 本番使用中 | **講師・管理者用:** https://stepkobetsu-hub.github.io/seiseki-kanri/admin.html<br>**生徒用:** https://stepkobetsu-hub.github.io/seiseki-kanri/juku_app.html | [seiseki-kanri](https://github.com/stepkobetsu-hub/seiseki-kanri) | `main` | `admin.html`、`juku_app.html`、`gas_code.js`、端末別ログイン試験（`index.html` はスタッフ用ポータル） | GitHub＋Apps Script | Pagesと既存GASデプロイを同時に整合させる | 2026-08-15 | **成績管理の直接入口は2つ。講師・管理者は `admin.html`、生徒は `juku_app.html`。`/seiseki-kanri/`（`index.html`）はスタッフ用ポータルで、成績管理の直接入口とは区別する。エントリーシート（デジタル版）は成績管理カードではなく「受付カード・エントリーシート読み取り」カードに表示する** |
| 面談メモ | 本番使用中 | https://stepkobetsu-hub.github.io/seiseki-kanri/meeting_memo.html | [seiseki-kanri](https://github.com/stepkobetsu-hub/seiseki-kanri) | `main` | `meeting_memo.html`、成績管理共通GAS | GitHub＋Apps Script | Pages更新。GAS変更は成績管理への影響も確認 | 2026-07-22 | 成績管理と同じGASへ接続する現行版 |
| エントリーシート読み取り | 本番使用中 | https://stepkobetsu-hub.github.io/seiseki-kanri/entry_import.html | [seiseki-kanri](https://github.com/stepkobetsu-hub/seiseki-kanri) | `main` | `entry_import.html`、成績管理リポジトリ内一式 | GitHub＋Google Sheet | Pages更新後、対象Sheetとの接続確認 | 2026-08-15 | `entry_import.html`を現行版とする。資産管理ページでは「受付カード・エントリーシート読み取り」カードに集約し、「エントリーシート（デジタル版）」も同カードの日常利用に表示する |
| お友達紹介カード読み取り | 本番使用中 | https://stepkobetsu-hub.github.io/seiseki-kanri/referral_card_import.html | [seiseki-kanri](https://github.com/stepkobetsu-hub/seiseki-kanri) | `main` | `referral_card_import.html`、スタッフ用入口 `index.html`、成績管理共通GAS | GitHub Pages＋既存AI読取サーバー＋Apps Script＋Google Drive＋Google Sheet | Pages更新後、空欄カードでAI接続、スマホ撮影、原本画像、取込日時、3特典チェック、一覧更新を確認 | 2026-08-18 | ChatGPT Sites試作版ではなくGitHub Pages版を本番とする。新しいログイン・利用者APIキー入力なし。互換識別子 `REFERRAL_CARD_V1` を維持 |
| V-code ID＆Pass 印刷 | 本番使用中 | https://vcode-poster-maker.mintcocoajasmine.chatgpt.site | GitHub正本なし（ChatGPT Sites管理） | 該当なし | ChatGPT Sites管理ソース、固定ログインQR、月別V-code案内 | ChatGPT Sites（所有者限定公開）＋Gmail確認 | 新しい月の案内到着後、月別データを追加し、年月・ID・PW・QR・A4/PDF印刷を確認 | 2026-08-19 | 所有者限定公開。ID・PWの実値を台帳やGitHubへ記載しない |
| 受付カード読み取り | 本番使用中 | https://docs.google.com/spreadsheets/d/16K335J5meUGgGPFBZzRnDfFQb_Pzh8WtwmKZjWC1e9I/edit | なし | 該当なし | 受付カードGoogle SheetのバインドApps Script | Apps Script管理 | Sheetの「拡張機能→Apps Script」から既存デプロイを更新 | 2026-07-21 | GitHubの試作候補を正本扱いしない |
| 過去問保管DB | 本番使用中 | https://stepkobetsu-hub.github.io/seiseki-kanri/past_exam_db.html | [seiseki-kanri](https://github.com/stepkobetsu-hub/seiseki-kanri) | `main` | `past_exam_db.html`、`past_exam_upload.html`、バインドApps Script | GitHub＋Apps Script＋Drive | Pagesと既存Webアプリを更新し、2つのDrive用途を確認 | 2026-07-22 | 現行Webアプリ v129。内蔵学生提出画面とPages登録画面を区別 |
| STEP配信システム | 本番使用中（欠席一覧の低負荷自動更新・当日分はA列タイムスタンプ新着順） | https://stepkobetsu-hub.github.io/step-message-center/ | [step-message-center](https://github.com/stepkobetsu-hub/step-message-center) | `main`（現行 `39882d1`／当日新着順 `81905b5`／キャッシュ更新 `39882d1`／低負荷自動更新 `0688178`／当日優先 `b02dafe`／元データリンク `74c4943`／1行表示 `13b7b4a`） | `index.html`、`app.js`、`api.js`、`style.css`、`Code.gs`、Apps Script Webアプリ v53（今回変更なし）。欠席・遅刻・早退の回答正本：[遅刻・欠席・早退連絡（回答）](https://docs.google.com/spreadsheets/d/1c2He5p_FMXGq0Gor74wIrJKtdBvTdjmO992ZkNSVuLQ/edit)、Spreadsheet ID `1c2He5p_FMXGq0Gor74wIrJKtdBvTdjmO992ZkNSVuLQ`、参照シート `★欠席遅刻` | GitHub Pages＋既存Apps Script v53＋Brevo＋Google Sheet | 欠席一覧はページ起動時に元データを1回更新、表示中は5分ごとにキャッシュ確認、10分ごとに元データを予備更新。当日分は元データA列タイムスタンプの新しい順。フォーム送信トリガーと手動更新を維持。API変更時だけApps Script既存デプロイIDを維持して新版へ更新 | 2026-08-20 | 当日分を最上部にまとめ、その中をA列タイムスタンプ降順（新着順）で表示。同時刻は元行番号の新しい順。未来日の既存順序、元Google Sheet、メール送信、Apps Scriptは変更なし。公開画面で 18:46→18:24→17:25→16:46→16:33 の順を確認。詳細は `docs/step-message-center-absence-refresh-20260817.md` |
| 不達メール管理 | 本番使用中 | https://stepkobetsu-hub.github.io/student-QR/delivery_failures.html?v=575679fd | [student-QR](https://github.com/stepkobetsu-hub/student-QR) | `main` | `delivery_failures.html`、入退室ログ2「不達メール管理」 | GitHub＋Apps Script＋Brevo | Pages更新後、保存先Sheetと配信連携を確認 | 2026-07-21 | STEP配信システムとの関連機能として区別 |
| 講師ポータル | 本番使用中 | https://stepkobetsu-hub.github.io/teacher-portal/ | [teacher-portal](https://github.com/stepkobetsu-hub/teacher-portal) | `main` | `index.html`、`script.js`、`Code.gs` | GitHub Pages＋Apps Script | `main`へ反映してPages確認。API変更時は既存Apps Scriptとの対応も確認 | 2026-08-06 | 空の `eacher-portal` は正本ではない。出退くんQRの画面遷移は `script.js` を確認 |
| 講師マスター／給与明細 | 本番使用中 | 要確認 | なし（要確認） | 該当なし | 給与明細Webアプリ関連Apps Script | Apps Script管理 | 正本Sheet／プロジェクト確定後、既存デプロイを更新 | 2026-07-20 | 正本未確定の候補は変更しない |
| 出退くんQR作成・読取 | 本番使用中（管理者アプリPC最適化・QR検索／カード印刷対応） | **管理者QR登録:** https://stepkobetsu-hub.github.io/student-QR/student_qr_register.html<br>**塾生用QR:** https://stepkobetsu-hub.github.io/student-QR/my_qr.html | [student-QR](https://github.com/stepkobetsu-hub/student-QR) | `main`（管理者アプリ最新 `8d3894e`） | `student_qr_register.html`、`my_qr.html`、`cloudflare/checkin-edge/src/legacy-tablet.html`、`cloudflare/checkin-edge/src/checkin-do.ts`、`gas/EdgeRosterSync.gs`、`gas/コード.js`、入退室ログ2 | GitHub＋Cloudflare Workers/Durable Objects＋Apps Script＋Google Sheet | 管理者画面はGitHub Pages `main`へ反映。QR受付基盤変更時はWorkerを自動デプロイし、Apps Script変更時は既存デプロイIDを更新する。管理者アプリはPC表示、検索、カード実寸印刷、現行／新規QR、通知先メール、勤怠CSVを回帰確認 | 2026-08-20 | 端末読取の現行入口はWorker `/legacy-tablet`。管理者QR登録は `student_qr_register.html`。旧GitHub Pages `tablet_checkin.html` とApps Script直接受付はフォールバックとして維持。今回の詳細は `docs/student-qr-admin-pc-20260820.md` |
| 講師予定・夏休み出勤登録 | 本番使用中 | https://stepkobetsu-hub.github.io/teacher_schedule/teacher_app.html | [teacher_schedule](https://github.com/stepkobetsu-hub/teacher_schedule) | `main` | `teacher_app.html`、Supabase関連コード | GitHub＋Supabase＋Apps Script出力 | PagesとSupabaseを更新し、校舎別Sheet転記を確認 | 2026-07-22 | 現行はSupabase経路。旧GAS入力Webアプリ群は旧版 |
| 請求管理システムV3.1（学費計算・請求データ作成） | 本番使用中（Apps Script v74） | https://script.google.com/macros/s/AKfycbxzkE1tQRyB_Ca4bfPKYWIkpTukIVPMWKf2ETE7yN7qROJk0VyOlvxaJ9GGI5p-6pGb/exec | GitHub正本なし（Apps Script管理） | 該当なし | Apps Script `請求システム2026NEW`、project `1FQElz87j5yB-FNwuDE9LJ3_nD8rzF_vIGTTWKDr15KDygGxXnZLlXhIp`、`コード.gs`、`BillingV31_Index.html`、`BillingV31_Auth.gs`、`BillingV31_InvoiceMail.gs` | Google SheetバインドApps Script | [Apps Script編集画面](https://script.google.com/home/projects/1FQElz87j5yB-FNwuDE9LJ3_nD8rzF_vIGTTWKDr15KDygGxXnZLlXhIp/edit)から既存デプロイを新バージョンへ更新 | 2026-08-12 | **学費計算・請求データ作成用。下記PDF作成・メール配信システムとは別物。Cloudflare版コードを入れない** |
| STEP請求書PDF作成・配信システム | 本番稼働中（明細連携・新規CSV取込最優先） | https://stepkobetsu-hub.github.io/invoice-pdf/ | [invoice-pdf](https://github.com/stepkobetsu-hub/invoice-pdf) | `main`（最新確認 `c9f00a58`） | `index.html`、`assets/`、`apps-script/Code.gs`、`cloudflare/`、Apps Script `コード_v023.gs`、`Download.html`、`appsscript.json` | GitHub Pages＋Apps Script＋Google Sheet＋Cloudflare Worker/D1/非公開R2 | [専用Apps Script正本](https://script.google.com/home/projects/1SnTqPE8bSQKLkiJI6rPo-7WGQDZoqGpwY7LAAox3FFsj3sGstnHf41X1/edit)の既存デプロイを維持。再送PDFを再生成せず、Cloudflareで100件の配信URLを一括発行してバックグラウンド送信する | 2026-08-12 | Worker `step-invoice-api` Version `a15d34ed-fe4d-494d-a677-79be2ca7bbac`、D1 `step-invoice-db`、R2 `step-invoice-pdfs`。全明細を保持し、新しいCSV取込グループを一覧最上段、同一取込内を生徒番号降順で表示。`請求システム2026NEW` は対象外。秘密値・個人情報・CSV・PDFはGitHubや台帳へ保存しない |
| お問い合わせ管理 | 本番使用中 | https://stepkobetsu-hub.github.io/step-form/contact_form.html | [step-form](https://github.com/stepkobetsu-hub/step-form) | `main` | `contact_form.html`、`問い合わせ.gs` | GitHub＋Google SheetバインドApps Script | Pagesと既存GASデプロイを整合させる | 2026-07-20 | 生徒管理側の連絡先を優先する現行設計 |
| STEP業務ホーム | 本番（全端末共有・版競合防止） | https://stepkobetsu-hub.github.io/step-workspace/ | [step-workspace](https://github.com/stepkobetsu-hub/step-workspace) | `main`（現行 `22aa02b`） | `index.html`、`styles.css`、`core.js`、`app.v20260818-32.js`、`app-catalog.json`、`rebuild-workspace.html`、`tests/` | GitHub Pages＋既存スタッフ共通認証＋共有設定API＋localStorageキャッシュ | `main`へ反映してPages、認証、共有版番号、版競合拒否、7項目・42カード、検索、編集、並べ替え、全リンクを確認 | 2026-08-19 | 共有設定版5を基礎に、お友達紹介カード読み取り、全県模試受験票作成、V-code ID＆Pass 印刷を管理・運営へ必須追加。古い版・版番号なしの保存要求は拒否し、最新版を再読込する |
| STEP統合管理ポータル | 本番使用中 | https://stepkobetsu-hub.github.io/step-hub/system/ | [step-hub](https://github.com/stepkobetsu-hub/step-hub) | `main` | `system/index.html`、`system/data.js` | GitHub Pages | `main`へ反映してPages確認 | 2026-07-22 | 資産台帳の正本は本リポジトリへ移転。統合入口として継続 |
| STEP塾生アプリ（step-hub） | 本番使用中 | https://stepkobetsu-hub.github.io/step-hub/ | [step-hub](https://github.com/stepkobetsu-hub/step-hub) | `main` | `index.html`、`my_qr.html`、`manifest.webmanifest`、`sw.js` | GitHub Pages＋各機能の既存本番基盤 | `main`へ反映し、共通ログイン・本人限定表示・PWA・各リンクを確認 | 2026-08-01 | 本項目はデザイン変更開始前までの確定仕様。以後のデザイン試作・画像・画面レイアウト履歴とは分離 |

## V-code ID＆Pass 印刷：本番仕様

- 本番URL: https://vcode-poster-maker.mintcocoajasmine.chatgpt.site
- 公開範囲: ChatGPTの所有者アカウントだけが利用できる非公開アプリ。外部訪問者は許可しない
- 用途: 対象年月を選び、V-code電子テキストの月別ID・パスワード、固定ログインQR、年月を配置したA4縦1ページの掲示物を作成する
- 月別案内の確認元: `mintcocoajasmine@gmail.com` のGmailで、送信元 `support@e-sia.jp`、件名「【V-code】電子テキスト ログインID・PW変更のお知らせ」を確認
- 登録済み範囲: 2026年1月～8月。対象月を選択すると該当月の登録済み内容を取得する
- 表示・印刷: 「V-code」「YYYY年」「M月」「固定ログインQR」「ID」「PW」を大きく表示。A4プレビューからブラウザの印刷画面を開き、PDF保存または印刷する
- PDFファイル名: `V-code YYYY年M月.pdf`
- 毎月の更新: 新しい月の案内メール到着後、対象月データを追加し、年月・ID・PW・QR・A4/PDF印刷を確認して公開する
- データ保護: ID・パスワードの実値は本台帳、GitHub、公開ページの説明へ記載しない。アプリ本体は所有者限定公開を維持する
- 確認日: 2026-08-19。7月分の取得、年月表示、A4印刷画面を確認
- 関連入口:
  - スタッフ用アプリ: https://stepkobetsu-hub.github.io/seiseki-kanri/
  - STEP業務ホーム: https://stepkobetsu-hub.github.io/step-workspace/
  - STEPシステム資産管理台帳: https://stepkobetsu-hub.github.io/step-system-registry/

## お友達紹介カード読み取り：本番仕様

- 本番URL: https://stepkobetsu-hub.github.io/seiseki-kanri/referral_card_import.html
- GitHub正本: `stepkobetsu-hub/seiseki-kanri` の `main / referral_card_import.html`
- 利用入口: スマートフォンで撮影または画像選択。新しいログインや利用者によるAPIキー入力は不要
- AI読取項目:
  - 紹介された方：学年、氏名、TEL
  - 紹介した方：学年、氏名、TEL
  - 紹介した方の図書カード1,000円
  - 紹介された方の図書カード1,000円
  - 紹介された方の初回学費2,000円割引
- 「済」判定: 「済」「済み」「すみ」「完」「配布済」など、同じ意味またはよく似た崩し字を処理済み候補とする。ただし、大きな丸・長い線・隣欄から通過した囲みだけでは処理済みにしない。図書カード2欄が済でも、初回学費欄に個別の済印がなければ学費割引は未処理
- 保存内容: 原本画像URL、画像取込日時、両者の学年・氏名・TEL、3特典の状態、AIメモ
- 保存経路: 原本画像は成績管理共通GASの `uploadEntryImage` でGoogle Driveへ保存。管理レコードは `REFERRAL_CARD_V1` を付け、`saveWish`／`getAllWishes` の互換経路で保存・取得
- 一覧機能: 氏名・TEL検索、すべて／未完了／完了の絞り込み、3特典の個別更新、原本画像リンク
- 運用注意: OCR結果は保存前に人が確認する。個人情報画像・原本URLをGitHubや公開台帳へ保存しない
- 確認日: 2026-08-18。公開URL HTTP 200、空欄カードで既存AIサーバーの画像認識接続を確認
- 関連入口:
  - スタッフ用アプリ: https://stepkobetsu-hub.github.io/seiseki-kanri/
  - STEP業務ホーム: https://stepkobetsu-hub.github.io/step-workspace/
  - STEPシステム資産管理台帳: https://stepkobetsu-hub.github.io/step-system-registry/

## STEP配信システム：遅刻・欠席・早退回答連携

- 回答データ正本: [遅刻・欠席・早退連絡（回答）](https://docs.google.com/spreadsheets/d/1c2He5p_FMXGq0Gor74wIrJKtdBvTdjmO992ZkNSVuLQ/edit)
- Spreadsheet ID: `1c2He5p_FMXGq0Gor74wIrJKtdBvTdjmO992ZkNSVuLQ`
- STEP配信システムが読むシート: `★欠席遅刻`
- 回答項目: タイムスタンプ、生徒名、校舎名、対象日、理由、欠席・遅刻・早退の内容など
- 保護者向け連絡フォーム入口（STEP配信システムの案内テンプレートに記載）: https://x.gd/WfTJM
- 実装上の接続: `stepkobetsu-hub/step-message-center` の `Code.gs` に `DEFAULT_ABSENCE_ID` と `ABSENCE_SHEET_NAME` を定義
- データの流れ: 回答Google Sheet `★欠席遅刻` → `refreshAbsenceCache()` → STEP配信システム側 `欠席キャッシュ` → Web画面の欠席・遅刻連絡一覧
- 更新方法: 回答先を変更する場合は、Google Formの回答先だけでなく、`Code.gs` のSpreadsheet ID、対象シート名、フォーム送信トリガー、手動更新、60秒自動更新をすべて照合する
- 確認根拠（2026-08-17）: Google Sheet正本のタイトル・Spreadsheet ID・`★欠席遅刻`見出しと、GitHub正本 `Code.gs` の `DEFAULT_ABSENCE_ID`／`ABSENCE_SHEET_NAME`、`app.js` の欠席一覧表示処理が一致

## STEP業務ホーム（次回はここから着手）

### 現行本番

- 本番URL: https://stepkobetsu-hub.github.io/step-workspace/
- GitHub正本: https://github.com/stepkobetsu-hub/step-workspace
- 公開ブランチ: `main`
- 現行コミット: `217a3aa`（2026-08-14）。再作成の基点は `031a986`。
- 共有設定: 版5を基礎に、必須カード「お友達紹介カード読み取り」「全県模試受験票作成」「V-code ID＆Pass 印刷」を追加した7項目・42カードを全パソコンで表示。
- 再作成ページ: https://stepkobetsu-hub.github.io/step-workspace/rebuild-workspace.html
- 復旧補助ページ: `recover-workspace.html`、`repair-workspace-v2.html`。通常運用では使用せず、障害調査時だけ内容を確認して使う。

### 現行の7項目とカード数

1. 生徒・授業（7件）
2. 時間割（4件）
3. 連絡・受付（8件）
4. 管理・運営（7件）
5. 請求・会計（4件）
6. 講師・給与（7件）
7. ポータル・ホーム（5件）

合計42カード。利用者が貼り付けた2026-08-14時点の39カードを再作成基礎とし、「お友達紹介カード読み取り」「全県模試受験票作成」「V-code ID＆Pass 印刷」の3件を管理・運営へ必須追加した。既存35件と新規3件、合計38件のURLを、端末に残る同名カードまたは本台帳の正式URLから引き継いだ。URLを確定できなかった4件は、誤ったリンクを開かないようカード名の先頭へ「リンク切れ」を付け、鉛筆ボタンから後で正しいURLへ修正できるようにした。

### URL要確認の4カード

- 生徒マスタ
- 欠席・遅刻連絡
- 講師マスター／給与明細
- 同名で2枚ある「夏休み講習時間割（個人用→全体時間割作成）」のうち、端末からURLを回収できなかった1枚

正しい本番URLを確認したら、STEP業務ホームの鉛筆ボタンで「リンク切れ」を外してURLを設定する。更新後は共有保存の完了表示と版番号を確認し、別ブラウザでも反映を確認する。URLや個人情報を推測で登録しない。

### 機能・保存仕様

- 既存スタッフ共通認証を利用し、権限2・3・4を対象とする。明示的にログアウトするまで端末の安全なセッション情報を利用する。
- 項目名・項目順・カード・カード順・項目間移動・利用端末・カード編集・アーカイブ・お気に入りを管理できる。
- 項目とカードはドラッグ＆ドロップで並べ替え・移動できる。左項目一覧へのカードドロップにも対応する。
- カードはすべて別タブで開く。Google Sheetsマーク、PC／スマホ／両方、ハートのお気に入り、鉛筆編集、アーカイブ操作を保持する。
- 共有設定は認証済みバックエンドの `getWorkspaceConfig`／`saveWorkspaceConfig` を使い、端末のlocalStorageは高速表示と一時キャッシュに使う。
- 共有保存時は、読み込んだ共有版番号を `expectedVersion` として必ず送る。バックエンドはScriptLock内で現行版と照合し、古い版または版番号なしの保存を `WORKSPACE_VERSION_CONFLICT` として拒否する。競合時は現行共有設定を返し、画面側で最新版を再読込して変更のやり直しを案内する。
- 現行の再作成設定は `replaceCatalog: true`。共有設定版5の39カードを基礎に、必須カード「お友達紹介カード読み取り」「全県模試受験票作成」「V-code ID＆Pass 印刷」を追加して42カードを表示し、それ以外の別カードは自動で混ぜない。
- 共有設定内の追加カードはカードIDで識別する。同じURLや同じページ内のハッシュを使うカードでも、IDが異なれば重複排除せず表示する。これにより7項目・42カードを全件表示する。
- ログイン画面は保存済みカタログを先に表示し、台帳・共有設定の通信は背景で行う。通信障害だけを理由に、表示可能な保存済みホームから直ちにログアウト画面へ戻さない。

### 2026-08-13〜14の障害と復旧履歴

- 当初は項目・カード配置の大部分がブラウザごとのlocalStorageにあり、同じアカウントでも別パソコン・別ブラウザで異なる配置が見えた。
- 全端末共有APIを追加した後、古い配置を持つブラウザから更新・保存したため、サーバー側へ古い配置が上書きされた。
- 最新タブを識別するため「5555」カードを追加し、同一Chromeから復旧データを抽出。項目情報が欠けていたため、最終的に利用者が貼り付けた全画面一覧から7項目・39カードを再作成した。
- 復旧用コミット: `9c4281d`（端末配置復旧ページ）、`69c4cf8`（7項目復旧補助）、`031a986`（39カード再作成と再作成一覧優先）。
- 共有設定バックエンドのGitHub記録: `stepkobetsu-hub/seiseki-kanri` コミット `cc005ad`。Apps Script側は共有設定対応版を既存デプロイへ反映済み。秘密値・セッショントークンは本台帳へ記載しない。
- 2026-08-14に版競合防止を追加。フロントエンド `1653eb7`、共有設定バックエンド `stepkobetsu-hub/seiseki-kanri` の `5303698`。Apps Scriptは既存デプロイを維持してバージョン67へ更新済み。古いタブ、古いブラウザ、旧フロントからの保存は最新版を上書きしない。
- 同日、本番確認で共有設定39件のうち同じURLを持つ別カードが重複扱いされ、画面上では一部が欠ける問題を確認。`217a3aa` で追加カードの同一URLを許容し、カードIDが異なる39件をすべて表示するよう修正した。

### 次回変更時の必須手順

1. 作業開始前に、古いSTEP業務ホーム、復旧ページ、再作成ページのタブをすべて閉じる。閉じ忘れた旧タブから保存してもバックエンドが版競合として拒否するが、操作混乱を避けるため原則は閉じる。
2. 新しいタブで本番を開き、7項目・42カードと「管理・運営」のお友達紹介カード読み取り、全県模試受験票作成、V-code ID＆Pass 印刷、最新の共有表示を確認する。
3. `stepkobetsu-hub/step-workspace` の `main`、本台帳の本節、直近コミットを先に読む。
4. 変更は新しい1つのタブだけで行い、保存完了後の共有版番号を記録する。
5. 別ブラウザまたは別パソコンで再読込し、同じ項目・カード・順番・URLが表示されることを確認する。
6. 古いページから「この配置を全端末へ反映」や編集操作を行わない。現行バックエンドは古い版の保存を拒否して最新版を返すため配置は巻き戻らないが、競合メッセージ後は最新版で変更をやり直す。
7. コード変更時は `npm test`、GitHub Pages、ログイン維持、検索、カード編集、ドラッグ＆ドロップ、共有同期、PC・スマホ幅を確認する。

### 今後の改善候補

- 保存前の自動バックアップと、管理画面からの版履歴・復元を追加する。
- URL要確認4カードの正式URLを台帳で確定し、「リンク切れ」を解消する。
- 認証情報そのものをlocalStorageへ長期保存せず、安全なセッションだけでログイン維持する設計を継続確認する。

## 請求関連システムの識別（最初に確認）

### A. 請求管理システムV3.1（学費計算・請求データ作成）

- Apps Scriptプロジェクト名: `請求システム2026NEW`
- Apps Script編集URL: https://script.google.com/home/projects/1FQElz87j5yB-FNwuDE9LJ3_nD8rzF_vIGTTWKDr15KDygGxXnZLlXhIp/edit
- 画面で確認するファイル: `コード.gs`、`BillingV31_Index.html`、`BillingV31_Auth.gs`、`BillingV31_InvoiceMail.gs`
- 現行デプロイID: `AKfycbxzkE1tQRyB_Ca4bfPKYWIkpTukIVPMWKf2ETE7yN7qROJk0VyOlvxaJ9GGI5p-6pGb`（既存ID維持、2026-08-12にバージョン74へ更新）
- 確定権限仕様: 模試マスタと模試申込は、AK権限2以上（2・3・4）で追加・編集・削除・一括登録・請求対象ON/OFF・全員チェック・全解除・チェック済み申込の一括削除が可能。権限1以下は拒否する。
- 模試仕様: 対象学年の在籍生徒を全員一覧表示し、右端の請求対象チェックで受験／非受験を管理する。全員チェック・全解除・個別調整に対応。チェックONの生徒のみ模試代を請求する。非受験者を削除して管理する旧方式は廃止。チェック済み申込データの一括削除は管理操作として用意し、削除後も生徒は一覧に残って請求対象OFFとなる。
- 模試データ保存: `模試申込` の6列目を `請求対象` Boolean（TRUE/FALSE）として明示保存する。旧行は従来の請求状態をONとして安全移行し、今後は行の存在ではなくBoolean TRUEだけを請求計算・請求確認・MF等の元データへ含める。
- 模試実装・検証: `コード.gs` の `ensureMockBillingSchema_`、`billingImpl_getMockBillingRoster_`、`saveMockBillingTargets_`、`billingImpl_deleteCheckedMockBillingTargets_`、`readMockTestEntries_`、`BillingV31_Index.html` の模試一覧UI、`BillingV31_Auth.gs` のAK>=2ルーティングを更新。2026/09「第３回愛知全県模試」対象62名で全解除、全選択、個別OFF、再読込保持、OFFの請求抽出除外、別月・別模試非干渉、権限設定、状態復元を確認。
- 用途: 生徒マスタ・時間割マスタ・料金表を参照して、学費計算と請求データを作成する。
- 注意: このプロジェクトはSTEP請求書PDF作成・配信システムではない。Cloudflare版コードやPDF配信用Script Propertiesを設定しない。

#### 2026年8月12日 請求CSV連携・月次操作UI更新

- 請求明細連携: 「請求書PDF作成・配信へ進む」で渡すCSVは、合計1項目への集約を廃止し、授業料・諸経費・教材・模試・調整等の明細名と金額を最大8明細まで個別に保持する。件名と明細を分離して保護者向け請求書へ渡す。
- 在籍更新後の再作成判定: 在籍更新時刻と請求再作成時刻をDocument Propertiesへ記録して比較する。古い単一フラグだけが残り、再作成済みでもCSV出力を拒否する不具合を解消した。
- 月次操作手順: ホームカード右側に、①在籍生徒を今すぐ更新、②今月の請求設定、③請求作成、④エラーチェック、⑤請求確認を表示する。
- エラーチェック: ④は請求を再作成した後、`Errors` 画面へ自動移動し、`getErrorRowsForAdmin` で最新のエラー一覧を読み込む。③の請求作成だけを呼ぶ旧配線は廃止した。
- 処理表示: 作成中・読込中などは画面中央の小型パネルで表示し、完了も中央へ約3秒表示して自動的に消す。
- 工事中表示: ホームカードと左ナビの「PDF・メール送信」は「PDF・メール送信（工事中）」と表示する。
- 本番更新履歴: v68 全請求明細CSV連携、v69 在籍更新・請求再作成時刻判定、v70 中央処理表示、v71 ①〜⑤・工事中表示・中央通知小型化、v72 エラーチェック後のエラー一覧自動表示。すべて既存デプロイIDを維持。
- 変更ファイル: `コード.gs`、`BillingV31_Index.html`。`BillingV31_InvoiceMail.gs`、認証方式、既存デプロイIDは維持した。

#### 2026年8月12日 CSV品名・備考・振込先設定（v73）

- CSV品名簡略化: 明細名の先頭に付く「追加口座」「追加講座」「模試：」をCSV出力時に除去する。講座名・模試名本体と金額は維持する。
- 備考W列: 全員共通の標準文言を `個別指導ステップ（運営：株式会社エデュクレスト）` とする。中3は次行へ `※中３は９月より直前講座が必修受講となります。` を追加する。
- 振込先X列: 口座振替対象者の振替日を含む既存自動文言を維持する。設定による自動／追加／置換／空欄を選べるが、初期状態では従来の自動判定を変更しない。
- 管理画面: 左ナビへ「備考・振込先設定」を追加。全員・学年・生徒別に、W列とX列の追加／置換／自動／空欄を設定できる。設定の一覧、編集、有効・無効、削除に対応する。
- 設定保存: 専用シート `備考・振込先設定` を使用し、設定ID、対象種別、対象値、列、動作、文言、有効・無効、更新日時を保存する。適用優先順は全員→学年→生徒。全員標準備考と中3追加備考を初期登録済み。
- 既存機能保護: 学費計算、対象生徒選択、口座振替可否、振替日の自動計算、料金、CSV列順・116列構成、認証、既存デプロイIDを維持。STEP請求書PDF作成・配信システム側は変更していない。
- 検証: 中3の2行備考、中3以外の標準備考、振込先自動文言、CSV品名の接頭語除去、CSV 116列維持、設定シート初期化を確認。Apps Scriptの `testBillingTextSettingsLogic` と `testBillingTextSettingsInitialization` は実行完了。
- 本番: `請求システム2026NEW` を既存デプロイIDのままバージョン73へ更新。説明は「備考・振込先設定・CSV品名簡略化 2026-08-12」。
- 復旧: 問題時は既存デプロイをバージョン72へ戻す。2026-08-12 10:05時点の全ソースを復元用ZIPとしてローカル保管済み。個人情報・CSV実データ・秘密値は保存していない。

#### 2026年8月12日 振込先自動ルールの見える化（v74）

- 現行コード調査結果: ☆マスタN列は `row[13]` を読み、TRUE、1、○、〇、済、振替OKを有効として扱う。実際の対象判定は「生徒番号1300以下は従来互換で対象、1301以上はN列が有効な場合だけ対象」。この条件は変更していない。
- 引落日調査結果: `getPaymentDue_` は対象請求月の前月27日を固定で返す。土日・祝日を翌金融機関営業日へ補正する処理は現行コード内に存在しないため、新しい簡易判定を追加せず、画面にも「営業日補正なし」と明記した。
- 設定画面: 「振込先 自動設定」セクションへ判定元、実際の現行判定、現在の請求設定で使う自動引落日、自動文言、対象外時の空欄、N列と現行自動判定の件数を表示する。☆マスタN列は参照のみで書き換えない。
- 実データ確認: 在籍91名、N列口座有効80名、N列未設定11名、現行自動判定の対象80名、対象外11名。現在の自動引落日は2026/08/27。
- 例外設定: 学年別・生徒別に「自動設定を使用【デフォルト】」「自動文言に追記」「指定文言で置換」「空欄にする」を選択可能。「自動設定を使用」は広い対象の例外を解除し、その生徒の現行自動判定へ戻す。
- 検証: 例外なしの自動文言維持、生徒別空欄、生徒別置換、自動復帰、1300以下／1301以上の現行判定、2026/08/27、日曜2026/09/27が現行どおり補正されないこと、実データ件数集計を確認。Apps Script試験2件は実行完了。
- 本番: 既存デプロイIDを維持してバージョン74へ更新。説明は「振込先自動ルール表示・例外設定強化 2026-08-12」。
- 復旧: 問題時はバージョン73へ戻す。v73全ソースの復元用ZIPをローカル保管済み。

### B. STEP請求書PDF作成・配信システム

- 利用者向け画面: https://stepkobetsu-hub.github.io/invoice-pdf/
- GitHub正本: https://github.com/stepkobetsu-hub/invoice-pdf
- Apps Scriptプロジェクト名: `STEP請求書PDF作成・配信システム`
- Apps Script編集URL: https://script.google.com/home/projects/1SnTqPE8bSQKLkiJI6rPo-7WGQDZoqGpwY7LAAox3FFsj3sGstnHf41X1/edit
- Apps ScriptプロジェクトID: `1SnTqPE8bSQKLkiJI6rPo-7WGQDZoqGpwY7LAAox3FFsj3sGstnHf41X1`
- 現行デプロイ: 既存デプロイIDを維持してApps Scriptバージョン39を2026-08-12に反映済み。
- デプロイID: `AKfycbwo1DdSQ2eUVVU35v1TqermHTgIEsT1u4U-M_67KfA50VelbHsh28W_pec56OlyBkxqaw`
- WebアプリURL: https://script.google.com/macros/s/AKfycbwo1DdSQ2eUVVU35v1TqermHTgIEsT1u4U-M_67KfA50VelbHsh28W_pec56OlyBkxqaw/exec
- 接続Spreadsheet: `STEP請求書PDF作成・配信システム`（ID `1NXdr3f_GCQ2CAuyy0i_Ap0dC5w4cKRgNbUAfdolTN0Y`）
- Apps Scriptファイル: `コード_v023.gs`、`Download.html`、`appsscript.json`
- Cloudflare切替ブランチ: `agent/cloudflare-production-switch`、PR #12、接続設定コミット `deb5e57`
- Cloudflare Worker: `step-invoice-api`
- Worker URL: https://step-invoice-api.stepkobetsu.workers.dev
- Worker Version: `a15d34ed-fe4d-494d-a677-79be2ca7bbac`
- D1: `step-invoice-db`（binding `DB`）
- 非公開R2: `step-invoice-pdfs`（binding `PDFS`）
- 2026-08-10確認: D1マイグレーション3件適用済み、R2接続済み、Worker `/health` は `ok=true`・`storage=cloudflare-r2`。Worker管理API自体は認証済みローカル環境から `ok=true` を確認済み。
- Apps Script結合試験: `CLOUDFLARE_ADMIN_API_KEY` とWorkerの `ADMIN_API_KEY` を同期し、`testCloudflareIntegration` の実行完了を2026-08-10に確認。秘密値は台帳へ記録しない。
- Apps Script: 上記プロジェクトを専用正本として確認済み。`請求システム2026NEW` は明確に対象外とする。
- 安全設定: メール送信は宛先・件数を確認してキューへ登録し、バックグラウンドで処理する。送信許可フラグやAPIキーなどの秘密値は台帳へ記録しない。
- 秘密情報: `ADMIN_API_KEY`、`TOKEN_PEPPER`、Apps ScriptのScript Properties実値は台帳・GitHubへ記録しない。

#### 2026年8月12日 更新・検証履歴

- 過去の確認状態: `本番稼働中（100件送信を約65秒で完了確認）`。この負荷試験結果は、後続の明細連携・取込順更新後も履歴として保持する。
- Worker更新履歴: 100件送信確認時 `7b6dbbe4-1fea-4374-a5dd-9bb8d043d2a2`、開封段階・アプリ内DL分離時 `a62f70e6-d8d6-4261-b43d-8a3a41160324`、現行は後記 `a15d34ed-fe4d-494d-a677-79be2ca7bbac`。
- GitHub正本: `stepkobetsu-hub/invoice-pdf` の `main`。確認時の最新コミットは `c9f00a58`。
- 新規請求書番号: 新規作成画面を開くたびに既存請求書番号の最大値＋1を自動入力する。番号欄は編集可能で、数字なら桁数を固定しない。同じ番号が既に存在する場合だけ新規保存を拒否する。
- ログイン: スタッフ共通認証の永続セッションを利用し、請求書アプリ側の通信エラーでは端末のログイン情報を削除しない。本人がスタッフ用アプリで明示的にログアウトするまで維持する。
- CSV一括作成: 請求日の形式を保存前に正規化。同一CSVを再度取り込んだ場合も別請求書として作成する。CSV内の許可されたメールアドレス列を利用可能。
- 一括送信: 再送時は保存済みPDFを再利用し、Cloudflareで最大100件の配信URLを一括発行してキューへ登録する。D1の一括上限内で新URL100件を作成後、旧URLを一括無効化する。
- 送信負荷試験: 指定されたテスト用3宛先を使った100件の実送信を2026-08-12に実施。開始 `2026-08-11T17:41:31.747Z`、最終送信済み `2026-08-11T17:42:36.802Z`、約65秒。配信履歴100件すべて「送信済み・未アクセス・正常」を確認。受信箱での到着確認とは区別する。
- 請求書一覧: 100件ずつ表示し「さらに読み込む」で追加表示。全選択チェック、一括メール送信、一括削除、一括入金（日付指定）、選択解除を維持。「すべての検索結果を選択する」は使用しない。
- 一覧表示: カードは約8件分の高さを上限とし、それ以降は一覧内スクロール。カード余白と送信状態表示を小型化し、「入金済」は11pxで表示。
- 詳細表示: 取引先名・作成日・請求書番号・入金情報をコンパクトに整理。メモとタグは作成日側の次の行へ横並びで表示。操作ボタンは高さ38pxの1段表示。
- 画面遷移: 通常起動時は請求書一覧。ブラウザ更新では現在ページを維持し、請求書一覧へ強制移動しない。STEPロゴは請求書一覧へ戻る。
- 接続表示: 画面名は「請求書作成＆送信システム」。資産台帳上の正式名称は「STEP請求書PDF作成・配信システム」。
- 検証: JavaScript構文検査、UI、請求書ワークスペース、領収書、デモ保存・バックグラウンド送信、Cloudflare基盤・セキュリティの自動テストを通過。
- 開封表示: メールを開いた段階は「開封」、メール内URLを押した段階は「開封2」、PDFを表示した段階は「開封3」。複数表示せず、到達済みの最高段階1つだけを表示する。
- DL済: スタッフによるアプリ内PDFダウンロードだけを記録し、受信者側のURLアクセス・PDF表示とは分離する。表示位置は一覧カードの件名右横、9pxの小型表示。D1 migration `0007_invoice_open_levels.sql` で `invoices.app_downloaded_at` を追加。
- PDF複数ページ: 明細が多い場合は全品目を複数ページへ出力。1ページ目には入るだけ明細を配置し、2ページ目以降は生徒名・住所を繰り返さず明細の続きから表示する。税率別内訳・小計・合計、振込先、備考はそれぞれ分割しないブロックとして、残り領域へ入るものだけ前ページへ配置する。偶数明細行は薄色、フッターは下端余白内に配置する。
- 新規・複製・デモ: 通常の新規作成は取引先欄を空欄にし、複製時だけ元の取引先を引き継ぐ。デモ送信は取引先空欄、テスト100円、テスト割引-100円、請求0円のテンプレートを維持する。旧テスト送信モードは削除し、デモ送信は維持する。
- 検証追加: PDF複数ページ、再送リンク保持を含む全自動テストを通過。GitHub Pagesの最新版ファイル、Worker `/health`、D1 `app_downloaded_at` 列を本番で確認。
- 主要コミット: `df612e9`（バックグラウンド送信）、`f31216d`（一覧・詳細表示調整）、`67b306a`（100件配信URL一括発行・再送PDF再利用）、`534cbd0`（D1一括上限対応）、`571ce1f`（請求書番号・ログイン維持）、`b6d1c50`（公開キャッシュ更新）、`9ccd505`・`15ec788`・`c51518b`（PDF複数ページと出力ブロック配置）、`fff7068`・`1dec174`（開封段階・アプリ内DL分離と公開更新）、`94a5007`（全明細取込・一覧比較）、`c9f00a58`（CSV再取込時刻更新）。Apps Script v39。現行 Worker Version `a15d34ed-fe4d-494d-a677-79be2ca7bbac`。
- 確認済み事項: 同一CSV再取込でも別請求書を作成／最大100件のバックグラウンド送信／100件実送信を約65秒で完了／配信履歴100件すべて正常／一覧カード約8件／メモ・タグを作成日側の次行へ配置／請求管理システムV3.1と分離。

#### 2026年8月12日 請求明細・CSV取込順更新

- 明細取込: 請求管理システムV3.1から受け取るCSVの明細をすべて解析し、授業料・諸経費等を別明細としてPDFへ表示する。合計だけの1明細へ戻さない。
- 一覧の基本順: 新しいCSV取込グループを請求書一覧の最上段へ表示する。同じ取込グループ内は顧客コード（生徒番号）の大きい順とする。
- 再取込時刻: 同じ請求書番号を再取込した場合、D1の `created_at` も今回の取込時刻へ更新する。初回取込時刻が残って過去のダミー・手入力請求書より下へ並ぶ不具合を解消した。
- GitHub反映: PR #24（merge `94a5007`）で明細取込と一覧比較処理、PR #25（merge `c9f00a58`）でD1再取込時刻更新をmainへ反映した。
- Cloudflare反映: Worker `step-invoice-api` をVersion `a15d34ed-fe4d-494d-a677-79be2ca7bbac`へ更新。`/health` の `ok=true`・`storage=cloudflare-r2`を確認した。
- 検証: 一覧比較のcore test、Cloudflare invoice workspace test、`assets/core.js`・`assets/app.js`・`cloudflare/src/index.js`の構文検査を通過した。依存パッケージのネットワーク取得を要する全テストは未実行として区別する。
- 保護事項: 個人名、実CSV、PDF、メールアドレス、APIキー、Script Properties実値は台帳へ保存しない。

### 今後の請求関連調査ルール

1. 「学費・コース・料金・MF CSV」はAを開く。
2. 「請求書PDF・取引先・メール・ダウンロードURL」はBを開く。
3. Apps Scriptを変更する前に、プロジェクト名・ファイル名・編集URLの3点が台帳と一致することを確認する。
4. 一致しない場合は推測で変更せず、専用プロジェクトを正本確認する。

## 登録詳細：講師ポータル

- ID: `teacher-portal`
- 状態: 本番使用中
- 利用者向けURL: https://stepkobetsu-hub.github.io/teacher-portal/
- GitHub: https://github.com/stepkobetsu-hub/teacher-portal （本番ブランチ `main`）
- 正本ファイル: `index.html`（画面）、`script.js`（画面遷移・端末保存・API呼出）、`Code.gs`（Apps Script側）
- 次回の調査開始点: 出退くんQRの講師コード入力・QR表示・ログアウト・自動遷移は、最初に `teacher-portal/script.js` の `showNyutaikun`、`loadNyutaikunQr`、`saveTeacherSession`、`clearTeacherSession`、`logoutNyutaikun` を確認する。API接続先は同ファイル先頭の `API_URL` を確認する
- 画面構成: 1枚目は講師ポータルトップ、2枚目は講師コード入力、3枚目は講師コード・氏名・出退くんQR表示
- 2026-08-06確定仕様: 保存済みの講師コードとQRデータがある場合、2枚目を表示せず3枚目を即時表示する。毎回のAPI応答待ちは行わない
- 既存端末の初回移行: 講師コードだけが保存され、QRデータがまだ保存されていない端末でも2枚目は表示しない。3枚目を先に表示し、その画面内で初回だけAPIからQRデータを取得して端末へ保存する。以後は即時表示する
- 端末保存キー: `teacherCode`（講師コード）、`teacherName`（氏名）、`teacherQrCode`（QRデータに対応する講師コード）、`teacherQrData`（QRデータ）
- ログアウト仕様: 3枚目の「ログアウト」で上記4キーをすべて削除する。次回は必ず2枚目で講師コードの入力が必要。授業報告側のログアウトも同じ保存情報を削除する
- キャッシュ更新: `index.html` の読込URLを `script.js?v=20260806-instant-qr` に更新し、旧JavaScriptが残らないようにした
- GitHub本番コミット: `7d3326169ef5ab2f8c95b4ee46baec5bc16fe4e2`（`script.js`）、`16502435428ac051f3476dd2fe9d388382f383cf`（`index.html`・公開確定）
- 検証: JavaScript構文検査合格。保存済みQRの即時表示、ログアウト後の入力画面復帰、旧端末の3枚目先行表示と初回QR保存の3経路を自動確認。GitHub Pages公開HTMLのキャッシュ更新値と公開 `script.js` の新処理を確認
- 確認日: 2026-08-06

## 登録詳細：STEP塾生アプリ（step-hub）開発記録

- ID: `step-student-app`
- 更新日・仕様基準日: 2026年8月7日
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
- 同一端末・同一ブラウザーでは、一度ログインした後、本人が右上の「ログアウト」を押すまで生徒ID・パスワードの再入力を求めない。
- パスワードは端末へ保存しない。端末に保存するのは、ランダムで取り消し可能な共通セッショントークン、有効期限表示値、表示用プロフィールだけとする。
- 変更前の8時間セッションがまだ有効な場合は、次回のサーバー検証時に継続ログイン方式へ自動移行する。すでに期限切れの場合だけ、一度再ログインが必要。

### 自分のQR・高速化・権限制御

- 塾生専用ページで本人専用QRだけを表示する。
- 他人のQR取得、URL改ざん、他生徒ID指定を拒否する。
- 明示的なログアウト時はサーバー側でトークンを失効し、端末側の共通セッション・プロフィールを削除するため、次回は生徒ID・パスワード入力へ戻る。
- 退塾・無効化された生徒は、保存済みトークンがあっても生徒マスタの最新状態をサーバー側で確認して拒否する。
- キャッシュ、共通ログイン、即時表示、ログアウト時のキャッシュ削除、継続ログイン、旧セッションの自動移行を実装済み。
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
- 維持した機能: 共通ログイン、パスワード非保存、本人限定QR、QR高速化、アプリ内QR表示、成績管理・学習進捗管理への共通ログイン接続、フォレスタプラス入口、愛知全県模試、愛知県入試制度、学習資料、QR画面の生徒ID・氏名・校舎名表示とログアウト時キャッシュ削除。
- 非対象: QR本体ページ、本人限定API、認証API、成績管理、学習進捗管理、フォレスタプラス外部ログイン方式には復元による変更を加えていない。
- 検証: 自動試験6件合格、インラインJavaScript・manifest構文検査合格、375px・390px・412pxで横方向のはみ出しなし、公開版の各リンク・資料・PWAキャッシュ・QR iframe・未ログイン保護を確認。ブラウザー警告・エラーなし。
- Issue記録: `step-hub` Issue #14へ採用撤回と復元結果を記録し、クローズ理由を `not planned` へ変更。
- 管理上の扱い: 上記はデザイン変更前の確定仕様を上書きせず、その後の方針変更・復元履歴として分離して保存する。

### 2026年8月6日：明示的ログアウトまで共通ログインを維持

- 要望: STEP塾生アプリで生徒ID・パスワードを何度も聞かれないようにし、本人がログアウトするまでログイン状態を維持する。
- 画面側正本: `step-hub/index.html` の `readCommonSession`、`validateCommonSession`、`logout`、および `step-hub/sw.js`（キャッシュ `step-student-v21-persistent-login`）。ブラウザー内の期限だけでログイン画面へ戻さず、保存済みトークンをサーバーへ送って有効性を判定する。
- 認証API正本: `foresta-step-progress/apps-script/code.gs` の `STUDENT_SESSION_EXPIRES_AT`、`createSession_`、`makeStudentSessionPersistent_`、`requireActiveStudentSession_`、`verifySession_`、`logout_`、`getCommonStudentSession`。
- 連携画面: `foresta-step-progress/index.html` も、サーバー検証で返された有効期限を保存し、移行後の共通セッションを引き継ぐ。
- 安全設計: 生徒用のみ継続ログイン。講師・管理者用セッションは従来どおり8時間。認証情報は保存せず、失効可能なトークンだけを保存する。生徒マスタで無効・退塾になったIDは `STUDENT_INACTIVE` として拒否する。
- QR内部セッション: 自分のQR側の短期セッションが更新時期になっても、共通セッショントークンが有効なら自動再発行し、生徒ID・パスワードの再入力は求めない。
- Apps Script本番反映: プロジェクト「フォレスタステップ進捗管理【開発】」をバージョン84（2026年8月6日 01:44 JST）へ更新。既存デプロイIDとWebアプリURLを維持。
- GitHub反映: `step-hub` は `index.html` commit `85ae15d6eac639ce7902bac42dc0004726a8d74c`、`sw.js` commit `3831019de288af67e8f35af5949fb17b8453378d`、試験 commit `8c103c89e2badfb629593c735f8e022c4cffbe02`。`foresta-step-progress` は `apps-script/code.gs` commit `01286ac689ac5e9a3f03f5cdf01073bf6f4ea4ed`、`index.html` commit `22cef7ecdd8be3638a09cb13cadd23054bcedd56`、試験 commit `383f0dd201ec64ecaa0f15ecab7461ecc34fd093`。
- 検証: `step-hub` の共通ログイン試験9件合格。認証API側の継続ログイン・旧セッション移行・無効生徒拒否・明示的ログアウトの対象試験合格。
- 【次回ここから確認】再ログインが出る場合は、① `stepCommonStudentSessionToken` が端末にあるか、② `getCommonStudentSession` の応答コード、③生徒マスタの在籍状態、④ `step-hub/index.html` のService Worker読込版 `sw.js?v=21`、⑤Apps Scriptがバージョン84か、の順で確認する。パスワード保存を回避策にしない。

### 2026年8月7日：自分のQRを端末へ保存して即時表示

- 原因: `student-QR/my_qr.html` のQR表示キャッシュが15分で失効し、保存済みでも毎回バックグラウンドで本人セッションとQRをサーバーへ確認していたため、Apps Scriptの応答待ちが発生していた。
- 採用仕様: 初回に本人確認して取得した表示用QRを、同一端末・同一ブラウザーの `localStorage`（`stepMyQrDisplayCacheV5`）へ保存する。2回目以降は、保存済みQRをサーバー通信より先に描画し、その時点で処理を終了するため、本人確認API・QR取得APIへアクセスしない。
- 保存範囲: 生徒ID、表示氏名、校舎名、QR登録有無、QRデータだけ。パスワードおよびセッショントークンはQR表示キャッシュへ保存しない。
- 有効期間: 15分制限を廃止し、本人が明示的にログアウトするまで保存する。旧V4キャッシュが残っている端末はV5へ自動移行する。
- 取り違え防止: STEP塾生アプリの明示的ログアウト時にV5・V4・旧セッションキャッシュを削除する。別の生徒IDでログインした場合は、保存済み生徒IDとの不一致を検出して旧QRを削除し、新しい本人QRへ入れ替える。
- PWA更新: `student-QR/my_qr_sw.js` を `step-my-qr-v9-persistent-local-qr`、登録URLを `my_qr_sw.js?v=9` に変更し、旧キャッシュを自動削除する。
- GitHub反映: `student-QR` は `my_qr.html` commit `42b1c18634026ddfd2e9f43604580283a1bc189f`、`my_qr_sw.js` commit `19812fc59ef3790d9d4d65f9d7fff9132e051b93`、対象試験最終 commit `d20dafdded54368d65f6f579605e0a72812defd4`。`step-hub` は `index.html` commit `b5bb43ffa6286c22fc4585f8ac259fc9eb4fa3b9`、対象試験 commit `c0399462d17eae4540ba018e67cab03c5d44f398`。
- 検証: `student-QR` の自分のQR対象試験15件、`step-hub` の共通ログイン試験9件が全件合格。GitHub Pages公開版でV5保存キー、通信確認なし表示、Service Worker v9、ログアウト・生徒変更時の削除処理を確認。
- 【次回ここから確認】QR表示が遅い場合は、①初回表示が一度完了しているか、② `stepMyQrDisplayCacheV5` があるか、③ `student-QR/my_qr.html` が保存済み時に `return` しているか、④Service Workerが `my_qr_sw.js?v=9` か、の順で確認する。保存済みがある限り、本人確認APIやQR取得APIの速度調査は不要。

## 登録詳細：出退くんQR作成・読取

- ID: `qr-register`
- 状態: 本番使用中
- 塾生用URL: https://stepkobetsu-hub.github.io/student-QR/my_qr.html
- スタッフ用QR登録・発行URL: https://stepkobetsu-hub.github.io/student-QR/student_qr_register.html
- タブレット読取URL: https://stepkobetsu-hub.github.io/student-QR/tablet_checkin.html
- GitHub: https://github.com/stepkobetsu-hub/student-QR （本番ブランチ `main`）
- Apps Script: 非公開の本番プロジェクト、バージョン48。既存の本番デプロイIDを維持
- 旧v37参照プロジェクト: https://script.google.com/home/projects/1jZRwuaEqbhgg6xRQq63ke5QO9Wc2ulsGOA_gbmHfiehQIsr9NQLLqSZR/edit 。正式なBrevo設定の旧保管先として確認し、同じ設定を現行本番プロジェクトへ復旧済み。`BREVO_API_KEY`の値は台帳・GitHub・ログへ保存しない
- デプロイ: 既存デプロイIDを維持。具体的なIDと `/exec` URLは非公開の運用記録で管理
- 生徒マスタ: 非公開の本番スプレッドシートを参照。認証列・QR保存列・列構成は非公開
- 本人認証: 初回は生徒ID・パスワード。在籍中のみ許可し、パスワードは端末保存しない。端末には6時間の期限付きセッショントークンだけを保存
- アクセス制御: サーバーはトークンに紐づく生徒IDから本人のQRデータを取得し、クライアント指定の生徒IDを使用しない。他生徒のQR取得を禁止
- QR生成: 本人のQRデータをブラウザ内でQR画像化。未登録の場合は自動発行せず、教室への案内を表示
- スタッフ機能: 既存のQR登録・発行・確認ページと既存スタッフ認証経路は維持
- 変更前バックアップ: 2026-08-01取得。Apps Script Head、マニフェスト、既存デプロイ（v15）を保存してから更新
- QR読取: jsQR 1.4.0。背面カメラ、1280×720、12fps（最大20fps）、対応端末の連続オートフォーカスを使用。未検出フレームは無視し、4秒後に穏やかな案内、10秒後に認識案内を表示
- 受付制御: 読取成功直後に解析を停止し、受付完了後はカメラを再起動せず解析のみ再開。同一QRは5秒間無視。受付IDを保存し、同じIDの再送は二重記録しない。タイムアウト時は保存状態を照会して未保存の場合だけ同じIDで再送
- 連続受付表示: 入退室保存成功後は約1.5秒の完了表示で次のQR解析を再開。メール状態確認は画面とスキャナーを止めないバックグラウンド処理とし、「メール送信待ち」の完了待機は行わない。受付応答時点でメール失敗が確定した場合のみ約3.5秒案内
- 来塾ポイント: 当日の最初の打刻から最新の打刻までが10分以上なら1ポイントを付与。途中の入室・退室打刻回数や種別に影響されず、ポイント履歴の当日付与済み判定により1日1回だけ付与。日次状態キャッシュは `CHECKIN_DAY_V2` を使用
- サーバー処理: マスタ索引と当日状態をキャッシュし、同一リクエスト内の重複読込みを削減。入退室ログは必要値をまとめて1回で書込み。受付・QR検証・対象検索・判定・保存・メールキュー・応答の区間時間を匿名化ログへ記録
- メール処理: 入退室保存と通知メールを分離。送信待ち・送信済み・送信失敗をキューへ保存し、受付IDを冪等性キーとして二重メールを防止。メール失敗でも保存済みの入退室記録は受付成功として保持。正式なBrevo APIキーを旧本番保管先から同一本番Apps ScriptのScript Propertiesへ復旧し、Brevoへ自動復帰。キー未設定時だけ緊急用MailAppフォールバックを使用。v47ではキュー行の保存成功とワーカートリガー確認を別結果として扱い、トリガー確認権限エラーによる「メール送信予約失敗」の誤表示を解消
- 講師通知: 講師マスタP列（列16、行配列index 15）を取得。見出し検出を優先し、見出し不一致時はP列を検証して使用。講師索引キャッシュは `v43-email-p15` へ更新し、旧キーを削除
- メール復旧検証: MailAppの即時処理、状態照会からの未試行PENDING処理、ScriptLock、送信開始・完了記録を追加。写真は受付ID専用の短期キャッシュ経由で添付。承認済み内部宛先で写真付き1通の受信を確認。v47反映後の新規4件は写真参照あり・BrevoメッセージIDあり・各1回でSENT。キュー全22件はSENT、PENDING 0、PROCESSING 0、RETRY 0、FAILED 0
- カメラ表示: 右下の読取枠の位置・サイズは維持し、表示用videoだけ左右反転補正。QR解析Canvasとメール写真Canvasは非反転のまま
- 検証: v42ダミー成功系20回は保存20、平均5,311.1ms、中央値4,787.5ms、最大11,503.3ms、タイムアウト0、エラー0、二重記録0、二重メール0。同じ受付IDの再送20回は全件を既処理判定。保存成功・メール設定失敗は受付成功／通知失敗として表示。実在生徒・講師・保護者へのメール送信試験は未実施
- GitHub: メール状態確認の非ブロッキング化PR #11、mainマージSHA `7966769c52a1e7a14d01cb756067d5ddd0768cc0`
- 確認日: 2026-08-04

### 2026年8月8日：Cloudflare高速受付の校舎共通化・古いタブレット対応

- 現在の運用読取URL: https://step-checkin-edge-staging.stepkobetsu.workers.dev/legacy-tablet
- 従来のGitHub Pages読取URL: https://stepkobetsu-hub.github.io/student-QR/tablet_checkin.html
- Worker: `step-checkin-edge-staging`。専用production Workerはまだ作成せず、検証済みWorkerを `production-interim` として暫定本番利用
- 正本: https://github.com/stepkobetsu-hub/student-QR の `main`。最終確認コミット `8db0ce9`。主な正本は `cloudflare/checkin-edge/src/index.ts`、`cloudflare/checkin-edge/src/legacy-tablet.html`、`cloudflare/checkin-edge/wrangler.jsonc`、`cloudflare/checkin-edge/tests/`、`gas/EdgeRosterSync.gs`、`gas/コード.js`
- 状態共有: Durable Object `CAMPUS_CHECKIN` を使用。神領・大手町で別URL・別アプリにせず、どちらのタブレットで読んでも同じ入退室状態を参照
- 校舎判定: 通常受付では端末保存の神領／大手町値を判定に使わない。古い値・空欄・大手町を含めて共通受付へ正規化し、神領名簿を主、大手町名簿を代替として同一処理で照合。`integration-test` だけは別名前空間・別認証を維持
- 重複処理: 60秒以内の同一QRは追加記録・追加メールを行わず同じ受付として返す。その後の有効な読取で入室／退室を切り替える。異なる2台間でも状態を共有
- 名簿同期: Apps Script `EdgeRosterSync.gs` から神領・大手町名簿を取得。神領92名・大手町66名・重複0件を確認。毎朝7時（Cron `0 22 * * *`）に更新し、未登録QR読取時も同期を試みる
- 古いタブレット: 古いAndroid用のES5軽量画面とQR解析ライブラリをWorkerから直接配信。外部PWA・外部CDNを経由せず、カメラ読取、入室・退室・重複表示を継続
- 認証: Worker配信軽量画面は保存済み校舎・端末トークンを要求せず、Workerが発行する署名済み `HttpOnly`・`Secure`・`SameSite=Strict` Cookieを使用。通常のGitHub Pages画面のBearer認証と管理API認証は維持
- 画面: 読取直後の不要な「受付中」全画面表示を廃止。入室・退室・重複は従来の色・キャラクターを使った表示へ改善。ホーム画面アイコンは以前の緑色カメラ `icon-192.png`／`icon-512.png` を復元
- Apps Script連携: 受付後は既存Apps Scriptの `checkIn` へ書き戻し、入退室ログ、通知メール、ポイント処理を継続。Apps Scriptはバージョン78、既存デプロイIDを維持。従来のApps Script直接受付はフォールバックとして削除しない
- 反映履歴: PR #19（未登録QR時の名簿自動更新）、#20（初回同期待機）、#21（古いAndroid軽量画面）、#22（Worker直結入口）、#23（受付表示改善）、#24〜#26（校舎設定・校舎別端末認証依存の撤廃）、#27（署名済みCookie認証）、#28（緑色カメラアイコン）をsquash merge
- 検証: Worker試験33件、TypeScript／Wrangler型検査、古いAndroid互換試験4件に合格。本番HTML・マニフェスト・Cookie発行、保存トークンなし・古い校舎値でAPI認証通過、`/health` のHTTP 200・`ok=true`・`production-interim` を確認
- 秘密情報: 端末トークン、同期トークン、名簿取得トークン、Cookie署名値の実値はGitHub・台帳へ記録しない。校舎別設定QRは過去方式で、現在のWorker配信軽量画面では使用しない

### 2026年8月8日：退室時のレア人物写真を復活

- 対象: 生徒の通常退室時だけ、約20%の確率で `assets/checkin/goodbye-director-night-fast.webp` を表示。入室、60秒以内の重複受付、講師の出勤・退勤は従来の画像を維持
- 速度対策: 1254px PNGではなく640px・18,338 bytesのWebPを起動時に先読み。古いタブレットで画像を読み込めない場合は通常の退室イラストへ自動復帰
- 反映: student-QR PR #29をsquash merge。main `d5a64ca6ae77d47aaf14c9c74784cfd81cc7f48e`
- 検証: Worker試験33件、退室写真試験2件、TypeScript／Wrangler型検査に合格。本番 `/legacy-tablet` で20%設定と軽量画像参照を確認し、`/health` はHTTP 200・`ok=true`・`production-interim`
- 復旧: 変更前の正常版 `8db0ce9aab24333cfa43083bb085fdf4c3817c96` をGitHubブランチ `checkpoint/checkin-stable-20260808-before-rare-exit` に固定。問題時はこのブランチを基準に戻す


### 2026年8月9日：入退室メール書き戻しの受付ID不一致を修正

- 障害: WorkerでQR受付と入室・退室判定は成功する一方、既存Apps Scriptへの書き戻しが停止し、入退室ログと通知メールが2026年8月8日20:12以降進まない状態を確認
- 原因: 古いタブレット画面が発行する `legacy-...` 形式の受付IDを、Apps Script側の検証が不正な形式として拒否。Durable Objectの先頭受付が再試行を続け、同じ処理単位の後続受付も滞留
- 修正: Apps Scriptへ送信する直前だけ、非対応の受付IDをSHA-256由来の決定的な `qr-edge-...` 形式へ変換。既存のUUIDと `qr-...` は変更せず、同じ受付は再試行でも同じIDになるため二重登録を防止。名簿同期処理は対象外
- 反映: student-QR PR #30をsquash merge。main `3d8d93f1ad93371e23f539ee922fc62a00fdfa57`
- 自動試験: Worker 35件すべて合格、TypeScript／Wrangler型検査、差分検査に合格。実際に失敗した形式を回帰試験へ追加
- 復旧確認: 2026年8月9日1:33 JSTに講師分、1:43 JSTに生徒分の滞留受付が自動再処理され、メール送信キュー `SENT`、入退室ログ「送信完了」・配信状態「配信完了」を確認
- 運用影響: 8月8日の受付は試験データ。復旧検証に使用し、削除は実施していない。以後の新規受付も同じ変換規則を使用
- 復旧点: GitHubブランチ `checkpoint/checkin-stable-20260809-email-fixed` を上記mainコミットへ固定。メール送信まで確認済みの基準点として使用
- 秘密情報: 端末トークン、同期トークン、名簿取得トークン、Cookie署名値、メールアドレスの実値は記録しない

## 登録詳細：ステップ＆ゴール進捗管理

### 2026-08-22 現在状態：V3 D1直保存

- **現在の正本**: Cloudflare Worker `step-progress-api` + D1 `step-progress-db` の V3 専用テーブル。通常の進捗・目標範囲・宿題の保存と再読込は D1 を正本とする。
- **本番URL**: https://step-progress-api.stepkobetsu.workers.dev/ （URL変更なし）
- **V3正本ブランチ**: `agent/step-progress-v3-implementation`
- **主要ファイル**: `cloudflare/src/v3.ts`、`cloudflare/src/dashboard.ts`、`cloudflare/public/index.html`、`cloudflare/wrangler.v3.production.jsonc`。
- **本番Version**: `9b0443f2-5ad1-4827-8743-92f3671c9294`。
- **旧Google経由版へのロールバック候補**: `7b84a8f6-3b25-4052-ab32-f02d6af55a51`。D1全体を戻したり削除したりせず、Worker Versionを戻す。
- **保存方式**: 入力 → Cloudflare Worker → V3 D1。通常の保存成功は Google Apps Script の応答を待たない。初回ログインは既存認証との互換性を維持し、ログイン後の通常保存では V3 D1 セッションを使用する。
- **自動保存**: 進捗300ms、目標範囲350msのdebounce。必須の保存ボタンに依存しない。
- **1320実測**: 進捗707ms、目標範囲889ms、宿題1,231ms（Worker内処理）。通信込みでも各2秒未満。3項目とも保存後の再読込保持を確認。
- **最終データコピー**: 2026-08-22T04:42:35.627Z。生徒34名、進捗1,267件、目標範囲7,011件、宿題2,271件。
- **目標範囲の同一性**: `units.unit_id` が一意のため、V3では `unit_id` を中心にON/OFFを判定し、旧教材シリーズ表記の差で再読込時に戻る問題を解消。
- **GitHub Actions**: staging / cutover は完了後 `workflow_dispatch` の手動実行だけに戻し、失敗通知メールの連続発生を防止。
- **詳細**: `docs/learning-progress-v3-cutover-20260822.md`。
- **次回の障害調査**: 保存遅延・再読込戻りは、まず `/health` の `mode=d1-isolated-autosave`、V3 D1行、`getStudentDashboard` のD1読込を確認する。Google Apps Scriptの速度調査から始めない。


- ID: `learning-progress`
- 正式名称: ステップ＆ゴール進捗管理
- 旧称・参考名: フォレスタステップ進捗管理／夏休み進捗管理
- 分類: 生徒・指導管理
- 状態: Cloudflare Worker本番復旧済み（2026-08-17、共通学年の目標範囲対応）
- 利用者: 生徒、講師、管理者
- 運用担当: 管理者
- 概要: 生徒がフォレスタステップとフォレスタゴールの学習進捗、宿題、目標範囲、LCT等を入力・確認する、自主学習・講習・受験勉強用の進捗管理アプリ。通常授業用フォレスタの講師向け進捗管理は対象外。
- GitHub Pages URL: https://stepkobetsu-hub.github.io/foresta-step-progress/
- GitHub URL: https://github.com/stepkobetsu-hub/foresta-step-progress
- 現行利用者向け本番URL: https://step-progress-api.stepkobetsu.workers.dev/
- Cloudflare Worker: `step-progress-api`
- D1: `step-progress-db`（binding `DB`、database ID `028f097c-2609-4bf7-9e9b-39b565606941`）
- Worker正本ブランチ: `agent/cloudflare-progress-migration`
- Worker現行Version: `bbefb81b-9d7e-4b90-9480-b245a751cd6c`
- 同修正の直前Version: `b4eff6ac-62b8-4db7-8f74-845896a29639`
- Worker修正コミット: `a3b7ce268ff3ec81b5f75db4c8a2d63762894184`
- Cloudflare公開ワークフロー: `.github/workflows/deploy-step-progress.yml`（`main`）
- 詳細復旧記録: `docs/learning-progress-common-grade-hotfix-20260817.md`
- 本番ブランチ: `main`（従来GitHub Pages）／`agent/cloudflare-progress-migration`（現行Worker正本）
- 調査時main: `1e55b1f3193910d6df24b91613e62605fe669109`
- 正本ファイル: `index.html`、`README.md`、`package.json`、`tests/`、`apps-script/code.gs`、`apps-script/appsscript.json`、`apps-script/README.md`
- 最新版の場所: `stepkobetsu-hub/foresta-step-progress` の `main` 直下
- 通信方法: GitHub Pagesの `index.html` からApps Script WebアプリへJSON API通信。Apps Script HTML Service／iframeは不使用。
- 認証方式: アプリ独自認証。生徒用は明示的ログアウトまで維持する失効可能な共通セッション、講師・管理者用は8時間セッション。サーバー側権限確認、在籍状態確認、本人studentId一致確認を行う。Googleアカウントは不要。
- Apps Script: プロジェクト名「フォレスタステップ進捗管理【開発】」、プロジェクトID `1xu7BtCOMrB9bzWMcB_c0gcj-Df0Ql93yZp4CyPIgjWcf6EqMDSyRETIB`、編集URL https://script.google.com/home/projects/1xu7BtCOMrB9bzWMcB_c0gcj-Df0Ql93yZp4CyPIgjWcf6EqMDSyRETIB/edit、公開API version 84（2026年8月6日 01:44 JST）、既存デプロイID `AKfycbwu8lfhiH3_7m4ogHNtbgeo3ehx_VBMnt1mPXsvIlL_kMSpxFdrRD4rO_I6q_JUXIWHmg`、WebアプリURL https://script.google.com/macros/s/AKfycbwu8lfhiH3_7m4ogHNtbgeo3ehx_VBMnt1mPXsvIlL_kMSpxFdrRD4rO_I6q_JUXIWHmg/exec。実行ユーザーはデプロイ実行者（stepkobetsu@gmail.com）、アクセス設定は全員（匿名ユーザーを含む）。生徒用継続ログイン、明示的ログアウトによる失効、在籍状態確認、本人studentId照合を維持
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


### 2026-08-22 V3 D1直保存へ本番切替

- 本番URL: https://step-progress-api.stepkobetsu.workers.dev/
- Worker: `step-progress-api`
- 本番Version: **92**／Version ID `0503b822-cc27-4bcf-b15d-4ae16f8fcaed`／traffic 100%
- V3正本ブランチ: `agent/step-progress-v3-implementation`
- 保存方針: 進捗・目標範囲・宿題の通常編集はCloudflare WorkerからD1へ直接保存し、Google Apps Scriptの応答完了を通常保存の成功条件にしない。
- D1: 既存 `step-progress-db` 内の `v3_*` 専用テーブルを使用。旧本番テーブルは削除せず、ロールバック用として維持。
- 最終データコピー: 2026-08-22 13:37:31 JST。生徒34名、進捗1,267件、目標7,011件、宿題2,271件。テストoverride・一時セッションは0件。
- 自動保存: 進捗300ms debounce、目標350ms debounce。保存ボタンを前提にしない。
- 1320スモークテスト: 進捗707ms／通信込み979ms、目標889ms／1,166ms、宿題1,231ms／1,452ms。3項目とも保存→再読込保持を確認。
- 目標範囲識別: `教科 | 教材シリーズ | 単元ID` を基本キーとし、別教材・別教科の同一／類似ID混在による再読込戻りを防止。
- 本番確認: `/health` は `ok=true`、`mode=d1-isolated-autosave`。
- staging: https://step-progress-v3-staging.stepkobetsu.workers.dev/ を比較・検証用として維持。
- ロールバック: V3直前Version 91 `7b84a8f6-3b25-4052-ab32-f02d6af55a51`、旧正本ブランチ `agent/cloudflare-progress-migration`。V3テーブルを削除せずWorkerだけ旧版へ戻せる。
- 詳細: `docs/learning-progress-v3-20260822.md`。

## 登録詳細：フォレスタ進捗管理

- ID: `foresta-progress-v2`
- 正式名称: フォレスタ進捗管理
- 分類: 学習・授業管理
- 状態: 本番
- 利用者: 生徒、講師、管理者（講師権限1以上）
- 運用担当: 管理者
- 概要: 学校授業を先取りする9月以降の通常授業用フォレスタ進捗管理。自主学習・講習用のステップ＆ゴール進捗管理とは別システム。
- GitHub Pages URL: https://stepkobetsu-hub.github.io/foresta-progress-v2/
- GitHub URL: https://github.com/stepkobetsu-hub/foresta-progress-v2
- 本番ブランチ: `main`
- Apps Script編集URL: https://script.google.com/home/projects/1-hDf82U2uQ1zVL7WBXTyXyXXJxWsJvBHeOiTLj-N0AG3NAqXZcp6wv0M/edit
- Apps ScriptプロジェクトID: `1-hDf82U2uQ1zVL7WBXTyXyXXJxWsJvBHeOiTLj-N0AG3NAqXZcp6wv0M`
- Apps Script Web API: https://script.google.com/macros/s/AKfycbz0z2FeM1jWUSs7LTzwi9N12kPoTmSTP_hRjTaf3wQlf5kX5hR_W9E37ON63L_dhbIZ/exec
- デプロイID: `AKfycbz0z2FeM1jWUSs7LTzwi9N12kPoTmSTP_hRjTaf3wQlf5kX5hR_W9E37ON63L_dhbIZ`
- Apps Script現行版: v9「管理者詳細の進行表閲覧権限を修正」
- 専用保存先: [フォレスタ進捗管理 v2 保存データ（新規構築 2026-08-15）](https://docs.google.com/spreadsheets/d/11qBwaLVgZV2bD6bb4HY7-osvs58dBEZVaZo4UYNK7ec/edit)（21シート）
- 生徒・時間割マスタ: [★生徒マスタ202606-](https://docs.google.com/spreadsheets/d/1CIJkTlYUcUkbb8jBdFc6L8D5ubTGsxwNxFv01ten-Zk/edit)（`☆マスタ`、`時間割マスタ`）
- 講師マスタ: [給与明細2026-6-](https://docs.google.com/spreadsheets/d/1L5aFDXAmfUDkBg8d7X3WqJgMhdMq5tM5sfUZ2G-M58E/edit)（`講師マスター`）
- 成績・学校日程参照API: https://script.google.com/macros/s/AKfycbypkUc0MqZ07E7pZRglNPeRM56WbCcuWaLpRzi9bVFcPklHDxaaLC7GfzG6ozTGCbEX/exec
- 学校・テスト日程登録: https://stepkobetsu-hub.github.io/seiseki-kanri/admin.html#schools
- 単元マスタ: 合計1,853件。国語232件（中1=78、中2=77、中3=77）、数学315件、英語1,306件（6教科書×3学年）。
- 進行表対象: 国語、英語、数学。定期テスト履歴・目標点は国語、数学、英語、理科、社会の5科目。
- 正本ファイル: `index.html`、`styles.css`、`app.js`、`domain.js`、`config.js`、`manifest.webmanifest`、`apps-script/Code.gs`、`apps-script/appsscript.json`、`data/japanese-units.json`、`tests/`
- 確認済みコミット: `4c3318f058d51994658b5e0a2ed26f19ead37125`
- セキュリティ: 実在ID・パスワード・セッショントークン・通知先メール・個人情報を公開台帳へ記録しない。個人端末30日、共用端末8時間、管理者は明示ログアウトまで保持。
- 検索・速報: 講師検索はひらがな・カタカナ・ローマ字に対応し、入力・教室・学年変更で自動検索。管理者画面は全在籍生徒検索から詳細を直接開く。本日の速報の選択肢は全在籍生徒を基準に、神領・大手町、中1・中2・中3、登録済み全学校を表示。
- 確認: 公開API GETとhealth、GitHub Pages、生徒／講師／管理者入口、管理者詳細から英語進行表が権限エラーなく開くこと、国語・英語・数学進行表、国語のCT非表示と専用宿題ルールを確認。ローカル自動テスト183件成功。確認時は実メール送信と実進捗書き込みを抑止。
- 引継ぎ資料: [docs/foresta-progress-v2-20260815.md](https://github.com/stepkobetsu-hub/step-system-registry/blob/main/docs/foresta-progress-v2-20260815.md)
- 確認日: 2026-08-15

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

### 2026-08-07 Cloudflare本番ログイン画面の端末選択注意表示

- Cloudflare本番URL: https://step-progress-api.stepkobetsu.workers.dev/
- Worker名: `step-progress-api`
- D1: `step-progress-db`（binding `DB`）
- 正本ブランチ: `agent/cloudflare-progress-migration`
- 変更コミット: `07fd87d39e6330027ad47e97b00efea4e8593156`（`Move device selection warning beside choices`）
- 変更ファイル: `cloudflare/public/index.html`、`cloudflare/tests/save-status.test.mjs`
- 変更内容: 生徒ログインで端末を選ばずにログインした場合の注意書きを、画面最下部の小さい表示から「自分・家族の端末」「塾のタブレット」の選択ボタン直下へ移動。警告アイコン、赤枠、淡い赤背景、太字17pxの大きい注意表示とし、端末を選択した時点で自動的に消す。生徒／講師・管理者の切替時にも残さない。
- 本番Worker Version: `72c8dafa-53e9-46c4-9048-77e8fa1b8645`（traffic 100%）
- 直前Version: `f3ac9e47-496c-4350-b3e8-1a3276e5ae05`
- 本番設定維持: `PRODUCTION_WRITE_APPROVED=true`、`BROWSER_D1_WRITE_ENABLED=true`、`TEST_WRITE_APPROVED=false`、`TEST_STUDENT_ID=1320` を変更せず維持。
- 検証: Cloudflare側テスト18件、TypeScript検査、`git diff --check` が合格。Versionプレビューと本番URLの両方で、未選択時の大きい注意書きが端末選択ボタン直下へ表示されることを実画面確認。本番 `/health` はHTTP 200、`ok=true`。
- 復旧: 問題がある場合は直前Version `f3ac9e47-496c-4350-b3e8-1a3276e5ae05` を100%へ再指定する。D1データの変更やマイグレーションは今回実施していない。
- 完全履歴bundle: `foresta-device-warning-position.bundle`、SHA-256 `064efcc4c58a17d958ab3fc4aeb338f73c5e91e6d742388c3b266f4397b10810`。

### 2026-08-07 成績管理の管理者・生徒別端末ログイン

- 講師・管理者用URL: https://stepkobetsu-hub.github.io/seiseki-kanri/admin.html
- 生徒用URL: https://stepkobetsu-hub.github.io/seiseki-kanri/juku_app.html
- 正本: `stepkobetsu-hub/seiseki-kanri` の `main`。講師・管理者用は `admin.html`、生徒用は `juku_app.html`。`index.html` はスタッフ用ポータルで、成績管理の直接入口ではない。試験は `admin-device-session.test.mjs`、`student-device-session.test.mjs`。
- 変更コミット: 管理者用 `7f53ce97f5a2363ccee808ff3e19481554c8ab4b`、生徒用 `4f24aa86622bad821234c80650af9c0d033b4de7`。
- 端末選択: 管理者用・生徒用とも、ログイン欄の直前に「自分・家族の端末」「塾のタブレット」の大きな2択を表示。未選択でログインした場合は、2択の直下へ赤枠・淡い赤背景・太字の大きな注意書きを表示する。
- 自分・家族の端末: 管理者用は講師コード、生徒用は生徒IDと、それぞれのパスワードを同一端末・同一ブラウザーへ保存する。次回は自動ログインし、本人がログアウトするまでログイン状態を維持する。明示的ログアウト時は端末区分・ログイン状態・保存したID・パスワードを削除する。
- 塾のタブレット: 管理者・生徒のIDとパスワードを永続保存しない。操作のたびに無操作時間を更新し、30分間操作がない場合は自動ログアウトする。ページ再読込後も同一タブ内では直前の操作時刻から30分を判定する。
- データ影響: ログイン画面とブラウザー側の状態管理だけを変更。成績データ、Google Sheet、GAS、Supabaseスキーマの変更なし。
- 検証: 管理者用端末別試験3件、生徒用端末別試験4件、既存共通ログイン試験3件、JavaScript構文検査、`git diff --check` が合格。管理者用・生徒用のGitHub Pages公開HTMLで新処理を確認。

### 2026-08-07 自動ログイン中のログイン画面ちらつき防止

- 成績管理: 個人端末に有効なセッションまたは保存済み認証情報がある場合、ページの初回描画前からログイン画面を隠し、認証成功後に生徒画面を直接表示する。認証できなかった場合だけログイン画面を表示する。
- 成績管理の本番コミット: `ce7143a012776ad2e76a5720a64cc713211ffdd7`。生徒用URLは https://stepkobetsu-hub.github.io/seiseki-kanri/juku_app.html 。端末別試験を含む11件とJavaScript構文検査が合格。
- 学習進捗管理: 有効な共通セッション、保存済みセッション、または保存済みスタッフログインがある場合、認証確認中はログイン画面を隠す。認証失敗または期限切れ時だけログイン画面へ戻す。
- 学習進捗管理のソースコミット: `7c17acc7053b6b802d89ed3dfe656960b178b20d`（正本ブランチ `agent/cloudflare-progress-migration`）。Cloudflare側試験6件、TypeScript検査、JavaScript構文検査、dry-runが合格。
- 公開状況: 成績管理はGitHub Pagesへ反映済み。学習進捗管理はCloudflare Workerへのアップロード待ち。既存本番Version `72c8dafa-53e9-46c4-9048-77e8fa1b8645` は変更していない。
- データ影響: 成績データ、D1データ、Google Sheet、GAS、Supabaseスキーマ、Cloudflare環境変数を変更していない。

### 2026-08-09 学習進捗グラフ70%基準・2周目以降の宿題文言

- 本番URL: https://step-progress-api.stepkobetsu.workers.dev/
- Worker名: `step-progress-api`
- D1: `step-progress-db`（binding `DB`）
- 新本番Version: `bf08686b-79d0-4187-9139-458e73c0d3d3`（traffic 100%）
- 変更前の安定Version／復旧先: `eb7d6bae-efec-4deb-88aa-33544494049c`（削除せず維持）
- グラフ仕様: 教科ごとの1本の進捗バーで、1周目100%をバー全体の70%位置、2周目を次の15%、3周目を最後の15%として表示する。70%位置には破線と「1周目ゴール」を表示する。生徒が1周目100%を現実的な到達目標として認識でき、従来の300%満点表示による心理的負担を減らす目的。
- 宿題文言: 2周目・3周目は `TRY_REDO` を「TRYの赤×なおし」、`EXERCISE_REDO`（互換上の `EXERCISE` を含む）を「エクササイズの赤×なおし」と表示する。1周目と教材固有の宿題生成規則は変更しない。
- 変更範囲: `cloudflare/public/index.html` のグラフ表示と宿題表示文言のみ。Workerの保存API、D1クエリ、宿題生成処理、認証、同期処理、Cron、D1スキーマ、D1データは変更していない。
- 本番設定維持: `/health` で `ok=true`、`productionWriteApproved=true`、`browserD1WriteEnabled=true`、`dualWriteEnabled=true` を確認。`TEST_WRITE_APPROVED=false`、`TEST_STUDENT_ID=1320` も維持。
- 検証: Versionプレビュー `bf08686b-step-progress-api.stepkobetsu.workers.dev` と本番URLでHTTP 200を確認。配信HTMLに `left:70%`、「1周目ゴール」「TRYの赤×なおし」「エクササイズの赤×なおし」および1周目70%・2周目15%・3周目15%の加重計算が含まれることを確認。本番 `/health` もHTTP 200。
- 反映手順上の注意: Cloudflare Static AssetsはWorkerのクイック編集画面に表示されないため、`wrangler versions upload` でプレビューVersionを作成し、表示・health確認後に `wrangler versions deploy <version>@100%` で本番化する。既存環境変数は `--keep-vars`、リモート差分保護は `--strict` を使用する。Windows PowerShell 5.1用スクリプトは文字化けを避けるためASCIIのみで作成する。
- 反映障害の記録: `wrangler init --from-dash` はWindows上のcreate-cloudflare処理で異常終了したため使用しない。現行Worker本体、D1 binding、assets、Cron、互換日を明示した設定でVersion uploadを行う。プレビューのPowerShell文字判定が誤停止した場合は、配信HTMLと `/health` を直接確認してから昇格する。
- Cloudflare接続の標準手順: Windows端末にNode.jsがない場合は、PowerShellで `winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements` を実行する。同じPowerShell内で直ちに続行する場合は `$env:Path += ";C:\Program Files\nodejs"` を追加する。認証は `npx --yes wrangler@4.120.0 login` を実行し、ブラウザーの「Authorization granted to Wrangler」を確認する。認証確認は `npx --yes wrangler@4.120.0 whoami`。通常ブラウザーでCloudflareへログインしただけではWrangler認証にならない。
- 認証時の判断: `Wrangler is missing some expected OAuth scopes` の警告に `websearch.run`、`agent-memory:write`、`challenge-widgets.write` だけが表示される場合、今回のWorkers Version upload/deployには不要。`Would you like Wrangler to automatically install Cloudflare skills? (Y/n)` は `n` を選ぶ。Workers Scripts、Workers Tail、D1等の必要権限が不足して実処理が403になる場合だけ `wrangler login` を再実行する。
- 次回の最短経路: 正本一式と `wrangler.jsonc` が揃った作業フォルダーで、`npx --yes wrangler@4.120.0 versions upload --no-bundle --strict --keep-vars --message "<変更内容>"` を実行する。出力されたVersion Preview URLで表示と `/health` を確認し、合格後に `npx --yes wrangler@4.120.0 versions deploy "<Version ID>@100%" --yes --config .\wrangler.jsonc --message "<反映内容>"` を実行する。問題時は同じdeployコマンドで `eb7d6bae-efec-4deb-88aa-33544494049c@100%` を指定する。
- 接続作業で避けること: OAuthコードやAPIトークンをチャット、GitHub、台帳へ貼らない。認証済みローカル端末のWrangler設定を利用する。Static Assets変更でCloudflareクイック編集画面を探し続けない。`wrangler init --from-dash` を今回のWindows環境で再試行しない。検査に失敗したVersionを確認なしで100%へ昇格しない。
- 復旧: 表示または保存に問題がある場合は、Version `eb7d6bae-efec-4deb-88aa-33544494049c` をtraffic 100%へ戻す。D1のロールバックやデータ削除は行わない。
- 反映用パッケージ: `step-progress-final-deploy.zip`、SHA-256 `109454faa1c0ce091740faa27488955e8f1427dcc4798bbc95355a852a188d34`。資格情報・OAuthトークン・個人情報は含めない。
- 確認日: 2026-08-09

### 2026-08-17 理科・国語・社会の目標範囲を復旧

- 対象: ステップ＆ゴール進捗管理（ID `learning-progress`）、Cloudflare Worker `step-progress-api`。
- 障害: フォレスタステップの理科・国語・社会で、目標範囲の選択肢が表示されず設定できない。英語・数学は表示される。以前設定した目標件数や進捗は残っていた。
- 原因: 理科・国語・社会の単元は学年 `中1～中3共通` だが、Workerの `readDashboard` SQLが空欄と本人学年だけを許可し、共通学年を除外していた。D1の目標・進捗データは消失していない。
- 修正: `u.grade` と `m.grade` の双方へ `中1～中3共通` 条件を追加。Worker修正コミット `a3b7ce268ff3ec81b5f75db4c8a2d63762894184`、正本ブランチ `agent/cloudflare-progress-migration`。
- キャッシュ: 障害中の空一覧が端末へ最大24時間残らないよう、管理者キャッシュを `fsAdminDashboard:commonGradeFix20260817:`、生徒キャッシュを `forestaProgress.viewCache:commonGradeFix20260817:` へ更新。画面デザインと保存処理は変更していない。
- 本番: 現行Version `bbefb81b-9d7e-4b90-9480-b245a751cd6c`。直前の同修正版 `b4eff6ac-62b8-4db7-8f74-845896a29639`、最初の共通単元修正版 `f7f7f491-5a6e-478e-b2b6-c011e58ba5ac`。
- 本番確認: https://step-progress-api.stepkobetsu.workers.dev/ と `/health`。`ok=true`、`productionWriteApproved=false`、`testWriteApproved=true`、`dualWriteEnabled=true` を確認。本番HTML SHA-256は `9d67371dbe8b4e155e85952cdbf626d00ba38aa2f6cc63a636ab5d6fe14a5866`。
- 検証: 共通学年の単元側・教材側条件、ダッシュボード変換、進捗集計、目標0件、保存禁止対象、TypeScript、本番Assets、healthを検査。最終Actionsで対象試験5件と全公開工程が成功。
- Cloudflare公開経路: `foresta-step-progress/.github/workflows/deploy-step-progress.yml`。GitHub Actions成功実行 https://github.com/stepkobetsu-hub/foresta-step-progress/actions/runs/32006933794 、整備コミット `9333bf31c439b1465b1c2feed6fcda827986c1f7`。
- 認証情報: GitHub Repository secret名は `CLOUDFLARE_API_TOKEN`。秘密値はGitHubファイル、台帳、チャットへ記録しない。再発行時は同名Secretの値だけを更新する。
- 復旧: 現行Versionに問題がある場合は同じ修正を含む `b4eff6ac-62b8-4db7-8f74-845896a29639` を候補にする。D1の削除・初期化・ロールバックは行わない。
- 詳細引継ぎ: `docs/learning-progress-common-grade-hotfix-20260817.md`。
- 確認日: 2026-08-17

### 2026-08-09 資産管理ポータルの継続ログイン

- 対象URL: https://stepkobetsu-hub.github.io/step-system-registry/
- ブラウザー側: ログイン成功時に講師番号、パスワード、セッショントークンを同一端末・同一ブラウザーへ保存する。次回アクセス時は、保存済みセッションを優先して確認し、無効な場合は保存済み講師番号・パスワードで自動ログインする。ログインボタンの押下は不要。
- ログアウト: 明示的に「ログアウト」を押した場合だけ、セッショントークン、講師番号、パスワードをブラウザーから削除する。通常のページ移動、再読込、ブラウザー終了では削除しない。
- Apps Script側: ランダムなセッショントークンをScript Propertiesへハッシュ化キーで保存し、CacheServiceは6時間の高速化用として併用する。API呼び出しごとに講師マスターの現在権限（2・3・4）を再確認し、権限が失効した場合は保存セッションを削除する。既存の6時間セッションは初回確認時に継続セッションへ移行する。
- 本番: Apps Script v65「資産管理ポータルのログアウトまで継続ログイン」。既存のウェブアプリURL／デプロイIDは維持。
- 復旧: 問題時は既存デプロイをv64へ戻す。追加した `zz_system_portal_auth.gs` を削除すれば、Apps Script編集状態も更新前へ戻せる。
- セキュリティ: ID・パスワードは外部送信や台帳記録をせず、利用端末のブラウザー保存領域だけに保持する。共有端末では利用後に必ずログアウトする。認証情報やセッショントークンの実値をGitHub、台帳、チャットへ記載しない。
- 検証: 資産管理ポータルのログイン保持試験を追加し、既存試験を含めて実行する。Apps Script v65の更新完了表示と、デプロイIDがv64から変わっていないことを確認済み。

## 登録詳細：全県模試受験票作成

- ID: `aichi-exam-ticket`
- 正式名称: 全県模試受験票作成
- 分類: 管理・運営
- 状態: 本番使用中
- 利用者: 管理者・スタッフ
- 運用担当: 管理者
- 概要: 愛知全県模試の年度・第1回～第6回を選択し、在籍生を検索・複数選択して、1人1枚のA4受験票を一括印刷する。
- 本番URL: https://stepkobetsu-hub.github.io/step-message-center/exam_ticket.html
- GitHub: https://github.com/stepkobetsu-hub/step-message-center
- 本番ブランチ: `main`
- 正本ファイル: `exam_ticket.html`、`exam_ticket.css`、`exam_ticket.js`、`qrcode.js`、`exam_students_2026.json`、`Code.gs`、`ExamTicket.gs`
- Apps Scriptプロジェクト名: `STEP配信システム`
- Apps ScriptプロジェクトID: `1nrEhPSvPj9qyyF6buHjut_aGOEMiHmnKZ0N53rFaBNPdkaA3sBpBgek4`
- Apps Script編集URL: https://script.google.com/home/projects/1nrEhPSvPj9qyyF6buHjut_aGOEMiHmnKZ0N53rFaBNPdkaA3sBpBgek4/edit
- Apps Script Web API: https://script.google.com/macros/s/AKfycbxIH2VtgwRi50xduXgrkYrjD0yrzNfQ5vCWt1XgOzil6LZSgXNj6MJo9jPYvOkjNHdu/exec
- 現行デプロイ: 既存デプロイIDを維持し、2026-08-19にApps Scriptバージョン58「全県模試受験票・生徒読込高速化と印刷時リスニング確認」へ更新。
- API入口: `Code.gs` の `doGet` で `action=getExamTicketStudents` と `action=getExamListeningSettings`、`doPost` で `action=saveExamListeningSettings` をルーティングする。`ExamTicket.gs` がGoogle Sheetの読込・年度別固定番号・新規割当・リスニング情報の取得／登録を処理する。
- 生徒マスタ: [★生徒マスタ202606-](https://docs.google.com/spreadsheets/d/1CIJkTlYUcUkbb8jBdFc6L8D5ubTGsxwNxFv01ten-Zk/edit)
- 使用シート: `☆マスタ`、`全県模試受験番号`、`中学校コード`、`全県模試リスニング`
- 在籍判定: `☆マスタ` B列が1の生徒。小4・小5・小6・中1・中2・中3を対象とする。
- 参照項目: 生徒コード、氏名、フリガナ、学年、H列の校舎、P列の在学学校。校舎は受験票右下へ「個別指導ステップ 神領校／大手町校」と表示する。P列の中学校名は`中学校コード`シートと毎回照合し、既存生を含む在籍中学生へ3桁コードを表示する。
- 受験番号: 中1=1001、中2=2001、中3=3001、小4=4001、小5=5001、小6=6001から開始。年度・学年別にGoogle Sheetへ固定保存する。新規生は同学年の既存最大番号より後ろで、重複しない番号を割り当てる。既存番号を詰め直さない。
- 訂正反映: `全県模試受験番号`を直接訂正した場合、「生徒情報を更新」でサーバーキャッシュを使わずGoogle Sheetから再取得する。新入塾や学年訂正も同じ更新操作で取り込む。更新ボタンは生徒選択見出し付近と一覧下部の2か所。
- 自動反映方式: 初回表示は端末保存名簿（未保存端末では`exam_students_2026.json`）を即時表示し、裏側で最新のGoogle Sheetを確認して差し替える。通常読込はApps Script側で5分間キャッシュし、「生徒情報を更新」はキャッシュを迂回する。Sheet内の訂正だけではApps Scriptの再デプロイは不要。
- 重複防止: Sheet上の年度・学年別最大番号を確認してから新規番号を割り当て、既存番号を優先する。ブラウザーに残る旧一時番号がSheetの確定番号と衝突した場合は、確定番号を予約したうえで新規生を最大番号より後ろへ再割当する。
- 年度: 学年切替は4月1日。翌年度は当年3月1日から選択でき、3月中は進級後の学年として翌年度番号を新規割当する。4月以降も同じ年度番号を継続する。
- 検索: 生徒コード・氏名・フリガナに加え、ローマ字検索へ対応。ひらがな・カタカナを同一視し、全角英字も正規化する。例：`tanaka`→たなか、`shiori`→しおり、`kanna`→かんな、`shinryou`→しんりょう。
- 印刷内容: 第1回～第6回のタイトル、塾名、塾コード4258、受験番号、3桁の中学校コード＋学校名（例：353（南城中））、氏名＋小さめの学年表記（例：山田太郎（中１））、学区「尾張」、年度、校舎名、学年別時間割、イラスト。中学生は下部を時間割2/3・リスニングQRとユーザー名／パスワード1/3で表示する。選択した全生徒を1人1枚のA4で一括印刷する。小学生の中学校コード欄は対象外として「—」を表示する。
- 時間割区分: 小学生、中1・中2、中3の3区分。生徒の学年に応じて受験票下部へ自動表示する。
- 中学校コード: `中学校コード`シートを正本とし、学校名と3桁コードを管理する。未登録校は画面に学校名・3桁入力欄・登録ボタンを表示し、登録後は同校の既存生・新入室生へ一括反映する。コードは3桁数字のみ許可する。
- リスニング情報: `全県模試リスニング`を正本とし、年度・回・学年（中1～中3）ごとにURL・ユーザー名・パスワードを保存する。情報確認は中学生の印刷ボタンを押した時だけ行う。未登録なら「今登録しますか？」と一度だけ確認し、「キャンセル」でも印刷を続け、受験票には「別紙のリスニングQRコードを参照してください。」と表示する。登録済みQRには「2026年第3回 中３」の形式で年度・回・学年を併記する。QRコードは端末内の`qrcode.js`でURLのみを画像化し、認証情報は受験票へ別記する。
- 受験回切替: 通信中に年度・回を切り替えた場合は古い応答を破棄する。登録済みの回へ移動したときは未登録ポップアップを自動で閉じ、別回の情報を誤表示しない。フロントエンドは `exam_ticket.js?v=20260819-18`／`exam_ticket.css?v=20260819-10`。
- 印刷時QR判定: APIから返った年度・回・学年別の登録結果を直接判定し、登録済みQRでは確認を出さない。印刷処理中はボタンをロックして二重実行・応答順の前後による誤判定を防ぐ。
- 訂正導線: 画面右上の「受験番号を訂正する」から `全県模試受験番号`、「中学校コードを訂正する」から `中学校コード`、「リスニング情報を訂正する」から `全県模試リスニング` シートを開く。
- 関連入口: 成績管理・スタッフ用アプリ、およびSTEP業務ホームの「管理・運営」に「全県模試受験票作成」カードを設置。
- 本番確認: 2026年度APIで在籍生90名・中学生65名を取得し、登録済み学校コードを既存中学生64名へ反映、未登録校1校を登録画面に表示、API警告0件・受験番号重複0件であることを2026-08-19に確認。フロントエンドは `exam_ticket.js?v=20260819-11`／`exam_ticket.css?v=20260819-8`。塾名・塾コード・生徒コード・中学校コードの4行を同じ高さ・同じ文字サイズに統一し、中学校コード見出しの1行固定、氏名欄の大型化・学年併記を確認。Apps Scriptはv58。生徒90名の即時表示用名簿と、QRの年度・回・学年表記も公開確認済み。
- 注意: 秘密値、パスワード、セッショントークン、生徒個人情報の実データは台帳へ記録しない。Apps Scriptバージョン54はAPI入口の反映前に作成された中間版のため、本番復旧先として使用しない。
- 確認日: 2026-08-19

## 出退くんQR作成・読取：管理者アプリPC最適化（2026-08-20）

- 対象画面: https://stepkobetsu-hub.github.io/student-QR/student_qr_register.html
- 正本: `stepkobetsu-hub/student-QR` の `main / student_qr_register.html`
- 利用前提: 管理者本人が主にPCで使用する。画面は最大幅1,280px、左側220pxの固定ナビゲーション、右側の作業パネルを基本とし、900px未満では縦並びへ戻す。
- ログイン保持: 同じ端末・同じブラウザーでは、自主的にログアウトするまでログインを保持する。保存した講師番号・パスワードは端末内で暗号化し、保存済みセッションを優先、必要時は保存情報から自動ログインする。明示的ログアウト時だけ保存情報を削除する。共有端末では必ずログアウトする。
- QR確認・対象検索:
  - 生徒コード、氏名、フリガナで検索できる。
  - ひらがな・カタカナを同一視し、ローマ字は一部入力でも検索できる。
  - 校舎、学年の複数選択、学年昇順／降順、全選択・全解除・反転に対応する。
  - 選択中の生徒を一覧で確認し、複数生徒のQRをまとめて印刷できる。
- QRカード印刷:
  - 1枚の実寸は54mm×74mm、QRは42mm。以前のカードサイズを維持する。
  - A4縦へ3列×3行、1ページ最大9枚を配置する。
  - 10枚目以降は自動的に次ページへ送る。
  - 印刷設定は倍率100%／実際のサイズを推奨し、ブラウザーの拡大縮小によるカード寸法の変化を避ける。
- 現行QRと新規発行:
  - 登録済みの場合は「現行QRが登録されています」を大きく表示し、登録済み連絡先も表示する。連絡先がなければ現行QRなしとして扱う。
  - 生徒を開いた時点で現行QRを表示し、カードへ「現行QR（現在有効）」と明記する。
  - 「現行QRの確認」から再確認でき、「現行QRを印刷する」からカード印刷できる。
  - 発行操作は「新規QR発行」と表記する。既存QRがある場合は、旧QRが使えなくなる旨と本当に変更してよいかを確認してから発行する。
  - 発行直後は「新規発行したQR（現在有効）」と表示する。
- 通知先メール:
  - 生徒コード、氏名、ひらがな、カタカナ、ローマ字の一部で検索できる。
  - QR確認とは異なり対象は1名だけを選択する。
  - 候補にはコード、氏名、フリガナ、学年、校舎を表示する。生徒コードの直接入力も残す。
  - 未入力時は「検索語を入力すると候補が表示されます」の候補ボックス自体を非表示にし、検索入力後だけ候補欄を表示する。
- 勤怠CSV:
  - 通常利用は月単位。年・月を選ぶと、その月の初日と末日を開始日・終了日へ自動入力する。
  - 開始日または終了日を個別変更すると「日付を個別指定中」と表示し、年・月欄を灰色・操作不可にする。
  - 「月単位に戻す（年・月を選び直す）」で個別日付をリセットし、年・月を再選択できる。
  - 開始日・終了日の下へ曜日を確実に表示する。例: 2026年8月1日（土）、2026年8月31日（月）。月単位・個別指定の双方で即時更新する。
  - 終了日が開始日より前にならないよう検証する。
- 確認結果: 管理者画面の回帰試験9件、JavaScript構文検査、差分確認を実施。公開変更はstudent-QR PR #31～#38で段階的に反映し、最新マージは `8d3894ec160096d435294dda3ba25c7ccbd548ac`。
- 変更履歴:
  - PR #31 `02109adf`: 継続ログイン、検索、複数QR
  - PR #32 `154e9e72`: PC中心レイアウト
  - PR #33 `ac041f9d`: QR検索UI、カード実寸・A4複数ページ印刷
  - PR #34 `daabcc65`: 現行QRと新規発行の明確化
  - PR #35 `fe04f9e8`: 現行QR自動表示・印刷、通知先メール検索
  - PR #36 `2ffc408d`: 通知先候補の未入力時非表示、月単位勤怠CSV
  - PR #37 `2ff2e8fb`: 月単位へ戻すリセット
  - PR #38 `8d3894ec`: 開始日・終了日の曜日表示
  - PR #39 `fea64cc3`: A4枠・カードの寸法へ余白と枠線を含める調整
  - PR #40 `b1b5213f`: 印刷時の非表示画面をレイアウトから除外（先頭白紙が発生したため中間版）
  - PR #41 `89b251c9`: QR用紙をbody直下の専用印刷領域へ分離し、1枚印刷の先頭・末尾白紙を最終解消
- 1枚印刷の白紙ページ修正:
  - 症状1: QRが1枚でも2ページとなり、2ページ目が白紙。
  - 症状2: 中間修正後、1ページ目が白紙で2ページ目へQRが移動。
  - 最終原因: 画面上で不可視にした検索欄・ナビゲーション等が印刷文書のレイアウト高さを残し、印刷位置・改ページへ影響していた。
  - 最終方式: `batchPrintHost` をbody直下へ設置し、印刷直前にQR用紙だけを複製。印刷中は専用領域以外のbody直下要素を完全に除外し、印刷後に専用領域を空にする。
  - 最終結果: QR 1～9枚はA4 1ページ、10枚目から次ページ。利用者による1枚印刷の正常化確認済み。
  - 左側メニュー名は「QR確認・印刷」。
- データ保護: 講師番号、パスワード、セッショントークン、通知先メール、生徒個人情報の実値は台帳・GitHub・公開説明へ記録しない。
- 詳細引継ぎ: `docs/student-qr-admin-pc-20260820.md`

## 資産管理ポータル自体の更新

- 画面: `index.html`
- アイコン: `images/system-portal/`
- 台帳文書: `SYSTEM_REGISTRY.md`
- 認証API: `seiseki-kanri` のApps Script。権限2・3・4、API呼び出しごとのセッショントークン再確認を維持する。
- 更新方法: このリポジトリの `main` に反映し、GitHub Pagesの公開結果をPC／スマートフォン幅で確認する。
