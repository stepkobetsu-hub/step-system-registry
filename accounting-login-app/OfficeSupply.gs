// Office Supply: use the existing read-only Gmail connection and GigaCC's
// observed password form / uncompressed download form. Never persist passwords.
const OFFICE_CACHE_PREFIX = 'INV_OFFICE_CACHE_V1_';
const OFFICE_TEMP_PREFIX = 'STEP_請求書取込一時_';
const OFFICE_ORIGIN = 'https://asp.gigacc.com';
const OFFICE_AUTH_BUTTON = 'I3tkb3dubG9hZEFjdGlvbi5wYXNzd29yZENoZWNrfQ==';
const OFFICE_DOWNLOAD_BUTTON = 'I3tkb3dubG9hZEFjdGlvbi5yZWNpdmVGaWxlRG93bmxvYWR9';

function officeText_(parts) {
  return parts.filter(p=>p.mimeType==='text/plain'||p.mimeType==='text/html').map(p=>{
    if(!p.body||!p.body.data)return '';
    const bytes=invDecode_(p.body.data),blob=Utilities.newBlob(bytes),utf8=blob.getDataAsString('UTF-8');
    // Gmail can return UTF-8 body bytes while retaining the original ISO-2022-JP
    // MIME header. Prefer a valid UTF-8 decode, otherwise honor the MIME charset.
    const ct=invHeader_(p,'Content-Type'),cs=(ct.match(/charset=["']?([^;"'\s]+)/i)||[])[1]||'UTF-8';
    const text=!bytes.includes(27)&&!utf8.includes('�')?utf8:blob.getDataAsString(cs);
    if(text.includes('�'))throw new Error('メール本文の日本語を読み取れませんでした。');
    return p.mimeType==='text/html'?officeEntity_(text.replace(/<[^>]*>/g,' ')):text;
  }).join('\n');
}
function officeMail_(msg, passwordMail) {
  const p=msg.payload||{},subject=invHeader_(p,'Subject').normalize('NFKC').trim();
  const address=s=>(String(s).match(/(?:^|<)([a-z0-9.!#$%&'*+\-/=?^_`{|}~]+@[a-z0-9.-]+\.[a-z]{2,})(?:>|$)/i)||[])[1]||'';
  const isPassword=/^\[Password\]\s*[:：]\s*/i.test(subject);
  const base=subject.replace(/^\[Password\]\s*[:：]\s*/i,'');
  const billing=base.match(/^【オフィス桃太郎\(オフィスサプライ株式会社\)】(20\d{2})年(\d{1,2})月分請求書お送りいたします。$/);
  if(isPassword!==passwordMail||!billing||address(invHeader_(p,'From')).toLowerCase()!=='info@gigacc.com'||address(invHeader_(p,'Reply-To')).toLowerCase()!=='seikyu@office-supply.biz')return null;
  const to=invHeader_(p,'To').toLowerCase();
  if(!new RegExp('(?:^|[<\\s,])'+invEscapeRe_(INV_OWNER)+'(?:>|[\\s,]|$)','i').test(to))return null;
  const time=Number(msg.internalDate);if(!Number.isFinite(time)||time<=0)return null;
  return {id:msg.id,subject:base,time,billingMonth:billing[1]+'-'+billing[2].padStart(2,'0'),body:officeText_(invParts_(p))};
}
function officeEnvelope_(msg) {
  const m=officeMail_(msg,false);if(!m)return null;
  const links=[...new Set(m.body.match(/https:\/\/asp\.gigacc\.com\/user\/~ta\/[a-z0-9]{20,80}\b/g)||[])];
  const files=[...new Set((m.body.match(/20\d{2}年\d{2}月請求書_[^\r\n<>]{1,180}\.pdf/g)||[]).map(x=>x.trim()))];
  if(links.length!==1||files.length!==1)throw new Error('オフィスサプライの受取URL・PDFを一意に確認できません。元のメールを確認してください。');
  if(files[0].slice(0,7).replace('年','-')!==m.billingMonth)throw new Error('メールとPDFの請求月が一致しません。');
  return Object.assign(m,{url:links[0],filename:files[0]});
}
function officeFindPassword_(envelope) {
  const d=new Date(envelope.time),fmt=x=>Utilities.formatDate(x,'Asia/Tokyo','yyyy/MM/dd');
  const q='from:info@gigacc.com subject:Password subject:オフィス桃太郎 after:'+fmt(new Date(d.getTime()-86400000))+' before:'+fmt(new Date(d.getTime()+2*86400000))+' -in:trash -in:spam';
  const result=Gmail.Users.Messages.list('me',{q,maxResults:25});
  if(result.nextPageToken)throw new Error('パスワード候補が多いため、自動照合を停止しました。');
  const matches=[];
  for(const x of result.messages||[]) {
    const m=officeMail_(Gmail.Users.Messages.get('me',x.id,{format:'full'}),true);
    if(!m||m.subject!==envelope.subject||Math.abs(m.time-envelope.time)>300000)continue;
    const values=[...m.body.matchAll(/(?:^|\n)\s*パスワード\s*[:：]\s*([^\s]{1,20})\s*(?=\r?$|\n)/gm)].map(v=>v[1]);
    if(values.length===1&&!/[<>\[\]\u0000-\u001f]/.test(values[0]))matches.push({id:m.id,password:values[0]});
  }
  if(matches.length!==1)throw new Error('同じ件名・宛先・送信日時のパスワードメールを1通に照合できません。');
  return matches[0];
}
function officeEntity_(s) {
  return String(s||'').replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi,(all,k)=>{
    if(k[0]==='#'){const n=k[1].toLowerCase()==='x'?parseInt(k.slice(2),16):Number(k.slice(1));return n>0&&n<=0x10ffff?String.fromCodePoint(n):'';}
    return {amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '}[k.toLowerCase()];
  });
}
function officeAttrs_(tag) {
  const a={};for(const m of String(tag).matchAll(/([\w.:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    const key=m[1].toLowerCase();if(Object.prototype.hasOwnProperty.call(a,key))throw new Error('受取ページのフォームを確認できません。');
    a[key]=officeEntity_(m[2]===undefined?m[3]===undefined?m[4]:m[3]:m[2]);
  }return a;
}
function officeUrl_(value, base) {
  const raw=String(value||'');let u;
  if(raw.startsWith('/user/'))u=OFFICE_ORIGIN+raw;
  else if(raw.startsWith(OFFICE_ORIGIN+'/user/'))u=raw;
  else if(raw.startsWith('?')&&base)u=base.split('?')[0]+raw;
  else throw new Error('GigaCC以外の受取先には接続しません。');
  if(!/^https:\/\/asp\.gigacc\.com\/user\/(?:~ta\/[a-z0-9]{20,80}|receiver\/(?:detail|reciveFileDownload)\.do)(?:\?[^#\s\\]*)?$/.test(u))throw new Error('受取先のURL形式が変更されています。');
  return u;
}
function officeForm_(html, download) {
  const clean=String(html).replace(/<!--[\s\S]*?-->/g,'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'');
  const target=download?'/user/receiver/reciveFileDownload.do':'/user/receiver/detail.do',button=download?OFFICE_DOWNLOAD_BUTTON:OFFICE_AUTH_BUTTON;
  const forms=[];
  for(const m of clean.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form\s*>/gi)) {
    const a=officeAttrs_(m[1]);
    if(a.action!==target&&a.action!==OFFICE_ORIGIN+target)continue;
    const fields={},allowed=download?['org.apache.struts.taglib.html.TOKEN','job','SI','RI','zip']:['SI','RI','job'];let buttons=0;
    for(const x of m[2].matchAll(/<input\b([^>]*)>/gi)) {
      const e=officeAttrs_(x[1]);if(!e.name)continue;
      if(e.type==='hidden'&&allowed.includes(e.name)) {
        if(Object.prototype.hasOwnProperty.call(fields,e.name))throw new Error('受取フォームの値が重複しています。');
        fields[e.name]=e.value||'';
      } else if(e.type==='submit'&&e.name===button&&(!download||e.id==='down_nml_btn')&&!/圧縮/.test(e.value||'')) {fields[e.name]=e.value||'';buttons++;}
      else if(!download&&e.type==='password'&&e.name==='password')fields.password='';
      else if(e.type==='hidden')throw new Error('受取フォームが変更されています。');
    }
    if(buttons!==1||!fields.SI||!fields.RI||!(download?Object.prototype.hasOwnProperty.call(fields,'org.apache.struts.taglib.html.TOKEN'):Object.prototype.hasOwnProperty.call(fields,'password')))continue;
    if(Object.values(fields).some(v=>v.length>3000))throw new Error('受取フォームが大きすぎます。');
    const method=(a.method||'get').toLowerCase();if(method!==(download?'get':'post'))throw new Error('受取フォームの送信方法が変更されています。');
    if(download)fields.zip='false';
    forms.push({url:OFFICE_ORIGIN+target,method,fields});
  }
  if(forms.length!==1)throw new Error(download?'認証できませんでした。パスワードや受取期限を確認してください。':'パスワード入力ページを確認できません。受取期限を確認してください。');
  return forms[0];
}
function officeHttp_(url, method, fields, jar) {
  let current=officeUrl_(url),verb=method||'get',payload=fields?Object.keys(fields).map(k=>encodeURIComponent(k)+'='+encodeURIComponent(fields[k])).join('&'):'';
  if(verb==='get'&&payload){current+=(current.includes('?')?'&':'?')+payload;payload='';}
  for(let hop=0;hop<5;hop++) {
    const options={method:verb,followRedirects:false,muteHttpExceptions:true,headers:{Cookie:Object.keys(jar).map(k=>k+'='+jar[k]).join('; ')}};
    if(verb==='post'){options.contentType='application/x-www-form-urlencoded';options.payload=payload;}
    let r;try{r=UrlFetchApp.fetch(current,options);}catch(_){throw new Error('GigaCCへの接続に失敗しました。時間をおいて再試行してください。');}
    const h=r.getAllHeaders(),cookies=h['Set-Cookie']||h['set-cookie']||[];
    for(const line of (Array.isArray(cookies)?cookies:[cookies]))for(const part of String(line).split(/,(?=\s*[\w-]+=)/)) {
      const c=part.trim().match(/^([A-Za-z0-9_-]+)=([^;\r\n]*)/);if(c)jar[c[1]]=c[2];
    }
    const status=r.getResponseCode();
    if([301,302,303,307,308].includes(status)) {
      current=officeUrl_(h.Location||h.location,current);
      if([301,302,303].includes(status)){verb='get';payload='';}continue;
    }
    if(status!==200)throw new Error('GigaCCから請求書を取得できませんでした（HTTP '+status+'）。');
    return r;
  }throw new Error('GigaCCの画面遷移が多すぎるため停止しました。');
}
function officeDownload_(envelope, password) {
  const jar={};const entry=officeHttp_(envelope.url,'get',null,jar).getContentText('UTF-8');
  let auth=officeForm_(entry,false);auth.fields.password=password;
  const page=officeHttp_(auth.url,auth.method,auth.fields,jar).getContentText('UTF-8');
  // Do not retain or return the authentication value or session cookies.
  auth.fields.password='';
  const plain=officeEntity_(page.replace(/<[^>]*>/g,' ')).normalize('NFKC').replace(/\s/g,'');
  if(!plain.includes('seikyu@office-supply.biz')||!plain.includes(envelope.subject.normalize('NFKC').replace(/\s/g,''))||!plain.includes(envelope.filename.normalize('NFKC').replace(/\s/g,'')))throw new Error('認証後の送信者・件名・ファイル名が元のメールと一致しません。');
  const pdfNames=[...new Set(plain.match(/20\d{2}年\d{2}月請求書_[^<>]{1,180}?\.pdf/g)||[])];
  if(pdfNames.length!==1||pdfNames[0]!==envelope.filename.normalize('NFKC').replace(/\s/g,''))throw new Error('PDFが複数あるため、自動取得を停止しました。');
  const form=officeForm_(page,true),blob=officeHttp_(form.url,form.method,form.fields,jar).getBlob();
  const bytes=blob.getBytes();
  if(bytes.length>10000000||bytes.length<5||String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')throw new Error('GigaCCから10MB以下の原本PDFを取得できませんでした。ZIPや認証画面は保存しません。');
  return blob.setContentType('application/pdf');
}
function officeParse_(text) {
  const t=String(text||'').normalize('NFKC').replace(/\r\n?/g,'\n'),compact=t.replace(/\s/g,''),dates=[],amounts=[];
  if(!compact.includes('オフィスサプライ株式会社')||!compact.includes('請求書'))throw new Error('オフィスサプライの請求書を確認できません。');
  const pattern=/(20\d{2})[年/.-](\d{1,2})[月/.-](\d{1,2})日?/g;
  const iso=m=>invValidDate_(m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0'));
  for(const m of compact.matchAll(/お支払予定日[：:]?((20\d{2})[年/.-](\d{1,2})[月/.-](\d{1,2})日?)/g)) {const d=invValidDate_(m[2]+'-'+m[3].padStart(2,'0')+'-'+m[4].padStart(2,'0'));if(d)dates.push(d);}
  const block=compact.match(/お客様(?:コード|コート|ｺｰﾄﾞ|コｰド)[\s\S]{0,300}?お支払予定日([\s\S]{0,280}?)(?:前回御請求額|今回御入金額)/);
  if(block){const ds=[...block[1].matchAll(pattern)].map(iso).filter(Boolean);if(ds.length===3&&ds[1]<=ds[0]&&ds[0]<=ds[2]&&Date.parse(ds[2])-Date.parse(ds[0])<63*86400000)dates.push(ds[2]);}
  // OCR can reorder table columns. Cross-check the explicit withdrawal-day
  // sentence against a full date actually present in this same PDF.
  const hints=[...compact.matchAll(/(\d{1,2})月(\d{1,2})日口座引(?:落|き落)/g)];
  const fullDates=[...new Set([...compact.matchAll(pattern)].map(iso).filter(Boolean))];
  if(hints.length===1){const h=hints[0],matching=fullDates.filter(d=>Number(d.slice(5,7))===Number(h[1])&&Number(d.slice(8,10))===Number(h[2]));if(matching.length===1)dates.push(matching[0]);}
  // The total at the bottom has two columns: purchases (current total) and
  // received payment (previous month). Never adopt the latter or the tax line.
  for(const m of t.matchAll(/(?:^|\n)[^\n]*合\s*計\s+([0-9][0-9,]*)\s+([0-9][0-9,]*)(?:\s*円)?\s*(?=\n|$)/g))amounts.push(Number(m[1].replace(/,/g,'')));
  for(const m of t.matchAll(/(?:^|\n)\s*今\s*回\s*御\s*請\s*求\s*額\s*[:：]?\s*[¥￥]?\s*([\d,]+)\s*(?:円)?\s*(?=\n|$)/g))amounts.push(Number(m[1].replace(/,/g,'')));
  const balance=t.match(/今\s*回\s*御\s*請\s*求\s*額([\s\S]{1,450}?)(?=月\s*日)/);
  if(balance){
    const headings=t.slice(0,balance.index).replace(/\s/g,'');
    const taxMatch=balance[1].match(/外\s*税\s*([0-9][0-9,]*)/),nums=(balance[1].match(/[0-9][0-9,]*/g)||[]).map(x=>Number(x.replace(/,/g,'')));
    if(['前回御請求額','今回御入金額','繰越額','今回請求御買上額'].every(x=>headings.includes(x))&&taxMatch&&nums.length===6&&nums.every(n=>Number.isSafeInteger(n)&&n>=0&&n<=999999999999)){
      const tax=Number(taxMatch[1].replace(/,/g,'')),values=nums.slice(),index=values.indexOf(tax),totals=[];values.splice(index,1);
      // Both equations must hold: previous - paid = carry; carry + sales + tax
      // = current. Reject several possible current totals instead of guessing.
      for(let a=0;a<5;a++)for(let b=0;b<5;b++)for(let c=0;c<5;c++){
        if(a===b||a===c||b===c||values[a]-values[b]!==values[c])continue;
        const rest=values.filter((_,i)=>![a,b,c].includes(i));
        for(let i=0;i<2;i++)if(values[c]+rest[i]+tax===rest[1-i])totals.push(rest[1-i]);
      }
      const unique=[...new Set(totals)];if(unique.length===1)amounts.push(unique[0]);
    }
  }
  const ds=[...new Set(dates)],as=[...new Set(amounts)].filter(n=>Number.isSafeInteger(n)&&n>=0&&n<=999999999999);
  return {due:ds.length===1?ds[0]:'',amount:as.length===1?as[0]:null,evidence:t.slice(0,1600)};
}
function officeCacheFile_(cache) {
  if(!cache||Date.now()-cache.created>86400000)throw new Error('取得したPDFの期限が切れました。もう一度検索してください。');
  const f=DriveApp.getFileById(cache.fileId);
  if(f.isTrashed()||f.getName()!==OFFICE_TEMP_PREFIX+cache.id+'.pdf')throw new Error('取得した原本PDFを確認できません。もう一度検索してください。');
  const blob=f.getBlob();if(invBlobHash_(blob)!==cache.fingerprint)throw new Error('取得後に原本PDFが変更されました。もう一度検索してください。');
  return blob;
}
function officeCleanup_() {
  const p=invProps_(),all=p.getProperties();
  for(const key of Object.keys(all).filter(k=>k.startsWith(OFFICE_CACHE_PREFIX))) {
    let c;try{c=JSON.parse(all[key]);}catch(_){continue;}
    if(Date.now()-c.created<=86400000)continue;
    try{const f=DriveApp.getFileById(c.fileId);if(f.getName()===OFFICE_TEMP_PREFIX+c.id+'.pdf')f.setTrashed(true);p.deleteProperty(key);}catch(_){/* Retry only the managed temporary file next time. */}
  }
}
function officeReadMessage_(j,id,msg) {
  const envelope=officeEnvelope_(msg);if(!envelope)return;
  // The invoice month precedes the payment month. Skip unrelated months before
  // authentication so searches do not consume a limited download unnecessarily.
  const [y,m]=envelope.billingMonth.split('-').map(Number),payMonth=new Date(Date.UTC(y,m,1)).toISOString().slice(0,7);
  if(payMonth!==j.month)return;
  const key=OFFICE_CACHE_PREFIX+authDigest_(JSON.stringify([id,envelope.subject,envelope.time,envelope.url,envelope.filename]));
  let cached=invRead_(key),blob;
  if(cached&&Date.now()-cached.created<=86400000){blob=officeCacheFile_(cached);}
  else {
    const pair=officeFindPassword_(envelope);blob=officeDownload_(envelope,pair.password);pair.password='';
    const fingerprint=invBlobHash_(blob),cacheId=invId_();
    const file=DriveApp.createFile(blob.copyBlob().setName(OFFICE_TEMP_PREFIX+cacheId+'.pdf'));
    cached={id:cacheId,fileId:file.getId(),fingerprint,created:Date.now(),parsed:null};
    try{invWrite_(key,cached);}catch(e){file.setTrashed(true);throw e;}
  }
  if(!cached.parsed||cached.parserVersion!==2){cached.parsed=officeParse_(invOcr_(blob));cached.parserVersion=2;invWrite_(key,cached);}
  if(cached.parsed.due&&cached.parsed.due.slice(0,7)!==j.month)return;
  if(j.items.map(k=>invRead_(INV_ITEM+k)).some(c=>c&&c.fingerprint===cached.fingerprint))return;
  const c={id:invId_(),vendor:'officesupply',vendorName:'オフィスサプライカウンター料金',subject:envelope.subject,source:{kind:'officesupply-gigacc',messageId:id,cacheKey:key},fingerprint:cached.fingerprint,due:cached.parsed.due,amount:cached.parsed.amount,evidence:cached.parsed.evidence,created:Date.now(),sourceUrl:'https://mail.google.com/mail/u/?authuser='+encodeURIComponent(INV_OWNER)+'#all/'+id};
  if(j.items.length>=20)throw new Error('候補が20件を超えました。');invWrite_(INV_ITEM+c.id,c);j.items.push(c.id);
}
function officeSourcePdf_(source) {
  if(!source||source.kind!=='officesupply-gigacc'||!/^INV_OFFICE_CACHE_V1_[a-f0-9]{64}$/.test(source.cacheKey))throw new Error('請求書の取得元が不正です。');
  return officeCacheFile_(invRead_(source.cacheKey));
}
function downloadOfficeInvoice(jobId,itemId,due,amount,token) {
  const j=invJobFor_(jobId,token);
  if(j.status!=='done'||j.type!=='search'||j.vendor!=='officesupply'||!j.items.includes(itemId))throw new Error('オフィスサプライの検索結果を確認してください。');
  const c=invRead_(INV_ITEM+itemId),d=invValidDate_(String(due)),a=String(amount).replace(/,/g,'');
  if(!c||c.vendor!=='officesupply'||!d||d.slice(0,7)!==j.month||!/^\d{1,12}$/.test(a))throw new Error('選択月の支払日と整数の金額を確認してください。');
  const blob=officeSourcePdf_(c.source);if(invBlobHash_(blob)!==c.fingerprint)throw new Error('原本PDFが一致しません。');
  return {filename:d.replace(/-/g,'')+'_オフィスサプライカウンター料金_'+Number(a)+'.pdf',data:Utilities.base64Encode(blob.getBytes()),mimeType:'application/pdf'};
}
