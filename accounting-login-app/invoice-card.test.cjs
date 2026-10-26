const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync(__dirname+'/Index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://accounting.example.test'});
const w=dom.window,d=w.document;
w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
let settingsSuccess,settingsFailure,settingsCalls=0,searchCalls=[];
const run={withSuccessHandler(fn){this.success=fn;return this;},withFailureHandler(fn){this.failure=fn;return this;},getInvoiceSettings(){settingsSuccess=this.success;settingsFailure=this.failure;settingsCalls++;},startInvoiceSearch(...args){searchCalls.push(args);}};
w.google={script:{run}};
const ui=dom.getInternalVMContext(),evaluate=code=>vm.runInContext(code,ui);
evaluate(script);
evaluate("sessionToken='test-session';");
const names=['エクシード','イージア','伊神切手社'];
const vendors=[{id:'exseed',name:names[0],builtin:true},{id:'esia',name:names[1],builtin:true},{id:'custom_test',name:names[2],builtin:false}];
const settings={vendors,mailbox:'test@example.test',folderUrl:'https://drive.google.com/drive/folders/test',folderName:'Test folder',ready:true,healthy:true};
d.getElementById('invoiceMonth').value='2026-09';
const entries=names.map((serviceName,i)=>({id:'test-'+i,serviceName,category:'その他',memo:'',url:'https://mail.google.com/'}));
d.getElementById('grid').innerHTML=entries.map((e,i)=>w.cardHtml(e,i)).join('')+w.cardHtml({id:'other',serviceName:'フォレスタ・スプリックス'},3);
for(const [i,name] of names.entries()){
  const card=d.querySelector('[data-id="test-'+i+'"]'),button=card.querySelector('.invoice-card-import');
  assert.equal(button.textContent,'領収書取込');
  assert.equal(button.previousElementSibling.className,'editIcon');
  assert.equal(button.closest('.cardhead'),card.querySelector('.cardhead'));
  d.getElementById('invoiceResults').textContent='previous company results';
  evaluate("invoiceItems=[{id:'old'}];invoiceSearchJob='old';invoiceConfirmation={nonce:'old'};");
  evaluate(button.getAttribute('onclick'));
  assert.equal(d.getElementById('invoiceResults').textContent,'');
  assert.equal(evaluate('invoiceItems.length'),0);
  assert.equal(evaluate('invoiceSearchJob'),'');
  assert.equal(evaluate('invoiceConfirmation'),null);
  assert.ok(d.getElementById('invoiceSearchBtn').disabled);
  assert.ok([...d.querySelectorAll('.invoice-card-import')].every(b=>b.disabled));
  assert.equal(d.getElementById('invoiceVendor').value,'');
  assert.equal(searchCalls.length,0,'opening a card must not search Gmail');
  settingsSuccess(settings);
  assert.equal(d.getElementById('invoiceVendor').value,vendors[i].id,name);
  assert.equal(d.getElementById('invoiceMonth').value,'2026-09');
  assert.ok(!d.getElementById('invoiceSearchBtn').disabled);
  assert.ok([...d.querySelectorAll('.invoice-card-import')].every(b=>!b.disabled));
  w.closeInvoices();
}
assert.equal(d.querySelector('[data-id="other"] .invoice-card-import'),null);
for(const [serviceName,vendor] of [
  ['エクシード・ロブロックス','エクシード'],
  ['イージア・マインクラフト','イージア'],
  ['エクシード（ロブロックス）','エクシード'],
  ['イージア / V-code','イージア'],
  ['伊神切手社・図書カード','伊神切手社']
]){
  const box=d.createElement('div');box.innerHTML=w.cardHtml({id:'suffix',serviceName},0);
  const button=box.querySelector('.invoice-card-import');
  assert.equal(button?.textContent,'領収書取込',serviceName);
  evaluate(button.getAttribute('onclick'));settingsSuccess(settings);
  assert.equal(d.getElementById('invoiceVendor').selectedOptions[0].textContent,vendor,serviceName);
  w.closeInvoices();
}
for(const serviceName of ['エクシード別会社','イージアム','別会社・エクシード']){
  assert.equal(w.invoiceCardVendor({serviceName}),'',serviceName);
}
evaluate('reorderMode=true');
assert.ok(!w.cardHtml(entries[0],0).includes('invoice-card-import'));
evaluate('reorderMode=false');
const calls=settingsCalls;
w.openInvoices('エクシード');w.openInvoices('イージア');
assert.equal(settingsCalls,calls+1,'ignore a second card while loading');
settingsSuccess(settings);
assert.equal(d.getElementById('invoiceVendor').value,'exseed');
w.closeInvoices();
w.openInvoices();settingsSuccess(settings);
assert.equal(d.getElementById('invoiceVendor').value,'exseed','header preserves selected company');
w.closeInvoices();
w.openInvoices('伊神切手社');settingsSuccess({...settings,vendors:vendors.slice(0,2)});
assert.equal(d.getElementById('invoiceVendor').value,'','removed vendor cannot fall back to another company');
w.searchInvoices();assert.equal(searchCalls.length,0);
w.closeInvoices();
w.openInvoices('エクシード');settingsFailure(new Error('Test settings error'));
assert.equal(d.getElementById('invoiceVendor').value,'');
assert.equal(d.getElementById('invoiceStatus').textContent,'Test settings error');
w.searchInvoices();assert.equal(searchCalls.length,0);
w.closeInvoices();
w.openInvoices('イージア');settingsSuccess(settings);w.searchInvoices();
assert.deepEqual(searchCalls,[['esia','2026-09','test-session']]);
dom.window.close();
console.log('PASS invoice-card placement, all 3 vendor routes, custom vendor lookup, preserved month, cleared results, busy guard, header route, removed vendor, settings failure, explicit search.');
