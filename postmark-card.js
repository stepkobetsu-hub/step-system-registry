/* Postmark rollout record, 2026-10-28. Contains no credentials. */
(() => {
  const record = {
  "ID": "postmark-mail-service",
  "システム名": "Postmark導入・運用記録",
  "正式名称": "Postmark導入・運用記録",
  "分類": "システム資産台帳",
  "状態": "本番稼働中（無料枠・Yahoo通知・有料化検討）",
  "利用者": "管理者",
  "運用担当": "管理者",
  "概要": "Yahoo宛ての生徒QR入退室・STEP配信通知をPostmarkへ切替。QR v96／配信v63、既存URL・Brevo・不達管理・入退室・講師勤怠・ポイント等は維持。無料100通／月、アプリは累計90試行。9月146通・10月1〜28日103通・直近30日117通のため、有料化の見込みが高い。現在有料契約なし。",
  "利用者向けURL": "https://account.postmarkapp.com",
  "GitHubドキュメントURL": "https://github.com/stepkobetsu-hub/step-system-registry/blob/main/docs/postmark-rollout-20261028.md",
  "GitHubドキュメント": "docs/postmark-rollout-20261028.md",
  "Apps Script編集URL": "https://script.google.com/home/projects/1ZFzVbJM15igFE7InsX1fu-FlNrYUY45vviozJP0k1uVXy_HvmGfseZ22/edit",
  "Apps ScriptプロジェクトID": "1ZFzVbJM15igFE7InsX1fu-FlNrYUY45vviozJP0k1uVXy_HvmGfseZ22",
  "Apps Scriptバージョン": "QR v96／STEP配信 v63（2026-10-28）",
  "Google Sheet URL": "https://docs.google.com/spreadsheets/d/1VyQ3O69PDArG2bJt_Qf347rlTwKfjqM6KPLDWqIPo6A/edit",
  "Google Sheet名": "入退室ログ２",
  "使用シート名": [
    "ログ",
    "メール送信キュー",
    "不達メール管理"
  ],
  "作業メモ": "■本番と送信範囲\n承認済みLiveサーバー21178320。QR登録Yahoo38件、STEP配信登録Yahoo11件。QRは2026-10-28 19:16、STEP配信は20:27に有効化。Yahoo以外と講師勤怠は既存Brevo。新規宛先はallowlist更新が必要。\nQR Apps Script：1ZFzVbJM15igFE7InsX1fu-FlNrYUY45vviozJP0k1uVXy_HvmGfseZ22／本番v96、旧v94→初回v95→連携v96。既存本番デプロイAKfycbw8L36Fj8SKtvNHQBi41FMqAPvDLGAdu1bbLxvd-78A8dFUOkWGnYRE-8PRNq7QZOl70wを維持。ステージングはv96。\nSTEP配信 Apps Script：1nrEhPSvPj9qyyF6buHjut_aGOEMiHmnKZ0N53rFaBNPdkaA3sBpBgek4／v62→v63。既存デプロイAKfycbxIH2VtgwRi50xduXgrkYrjD0yrzNfQ5vCWt1XgOzil6LZSgXNj6MJo9jPYvOkjNHduを維持。\n■取得・差分\n添付Code_Postmark.gs、DeliveryFailures_Postmark.gsとstudent-QR PR#50のPostmarkPilot.jsを確認。PRブランチcodex/postmark-yahoo-pilot／取得SHA84eafda29028f97b1f211b620307e159e6b2fcc8。QRにPostmarkPilot.gs追加、メインと不達処理を差分適用。STEP配信にPostmarkMessageCenter.gs追加、sendStepMail_に小さな分岐を追加。認証付きサーバー間POSTでQR送信を共用、添付複数・本文・From名・ReplyTo・送信元を保持。GitHub PRは未マージ、今回の本番差分はApps Script側が正本（GitHubとは未同期）。\n■バックアップ\nQR元9ファイル（appsscript.json、delivery_failures.html、DeliveryArchive.gs、DeliveryFailures.gs、DeliveryHistoryV2.gs、EdgeRosterSync.gs、MyQrApi.gs、PointManager.gs、コード.gs）、デプロイ一覧、表示確認可能なトリガー情報を退避。元トリガー所有者の詳細・実行間隔は権限上未取得。秘密値は非表示・配布ZIPに非収録。STEP配信元6ファイルはネイティブプロジェクト複製、変更前メインと差分も保存。ネイティブコピーはプロパティ／トリガーの複製ではない。\n■検証と実績\n無効状態で構文・設定・Webhook認証／未知ID拒否・既存Brevo8経路・写真・重複防止を確認。既存15テスト＋橋渡し5テスト成功、ステージングで不正キー・Gmail対象外・要求ID欠落の3拒否試験を確認。管理者YahooへQR2通とSTEP配信1通を少数送信し、実Webhookで配信完了。配信試験MessageID06ba4863-70ba-4839-8e2e-399163efa680はログ4116、20:23:39配信完了。実生徒のYahoo入退室も配信完了記録あり。一斉送信を検証前に有効化せず。\n■既存機能・トリガー\n入退室、講師勤怠、ポイント、写真／添付、Brevo、送信履歴、予約、授業連携、不達・管理者メール／LINE通知を維持。元のprocessCheckInMailQueue、archiveOldDeliveryHistoryScheduledは変更せず。reconcilePostmarkPilotDeliveries、reconcileMessageCenterPostmarkDeliveriesを5分ごとに追加（結果取得GETのみ）。\n■安全制御と復旧\n専用Webhookトークンと橋渡しキーはScript Properties。API秘密値をチャット・台帳・カードへ保存しない。RESERVED／ACCEPTED台帳と送信要求IDで重複防止。受付後の結果不明・失敗は自動Brevo再送しない。送信前の対象外／上限到達だけ既存Brevoへ戻る。永久・手動・spam停止を維持。過去保留分の一斉再送なし。POSTMARK_PILOT_ENABLED=false、POSTMARK_MC_ENABLED=falseで各新規Postmark経路を停止。受付済みの記録・試行カウンターは削除／リセットしない。コード復旧時も既存デプロイIDを維持。\n■契約・予算（2026-10-28 20:49〜20:52確認）\nFree Developer 100通／月、アカウント使用8・残92、次回更新2026-11-27。共有POSTMARK_PILOT_MAX_ATTEMPTSは20→90へ変更、ATTEMPTS_USED=8を維持、アプリ残82。累計上限で月次自動リセット未実装。変更前値はPOSTMARK_BUDGET_BACKUP_20261028に保存。上限到達後は新規対象がBrevoへ戻るため、契約変更だけでは上限は増えない。継続運用時に予算コードと上限を再調整する必要。\n■無料枠見積\n入退室ログ２／ログA6:Q4118を読取、テスト・ダミー・生徒番号1001を除外、G列Yahoo宛先を1通単位に集計。9月146通（QR131・STEP配信15）、10/1〜28は103通（QR79・STEP配信24）、9/29〜10/28の直近30日117通。相関ID重複なし。8月は宛先空欄が多いため比較に使わない。現在のペースは約110〜150通／月で100通超の可能性が高い。統計的確率は算出不可。Yahoo通知を全件継続するなら有料化候補。Basicは10,000通／月US$15、超過US$1.80/1,000通（当日管理画面表示、税等は契約時確認）。課金・プラン変更なし。通常連絡先mintcocoajasmine@gmail.com。",
  "仕様メモ": "累計90試行の上限は月ごとに自動リセットしない。Postmark契約の更新・有料化とアプリの送信予算は別管理。受付結果不明の台帳・カウンターはリセットしない。送信前に予算到達した新規分のみBrevoへ戻る。秘密値はScript Propertiesで管理し台帳に記載しない。",
  "確認日": "2026-10-28",
  "確認状況": "QR／STEP配信の有効化と実Webhook配信完了、既存URL維持、20→90試行への予算変更を確認。契約は無料100通で8通使用（当日20:49時点）。",
  "バックアップ場所": "QR導入前：https://chatgpt.com/library?file_id=libfile_ef5e31c5c798819198939edc1f2727d3&account_id=personal\nQR初期結果：https://chatgpt.com/library?file_id=libfile_1d1004be7d288191a9b7fccc5c608dd9&account_id=personal\nSTEP配信変更前：https://chatgpt.com/library?file_id=libfile_884e8797da848191af66874c3979d5d7&account_id=personal\n最終v96/v63差分：https://chatgpt.com/library?file_id=libfile_a72ab62bbdd881918ceb77992da9889c&account_id=personal\n配信のネイティブ複製：https://script.google.com/home/projects/1kiDzhEkrT3UA8Z_SpE3BQT9LBgWApx51SC6NrIN2GOpWBwjZRXlf-95O/edit",
  "確認済み事項": [
    "本番Postmark Liveサーバー21178320",
    "QR本番v96・STEP配信本番v63・既存URL維持",
    "既存15件＋橋渡し5件テスト",
    "管理者YahooでQR2通・STEP配信1通の配信完了",
    "契約無料100通・8使用・11月27日更新",
    "累計90試行・8使用・82残を確認",
    "秘密値を台帳・カードへ保存しない"
  ],
  "未確認項目": [
    "月次予算管理は未実装（現在は累計90試行）",
    "有料契約は未実施",
    "本番差分のstudent-QR／step-message-center GitHubへの同期は未実施"
  ]
};
  const updates = {
  "出退くんQR作成・読取": {
    "状態": "本番使用中（Apps Script v96・Yahoo通知Postmark・Brevo併用）",
    "Apps Scriptバージョン": "v96（2026-10-28）",
    "確認日": "2026-10-28",
    "概要": "生徒QRのYahoo宛て入退室通知をPostmarkへ切替。既存WebアプリURL・入退室・講師勤怠・ポイント・Brevo・写真・不達管理を維持。共有累計90試行。導入・復旧の詳細はPostmark運用記録。"
  },
  "STEP配信システム": {
    "状態": "本番使用中（Apps Script v63・Yahoo通知Postmark・Brevo併用）",
    "Apps Scriptバージョン": "v63（2026-10-28）",
    "確認日": "2026-10-28",
    "概要": "未到着連絡・特訓案内等の登録Yahoo宛てをPostmarkへ切替。既存WebアプリURL・添付・ReplyTo・送信履歴・予約配信・欠席更新・Brevoを維持。QRへ認証付き橋渡し。導入・復旧の詳細はPostmark運用記録。"
  },
  "不達メール管理": {
    "状態": "本番使用中（Apps Script v96・Postmark／Brevo共通不達管理）",
    "Apps Scriptバージョン": "v96（2026-10-28）",
    "確認日": "2026-10-28",
    "概要": "QR／STEP配信両方のPostmark配信結果を既存共通ログ・不達管理へ統合。Webhookと5分GET照合、Brevo・管理者メール・LINE通知・永久／手動停止・復旧判定を維持。"
  }
};
  const append = (old, text) => String(old || '').includes(text) ? old : [old, text].filter(Boolean).join('\n\n');
  function enrich(item) {
    if (item.ID === record.ID || item['システム名'] === record['システム名']) return Object.assign({}, item, record);
    const patch = updates[item['システム名'] || item['正式名称']];
    if (!patch) return item;
    return Object.assign({}, item, patch, {
      '作業メモ': append(item['作業メモ'], '2026-10-28：Postmark導入。本番QR v96／STEP配信v63、既存URL維持。詳細 ' + record['GitHubドキュメントURL']),
      'Postmark運用記録URL': record['GitHubドキュメントURL']
    });
  }
  const previousOrganize = organizeEntryImport;
  organizeEntryImport = function(items) {
    const list = previousOrganize(items).map(enrich);
    if (!list.some(item => item.ID === record.ID || item['システム名'] === record['システム名'])) list.unshift(Object.assign({}, record));
    return list;
  };
  const previousApply = applyAssetInfo;
  applyAssetInfo = function(item) { return enrich(previousApply(item)); };
})();
