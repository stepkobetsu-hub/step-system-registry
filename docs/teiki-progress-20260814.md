# 定期テスト進捗管理 — 資産詳細

更新日: 2026-08-14

## 正式名称

**定期テスト進捗管理**

定期テストに向け、生徒が前回点・目標点と教材の進捗を入力し、先生が全生徒の状況を一覧確認するシステム。

## 本番リンク

- 本番アプリ（Netlify）: https://beautiful-blini-37eee7.netlify.app/
- 認証・保存Apps Script Webアプリ: https://script.google.com/macros/s/AKfycbzKzfGh2q7EO3Zeuuwn1lRLA8jefGgU4rff9kcXycTi0XZidW43B-BTskHBNUX1R46L/exec
- 保存先Google Sheet: https://docs.google.com/spreadsheets/d/1djHVsUQ1vZpvmtPlzMf295U_RKfazk-tR5ysLBP_R9k/edit
- 生徒マスタ: https://docs.google.com/spreadsheets/d/1CIJkTlYUcUkbb8jBdFc6L8D5ubTGsxwNxFv01ten-Zk/edit?gid=674620482#gid=674620482
- 講師マスター: https://docs.google.com/spreadsheets/d/1L5aFDXAmfUDkBg8d7X3WqJgMhdMq5tM5sfUZ2G-M58E/edit?gid=2020620808#gid=2020620808

## Google Sheet正本

- ファイル名: **定期テスト進捗管理DB_2026**
- Spreadsheet ID: `1djHVsUQ1vZpvmtPlzMf295U_RKfazk-tR5ysLBP_R9k`
- 使用タブ: **進捗データ**
- 現行の保存基盤はこのGoogle Sheet。

保存する主な情報:

- キー（生徒ID＋テスト名）
- 生徒ID
- 氏名
- 学年
- 年間テスト回数
- テスト名
- 科目・教材別進捗JSON
- 前回点・目標点JSON
- 保存日時

## Apps Script

- プロジェクト名: **定期テスト進捗管理・認証API**
- WebアプリURL: https://script.google.com/macros/s/AKfycbzKzfGh2q7EO3Zeuuwn1lRLA8jefGgU4rff9kcXycTi0XZidW43B-BTskHBNUX1R46L/exec
- 実行設定: 自分として実行
- アクセス設定: 全員
- 現行版では、認証だけでなくGoogle Sheetへの進捗保存・読込・先生一覧取得を担当する。
- Apps Scriptの編集URL／Project IDは台帳上で未確定。確認できた時点で追記する。
- TOKEN_SECRET等の秘密値は台帳・GitHubへ保存しない。

## 認証仕様

### 生徒

- 生徒マスタ「☆マスタ」を参照。
- A列 = 生徒ID
- L列 = PASS
- ログイン後、氏名・学年をマスタから取得して固定表示する。

### 講師

- 講師マスター「講師マスター」を参照。
- A列 = 講師ID
- L列 = 生年月日
- パスワードは生年月日の月日4桁。例: `1995/07/20` → `0720`
- このアプリの講師認証ではAJ列・AK列を使用しない。

## 画面・機能

- 生徒入力
- 先生用ダッシュボード
- マイページ
- 前回点数・目標点数・差の記録
- 英語・数学・国語・理科・社会の教材別進捗
- 1周・2周・3周の進捗管理
- 第2テキスト名設定
- 生徒本人の保存データ読込
- 先生による全生徒一覧確認

## 公開方式

Netlifyサイト `beautiful-blini-37eee7` はGitHub連携ではなく **Netlify Drop** で公開されている。

更新時:

1. 本番HTMLを単一ファイルとしてNetlifyのProduction deploysへアップロード。
2. ファイル名が `index.html` でない場合は **Rename and deploy** を選ぶ。
3. Apps Scriptを変更した場合は既存Webアプリデプロイを「新しいバージョン」で更新し、WebアプリURLを維持する。
4. 生徒ログイン、講師ログイン、保存、先生一覧を確認する。

## 旧構成・復旧経緯

- 元アプリは2026年6月ごろに作成。
- 旧保存基盤: Firebase project `juku-teiki-progress`
- 旧Firestore collection: `progress`
- 2026-08-14、Firestore書込時に `Missing or insufficient permissions` が発生。
- 古いデータは不要との運用判断により、旧Firestoreデータは現行Google Sheetへ移行しない。
- 現行保存はFirebaseから切り離し、専用Google Sheetへ変更した。
- 旧先生用の固定パスワード方式は廃止し、講師ID＋生年月日4桁へ変更した。
- Firebaseは旧構成の確認用として残っていてもよいが、現行DBと誤認しないこと。

## 確認済み

- 本番URLがHPに貼られていた実運用アプリと一致。
- 生徒ID＋生徒マスタL列PASSでログイン成功。
- 講師ID＋講師マスターL列生年月日（月日4桁）でログイン成功。
- Google Sheet「定期テスト進捗管理DB_2026」への保存成功を実機確認。

## 次回作業開始点

1. 本番URL `beautiful-blini-37eee7.netlify.app` を確認。
2. 保存先は必ず `定期テスト進捗管理DB_2026` → `進捗データ` を確認。
3. 認証・保存APIは上記Apps Script WebアプリURLを確認。
4. Firebase `juku-teiki-progress` は旧構成であり、現行保存先として修正しない。
5. Netlify更新はNetlify Drop方式であることを忘れない。
