import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [html, registry, workspace, handoff] = await Promise.all([
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('SYSTEM_REGISTRY.md', root), 'utf8'),
  readFile(new URL('workspace-apps.json', root), 'utf8'),
  readFile(new URL('docs/foresta-progress-v2-20260815.md', root), 'utf8')
]);

const publicText = html + registry + workspace + handoff;
const currentApi = 'AKfycbz0z2FeM1jWUSs7LTzwi9N12kPoTmSTP_hRjTaf3wQlf5kX5hR_W9E37ON63L_dhbIZ';

assert.match(html, /legacy\['システム名'\]='ステップ＆ゴール進捗管理'/);
assert.match(html, /'ID':'foresta-progress-v2'/);
assert.match(html, /https:\/\/stepkobetsu-hub\.github\.io\/foresta-progress-v2\//);
assert.match(html, new RegExp(currentApi));
assert.match(html, /1-hDf82U2uQ1zVL7WBXTyXyXXJxWsJvBHeOiTLj-N0AG3NAqXZcp6wv0M/);
assert.match(html, /フォレスタ進捗管理 v2 保存データ（新規構築 2026-08-15）/);
assert.match(html, /'単元マスタ構成':\['合計1,853件'/);
assert.match(html, /'国語：中1～中3、CTなし、定型宿題なし、各単元の「その他」入力だけ'/);
assert.match(html, /docs\/foresta-progress-v2-20260815\.md/);
assert.match(registry, /登録システム（22件）/);
assert.match(registry, /登録詳細：フォレスタ進捗管理/);
assert.match(registry, /単元マスタ: 合計1,853件。国語232件/);
assert.match(registry, /ローカル自動テスト180件成功/);
assert.match(registry, /講師検索はひらがな・カタカナ・ローマ字/);
assert.match(registry, /神領・大手町、中1・中2・中3、登録済み全学校/);
assert.match(workspace, /"正式名称": "ステップ＆ゴール進捗管理"/);
assert.match(workspace, /"正式名称": "フォレスタ進捗管理"/);
assert.match(handoff, /## 5\. 保存先と21シート/);
assert.match(handoff, /合計は1,853件です/);
assert.match(handoff, /## 13\. 修正・公開手順/);
assert.match(handoff, /## 15\. 障害時の切り分け/);
assert.match(handoff, /検索ボタンはありません/);
assert.match(handoff, /バージョン8「ローマ字検索・管理者生徒検索・速報絞り込み選択肢」/);
assert.match(handoff, /a64ef7963482ebb55beedfb1ceeabcf36953525a/);
assert.doesNotMatch(publicText, /AKfycbx-KkkOPgOTgauFIcT9JFbuz1zgULkZRNx25PwbTWQabw2jUKdZr9ia2kkJljScEBSXVg/);
assert.doesNotMatch(publicText, /1bTbuvyFT2QK9VOcvwGKAACnTzdOk2nXh_MnDslvYnFU/);
assert.doesNotMatch(publicText, /mintcocoajasmine/i);

console.log('foresta-progress-v2 registry checks passed');
