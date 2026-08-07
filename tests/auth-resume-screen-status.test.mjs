import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const registry = fs.readFileSync(new URL('../SYSTEM_REGISTRY.md', import.meta.url), 'utf8');

test('自動ログイン画面の公開・公開待ち状況が正確に記録されている', () => {
  for (const text of [
    'auth-resume-screen-status-20260807',
    'ce7143a012776ad2e76a5720a64cc713211ffdd7',
    '7c17acc7053b6b802d89ed3dfe656960b178b20d',
    'Cloudflare Worker公開待ち',
  ]) assert.ok(page.includes(text), text);

  for (const text of [
    '2026-08-07 自動ログイン中のログイン画面ちらつき防止',
    '成績管理はGitHub Pagesへ反映済み',
    '学習進捗管理はCloudflare Workerへのアップロード待ち',
    '既存本番Version `72c8dafa-53e9-46c4-9048-77e8fa1b8645` は変更していない',
  ]) assert.ok(registry.includes(text), text);
});
