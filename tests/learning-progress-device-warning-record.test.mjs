import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const registry = await readFile(new URL('SYSTEM_REGISTRY.md', root), 'utf8');

test('Cloudflare端末選択注意表示の本番記録が公開台帳にある', () => {
  for (const text of [
    'learning-progress-cloudflare-device-warning-20260807',
    'https://step-progress-api.stepkobetsu.workers.dev/',
    '72c8dafa-53e9-46c4-9048-77e8fa1b8645',
    '端末未選択の注意書きを選択ボタン直下へ移動',
    '本番health HTTP 200',
  ]) assert.ok(html.includes(text), text);
});

test('保守用台帳に変更・検証・復旧情報がある', () => {
  for (const text of [
    '2026-08-07 Cloudflare本番ログイン画面の端末選択注意表示',
    '07fd87d39e6330027ad47e97b00efea4e8593156',
    'Cloudflare側テスト18件',
    'f3ac9e47-496c-4350-b3e8-1a3276e5ae05',
    'D1データの変更やマイグレーションは今回実施していない',
  ]) assert.ok(registry.includes(text), text);
});
