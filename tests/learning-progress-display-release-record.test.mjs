import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const registry = await readFile(new URL('SYSTEM_REGISTRY.md', root), 'utf8');

test('70%基準グラフと宿題文言のCloudflare本番記録が公開台帳にある', () => {
  for (const text of [
    'learning-progress-display-release-20260809',
    'bf08686b-79d0-4187-9139-458e73c0d3d3',
    '1周目100%をバーの70%位置として表示',
    'TRYの赤×なおし',
    'エクササイズの赤×なおし',
    '復旧用Version eb7d6baeを維持',
  ]) assert.ok(html.includes(text), text);
});

test('保守用台帳に変更範囲・検証・復旧手順がある', () => {
  for (const text of [
    '2026-08-09 学習進捗グラフ70%基準・2周目以降の宿題文言',
    'productionWriteApproved=true',
    'browserD1WriteEnabled=true',
    'Workerの保存API、D1クエリ、宿題生成処理、認証、同期処理、Cron、D1スキーマ、D1データは変更していない',
    'eb7d6bae-efec-4deb-88aa-33544494049c',
    '109454faa1c0ce091740faa27488955e8f1427dcc4798bbc95355a852a188d34',
    'winget install --id OpenJS.NodeJS.LTS',
    'wrangler@4.120.0 login',
    'versions upload --no-bundle --strict --keep-vars',
    'OAuthコードやAPIトークンをチャット、GitHub、台帳へ貼らない',
  ]) assert.ok(registry.includes(text), text);
});
