import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const index = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const document = fs.readFileSync(new URL('../docs/permission-management-20261004.md', import.meta.url), 'utf8');

test('permission management card records the Issue #54 production state', () => {
  assert.match(index, /本番使用中（公開版14）/);
  assert.match(index, /確認日':'2026年11月21日'/);
  assert.match(index, /適用済みは成績管理（スタッフ用）、面談メモ、生徒情報検索、講師登録アプリの確認メール送信先設定の4アプリ/);
  assert.match(index, /student-directory\.master-edit/);
  assert.match(document, /## 2026-11-21：Issue #54完了/);
  assert.match(document, /成績管理Edge Function v35/);
});
