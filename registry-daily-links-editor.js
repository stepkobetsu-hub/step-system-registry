(() => {
  'use strict';

  const LOCAL_KEY='stepSystemRegistryDailyLinksV1';
  const SHARED_KEY='registryDailyLinksConfig';
  let config=loadLocal();
  let editingKey='';
  let draft=[];
  let saveTimer=null;
  let saving=false;
  let dirtySinceSharedLoad=false;

  function clone(value){return JSON.parse(JSON.stringify(value));}
  function normalizeLink(link){
    const openUrl=String(link?.openUrl||link?.url||'').trim();
    const copyUrl=String(link?.copyUrl||openUrl).trim();
    return {title:String(link?.title||'').trim(),openUrl,copyUrl};
  }
  function normalizeConfig(value){
    const out={schemaVersion:1,cards:{}};
    if(value&&typeof value==='object'&&value.cards&&typeof value.cards==='object'){
      Object.entries(value.cards).forEach(([key,links])=>{
        if(Array.isArray(links))out.cards[String(key)]=links.map(normalizeLink);
      });
    }
    return out;
  }
  function loadLocal(){
    try{return normalizeConfig(JSON.parse(localStorage.getItem(LOCAL_KEY)||'null'));}
    catch(_){return normalizeConfig(null);}
  }
  function persistLocal(){try{localStorage.setItem(LOCAL_KEY,JSON.stringify(config));}catch(_){}}
  function itemKey(item){return item?.__cardKey||cardCustomizationKey(item,item?.__sourceIndex||0);}
  function findItemForArticle(article){return systems.find(item=>cardAnchor(item)===article.id)||null;}
  function findArticleForKey(key){
    const item=systems.find(entry=>itemKey(entry)===key);
    return item?document.getElementById(cardAnchor(item)):null;
  }
  function hasOverride(key){return Object.prototype.hasOwnProperty.call(config.cards,key);}

  function cleanLabelText(label){
    if(!label)return '';
    const copy=label.cloneNode(true);
    copy.querySelectorAll('.billing-adjustment-url').forEach(node=>node.remove());
    return copy.textContent.trim();
  }
  function captureRenderedLinks(article){
    const section=article?.querySelector('.daily-links');
    if(!section)return [];
    return Array.from(section.querySelectorAll('.link-row')).map(row=>{
      const open=row.querySelector('a.open');
      const openUrl=open?.href||'';
      return {title:cleanLabelText(row.querySelector('.link-name')),openUrl,copyUrl:openUrl};
    }).filter(link=>link.title||link.openUrl);
  }
  function linksForKey(key,article){
    if(hasOverride(key))return clone(config.cards[key]);
    return captureRenderedLinks(article||findArticleForKey(key));
  }

  function ensureDailySection(article){
    let section=article.querySelector('.daily-links');
    if(section)return section;
    section=document.createElement('section');section.className='daily-links';
    const h3=document.createElement('h3');h3.textContent='日常利用';section.append(h3);
    const toggle=article.querySelector('.toggle');
    if(toggle)article.insertBefore(section,toggle);else article.append(section);
    return section;
  }
  function createCustomLinkRow(link){
    const row=document.createElement('div');row.className='link-row registry-daily-custom-row';
    const name=document.createElement('span');name.className='link-name';name.textContent=link.title||'名称未設定';
    const openUrl=String(link.openUrl||'').trim();
    const copyTarget=String(link.copyUrl||openUrl).trim();
    let open;
    if(openUrl){
      open=document.createElement('a');open.className='open';open.textContent='開く';open.href=normalizePortalUrl(openUrl);open.target='_blank';open.rel='noopener noreferrer';
    }else{
      open=document.createElement('button');open.type='button';open.className='open registry-disabled-link';open.textContent='開く';open.disabled=true;
    }
    const copy=document.createElement('button');copy.type='button';copy.className='copy';copy.textContent='URLをコピー';copy.disabled=!copyTarget;
    if(copyTarget)copy.addEventListener('click',()=>copyUrl(normalizePortalUrl(copyTarget)));
    row.append(name,open,copy);return row;
  }
  function decorateDailySections(){
    if(!canCustomizeCards())return;
    document.querySelectorAll('#cards .card').forEach(article=>{
      const item=findItemForArticle(article);if(!item)return;
      const key=itemKey(item);
      let section=article.querySelector('.daily-links');
      if(!section)section=ensureDailySection(article);
      if(hasOverride(key)){
        section.querySelectorAll('.link-row,.registry-daily-empty').forEach(node=>node.remove());
        const links=config.cards[key];
        links.forEach(link=>section.append(createCustomLinkRow(link)));
        if(!links.length){const empty=document.createElement('p');empty.className='meta registry-daily-empty';empty.textContent='日常利用リンクはありません。';section.append(empty);}
      }else if(!section.querySelector('.link-row')&&!section.querySelector('.registry-daily-empty')){
        const empty=document.createElement('p');empty.className='meta registry-daily-empty';empty.textContent='日常利用リンクはありません。';section.append(empty);
      }
      const heading=section.querySelector('h3');if(!heading)return;
      if(!heading.querySelector('.registry-daily-edit')){
        const button=document.createElement('button');button.type='button';button.className='registry-daily-edit';button.textContent='✎ 編集';button.setAttribute('aria-label','日常利用のリンクを編集');button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openEditor(key,article);});heading.append(button);
      }
    });
  }

  const baseRender=render;
  render=function(){baseRender();decorateDailySections();};
  const baseShowPortal=showPortal;
  showPortal=function(items){baseShowPortal(items);queueMicrotask(loadShared);};

  function setSync(text,state){
    const el=document.getElementById('registryDailySync');
    if(el){el.textContent=text;el.dataset.state=state||'';}
  }
  async function loadShared(){
    try{
      const result=await api('getWorkspaceConfig');if(!result?.success)return;
      const remote=result.sharedState?.[SHARED_KEY];
      if(remote&&!dirtySinceSharedLoad){config=normalizeConfig(remote);persistLocal();render();setSync('全パソコンで共有中','ready');}
      else if(remote){setSync('この端末の変更を保存待ちです','saving');}
      else setSync('編集内容は保存時に全パソコンへ共有されます','local');
    }catch(_){setSync('現在はこの端末の設定を表示しています','error');}
  }
  function scheduleSharedSave(){clearTimeout(saveTimer);setSync('全パソコンへ保存待ち…','saving');saveTimer=setTimeout(saveShared,650);}
  async function saveShared(){
    if(saving)return;saving=true;
    try{
      const fresh=await api('getWorkspaceConfig');if(!fresh?.success)throw new Error(fresh?.error||'共有設定を取得できませんでした。');
      const envelope=fresh.sharedState&&typeof fresh.sharedState==='object'?clone(fresh.sharedState):{};
      const expectedVersion=Number(fresh.version||0);envelope[SHARED_KEY]=clone(config);
      const saved=await api('saveWorkspaceConfig',{sharedState:envelope,expectedVersion});
      if(!saved?.success){
        if(saved?.code==='WORKSPACE_VERSION_CONFLICT'){setSync('別端末の更新と重なりました。再保存します…','conflict');saveTimer=setTimeout(saveShared,900);return;}
        throw new Error(saved?.error||'共有設定を保存できませんでした。');
      }
      dirtySinceSharedLoad=false;setSync(`全パソコンへ保存しました（版 ${saved.version||expectedVersion+1}）`,'ready');
    }catch(error){setSync(error.message||'共有設定を保存できませんでした','error');}
    finally{saving=false;}
  }

  function injectUi(){
    const style=document.createElement('style');style.id='registry-daily-links-style';style.textContent=`
      .daily-links>h3{display:flex;align-items:center;gap:8px}.registry-daily-edit{margin-left:auto;border:1px solid #bfd4f6;background:#edf4ff;color:#1d4ed8;border-radius:7px;padding:4px 8px;font-size:12px;font-weight:800;cursor:pointer}.registry-disabled-link{opacity:.45;cursor:not-allowed}.registry-daily-panel{position:fixed;inset:0;background:rgba(15,35,55,.62);z-index:95;padding:18px;overflow:auto}.registry-daily-dialog{width:min(980px,100%);margin:3vh auto;background:#fff;border-radius:18px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.3)}.registry-daily-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.registry-daily-head h2{margin:0;color:#102a43}.registry-daily-head p{margin:5px 0 0;color:#627d98;line-height:1.55}.registry-daily-list{display:grid;gap:10px;margin-top:16px}.registry-daily-row{display:grid;grid-template-columns:minmax(150px,.8fr) minmax(210px,1fr) minmax(210px,1fr) auto;gap:8px;align-items:end;border:1px solid #d8e2ec;border-radius:12px;padding:11px;background:#f8fbff}.registry-daily-row label{font-size:12px;font-weight:800;color:#486581}.registry-daily-row input{display:block;width:100%;margin-top:5px;border:1px solid #bcccdc;border-radius:9px;padding:9px;background:#fff;font:inherit}.registry-daily-row-actions{display:flex;gap:5px}.registry-daily-row-actions button{min-width:36px;padding:8px}.registry-daily-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:13px}.registry-daily-toolbar .spacer{flex:1}.registry-daily-sync{font-size:12px;font-weight:800;color:#486581}.registry-daily-sync[data-state="ready"]{color:#147d4d}.registry-daily-sync[data-state="saving"]{color:#9a6700}.registry-daily-sync[data-state="error"],.registry-daily-sync[data-state="conflict"]{color:#b42318}.registry-daily-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:18px;padding-top:14px;border-top:1px solid #d8e2ec}.registry-daily-help{font-size:12px;color:#627d98;margin:8px 0 0}.registry-daily-empty-editor{padding:18px;text-align:center;color:#627d98;border:1px dashed #bcccdc;border-radius:12px;background:#f8fbff}
      @media(max-width:800px){.registry-daily-panel{padding:8px}.registry-daily-dialog{padding:15px}.registry-daily-row{grid-template-columns:1fr}.registry-daily-row-actions{justify-content:flex-end}}
    `;document.head.append(style);
    const panel=document.createElement('section');panel.id='registryDailyPanel';panel.className='registry-daily-panel hidden';panel.innerHTML=`<div class="registry-daily-dialog"><div class="registry-daily-head"><div><h2>日常利用の編集</h2><p id="registryDailyCardName"></p></div><button class="btn" id="registryDailyClose" type="button">×</button></div><p class="registry-daily-help">タイトル・「開く」の移動先URL・「URLをコピー」でコピーするURLを編集できます。コピーURLを空欄にすると「開く」と同じURLを使います。</p><div class="registry-daily-list" id="registryDailyList"></div><div class="registry-daily-toolbar"><button class="open" id="registryDailyAdd" type="button">＋ 日常利用を追加</button><span class="spacer"></span><span class="registry-daily-sync" id="registryDailySync">共有状態を確認中…</span></div><div class="registry-daily-footer"><button class="btn" id="registryDailyReset" type="button">元の内容に戻す</button><button class="btn" id="registryDailyCancel" type="button">キャンセル</button><button class="open" id="registryDailySave" type="button">保存</button></div></div>`;document.body.append(panel);
    document.getElementById('registryDailyClose').addEventListener('click',closeEditor);document.getElementById('registryDailyCancel').addEventListener('click',closeEditor);document.getElementById('registryDailyAdd').addEventListener('click',()=>{draft.push({title:'',openUrl:'',copyUrl:''});renderDraft();});document.getElementById('registryDailySave').addEventListener('click',saveDraft);document.getElementById('registryDailyReset').addEventListener('click',resetDraft);panel.addEventListener('click',event=>{if(event.target===panel)closeEditor();});
  }
  function openEditor(key,article){
    editingKey=key;draft=linksForKey(key,article).map(normalizeLink);const item=systems.find(entry=>itemKey(entry)===key);document.getElementById('registryDailyCardName').textContent=item?`${cardDisplayValues(item).title} の「日常利用」`:'日常利用';renderDraft();document.getElementById('registryDailyPanel').classList.remove('hidden');document.body.style.overflow='hidden';
  }
  function closeEditor(){document.getElementById('registryDailyPanel').classList.add('hidden');document.body.style.overflow='';editingKey='';draft=[];}
  function renderDraft(){
    const root=document.getElementById('registryDailyList');root.replaceChildren();
    if(!draft.length){const empty=document.createElement('div');empty.className='registry-daily-empty-editor';empty.textContent='日常利用は0件です。「＋ 日常利用を追加」で追加できます。';root.append(empty);return;}
    draft.forEach((link,index)=>{
      const row=document.createElement('div');row.className='registry-daily-row';
      const title=document.createElement('label');title.textContent='タイトル';const titleInput=document.createElement('input');titleInput.value=link.title;titleInput.placeholder='例：給与明細を開く';titleInput.addEventListener('input',()=>link.title=titleInput.value);title.append(titleInput);
      const openLabel=document.createElement('label');openLabel.textContent='開く先URL';const openInput=document.createElement('input');openInput.type='url';openInput.value=link.openUrl;openInput.placeholder='https://';openInput.addEventListener('input',()=>link.openUrl=openInput.value);openLabel.append(openInput);
      const copyLabel=document.createElement('label');copyLabel.textContent='コピーURL';const copyInput=document.createElement('input');copyInput.type='url';copyInput.value=link.copyUrl===link.openUrl?'':link.copyUrl;copyInput.placeholder='空欄なら開く先URLと同じ';copyInput.addEventListener('input',()=>link.copyUrl=copyInput.value);copyLabel.append(copyInput);
      const actions=document.createElement('div');actions.className='registry-daily-row-actions';const up=document.createElement('button');up.type='button';up.className='btn';up.textContent='↑';up.disabled=index===0;up.onclick=()=>moveDraft(index,-1);const down=document.createElement('button');down.type='button';down.className='btn';down.textContent='↓';down.disabled=index===draft.length-1;down.onclick=()=>moveDraft(index,1);const del=document.createElement('button');del.type='button';del.className='btn';del.textContent='削除';del.onclick=()=>{draft.splice(index,1);renderDraft();};actions.append(up,down,del);row.append(title,openLabel,copyLabel,actions);root.append(row);
    });
  }
  function moveDraft(index,direction){const target=index+direction;if(target<0||target>=draft.length)return;[draft[index],draft[target]]=[draft[target],draft[index]];renderDraft();}
  function saveDraft(){
    if(!editingKey)return;
    const normalized=draft.map(link=>{const openUrl=String(link.openUrl||'').trim();return {title:String(link.title||'').trim()||'名称未設定',openUrl,copyUrl:String(link.copyUrl||'').trim()||openUrl};});
    config.cards[editingKey]=normalized;dirtySinceSharedLoad=true;persistLocal();render();scheduleSharedSave();const toast=document.getElementById('toast');if(toast){toast.textContent='日常利用を保存しました';toast.classList.remove('hidden');setTimeout(()=>{toast.classList.add('hidden');toast.textContent='URLをコピーしました';},1800);}closeEditor();
  }
  function resetDraft(){
    if(!editingKey)return;
    if(!confirm('このカードの日常利用を元の内容に戻しますか？'))return;
    delete config.cards[editingKey];dirtySinceSharedLoad=true;persistLocal();render();scheduleSharedSave();closeEditor();
  }

  injectUi();
  decorateDailySections();
})();
