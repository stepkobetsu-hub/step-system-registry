# 過去問提出・STEP過去問スキャナー変更台帳

更新日：2026年10月1日（日本時間）。対象：「スマホ学校名読み取込み修正」および登録完了・アイコン・DBリンク・固定署名対応のチャット。既存の高速DB移行記録を維持し、履歴を蓄積する。

## 現行の正本・入口

| 項目 | 現行情報 |
| --- | --- |
| 正本 | stepkobetsu-hub/seiseki-kanri の main |
| Android本体 | android-past-exam-scanner/（Kotlin、ML Kit Document Scanner FULL） |
| 配布 | [正式APKをダウンロード](https://github.com/stepkobetsu-hub/seiseki-kanri/releases/download/past-exam-scanner-latest/STEP-PastExam-Scanner.apk)（GitHubログイン不要・更新後も同じURL） |
| 最新版 | 0.2.1 / versionCode 6 / PR #40。0.2.0の固定署名を引継ぎ差分保存へ対応 |
| package ID | jp.stepkobetsu.pastexamscanner |
| 閲覧・管理 | https://stepkobetsu-hub.github.io/seiseki-kanri/past_exam_db.html |
| Web提出 | https://stepkobetsu-hub.github.io/seiseki-kanri/past_exam_upload.html |
| リリース一覧 | https://github.com/stepkobetsu-hub/seiseki-kanri/releases/tag/past-exam-scanner-latest |
| ビルド正本 | .github/workflows/build-past-exam-scanner.yml / app/build.gradle.kts |
| 登録情報 | Supabaseが正本、DriveがPDF保存先。GAS v130は既存APIとの互換を中継 |
| DB移行詳細 | [高速DB移行・差分保存](https://github.com/stepkobetsu-hub/seiseki-kanri/blob/main/docs/past-exam-fast-db-20261001.md) |

Web提出入口は引き続き維持する。Web版の撮影/PDF方式の試行と、現行Android版のML Kit方式を区別する。学校一覧の「取込み」は学校マスタの通信取得であり、紙面から学校名をOCRで自動判定する機能ではない。

## 学校一覧・Web提出の修正履歴

- 2026-09-30 e194e77：学校一覧の通信を3回再試行、キャッシュ回避、15秒タイムアウト、HTTP/応答形式エラーの明示。前回の学校一覧を保持する。DB未取得時はアップロードを止め、空DBによる既存登録の破壊を防ぐ。
- daa902c：スマホカメラのフォールバックと学校一覧の再取得を改善。
- 057e21e：PDF送信後にDB接続が失敗しても登録を再開できるよう修正。
- 026822e：DB再読込で登録を照合した場合だけ成功表示。
- 8597d38：登録直後に対象学校・年度のDBを新しく開く。
- b0ad5a2 / 31c1275：担当者・学校・学年・科目・年度・回・種類からファイル名を生成・コピーし、Driveスキャン時の保存名を案内。PDF選択ボタンを主操作として目立たせる。

学校一覧修正後の撮影/PDF方式は、ページ内カメラ・標準カメラ、画像のPDF化、自動補正・手動切抜き、Google Driveで作成したPDFの選択を順次試行した。最終のWeb版はGoogle Driveの「テストスキャン」で1科目1PDFを作成して選ぶ導線。旧画像変換の残存処理によるPDFアップロードエラーをfb0b650で除去した。下表は試行の履歴であり、すべての旧方式が現行機能として残っているという意味ではない。

| コミット | 実装内容 |
| --- | --- |
| 2ad080b | カメラ撮影・画像から自動PDF化 |
| 9a6b7a4 | ページ内カメラAPIとファイル選択の代替経路 |
| bccb5ff | 標準カメラからPDF化・Drive送信へ整理 |
| b48d30b | 画像をPDF化して送信する方式を徹底 |
| 387801c | 印刷用スキャンPDF・補正とオレンジ色アップロード操作 |
| 1ebe3ef | 外部スキャナー依存除去・スマホ送信状況表示改善 |
| 545f605 | PDF作成前の手動紙面切抜き確認 |
| 3c1b80b | Driveスキャンフォルダ・PDF選択方式へ切替 |
| fb0b650 | 不要な旧画像変換処理を削除 |

## Android版・このチャットの変更履歴

| 日付（日本時間） | 版・根拠 | 変更 |
| --- | --- | --- |
| 2026-10-01 | PR #34 / 54eb6e8 | ML Kit FULLで文書検出、切抜き、台形補正、白黒/カラー補正、複数ページ、PDF生成。生成PDFをそのまま送信。学校取得再試行、2000年度まで選択（2024対応）、登録メタデータ保持、fileId重複防止、DB登録再試行・再読込確認。単体テスト・コンパイル・APK生成・Lint成功 |
| 2026-10-01 | 7228fe1 | 成功ビルドのAPKをGitHub Releaseの固定URLへ公開。ログイン不要の直接ダウンロードリンクと同URLのQRコードを作成 |
| 2026-10-01 | 0.1.1 / code 2 / PR #35 / 7deb3dd | DB確認後、大きな緑色「✓ 登録完了」カード（32sp）を上部へ自動スクロール表示し、確認ポップアップ（30sp）も表示。書類とスキャン枠のネイティブランチャーアイコン（通常・adaptive）を追加。ホーム画面への追加ボタンもこの版では追加 |
| 2026-10-01 | 0.1.2 / code 3 / PR #36 / 89a6472 | 最下部に控えめな「過去問DBへ」を追加。指定のpast_exam_db.htmlを外部ブラウザで開く。48dpのタップ領域とブラウザ未対応時の案内 |
| 2026-10-01 | 0.1.3 / code 4 / PR #37 / c17a992 | DBリンクを白背景・グレー1dp枠・角丸8dpのボタンへ変更。ユーザー指定により「ホーム画面にアイコンを追加」ボタンとショートカット生成処理を削除。アプリ本体のランチャーアイコンは維持 |
| 2026-10-01 | 0.2.0 / code 5 / PR #39 / 3d07a72 | 毎ビルド新規debug署名で上書き不可となる原因を修正。固定release署名、証明書照合、署名未設定/不一致時の公開停止、同一Release assetの置換、一時鍵削除を実装。ブラウザでGitHub Actionsの非公開Secretsへ固定キーとパスワードを保存。CI・公開APKの固定署名確認成功 |
| 2026-10-01 | PR #38 / be4bbed | 別チャットの高速DB移行。学校7校・登録セル56件・ファイル55件を照合。登録情報をSupabaseへ移行、PDFはDriveを維持、GAS v130。Webは直接読込・差分保存・競合拒否 |
| 2026-10-01 | 0.2.1 / code 6 / PR #40 | 別チャットの最新Android修正。全DBのsaveFullから1セルのsavePatchへ切替、同セル競合は拒否し、fileIdを保持して最新セルへ再試行。固定署名と今回のUIを維持。テスト・APK生成・debug/release Lint・公開済み |

PRリンクは https://github.com/stepkobetsu-hub/seiseki-kanri/pull/番号 。旧配布のdebug artifact/一式ZIPは開発・履歴用。利用者のインストール・更新入口は上の固定release APK URLを使う。QRも同じ固定URLなので版更新で作り直す必要はない。

## 固定署名・更新運用

- 非公開Secrets名：SCANNER_KEYSTORE_BASE64、SCANNER_KEYSTORE_PASSWORD。設定完了。キー実値・パスワード・復元ファイルは公開台帳へ載せない。
- 公開証明書SHA-256：c6d623e1f49f3c192edf071213a6c27eaedae0ef87bc268f1c7e081add633970。
- 証明書の正本：android-past-exam-scanner/signing-certificate.sha256。
- 非公開の復元用バックアップ：STEP-PastExam-Scanner-signing-backup.zip。ユーザーへ保存済みファイルを引渡し。公開GitHub・台帳にはアップロードしない。
- 更新は同じキー・同じpackage IDを維持しversionCodeを増加。キーを再生成しない。PRではdebugテスト/生成/Lint、mainではrelease生成/Lint・証明書照合後に固定公開URLのAPKを置き換える。
- 旧debug署名版からの移行だけ一度アンインストールが必要。未登録PDFの登録を済ませ、端末の設定→アプリ→STEP過去問スキャナー→アンインストールから削除し、固定署名版を入れる。0.2.0から0.2.1以降は上書き更新可能な署名構成。実機での上書き更新確認は未実施。
- ホーム画面上のショートカット削除とアプリのアンインストールは別操作。固定署名化は更新時の再アンインストールを不要にするための変更。

## 検証・未確認・制限

- PR #35〜#37：XML解析・差分確認、各PR/mainの単体テスト・debug APK生成・Lint・固定URL公開に成功。
- PR #39：PR CI 36783762892、main CI 36783987140に成功。debug/release生成・Lint、apksigner verify・証明書一致、未設定/不一致時の停止を確認。0.2.0 APK SHA-256は795c76a80be2837a2aac5c590ba3cd0aff257086eb643ddd82c702ec4681e9ed（履歴値）。
- 最新0.2.1配布asset：6,225,539 bytes、SHA-256 16469eb2e27e434df55ae59b2665ce84aded48be78010294794e901403a2465d（GitHub公開assetのdigest、2026-10-01確認）。
- 実機未確認：起動、ML Kit初回ダウンロード・撮影・複数ページPDF・補正、DBへの実登録、2024年度登録、通信中断/再起動後の再試行、画面回転、登録完了表示・アイコン・枠付きDBボタン、固定署名版の上書き更新。CI成功を実機合格とは記録しない。
- アップロード成功時に応答を失いfileIdが不明となるケースは自動回復できない。学校マスタ取得失敗は再試行する。旧APK0.2.0以前は全体保存の同時編集リスクが残るため最新へ更新する。

## 今後の台帳更新方針

最新状態は既存「過去問保管DB」カードとSYSTEM_REGISTRY.mdへ反映し、過去の版・試行・配布リンク・検証・残課題は本記録へ追記する。更新で旧履歴を消さない。最新APKを確認して版を更新し、証明書・固定URL・package IDを維持する。機密設定の実値は記録しない。


## 2026-10-01 追加：iPhone版・共通Web版・2種類のQR

利用者が「すぐ使えるWebアプリ」を選択。続く質問によりAndroidでも共通Web版を使えるよう整備。Web版1.0.1：https://stepkobetsu-hub.github.io/seiseki-kanri/past-exam-web/ 。iPhoneはファイルアプリ、AndroidはGoogle Driveで書類スキャン・トリミング・PDF保存し、Web画面で選んで登録する。Web内で直接スキャナーを起動する実装ではない。Android専用ML Kit版0.2.1は維持。

配布案内：https://stepkobetsu-hub.github.io/seiseki-kanri/past_exam_scanner_install.html 。Android QRは固定正式APK、iPhone QRはWeb起動・ホーム画面追加。案内からAndroidもWeb版へ進める。QRをデコードし意図したURLを照合、PNGを提供。台帳の既存過去問保管DBカードにWeb版・QR案内・仕様書のリンクと用途の違いを追加。

共通Web版のsavePatch、元セル保持、重複防止、DB再読込確認、fileId保持による登録再試行、競合停止を検証。10テスト成功。ホームアイコン・manifest・登録完了の緑表示/ポップアップ・枠付きDBリンクを実装。実機ホーム画面追加・標準スキャン・実PDF登録は未確認。既存Drive権限エラーの修正とは別。詳細：https://github.com/stepkobetsu-hub/seiseki-kanri/blob/main/past-exam-web/README.md 。

Web版公開後のブラウザ通信呼出し（fetchのreceiver）を修正し、Web版1.0.1へ更新（seiseki-kanri PR #42、最終修正4784777）。ブラウザreceiverの回帰テストを追加、登録関連10テスト成功。QRの固定URLは維持。

公開後確認：共通Web版1.0.1のブラウザ画面で学校7校の一覧表示と入力の有効化を確認。Android/iPhone両QRの案内ページを公開画面で確認。登録モジュールのURLも版付けし、古い通信コードのキャッシュを回避した（245abbc）。実PDFの登録は共通GAS保存経路のGoogle承認・復旧後に実機確認する。


## 2026-10-01 利用者向け整理：公開Web版・QR・操作の違い

iPhone専用インストール版は利用者がもう少し考えるため検討保留。現時点のiPhone向け提供物はWeb版であり、IPAやApp Store版ではない。

| 提供方式 | 撮影・トリミング・PDF保存 | 過去問登録 | 更新 |
| --- | --- | --- | --- |
| Android専用版0.2.1 | 専用アプリ内で一通り行う。複数ページ対応 | 続けてアプリ内で登録 | 同じ固定署名の新APKを上書き |
| iPhone共通Web版1.0.1 | iPhone「ファイル」の書類スキャンで四隅を調整してPDF保存 | SafariでWeb版を開き、学校等を選び、PDFを選択して登録 | Web側の更新で対応 |
| Android共通Web版1.0.1 | Google Drive等でスキャン・トリミングしてPDF保存 | Chromeで同じWeb版を開き、学校等を選び、PDFを選択して登録 | Web側の更新で対応 |

- [共通Web版を開く](https://stepkobetsu-hub.github.io/seiseki-kanri/past-exam-web/)
- [Android専用APKをダウンロード](https://github.com/stepkobetsu-hub/seiseki-kanri/releases/download/past-exam-scanner-latest/STEP-PastExam-Scanner.apk)
- [Android・iPhoneのQRとインストール案内](https://stepkobetsu-hub.github.io/seiseki-kanri/past_exam_scanner_install.html)
- [Android QR画像（公開SVG）](https://stepkobetsu-hub.github.io/seiseki-kanri/images/past-exam/android-download-qr.svg)：専用APKダウンロード用。提供PNG名 STEP-PastExam-Scanner-Android-QR.png。
- [iPhone QR画像（公開SVG）](https://stepkobetsu-hub.github.io/seiseki-kanri/images/past-exam/iphone-open-qr.svg)：共通Web版を開く用。提供PNG名 STEP-PastExam-Scanner-iPhone-QR.png。iPhone専用アプリのインストールQRではない。
- STEP-PastExam-Scanner-QR-guide.jpg は案内画面の画像。最新の使い方案内は上記公開ページを参照。
- [過去問DBを開く](https://stepkobetsu-hub.github.io/seiseki-kanri/past_exam_db.html)

Web版のホーム画面追加は任意。Web版でもスキャン・トリミング・PDF保存はできるが、標準/外部アプリで作成してWebで登録する2段階。Android専用版とWeb版は併用可能。専用版では大きな緑の登録完了表示、最下部の枠付き「過去問DBへ」を維持し、不要と指定されたホーム画面追加ボタンは置かない。

### 確認状況の更新
公開ブラウザで学校一覧7校・入力の有効化と両QR案内を確認済み。登録関連10テスト、QRのデコード照合済み。
以前の「Google承認・共通保存先の復旧待ち」はその時点の記録。別チャットの最新正本により、2026-10-01 08:28 JST、GAS v131で合成PDFのuploadAll、確認用1セルのsavePatch、loadによるfileId照合が成功。確認セル・PDFの後片付けも完了。既存公開URLは維持、権限修復のためのAPK更新は不要。
iPhone/Android実機でのスキャンからPDF選択・登録までの一連操作は未確認。サーバーの復旧確認と実機確認を区別する。
根拠：[共通保存先の復旧記録](https://github.com/stepkobetsu-hub/seiseki-kanri/blob/main/docs/past-exam-fast-db-20261001.md)。


## 2026-10-01 学校一覧の待ち時間解消（Android 0.2.2 / Web 1.0.2）

利用者指摘：学校改定は年1回程度なのに、毎回の読込が遅い・失敗する。原因はAndroid/Web両方が起動時に学校一覧のため登録DB全体を取得していたこと。

- [実装コミット](https://github.com/stepkobetsu-hub/seiseki-kanri/commit/750fcfdfd266bf6ad0ef44339fa41854fdd01c72)。Android versionCode 7、Web 1.0.2。
- 当日の正本7校のID・名称・年間回数を照合し同梱。Android assets/schools.json、Web school-catalog.mjs。初回でも学校一覧取得通信なし。
- 保存済み学校マスタを優先。Android SharedPreferences schools_v1、Web localStorage stepPastExamWebSchoolsV1。未保存・破損・保存制限時は同梱一覧。登録セル・PDF情報のキャッシュではない。
- 「学校一覧を更新」で年次改定時などに手動取得。有効な一覧のみ保存。更新失敗でも既存一覧を維持。Android手動取得の全体待ち時間は25秒上限。
- PDFアップロードとDB登録時の最新データ照合・差分保存・競合拒否・重複防止・登録後fileId再読込は維持。Webページ自体の取得と登録には通信が必要。
- Androidは固定キーによる0.2.2へ一度上書き更新。固定APK URL・QRを維持。Webは再読込で1.0.2を利用。
- Web関連13テスト成功（同梱とAndroid資産の一致、保存済み改定優先、破損/ブロック時の復旧、不正/重複ID拒否を含む）。公開ブラウザで7校表示→手動更新成功→ページ再読込後の保存済み表示を確認。Android単体テスト・debugビルド・LintはCIで検証。実機の体感速度・撮影・実登録は未確認。

配布確認：Android CI 36821931568が単体テスト・debug/release APK生成・両Lint・固定署名照合・固定Release公開まで成功。0.2.2 APKは6,226,691 bytes、SHA-256 1a9ed06838afe519838d4ef930fe7add738728634cf04c577e1b6e2a5ab3c053。固定URLの公開asset更新を確認。


## 2026-10-01 学校一覧更新ボタンの位置変更
利用者指定により学校欄付近からボタンを移動（追加して残す方式ではない）。最下部に「過去問DBへ」「学校一覧更新」を横並び1行で配置。Androidは横LinearLayout・幅0dp/weight 1、Webは折返しなしのflex・等幅・短いラベル。Android 0.2.3 / versionCode 8、Web 1.0.3。学校一覧の端末保存と手動更新処理は維持。実装6c883786789ef446ae4524512bdcb92171751a1d。XML構造・ボタン1個・Web footer内配置・差分確認済み。


## 2026-10-01 学校一覧案内文の移動
「保存済みの学校一覧（7校）。学校が変わったときだけ更新してください。」を学校欄付近から削除し、最下部の「過去問DBへ」「学校一覧更新」の下へ小さく移動。Androidは11sp・中央寄せ、Webは11px。更新中/成功/失敗の学校案内も同じ位置で表示。Android 0.2.4（code 9）・Web 1.0.4、実装629e4af5539bc0271db317f5ce5eb2e28d9f08ec。XML・HTMLの案内文1個/ボタン後配置・差分確認済み。固定APK URL・署名・QRと学校端末保存処理は維持。
