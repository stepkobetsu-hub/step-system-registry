# 経理ログイン管理アプリ

Google Sheets の「経理ログイン管理」シートをデータ源にした、Google Apps Script Web アプリです。

## 機能

- カード型表示
- サービス名・ID・勘定科目・メモ等の横断検索
- カテゴリ絞り込み
- 「開く＋IDコピー」
- メモのポップアップ表示
- 新規追加・編集・削除（Google Sheetへ即時反映）
- サービスURLからブランドアイコン/faviconを自動表示
- 任意のロゴURLによる差し替え
- Google Password Managerへのショートカット

## セキュリティ方針

- パスワードはこのアプリ・GitHub・Google Sheetには保存しない。
- パスワードは Google Password Manager に保存する。
- GitHubの公開コードには、Spreadsheet ID・ログインID・経理メモ等の実データを埋め込まない。
- 実データはGoogle Sheetからサーバー側（Apps Script）で読み込む。

## 初回設定（Google Sheetに紐づける）

1. 「経理ログイン管理マスター」のGoogle Sheetを開く。
2. `拡張機能` → `Apps Script` を開く。
3. `Code.gs` の内容を、このフォルダの `Code.gs` で置き換える。
4. HTMLファイルを追加し、ファイル名を `Index` として、このフォルダの `Index.html` を貼り付ける。
5. 必要に応じてプロジェクト設定からマニフェストを表示し、`appsscript.json` を使用する。
6. Apps Scriptエディタで `setupSpreadsheet` を選択して1回実行する。Googleの権限確認が出たら許可する。

## Webアプリとして公開

1. Apps Script右上の `デプロイ` → `新しいデプロイ`。
2. 種類は `ウェブアプリ`。
3. 説明は `経理ログイン管理`。
4. 実行ユーザーは自分。
5. アクセスできるユーザーは、可能なら `自分のみ` を選択する。
6. デプロイし、発行された `/exec` URLを経理用アプリのURLとして使用する。

同じGoogleアカウントで利用するPCなら、同じWebアプリURLとGoogle Password Managerの同期を利用できます。

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

J列はアプリが各項目を安定して識別するための内部IDです。K列が空欄の場合、Webサイトのfavicon/ブランドアイコンを自動表示します。
