import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const editor=fs.readFileSync(new URL('../registry-editor.js',import.meta.url),'utf8');
const workflow=fs.readFileSync(new URL('../.github/workflows/sync-workspace-apps.yml',import.meta.url),'utf8');

test('資産管理は左側のアプリ種類一覧から選択できる',()=>{
  for(const value of ['registrySidebar','registryPurposeNav','registryCurrentPurpose','registryMobileMenu'])assert.match(html,new RegExp(value));
  assert.match(editor,/renderPurposeSidebar/);
  assert.match(editor,/classificationForItem\(item\)/);
  assert.match(editor,/data-registry-purpose/);
});

test('種類の追加・色・アイコン設定が左側一覧にも反映される',()=>{
  assert.match(editor,/config\.purposeTypes\.map/);
  assert.match(editor,/--purpose-color/);
  assert.match(editor,/type\.icon/);
});

test('用途の下と業務ホームボタンの上に利用者分類を表示する',()=>{
  const purposeIndex=html.indexOf('id="registryPurposeNav"'),audienceIndex=html.indexOf('id="registryAudienceNav"'),workspaceIndex=html.indexOf('STEP業務ホームへ',audienceIndex);
  assert.ok(purposeIndex<audienceIndex);
  assert.ok(audienceIndex<workspaceIndex);
  assert.match(editor,/classification\?\.audiences\.includes\(activeAudience\)/);
  assert.match(editor,/activePurpose,activeAudience/);
});

test('パソコンでは台帳を画面幅いっぱいに広げる',()=>{
  assert.match(html,/\.shell\{width:min\(1800px,calc\(100% - 40px\)\)\}/);
  assert.match(html,/grid-template-columns:250px minmax\(0,1fr\);gap:20px/);
});

test('台帳の正式一覧を業務ホーム用JSONへ自動出力する',()=>{
  assert.match(workflow,/SYSTEM_REGISTRY\.md/);
  assert.match(workflow,/node scripts\/generate-workspace-apps\.mjs/);
  assert.match(workflow,/git add workspace-apps\.json/);
});
