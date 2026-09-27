const SHEET_NAME = '経理ログイン管理';
const COLS = 12;
const DEFAULT_SPREADSHEET_ID = '1RvxEOW2HFrWO32GikDeRWRbMhH9IyA0VdVtNb2G9Rdw';
const SECRET_PREFIX = 'ACCOUNTING_SECRET_';
const APP_VERSION = '2026-09-27-admin-id-login';

const FAVICON_SOURCE_URL =
  'https://stepkobetsu-hub.github.io/step-system-registry/images/accounting-login-favicon-v2.png';

const FAVICON_FILE_ID_KEY = 'ACCOUNTING_FAVICON_DRIVE_FILE_ID';



const ADMIN_SPREADSHEET_ID = '1L5aFDXAmfUDkBg8d7X3WqJgMhdMq5tM5sfUZ2G-M58E';
const ADMIN_SHEET_ID = 2020620808;
const ADMIN_SESSION_PREFIX = 'ACCOUNTING_ADMIN_SESSION_V2_';
const ADMIN_SALT_KEY = 'ACCOUNTING_ADMIN_AUTH_SALT';

// The web app executes as its owner. The master is never sent to the client.
function getAdminRecord_(adminId) {
  const sheet = SpreadsheetApp.openById(ADMIN_SPREADSHEET_ID).getSheetById(ADMIN_SHEET_ID);
  if (!sheet) throw new Error('ログイン台帳を確認できません。管理者に連絡してください。');
  const count = sheet.getLastRow();
  if (!count) return null;
  const ids = sheet.getRange(1, 1, count, 1).getDisplayValues();
  const matches = [];
  ids.forEach((row, index) => { if (String(row[0]).trim() === adminId) matches.push(index + 1); });
  if (matches.length !== 1) return null;
  const values = sheet.getRange(matches[0], 36, 1, 2).getDisplayValues()[0];
  const level = Number(String(values[1]).trim());
  return {id: adminId, password: String(values[0] || ''), level};
}
function eligibleAdmin_(record) {
  return !!record && !!record.password && Number.isFinite(record.level) && record.level >= 2;
}
function authDigest_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value)
    .map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
}
function equalDigest_(a, b) {
  let difference = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) difference |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return difference === 0;
}
function credentialFingerprint_(record) {
  const props = PropertiesService.getScriptProperties();
  let salt = props.getProperty(ADMIN_SALT_KEY);
  if (!salt) {
    salt = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty(ADMIN_SALT_KEY, salt);
  }
  return authDigest_(JSON.stringify([salt, record.id, record.password]));
}
function appSessionKey_(token) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    throw new Error('APP_SESSION_REQUIRED: ログインしてください。');
  }
  return ADMIN_SESSION_PREFIX + authDigest_(token);
}
function requireAppSession_(token) {
  const props = PropertiesService.getScriptProperties();
  const key = appSessionKey_(token);
  const stored = props.getProperty(key);
  let session;
  try { session = stored ? JSON.parse(stored) : null; } catch (_) {}
  if (!session || !session.adminId) throw new Error('APP_SESSION_REQUIRED: ログインしてください。');
  const record = getAdminRecord_(session.adminId);
  if (!eligibleAdmin_(record) || !equalDigest_(credentialFingerprint_(record), session.credentialFingerprint || '')) {
    props.deleteProperty(key);
    throw new Error('APP_SESSION_REQUIRED: ログイン情報または利用権限が変更されました。');
  }
  return record.id;
}
function loginApp(adminId, password) {
  const invalid = '管理者IDまたはパスワードが正しくないか、利用権限がありません。';
  if (typeof adminId !== 'string' || typeof password !== 'string' || !adminId.trim() || adminId.length > 200 || !password || password.length > 512) {
    throw new Error(invalid);
  }
  adminId = adminId.trim();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const cache = CacheService.getScriptCache();
    const failureKey = 'ACCOUNTING_LOGIN_FAILURE_' + authDigest_(adminId);
    const globalKey = 'ACCOUNTING_LOGIN_FAILURE_GLOBAL';
    const failures = Number(cache.get(failureKey) || 0);
    const totalFailures = Number(cache.get(globalKey) || 0);
    if (failures >= 8 || totalFailures >= 200) {
      throw new Error('ログインの試行回数が多いため、10分ほど待ってからお試しください。');
    }
    const record = getAdminRecord_(adminId);
    const passwordMatches = equalDigest_(authDigest_(password), authDigest_(record ? record.password : ''));
    if (!eligibleAdmin_(record) || !passwordMatches) {
      cache.put(failureKey, String(failures + 1), 600);
      cache.put(globalKey, String(totalFailures + 1), 600);
      throw new Error(invalid);
    }
    cache.remove(failureKey);
    const token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').toLowerCase();
    PropertiesService.getScriptProperties().setProperty(appSessionKey_(token), JSON.stringify({
      adminId: record.id, credentialFingerprint: credentialFingerprint_(record), createdAt: new Date().toISOString()
    }));
    return {token, adminId: record.id};
  } finally { lock.releaseLock(); }
}
function logoutApp(token) {
  PropertiesService.getScriptProperties().deleteProperty(appSessionKey_(token));
  return {ok: true};
}

function getFaviconUrl_() {
  const props = PropertiesService.getScriptProperties();
  let fileId = props.getProperty(FAVICON_FILE_ID_KEY);

  if (!fileId) {
    const response = UrlFetchApp.fetch(FAVICON_SOURCE_URL);
    const blob = response.getBlob().setName('accounting-login-favicon.png');

    const file = DriveApp.createFile(blob);
    file.setSharing(
      DriveApp.Access.ANYONE_WITH_LINK,
      DriveApp.Permission.VIEW
    );

    fileId = file.getId();
    props.setProperty(FAVICON_FILE_ID_KEY, fileId);
  }

  return 'https://drive.google.com/uc?id=' + encodeURIComponent(fileId) + '&export=download&format=png';
}

function setupSpreadsheet_() {
  PropertiesService.getScriptProperties()
    .setProperty('SPREADSHEET_ID', DEFAULT_SPREADSHEET_ID);

  return SpreadsheetApp
    .openById(DEFAULT_SPREADSHEET_ID)
    .getUrl();
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('経理ログイン管理')
    .setFaviconUrl(getFaviconUrl_())
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
function getAppData(sessionToken) {
  const adminId = requireAppSession_(sessionToken);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = getSpreadsheet_();
    const sheet = getSheet_(ss);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { entries: [], sheetUrl: ss.getUrl(), version: APP_VERSION, adminId };

    ensureOrderHeader_(sheet);
    const values = sheet.getRange(2, 1, lastRow - 1, COLS).getDisplayValues();
    const ids = values.map(r => [r[9]]);
    const orders = values.map(r => [r[11]]);
    const props = PropertiesService.getUserProperties().getProperties();
    const seen = new Set();
    let idsChanged = false;
    let ordersChanged = false;
    let nextOrder = values.reduce((max, r) => Math.max(max, parseOrder_(r[11])), 0) + 1;

    const entries = values.map((r, i) => {
      const meaningful = [r[0], r[1], r[3], r[4], r[8]].some(Boolean);
      if (!meaningful) return null;

      if (!r[9] || seen.has(r[9])) {
        r[9] = makeId_();
        ids[i][0] = r[9];
        idsChanged = true;
      }
      seen.add(r[9]);

      const parsed = parseOrder_(r[11]);
      if (!parsed) {
        r[11] = String(nextOrder);
        orders[i][0] = nextOrder;
        ordersChanged = true;
      }
      nextOrder = Math.max(nextOrder, parseOrder_(r[11]) + 1);

      const entry = rowToEntry_(r);
      entry.hasPassword = Object.prototype.hasOwnProperty.call(props, secretKey_(entry.id));
      entry._sheetRow = i + 2;
      return entry;
    }).filter(Boolean);

    if (idsChanged) sheet.getRange(2, 10, ids.length, 1).setValues(ids);
    if (ordersChanged) sheet.getRange(2, 12, orders.length, 1).setValues(orders);

    entries.sort((a, b) => (a.sortOrder - b.sortOrder) || (a._sheetRow - b._sheetRow));
    entries.forEach(e => delete e._sheetRow);
    return { entries, sheetUrl: ss.getUrl(), version: APP_VERSION, adminId };
  } finally {
    SpreadsheetApp.flush();
    lock.releaseLock();
  }
}

function saveEntry(payload, sessionToken) {
  requireAppSession_(sessionToken);
  payload = payload || {};
  const item = normalizeEntry_(payload);
  if (!item.serviceName) throw new Error('サービス名を入力してください。');
  validateUrl_(item.url, 'URL');
  validateUrl_(item.logoUrl, 'ロゴURL');

  const passwordAction = clean_(payload.passwordAction, 20) || 'keep';
  if (!['keep', 'set', 'clear'].includes(passwordAction)) throw new Error('パスワード操作が不正です。');
  const password = String(payload.password == null ? '' : payload.password);
  if (passwordAction === 'set' && !password) throw new Error('パスワードを入力してください。');
  if (password.length > 500) throw new Error('パスワードが長すぎます。');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = getSpreadsheet_();
    const sheet = getSheet_(ss);
    ensureOrderHeader_(sheet);
    let row = item.id ? findRowById_(sheet, item.id) : 0;
    if (item.id && !row) throw new Error('この項目は削除されています。再読み込みしてください。');

    if (row) {
      checkRevision_(sheet, row, payload.revision);
      const current = sheet.getRange(row, 1, 1, COLS).getDisplayValues()[0];
      item.sortOrder = parseOrder_(current[11]) || nextSortOrder_(sheet);
    } else {
      row = Math.max(sheet.getLastRow() + 1, 2);
      item.id = makeId_();
      item.sortOrder = nextSortOrder_(sheet);
      prepareNewRow_(sheet, row);
    }

    if (passwordAction === 'set') item.passwordManager = 'アプリ内保存';
    writeRow_(sheet, row, item);
    updateSecret_(item.id, passwordAction, password);
    SpreadsheetApp.flush();

    const entry = rowToEntry_(sheet.getRange(row, 1, 1, COLS).getDisplayValues()[0]);
    entry.hasPassword = hasSecret_(entry.id);
    return { ok: true, entry };
  } finally {
    lock.releaseLock();
  }
}

function saveCardOrder(ids, expectedIds, sessionToken) {
  requireAppSession_(sessionToken);
  if (!Array.isArray(ids) || !ids.length) throw new Error('並べ替えデータがありません。');
  ids = ids.map(id => clean_(id, 100)).filter(Boolean);
  if (new Set(ids).size !== ids.length) throw new Error('並べ替えデータが重複しています。');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_(getSpreadsheet_());
    ensureOrderHeader_(sheet);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { ok: true };

    const rows = sheet.getRange(2, 1, lastRow - 1, COLS).getDisplayValues();
    const idToRow = new Map();
    rows.forEach((r, i) => {
      const meaningful = [r[0], r[1], r[3], r[4], r[8]].some(Boolean);
      if (meaningful && r[9]) idToRow.set(r[9], i + 2);
    });

    if (idToRow.size !== ids.length || ids.some(id => !idToRow.has(id))) {
      throw new Error('別の画面で項目が追加・削除されています。再読み込みしてから並べ替えてください。');
    }

    const currentIds = rows.map((r,i) => ({id:r[9], order:parseOrder_(r[11]) || 999999, row:i}))
      .filter(x=>idToRow.has(x.id)).sort((a,b)=>a.order-b.order || a.row-b.row).map(x=>x.id);
    if (!Array.isArray(expectedIds) || JSON.stringify(currentIds) !== JSON.stringify(expectedIds)) {
      throw new Error('別の画面で並び順が更新されています。再読み込みしてください。');
    }

    const nextOrders = rows.map(r => [parseOrder_(r[11]) || '']);
    ids.forEach((id, index) => { nextOrders[idToRow.get(id) - 2][0] = index + 1; });
    sheet.getRange(2, 12, nextOrders.length, 1).setValues(nextOrders);
    SpreadsheetApp.flush();
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function getPassword(id, sessionToken) {
  requireAppSession_(sessionToken);
  id = clean_(id, 100);
  if (!id) throw new Error('管理IDがありません。');
  const sheet = getSheet_(getSpreadsheet_());
  if (!findRowById_(sheet, id)) throw new Error('対象データが見つかりません。');
  const value = PropertiesService.getUserProperties().getProperty(secretKey_(id));
  if (value === null) return { ok: true, hasPassword: false, password: '' };
  return { ok: true, hasPassword: true, password: value };
}

function clearPassword(id, sessionToken) {
  requireAppSession_(sessionToken);
  id = clean_(id, 100);
  if (!id) throw new Error('管理IDがありません。');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_(getSpreadsheet_());
    if (!findRowById_(sheet, id)) throw new Error('対象データが見つかりません。');
    PropertiesService.getUserProperties().deleteProperty(secretKey_(id));
    return { ok: true };
  } finally { lock.releaseLock(); }
}

function deleteEntry(id, revision, sessionToken) {
  requireAppSession_(sessionToken);
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
    PropertiesService.getUserProperties().deleteProperty(secretKey_(id));
    compactSortOrders_(sheet);
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
    logoUrl: r[10] || '',
    sortOrder: parseOrder_(r[11]) || 999999
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
    passwordManager: clean_(p.passwordManager, 100) || 'アプリ内保存',
    accountTitle: clean_(p.accountTitle, 200),
    amountNote: clean_(p.amountNote, 500),
    memo: clean_(p.memo, 2000),
    id: clean_(p.id, 100),
    logoUrl: clean_(p.logoUrl, 1500),
    sortOrder: parseOrder_(p.sortOrder)
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
    item.logoUrl,
    item.sortOrder || nextSortOrder_(sheet)
  ]];
  sheet.getRange(row, 5).setNumberFormat('@');
  sheet.getRange(row, 1, 1, COLS).setValues(values.map(r => r.map(v => typeof v === 'string' && /^[=+\-@']/.test(v) ? "'" + v : v)));
  const openCell = sheet.getRange(row, 3);
  if (item.url) {
    openCell.setFormula('=HYPERLINK(D' + row + ',"開く")');
  } else if (item.passwordManager === 'Gmail') {
    openCell.setValue('メール確認');
  } else {
    openCell.clearContent();
  }
}

function ensureOrderHeader_(sheet) {
  if (sheet.getRange(1, 12).getDisplayValue() !== '表示順') sheet.getRange(1, 12).setValue('表示順');
}

function nextSortOrder_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 1;
  const values = sheet.getRange(2, 12, lastRow - 1, 1).getDisplayValues();
  return values.reduce((max, r) => Math.max(max, parseOrder_(r[0])), 0) + 1;
}

function compactSortOrders_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  const rows = sheet.getRange(2, 1, lastRow - 1, COLS).getDisplayValues();
  const items = rows.map((r, i) => ({ row: i + 2, id: r[9], order: parseOrder_(r[11]), meaningful: [r[0], r[1], r[3], r[4], r[8]].some(Boolean) }))
    .filter(x => x.meaningful)
    .sort((a, b) => (a.order || 999999) - (b.order || 999999) || a.row - b.row);
  items.forEach((item, index) => sheet.getRange(item.row, 12).setValue(index + 1));
}

function parseOrder_(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function updateSecret_(id, action, password) {
  const props = PropertiesService.getUserProperties();
  if (action === 'set') props.setProperty(secretKey_(id), password);
  if (action === 'clear') props.deleteProperty(secretKey_(id));
}

function hasSecret_(id) {
  return PropertiesService.getUserProperties().getProperty(secretKey_(id)) !== null;
}

function secretKey_(id) {
  return SECRET_PREFIX + id;
}

function makeId_() {
  return 'ACC-' + Utilities.getUuid().replace(/-/g, '').slice(0, 10).toUpperCase();
}
