const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const source=fs.readFileSync(__dirname+'/Code.gs','utf8')+'\n'+fs.readFileSync(__dirname+'/OfficeSupply.gs','utf8');
const properties=new Map(),files=new Map();let seq=0,httpCalls=[],mailList=[],messages={},owner='mintcocoajasmine@gmail.com';
class BlobMock {
  constructor(v,name=''){this.bytes=Buffer.isBuffer(v)?Buffer.from(v):Buffer.from(Array.isArray(v)?v:String(v));this.name=name;}
  getBytes(){return [...this.bytes];}getDataAsString(){return this.bytes.toString('utf8');}setContentType(){return this;}setName(n){this.name=n;return this;}copyBlob(){return new BlobMock(this.bytes,this.name);}
}
const pdf=Buffer.from('%PDF-1.7\nsynthetic office invoice\n%%EOF');
const ctx={console,Date,Utilities:{newBlob:(v,_,name)=>new BlobMock(v,name),base64Decode:s=>[...Buffer.from(s,'base64')],base64Encode:b=>Buffer.from(b).toString('base64'),computeDigest:(_,v)=>[...crypto.createHash('sha256').update(Array.isArray(v)?Buffer.from(v):v).digest()],DigestAlgorithm:{SHA_256:'SHA_256'},getUuid:()=>String(++seq).padStart(32,'0'),formatDate:d=>d.toISOString().slice(0,10).replace(/-/g,'/')},PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties.get(k)||null,setProperty:(k,v)=>properties.set(k,v),getProperties:()=>Object.fromEntries(properties),deleteProperty:k=>properties.delete(k)})},Gmail:{Users:{Messages:{list:()=>({messages:mailList}),get:(_,id)=>messages[id]}}},DriveApp:{createFile:blob=>{
  const id='file-'+(++seq),f={id,blob:blob.copyBlob(),name:blob.name,trashed:false,getId(){return this.id;},getName(){return this.name;},getBlob(){return this.blob.copyBlob();},isTrashed(){return this.trashed;},setTrashed(v){this.trashed=v;return this;}};files.set(id,f);return f;
},getFileById:id=>{assert(files.has(id));return files.get(id);}},UrlFetchApp:{fetch:(url,options)=>{
  httpCalls.push({url,options});if(options.method==='post'){assert.match(options.payload,/password=synthetic-secret/);return response(detailHtml);}
  if(url.includes('reciveFileDownload')){assert.match(url,/zip=false/);assert(!url.includes('圧縮'));return response(pdf);}
  return response(authHtml);
}}};
vm.createContext(ctx);vm.runInContext(source,ctx);ctx.requireAppSession_=()=> 'test-admin';
ctx.invOcr_=()=>ocr;
const button='I3tkb3dubG9hZEFjdGlvbi5wYXNzd29yZENoZWNrfQ==',down='I3tkb3dubG9hZEFjdGlvbi5yZWNpdmVGaWxlRG93bmxvYWR9';
const authHtml=`<h2>パスワード認証</h2><form action="/user/receiver/detail.do" method="post"><input type="hidden" name="SI" value="test-si"><input type="hidden" name="RI" value="test-ri"><input type="hidden" name="job" value=""><input type="password" name="password"><input type="submit" name="${button}" value="OK"></form>`;
const subject='【オフィス桃太郎(オフィスサプライ株式会社）】2026年9月分請求書お送りいたします。',filename='2026年09月請求書_テスト会社_111111.pdf';
const detailHtml=`<h2>ファイルダウンロード</h2><td>seikyu@office-supply.biz</td><td>${subject}</td><td>${filename}</td><form action="/user/receiver/reciveFileDownload.do" method="get"><input type="hidden" name="org.apache.struts.taglib.html.TOKEN" value="test-csrf"><input type="hidden" name="SI" value="test-si"><input type="hidden" name="RI" value="test-ri"><input type="hidden" name="job"><input type="hidden" name="zip"><input type="submit" id="down_nml_btn" name="${down}" value="ダウンロード"><input type="submit" id="down_zip_btn" name="${down}" value="圧縮ダウンロード"></form>`;
function response(body,status=200,headers={}) {return {getResponseCode:()=>status,getAllHeaders:()=>({'Set-Cookie':['JSESSIONID=synthetic-session; Secure; HttpOnly'],...headers}),getContentText:()=>String(body),getBlob:()=>new BlobMock(body)};}
function message(id,pw=false,changes={}) {
  const body=pw?'テスト 様\nパスワード： synthetic-secret\n\nご確認ください。':`受取URL： https://asp.gigacc.com/user/~ta/abcdefghijklmnopqrstuvwx\nファイル：\n ${filename}\n認証パスワード設定：有り`;
  const value={id,internalDate:String(Date.parse('2026-10-09T07:43:54Z')),payload:{headers:[{name:'From',value:'GigaCC <info@gigacc.com>'},{name:'Reply-To',value:'"経理部" <seikyu@office-supply.biz>'},{name:'To',value:`"テスト" <${owner}>`},{name:'Subject',value:(pw?'[Password]： ':'')+subject},{name:'Content-Type',value:'text/plain;charset=UTF-8'}],mimeType:'text/plain',body:{data:Buffer.from(body).toString('base64url')}}};
  return {...value,...changes};
}
const ocr='請 求 書\nオフィスサプライ株式会社\nお客様コード 日 付 締 切 日 伝票枚数 お支払予定日\n111111 2026/10/09 2026/09/30 2 2026/10/27\n前 回 御 請 求 額 今 回 御 入 金 額 繰 越 額 今回請求御買上額 今 回 御 請 求 額\n1,100 1,100 0 7,358 7,358\n上記の通り御請求申し上げます。 1頁 合 計 7,358 1,100\n';
assert.equal(ctx.officeParse_(ocr).due,'2026-10-27');assert.equal(ctx.officeParse_(ocr).amount,7358);
assert.equal(ctx.officeParse_(ocr.replace('7,358 1,100\n','7,358 1,100\n合計 7,359 1,100\n')).amount,null,'conflicting totals need manual review');
assert.equal(ctx.officeParse_(ocr.replace('お支払予定日','別の日付')).due,'','do not adopt invoice date or cutoff');
assert.throws(()=>ctx.officeParse_('別会社 請求書'),/確認できません/);
const reordered='請 求 書 オフィスサプライ株式会社\n伝票枚数日付締切日お客様コード お支払予定日\n111111 2026/09/30\n10月27日口座引落になります。\n2026/10/09\n2\n2026/10/27\n今 回 御 入 金 額 繰 越 額前 回 御 請 求 額 今回請求御買上額 今 回 御 請 求 額 1,100 1,100 0 7,358 6,689\n外税\n669\n月日 商品名\n合計\n1頁 1,1007,358';
assert.equal(ctx.officeParse_(reordered).due,'2026-10-27');assert.equal(ctx.officeParse_(reordered).amount,7358,'balance equations recover the current total from reordered OCR');
assert.equal(ctx.officeParse_(reordered.replace('6,689','6,690')).amount,null,'inconsistent balance is not guessed');
assert.equal(ctx.officeParse_(reordered.replace('2026/10/27','2026/10/28')).due,'','withdrawal hint must match a full date');
const m=message('link-message'),p=message('password-message',true);messages={'link-message':m,'password-message':p};mailList=[{id:p.id}];
const envelope=ctx.officeEnvelope_(m);assert.equal(envelope.billingMonth,'2026-09');assert.equal(ctx.officeFindPassword_(envelope).password,'synthetic-secret');
m.payload.headers.find(h=>h.name==='Content-Type').value='text/plain; charset=iso-2022-jp';
assert.equal(ctx.officeEnvelope_(m).filename,filename,'Gmail UTF-8 bytes with original ISO-2022-JP header');
m.payload.headers.find(h=>h.name==='Content-Type').value='text/plain;charset=UTF-8';
messages.duplicate=message('duplicate',true);mailList.push({id:'duplicate'});assert.throws(()=>ctx.officeFindPassword_(envelope),/1通に照合/);mailList.pop();
const savedTo=p.payload.headers.find(x=>x.name==='To').value;p.payload.headers.find(x=>x.name==='To').value='Other <other@example.test>';assert.throws(()=>ctx.officeFindPassword_(envelope),/1通に照合/);p.payload.headers.find(x=>x.name==='To').value=savedTo;
p.internalDate=String(+m.internalDate+300001);assert.throws(()=>ctx.officeFindPassword_(envelope),/1通に照合/);p.internalDate=m.internalDate;
for(const url of ['https://evil.test/user/receiver/detail.do','https://asp.gigacc.com.evil.test/user/receiver/detail.do','https://asp.gigacc.com:443/user/receiver/detail.do','//evil.test/user/receiver/detail.do','/user/receiver/detail.do#bad'])assert.throws(()=>ctx.officeUrl_(url));
assert.throws(()=>ctx.officeForm_(authHtml+authHtml,false),/確認できません/);
assert.throws(()=>ctx.officeForm_(authHtml.replace('</form>','<input type="hidden" name="external" value="bad"></form>'),false),/変更されています/);
const job={id:'a'.repeat(32),admin:'test-admin',type:'search',vendor:'officesupply',month:'2026-10',status:'done',created:Date.now(),items:[]};
ctx.officeReadMessage_(job,m.id,m);assert.equal(job.items.length,1);assert.equal(httpCalls.length,3);
const persisted=JSON.stringify([...properties]);assert(!persisted.includes('synthetic-secret'));assert(!persisted.includes('synthetic-session'));assert(!persisted.includes('test-csrf'));assert(!persisted.includes('abcdefghijklmnopqrstuvwx'));
ctx.invWrite_('INV_JOB_V1_'+job.id,job);
const downloaded=ctx.downloadOfficeInvoice(job.id,job.items[0],'2026-10-27','7358','test-token');
assert.equal(downloaded.filename,'20261027_オフィスサプライカウンター料金_7358.pdf');assert.deepEqual(Buffer.from(downloaded.data,'base64'),pdf);
assert.throws(()=>ctx.downloadOfficeInvoice(job.id,job.items[0],'2026-09-27','7358','test-token'),/支払日/);
assert.throws(()=>ctx.downloadOfficeInvoice(job.id,'foreign-item','2026-10-27','7358','test-token'),/検索結果/);
const again={...job,items:[]};ctx.officeReadMessage_(again,m.id,m);assert.equal(again.items.length,1);assert.equal(httpCalls.length,3,'reuse verified cached PDF without consuming another download');
ctx.officeReadMessage_({...job,month:'2026-11',items:[]},m.id,m);assert.equal(httpCalls.length,3,'skip unrelated months before authentication');
const entry=files.values().next().value;entry.blob=new BlobMock('%PDF-changed');assert.throws(()=>ctx.downloadOfficeInvoice(job.id,job.items[0],'2026-10-27','7358','test-token'),/変更されました/);
entry.blob=new BlobMock(pdf);const key=[...properties.keys()].find(x=>x.startsWith('INV_OFFICE_CACHE_V1_'));const cache=JSON.parse(properties.get(key));cache.created=Date.now()-86400001;properties.set(key,JSON.stringify(cache));ctx.officeCleanup_();assert(entry.trashed);assert(!properties.has(key));
console.log('PASS Office Supply: exact mail pairing, ambiguity/recipient/time/URL rejection, fixed form/cookie handling, uncompressed PDF byte equality, payment date and total, cached reuse, ownership checks, tamper detection, expired temporary-file cleanup, no password/session persistence. HTTP/Drive/Gmail simulated.');
