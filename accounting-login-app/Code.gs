const SHEET_NAME = '経理ログイン管理';
const COLS = 11;
const DEFAULT_SPREADSHEET_ID = '1RvxEOW2HFrWO32GikDeRWRbMhH9IyA0VdVtNb2G9Rdw';

function setupSpreadsheet() {
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', DEFAULT_SPREADSHEET_ID);
  const ss = SpreadsheetApp.openById(DEFAULT_SPREADSHEET_ID);
  return ss.getUrl();
}

function doGet() {
  // This page has no server-side scriptlets. Serve its JavaScript unchanged.
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('経理ログイン管理')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getAppData() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
  const ss = getSpreadsheet_();
  const sheet = getSheet_(ss);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { entries: [], sheetUrl: ss.getUrl() };

  const range = sheet.getRange(2, 1, lastRow - 1, COLS);
  const values = range.getDisplayValues();
  const ids = values.map(r => [r[9]]);
  let idsChanged = false;

  const seen = new Set();
  const entries = values.map((r, i) => {
    const meaningful = [r[0], r[1], r[3], r[4], r[8]].some(Boolean);
    if (!meaningful) return null;
    if (!r[9] || seen.has(r[9])) {
      r[9] = makeId_();
      ids[i][0] = r[9];
      idsChanged = true;
    }
    seen.add(r[9]);
    return rowToEntry_(r);
  }).filter(Boolean);

  if (idsChanged) sheet.getRange(2, 10, ids.length, 1).setValues(ids);
  return { entries, sheetUrl: ss.getUrl() };
  } finally {
    SpreadsheetApp.flush();
    lock.releaseLock();
  }
}

function saveEntry(payload) {
  const item = normalizeEntry_(payload || {});
  if (!item.serviceName) throw new Error('サービス名を入力してください。');
  validateUrl_(item.url, 'URL');
  validateUrl_(item.logoUrl, 'ロゴURL');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = getSpreadsheet_();
    const sheet = getSheet_(ss);
    let row = item.id ? findRowById_(sheet, item.id) : 0;
    if (item.id && !row) throw new Error('この項目は削除されています。再読み込みしてください。');
    if (row) checkRevision_(sheet, row, payload.revision);
    const isNew = !row;
    if (isNew) {
      row = Math.max(sheet.getLastRow() + 1, 2);
      item.id = makeId_();
      prepareNewRow_(sheet, row);
    }
    writeRow_(sheet, row, item);
    SpreadsheetApp.flush();
    return { ok: true, entry: rowToEntry_(sheet.getRange(row, 1, 1, COLS).getDisplayValues()[0]) };
  } finally {
    lock.releaseLock();
  }
}

function deleteEntry(id, revision) {
  id = clean_(id, 100);
  if (!id) throw new Error('管理IDがありません。');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_(getSpreadsheet_());
    const row = findRowById_(sheet, id);
    if (!row) throw new Error('対象データが見つかりません。再読み込みしてください。');
    checkRevision_(sheet, row, revision);
    sheet.deleteRow(row);
    SpreadsheetApp.flush();
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || DEFAULT_SPREADSHEET_ID;
  return SpreadsheetApp.openById(id);
}

function getSheet_(ss) {
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('シート「' + SHEET_NAME + '」が見つかりません。');
  return sheet;
}

function rowToEntry_(r) {
  return {
    revision: revision_(r),
    category: r[0] || '',
    serviceName: r[1] || '',
    url: r[3] || '',
    account: r[4] || '',
    passwordManager: r[5] || '',
    accountTitle: r[6] || '',
    amountNote: r[7] || '',
    memo: r[8] || '',
    id: r[9] || '',
    logoUrl: r[10] || ''
  };
}

function revision_(row) {
  const data = JSON.stringify(row.slice(0, COLS).map(String));
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, data));
}

function checkRevision_(sheet, row, revision) {
  const current = sheet.getRange(row, 1, 1, COLS).getDisplayValues()[0];
  if (!revision || revision !== revision_(current)) {
    throw new Error('別の画面またはシートで更新されています。再読み込みしてから編集してください。');
  }
}

function normalizeEntry_(p) {
  return {
    category: clean_(p.category, 80) || 'その他',
    serviceName: clean_(p.serviceName, 200),
    url: clean_(p.url, 1500),
    account: clean_(p.account, 500),
    passwordManager: clean_(p.passwordManager, 100) || 'Google Password Manager',
    accountTitle: clean_(p.accountTitle, 200),
    amountNote: clean_(p.amountNote, 500),
    memo: clean_(p.memo, 2000),
    id: clean_(p.id, 100),
    logoUrl: clean_(p.logoUrl, 1500)
  };
}

function clean_(value, maxLen) {
  return String(value == null ? '' : value).trim().slice(0, maxLen || 2000);
}

function validateUrl_(value, label) {
  if (!value) return;
  if (!/^https?:\/\//i.test(value)) throw new Error(label + 'は http:// または https:// で始めてください。');
}

function findRowById_(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const match = sheet.getRange(2, 10, lastRow - 1, 1)
    .createTextFinder(id)
    .matchEntireCell(true)
    .findNext();
  return match ? match.getRow() : 0;
}

function prepareNewRow_(sheet, row) {
  if (row > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), row - sheet.getMaxRows());
  const source = sheet.getRange(2, 1, 1, COLS);
  const target = sheet.getRange(row, 1, 1, COLS);
  source.copyTo(target, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
  source.copyTo(target, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);
}

function writeRow_(sheet, row, item) {
  const values = [[
    item.category,
    item.serviceName,
    '',
    item.url,
    item.account,
    item.passwordManager,
    item.accountTitle,
    item.amountNote,
    item.memo,
    item.id,
    item.logoUrl
  ]];
  // Sheets treats leading '=' as a formula. Store user text literally and preserve ID zeros.
  sheet.getRange(row, 5).setNumberFormat('@');
  sheet.getRange(row, 1, 1, COLS).setValues(values.map(r => r.map(v => /^[=+\-@']/.test(v) ? "'" + v : v)));
  const openCell = sheet.getRange(row, 3);
  if (item.url) {
    openCell.setFormula('=HYPERLINK(D' + row + ',"開く")');
  } else if (item.passwordManager === 'Gmail') {
    openCell.setValue('メール確認');
  } else {
    openCell.clearContent();
  }
}

function makeId_() {
  return 'ACC-' + Utilities.getUuid().replace(/-/g, '').slice(0, 10).toUpperCase();
}
