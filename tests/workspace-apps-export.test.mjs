import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildExport} from '../scripts/generate-workspace-apps.mjs';

const markdown=fs.readFileSync(new URL('../SYSTEM_REGISTRY.md',import.meta.url),'utf8');
const exported=JSON.parse(fs.readFileSync(new URL('../workspace-apps.json',import.meta.url),'utf8'));

test('業務ホーム公開JSONはSYSTEM_REGISTRY.mdから機械生成した内容と一致する',()=>{
  assert.deepEqual(exported,buildExport(markdown));
  assert.equal(exported.apps.length,20);
});

test('公開JSONには業務ホーム自身を含み秘密情報を含めない',()=>{
  assert.ok(exported.apps.some(app=>app['正式名称']==='STEP業務ホーム'));
  const text=JSON.stringify(exported);
  for(const key of ['APIキー','パスワード','秘密鍵','セッショントークン','Apps Script Project ID'])assert.doesNotMatch(text,new RegExp(key));
});
