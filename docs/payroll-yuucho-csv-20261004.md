# 講師給与計算・出力アプリ：ゆうちょBIZ CSV修正（2026-10-04）

対象資産ID：`teacher-payroll-processing`。既存カードに履歴を追加し、別の給与アプリカードは作成しない。

過去の給与アプリ仕様：[teacher-portal/docs/payroll-gas.md](https://github.com/stepkobetsu-hub/teacher-portal/blob/main/docs/payroll-gas.md)。今回のCSV共通化の正本・履歴は以下を参照。

## 本番・管理先
- 本番アプリ：https://script.google.com/macros/s/AKfycbxCpmgFEPaEl7EykKO1MrXDCQqg_-ww8AgfVLa6WSpD6sYuUj4pG07DwI0KizIUI7Z9/exec?app=payroll
- Apps Script編集：https://script.google.com/u/0/home/projects/1kDea6Mg9dhPLFiFjRJ9ynNyYTTG5YOgW7mg0mHXX9V3fecZjLxe3c9Tn/edit
- 正本データ：Google Sheet「給与明細2026-6-」 https://docs.google.com/spreadsheets/d/1L5aFDXAmfUDkBg8d7X3WqJgMhdMq5tM5sfUZ2G-M58E/edit
- 最新反映：GAS **v67（2026-10-04 16:43 JST）**。既存デプロイID・本番URLを維持。
- 今回のCSV修正正本は上記GASの「講師給与処理.gs」、注意書きは「給与処理アプリ画面.html」。GitHubの以前の保存ソースと同一であるとは未確認。

## 原因と共通化
登録CSVはカナ氏名の空白を除去していた一方、振込CSVは半角スペースを残していた。そのため同じ講師でも登録時と振込時のカナ名称が一致しないケースがあった。月ごとのCSV形式変更が必要なのではなく、生成経路ごとの別実装が食い違う構造を修正した。

カナ名称は **空白なしの半角カナ**へ統一。半角・全角スペース、タブ、改行、NBSP等の空白とゼロ幅スペースを除去する。漢字氏名は全角スペースのままで、カナ氏名の規則と混同しない。

| 入口 | 使用する処理 |
| --- | --- |
| アプリ版の新規講師登録 | payrollAppEmployeeCsv → createYuuchoEmployeeMasterCsv → directEmployeeMasterRow_ |
| Google Sheet拡張メニューの新規登録 | 登録CSVの行生成をdirectEmployeeMasterRow_へ共通化 |
| 振込CSV（アプリ／Google Sheet） | generateFurikomiData → toYuchoBizKana_ |
| 登録CSVのカナ変換 | directHalfKana_ → toYuchoBizKana_ |

氏名変換を直す場合は共通の`toYuchoBizKana_`を直し、入口ごとに独立した変換を追加しない。

## 本日の修正履歴
- **v65**：登録CSVの13列の行生成を共通化。金融機関漢字名・従業員漢字名はNFKC後に英数字も全角化、空白は全角に統一。漢字名の桁数（金融機関30文字、従業員48文字）、Shift_JISでの往復変換、制御文字等を検査し、出力不可の文字を事前にエラー表示する。ゆうちょ記号番号の変換・末尾チェック番号除去と7桁補完も合成データで検証。
- **v66**：アプリの「講師登録」に「ゆうちょBIZへの登録時は『全銀ファイル』ではなく『CSVファイル』を選択してアップロードしてください。」を表示。黄色の枠・背景、「CSVファイル」は赤字で強調。
- **v67**：登録・振込のカナ名称変換を共通化し、全半角空白等を除去。

登録用はヘッダー付き13列・Shift_JIS。振込用はヘッダーなし4列（従業員コード1、従業員コード2、従業員カナ名称、振込金額）。今回の空白修正でコード・金額は変更しない。

## 検証と運用
- GASの`testYuuchoEmployeeMasterCsv`で **38項目合格**。半角／全角スペース、ひらがな、半角カナ、タブ・改行・NBSP、登録と振込のカナ一致、変換の安定性、漢字・桁数・文字コード・13列・合成口座変換を確認。
- 本番画面で2026年9月分の振込データ **28件の生成完了**を確認。
- 利用者が提供した今回の振込CSVは、カナに空白がある1行のみを修正した別ファイルを非公開で提供。従業員コード・金額・行数・文字コードは維持。
- 銀行側の取込受付は未確認。台帳更新時点で再取込結果の報告は未受領。
- 新しい振込CSVをアプリで作り直すか、今回提供した修正版を使用する。従業員登録時は「CSVファイル」を選択する。
- 既存の銀行登録データ全件を自動変更したわけではない。空白付きの旧登録データがある場合は、対象者の登録カナを個別照合する。
- 公開台帳へ口座番号、個別給与額、個人名を含むCSV実体は掲載しない。

## 更新手順
上記GAS編集プロジェクトの対象ファイルを修正 → 共通処理のテストを実行 → 既存デプロイを「新バージョン」で更新 → 同じ本番URLを再読み込み → 登録と振込のカナ一致・件数を確認。Google Sheetの拡張メニューとアプリ版の双方を維持する。
