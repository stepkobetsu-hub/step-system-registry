const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const code=fs.readFileSync(__dirname+'/Code.gs','utf8');
const html=fs.readFileSync(__dirname+'/Index.html','utf8');
let rows,locked=false,seq=0,user='owner';const stores={owner:new Map(),other:new Map()};const userProps=()=>({getProperties:()=>Object.fromEntries(stores[user]),getProperty:k=>stores[user].get(k)??null,setProperty:(k,v)=>stores[user].set(k,v),deleteProperty:k=>stores[user].delete(k)});
const cells=(r,c,n=1,w=1)=>({
 getDisplayValue:()=>String(rows[r-1]?.[c-1]??''),
 getDisplayValues:()=>Array.from({length:n},(_,i)=>Array.from({length:w},(_,j)=>String(rows[r-1+i]?.[c-1+j]??''))),
 setValues(values){values.forEach((row,i)=>row.forEach((v,j)=>{rows[r-1+i]??=Array(12).fill('');rows[r-1+i][c-1+j]=String(v).replace(/^'/,'')}));return this},
 setNumberFormat(){return this},copyTo(){},setFormula(){rows[r-1][c-1]='開く'},setValue(v){rows[r-1][c-1]=v},clearContent(){rows[r-1][c-1]=''},
 createTextFinder(id){return {matchEntireCell(){return this},findNext(){const i=rows.findIndex((a,i)=>i>0&&a[9]===id);return i<0?null:{getRow:()=>i+1}}}}
});
const sheet={getLastRow:()=>rows.length,getRange:cells,getMaxRows:()=>1000,deleteRow:r=>rows.splice(r-1,1)};
const ss={getSheetByName:()=>sheet,getUrl:()=> 'https://docs.google.com/test'};
const ctx=vm.createContext({console,Set,PropertiesService:{getUserProperties:userProps,getScriptProperties:()=>({getProperty:()=> 'test'})},SpreadsheetApp:{openById:()=>ss,flush(){},CopyPasteType:{}},LockService:{getScriptLock:()=>({waitLock(){assert.equal(locked,false);locked=true},releaseLock(){locked=false}})},Utilities:{getUuid:()=>String(++seq).padStart(32,'0').split('').reverse().join(''),DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,v)=>crypto.createHash('sha256').update(v).digest(),base64EncodeWebSafe:v=>Buffer.from(v).toString('base64url')}});
vm.runInContext(code,ctx);
rows=[Array(12).fill(''),['その他','サービス','','https://example.com','00123','別途管理','','','memo','ACC-A','']];
let data=ctx.getAppData();assert.equal(data.entries[0].account,'00123');assert.equal(locked,false);
const original=data.entries[0];ctx.saveEntry({...original,memo:'updated'});assert.equal(rows[1][8],'updated');
assert.throws(()=>ctx.saveEntry({...original,memo:'stale'}),/更新/);assert.equal(locked,false);
assert.throws(()=>ctx.deleteEntry(original.id,original.revision),/更新/);
let fresh=ctx.getAppData().entries[0];ctx.deleteEntry(fresh.id,fresh.revision);assert.equal(rows.length,1);
assert.throws(()=>ctx.saveEntry(original),/削除/);
ctx.saveEntry({serviceName:'new',account:'0007',memo:'=IMPORTXML("evil")'});assert.equal(rows[1][4],'0007');assert.equal(rows[1][8],'=IMPORTXML("evil")');
rows.push([...rows[1]]);const repaired=ctx.getAppData().entries;assert.notEqual(repaired[0].id,repaired[1].id);
assert.throws(()=>ctx.saveEntry({serviceName:'bad',url:'javascript:alert(1)'}),/URL/);
// Secrets must stay out of rows/list responses; storage follows the Google user.
rows=[Array(12).fill('')];
const created=ctx.saveEntry({serviceName:'secret test',passwordAction:'set',password:'DUMMY-only!'}).entry;
assert.equal(ctx.getPassword(created.id).password,'DUMMY-only!');
assert.equal(JSON.stringify(rows).includes('DUMMY-only!'),false);
assert.equal(JSON.stringify(ctx.getAppData()).includes('DUMMY-only!'),false);
user='other';assert.equal(ctx.getPassword(created.id).hasPassword,false);user='owner';
ctx.saveEntry({...created,passwordAction:'set',password:'DUMMY-changed!'});
assert.equal(ctx.getPassword(created.id).password,'DUMMY-changed!');
ctx.clearPassword(created.id);assert.equal(ctx.getPassword(created.id).hasPassword,false);
const second=ctx.saveEntry({serviceName:'second'}).entry;
let order=ctx.getAppData().entries.map(x=>x.id);
ctx.saveCardOrder([...order].reverse(),order);
assert.deepEqual(Array.from(ctx.getAppData().entries.map(x=>x.id)),[second.id,created.id]);
assert.throws(()=>ctx.saveCardOrder(order,order),/並び順/);
const last=ctx.saveEntry({serviceName:'last'}).entry;
assert.equal(ctx.getAppData().entries.at(-1).id,last.id);
assert.throws(()=>ctx.saveCardOrder([created.id,created.id],order),/重複/);
assert.throws(()=>ctx.saveEntry({serviceName:'invalid',passwordAction:'invalid'}),/不正/);
ctx.saveEntry({...last,passwordAction:'set',password:'DUMMY-delete!'});
const latest=ctx.getAppData().entries.find(x=>x.id===last.id);ctx.deleteEntry(last.id,latest.revision);
assert.equal(stores.owner.has('ACCOUNTING_SECRET_'+last.id),false);
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const nodes=new Map();const element=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',innerHTML:'',classList:{toggle(){}},setAttribute(){}});return nodes.get(id)};
const ui=vm.createContext({URL,console,document:{getElementById:element,addEventListener(){},querySelectorAll:()=>[]},window:{},navigator:{},setTimeout,clearTimeout});
vm.runInContext(script,ui);
assert.equal(ui.safeUrl('javascript:alert(1)'),'');assert.equal(ui.norm('ＡＢＣ　１２３'),'abc 123');
const attack={id:"x');alert(1);//",serviceName:'<script>evil</script>',category:"a');alert(1);//",url:'javascript:alert(1)',account:'123',memo:'<img onerror=alert(1)>'};
const card=ui.cardHtml(attack);assert.ok(!card.includes('<script>'));assert.ok(card.includes('openEditor(&quot;'));assert.ok(!card.includes('src="javascript:'));
vm.runInContext("entries=[{category:'bank',serviceName:'ABC',account:'001',memo:'Receipt'}];",ui);element('search').value='ｒｅｃｅｉｐｔ';assert.equal(ui.filtered().length,1);
vm.runInContext("activeCategory='removed'",ui);ui.renderChips();assert.equal(vm.runInContext('activeCategory',ui),'すべて');
console.log('PASS: private per-user password lifecycle, no secret in Sheets or list, 12-column order persistence, stale order rejection, append at bottom;  CRUD, stale edits/deletes, deleted record, ID zeros, duplicate IDs, URL safety, escaping, normalized search, filter reset; server/client syntax.');
