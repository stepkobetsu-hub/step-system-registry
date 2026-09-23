# 成績管理・面談メモ Supabase運用更新記録

更新日：2026年9月23日  
対象：成績管理システム／面談メモ専用アプリ  
公開先：

- https://stepkobetsu-hub.github.io/seiseki-kanri/admin.html
- https://stepkobetsu-hub.github.io/seiseki-kanri/meeting_memo.html
- https://stepkobetsu-hub.github.io/seiseki-kanri/juku_app.html

## 現在の構成

- フロントエンド正本：`stepkobetsu-hub/seiseki-kanri` main
- データ基盤：Supabase Postgres／RLS
- 管理者・面談API：Edge Function `seiseki-admin-runtime-v1` v11
- 生徒API：Edge Function `seiseki-runtime-v1`
- Supabaseプロジェクト：`wisedgcgwaebtkprdhth`
- Google Sheet：既存連携・復旧経路として維持
- 秘密鍵、service_role、利用者パスワード、生徒・保護者の個人情報実値は台帳へ記録しない

## 認証・ログイン

- 面談メモ専用アプリは、新しいIDを作らず、成績管理システム・スタッフ用と同じ既存ID／パスワードを使用する。
- 管理画面と面談メモ専用アプリでログイン状態を共有する。
- 自分・家族の端末は、利用者がログアウトボタンを押すまでログインを保持する。
- 塾の共用端末は、30分間操作がなければ自動ログアウトする。
- 端末種類は未選択を初期状態とし、選ばずにログインしようとした場合は「この端末の種類を選択してください」と大きく表示する。
- 未ログイン時は面談内容・生徒情報を表示しない。
- ログアウトボタンを常設する。

## 面談・メモ

- 管理画面と面談メモ専用アプリは同じSupabaseデータを利用する。
- 一覧は面談日が新しい記録から順に表示する。
- 「一覧を読み込めませんでした」「データなし」となる不具合を修正し、Supabaseから一覧を取得する。
- 検索は取得済み一覧を端末内で絞り込み、入力のたびに不要な再通信をしない。
- 生徒全員を最初から縦に表示せず、検索欄へ入力したときだけ候補を表示し、選択して決定する。
- 管理画面と専用アプリの双方から保存・閲覧できる。

## 生徒検索

次の画面を共通検索方式へ統一した。

- 成績×通知表
- 生徒一覧
- 面談・メモ一覧
- テスト成績
- 通知表
- 志望校

検索対象：

- 漢字氏名
- ひらがな
- カタカナ
- ローマ字
- 生徒番号
- 面談・メモでは従来どおり内容も検索対象

部分一致に対応する。例：`山本`、`やま`、`ヤマモト`、`yama`、`yamamoto`。

## フリガナ整備

- 生徒マスタのフリガナをSupabaseへ332件補充した。
- 管理画面はSupabaseレスポンスの `nameKana` を検索対象として扱う。
- 旧GASの生徒一覧にフリガナがない場合でも、Supabase上にある既存フリガナを同期処理でnullへ戻さない。
- Edge Functionは互換用に `nameKana`、`kana`、`furigana` を返す。

## 在籍・退塾区分

| 内部状態 | 画面表示 | 表示色 |
|---|---|---|
| `active` | 在籍生 | 通常 |
| `withdrawal_scheduled` | 退塾予定 | 黄色 |
| `withdrawn` | 退塾生 | 赤色 |

- 退塾予定と退塾済みを別状態として扱う。
- 検索結果に退塾生を含める場合は「退塾生」マークを付ける。
- 「全期間」と「入塾時情報」は維持する。
- 面談メモの通常の生徒名簿は在籍生を基本表示する。

## 速度対策

- 管理画面・面談一覧はSupabaseから取得する。
- 面談検索は取得済みデータを端末内で絞り込む。
- 生徒フリガナはSupabaseに保持し、検索のたびにGoogleを経由しない。
- 面談・メモの入力検索は120msの短い待ち時間で反映する。

## 本番反映記録

- `admin.html`：検索統一 commit `df95769c2f6d72ef5c3c57e74ae847a11f0c8d67`
- Edge Functionソース：フリガナ保持 commit `17957921f3f61102e31222a8d6f56ebef156e207`
- Supabase Edge Function：`seiseki-admin-runtime-v1` v11、ACTIVE
- JavaScript構文確認済み
- `山本`、`やま`、`ヤマモト`、`yama`、`yamamoto`、生徒番号で一致確認
- 山本姓6名（在籍4名・退塾2名）の区分を確認
- Supabaseの既存RLS警告2件は本更新とは別件のため変更していない

## 復旧・保守上の注意

- 認証エラー時に機密データを未ログイン画面へ表示しない。
- service_roleや秘密鍵をブラウザーへ配布しない。
- 生徒マスタ同期を変更する場合は、`name_kana`をnullで上書きしないことを確認する。
- Edge Function更新時は、カスタム認証を実装済みの現行設定とファイル一式を維持する。
