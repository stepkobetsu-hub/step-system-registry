import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [html, registry, handoff] = await Promise.all([
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('SYSTEM_REGISTRY.md', root), 'utf8'),
  readFile(new URL('docs/learning-progress-common-grade-hotfix-20260817.md', root), 'utf8'),
]);

const publicText = html + registry + handoff;

test('理科・国語・社会の共通学年目標範囲の本番復旧を公開台帳へ記録している', () => {
  for (const text of [
    'learning-progress-common-grade-hotfix-20260817',
    'a3b7ce268ff3ec81b5f75db4c8a2d63762894184',
    'bbefb81b-9d7e-4b90-9480-b245a751cd6c',
    'b4eff6ac-62b8-4db7-8f74-845896a29639',
    '中1～中3共通',
    'fsAdminDashboard:commonGradeFix20260817:',
    'forestaProgress.viewCache:commonGradeFix20260817:',
    '9d67371dbe8b4e155e85952cdbf626d00ba38aa2f6cc63a636ab5d6fe14a5866',
  ]) assert.ok(publicText.includes(text), text);
});

test('データ非消失、GitHub Actions公開経路、復旧手順を記録している', () => {
  for (const text of [
    'D1の目標・進捗データは消失していない',
    '.github/workflows/deploy-step-progress.yml',
    'CLOUDFLARE_API_TOKEN',
    'actions/runs/32006933794',
    'D1データを削除・初期化・ロールバックしない',
    "u.grade='中1～中3共通'",
    "m.grade='中1～中3共通'",
  ]) assert.ok(publicText.includes(text), text);
});

test('Cloudflare APIトークン本文を公開台帳へ記録していない', () => {
  assert.doesNotMatch(publicText, /cfut_[A-Za-z0-9_-]{20,}/);
  assert.doesNotMatch(publicText, /cfat_[A-Za-z0-9_-]{20,}/);
});
