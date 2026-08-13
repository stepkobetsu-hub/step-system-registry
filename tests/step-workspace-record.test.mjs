import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const registry=fs.readFileSync(new URL('../SYSTEM_REGISTRY.md',import.meta.url),'utf8');

test('STEP業務ホームを正式な本番システムとして登録する',()=>{
  assert.match(registry,/登録システム（20件）/);
  assert.match(registry,/\| STEP業務ホーム \| 本番（全端末共有・再作成版） \| https:\/\/stepkobetsu-hub\.github\.io\/step-workspace\//);
  assert.match(html,/const STEP_WORKSPACE_CARD=/);
  assert.match(html,/'ID':'step-workspace'/);
  assert.match(html,/共有設定版5（7項目・39カード）/);
});

test('業務ホームの認証・データ正本・利用者向けURLを記録する',()=>{
  assert.match(html,/staffLogin・getSystemRegistry・logoutSystemPortal/);
  assert.match(html,/項目・カード配置とお気に入りは認証済み共有APIで全端末へ保存/);
  assert.match(html,/https:\/\/stepkobetsu-hub\.github\.io\/step-workspace\//);
  assert.match(registry,/## STEP業務ホーム（次回はここから着手）/);
  assert.match(registry,/共有設定: 版5。7項目・39カード/);
  assert.match(registry,/URL要確認の4カード/);
  assert.match(registry,/古い版からの保存を拒否/);
  assert.match(html,/共有設定版5（7項目・39カード）/);
  assert.match(html,/rebuild-workspace\.html/);
  assert.match(html,/031a986/);
});
