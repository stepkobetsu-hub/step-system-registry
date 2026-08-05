import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const registry = fs.readFileSync(new URL('../SYSTEM_REGISTRY.md', import.meta.url), 'utf8');

test('the teacher portal QR shortcut is traceable from the portal and ledger', () => {
  assert.match(page, /teacher-portal-instant-qr-20260806/);
  assert.match(registry, /## 登録詳細：講師ポータル/);

  for (const text of [
    'stepkobetsu-hub/teacher-portal',
    'showNyutaikun',
    'loadNyutaikunQr',
    'teacherQrCode',
    'teacherQrData',
    '16502435428ac051f3476dd2fe9d388382f383cf'
  ]) {
    assert.match(page, new RegExp(text));
    assert.match(registry, new RegExp(text));
  }
});

test('the record preserves instant display and logout behavior', () => {
  assert.match(page, /2枚目を省略して3枚目を即時表示/);
  assert.match(page, /ログアウト後は次回に講師コード入力が必要/);
  assert.match(registry, /2枚目を表示せず3枚目を即時表示/);
  assert.match(registry, /次回は必ず2枚目で講師コードの入力が必要/);
});
