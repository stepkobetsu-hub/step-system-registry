const SHEET_NAME = '経理ログイン管理';
const COLS = 12;
const DEFAULT_SPREADSHEET_ID = '1RvxEOW2HFrWO32GikDeRWRbMhH9IyA0VdVtNb2G9Rdw';
const SECRET_PREFIX = 'ACCOUNTING_SECRET_';
const APP_VERSION = '2026-10-29-save-conflict-sync-v1';
const APP_DATA_CACHE_KEY = 'ACCOUNTING_APP_DATA_V2';
const CENTRAL_PERMISSION_CACHE_PREFIX = 'ACCOUNTING_PERMISSION_V1_';
const ACCOUNTING_DATA_RUNTIME_URL = 'https://wisedgcgwaebtkprdhth.supabase.co/functions/v1/accounting-data-runtime-v1';
const ACCOUNTING_MIRROR_DIRTY_KEY = 'ACCOUNTING_MIRROR_DIRTY_V1';
const ACCOUNTING_SESSION_RECHECK_MS = 180000;

const FAVICON_SOURCE_URL =
  'https://stepkobetsu-hub.github.io/step-system-registry/images/accounting-calculator-yen-v3.png';

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
  // Search on the Sheets service instead of transferring the entire ID column.
  const matches = sheet.getRange(1, 1, count, 1)
    .createTextFinder(adminId).matchEntireCell(true).matchCase(true).findAll();
  if (matches.length !== 1) return null;
  const values = sheet.getRange(matches[0].getRow(), 36, 1, 2).getDisplayValues()[0];
  const level = Number(String(values[1]).trim());
  return {id: adminId, password: String(values[0] || ''), level};
}
function eligibleAdmin_(record) {
  return !!record && !!record.password && Number.isFinite(record.level) && record.level >= 1;
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
function verifyAppSession_(token) {
  const props = PropertiesService.getScriptProperties();
  const key = appSessionKey_(token);
  const stored = props.getProperty(key);
  let session;
  try { session = stored ? JSON.parse(stored) : null; } catch (_) {}
  if (!session || !session.adminId) throw new Error('APP_SESSION_REQUIRED: ログインしてください。');
  const level = Number(session.permissionLevel);
  if (Number.isInteger(level) && level >= 1 && level <= 4 && Date.now() - Number(session.verifiedAt || 0) < ACCOUNTING_SESSION_RECHECK_MS) {
    return {id: String(session.adminId), password: '', level};
  }
  const record = getAdminRecord_(session.adminId);
  if (!eligibleAdmin_(record) || !equalDigest_(credentialFingerprint_(record), session.credentialFingerprint || '')) {
    props.deleteProperty(key);
    throw new Error('APP_SESSION_REQUIRED: ログイン情報または利用権限が変更されました。');
  }
  session.permissionLevel = record.level;
  session.verifiedAt = Date.now();
  props.setProperty(key, JSON.stringify(session));
  return record;
}
function refreshAccountingSessions_() {
  const props = PropertiesService.getScriptProperties();
  const all = props.getProperties();
  const sessions = Object.keys(all).filter(k => k.startsWith(ADMIN_SESSION_PREFIX)).map(key => {
    let value; try { value = JSON.parse(all[key]); } catch (_) {}
    return {key, value};
  }).filter(x => x.value && x.value.adminId);
  const records = {};
  sessions.forEach(x => {
    const id = String(x.value.adminId);
    if (!Object.prototype.hasOwnProperty.call(records, id)) records[id] = getAdminRecord_(id);
  });
  sessions.forEach(x => {
    const record = records[String(x.value.adminId)];
    if (!eligibleAdmin_(record) || !equalDigest_(credentialFingerprint_(record), x.value.credentialFingerprint || '')) {
      props.deleteProperty(x.key);
      return;
    }
    x.value.permissionLevel = record.level;
    x.value.verifiedAt = Date.now();
    props.setProperty(x.key, JSON.stringify(x.value));
  });
}
function createAppSession_(adminId, password) {
  const invalid = '管理者IDまたはパスワードが正しくないか、利用権限がありません。';
  if (typeof adminId !== 'string' || typeof password !== 'string' || !adminId.trim() || adminId.length > 200 || !password || password.length > 512) throw new Error(invalid);
  adminId = adminId.trim();
  const cache = CacheService.getScriptCache();
  const failureKey = 'ACCOUNTING_LOGIN_FAILURE_' + authDigest_(adminId);
  const globalKey = 'ACCOUNTING_LOGIN_FAILURE_GLOBAL';
  if (Number(cache.get(failureKey) || 0) >= 8 || Number(cache.get(globalKey) || 0) >= 200) throw new Error('ログインの試行回数が多いため、10分ほど待ってからお試しください。');
  const record = getAdminRecord_(adminId);
  const passwordMatches = equalDigest_(authDigest_(password), authDigest_(record ? record.password : ''));
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  let token;
  try {
    const failures = Number(cache.get(failureKey) || 0), totalFailures = Number(cache.get(globalKey) || 0);
    if (failures >= 8 || totalFailures >= 200) throw new Error('ログインの試行回数が多いため、10分ほど待ってからお試しください。');
    if (!eligibleAdmin_(record) || !passwordMatches) {
      cache.put(failureKey, String(failures + 1), 600); cache.put(globalKey, String(totalFailures + 1), 600); throw new Error(invalid);
    }
    cache.remove(failureKey);
    token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').toLowerCase();
    PropertiesService.getScriptProperties().setProperty(appSessionKey_(token), JSON.stringify({
      adminId: record.id, credentialFingerprint: credentialFingerprint_(record), permissionLevel: record.level,
      verifiedAt: Date.now(), createdAt: new Date().toISOString()
    }));
  } finally { lock.releaseLock(); }
  return {token, adminId: record.id};
}
function loginApp(adminId, password) {
  const auth = createAppSession_(adminId, password);
  try { centralAppPermission_(auth.token, 'enter'); }
  catch (e) { PropertiesService.getScriptProperties().deleteProperty(appSessionKey_(auth.token)); throw e; }
  return auth;
}
function loginAndGetAppData(adminId, password) {
  const auth = createAppSession_(adminId, password);
  try { return {token: auth.token, adminId: auth.adminId, data: getAppData(auth.token)}; }
  catch (e) { PropertiesService.getScriptProperties().deleteProperty(appSessionKey_(auth.token)); throw e; }
}
function logoutApp(token) {
  PropertiesService.getScriptProperties().deleteProperty(appSessionKey_(token));
  const cache = CacheService.getScriptCache();
  ['enter','view','write','approve','delete','settings'].forEach(action =>
    cache.remove(CENTRAL_PERMISSION_CACHE_PREFIX + authDigest_(String(token || '') + ':' + action))
  );
  return {ok: true};
}

function getFaviconUrl_() {
  // Opening the web app must not require Drive authorization.
  // Use the public GitHub Pages favicon directly instead of creating a Drive file.
  return FAVICON_SOURCE_URL;
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
function accountingDataRuntime_(sessionToken, operation, data) {
  const payload = Object.assign({sessionToken: String(sessionToken || ''), operation}, data || {});
  const response = UrlFetchApp.fetch(ACCOUNTING_DATA_RUNTIME_URL, {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true
  });
  let value; try { value = JSON.parse(response.getContentText()); } catch (_) {}
  if (response.getResponseCode() !== 200 || !value || !value.ok || !/^\d{4,8}$/.test(String(value.staffCode || ''))) {
    throw new Error('ACCOUNTING_DATA_UNAVAILABLE: ' + (value && value.reason || '表示データを取得できません。'));
  }
  return value;
}
function markAccountingMirrorDirty_() {
  PropertiesService.getScriptProperties().setProperty(ACCOUNTING_MIRROR_DIRTY_KEY, new Date().toISOString());
}
function mergePasswordState_(entries) {
  const props = PropertiesService.getUserProperties().getProperties();
  return (entries || []).map(entry => Object.assign({}, entry, {
    hasPassword: Object.prototype.hasOwnProperty.call(props, secretKey_(entry.id))
  }));
}
function getAppData(sessionToken) {
  const scriptProps = PropertiesService.getScriptProperties();
  if (scriptProps.getProperty(ACCOUNTING_MIRROR_DIRTY_KEY)) {
    try {
      // A prior Sheet snapshot may still be cached briefly. A conflict means
      // the Sheet is authoritative, so discard that snapshot before resyncing.
      clearAppDataCache_();
      const sheetData = getAppDataForAdmin_('');
      // Strip UI-only metadata before sending the Sheet snapshot. The runtime rejects
// password-related fields, including the hasPassword display flag.
const syncEntries = sheetData.entries.map(entry => ({
  category: entry.category, serviceName: entry.serviceName, url: entry.url,
  account: entry.account, passwordManager: entry.passwordManager,
  accountTitle: entry.accountTitle, amountNote: entry.amountNote,
  memo: entry.memo, id: entry.id, logoUrl: entry.logoUrl,
  sortOrder: entry.sortOrder
}));
const synced = accountingDataRuntime_(sessionToken, 'replace', {entries: syncEntries});
      scriptProps.deleteProperty(ACCOUNTING_MIRROR_DIRTY_KEY);
      return {entries: mergePasswordState_(sheetData.entries), sheetUrl: sheetData.sheetUrl, version: APP_VERSION,
        adminId: String(synced.staffCode), dataSource: 'google-sheet-resync', syncedAt: new Date().toISOString()};
    } catch (error) {
      console.warn('Accounting mirror resync failed: ' + String(error && error.message || error).slice(0, 240));
    }
  }
  const value = accountingDataRuntime_(sessionToken, 'read');
  return {entries: mergePasswordState_(value.entries),
    sheetUrl: 'https://docs.google.com/spreadsheets/d/' + (PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || DEFAULT_SPREADSHEET_ID) + '/edit',
    version: APP_VERSION, adminId: String(value.staffCode), dataSource: 'supabase', syncedAt: value.syncedAt || ''};
}
function getAppDataForAdmin_(adminId) {
  const cache = CacheService.getScriptCache();
  const cached = readCachedAppData_(cache);
  if (cached) return Object.assign(cached, {adminId});

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const afterWait = readCachedAppData_(cache);
    if (afterWait) return Object.assign(afterWait, {adminId});
    const ss = getSpreadsheet_();
    const sheet = getSheet_(ss);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      const result = {entries: [], sheetUrl: ss.getUrl(), version: APP_VERSION};
      cache.put(APP_DATA_CACHE_KEY, JSON.stringify(result), 120);
      return Object.assign(result, {adminId});
    }

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
    SpreadsheetApp.flush();
    const result = {entries, sheetUrl: ss.getUrl(), version: APP_VERSION};
    cache.put(APP_DATA_CACHE_KEY, JSON.stringify(result), 120);
    return Object.assign(result, {adminId});
  } finally {
    SpreadsheetApp.flush();
    lock.releaseLock();
  }
}

function readCachedAppData_(cache) {
  try {
    const value = cache.get(APP_DATA_CACHE_KEY);
    return value ? JSON.parse(value) : null;
  } catch (_) { return null; }
}
function clearAppDataCache_() {
  CacheService.getScriptCache().remove(APP_DATA_CACHE_KEY);
}

function saveEntry(payload, sessionToken) {
  requireAppSession_(sessionToken,'write');
  payload = payload || {};
  const item = normalizeEntry_(payload);
  if (!item.serviceName) throw new Error('サービス名を入力してください。');
  validateUrl_(item.url, 'URL'); validateUrl_(item.logoUrl, 'ロゴURL');
  const passwordAction = clean_(payload.passwordAction, 20) || 'keep';
  if (!['keep', 'set', 'clear'].includes(passwordAction)) throw new Error('パスワード操作が不正です。');
  const password = String(payload.password == null ? '' : payload.password);
  if (passwordAction === 'set' && !password) throw new Error('パスワードを入力してください。');
  if (password.length > 500) throw new Error('パスワードが長すぎます。');
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  let entry;
  try {
    const ss = getSpreadsheet_(), sheet = getSheet_(ss); ensureOrderHeader_(sheet);
    let row = item.id ? findRowById_(sheet, item.id) : 0;
    if (item.id && !row) throw new Error('この項目は削除されています。再読み込みしてください。');
    if (row) { checkRevision_(sheet, row, payload.revision); const current = sheet.getRange(row, 1, 1, COLS).getDisplayValues()[0]; item.sortOrder = parseOrder_(current[11]) || nextSortOrder_(sheet); }
    else { row = Math.max(sheet.getLastRow() + 1, 2); item.id = makeId_(); item.sortOrder = nextSortOrder_(sheet); prepareNewRow_(sheet, row); }
    if (passwordAction === 'set') item.passwordManager = 'アプリ内保存';
    writeRow_(sheet, row, item); updateSecret_(item.id, passwordAction, password); SpreadsheetApp.flush();
    entry = rowToEntry_(sheet.getRange(row, 1, 1, COLS).getDisplayValues()[0]); entry.hasPassword = hasSecret_(entry.id); clearAppDataCache_();
  } finally { lock.releaseLock(); }
  let syncPending = false;
  try { accountingDataRuntime_(sessionToken, 'upsert', {entry}); }
  catch (_) { markAccountingMirrorDirty_(); syncPending = true; }
  return {ok:true, entry, syncPending};
}

function saveCardOrder(ids, expectedIds, sessionToken) {
  requireAppSession_(sessionToken,'settings');
  if (!Array.isArray(ids) || !ids.length) throw new Error('並べ替えデータがありません。');
  ids = ids.map(id => clean_(id, 100)).filter(Boolean);
  if (new Set(ids).size !== ids.length) throw new Error('並べ替えデータが重複しています。');
  const lock = LockService.getScriptLock(); lock.waitLock(10000); let needsResync=false;
  try {
    const sheet = getSheet_(getSpreadsheet_()); ensureOrderHeader_(sheet); const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const rows = sheet.getRange(2, 1, lastRow - 1, COLS).getDisplayValues(); const idToRow = new Map();
      rows.forEach((r, i) => { const meaningful = [r[0], r[1], r[3], r[4], r[8]].some(Boolean); if (meaningful && r[9]) idToRow.set(r[9], i + 2); });
      const currentIds = rows.map((r,i) => ({id:r[9], order:parseOrder_(r[11]) || 999999, row:i})).filter(x=>idToRow.has(x.id)).sort((a,b)=>a.order-b.order || a.row-b.row).map(x=>x.id);
      const membershipChanged = idToRow.size !== ids.length || ids.some(id => !idToRow.has(id));
      if (!membershipChanged && (!Array.isArray(expectedIds) || JSON.stringify(currentIds) !== JSON.stringify(expectedIds))) {
        markAccountingMirrorDirty_();
        throw new Error('別の画面で並び順が更新されています。再読み込みしてください。');
      }
      // Keep the user's requested order for items that still exist, drop deleted
      // items, and append items added elsewhere in their current order.
      const orderedIds = membershipChanged
        ? ids.filter(id => idToRow.has(id)).concat(currentIds.filter(id => !ids.includes(id)))
        : ids;
      needsResync=membershipChanged;
      const nextOrders = rows.map(r => [parseOrder_(r[11]) || '']); orderedIds.forEach((id, index) => { nextOrders[idToRow.get(id) - 2][0] = index + 1; });
      sheet.getRange(2, 12, nextOrders.length, 1).setValues(nextOrders); SpreadsheetApp.flush(); clearAppDataCache_();
    }
  } finally { lock.releaseLock(); }
  let syncPending=needsResync;
  if (needsResync) markAccountingMirrorDirty_();
  else { try { accountingDataRuntime_(sessionToken,'reorder',{ids}); } catch (_) { markAccountingMirrorDirty_(); syncPending=true; } }
  return {ok:true, syncPending};
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
  requireAppSession_(sessionToken,'delete');
  id = clean_(id, 100);
  if (!id) throw new Error('管理IDがありません。');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_(getSpreadsheet_());
    if (!findRowById_(sheet, id)) throw new Error('対象データが見つかりません。');
    PropertiesService.getUserProperties().deleteProperty(secretKey_(id));
    clearAppDataCache_();
    return { ok: true };
  } finally { lock.releaseLock(); }
}

function deleteEntry(id, revision, sessionToken) {
  requireAppSession_(sessionToken,'delete'); id = clean_(id, 100); if (!id) throw new Error('管理IDがありません。');
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sheet = getSheet_(getSpreadsheet_()); const row = findRowById_(sheet, id);
    if (!row) throw new Error('対象データが見つかりません。再読み込みしてください。');
    checkRevision_(sheet, row, revision); sheet.deleteRow(row); PropertiesService.getUserProperties().deleteProperty(secretKey_(id));
    compactSortOrders_(sheet); SpreadsheetApp.flush(); clearAppDataCache_();
  } finally { lock.releaseLock(); }
  let syncPending=false; try { accountingDataRuntime_(sessionToken,'delete',{id}); } catch (_) { markAccountingMirrorDirty_(); syncPending=true; }
  return {ok:true, syncPending};
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
    // A stale Supabase snapshot can keep returning the same old revision after
    // a direct Sheet edit. Mark it for reconciliation before returning the conflict.
    markAccountingMirrorDirty_();
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

// Invoice jobs are executed ONLY by the mailbox owner's installable trigger.
// Browser callers and the web deployment never receive Gmail credentials.
const INV_OWNER = 'mintcocoajasmine@gmail.com';
const INV_JOB = 'INV_JOB_V1_';
const INV_ITEM = 'INV_ITEM_V1_';
const INV_CONFIG = 'INV_CONFIG_V1';
const INV_WORKER = 'INV_WORKER_V1';
function invConfig_(){return invRead_(INV_CONFIG)||{folderId:'1GBJvElFr4Ynhv9ICcjncCYTUQnRTgy9B',folderName:'CamScanner',folderUrl:'https://drive.google.com/drive/folders/1GBJvElFr4Ynhv9ICcjncCYTUQnRTgy9B'};}
const INV_VENDORS = {
  exseed: {name:'エクシード',sender:'noreply@misoca.jp',subject:'エクシード 請求書',kind:'misoca', query:'from:noreply@misoca.jp subject:エクシード subject:請求書'},
  esia: {name:'イージア',sender:'e-sia.jp',subject:'請求',kind:'attachment', query:'from:e-sia.jp subject:請求'},
  googleplay: {name:'Google Play',sender:'googleplay-noreply@google.com',subject:'Google Play のご注文明細',kind:'googleplay-email',query:'from:googleplay-noreply@google.com subject:"Google Play" subject:ご注文明細'}
};
const INV_VENDOR_PREFIX = 'INV_VENDOR_V1_';
function invVendors_(){
  const result=Object.keys(INV_VENDORS).map(id=>Object.assign({id,builtin:true},INV_VENDORS[id]));
  const all=invProps_().getProperties();
  Object.keys(all).filter(k=>k.startsWith(INV_VENDOR_PREFIX)).sort().forEach(k=>{const v=JSON.parse(all[k]);if(v&&/^custom_[a-f0-9]{32}$/.test(v.id))result.push(v);});
  return result;
}
function invVendor_(id){const v=invVendors_().find(v=>v.id===id);if(!v)throw new Error('取引先の設定が見つかりません。画面を開き直してください。');return v;}
function saveInvoiceVendor(input,token){
  requireAppSession_(token,'settings');const p=input||{};
  const name=String(p.name||'').trim(),sender=String(p.sender||'').trim().toLowerCase(),subject=String(p.subject||'').trim();
  const dateLabel=String(p.dateLabel||'').trim(),amountLabel=String(p.amountLabel||'').trim();
  if(!name||name.length>60||/[\\/:*?"<>|\x00-\x1f]/.test(name)||/[. ]$/.test(name))throw new Error('取引先名は60文字以内で、ファイル名に使える文字を入力してください。');
  if(sender.length>254||!/^([a-z0-9.!#$%&'*+\-/=?^_`{|}~]+@)?[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(sender))throw new Error('送信元のメールアドレスまたはドメインを入力してください。');
  if(subject.length>100||/["\\\x00-\x1f]/.test(subject))throw new Error('件名キーワードは100文字以内で、引用符や改行を含めずに入力してください。');
  if([dateLabel,amountLabel].some(x=>x.length>40||/[\x00-\x1f]/.test(x)))throw new Error('読み取り項目名は40文字以内で入力してください。');
  return invLock_(()=>{
    const all=invVendors_();let id=String(p.id||'');
    if(id){if(!/^custom_[a-f0-9]{32}$/.test(id)||!all.some(v=>v.id===id))throw new Error('編集できる追加取引先を選択してください。');}
    else {if(all.filter(v=>!v.builtin).length>=30)throw new Error('追加できる取引先は30件までです。');id='custom_'+invId_();}
    if(all.some(v=>v.id!==id&&v.name===name))throw new Error('同じ取引先名が登録されています。');
    const v={id,name,sender,subject,dateLabel,amountLabel,kind:'attachment',builtin:false};
    invWrite_(INV_VENDOR_PREFIX+id,v);return {vendor:v,vendors:invVendors_()};
  });
}
function deleteInvoiceVendor(id,token){
  requireAppSession_(token,'settings');if(!/^custom_[a-f0-9]{32}$/.test(String(id)))throw new Error('標準の取引先は削除できません。');
  return invLock_(()=>{invProps_().deleteProperty(INV_VENDOR_PREFIX+id);return {vendors:invVendors_()};});
}
function invSenderMatches_(header,sender){
  const m=String(header).toLowerCase().match(/<([^<>\s]+@[^<>\s]+)>/);const address=m?m[1]:String(header).trim().toLowerCase();
  return sender.includes('@')?address===sender:address.endsWith('@'+sender);
}
function invEscapeRe_(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function invParseCustom_(text,cfg){
  const t=String(text).normalize('NFKC'),compact=t.replace(/\s/g,'');
  const dates=cfg.dateLabel?[cfg.dateLabel]:['お支払い期限','お支払期限','お支払予定日','支払期限','支払期日','お支払日','支払日','お振込期限'];
  const amounts=cfg.amountLabel?[cfg.amountLabel]:['ご請求金額','今回御請求額','ご請求額','請求金額','合計金額','お支払い金額'];
  const ds=[],as=[];
  for(const label of dates){const re=new RegExp(invEscapeRe_(label.normalize('NFKC').replace(/\s/g,''))+'[】:：]*((?:20\\d{2})[年/.-]\\d{1,2}[月/.-]\\d{1,2}日?)','g');for(const m of compact.matchAll(re)){const p=m[1].match(/(20\d{2})[年/.-](\d{1,2})[月/.-](\d{1,2})/);const d=invValidDate_(p[1]+'-'+p[2].padStart(2,'0')+'-'+p[3].padStart(2,'0'));if(d)ds.push(d);}}
  for(const label of amounts){const re=new RegExp(invEscapeRe_(label.normalize('NFKC').replace(/\s/g,''))+'[】:：]*[¥￥]?([0-9][0-9,]*)(?=円|[-−]|$|[^0-9,.])','g');for(const m of compact.matchAll(re)){const n=Number(m[1].replace(/,/g,''));if(Number.isSafeInteger(n)&&n>=0&&n<=999999999999)as.push(n);}}
  const du=[...new Set(ds)],au=[...new Set(as)];
  return {due:du.length===1?du[0]:'',amount:au.length===1?au[0]:null,evidence:t.slice(0,1600)};
}

function invProps_(){return PropertiesService.getScriptProperties();}
function invRead_(key){const s=invProps_().getProperty(key);return s?JSON.parse(s):null;}
function invWrite_(key,value){const s=JSON.stringify(value);if(Utilities.newBlob(s).getBytes().length>8500)throw new Error('処理データが大きすぎます。');invProps_().setProperty(key,s);}
function invLock_(fn){const l=LockService.getScriptLock();l.waitLock(10000);try{return fn();}finally{l.releaseLock();}}
function invId_(){return Utilities.getUuid().replace(/-/g,'');}
function invOwner_(){if(Session.getEffectiveUser().getEmail().toLowerCase()!==INV_OWNER)throw new Error('請求書の処理は指定のGmailアカウントで実行してください。');}
function invJobFor_(id,token){const admin=requireAppSession_(token);if(!/^[a-f0-9]{32}$/.test(String(id)))throw new Error('処理IDが不正です。');const j=invRead_(INV_JOB+id);if(!j||j.admin!==admin||Date.now()-j.created>86400000)throw new Error('検索結果の有効期限が切れました。もう一度検索してください。');return j;}
function getInvoiceSettings(token){
  requireAppSession_(token);const c=invConfig_();const w=invRead_(INV_WORKER)||{};
  return {vendors:invVendors_(),mailbox:INV_OWNER,folderId:c.folderId||'',folderName:c.folderName||'',folderUrl:c.folderUrl||'',ready:!!w.installed,healthy:!!w.lastRun&&Date.now()-w.lastRun<300000};
}
function invNewJob_(type,data,token){
  const admin=requireAppSession_(token);const w=invRead_(INV_WORKER)||{};
  if(!w.installed)throw new Error('Gmail接続の初期設定がまだ完了していません。');
  return invLock_(()=>{
    const all=invProps_().getProperties();let active=0;
    Object.keys(all).filter(k=>k.startsWith(INV_JOB)).forEach(k=>{const j=JSON.parse(all[k]);if(Date.now()-j.created>86400000){invProps_().deleteProperty(k);(j.items||[]).forEach(id=>invProps_().deleteProperty(INV_ITEM+id));}else if(['queued','working'].includes(j.status))active++;});
    if(active>=8)throw new Error('処理中の依頼が多いため、少し待ってお試しください。');
    const j=Object.assign({id:invId_(),admin,type,status:'queued',created:Date.now(),items:[],errors:0},data);
    invWrite_(INV_JOB+j.id,j);return {jobId:j.id};
  });
}
function startInvoiceSearch(vendor,month,accountOrToken,token){
  const account=token===undefined?'':String(accountOrToken||'').trim().toLowerCase();if(token===undefined)token=accountOrToken;
  if(account&&!/^[a-z0-9.!#$%&'*+\-/=?^_`{|}~]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(account))throw new Error('Google Playアカウントを確認してください。');
  requireAppSession_(token,'view');const cfg=invVendor_(vendor);if(!/^20\d{2}-(0[1-9]|1[0-2])$/.test(String(month)))throw new Error('取引先と支払い月を選択してください。');
  return invNewJob_('search',{vendor,month,vendorConfig:cfg,account},token);
}
function setInvoiceFolder(value,token){
  requireAppSession_(token,'settings');const v=String(value||'').trim();const m=v.match(/^https:\/\/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([\w-]+)(?:[?#].*)?$/);const id=m?m[1]:v;
  if(!/^[\w-]{10,150}$/.test(id))throw new Error('Google DriveのフォルダURLを入力してください。');
  return invNewJob_('folder',{folderId:id},token);
}
function getInvoiceJob(id,token){
  const j=invJobFor_(id,token);const result={id:j.id,type:j.type,status:j.status,message:j.message||'',errors:j.errors||0,scanned:j.scanned||0};
  if(j.status==='done'&&j.type==='search')result.items=j.items.map(k=>invRead_(INV_ITEM+k)).filter(Boolean).map(c=>({id:c.id,vendor:(c.vendorName||invVendor_(c.vendor).name),subject:c.subject,due:c.due||'',amount:c.amount==null?'':c.amount,needsReview:!c.due||c.amount==null,evidence:c.evidence||'',sourceUrl:c.sourceUrl,account:c.account||'',order:c.order||'',sourceKind:c.source.kind==='googleplay-email'?'Google Playのメール本文をPDF保存':c.source.kind==='misoca'?'Misocaの請求書PDF':'メール添付の請求書PDF'}));
  if(j.status==='done'&&j.result)result.result=j.result;
  return result;
}
function previewInvoiceSave(jobId,itemId,due,amount,token){
  const j=invJobFor_(jobId,token);if(j.status!=='done'||j.type!=='search'||!j.items.includes(itemId))throw new Error('検索結果を確認してください。');
  const c=invRead_(INV_ITEM+itemId);const d=invValidDate_(String(due));const a=String(amount).replace(/,/g,'');
  if(!d||d.slice(0,7)!==j.month||!/^\d{1,12}$/.test(a))throw new Error('選択月の支払日と、整数の請求金額を確認してください。');
  const cfg=invConfig_();if(!cfg||!cfg.folderId)throw new Error('保存先フォルダを設定してください。');
  const p={nonce:invId_(),expires:Date.now()+600000,due:d,amount:Number(a),filename:d.replace(/-/g,'')+'_'+(c.vendorName||invVendor_(c.vendor).name)+'_'+Number(a)+(c.source.kind==='googleplay-email'&&c.order?'_'+c.order:'')+'.pdf',folderId:cfg.folderId,folderName:cfg.folderName,folderUrl:cfg.folderUrl};
  c.preview=p;invWrite_(INV_ITEM+itemId,c);return p;
}
function confirmInvoiceSave(jobId,itemId,nonce,token){
  requireAppSession_(token,'write');
  const j=invJobFor_(jobId,token);if(!j.items.includes(itemId))throw new Error('検索結果が不正です。');
  return invLock_(()=>{
    const c=invRead_(INV_ITEM+itemId),p=c&&c.preview;
    if(!p||p.nonce!==nonce||p.expires<Date.now())throw new Error('保存確認の期限が切れました。もう一度確認してください。');
    if(p.saveJob)return {jobId:p.saveJob};
    const save={id:invId_(),admin:j.admin,type:'save',status:'queued',created:Date.now(),itemId,preview:p,items:[]};
    p.saveJob=save.id;invWrite_(INV_ITEM+itemId,c);invWrite_(INV_JOB+save.id,save);return {jobId:save.id};
  });
}
// Run once in the editor as INV_OWNER after authorizing Gmail read-only and Drive.
function setupInvoiceConnection(token){requireAppSession_(token,'settings'); invOwner_(); installInvoiceWorker_(); }
function installInvoiceWorker_(){
  invOwner_();const p=Gmail.Users.getProfile('me');if(p.emailAddress.toLowerCase()!==INV_OWNER)throw new Error('Gmailアカウントが一致しません。');
  if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='processInvoiceJobs_'))ScriptApp.newTrigger('processInvoiceJobs_').timeBased().everyMinutes(1).create();
  invWrite_(INV_WORKER,{installed:true,lastRun:Date.now()});
  console.log('請求書検索の接続設定が完了しました。');
}
function processInvoiceJobs_(){
  try { refreshAccountingSessions_(); } catch (e) { console.warn('Accounting session refresh failed: ' + String(e && e.message || e)); }
  invOwner_();const l=LockService.getUserLock();if(!l.tryLock(1000))return;
  try{
    invWrite_(INV_WORKER,{installed:true,lastRun:Date.now()});
    const all=invProps_().getProperties();const jobs=Object.keys(all).filter(k=>k.startsWith(INV_JOB)).map(k=>JSON.parse(all[k])).filter(j=>['queued','working'].includes(j.status)).sort((a,b)=>a.created-b.created);
    const started=Date.now();
    for(const j of jobs){
      if(Date.now()-started>220000)break;
      try{
        const record=getAdminRecord_(j.admin);if(!eligibleAdmin_(record))throw new Error('利用権限が変更されました。');
        if(Date.now()-j.created>86400000)throw new Error('処理の有効期限が切れました。');
        j.status='working';invWrite_(INV_JOB+j.id,j);
        if(j.type==='folder'){j.result=invCheckFolder_(j.folderId);invWrite_(INV_CONFIG,j.result);j.status='done';}
        else if(j.type==='search')invSearchStep_(j,started);
        else if(j.type==='save'){j.result=invSave_(j);j.status='done';}
      }catch(e){j.status='error';j.message=String(e.message||e).slice(0,600);}
      invWrite_(INV_JOB+j.id,j);
    }
  }finally{l.releaseLock();}
}
function invCheckFolder_(id){
  const f=Drive.Files.get(id,{fields:'id,name,mimeType,trashed,webViewLink,capabilities(canAddChildren)'});
  if(f.trashed||f.mimeType!=='application/vnd.google-apps.folder'||!f.capabilities.canAddChildren)throw new Error('指定Gmailアカウントが保存できるフォルダを選択してください。');
  return {folderId:f.id,folderName:f.name,folderUrl:f.webViewLink||'https://drive.google.com/drive/folders/'+f.id};
}
function invQuery_(vendor,month,config){
  const [y,m]=month.split('-').map(Number),from=new Date(Date.UTC(y,m-4,1)),to=new Date(Date.UTC(y,m+1,1));
  const fmt=d=>d.toISOString().slice(0,10).replace(/-/g,'/');
  const cfg=config||invVendor_(vendor),query=cfg.query||('from:"'+cfg.sender+'"'+(cfg.subject?' subject:"'+cfg.subject+'"':''));
  return query+' after:'+fmt(from)+' before:'+fmt(to)+' -in:trash -in:spam';
}
function invSearchStep_(j,started){
  if(!j.ids){const r=Gmail.Users.Messages.list('me',{q:invQuery_(j.vendor,j.month,j.vendorConfig),maxResults:100});j.ids=(r.messages||[]).map(x=>x.id);j.more=!!r.nextPageToken;j.cursor=0;}
  let processed=0;
  while(j.cursor<j.ids.length&&processed<5&&Date.now()-started<210000){
    const id=j.ids[j.cursor++];j.scanned=(j.scanned||0)+1;processed++;
    try{invReadMessage_(j,id);}catch(e){j.errors++;j.lastError=String(e.message||e).slice(0,250);}
    invWrite_(INV_JOB+j.id,j);
  }
  if(j.cursor>=j.ids.length){j.status='done';j.message=j.more?'検索件数が上限に達しました。一部のメールは未確認です。':j.errors?'読み取れないメールが'+j.errors+'件ありました。'+(j.lastError||''):j.items.length?'請求書が見つかりました。内容を確認してください。':'見つかりませんでした。';}
}
function invParts_(p,out){out=out||[];if(p)out.push(p);(p&&p.parts||[]).forEach(x=>invParts_(x,out));return out;}
function invDecode_(data){
  if(Array.isArray(data))return data;
  let s=String(data).replace(/\s/g,'').replace(/-/g,'+').replace(/_/g,'/');
  s+='='.repeat((4-s.length%4)%4);return Utilities.base64Decode(s);
}
function invHeader_(p,name){const h=(p.headers||[]).find(h=>h.name.toLowerCase()===name.toLowerCase());return h?h.value:'';}
function invText_(parts){return parts.filter(p=>p.mimeType==='text/plain'||p.mimeType==='text/html').map(p=>{
  if(!p.body||!p.body.data)return '';const ct=invHeader_(p,'Content-Type'),cs=(ct.match(/charset=["']?([^;"'\s]+)/i)||[])[1]||'UTF-8';
  const s=Utilities.newBlob(invDecode_(p.body.data)).getDataAsString(cs);return p.mimeType==='text/html'?s.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' '):s;
}).join('\n');}
function invReadMessage_(j,id){
  const msg=Gmail.Users.Messages.get('me',id,{format:'full'}),parts=invParts_(msg.payload),subject=invHeader_(msg.payload,'Subject'),from=invHeader_(msg.payload,'From');
  if(j.vendor==='exseed'&&(!/noreply@misoca\.jp/i.test(from)||!/エクシード/.test(subject)))return;
  if(j.vendor==='esia'&&!/@e-sia\.jp\b/i.test(from))return;
  const cfg=j.vendorConfig||invVendor_(j.vendor);
  if(!cfg.builtin&&(!invSenderMatches_(from,cfg.sender)||(cfg.subject&&!subject.toLowerCase().includes(cfg.subject.toLowerCase()))))return;
  if(j.vendor==='googleplay'){invReadGooglePlay_(j,id,msg,cfg);return;}
  const body=invText_(parts),sources=[];
  if(j.vendor==='exseed'){
    const links=[...new Set(body.match(/https:\/\/app\.misoca\.jp\/receive_documents\/[a-f0-9-]{36}\b/g)||[])];
    links.forEach(url=>sources.push({kind:'misoca',url: url+'/pdf',messageId:id}));
  }else parts.filter(p=>p.mimeType==='application/pdf'||/\.pdf$/i.test(p.filename||'')).forEach(p=>sources.push({kind:'attachment',messageId:id,partId:p.partId,filename:p.filename}));
  if(!sources.length)throw new Error('請求書PDFの添付または取得リンクがありません。');
  for(const source of sources.slice(0,8)){
    let parsed=j.vendor==='exseed'?invParse_(body,j.vendor,j.month):null;
    if(parsed&&parsed.due&&parsed.due.slice(0,7)!==j.month)continue;
    const blob=invPdf_(source),fingerprint=invBlobHash_(blob);
    if(!parsed||!parsed.due||parsed.amount==null){const text=invOcr_(blob);parsed=cfg.builtin||j.vendor==='esia'||j.vendor==='exseed'?invParse_(text,j.vendor,j.month):invParseCustom_(text,cfg);}
    if(parsed.due&&parsed.due.slice(0,7)!==j.month)continue;
    if(j.items.map(k=>invRead_(INV_ITEM+k)).some(c=>c&&c.fingerprint===fingerprint))continue;
    const c={id:invId_(),vendor:j.vendor,vendorName:cfg.name,subject:String(subject).slice(0,250),source,fingerprint,due:parsed.due,amount:parsed.amount,evidence:parsed.evidence,created:Date.now(),sourceUrl:'https://mail.google.com/mail/u/?authuser='+encodeURIComponent(INV_OWNER)+'#all/'+id};
    if(j.items.length>=20)throw new Error('候補が20件を超えました。');
    invWrite_(INV_ITEM+c.id,c);j.items.push(c.id);
  }
}

function invParseGooglePlay_(text,subject){
  const t=String(text||'').normalize('NFKC').replace(/\r\n?/g,'\n'),dates=[],amounts=[];
  const order=(t.match(/(?:注文番号|Order number)\s*[:：]\s*((?:GPA|SOP)\.[0-9][0-9.-]{8,80})/i)||[])[1]||'';
  for(const m of t.matchAll(/(?:注文日|Order date)\s*[:：]\s*(20\d{2})[\/年.-](\d{1,2})[\/月.-](\d{1,2})日?/gi)){const d=invValidDate_(m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0'));if(d)dates.push(d);}
  for(const m of t.matchAll(/(?:^|\s)(?:合計|Total)\s*[:：]?\s*[¥￥]\s*((?:\d{1,3}(?:,\d{3})+|\d+))(?=\s|円|\/|$)/gi)){const n=Number(m[1].replace(/,/g,''));if(Number.isSafeInteger(n)&&n>=0&&n<=999999999999)amounts.push(n);}
  const ds=[...new Set(dates)],as=[...new Set(amounts)];
  const account=(t.match(/(?:お客様のアカウント|Your account)\s*[:：]\s*([a-z0-9.!#$%&'*+/=?^_~-]+@[a-z0-9.-]+\.[a-z]{2,})/i)||[])[1]||'';
  return {due:ds.length===1?ds[0]:'',amount:as.length===1?as[0]:null,order,account,evidence:t.slice(0,1600)};
}
function invGooglePlayRecord_(msg){
  const p=msg.payload,subject=invHeader_(p,'Subject'),from=invHeader_(p,'From');
  if(!invSenderMatches_(from,'googleplay-noreply@google.com')||!/^Google\s*Play\s*のご注文明細(?:\s*[（(]|$)/i.test(subject.normalize('NFKC').trim()))throw new Error('Google Playのご注文明細メールではありません。');
  const parts=invParts_(p),plain=parts.filter(p=>p.mimeType==='text/plain'&&p.body&&p.body.data);
  const text=invText_(plain.length?plain:parts).replace(/\r\n?/g,'\n').trim();
  if(!text||text.length>50000)throw new Error('Google Playのメール本文を読み込めません。');
  const parsed=invParseGooglePlay_(text,subject);
  if(!parsed.order)throw new Error('Google Playの注文番号を確認できません。');
  return {subject,from,to:invHeader_(p,'To'),date:invHeader_(p,'Date'),text,parsed};
}
function invGooglePlayHash_(record){
  return invBlobHash_(Utilities.newBlob(JSON.stringify([record.subject,record.from,record.to,record.date,record.text])));
}
function invReadGooglePlay_(j,id,msg,cfg){
  const record=invGooglePlayRecord_(msg),parsed=record.parsed;
  if(j.account&&parsed.account.toLowerCase()!==j.account.toLowerCase())return;
  if(parsed.due&&parsed.due.slice(0,7)!==j.month)return;
  const fingerprint=invGooglePlayHash_(record);
  if(j.items.map(k=>invRead_(INV_ITEM+k)).some(c=>c&&c.fingerprint===fingerprint))return;
  if(j.items.length>=20)throw new Error('候補が20件を超えました。');
  const c={id:invId_(),vendor:j.vendor,vendorName:cfg.name,subject:record.subject.slice(0,250),source:{kind:'googleplay-email',messageId:id},fingerprint,due:parsed.due,amount:parsed.amount,order:parsed.order,account:parsed.account,evidence:parsed.evidence,created:Date.now(),sourceUrl:'https://mail.google.com/mail/u/?authuser='+encodeURIComponent(INV_OWNER)+'#all/'+id};
  invWrite_(INV_ITEM+c.id,c);j.items.push(c.id);
}
function invGooglePlayPdf_(record){
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const html='<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><style>@page{size:A4;margin:18mm}body{font-family:Arial,"Noto Sans JP",sans-serif;font-size:10pt;line-height:1.65;color:#172033}h1{font-size:17pt}p{overflow-wrap:anywhere}.body{white-space:pre-wrap;overflow-wrap:anywhere;border-top:1px solid #cbd5e1;padding-top:14px}</style></head><body><h1>Google Play ご注文明細（メール本文）</h1><p>メール本文をPDF化したものです。</p><p>件名：'+esc(record.subject)+'<br>差出人：'+esc(record.from)+'<br>宛先：'+esc(record.to)+'<br>メール日時：'+esc(record.date)+'</p><div class="body">'+esc(record.text)+'</div></body></html>';
  const blob=Utilities.newBlob(html,'text/html','GooglePlay.html').getAs('application/pdf');
  const bytes=blob.getBytes();if(bytes.length>10000000||bytes.length<5||String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')throw new Error('Google PlayのメールをPDFに変換できませんでした。');
  return blob.setContentType('application/pdf');
}

function invPdf_(source){
  let b;
  if(source.kind==='misoca'){
    if(!/^https:\/\/app\.misoca\.jp\/receive_documents\/[a-f0-9-]{36}\/pdf$/.test(source.url))throw new Error('請求書URLが不正です。');
    const r=UrlFetchApp.fetch(source.url,{followRedirects:false,muteHttpExceptions:true});
    if(r.getResponseCode()!==200)throw new Error('MisocaのPDFを取得できませんでした（'+r.getResponseCode()+'）。');b=r.getBlob();
  }else{
    const msg=Gmail.Users.Messages.get('me',source.messageId,{format:'full'});const p=invParts_(msg.payload).find(p=>p.partId===source.partId);
    if(!p)throw new Error('添付ファイルが見つかりません。');
    const data=p.body.data||(p.body.attachmentId&&Gmail.Users.Messages.Attachments.get('me',source.messageId,p.body.attachmentId).data);
    if(!data)throw new Error('添付PDFを読み込めません。');b=Utilities.newBlob(invDecode_(data),'application/pdf',source.filename);
  }
  const bytes=b.getBytes();if(bytes.length>10000000||bytes.length<5||String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')throw new Error('10MB以下のPDFではありません。');
  return b.setContentType('application/pdf');
}
function invBlobHash_(blob){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,blob.getBytes()).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');}
function invOcr_(blob){
  const f=Drive.Files.create({name:'請求書読取一時_'+invId_(),mimeType:'application/vnd.google-apps.document'},blob,{ocrLanguage:'ja',fields:'id'});
  try{
    const r=UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(f.id)+'/export?mimeType=text%2Fplain',{headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},muteHttpExceptions:true,followRedirects:false});
    if(r.getResponseCode()!==200)throw new Error('PDFの文字を読み取れませんでした（'+r.getResponseCode()+'）。');
    return r.getContentText('UTF-8');
  }finally{Drive.Files.update({trashed:true},f.id);}
}
function invValidDate_(s){const m=String(s).match(/^(20\d{2})-(\d{2})-(\d{2})$/);if(!m)return '';const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));return d.toISOString().slice(0,10)===s?s:'';}
function invParse_(text,vendor,month){
  const t=String(text).normalize('NFKC').replace(/[ \t\u3000]+/g,' '),compact=t.replace(/\s/g,'');
  const datePattern='(20\\d{2})[年/.-](\\d{1,2})[月/.-](\\d{1,2})日?';
  const label=vendor==='exseed'?'お支払い期限':'お支払予定日';
  let dm=compact.match(new RegExp(label+'[】:\\s]*'+datePattern));let due='';
  const iso=m=>invValidDate_(m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0'));
  if(dm)due=iso(dm);
  if(!due&&vendor==='esia'){
    const block=compact.match(/お支払予定日([\s\S]*?)(?:今回御入金額|前回御請求額)/);
    const dates=block?[...block[1].matchAll(new RegExp(datePattern,'g'))].map(iso).filter(Boolean):[];
    if(dates.length===2&&dates[1]>=dates[0]&&Date.parse(dates[1])-Date.parse(dates[0])<=62*86400000)due=dates[1];
  }
  // OCR may read table headings before all values. Only use a unique date in
  // the selected payment month, and only if the expected due-date label exists.
  if(!due&&compact.includes(label)){
    const dates=[...compact.matchAll(new RegExp(datePattern,'g'))].map(iso).filter(d=>d&&d.slice(0,7)===month);
    if(new Set(dates).size===1)due=dates[0];
  }
  const amountLabel=vendor==='exseed'?'ご請求金額':'今回御請求額';
  const am=compact.match(new RegExp(amountLabel+'[】:\\s]*[¥￥]?([0-9][0-9,]*)(?:円|[-−]|$)'));
  let amount=am?Number(am[1].replace(/,/g,'')):null;
  if(amount==null&&vendor==='esia'){
    // e-sia's five-column balance table: previous, received, carried, sales,
    // current. Require the complete heading and verify the balance equation.
    const table=t.match(/前\s*回\s*御\s*請\s*求\s*額[\s\S]{0,160}?今\s*回\s*御\s*請\s*求\s*額\s*\n?\s*([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)(?=\s|$)/);
    if(table){const n=table.slice(1).map(v=>Number(v.replace(/,/g,'')));if(n.every(Number.isSafeInteger)&&n[0]-n[1]===n[2]&&n[2]+n[3]===n[4])amount=n[4];}
    if(amount==null){const direct=t.match(/(?:^|\n)今\s*回\s*御\s*請\s*求\s*額\s*[¥￥]?\s*([\d,]+)(?=\s*(?:円|\n|$))/);if(direct)amount=Number(direct[1].replace(/,/g,''));}
  }
  if(amount!==null&&(!Number.isSafeInteger(amount)||amount<0||amount>999999999999))amount=null;
  return {due,amount,evidence:t.slice(0,1600)};
}
function invSave_(j){
  const c=invRead_(INV_ITEM+j.itemId);if(!c)throw new Error('検索結果が期限切れです。');
  const p=j.preview,cfg=invCheckFolder_(p.folderId),email=c.source.kind==='googleplay-email';let blob;
  if(email){
    const record=invGooglePlayRecord_(Gmail.Users.Messages.get('me',c.source.messageId,{format:'full'}));
    if(invGooglePlayHash_(record)!==c.fingerprint)throw new Error('確認後にメールが変更されました。もう一度検索してください。');
    blob=invGooglePlayPdf_(record);
  }else{
    blob=invPdf_(c.source);if(invBlobHash_(blob)!==c.fingerprint)throw new Error('確認後に請求書が変更されました。もう一度検索してください。');
  }
  const folder=DriveApp.getFolderById(cfg.folderId),existing=folder.getFilesByName(p.filename);
  while(existing.hasNext()){
    const f=existing.next(),description=email?String(f.getDescription()||''):'';
    const same=email?description.includes('STEP_GOOGLEPLAY_SOURCE_SHA256='+c.fingerprint+'\n')&&description.includes('STEP_GOOGLEPLAY_PDF_SHA256='+invBlobHash_(f.getBlob())+'\n'):invBlobHash_(f.getBlob())===c.fingerprint;
    if(f.getMimeType()==='application/pdf'&&same)return {url:f.getUrl(),name:f.getName(),existing:true};
    throw new Error('同じ名前で内容が異なるファイルがあります。保存先を変更して確認してください。');
  }
  const f=folder.createFile(blob.setName(p.filename));
  if(email)f.setDescription('STEP_GOOGLEPLAY_SOURCE_SHA256='+c.fingerprint+'\nSTEP_GOOGLEPLAY_PDF_SHA256='+invBlobHash_(blob)+'\n');
  return {url:f.getUrl(),name:f.getName(),existing:false};
}





function centralAppPermission_(token, action) {
  token = String(token || '');
  action = action || 'view';
  const sessionKey = appSessionKey_(token);
  if (!PropertiesService.getScriptProperties().getProperty(sessionKey)) {
    throw new Error('APP_SESSION_REQUIRED: ログインしてください。');
  }
  const cache = CacheService.getScriptCache();
  const cacheKey = CENTRAL_PERMISSION_CACHE_PREFIX + authDigest_(token + ':' + action);
  const cached = cache.get(cacheKey);
  if (cached) { try { return JSON.parse(cached); } catch (_) {} }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const afterWait = cache.get(cacheKey);
    if (afterWait) { try { return JSON.parse(afterWait); } catch (_) {} }
    const r = UrlFetchApp.fetch('https://wisedgcgwaebtkprdhth.supabase.co/functions/v1/staff-app-permission-v1', {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify({appId:'accounting-login-app', sessionKind:'accounting', sessionToken:token, action}),
      muteHttpExceptions: true
    });
    let v; try { v = JSON.parse(r.getContentText()); } catch (_) {}
    if (r.getResponseCode() !== 200 || !v || !v.allowed || !/^\d{4,8}$/.test(String(v.staffCode || ''))) {
      throw new Error('PERMISSION_DENIED: ' + (v && v.reason || '共通権限を確認できません。'));
    }
    cache.put(cacheKey, JSON.stringify(v), 60);
    return v;
  } finally { lock.releaseLock(); }
}

// The central service validates this session by calling doPost(), which runs
// verifyAppSession_ and rechecks the administrator record. Avoid doing the same
// spreadsheet verification twice in one request.
function requireAppSession_(token, action) {
  const permission = centralAppPermission_(token, action || 'view');
  return String(permission.staffCode);
}
function passwordEntryIds_(){const props=PropertiesService.getUserProperties().getProperties();return Object.keys(props).filter(key=>key.indexOf(SECRET_PREFIX)===0).map(key=>key.slice(SECRET_PREFIX.length)).filter(Boolean).slice(0,500);}
function doPost(e){try{const p=JSON.parse(e.postData.contents||'{}');if(p.action!=='centralAccountingSessionVerify')throw new Error('Unsupported action');const record=verifyAppSession_(p.sessionToken);return ContentService.createTextOutput(JSON.stringify({success:true,code:record.id,permissionLevel:record.level,passwordEntryIds:passwordEntryIds_()})).setMimeType(ContentService.MimeType.JSON);}catch(e){return ContentService.createTextOutput(JSON.stringify({success:false})).setMimeType(ContentService.MimeType.JSON);}}
