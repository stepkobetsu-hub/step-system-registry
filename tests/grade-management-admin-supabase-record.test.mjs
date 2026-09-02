import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const registry = fs.readFileSync(new URL('../SYSTEM_REGISTRY.md', import.meta.url), 'utf8');
const apps = fs.readFileSync(new URL('../workspace-apps.json', import.meta.url), 'utf8');

test('管理者画面のSupabase完全移行を公開台帳へ記録する', () => {
  for (const text of [
    'seiseki-admin-runtime-v1 v6',
    'wisedgcgwaebtkprdhth',
    'PR #16',
    '生徒337',
    '成績180',
    '通知表126',
    '志望校14',
    '学校6',
    'mutation ID',
    'Google Sheet',
    '未マージ',
    '生徒用 成績管理（Supabase移行済み）',
    '講師・管理者用 成績管理（PR #16マージ後に移行版へ切替）',
    'Google Sheet（Supabase非同期ミラー確認用）',
    '管理者Supabase移行版 PR #16を開く',
  ]) {
    assert.ok(page.includes(text), `公開画面に ${text} が必要`);
  }

  for (const text of [
    '成績管理：講師・管理者画面のSupabase完全移行（2026-09-02）',
    'seiseki-admin-runtime-v1',
    '権限2・3・4',
    '生徒337件',
    'テスト成績180件',
    '通知表126件',
    '志望校14件',
    '学校マスタ6件',
    'PR #16をレビューしてmainへマージ',
  ]) {
    assert.ok(registry.includes(text), `台帳文書に ${text} が必要`);
  }

  assert.ok(apps.includes('Supabase完全移行準備完了'));
  assert.ok(!page.includes('lrairqewdnyfxrydirrm'));
  assert.ok(page.includes("'GitHub URL':'https://github.com/stepkobetsu-hub/seiseki-kanri/pull/16'"));
  assert.ok(page.includes("if(INVESTIGATION_DEFINITIONS[index].cardAnchor==='grade-management')"));
});
