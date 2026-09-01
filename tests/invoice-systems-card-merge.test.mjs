import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const registry=fs.readFileSync(new URL('../SYSTEM_REGISTRY.md',import.meta.url),'utf8');

test('請求関連の2システムを1枚の請求システムカードへまとめる',()=>{
  for(const text of [
    "'システム名':'請求システム'",
    '請求管理システムを開く',
    '請求書配信・PDF作成システムを開く',
    'billing-system-details',
    'STEP請求PDF作成・配信システム'
  ])assert.match(page,new RegExp(text));
  assert.match(page,/filter\(\(item,index\)=>index!==managementIndex&&index!==deliveryIndex\)/);
  assert.match(page,/filtered\.splice\(insertAt,0,merged\)/);
});

test('台帳本文も請求システム1行として記録する',()=>{
  assert.match(registry,/\| 請求システム \| 本番使用中 \|/);
  assert.doesNotMatch(registry,/^\| 請求管理システムV3\.1/m);
  assert.doesNotMatch(registry,/^\| STEP請求書PDF作成・配信システム/m);
  assert.match(registry,/請求・会計（3件）/);
  assert.match(registry,/合計42カード/);
});
