# 経理ログイン管理アプリ

Google Sheets の「経理ログイン管理」シートをデータ源にした、Google Apps Script Web アプリです。

## 利用URL

[経理ログイン管理を開く](https://script.google.com/macros/s/AKfycbzPMsfBR4XkOqqQJrt-JCc-ALjI7Pha2XEq80DVtyd3-OCBRwdMbuDUq_vmL57yMhql7A/exec)

2026年9月7日公開。デプロイしたGoogleアカウントでログインして利用してください。アクセス設定は「自分のみ」です。

[Apps Scriptプロジェクト](https://script.google.com/home/projects/1icAh38Pk7hdINs3CucB6uwyEy_uFighmfcqOOhkvvQZbh0ohkdAuTxSt/edit)のサーバーファイル名は `コード.gs`、画面は `Index.html` です。更新時は既存のデプロイを新バージョンへ更新すると、利用URLを維持できます。

## 機能

- カード型表示
- サービス名・ID・勘定科目・メモ等の横断検索
- カテゴリ絞り込み
- 「開く＋IDコピー」
- パスワードのアプリ内登録・更新・表示・コピー・削除
- メモのポップアップ表示
- 新規追加・編集・削除（Google Sheetへ即時反映）
- カード順の並べ替え（PCはドラッグ、スマホは↑↓。順番はGoogle Sheetへ保存）
- サービスURLからブランドアイコン/faviconを自動表示
- 任意のロゴURLによる差し替え

## パスワードの扱い

- パスワードはGoogle SheetにもGitHubにも書き込みません。
- パスワードはApps Scriptの `UserProperties`（利用Googleアカウント専用の非公開プロパティ）に保存します。
- 同じGoogleアカウントでこのWebアプリを利用するPCでは、同じ登録済みパスワードを利用できます。
- 編集画面でパスワード欄を空欄のまま保存した場合、現在のPWを維持します。
- 新しいパスワードを入力して保存すると、以前のPWを上書きします。
- 「登録済みPWを削除」で、保存済みPWだけを削除できます。
- 一覧取得時にはパスワード本体を返さず、「登録済みかどうか」だけを返します。PW表示・コピー時だけ個別に取得します。

## セキュリティ方針

- Webアプリは「自分のみ」で運用し、匿名公開しない。
- GitHubの公開コードには実際のパスワードを保存しない。
- ログインID・経理メモ等の実データはGoogle SheetからApps Scriptサーバー側で読み込みます。
- 接続先Spreadsheet IDはコード側にありますが、IDだけではシートの閲覧権限は付与されません。

## カード順

- Google SheetのL列「表示順」を正本とします。
- 初期値は1〜26で登録済みです。
- Webアプリの「↕ 並べ替え」を押すと並べ替えモードになります。
- PCではカードをドラッグ、スマホではカード右上の↑↓で移動します。
- 変更は即時にGoogle Sheetへ保存され、別PCでも同じ順番で表示されます。
- 新しいカードは末尾へ追加されます。

## Sheet列

A: カテゴリ  
B: サービス名  
C: 開く（Sheet用リンク）  
D: URL  
E: ログインID / アカウント  
F: パスワード管理  
G: 勘定科目・用途  
H: 金額・補足  
I: メモ  
J: 管理ID  
K: ロゴURL（任意）  
L: 表示順

J列はアプリが各項目を安定して識別するための内部IDです。K列が空欄の場合はWebサイトのfavicon/ブランドアイコンを自動表示します。L列はカード表示順の保存用です。

## 更新方法

1. GitHubの `accounting-login-app/Code.gs` と `Index.html` をApps Scriptプロジェクトへ反映する。
2. Apps Script右上の「デプロイ」→「デプロイを管理」で既存デプロイを新バージョンへ更新する。
3. 既存の `/exec` URLを開き、機能を確認する。

既存デプロイを更新すれば、利用URLはそのまま維持できます。
