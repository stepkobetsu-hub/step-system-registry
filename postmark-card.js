/* Postmark rollout record, 2026-10-28. Contains no credentials. */
(() => {
  const record = {
  "ID": "postmark-mail-service",
  "システム名": "Postmark導入・運用記録",
  "正式名称": "Postmark導入・運用記録",
  "分類": "システム資産台帳",
  "状態": "本番稼働中（有料・QR／STEP配信の全宛先通知）",
  "利用者": "管理者",
  "運用担当": "管理者",
  "概要": "Postmark Basic 10,000通／月・US$15の有料契約を確認。QR v97／STEP配信v64へ本番更新し、Yahoo・Gmail・携帯メール等の全宛先通知に対応。試験20／90通・Yahoo許可リストの制限を本番経路では使用しない。Gmail・Yahoo各1通の配信完了を共通ログで確認。",
  "利用者向けURL": "https://account.postmarkapp.com",
  "GitHub URL": "https://github.com/stepkobetsu-hub/step-system-registry",
  "GitHubドキュメントURL": "https://github.com/stepkobetsu-hub/step-system-registry/blob/main/docs/postmark-rollout-20261028.md",
  "GitHubドキュメント": "docs/postmark-rollout-20261028.md",
  "Apps Script編集URL": "https://script.google.com/home/projects/1ZFzVbJM15igFE7InsX1fu-FlNrYUY45vviozJP0k1uVXy_HvmGfseZ22/edit",
  "Apps ScriptプロジェクトID": "1ZFzVbJM15igFE7InsX1fu-FlNrYUY45vviozJP0k1uVXy_HvmGfseZ22",
  "Apps Scriptバージョン": "QR v97／STEP配信 v64（2026-10-29）",
  "Google Sheet URL": "https://docs.google.com/spreadsheets/d/1VyQ3O69PDArG2bJt_Qf347rlTwKfjqM6KPLDWqIPo6A/edit",
  "Google Sheet名": "入退室ログ２",
  "使用シート名": [
    "ログ",
    "メール送信キュー",
    "不達メール管理"
  ],
  "作業メモ": "■2026-10-29 有料・全宛先への本番移行\n契約：admin@educrest.jpの既存Postmarkアカウント、Basic 10,000通／月、US$15。契約画面Currentと2026-11-29更新を確認。\n生徒QR：本番v96→97（21:11 JST）、STEP配信：v63→64（21:35 JST）。各既存デプロイID・URLを維持。QRのPOSTMARK_PRODUCTION_ENABLED、配信のPOSTMARK_MC_PRODUCTION_ENABLEDをtrueに設定。QRの開始日時2026-10-29T12:09:40.470Z。Yahoo限定・既存許可リスト・累計試験上限を本番経路では使わず、全ドメインの新規生徒入退室・講師勤怠通知、QR送付、STEP配信の既存通知をPostmarkへ振り分ける。既存の恒久不達・迷惑報告・手動停止を保持。Brevoの契約・秘密値は削除していない。\n送信予約台帳を同じ入退室ログ２内の「Postmark送信台帳」に保存し、Script Propertiesの容量上限による累積停止を回避。既存の予約・受付済み記録は参照し続け、試行カウンターは削除・リセットしない。結果不明時に自動再送・Brevo切替はしない。切替前のキューと過去保留分は一斉再送しない。\n21:38に管理者Gmail・Yahooへ各1通送信。要求ID step-paid-production-test-20261029。Gmail MessageID 81e90074-ab78-4c51-9830-f987fe427080、Yahoo 8811cd2f-ed59-4642-92af-e91fcdc08958。21:42:07に共通ログ両件の配信完了・エラー空欄を確認。早期Webhookとログ追加の順序差で残る受付表示は既存GET照合で補完できた。13件のモックテスト合格。実生徒の入退室・ポイントを作らず、実在保護者への一斉テストも行っていない。\nアプリの月次10,000通停止は設けず、契約側の超過課金条件に従う。本番稼働に試験通数上限は適用しない。\n\n■以下は2026-10-28時点の導入履歴（無料・Yahoo限定の過去情報）\n■本番と送信範囲\n承認済みLiveサーバー21178320。QR登録Yahoo38件、STEP配信登録Yahoo11件。QRは2026-10-28 19:16、STEP配信は20:27に有効化。Yahoo以外と講師勤怠は既存Brevo。新規宛先はallowlist更新が必要。\nQR Apps Script：1ZFzVbJM15igFE7InsX1fu-FlNrYUY45vviozJP0k1uVXy_HvmGfseZ22／本番v96、旧v94→初回v95→連携v96。既存本番デプロイAKfycbw8L36Fj8SKtvNHQBi41FMqAPvDLGAdu1bbLxvd-78A8dFUOkWGnYRE-8PRNq7QZOl70wを維持。ステージングはv96。\nSTEP配信 Apps Script：1nrEhPSvPj9qyyF6buHjut_aGOEMiHmnKZ0N53rFaBNPdkaA3sBpBgek4／v62→v63。既存デプロイAKfycbxIH2VtgwRi50xduXgrkYrjD0yrzNfQ5vCWt1XgOzil6LZSgXNj6MJo9jPYvOkjNHduを維持。\n■取得・差分\n添付Code_Postmark.gs、DeliveryFailures_Postmark.gsとstudent-QR PR#50のPostmarkPilot.jsを確認。PRブランチcodex/postmark-yahoo-pilot／取得SHA84eafda29028f97b1f211b620307e159e6b2fcc8。QRにPostmarkPilot.gs追加、メインと不達処理を差分適用。STEP配信にPostmarkMessageCenter.gs追加、sendStepMail_に小さな分岐を追加。認証付きサーバー間POSTでQR送信を共用、添付複数・本文・From名・ReplyTo・送信元を保持。GitHub PRは未マージ、今回の本番差分はApps Script側が正本（GitHubとは未同期）。\n■バックアップ\nQR元9ファイル（appsscript.json、delivery_failures.html、DeliveryArchive.gs、DeliveryFailures.gs、DeliveryHistoryV2.gs、EdgeRosterSync.gs、MyQrApi.gs、PointManager.gs、コード.gs）、デプロイ一覧、表示確認可能なトリガー情報を退避。元トリガー所有者の詳細・実行間隔は権限上未取得。秘密値は非表示・配布ZIPに非収録。STEP配信元6ファイルはネイティブプロジェクト複製、変更前メインと差分も保存。ネイティブコピーはプロパティ／トリガーの複製ではない。\n■検証と実績\n無効状態で構文・設定・Webhook認証／未知ID拒否・既存Brevo8経路・写真・重複防止を確認。既存15テスト＋橋渡し5テスト成功、ステージングで不正キー・Gmail対象外・要求ID欠落の3拒否試験を確認。管理者YahooへQR2通とSTEP配信1通を少数送信し、実Webhookで配信完了。配信試験MessageID06ba4863-70ba-4839-8e2e-399163efa680はログ4116、20:23:39配信完了。実生徒のYahoo入退室も配信完了記録あり。一斉送信を検証前に有効化せず。\n■既存機能・トリガー\n入退室、講師勤怠、ポイント、写真／添付、Brevo、送信履歴、予約、授業連携、不達・管理者メール／LINE通知を維持。元のprocessCheckInMailQueue、archiveOldDeliveryHistoryScheduledは変更せず。reconcilePostmarkPilotDeliveries、reconcileMessageCenterPostmarkDeliveriesを5分ごとに追加（結果取得GETのみ）。\n■安全制御と復旧\n専用Webhookトークンと橋渡しキーはScript Properties。API秘密値をチャット・台帳・カードへ保存しない。RESERVED／ACCEPTED台帳と送信要求IDで重複防止。受付後の結果不明・失敗は自動Brevo再送しない。送信前の対象外／上限到達だけ既存Brevoへ戻る。永久・手動・spam停止を維持。過去保留分の一斉再送なし。POSTMARK_PILOT_ENABLED=false、POSTMARK_MC_ENABLED=falseで各新規Postmark経路を停止。受付済みの記録・試行カウンターは削除／リセットしない。コード復旧時も既存デプロイIDを維持。\n■契約・予算（2026-10-28 20:49〜20:52確認）\nFree Developer 100通／月、アカウント使用8・残92、次回更新2026-11-27。共有POSTMARK_PILOT_MAX_ATTEMPTSは20→90へ変更、ATTEMPTS_USED=8を維持、アプリ残82。累計上限で月次自動リセット未実装。変更前値はPOSTMARK_BUDGET_BACKUP_20261028に保存。上限到達後は新規対象がBrevoへ戻るため、契約変更だけでは上限は増えない。継続運用時に予算コードと上限を再調整する必要。\n■無料枠見積\n入退室ログ２／ログA6:Q4118を読取、テスト・ダミー・生徒番号1001を除外、G列Yahoo宛先を1通単位に集計。9月146通（QR131・STEP配信15）、10/1〜28は103通（QR79・STEP配信24）、9/29〜10/28の直近30日117通。相関ID重複なし。8月は宛先空欄が多いため比較に使わない。現在のペースは約110〜150通／月で100通超の可能性が高い。統計的確率は算出不可。Yahoo通知を全件継続するなら有料化候補。Basicは10,000通／月US$15、超過US$1.80/1,000通（当日管理画面表示、税等は契約時確認）。課金・プラン変更なし。通常連絡先mintcocoajasmine@gmail.com。",
  "仕様メモ": "現在の本番は有料全宛先モード。POSTMARK_PRODUCTION_ENABLED=true、POSTMARK_MC_PRODUCTION_ENABLED=true。送信予約の永続台帳は入退室ログ２／Postmark送信台帳。従来の試験カウンターは履歴として保持し、本番制限に使わない。二重送信を避けるため受付結果不明時に別業者へ自動再送しない。切替前の過去保留分の一斉再送なし。APIトークン・連携キーは既存のScript Propertiesで管理。",
  "確認日": "2026-10-29",
  "確認状況": "有料契約、QR v97／STEP配信v64の本番公開・既存URL維持、全宛先有効化、管理者Gmail・Yahooへの配信完了を確認。13件のモックテスト合格。",
  "バックアップ場所": "QR導入前：https://chatgpt.com/library?file_id=libfile_ef5e31c5c798819198939edc1f2727d3&account_id=personal\nQR初期結果：https://chatgpt.com/library?file_id=libfile_1d1004be7d288191a9b7fccc5c608dd9&account_id=personal\nSTEP配信変更前：https://chatgpt.com/library?file_id=libfile_884e8797da848191af66874c3979d5d7&account_id=personal\n最終v96/v63差分：https://chatgpt.com/library?file_id=libfile_a72ab62bbdd881918ceb77992da9889c&account_id=personal\n配信のネイティブ複製：https://script.google.com/home/projects/1kiDzhEkrT3UA8Z_SpE3BQT9LBgWApx51SC6NrIN2GOpWBwjZRXlf-95O/edit",
  "確認済み事項": [
    "有料Basic 10,000通／月・US$15・次回11月29日",
    "QR v97／STEP配信v64・既存本番URL維持",
    "全ドメインの新規通知・講師勤怠・QR送付対応",
    "試験上限・Yahoo許可リスト制限を本番経路で解除",
    "永続送信台帳で二重送信防止・過去予約保持",
    "Gmail・Yahoo各1通のPostmark受付と共通ログ配信完了",
    "モック13件合格・秘密値非公開"
  ],
  "未確認項目": [
    "実際のQR端末による切替後の次回入退室通知（管理者テストでは実生徒記録・ポイントを作成しない）",
    "本番差分のstudent-QR／step-message-center主ブランチへの同期は未実施"
  ]
};
  const updates = {
  "出退くんQR作成・読取": {
    "状態": "本番使用中（Apps Script v97・全宛先通知Postmark）",
    "Apps Scriptバージョン": "v97（2026-10-29）",
    "確認日": "2026-10-29",
    "概要": "生徒入退室・講師勤怠・QR送付の全宛先通知を有料Postmarkへ統一。試験通数・Yahoo限定を解除。既存URL・入退室・ポイント・写真・不達管理を維持。詳細はPostmark運用記録。"
  },
  "STEP配信システム": {
    "状態": "本番使用中（Apps Script v64・全宛先通知Postmark）",
    "Apps Scriptバージョン": "v64（2026-10-29）",
    "確認日": "2026-10-29",
    "概要": "未到着連絡・特訓案内など既存の通知を全宛先Postmarkへ統一。既存URL・添付・返信先・送信履歴・予約配信を維持。管理者Gmail・Yahoo両方の配信完了を確認。"
  },
  "不達メール管理": {
    "状態": "本番使用中（Apps Script v97・Postmark／既存Brevo履歴を共通管理）",
    "Apps Scriptバージョン": "v97（2026-10-29）",
    "確認日": "2026-10-29",
    "概要": "全宛先Postmarkの配信結果を既存ログ・不達管理へ統合。WebhookとGET照合・永久／手動停止を維持。過去Brevo履歴は保持。"
  }
};
  const append = (old, text) => String(old || '').includes(text) ? old : [old, text].filter(Boolean).join('\n\n');
  function enrich(item) {
    if (item.ID === record.ID || item['システム名'] === record['システム名']) return Object.assign({}, item, record);
    const patch = updates[item['システム名'] || item['正式名称']];
    if (!patch) return item;
    return Object.assign({}, item, patch, {
      '作業メモ': append(item['作業メモ'], '2026-10-29：有料Postmarkへ全宛先通知を統一。本番QR v97／STEP配信v64、既存URL維持。Gmail・Yahoo配信完了を確認。詳細 ' + record['GitHubドキュメントURL']),
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
