import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('添付で指定された32カード表示を正本として固定する',()=>{
  const script=html.match(/<script id="registry-canonical-32-card-view-20260914">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  const names=['講師登録・変更','プリント書き込み消去・再印刷','講師給与計算・出力アプリ','講師名札印刷','子供用の時間制限アプリ','プリント書き込み消去・再印刷','経理ログイン管理','生徒マスタ','ステップ＆ゴール進捗管理','フォレスタ進捗管理','定期テスト進捗管理','スタッフ用アプリ','成績管理','面談メモ','エントリーシート読み取り','お友達紹介カード読み取り','V-code ID＆Pass 印刷','証憑自動回収','受付カード・エントリーシート読み取り','過去問保管DB','遅刻・欠席・早退連絡','STEP配信システム','不達メール管理','講師ポータル','コマ数報告してない連絡','LINE講師連絡システム','出退くんQR作成・読取','講師予定・夏休み出勤登録','請求システム','お問い合わせ管理','STEP業務ホーム','STEP統合管理ポータル','STEP塾生アプリ（step-hub）開発記録','ホームページニュース表示・更新システム','全県模試受験票作成','STEP請求書PDF作成・配信システム','時間割マスタ入力','フォレスタ進捗管理'];
  const sandbox={organizeEntryImport:()=>names.map((name,index)=>({'ID':name==='STEP請求書PDF作成・配信システム'?'step-invoice-pdf':name==='時間割マスタ入力'?'teacher-timetable-master-input':`id-${index}`,'システム名':name})),sortCustomizedCards:items=>items.slice().reverse()};
  vm.runInNewContext(script,sandbox);
  const result=sandbox.organizeEntryImport([]);
  assert.equal(result.length,32);
  assert.deepEqual(result.slice(0,2).map(item=>item['システム名']),['請求システム','経理ログイン管理']);
  assert.equal(result.filter(item=>item['システム名']==='プリント書き込み消去・再印刷').length,1);
  assert.equal(result.filter(item=>item['システム名']==='フォレスタ進捗管理').length,1);
  assert.ok(result.some(item=>item['システム名']==='STEP塾生アプリ（step-hub）開発記録'));
  assert.equal(result.find(item=>item['システム名']==='受付カード・エントリーシート読み取り')['読み取りURL'],'https://stepkobetsu-hub.github.io/seiseki-kanri/entry_import.html');
  assert.deepEqual(sandbox.sortCustomizedCards(result).slice(0,2).map(item=>item['システム名']),['請求システム','経理ログイン管理']);
});
