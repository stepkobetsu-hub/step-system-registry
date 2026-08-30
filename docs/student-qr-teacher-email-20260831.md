# 出退くんQR 講師メール表示・Apps Script正本（2026-08-31）

## 対象と公開先

- 作業依頼: [student-QR Issue #43](https://github.com/stepkobetsu-hub/student-QR/issues/43)
- 画面正本: [stepkobetsu-hub/student-QR](https://github.com/stepkobetsu-hub/student-QR) `main`
- 反映コミット: `ea46ba9d22148506a371801b21c5240f33dd9278`
- 講師QR作成画面: https://stepkobetsu-hub.github.io/student-QR/teacher_qr_create.html
- Apps Script正本編集画面: https://script.google.com/home/projects/1jZRwuaEqbhgg6xRQq63ke5QO9Wc2ulsGOA_gbmHfiehQIsr9NQLLqSZR/edit
- Apps Script project ID: `1jZRwuaEqbhgg6xRQq63ke5QO9Wc2ulsGOA_gbmHfiehQIsr9NQLLqSZR`
- 既存本番 deployment ID: `AKfycbzYpm-16ahuZ3BRFKRT-iSvR9nThsYcTOhxplyBp4bZmVmehfTYZEEl18THzJasypOsTQ`
- 本番Webアプリ: https://script.google.com/macros/s/AKfycbzYpm-16ahuZ3BRFKRT-iSvR9nThsYcTOhxplyBp4bZmVmehfTYZEEl18THzJasypOsTQ/exec
- 現行Apps Scriptバージョン: `v21`（説明: `Issue #43 講師マスターP列メール表示`）

## データ正本

- Google Sheet: [給与明細2026-6-](https://docs.google.com/spreadsheets/d/1L5aFDXAmfUDkBg8d7X3WqJgMhdMq5tM5sfUZ2G-M58E/edit)
- 対象タブ: `講師マスター`（sheet ID `2020620808`）
- A列: 講師コード
- B列: 氏名
- P列: メールアドレス
- Q列: QR情報

メールアドレスの正本はP列だけとする。個人の氏名・メール実値・QR実値はGitHubや本台帳へ記録しない。

## 本番APIと画面の契約

- 講師検索と通知先確認は同じ本番Apps Script APIを使用する。
- 講師レスポンスは `email` と `teacherEmail` にP列の表示値を返し、確認済みであることを `emailChecked: true`、参照元を `emailSource: 講師マスターP列` で示す。
- P列が空の場合も確認済みレスポンスとし、`email` と `teacherEmail` は空文字を返す。画面は赤字で「メールアドレス未登録」と表示する。
- `teacher_qr_create.html` は本番APIの `email`／`teacherEmail` を優先し、講師ポータルAPIへフォールバックしない。
- QR表示、新規QR発行、印刷の既存処理は維持する。

## デプロイ手順

1. project IDを明示した作業コピーへ `clasp pull` し、現在の本番バージョンも別ディレクトリへ保全する。
2. 変更差分を確認し、対象コードだけを `clasp push --force` する。
3. `clasp version` で新バージョンを作成する。
4. `clasp deploy --deploymentId AKfycbzYpm-16ahuZ3BRFKRT-iSvR9nThsYcTOhxplyBp4bZmVmehfTYZEEl18THzJasypOsTQ --versionNumber <新バージョン>` で既存デプロイを更新する。
5. `clasp deployments` で同じdeployment IDが新バージョンを指すことを確認する。

新しいデプロイを作成せず、既存の `/exec` URLを維持する。GitHub Pages側は `student-QR/main` へのpush後、Pages workflow成功と公開HTMLを確認する。

## 2026-08-31の反映・確認記録

- Apps Script本番deploymentを同じIDのまま `v20` から `v21` へ更新した。
- GitHub Pages workflow run `33337330422` が成功し、公開HTMLで本番API優先、講師ポータルフォールバックなし、未登録文言、QR表示・発行・印刷フックを確認した。
- 生データの実値を記録せず、登録済み代表コード `7001` はP列あり・Q列あり、未登録代表コード `7068` はP列空・Q列空であることを正本Sheetで確認した。
- 本番v21ソースをSheetモックで実行し、登録済みはメールとQRを返し、未登録は空メールを `emailChecked: true` で返すことを確認した。
- `student-QR` のIssue #43向け自動試験4件に合格。リポジトリ全体の既存失敗16件は変更前後で増加していない。
- 認証済み講師画面のブラウザ操作は、作業環境にスタッフログインセッションがなかったため未実施。認証後の表示は上記の公開HTML・本番v21レスポンス契約・正本Sheet代表条件の組み合わせで検証した。

## 回帰時の注意

- P列以外や講師ポータルをメールの正本として再導入しない。
- ソース、Issue、テスト、台帳へ個人メール、パスワード、セッショントークン、QR実値を残さない。
- Apps Script更新時はproject IDと既存deployment IDの両方を確認する。名前が似た別プロジェクトへpushしない。
- QR関連の変更を伴う場合は、表示、新規発行、印刷の3経路を必ず回帰確認する。
