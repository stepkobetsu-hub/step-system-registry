/* CamScanner card and an explicit chat handoff. No background copy is claimed. */
(() => {
  'use strict';
  const source = 'https://www.camscanner.com/file/recent';
  const destination = 'https://drive.google.com/drive/folders/1ghAxiQ4uObE3DoEJsTJCNL9KzL1j_ADJ';
  const conversation = 'https://chatgpt.com/c/6ae036e6-04b8-83e8-990a-1ee91065a142';
  const record = {
    ID: 'camscanner-drive-copy',
    'システム名': 'CamScanner → Google Drive コピー',
    '正式名称': 'CamScanner → Google Drive コピー',
    '分類': '管理・運営',
    '状態': '要確認（自動コピー未稼働）',
    '利用者': '塾長・管理者',
    '概要': 'CamScanner Web版の書類とGoogle Driveの保存先を開く入口。今すぐコピーしたい場合は、このカードからChatGPTへ依頼できます。自動コピーは未稼働です。',
    '利用者向けURL': source,
    '管理者向けURL': destination,
    'DriveフォルダURL': destination,
    'GitHubドキュメントURL': 'https://github.com/stepkobetsu-hub/step-system-registry/blob/main/docs/camscanner-drive-copy.md',
    '保存基盤': '原本：CamScanner Cloud／コピー先：指定Google Driveフォルダー',
    '更新方法': '「今すぐコピーを依頼」で依頼文を表示。コピーして既存チャットへ貼り付け、送信する。ボタン自体はPDF取得・Drive保存を実行しない。',
    '仕様メモ': 'Web版からのPDF取得とDrive保存を目的とする。ChatGPTの定期実行からログイン済みChromeを操作できず、初回コピー検証は未実施。動かない定期タスクは停止済み。専用PC処理と直接実行APIは未接続。',
    '確認状況': '手動アップロードは利用者確認済み。自動コピーとワンクリック実行は未確認・未実装。',
    '確認日': '2026-10-27',
    '未確認項目': ['自動コピーの初回成功', 'コピー済みIDの永続記録と重複防止', '認証付き今すぐ実行API'],
    '作業メモ': '2026-10-27：Web版一覧を確認。定期処理でBrowser操作機能を利用できず停止。台帳カード、元の一覧、保存先、依頼文をコピーして既存チャットを開く導線を追加。個別書類名・内容・認証情報は公開台帳へ記載しない。'
  };
  CARD_ANCHORS.unshift(['CamScanner', 'camscanner-drive-copy']);
  const previousOrganize = organizeEntryImport;
  organizeEntryImport = function(items) {
    const list = previousOrganize(items);
    const index = list.findIndex(item => item.ID === record.ID || item['システム名'] === record['システム名']);
    if (index < 0) list.push({...record});
    else list[index] = {...list[index], ...record};
    return list;
  };
  const previousApply = applyAssetInfo;
  applyAssetInfo = function(item) {
    const result = previousApply(item);
    return item.ID === record.ID || item['システム名'] === record['システム名'] ? {...result, ...record} : result;
  };
  const previousLabel = linkLabel;
  linkLabel = function(item, field, fallback) {
    if (item.ID === record.ID) {
      if (field === '利用者向けURL') return 'CamScannerの新着を開く';
      if (field === '管理者向けURL') return 'Google Driveの保存先を開く';
    }
    return previousLabel(item, field, fallback);
  };
  const request = 'CamScanner Web版 ' + source + ' の新着を確認し、Google Driveの指定フォルダー ' + destination +
    ' に未保存の書類をPDFでコピーしてください。まず候補と保存済みを照合して重複を防ぎ、元ファイル名を保ち、原本を削除せず、実際に保存を確認できたファイルのリンクを報告してください。接続できない場合は成功扱いにせず理由を知らせてください。';
  function openRequest() {
    let dialog = document.getElementById('camscannerRequestDialog');
    if (!dialog) {
      dialog = el('dialog', 'usage-dialog');
      dialog.id = 'camscannerRequestDialog';
      dialog.setAttribute('aria-labelledby', 'camscannerRequestTitle');
      const content = el('div', 'usage-content');
      const head = el('div', 'usage-head');
      const title = el('h2', '', '今すぐコピーを依頼');
      title.id = 'camscannerRequestTitle';
      const close = el('button', 'btn', '閉じる');
      close.type = 'button';
      close.addEventListener('click', () => dialog.close());
      head.append(title, close);
      content.append(head, el('p', '', '下の依頼文をコピーしてチャットを開き、貼り付けて送信してください。ここではコピー処理を実行しません。'));
      const text = el('textarea', 'generated-text');
      text.readOnly = true;
      text.value = request;
      text.setAttribute('aria-label', 'ChatGPTへのコピー依頼文');
      const status = el('p', 'meta');
      status.setAttribute('role', 'status');
      const actions = el('div', 'usage-actions');
      actions.style.flexWrap = 'wrap';
      actions.style.gap = '8px';
      const copy = el('button', 'open', '依頼文をコピー');
      copy.type = 'button';
      copy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(request);
          status.textContent = '依頼文をコピーしました。チャットへ貼り付けて送信してください。';
        } catch {
          text.focus();
          text.select();
          status.textContent = '自動コピーできませんでした。選択した依頼文を手動でコピーしてください。';
        }
      });
      const chat = el('a', 'open', 'チャットを開く');
      chat.href = conversation;
      chat.target = '_blank';
      chat.rel = 'noopener noreferrer';
      actions.append(copy, chat);
      content.append(text, status, actions);
      dialog.append(content);
      document.body.append(dialog);
    }
    dialog.showModal();
  }
  const previousDaily = appendDailyLinks;
  appendDailyLinks = function(item, article) {
    previousDaily(item, article);
    if (item.ID !== record.ID) return;
    const section = article.querySelector('.daily-links');
    if (!section) return;
    const button = el('button', 'open', '今すぐコピーを依頼');
    button.type = 'button';
    button.style.background = '#147d4d';
    button.addEventListener('click', openRequest);
    section.append(button, el('p', 'technical-note', '自動コピー：未稼働。上のボタンは依頼文を用意します。チャットで貼り付け・送信が必要です。'));
  };
})();
