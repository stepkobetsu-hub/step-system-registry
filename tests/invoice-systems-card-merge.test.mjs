import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const page=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const registry=fs.readFileSync(new URL('../SYSTEM_REGISTRY.md',import.meta.url),'utf8');

test('請求関連の2システムを1枚の請求システムカードへまとめる',()=>{
  for(const text of [
    "'システム名':'請求システム'",
    '請求管理システムを開く',
    '料金特別調整を開く',
    '請求書：作成・配信システムを開く',
    'billing-system-details',
    'STEP請求書PDF作成・配信システム'
  ])assert.match(page,new RegExp(text));
  assert.ok(page.includes("name.includes('請求管理システム')"));
  assert.match(page,/filter\(\(item,index\)=>index!==managementIndex&&index!==deliveryIndex\)/);
  assert.match(page,/filtered\.splice\(insertAt,0,merged\)/);
});

test('実画面のカード名でも2枚を1枚へ統合する',()=>{
  const script=page.match(/<script id="billing-systems-card-merge-20260901">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  const sandbox={
    CARD_ANCHORS:[],
    organizeEntryImport:items=>items.map(item=>({...item})),
    applyAssetInfo:item=>item,
    applyConfirmedInfo:item=>item,
    appendDailyLinks:()=>{},
    addStandardContent:()=>{},
    document:{createElement:()=>({textContent:''}),head:{appendChild:()=>{}}}
  };
  vm.runInNewContext(script,sandbox);
  const result=sandbox.organizeEntryImport([
    {'ID':'billing','システム名':'請求管理システム','利用者向けURL':'https://example.com/billing'},
    {'ID':'step-invoice-pdf','システム名':'STEP請求書PDF作成・配信システム','利用者向けURL':'https://example.com/pdf'}
  ]);
  assert.equal(result.length,1);
  assert.equal(result[0]['システム名'],'請求システム');
  assert.equal(result[0]['料金特別調整URL'],'https://script.google.com/macros/s/AKfycbxzkE1tQRyB_Ca4bfPKYWIkpTukIVPMWKf2ETE7yN7qROJk0VyOlvxaJ9GGI5p-6pGb/exec?page=adjustments');
  assert.equal(result[0]['請求管理システムURL'],'https://script.google.com/macros/s/AKfycbxzkE1tQRyB_Ca4bfPKYWIkpTukIVPMWKf2ETE7yN7qROJk0VyOlvxaJ9GGI5p-6pGb/exec');
  assert.equal(result[0]['請求書配信PDF作成URL'],'https://stepkobetsu-hub.github.io/invoice-pdf/#invoices');
});

test('入口上部は小さい説明だけを残す',()=>{
  const script=page.match(/<script id="billing-systems-card-merge-20260901">([\s\S]*?)<\/script>/)?.[1]||'';
  assert.ok(script.includes("heading.append(el('span','',description))"));
  assert.ok(script.indexOf("['重要・よく使う：イレギュラーな割引・加算','料金特別調整を開く'")<script.indexOf("['学費計算・請求データ作成','請求管理システムを開く'"));
  assert.equal(script.includes("heading.append(el('strong','',title)"),false);
  assert.ok(script.includes("['学費計算・請求データ作成','請求管理システムを開く'"));
  assert.ok(script.includes("['請求書配信・PDF作成','請求書：作成・配信システムを開く'"));
});

test('小さい説明と入口タイトルの隙間をなくし枠を低くする',()=>{
  assert.match(page,/\.billing-system-entry\{margin-top:7px;padding:6px 10px/);
  assert.match(page,/\.billing-system-entry-heading\{[^}]*margin-bottom:0;line-height:1\.2/);
  assert.match(page,/\.billing-system-entry \.link-row\{margin:0\}/);
  assert.match(page,/\.billing-system-entry \.open,\.billing-system-entry \.copy\{padding:6px 9px\}/);
});

test('台帳本文も請求システム1行として記録する',()=>{
  assert.match(registry,/\| 請求システム \| \*\*Cloudflare完全統合・本番稼働中（本番送信は無効）\*\* \|/);
  assert.doesNotMatch(registry,/^\| 請求管理システムV3\.1/m);
  assert.doesNotMatch(registry,/^\| STEP請求書PDF作成・配信システム/m);
  assert.match(registry,/請求・会計（3件）/);
  assert.match(registry,/合計42カード/);
});

test('PDFライブラリをPDF作成時だけ読み込む本番仕様を記録する',()=>{
  assert.match(page,/invoice-pdf-lazy-library-registration-20260903/);
  assert.match(page,/PDFライブラリをPDF作成時のみ遅延読込/);
  assert.match(page,/PR #30/);
  assert.match(page,/c167d71715d70fe917d40a665edba4c1c40bdf64/);
  assert.match(registry,/請求書作成・配信：PDFライブラリ遅延読込（2026-09-03）/);
  assert.match(registry,/最初のPDF作成時だけライブラリ取得時間が加わる/);
});
