import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('資産管理ポータルはID・パスワードを保存して自動ログインする', () => {
  assert.match(html, /const STAFF_CODE_KEY='stepStaffAppCode'/);
  assert.match(html, /const STAFF_PASSWORD_KEY='stepStaffAppPassword'/);
  assert.match(html, /localStorage\.setItem\(STAFF_CODE_KEY,code\)/);
  assert.match(html, /localStorage\.setItem\(STAFF_PASSWORD_KEY,password\)/);
  assert.match(html, /function scheduleAutoLogin\(\)/);
  assert.match(html, /performLogin\(true\)/);
});

test('保存済みセッションを優先し、失効時は保存認証情報で再認証できる', () => {
  assert.match(html, /await loadPortal\(\);return/);
  assert.match(html, /showLogin\(\);\s*scheduleAutoLogin\(\)/);
  assert.match(html, /password\.value=localStorage\.getItem\(STAFF_PASSWORD_KEY\)\|\|''/);
});

test('明示的ログアウトでセッション・ID・パスワードを削除する', () => {
  assert.match(html, /localStorage\.removeItem\(AUTH_KEY\)/);
  assert.match(html, /localStorage\.removeItem\(STAFF_CODE_KEY\)/);
  assert.match(html, /localStorage\.removeItem\(STAFF_PASSWORD_KEY\)/);
});
