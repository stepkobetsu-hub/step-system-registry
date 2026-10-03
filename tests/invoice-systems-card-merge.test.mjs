import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const page=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const registry=fs.readFileSync(new URL('../SYSTEM_REGISTRY.md',import.meta.url),'utf8');
const billing='https://script.google.com/macros/s/AKfycbxzkE1tQRyB_Ca4bfPKYWIkpTukIVPMWKf2ETE7yN7qROJk0VyOlvxaJ9GGI5p-6pGb/exec';
const delivery='https://stepkobetsu-hub.github.io/invoice-pdf/#invoices';

function setup(){
  const script=page.match(/<script id="billing-systems-cards-20261004">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  const sandbox={CARD_ANCHORS:[],organizeEntryImport:items=>items.map(item=>({...item})),applyAssetInfo:item=>item,applyConfirmedInfo:item=>item,appendDailyLinks:()=>{},el:(tag,className,text)=>({tag,className,text,children:[],append(...nodes){this.children.push(...nodes);}}),linkRow:(label,url)=>({label,url})};
  vm.runInNewContext(script,sandbox);
  return sandbox;
}

test('請求関連を独立した2カードへ分離しそれぞれの詳細を保持する',()=>{
  const sandbox=setup();
  const result=sandbox.organizeEntryImport([
    {ID:'billing','システム名':'請求管理システム','Apps ScriptプロジェクトID':'billing-project'},
    {ID:'step-invoice-pdf','システム名':'STEP請求書PDF作成・配信システム','D1':'invoice-db'},
    {ID:'other','システム名':'別アプリ'}
  ]);
  assert.equal(result.length,3);
  const [management,pdf]=result;
  assert.equal(management['システム名'],'請求システム');
  assert.equal(management['利用者向けURL'],billing);
  assert.equal(management['料金特別調整URL'],billing+'?page=adjustments');
  assert.equal(management['Apps ScriptプロジェクトID'],'billing-project');
  assert.equal(management['D1'],undefined);
  assert.equal(pdf['システム名'],'請求書作成システム');
  assert.equal(pdf['利用者向けURL'],delivery);
  assert.equal(pdf['D1'],'invoice-db');
  assert.equal(pdf['料金特別調整URL'],undefined);
});

test('統合済みの旧キャッシュも元の2システムへ展開する',()=>{
  const sandbox=setup();
  const result=sandbox.organizeEntryImport([{ID:'billing','システム名':'請求システム',__billingSystems:[
    {item:{ID:'billing','システム名':'請求管理システム','Apps ScriptプロジェクトID':'billing-project'}},
    {item:{ID:'step-invoice-pdf','システム名':'STEP請求書PDF作成・配信システム','D1':'invoice-db'}}
  ]}]);
  assert.equal(result.length,2);
  assert.equal(result[0]['Apps ScriptプロジェクトID'],'billing-project');
  assert.equal(result[1]['D1'],'invoice-db');
  assert.equal(result[0].__billingSystems,undefined);
  assert.equal(sandbox.organizeEntryImport(result).length,2);
});

test('各カードの日常利用リンクを混在させない',()=>{
  const sandbox=setup();
  for(const [item,expected] of [[{ID:'billing','システム名':'請求システム'},[billing+'?page=adjustments',billing]],[{ID:'step-invoice-pdf','システム名':'請求書作成システム'},[delivery]]]){
    const article={children:[],append(node){this.children.push(node);}};
    sandbox.appendDailyLinks(item,article);
    const urls=article.children[0].children.filter(node=>node.url).map(node=>node.url);
    assert.deepEqual(urls,expected);
  }
});

test('台帳と業務ホーム用一覧でも2システムを独立させる',()=>{
  const rows=registry.split('\n').filter(line=>/^\| 請求(システム|書作成システム) \|/.test(line));
  assert.equal(rows.length,2);
  assert.ok(rows[0].includes(billing+'?page=adjustments'));
  assert.ok(!rows[0].includes(delivery));
  assert.ok(rows[1].includes(delivery));
  assert.ok(!rows[1].includes(billing));
  const apps=JSON.parse(fs.readFileSync(new URL('../workspace-apps.json',import.meta.url),'utf8')).apps;
  assert.ok(apps.some(item=>item['正式名称']==='請求システム'));
  assert.ok(apps.some(item=>item['正式名称']==='請求書作成システム'));
});

test('共有リンクの旧設定でも正しいカードの入口だけを復元する',()=>{
  const source=fs.readFileSync(new URL('../registry-daily-links-editor.js',import.meta.url),'utf8');
  const normalize=source.match(/const ensureRequiredLinks=links=>\{([\s\S]*?)\n    \};/)?.[1];
  assert.ok(normalize);
  const sandbox={clone:value=>JSON.parse(JSON.stringify(value)),links:[{title:'旧統合リンク',openUrl:delivery}],item:{ID:'billing','システム名':'請求システム'}};
  vm.runInNewContext('result=(()=>{'+normalize+'})();',sandbox);
  assert.deepEqual(Array.from(sandbox.result,link=>link.openUrl),[billing+'?page=adjustments',billing]);
  sandbox.item={ID:'step-invoice-pdf','システム名':'請求書作成システム'};
  vm.runInNewContext('result=(()=>{'+normalize+'})();',sandbox);
  assert.deepEqual(Array.from(sandbox.result,link=>link.openUrl),[delivery]);
});

test('PDFライブラリ遅延読込の本番記録を保持する',()=>{
  assert.match(page,/invoice-pdf-lazy-library-registration-20260903/);
  assert.match(registry,/請求書作成・配信：PDFライブラリ遅延読込（2026-09-03）/);
});
