const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync(__dirname+'/Index.html','utf8');
const source=html.match(/<script>([\s\S]*)<\/script>/)[1].replace('    initializeSession();','');
const token='a'.repeat(64),other='b'.repeat(64);
const data={adminId:'1234',entries:[{id:'test',serviceName:'Test',url:'https://example.com',account:'test-account',memo:'private memo',sortOrder:1,password:'MUST-NOT-CACHE',hasPassword:true,revision:'r1'}]};
const flush=()=>new Promise(r=>setTimeout(r,40));
function setup(){
 const dom=new JSDOM(html,{url:'https://example.test',runScripts:'outside-only'}),w=dom.window;
 Object.defineProperty(w,'crypto',{value:require('node:crypto').webcrypto});w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.AbortController=AbortController;
 let fetchResolve,fetchReject;w.fetch=()=>new Promise((res,rej)=>{fetchResolve=res;fetchReject=rej});w.alert=()=>{};
 let serverSuccess,serverFailure;const runner={withSuccessHandler(fn){serverSuccess=fn;return runner},withFailureHandler(fn){serverFailure=fn;return runner},getAppData(){}};
 w.google={script:{run:runner}};w.eval=code=>require('node:vm').runInContext(code,dom.getInternalVMContext());w.eval(source);w.localStorage.setItem('accounting-login-app.admin-session.v2',token);w.eval('sessionToken=storedSession()');
 return{w,dom,respond:value=>fetchResolve({ok:true,json:async()=>value}),reject:err=>fetchReject(err),serverFail:err=>serverFailure(err)};
}
(async()=>{
 const a=setup(),w=a.w;w.__data=data;await w.eval('savePreview(__data)');
 const encrypted=w.localStorage.getItem('accounting-login-app.preview.v1');assert(encrypted);assert(!encrypted.includes('test-account'));assert(!encrypted.includes('private memo'));
 const envelope=JSON.parse(encrypted),key=await w.eval('previewKey(sessionToken)');
 const bytes=await w.crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(envelope.iv)},key,new Uint8Array(envelope.cipher));
 const cached=JSON.parse(new TextDecoder().decode(bytes));assert(!('password' in cached.data.entries[0]));
 w.eval('initializeSession()');await flush();assert.equal(w.document.getElementById('appView').hidden,false);assert.equal(w.document.getElementById('loading').classList.contains('show'),false);assert.equal(w.eval('pending'),true);assert.match(w.document.getElementById('sessionUser').textContent,/確認中/);assert.equal(w.document.getElementById('grid').children.length,1);
 w.eval('openEditor("test")');assert.equal(w.document.getElementById('editDialog').open,false);
 a.respond({ok:true,staffCode:'1234',entries:[{...data.entries[0],serviceName:'Fresh'}]});await flush();assert.equal(w.eval('pending'),false);assert.match(w.document.getElementById('grid').textContent,/Fresh/);assert.equal(w.eval('previewActive'),false);
 const b=setup();b.w.localStorage.setItem('accounting-login-app.preview.v1',encrypted);b.w.localStorage.setItem('accounting-login-app.admin-session.v2',other);b.w.eval('initializeSession()');await flush();assert.equal(b.w.document.getElementById('appView').hidden,true);
 const c=setup();c.w.localStorage.setItem('accounting-login-app.preview.v1',encrypted);c.w.eval('initializeSession()');await flush();c.reject(new Error('offline'));await flush();c.serverFail(new Error('APP_SESSION_REQUIRED'));assert.equal(c.w.document.getElementById('appView').hidden,true);assert.equal(c.w.localStorage.getItem('accounting-login-app.preview.v1'),null);assert.equal(c.w.localStorage.getItem('accounting-login-app.admin-session.v2'),null);
 const d=setup();d.w.localStorage.setItem('accounting-login-app.preview.v1','corrupt');d.w.eval('initializeSession()');await flush();assert.equal(d.w.document.getElementById('appView').hidden,true);d.respond({ok:true,staffCode:'1234',entries:[]});await flush();assert.equal(d.w.document.getElementById('appView').hidden,false);
 w.__data=data;const race=w.eval('savePreview(__data)');w.eval('clearStoredSession();showLogin()');await race;assert.equal(w.localStorage.getItem('accounting-login-app.preview.v1'),null);
 for(const x of[a,b,c,d])x.dom.window.close();
 console.log('PASS: encrypted allowlist, immediate preview, edit gating, fresh data, session isolation, invalid-session cleanup, corrupt-cache fallback, logout/write race');
})().catch(e=>{console.error(e);process.exit(1)});
