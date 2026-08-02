import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const registry = fs.readFileSync(new URL('../SYSTEM_REGISTRY.md', import.meta.url), 'utf8');

test('the student app development record is registered in the portal and ledger', () => {
  assert.match(page, /'ID':'step-student-app'/);
  assert.match(page, /STEP塾生アプリ（step-hub）開発記録/);
  assert.match(registry, /## 登録詳細：STEP塾生アプリ（step-hub）開発記録/);
  assert.match(registry, /登録システム（19件）/);
});

test('the STEP invoice PDF system is registered without production sending', () => {
  assert.match(page, /'ID':'step-invoice-pdf'/);
  assert.match(page, /PRODUCTION_SEND_APPROVED=false/);
  assert.match(registry, /STEP請求書PDF作成・配信システム/);
});

test('the record preserves the confirmed pre-design functional scope', () => {
  for (const text of ['共通ログイン','本人専用QR','成績管理','学習進捗管理','フォレスタプラス','愛知県入試制度','愛知全県模試','学習資料','Service Worker']) {
    assert.match(page, new RegExp(text));
    assert.match(registry, new RegExp(text));
  }
});

test('design work is explicitly separated from the confirmed specification record', () => {
  assert.match(page, /デザイン変更開始前までに確定した仕様/);
  assert.match(page, /別管理履歴/);
  assert.match(registry, /デザイン変更開始前までに確定したシステム仕様/);
  assert.match(registry, /採用デザイン実装は本記録に含めず/);
});

test('the rejected design and stable restoration are recorded separately', () => {
  for (const text of ['デザイン全面変更の採用撤回','2f55e36','a85e3bd','step-student-v15-rollback','not planned']) {
    assert.match(page, new RegExp(text));
    assert.match(registry, new RegExp(text));
  }
  assert.match(registry, /確定仕様を上書きせず/);
});

test('the new record contains no private deployment identifiers or backend URLs', () => {
  const record = page.match(/const STEP_STUDENT_APP_RECORD=\{[\s\S]*?\n\};/)?.[0] || '';
  assert.ok(record);
  const forbidden = [
    'script' + '.google.com',
    'docs' + '.google.com/spreadsheets',
    'AKfy' + 'cb',
    '/ex' + 'ec',
    'SPREADSHEET' + '_ID',
    'SCRIPT' + '_ID',
    '認証列' + '：'
  ];
  for (const value of forbidden) assert.doesNotMatch(record.toLowerCase(), new RegExp(value.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
