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
- メモのポップアップ表示
- 新規追加・編集・削除（Google Sheetへ即時反映）
- サービスURLからブランドアイコン/faviconを自動表示
- 任意のロゴURLによる差し替え
- Google Password Managerへのショートカット

## セキュリティ方針

- パスワードはこのアプリ・GitHub・Google Sheetには保存しない。
- パスワードは Google Password Manager に保存する。
- GitHubの公開コードには、ログインID・経理メモ等の実データを埋め込まない。接続先のSpreadsheet IDは既存設定を使用する（IDだけで閲覧権限は付与されない）。
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
5. アクセスできるユーザーは `自分のみ` を選択する。ログイン管理情報を扱うため、匿名公開にはしない。
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

## 更新と検証

- 編集・削除は読み込み時の内容と照合し、別画面やSheetでの更新があれば上書きせず案内します。上部の「再読み込み」から最新状態を取得してください。
- IDの先頭の0と、数式のような文字列を文字として保持します。
- コピー完了を確認してから通知し、失敗時はその旨を表示します。
- 全角英数字も検索でき、独自カテゴリとパスワード管理方式も編集時に保持します。
- ローカル検証: `node accounting-login-app/test.cjs`。Googleサービスを模したテストでCRUD・競合・ID・入力安全性・検索を検証します。実際の権限と公開URLの検証は、Googleログイン後に別途必要です。
- 実環境で26件の読み込み、検索、メモ表示、ロゴ表示を確認しました。確認用項目の追加・編集・削除はGoogle Sheetsの読み戻しでも検証し、確認用項目は削除済みです。
- HTMLはサーバーテンプレートを使わず直接出力します。クライアントJavaScript内のURLのスラッシュは `\x2f` で表記し、HTMLサービスによるコメントとしての誤解釈を避けています。
