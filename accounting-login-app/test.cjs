const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const code=fs.readFileSync(__dirname+'/Code.gs','utf8');
const html=fs.readFileSync(__dirname+'/Index.html','utf8');
let rows,locked=false,seq=0;
const cells=(r,c,n=1,w=1)=>({
 getDisplayValues:()=>Array.from({length:n},(_,i)=>Array.from({length:w},(_,j)=>String(rows[r-1+i]?.[c-1+j]??''))),
 setValues(values){values.forEach((row,i)=>row.forEach((v,j)=>{rows[r-1+i]??=Array(11).fill('');rows[r-1+i][c-1+j]=String(v).replace(/^'/,'')}));return this},
 setNumberFormat(){return this},copyTo(){},setFormula(){rows[r-1][c-1]='開く'},setValue(v){rows[r-1][c-1]=v},clearContent(){rows[r-1][c-1]=''},
 createTextFinder(id){return {matchEntireCell(){return this},findNext(){const i=rows.findIndex((a,i)=>i>0&&a[9]===id);return i<0?null:{getRow:()=>i+1}}}}
});
const sheet={getLastRow:()=>rows.length,getRange:cells,getMaxRows:()=>1000,deleteRow:r=>rows.splice(r-1,1)};
const ss={getSheetByName:()=>sheet,getUrl:()=> 'https://docs.google.com/test'};
const ctx=vm.createContext({console,Set,PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'test'})},SpreadsheetApp:{openById:()=>ss,flush(){},CopyPasteType:{}},LockService:{getScriptLock:()=>({waitLock(){assert.equal(locked,false);locked=true},releaseLock(){locked=false}})},Utilities:{getUuid:()=>String(++seq).padStart(32,'0').split('').reverse().join(''),DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,v)=>crypto.createHash('sha256').update(v).digest(),base64EncodeWebSafe:v=>Buffer.from(v).toString('base64url')}});
vm.runInContext(code,ctx);
rows=[Array(11).fill(''),['その他','サービス','','https://example.com','00123','別途管理','','','memo','ACC-A','']];
let data=ctx.getAppData();assert.equal(data.entries[0].account,'00123');assert.equal(locked,false);
const original=data.entries[0];ctx.saveEntry({...original,memo:'updated'});assert.equal(rows[1][8],'updated');
assert.throws(()=>ctx.saveEntry({...original,memo:'stale'}),/更新/);assert.equal(locked,false);
assert.throws(()=>ctx.deleteEntry(original.id,original.revision),/更新/);
let fresh=ctx.getAppData().entries[0];ctx.deleteEntry(fresh.id,fresh.revision);assert.equal(rows.length,1);
assert.throws(()=>ctx.saveEntry(original),/削除/);
ctx.saveEntry({serviceName:'new',account:'0007',memo:'=IMPORTXML("evil")'});assert.equal(rows[1][4],'0007');assert.equal(rows[1][8],'=IMPORTXML("evil")');
rows.push([...rows[1]]);const repaired=ctx.getAppData().entries;assert.notEqual(repaired[0].id,repaired[1].id);
assert.throws(()=>ctx.saveEntry({serviceName:'bad',url:'javascript:alert(1)'}),/URL/);
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const nodes=new Map();const element=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',innerHTML:'',classList:{toggle(){}},setAttribute(){}});return nodes.get(id)};
const ui=vm.createContext({URL,console,document:{getElementById:element,addEventListener(){},querySelectorAll:()=>[]},window:{},navigator:{},setTimeout,clearTimeout});
vm.runInContext(script,ui);
assert.equal(ui.safeUrl('javascript:alert(1)'),'');assert.equal(ui.norm('ＡＢＣ　１２３'),'abc 123');
const attack={id:"x');alert(1);//",serviceName:'<script>evil</script>',category:"a');alert(1);//",url:'javascript:alert(1)',account:'123',memo:'<img onerror=alert(1)>'};
const card=ui.cardHtml(attack);assert.ok(!card.includes('<script>'));assert.ok(card.includes('openEditor(&quot;'));assert.ok(!card.includes('src="javascript:'));
vm.runInContext("entries=[{category:'bank',serviceName:'ABC',account:'001',memo:'Receipt'}];",ui);element('search').value='ｒｅｃｅｉｐｔ';assert.equal(ui.filtered().length,1);
vm.runInContext("activeCategory='removed'",ui);ui.renderChips();assert.equal(vm.runInContext('activeCategory',ui),'すべて');
console.log('PASS: CRUD, stale edits/deletes, deleted record, ID zeros, duplicate IDs, URL safety, escaping, normalized search, filter reset; server/client syntax.');
