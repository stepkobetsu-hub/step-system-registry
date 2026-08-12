import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const registry = fs.readFileSync(new URL('../SYSTEM_REGISTRY.md', import.meta.url), 'utf8');

test('the billing CSV details and monthly workflow release are accumulated', () => {
  for (const text of [
    '最大8明細',
    '在籍更新時刻と請求再作成時刻',
    '①在籍生徒を今すぐ更新',
    '④エラーチェック',
  'エラー一覧',
    'PDF・メール送信（工事中）',
    'バージョン72'
  ]) {
    assert.match(page, new RegExp(text));
    assert.match(registry, new RegExp(text));
  }
});

test('the imported invoice ordering and Cloudflare release are accumulated', () => {
  for (const text of [
  '新しいCSV取込グループ',
    '生徒番号',
    'created_at',
    '94a5007',
    'c9f00a58',
    'a15d34ed-fe4d-494d-a677-79be2ca7bbac'
  ]) {
    assert.match(page, new RegExp(text));
    assert.match(registry, new RegExp(text));
  }
  for (const target of [page, registry]) {
    assert.doesNotMatch(target, /CLOUDFLARE_ADMIN_API_KEY=[0-9a-f]{24,}/i);
  }
});
