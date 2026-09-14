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

test('保存済みセッションが失効しても保存認証情報で再認証できる', () => {
  assert.match(html, /if\(await restoreStoredLogin\(\)\)return/);
  assert.match(html, /async function restoreStoredLogin\(\)/);
  assert.match(html, /password\.value=localStorage\.getItem\(STAFF_PASSWORD_KEY\)\|\|''/);
});

test('明示的ログアウトでセッション・ID・パスワードを削除する', () => {
  assert.match(html, /localStorage\.removeItem\(AUTH_KEY\)/);
  assert.match(html, /localStorage\.removeItem\(STAFF_CODE_KEY\)/);
  assert.match(html, /localStorage\.removeItem\(STAFF_PASSWORD_KEY\)/);
  assert.match(html, /showLogin\('ログアウトしました。',true\)/);
});

test('一時的な通信・JSON応答エラーではログイン情報を削除しない', () => {
  assert.equal((html.match(/localStorage\.removeItem\(AUTH_KEY\)/g) || []).length, 1);
  assert.match(html, /const text=await res\.text\(\)/);
  assert.match(html, /ログイン状態は保持しています/);
  assert.match(html, /if\(await restoreStoredLogin\(\)\)return/);
});

test('通信できない場合は直近の台帳キャッシュを表示する', () => {
  assert.match(html, /const SYSTEMS_CACHE_KEY='stepSystemRegistryCacheV1'/);
  assert.match(html, /function loadPortalCache\(\)/);
  assert.match(html, /if\(portal\.classList\.contains\('hidden'\)&&systems\.length===0&&!loadPortalCache\(\)\)return false/);
});

test('通信・認証エラーでは台帳を閉じず、明示的ログアウトだけがログイン画面を強制する', () => {
  assert.match(html, /function keepPortalOnAuthFailure\(message\)/);
  assert.match(html, /if\(!force&&keepPortalOnAuthFailure\(message\)\)return/);
  assert.match(html, /台帳画面はそのまま維持します/);
  assert.equal((html.match(/showLogin\('ログアウトしました。',true\)/g) || []).length, 1);
});

test('すべてのインラインJavaScriptが構文エラーなく読み込める', () => {
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.ok(scripts.length > 0);
  scripts.forEach((match, index) => {
    assert.doesNotThrow(() => new Function(match[1]), `script ${index}`);
  });
});
