import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const registry = fs.readFileSync(path.join(root, 'SYSTEM_REGISTRY.md'), 'utf8');
const handoff = fs.readFileSync(path.join(root, 'docs', 'foresta-progress-v3-production-20260831.md'), 'utf8');

test('Foresta admin fast path and preserved elementary specifications are recorded', () => {
  for (const text of [
    'cf3fc3b0f26a4dae985fb40225b6d16ddfe0510a',
    'getAdminDashboard',
    'getAdminStudents',
    '1001 加瀬壮真',
    '1320 加瀬智子',
    '次回の宿題を確認',
    '教科書漢字ドリルなど',
    'NEW小学ワーク光村',
    '生徒＝やわらかい青',
    '講師＝落ち着いた青緑',
    '管理＝紫グレー',
    '33404387829',
  ]) {
    assert.ok(handoff.includes(text), `handoff should contain: ${text}`);
  }
  assert.match(registry, /管理者一覧もSupabase高速経路/);
  assert.match(html, /管理者高速経路/);
  assert.match(html, /学校単元テストUI/);
  assert.match(html, /Apps Script v19/);
});
