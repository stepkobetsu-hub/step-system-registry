# 2026-10-29 有料・全宛先への本番移行

■2026-10-29 有料・全宛先への本番移行
契約：admin@educrest.jpの既存Postmarkアカウント、Basic 10,000通／月、US$15。契約画面Currentと2026-11-29更新を確認。
生徒QR：本番v96→97（21:11 JST）、STEP配信：v63→64（21:35 JST）。各既存デプロイID・URLを維持。QRのPOSTMARK_PRODUCTION_ENABLED、配信のPOSTMARK_MC_PRODUCTION_ENABLEDをtrueに設定。QRの開始日時2026-10-29T12:09:40.470Z。Yahoo限定・既存許可リスト・累計試験上限を本番経路では使わず、全ドメインの新規生徒入退室・講師勤怠通知、QR送付、STEP配信の既存通知をPostmarkへ振り分ける。既存の恒久不達・迷惑報告・手動停止を保持。Brevoの契約・秘密値は削除していない。
送信予約台帳を同じ入退室ログ２内の「Postmark送信台帳」に保存し、Script Propertiesの容量上限による累積停止を回避。既存の予約・受付済み記録は参照し続け、試行カウンターは削除・リセットしない。結果不明時に自動再送・Brevo切替はしない。切替前のキューと過去保留分は一斉再送しない。
21:38に管理者Gmail・Yahooへ各1通送信。要求ID step-paid-production-test-20261029。Gmail MessageID 81e90074-ab78-4c51-9830-f987fe427080、Yahoo 8811cd2f-ed59-4642-92af-e91fcdc08958。21:42:07に共通ログ両件の配信完了・エラー空欄を確認。早期Webhookとログ追加の順序差で残る受付表示は既存GET照合で補完できた。13件のモックテスト合格。実生徒の入退室・ポイントを作らず、実在保護者への一斉テストも行っていない。
アプリの月次10,000通停止は設けず、契約側の超過課金条件に従う。本番稼働に試験通数上限は適用しない。

---

以下は2026-10-28時点の導入記録です。無料契約・Yahoo限定・試験上限の記載は当時の履歴です。

# Postmark導入・運用記録（2026-10-28）

## 本番と送信範囲
承認済みLiveサーバー21178320。QR登録Yahoo38件、STEP配信登録Yahoo11件。QRは2026-10-28 19:16、STEP配信は20:27に有効化。Yahoo以外と講師勤怠は既存Brevo。新規宛先はallowlist更新が必要。
QR Apps Script：1ZFzVbJM15igFE7InsX1fu-FlNrYUY45vviozJP0k1uVXy_HvmGfseZ22／本番v96、旧v94→初回v95→連携v96。既存本番デプロイAKfycbw8L36Fj8SKtvNHQBi41FMqAPvDLGAdu1bbLxvd-78A8dFUOkWGnYRE-8PRNq7QZOl70wを維持。ステージングはv96。
STEP配信 Apps Script：1nrEhPSvPj9qyyF6buHjut_aGOEMiHmnKZ0N53rFaBNPdkaA3sBpBgek4／v62→v63。既存デプロイAKfycbxIH2VtgwRi50xduXgrkYrjD0yrzNfQ5vCWt1XgOzil6LZSgXNj6MJo9jPYvOkjNHduを維持。
## 取得・差分
添付Code_Postmark.gs、DeliveryFailures_Postmark.gsとstudent-QR PR#50のPostmarkPilot.jsを確認。PRブランチcodex/postmark-yahoo-pilot／取得SHA84eafda29028f97b1f211b620307e159e6b2fcc8。QRにPostmarkPilot.gs追加、メインと不達処理を差分適用。STEP配信にPostmarkMessageCenter.gs追加、sendStepMail_に小さな分岐を追加。認証付きサーバー間POSTでQR送信を共用、添付複数・本文・From名・ReplyTo・送信元を保持。GitHub PRは未マージ、今回の本番差分はApps Script側が正本（GitHubとは未同期）。
## バックアップ
QR元9ファイル（appsscript.json、delivery_failures.html、DeliveryArchive.gs、DeliveryFailures.gs、DeliveryHistoryV2.gs、EdgeRosterSync.gs、MyQrApi.gs、PointManager.gs、コード.gs）、デプロイ一覧、表示確認可能なトリガー情報を退避。元トリガー所有者の詳細・実行間隔は権限上未取得。秘密値は非表示・配布ZIPに非収録。STEP配信元6ファイルはネイティブプロジェクト複製、変更前メインと差分も保存。ネイティブコピーはプロパティ／トリガーの複製ではない。
## 検証と実績
無効状態で構文・設定・Webhook認証／未知ID拒否・既存Brevo8経路・写真・重複防止を確認。既存15テスト＋橋渡し5テスト成功、ステージングで不正キー・Gmail対象外・要求ID欠落の3拒否試験を確認。管理者YahooへQR2通とSTEP配信1通を少数送信し、実Webhookで配信完了。配信試験MessageID06ba4863-70ba-4839-8e2e-399163efa680はログ4116、20:23:39配信完了。実生徒のYahoo入退室も配信完了記録あり。一斉送信を検証前に有効化せず。
## 既存機能・トリガー
入退室、講師勤怠、ポイント、写真／添付、Brevo、送信履歴、予約、授業連携、不達・管理者メール／LINE通知を維持。元のprocessCheckInMailQueue、archiveOldDeliveryHistoryScheduledは変更せず。reconcilePostmarkPilotDeliveries、reconcileMessageCenterPostmarkDeliveriesを5分ごとに追加（結果取得GETのみ）。
## 安全制御と復旧
専用Webhookトークンと橋渡しキーはScript Properties。API秘密値をチャット・台帳・カードへ保存しない。RESERVED／ACCEPTED台帳と送信要求IDで重複防止。受付後の結果不明・失敗は自動Brevo再送しない。送信前の対象外／上限到達だけ既存Brevoへ戻る。永久・手動・spam停止を維持。過去保留分の一斉再送なし。POSTMARK_PILOT_ENABLED=false、POSTMARK_MC_ENABLED=falseで各新規Postmark経路を停止。受付済みの記録・試行カウンターは削除／リセットしない。コード復旧時も既存デプロイIDを維持。
## 契約・予算（2026-10-28 20:49〜20:52確認）
Free Developer 100通／月、アカウント使用8・残92、次回更新2026-11-27。共有POSTMARK_PILOT_MAX_ATTEMPTSは20→90へ変更、ATTEMPTS_USED=8を維持、アプリ残82。累計上限で月次自動リセット未実装。変更前値はPOSTMARK_BUDGET_BACKUP_20261028に保存。上限到達後は新規対象がBrevoへ戻るため、契約変更だけでは上限は増えない。継続運用時に予算コードと上限を再調整する必要。
## 無料枠見積
入退室ログ２／ログA6:Q4118を読取、テスト・ダミー・生徒番号1001を除外、G列Yahoo宛先を1通単位に集計。9月146通（QR131・STEP配信15）、10/1〜28は103通（QR79・STEP配信24）、9/29〜10/28の直近30日117通。相関ID重複なし。8月は宛先空欄が多いため比較に使わない。現在のペースは約110〜150通／月で100通超の可能性が高い。統計的確率は算出不可。Yahoo通知を全件継続するなら有料化候補。Basicは10,000通／月US$15、超過US$1.80/1,000通（当日管理画面表示、税等は契約時確認）。課金・プラン変更なし。通常連絡先mintcocoajasmine@gmail.com。

## 関連リンク

- [Postmark管理画面](https://account.postmarkapp.com)
- [取得元PR #50](https://github.com/stepkobetsu-hub/student-QR/pull/50)
- [QR Apps Script](https://script.google.com/home/projects/1ZFzVbJM15igFE7InsX1fu-FlNrYUY45vviozJP0k1uVXy_HvmGfseZ22/edit)
- [STEP配信 Apps Script](https://script.google.com/home/projects/1nrEhPSvPj9qyyF6buHjut_aGOEMiHmnKZ0N53rFaBNPdkaA3sBpBgek4/edit)
- [実績・共通ログ](https://docs.google.com/spreadsheets/d/1VyQ3O69PDArG2bJt_Qf347rlTwKfjqM6KPLDWqIPo6A/edit)
- [経理Postmarkカード](https://script.google.com/macros/s/AKfycbzPMsfBR4XkOqqQJrt-JCc-ALjI7Pha2XEq80DVtyd3-OCBRwdMbuDUq_vmL57yMhql7A/exec)

## バックアップ保管先

- QR導入前：https://chatgpt.com/library?file_id=libfile_ef5e31c5c798819198939edc1f2727d3&account_id=personal
- QR初期結果：https://chatgpt.com/library?file_id=libfile_1d1004be7d288191a9b7fccc5c608dd9&account_id=personal
- STEP配信変更前：https://chatgpt.com/library?file_id=libfile_884e8797da848191af66874c3979d5d7&account_id=personal
- 最終v96/v63差分：https://chatgpt.com/library?file_id=libfile_a72ab62bbdd881918ceb77992da9889c&account_id=personal
- 配信のネイティブ複製：https://script.google.com/home/projects/1kiDzhEkrT3UA8Z_SpE3BQT9LBgWApx51SC6NrIN2GOpWBwjZRXlf-95O/edit
