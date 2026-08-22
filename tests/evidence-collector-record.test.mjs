import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const registry=fs.readFileSync(new URL('../SYSTEM_REGISTRY.md',import.meta.url),'utf8');
const handoff=fs.readFileSync(new URL('../docs/evidence-collector-handoff.md',import.meta.url),'utf8');
const exported=JSON.parse(fs.readFileSync(new URL('../workspace-apps.json',import.meta.url),'utf8'));

test('証憑自動回収v1.5.2と6サービスを資産台帳へ記録する',()=>{
  for(const text of [html,registry,handoff]){
    assert.match(text,/v1\.5\.2/);
    for(const service of ['Amazon','中部電力','Render','テレワープ','SPRIX','ChatGPT'])assert.match(text,new RegExp(service));
  }
  const record=exported.apps.find(app=>app['正式名称']==='証憑自動回収');
  assert.equal(record?.['状態'],'Windows本番版 v1.5.2');
  assert.equal(record?.['利用者向けURL'],'');
});

test('Webサイトをアプリ起動リンクとして表示せず、新しいPCのセットアップ方法を示す',()=>{
  assert.doesNotMatch(html,/step-system-registry\/#system-receipt-collector/);
  assert.doesNotMatch(registry,/step-system-registry\/#system-receipt-collector/);
  const receiptBlock=html.split('const RECEIPT_COLLECTOR_RECORD=')[1].split('const STEP_WORKSPACE_CARD=')[0];
  for(const url of ['https://www.amazon.co.jp/','https://bizene.chuden.jp/','https://dashboard.render.com/','https://www.telwarp.com/','https://access.foresta-order.jp/','https://chatgpt.com/'])assert.doesNotMatch(receiptBlock,new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(receiptBlock,/OneDrive/);
  assert.match(receiptBlock,/デスクトップに設置して起動\.cmd/);
  assert.match(receiptBlock,/Node\.jsの別途インストールは不要/);
  assert.match(receiptBlock,/'関連カード':\[\]/);
});

test('複数PC引継ぎとTCカード保留を秘密情報なしで記録する',()=>{
  assert.match(handoff,/自宅PCと塾PCで続ける方法/);
  assert.match(handoff,/TCカード（MY TS CUBIC）/);
  assert.match(handoff,/カード有効期限とセキュリティコードによる追加認証/);
  assert.match(registry,/ログインセッションは共有せず各PCで本人が認証/);
  const receiptRecord=exported.apps.find(app=>app['正式名称']==='証憑自動回収');
  const publicText=[handoff,JSON.stringify(receiptRecord)].join('\n');
  assert.doesNotMatch(publicText,/mintcocoajasmine@gmail\.com|stepkobetsu@gmail\.com|skase\.days@gmail\.com|admin@educrest\.jp/);
  assert.doesNotMatch(publicText,/live_[A-Za-z0-9_-]{10,}|secret=|Cookieの平文/);
});
