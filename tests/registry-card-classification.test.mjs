import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const editor=readFileSync(resolve(root,'registry-editor.js'),'utf8');
const index=readFileSync(resolve(root,'index.html'),'utf8');

test('two visible classification dimensions and requested defaults exist',()=>{
  for(const value of ['講師','生徒','スタッフ','管理者','その他','請求・経理','生徒・成績','受付・事務','広告宣伝'])assert.match(editor,new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(editor,/使う人/);
  assert.match(editor,/種類/);
  assert.match(editor,/registry-classification-badge/);
});

test('card editor supports multiple audiences and one purpose',()=>{
  assert.match(editor,/誰が使うか（複数選択可）/);
  assert.match(editor,/name='registryAudience'|name="registryAudience"/);
  assert.match(editor,/registryCardPurpose/);
  assert.match(editor,/audiences,purpose/);
});

test('classification types can be added and their icon and color edited',()=>{
  assert.match(editor,/分類項目の設定/);
  assert.match(editor,/registryAddAudienceType/);
  assert.match(editor,/registryAddPurposeType/);
  assert.match(editor,/\.type='color'/);
  assert.match(editor,/新しい項目/);
});

test('published page uses the classification editor cache key',()=>{
  assert.match(index,/registry-editor\.js\?v=20260914-card-key-fix/);
});

test('classification occupies the full card width and wraps only when needed',()=>{
  assert.match(editor,/\.registry-classification\{[^}]*flex-wrap:wrap[^}]*width:100%/);
  assert.match(editor,/\.registry-classification-group\{[^}]*flex-wrap:nowrap/);
  assert.match(editor,/head\.after\(holder\)/);
});

test('search and filters call the latest decorated renderer',()=>{
  assert.match(index,/getElementById\('search'\)\.addEventListener\('input',\(\)=>render\(\)\)/);
  assert.match(index,/getElementById\('category'\)\.addEventListener\('change',\(\)=>render\(\)\)/);
  assert.match(index,/getElementById\('status'\)\.addEventListener\('change',\(\)=>render\(\)\)/);
  assert.match(index,/getElementById\('investigationFilter'\)\.addEventListener\('change',\(\)=>render\(\)\)/);
});

test('initial shared settings are loaded once without replacing visible cards',()=>{
  assert.match(editor,/__stepRegistryInitialSharedConfigPromise/);
  assert.match(editor,/waitingForInitialSharedConfig=!hadCachedConfig/);
  assert.match(editor,/最新の台帳を読み込んでいます/);
  assert.match(editor,/次回表示から反映します/);
  assert.doesNotMatch(editor,/config=nextConfig;\s*persistLocal\(\);\s*applyConfigToPortal\(\)/);
});
