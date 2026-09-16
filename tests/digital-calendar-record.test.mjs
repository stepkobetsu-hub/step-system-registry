import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const registry=fs.readFileSync(new URL('../SYSTEM_REGISTRY.md',import.meta.url),'utf8');
const page=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const apps=JSON.parse(fs.readFileSync(new URL('../workspace-apps.json',import.meta.url),'utf8'));

test('デジタルカレンダーを資産管理台帳へ登録する',()=>{
  assert.match(registry,/\| デジタルカレンダー \| 本番公開中/);
  assert.match(registry,/https:\/\/fire-digital-calendar\.mintcocoajasmine\.chatgpt\.site/);
  assert.match(registry,/既定は6時間/);
  assert.match(registry,/常につけておく/);
  assert.match(registry,/予定がある日だけ/);
  assert.match(page,/id="digital-calendar-registry-20260916"/);
  assert.match(page,/'ID':'digital-calendar'/);
  assert.ok(apps.apps.some(app=>app['正式名称']==='デジタルカレンダー'));
});
