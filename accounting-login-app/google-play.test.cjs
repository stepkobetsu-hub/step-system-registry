const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const code=fs.readFileSync(__dirname+'/Code.gs','utf8');
let converted=0,rendered='';
function blob(value,type='text/plain',name='test'){
  const bytes=Array.isArray(value)||Buffer.isBuffer(value)?Buffer.from(value):Buffer.from(String(value),'utf8');
  return {getBytes:()=>Array.from(bytes),getDataAsString:()=>bytes.toString('utf8'),getContentType:()=>type,setContentType(v){type=v;return this;},setName(v){name=v;return this;},getName:()=>name,getAs(){converted++;rendered=bytes.toString();return blob('%PDF-1.4 synthetic '+converted,'application/pdf','test.pdf');}};
}
const context=vm.createContext({console,URL,Utilities:{newBlob:blob,DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,v)=>Array.from(crypto.createHash('sha256').update(Buffer.from(v)).digest()),base64Decode:v=>Array.from(Buffer.from(v,'base64'))}});
vm.runInContext(code,context);
const subject='Google Play のご注文明細（ご注文: 2026/09/12）';
const body='Google Play\n注文番号: SOP.1111-2222-3333-44444..7\n注文日: 2026/09/12 09:00:00 JST\nお客様のアカウント: first@example.test\nアイテム 価格\n200 GB (Google One) ￥440/月\n合計: ￥440/月\n（消費税 ￥40 込み）';
function message(text=body,from='Google Play <googleplay-noreply@google.com>',sub=subject){return {payload:{headers:[{name:'From',value:from},{name:'Subject',value:sub},{name:'To',value:'first@example.test'},{name:'Date',value:'Sat, 12 Sep 2026 09:00:00 +0900'}],parts:[{mimeType:'text/plain',body:{data:Buffer.from(text).toString('base64url')}}]}};}
let parsed=context.invParseGooglePlay_(body,subject);
assert.equal(parsed.due,'2026-09-12');assert.equal(parsed.amount,440);assert.equal(parsed.account,'first@example.test');
assert.equal(context.invParseGooglePlay_(body.replace('合計: ￥440/月','合計: ￥1,234/月'),subject).amount,1234);
assert.equal(context.invParseGooglePlay_(body+'\n合計: ￥550',subject).amount,null);
assert.equal(context.invParseGooglePlay_(body+'\n注文日: 2026/09/13',subject).due,'');
assert.equal(context.invParseGooglePlay_(body.replace('合計: ￥440/月','合計: ￥440.5/月'),subject).amount,null);
assert.equal(context.invParseGooglePlay_(body.replace('2026/09/12','2026/02/30'),subject).due,'');
assert.throws(()=>context.invGooglePlayRecord_(message(body,'Google Play <fake@example.test>')),/ご注文明細/);
assert.throws(()=>context.invGooglePlayRecord_(message(body,undefined,'定期購入は来月に更新されます')),/ご注文明細/);
const stored=new Map();let sequence=0,source=message();
Object.assign(context,{invRead_:key=>stored.get(key),invWrite_:(key,v)=>stored.set(key,v),invId_:()=>String(++sequence).padStart(32,'0')});
const cfg={name:'Google Play'},j={items:[],vendor:'googleplay',month:'2026-09',account:'first@example.test'};
context.invReadGooglePlay_(j,'message-test',source,cfg);
assert.equal(j.items.length,1);assert.equal(converted,0,'search must not create PDF');
const item=stored.get('INV_ITEM_V1_'+j.items[0]);assert.equal(item.account,'first@example.test');
context.invReadGooglePlay_(j,'message-test',source,cfg);assert.equal(j.items.length,1,'duplicate email');
const other={...j,items:[],account:'second@example.test'};context.invReadGooglePlay_(other,'message-test',source,cfg);assert.equal(other.items.length,0,'account isolation');
const month={...j,items:[],month:'2026-08'};context.invReadGooglePlay_(month,'message-test',source,cfg);assert.equal(month.items.length,0,'month isolation');
context.Gmail={Users:{Messages:{get:()=>source}}};
context.invReadMessage_({...j,items:[],vendorConfig:{...cfg,builtin:true}},'message-test');
assert.equal(converted,0);
let files=[];
function file(value,name){let description='';return {getBlob:()=>value,getName:()=>name,getMimeType:()=>value.getContentType(),getDescription:()=>description,setDescription(v){description=v;return this;},getUrl:()=>'https://drive.google.com/file/test/'+name};}
const folder={getFilesByName(name){const found=files.filter(f=>f.getName()===name);let n=0;return {hasNext:()=>n<found.length,next:()=>found[n++]};},createFile(value){const f=file(value,value.getName());files.push(f);return f;}};
context.DriveApp={getFolderById:()=>folder};context.invCheckFolder_=()=>({folderId:'test-folder'});
const job={itemId:item.id,preview:{folderId:'test-folder',filename:'20260912_Google Play_440_SOP.test.pdf'}};
const saved=context.invSave_(job);assert.equal(saved.existing,false);assert.equal(files.length,1);
assert.ok(rendered.includes('メール本文をPDF化したものです。'));
assert.ok(rendered.includes('first@example.test'));assert.ok(!rendered.includes('<img'));
const again=context.invSave_(job);assert.equal(again.existing,true);assert.equal(files.length,1,'PDF conversion timestamps do not duplicate the saved receipt');
files[0].setDescription('tampered');assert.throws(()=>context.invSave_(job),/同じ名前で内容が異なる/);assert.equal(files.length,1);
source=message(body.replace('￥440/月','￥550/月'));assert.throws(()=>context.invSave_(job),/メールが変更/);assert.equal(files.length,1);
source=message(body+'\n<script>alert(1)</script>');context.invGooglePlayPdf_(context.invGooglePlayRecord_(source));assert.ok(rendered.includes('&lt;script&gt;'));assert.ok(!rendered.includes('<script>'));
let request;
context.PropertiesService={getScriptProperties:()=>({getProperties:()=>({})})};
context.requireAppSession_=()=>{};context.invNewJob_=(type,data,token)=>{request={type,data,token};return request;};
context.startInvoiceSearch('googleplay','2026-09','first@example.test','synthetic-token');assert.equal(request.token,'synthetic-token');assert.equal(request.data.account,'first@example.test');
context.startInvoiceSearch('esia','2026-09','synthetic-token');assert.equal(request.token,'synthetic-token');assert.equal(request.data.account,'','old callers remain supported');
assert.throws(()=>context.startInvoiceSearch('googleplay','2026-09','invalid','token'),/アカウント/);
console.log('PASS Google Play receipt parsing, source validation, account/month isolation, no PDF on search, PDF escaping, duplicate/tamper guards, old API callers.');

