const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/Index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const nodes=new Map(),element=id=>{if(!nodes.has(id))nodes.set(id,{value:'',classList:{},textContent:''});return nodes.get(id)};
const ui=vm.createContext({URL,document:{getElementById:element,addEventListener(){}},window:{addEventListener(){}},setTimeout,clearTimeout});
vm.runInContext(script,ui);
vm.runInContext(`entries=[
  {id:'bank',category:'銀行',serviceName:'三井住友銀行',account:'00123',memo:'法人用'},
  {id:'okb',category:'銀行',serviceName:'大垣共立銀行'},
  {id:'power',category:'光熱費',serviceName:'中部電力',memo:'神領教室'},
  {id:'amazon',category:'通販',serviceName:'Amazon',account:'sample@example.com'},
  {id:'card',category:'カード・決済',serviceName:'カード管理'},
  {id:'line',category:'通信',serviceName:'LINE'},
  {id:'memo',category:'その他',serviceName:'新サービス',memo:'やまもと商店'},
  {id:'school',category:'教材・仕入',serviceName:'教育開発出版'}
];`,ui);
let cases=0;
function expect(query,ids){element('search').value=query;assert.deepEqual(Array.from(ui.filtered(),e=>e.id),ids,query);cases++;}
for(const q of ['三井住友','みついすみとも','ミツイスミトモ','ﾐﾂｲｽﾐﾄﾓ','mitsuisumitomo','mituisumitomo','ＭＩＴＳＵＩＳＵＭＩＴＯＭＯ','mitsu','mit'])expect(q,['bank']);
for(const q of ['大垣共立','おおがききょうりつ','オオガキキョウリツ','oogakikyouritsu','ogakikyori'])expect(q,['okb']);
for(const q of ['中部電力','ちゅうぶでんりょく','チュウブデンリョク','chuubudenryoku','tyubudenryoku'])expect(q,['power']);
for(const q of ['Amazon','amazon','あまぞん','アマゾン','ｱﾏｿﾞﾝ'])expect(q,['amazon']);
for(const q of ['カード','かーど','kaado','kado'])expect(q,['card']);
for(const q of ['LINE','らいん','ライン','rain'])expect(q,['line']);
for(const q of ['山本','やまもと','ヤマモト','yamamoto'])expect(q,q==='山本'?[]:['memo']);
expect('三井 銀行',['bank']);expect('ぎんこう　みつい',['bank']);expect('mitsui ginkou',['bank']);
expect('通販 sample',['amazon']);expect('００１２３',['bank']);expect('mitsui 電力',[]);
expect('kyouiku kaihatsu',['school']);expect('ないはず',[]);expect('　',Array.from(vm.runInContext('entries',ui),e=>e.id));
vm.runInContext("activeCategory='通信'",ui);expect('みつい',[]);expect('line',['line']);
vm.runInContext('reorderMode=true',ui);expect('みつい',['bank']);
vm.runInContext("entries[0].serviceName='ゆうちょ銀行'",ui);expect('みつい',[]);expect('yuucho',['bank']);
console.log(`PASS ${cases} search cases: kanji/kana/romaji, partial typing, long vowels, aliases, multiple words, categories, reorder, changed-entry cache; HTML script syntax.`);
