# STEP配信システム 欠席一覧の低負荷自動更新（2026-08-17）

## 対象

- 公開URL: https://stepkobetsu-hub.github.io/step-message-center/
- GitHub正本: https://github.com/stepkobetsu-hub/step-message-center
- 現行main: `74c4943d0bfef42854bc413b48b0aab3a7780e04`
- Apps Script Webアプリ: v53（今回変更なし）
- 回答正本Google Sheet: https://docs.google.com/spreadsheets/d/1c2He5p_FMXGq0Gor74wIrJKtdBvTdjmO992ZkNSVuLQ/edit
- Spreadsheet ID: `1c2He5p_FMXGq0Gor74wIrJKtdBvTdjmO992ZkNSVuLQ`
- 参照シート: `★欠席遅刻`
- STEP配信側キャッシュ: `欠席キャッシュ`

## 障害の原因

画面には「自動更新：1分ごと」と表示され、`app.js` も1分ごとに `getAbsences` を呼んでいた。しかし `getAbsences` が読み込むのは元の `★欠席遅刻` ではなく、STEP配信システム側の `欠席キャッシュ` だった。

キャッシュに1件でもデータがある場合、古くても元シートを読み直さなかった。そのため、ブラウザは1分ごとに通信していても、同じ古いキャッシュを取得し続けた。新しいページを開いた場合も、最初に端末の `localStorage` を表示し、その後のAPI取得も古いキャッシュだったため、何日も前の状態が残った。

緑色の「欠席連絡を手動更新」は `refreshAbsences` → `refreshAbsenceCache()` を実行するため、押した場合だけ最新になっていた。

## 現在の仕様

| タイミング | 動作 |
|---|---|
| ページを開いたとき | 元の回答Sheetを1回読み、欠席キャッシュを更新 |
| 表示中 | 5分ごとにキャッシュを取得して画面を確認 |
| 予備更新 | 10分ごとに元の回答Sheetを読み、欠席キャッシュを更新 |
| 新規フォーム送信 | 既存の `onAbsenceFormSubmit` → `refreshAbsenceCache()` 経路を維持 |
| 手動操作 | 「欠席連絡を手動更新」を予備として維持 |
| 通信失敗 | 「自動更新に失敗しました」と表示 |
| 正常時 | 「元データ更新：MM/DD HH:MM」と実更新時刻を表示 |

頻繁な元Sheet読取は行わない。通常はページ起動時と10分ごとだけ元データを読み、5分確認は軽いキャッシュ取得とする。

## 表示順

欠席一覧は次の順番。

1. 当日分
2. 明日以降のうち日付が近いもの
3. 先の日付

以前は `app.js` が取得配列を `.reverse()` していたため、先の日付が上、当日が下になっていた。逆順処理を削除して、サーバーが返す日付昇順をそのまま表示する。

## 元データへの導線

「元データ更新：日時」の右横に、小型の「元データへ」ボタンを設置した。

- リンク先: 上記の回答正本Google Sheet
- 別タブで開く
- 赤色の「送信前に必ず更新してくださいね！」は右側に維持

## 変更履歴

| 内容 | PR | mainコミット |
|---|---:|---|
| 低負荷自動更新、更新時刻、失敗表示、既存API互換 | [#1](https://github.com/stepkobetsu-hub/step-message-center/pull/1) | `06881784bed23c84f506026c90397b9fe71f3464` |
| 未デプロイのCode.gs変更を戻し、Apps Script v53との整合を維持 | [#2](https://github.com/stepkobetsu-hub/step-message-center/pull/2) | `e121cc1d7e9fbed841cee2b8ac576c20939459dd` |
| 当日分を最上部に変更 | [#3](https://github.com/stepkobetsu-hub/step-message-center/pull/3) | `b02dafeda8ca476574ecd6f6269373b664bb4fac` |
| 「元データへ」ボタン追加 | [#4](https://github.com/stepkobetsu-hub/step-message-center/pull/4) | `74c4943d0bfef42854bc413b48b0aab3a7780e04` |

変更前のmainは `e1ba6b9c3a3a9e6270804864f04a2cf71364563d`。

## 変更していない範囲

- メール送信処理
- テンプレート
- 送信履歴
- 生徒一覧
- Brevo連携
- Apps Script Webアプリ v53
- 既存デプロイID
- Google Sheetの列構成

## 確認済み

- `app.js`、`api.js`、`Code.gs` の構文
- ページ起動時の元データ更新経路
- 5分キャッシュ確認
- 10分元データ予備更新
- 既存Apps Script v53への互換フォールバック
- 当日優先表示
- 正本Google Sheetへの別タブリンク
- JavaScript／CSSキャッシュ更新番号
- 各mainコミットのGitHub Pages公開成功

## 障害時の確認順

1. 画面の「元データ更新」時刻を確認する。
2. 「元データへ」で `★欠席遅刻` の実データを確認する。
3. 画面に「自動更新に失敗しました」が出ていないか確認する。
4. 緑色の「欠席連絡を手動更新」を1回押す。
5. 改善しない場合は、`api.js` のAPI URL、Apps Script v53、`refreshAbsences`、`refreshAbsenceCache()`、`欠席キャッシュ` を順に確認する。
6. 表示が古い場合は、GitHub Pagesの公開コミットと `index.html` の `app.js`／`style.css` 更新番号を確認する。

## 変更時の注意

- 5分確認はキャッシュ取得、10分更新は元Sheet読取という役割を混同しない。
- `Code.gs` を変更する場合だけ、Apps Scriptの既存デプロイIDを維持して新バージョンへ更新する。
- 回答先を変更するときは、Spreadsheet ID、`★欠席遅刻`、フォーム送信トリガー、手動更新、画面リンクを一体で確認する。
- 送信機能と欠席表示は変更範囲を分離する。
