import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const registry=fs.readFileSync(new URL('../SYSTEM_REGISTRY.md',import.meta.url),'utf8');

test('STEP業務ホームを正式な本番システムとして登録する',()=>{
  assert.match(registry,/登録システム（20件）/);
  assert.match(registry,/\| STEP業務ホーム \| 本番 \| https:\/\/stepkobetsu-hub\.github\.io\/step-workspace\//);
  assert.match(html,/const STEP_WORKSPACE_CARD=/);
  assert.match(html,/'ID':'step-workspace'/);
  assert.match(html,/getSystemRegistry からログイン後に取得する/);
});

test('業務ホームの認証・データ正本・利用者向けURLを記録する',()=>{
  assert.match(html,/staffLogin・getSystemRegistry・logoutSystemPortal/);
  assert.match(html,/step-workspace側へ本番URLを複製しない/);
  assert.match(html,/https:\/\/stepkobetsu-hub\.github\.io\/step-workspace\//);
});
