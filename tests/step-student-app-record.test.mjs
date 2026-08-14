import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const registry = fs.readFileSync(new URL('../SYSTEM_REGISTRY.md', import.meta.url), 'utf8');

test('the student app development record is registered in the portal and ledger', () => {
  assert.match(page, /'ID':'step-student-app'/);
  assert.match(page, /STEP塾生アプリ（step-hub）開発記録/);
  assert.match(registry, /## 登録詳細：STEP塾生アプリ（step-hub）開発記録/);
  assert.match(registry, /登録システム（22件）/);
});

test('the STEP invoice PDF system is registered with the current background sending record', () => {
  assert.match(page, /'ID':'step-invoice-pdf'/);
  assert.match(page, /step-invoice-pdf-release-20260812/);
  assert.match(page, /100件実送信を約65秒で完了/);
  assert.match(registry, /本番稼働中（100件送信を約65秒で完了確認）/);
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

test('the persistent student login implementation is recorded for the next investigation', () => {
  for (const text of [
    'student-persistent-login-20260806',
    '明示的ログアウトまで共通ログインを維持',
    'STUDENT_SESSION_EXPIRES_AT',
    'makeStudentSessionPersistent_',
    'requireActiveStudentSession_',
    'stepCommonStudentSessionToken',
    'Service Worker v21',
    'Apps Scriptバージョン84'
  ]) assert.match(page, new RegExp(text));

  for (const text of [
    '明示的ログアウトまで共通ログインを維持',
    'パスワードは端末へ保存しない',
    'STUDENT_INACTIVE',
    'step-student-v21-persistent-login',
    '公開API version 84',
    '次回ここから確認'
  ]) assert.match(registry, new RegExp(text));
});

test('the persistent local QR cache and its invalidation rules are recorded', () => {
  for (const text of [
    'student-persistent-qr-cache-20260807',
    'stepMyQrDisplayCacheV5',
    '2回目以降は保存済みQRを最初に描画して処理を終了',
    '明示的にログアウトするまで保存',
    '別生徒でログインした場合',
    'my_qr_sw.js?v=9',
    '自分のQR対象試験15件'
  ]) assert.match(page, new RegExp(text.replace(/[?]/g, '\\?')));

  for (const text of [
    '2026年8月7日：自分のQRを端末へ保存して即時表示',
    '15分制限を廃止',
    '本人確認API・QR取得APIへアクセスしない',
    'stepMyQrDisplayCacheV5',
    '別の生徒IDでログインした場合',
    'my_qr_sw.js?v=9'
  ]) assert.match(registry, new RegExp(text.replace(/[?]/g, '\\?')));
});
