import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const registry = fs.readFileSync(new URL('../SYSTEM_REGISTRY.md', import.meta.url), 'utf8');

test('成績管理の端末別ログイン仕様が公開台帳に記録されている', () => {
  for (const text of [
    'grade-management-device-login-20260807',
    '自分・家族の端末',
    '塾のタブレット',
    '30分間操作がない場合に自動ログアウト',
    '7f53ce97f5a2363ccee808ff3e19481554c8ab4b'
  ]) assert.ok(page.includes(text), `公開台帳に ${text} が必要`);

  for (const text of [
    '2026-08-07 成績管理の端末別ログイン',
    '講師コードとパスワードを同一端末・同一ブラウザーへ保存',
    '30分間操作がない場合は自動ログアウト',
    '成績データ、Google Sheet、GAS、Supabaseスキーマの変更なし'
  ]) assert.ok(registry.includes(text), `台帳文書に ${text} が必要`);
});
