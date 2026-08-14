import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [html, registry, workspace] = await Promise.all([
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('SYSTEM_REGISTRY.md', root), 'utf8'),
  readFile(new URL('workspace-apps.json', root), 'utf8')
]);

assert.match(html, /legacy\['システム名'\]='ステップ＆ゴール進捗管理'/);
assert.match(html, /'ID':'foresta-progress-v2'/);
assert.match(html, /https:\/\/stepkobetsu-hub\.github\.io\/foresta-progress-v2\//);
assert.match(registry, /登録システム（22件）/);
assert.match(registry, /登録詳細：フォレスタ進捗管理/);
assert.match(workspace, /"正式名称": "ステップ＆ゴール進捗管理"/);
assert.match(workspace, /"正式名称": "フォレスタ進捗管理"/);
assert.doesNotMatch(html + registry + workspace, /1bTbuvyFT2QK9VOcvwGKAACnTzdOk2nXh_MnDslvYnFU/);

console.log('foresta-progress-v2 registry checks passed');
