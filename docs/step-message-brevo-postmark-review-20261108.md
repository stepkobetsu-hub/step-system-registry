# STEP配信・Brevo有料プラン終了に伴う送信経路確認（2026-11-08）

対象: https://stepkobetsu-hub.github.io/step-message-center/

## 2026-11-08 確認済み
- Brevo「Starter plan」の有料サブスクリプションはユーザー操作で解約**予約済み**。管理画面には "Your subscription has been scheduled to be cancelled. It will expire on November 12, 2026 7:00 AM." と表示。Brevoアカウント自体は削除しない。解約予約の取消ボタン「Remove scheduled changes」は押さない。
- Google Sheet「入退室ログ２」`ログ` タブに、送信元 `STEP_MESSAGE_CENTER`／件名「まだお見えになっておりません」／`postmark:` ID／「配信完了」の記録が2026-11-07に複数件。神領校・大手町校いずれも確認。
- 同じログで「特訓部屋のお知らせ」について、2026-10-28および2026-10-29にPostmark送信IDと「配信完了」を確認。
- 入退室通知も2026-11-07の送信キューに `POSTMARK` と `delivered` の記録。受信サーバーへの引渡しは確認できるが、保護者が実際に閲覧したことまでは保証されない。
- STEP配信の予約処理はGitHub上の `ScheduledDelivery.gs` で `sendSelected_` に合流する設計。通常送信と予約送信で送信経路を共用することを確認（ただし本番デプロイのソース一致までは未確認）。

## 重要: 正本と未確認事項
- GitHub `step-message-center/Code.gs`（2026-11-08確認）は `MAILAPP` または `BREVO` を選択する旧仕様で、`sendStepMailViaBrevo_` が残る。一方、台帳既存情報には、本番Apps Scriptに `PostmarkMessageCenter.gs` を導入済みでGitHubへ未同期、と明記されている。本番送信ログもPostmarkを示す。**GitHubの旧Code.gsを本番Apps Scriptへ上書きしない**。
- 本番Apps Scriptの送信方式・全宛先（Yahoo以外を含む）・Brevo自動切り戻し有無・APIキー参照の有無・予約送信トリガーは、読み取り可能なGitHubだけでは完全検証できない。解約予定日2026-11-12 07:00 JSTまでに本番Apps Scriptの設定・ソース・デプロイを直接確認すること。
- 旧Brevo連携は削除せず、最初に本番のすべての送信がPostmarkを使用し、Brevoへのフォールバックが不要であることを確認する。Brevo停止後に送信失敗が発生し得る設定を放置しない。
- 「特訓部屋」は10月29日の配信成功を確認。11月7日時点の同種の実送信は、この調査では未確認。確認用の実在生徒へのメール送信は行っていない。

## 取扱い・作業範囲
- 2026-11-08の確認・資産台帳更新では、メール設定値変更、本番Apps Script再デプロイ、Brevoのアカウント削除、送信テスト実行は行っていない。
- 秘密値（Brevo/Postmark APIキー、認証トークン、個人のメールアドレス）は公開台帳へ記載しない。
- 正式管理先: https://github.com/stepkobetsu-hub/step-message-center とGoogle Apps Script本番プロジェクト。Google Sheetは https://docs.google.com/spreadsheets/d/1VyQ3O69PDArG2bJt_Qf347rlTwKfjqM6KPLDWqIPo6A/edit
