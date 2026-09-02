(() => {
  'use strict';

  const LOCAL_KEY='stepSystemRegistryEditorConfigV2';
  const LEGACY_KEY='stepSystemRegistryCardCustomizationV1';
  let sharedEnvelope=null;
  let sharedVersion=0;
  let rawBaseSystems=null;
  let dirtySinceSharedLoad=false;
  let saveTimer=null;
  let saving=false;
  let editingKey='';
  let config=loadConfig();

  function clone(value){return JSON.parse(JSON.stringify(value));}
  function emptyConfig(){return {schemaVersion:2,order:[],cards:{},customCards:[],archived:[]};}
  function normalizeConfig(value){
    const out=emptyConfig();
    if(value&&typeof value==='object'){
      out.order=Array.isArray(value.order)?value.order.map(String):[];
      out.cards=value.cards&&typeof value.cards==='object'?clone(value.cards):{};
      out.customCards=Array.isArray(value.customCards)?value.customCards.filter(Boolean).map(item=>Object.assign({},item)):[];
      out.archived=Array.isArray(value.archived)?value.archived.map(String):[];
    }
    return out;
  }
  function loadConfig(){
    try{
      const current=JSON.parse(localStorage.getItem(LOCAL_KEY)||'null');
      if(current)return normalizeConfig(current);
      const legacy=JSON.parse(localStorage.getItem(LEGACY_KEY)||'null');
      if(legacy&&typeof legacy==='object')return normalizeConfig({order:legacy.order||[],cards:legacy.cards||{}});
    }catch(_){ }
    return emptyConfig();
  }
  function customKey(item){return `custom:${item.id}`;}
  function syncLegacyCustomization(){
    const cards={};
    Object.entries(config.cards||{}).forEach(([key,value])=>{
      const entry={};
      if(Object.prototype.hasOwnProperty.call(value||{},'title'))entry.title=String(value.title||'');
      if(Object.prototype.hasOwnProperty.call(value||{},'summary'))entry.summary=String(value.summary||'');
      if(Object.keys(entry).length)cards[key]=entry;
    });
    config.customCards.forEach(item=>{cards[customKey(item)]={title:item.title||'名称未設定',summary:item.summary||''};});
    cardCustomization={order:[...config.order],cards};
    try{localStorage.setItem(LEGACY_KEY,JSON.stringify(cardCustomization));}catch(_){ }
  }
  syncLegacyCustomization();

  function overrideForItem(item){
    const key=item?.__cardKey||cardCustomizationKey(item,item?.__sourceIndex||0);
    return config.cards[key]||null;
  }
  function applyFieldOverrides(item){
    const override=overrideForItem(item);
    if(!override)return item;
    const out=Object.assign({},item);
    if(Object.prototype.hasOwnProperty.call(override,'category'))out['分類']=String(override.category||'未分類');
    if(Object.prototype.hasOwnProperty.call(override,'status'))out['状態']=String(override.status||'要確認');
    if(Object.prototype.hasOwnProperty.call(override,'url'))out['利用者向けURL']=String(override.url||'');
    return out;
  }

  const baseApplyAssetInfo=applyAssetInfo;
  applyAssetInfo=function(item){return applyFieldOverrides(baseApplyAssetInfo(item));};

  function configuredBase(){
    if(!rawBaseSystems)return [];
    const archived=new Set(config.archived||[]);
    const base=rawBaseSystems.map(item=>applyFieldOverrides(Object.assign({},item))).filter(item=>!archived.has(item.__cardKey));
    config.customCards.forEach((custom,index)=>{
      const key=customKey(custom);
      if(archived.has(key))return;
      base.push({
        'ID':`registry-user-${custom.id}`,
        'システム名':custom.title||'名称未設定',
        '分類':custom.category||'未分類',
        '状態':custom.status||'本番使用中',
        '利用者':'スタッフ',
        '運用担当':'管理者',
        '概要':custom.summary||'',
        '利用者向けURL':custom.url||'',
        '確認状況':'資産管理画面から追加したカード',
        '__cardKey':key,
        '__sourceIndex':100000+index,
        '__registryCustom':true
      });
    });
    return base;
  }
  function applyConfigToPortal(){
    if(!rawBaseSystems)return;
    syncLegacyCustomization();
    baseSystems=configuredBase();
    systems=sortCustomizedCards(baseSystems);
    fillFilters();
    render();
  }

  const baseShowPortal=showPortal;
  showPortal=function(items){
    syncLegacyCustomization();
    baseShowPortal(items);
    rawBaseSystems=baseSystems.map(item=>Object.assign({},item));
    applyConfigToPortal();
    queueMicrotask(loadSharedConfig);
  };

  const baseRender=render;
  render=function(){
    baseRender();
    decorateCards();
    if(!document.getElementById('registryEditorPanel')?.classList.contains('hidden'))renderManagementList();
  };

  function persistLocal(){
    syncLegacyCustomization();
    try{localStorage.setItem(LOCAL_KEY,JSON.stringify(config));}catch(_){ }
  }
  function markChanged(){
    dirtySinceSharedLoad=true;
    persistLocal();
    applyConfigToPortal();
    scheduleSharedSave();
  }
  function setSync(message,state){
    const target=document.getElementById('registryEditorSync');
    if(target){target.textContent=message;target.dataset.state=state||'';}
  }
  async function loadSharedConfig(){
    try{
      const result=await api('getWorkspaceConfig');
      if(!result?.success)return;
      sharedEnvelope=result.sharedState&&typeof result.sharedState==='object'?clone(result.sharedState):{};
      sharedVersion=Number(result.version||0);
      if(sharedEnvelope.registryConfig&&!dirtySinceSharedLoad){
        config=normalizeConfig(sharedEnvelope.registryConfig);
        persistLocal();
        applyConfigToPortal();
        setSync(`全パソコンで共有中（版 ${sharedVersion}）`,'ready');
      }else if(sharedEnvelope.registryConfig){
        setSync('この端末の変更を保存待ちです','saving');
      }else{
        setSync('編集すると全パソコンへ共有されます','local');
      }
    }catch(_){setSync('現在はこの端末の設定を表示しています','error');}
  }
  function scheduleSharedSave(){
    clearTimeout(saveTimer);
    setSync('全パソコンへ保存待ち…','saving');
    saveTimer=setTimeout(saveSharedConfig,650);
  }
  async function saveSharedConfig(){
    if(saving)return;
    saving=true;
    try{
      const fresh=await api('getWorkspaceConfig');
      if(!fresh?.success)throw new Error(fresh?.error||'共有設定を取得できませんでした。');
      const envelope=fresh.sharedState&&typeof fresh.sharedState==='object'?clone(fresh.sharedState):{};
      const expectedVersion=Number(fresh.version||0);
      envelope.registryConfig=clone(config);
      const saved=await api('saveWorkspaceConfig',{sharedState:envelope,expectedVersion});
      if(!saved?.success){
        if(saved?.code==='WORKSPACE_VERSION_CONFLICT'){
          setSync('別端末の更新と重なりました。もう一度保存します…','conflict');
          saveTimer=setTimeout(saveSharedConfig,900);
          return;
        }
        throw new Error(saved?.error||'共有設定を保存できませんでした。');
      }
      sharedEnvelope=envelope;
      sharedVersion=Number(saved.version||expectedVersion+1);
      dirtySinceSharedLoad=false;
      setSync(`全パソコンへ保存しました（版 ${sharedVersion}）`,'ready');
    }catch(error){setSync(error.message||'共有設定を保存できませんでした','error');}
    finally{saving=false;}
  }

  function injectUi(){
    const style=document.createElement('style');
    style.id='registry-editor-style';
    style.textContent=`
      .registry-card-edit{border:1px solid #bfd4f6;background:#edf4ff;color:#1d4ed8;border-radius:8px;padding:5px 9px;font-weight:800;cursor:pointer;white-space:nowrap}
      .registry-editor-panel,.registry-card-form-panel{position:fixed;inset:0;background:rgba(15,35,55,.6);z-index:80;padding:18px;overflow:auto}
      .registry-editor-dialog{width:min(1120px,100%);margin:0 auto;background:#fff;border-radius:18px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.28)}
      .registry-editor-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.registry-editor-head h2{margin:0;color:#102a43}.registry-editor-head p{margin:5px 0 0;color:#627d98}
      .registry-editor-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:16px 0}.registry-editor-toolbar .spacer{flex:1}.registry-sync{font-size:12px;font-weight:800;color:#486581}.registry-sync[data-state="ready"]{color:#147d4d}.registry-sync[data-state="error"],.registry-sync[data-state="conflict"]{color:#b42318}.registry-sync[data-state="saving"]{color:#9a6700}
      .registry-editor-list{display:grid;gap:9px}.registry-editor-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid #d8e2ec;border-radius:12px;padding:11px;background:#f8fbff}.registry-editor-row.is-dragging{opacity:.45}.registry-editor-row.is-drop{outline:3px solid #93c5fd}.registry-order{display:flex;gap:4px}.registry-order button{min-width:34px}.registry-editor-copy strong{display:block;color:#102a43}.registry-editor-copy small{display:block;margin-top:3px;color:#627d98}.registry-editor-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
      .registry-archive-box{margin-top:18px;border-top:1px solid #d8e2ec;padding-top:14px}.registry-archive-box h3{margin:0 0 9px;color:#486581}.registry-archive-row{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid #edf2f7}
      .registry-card-form{width:min(680px,100%);margin:4vh auto;background:#fff;border-radius:18px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.28)}.registry-card-form h2{margin:0;color:#102a43}.registry-card-form label{display:block;font-weight:800;color:#486581;margin-top:13px}.registry-card-form input,.registry-card-form textarea{display:block;width:100%;margin-top:6px;border:1px solid #bcccdc;border-radius:10px;padding:10px 11px;font:inherit;color:#152536;background:#fff}.registry-card-form textarea{min-height:90px;resize:vertical}.registry-form-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
      @media(max-width:720px){.registry-editor-row{grid-template-columns:1fr}.registry-order,.registry-editor-actions{justify-content:flex-start}.registry-editor-panel,.registry-card-form-panel{padding:8px}.registry-editor-dialog,.registry-card-form{padding:15px}}
    `;
    document.head.append(style);

    const panel=document.createElement('section');
    panel.id='registryEditorPanel';panel.className='registry-editor-panel hidden';
    panel.innerHTML=`<div class="registry-editor-dialog"><div class="registry-editor-head"><div><h2>資産管理の編集・設定</h2><p>STEP業務ホームと同じように、カード追加・編集・並べ替え・アーカイブができます。</p></div><button class="btn" id="registryEditorClose" type="button">完了</button></div><div class="registry-editor-toolbar"><button class="open" id="registryAddCard" type="button">＋ カード追加</button><button class="btn" id="registryPublishNow" type="button">この配置を全端末へ反映</button><span class="spacer"></span><span class="registry-sync" id="registryEditorSync">共有状態を確認中…</span></div><div class="registry-editor-list" id="registryEditorList"></div><div class="registry-archive-box"><h3>アーカイブ</h3><div id="registryArchiveList"></div></div></div>`;
    document.body.append(panel);

    const formPanel=document.createElement('section');
    formPanel.id='registryCardFormPanel';formPanel.className='registry-card-form-panel hidden';
    formPanel.innerHTML=`<form class="registry-card-form" id="registryCardForm"><div class="registry-editor-head"><div><h2 id="registryCardFormTitle">カードを編集</h2></div><button class="btn" id="registryCardFormClose" type="button">×</button></div><label>表示名<input id="registryCardName" maxlength="80" required></label><label>説明<textarea id="registryCardSummary" maxlength="500"></textarea></label><label>URL<input id="registryCardUrl" type="url" placeholder="https://"></label><label>分類<input id="registryCardCategory" list="registryCategoryList" maxlength="40"></label><datalist id="registryCategoryList"></datalist><label>状態<input id="registryCardStatus" list="registryStatusList" maxlength="60"></label><datalist id="registryStatusList"><option value="本番使用中"><option value="本番"><option value="開発中"><option value="要確認"><option value="旧システム"></datalist><div class="registry-form-actions"><button class="btn" id="registryCardCancel" type="button">キャンセル</button><button class="open" type="submit">保存</button></div></form>`;
    document.body.append(formPanel);

    document.getElementById('registryEditorClose').addEventListener('click',closeManagement);
    document.getElementById('registryAddCard').addEventListener('click',()=>openCardForm(''));
    document.getElementById('registryPublishNow').addEventListener('click',saveSharedConfig);
    document.getElementById('registryCardFormClose').addEventListener('click',closeCardForm);
    document.getElementById('registryCardCancel').addEventListener('click',closeCardForm);
    document.getElementById('registryCardForm').addEventListener('submit',saveCardForm);
    panel.addEventListener('click',event=>{if(event.target===panel)closeManagement();});
    formPanel.addEventListener('click',event=>{if(event.target===formPanel)closeCardForm();});
  }

  function activeEntries(){
    return systems.map(item=>({key:item.__cardKey,item,title:cardDisplayValues(item).title,summary:cardDisplayValues(item).summary}));
  }
  function originalItemForKey(key){return rawBaseSystems?.find(item=>item.__cardKey===key)||null;}
  function currentItemForKey(key){return systems.find(item=>item.__cardKey===key)||originalItemForKey(key)||null;}
  function decorateCards(){
    document.querySelectorAll('#cards .card').forEach(article=>{
      if(article.querySelector('.registry-card-edit'))return;
      const item=systems.find(system=>cardAnchor(system)===article.id);
      if(!item)return;
      const button=document.createElement('button');button.type='button';button.className='registry-card-edit';button.textContent='✎ 編集';button.addEventListener('click',()=>openCardForm(item.__cardKey));
      article.querySelector('.card-head')?.append(button);
    });
  }
  function openManagement(){
    renderManagementList();
    document.getElementById('registryEditorPanel').classList.remove('hidden');
    document.body.style.overflow='hidden';
    loadSharedConfig();
  }
  function closeManagement(){document.getElementById('registryEditorPanel').classList.add('hidden');document.body.style.overflow='';}
  function renderManagementList(){
    const root=document.getElementById('registryEditorList');if(!root)return;
    root.replaceChildren();
    const entries=activeEntries();
    entries.forEach((entry,index)=>{
      const row=document.createElement('article');row.className='registry-editor-row';row.draggable=true;row.dataset.key=entry.key;
      const order=document.createElement('div');order.className='registry-order';
      const up=document.createElement('button');up.className='btn';up.type='button';up.textContent='↑';up.disabled=index===0;up.onclick=()=>moveEntry(entry.key,-1);
      const down=document.createElement('button');down.className='btn';down.type='button';down.textContent='↓';down.disabled=index===entries.length-1;down.onclick=()=>moveEntry(entry.key,1);order.append(up,down);
      const copy=document.createElement('div');copy.className='registry-editor-copy';const strong=document.createElement('strong');strong.textContent=entry.title;const small=document.createElement('small');small.textContent=[entry.item['分類'],entry.item['状態']].filter(Boolean).join(' / ');copy.append(strong,small);
      const actions=document.createElement('div');actions.className='registry-editor-actions';const edit=document.createElement('button');edit.className='btn';edit.type='button';edit.textContent='編集';edit.onclick=()=>openCardForm(entry.key);const archive=document.createElement('button');archive.className='btn';archive.type='button';archive.textContent='アーカイブ';archive.onclick=()=>archiveEntry(entry.key);actions.append(edit,archive);
      row.append(order,copy,actions);
      row.addEventListener('dragstart',event=>{row.classList.add('is-dragging');event.dataTransfer.setData('text/plain',entry.key);event.dataTransfer.effectAllowed='move';});
      row.addEventListener('dragend',()=>row.classList.remove('is-dragging'));
      row.addEventListener('dragover',event=>{event.preventDefault();row.classList.add('is-drop');});
      row.addEventListener('dragleave',()=>row.classList.remove('is-drop'));
      row.addEventListener('drop',event=>{event.preventDefault();row.classList.remove('is-drop');const dragged=event.dataTransfer.getData('text/plain');if(dragged&&dragged!==entry.key)moveBefore(dragged,entry.key);});
      root.append(row);
    });
    renderArchiveList();
  }
  function orderedKeys(){
    const visible=activeEntries().map(entry=>entry.key);
    const all=[...config.order.filter(key=>visible.includes(key)),...visible.filter(key=>!config.order.includes(key))];
    return [...new Set(all)];
  }
  function moveEntry(key,direction){const order=orderedKeys();const index=order.indexOf(key),target=index+direction;if(index<0||target<0||target>=order.length)return;[order[index],order[target]]=[order[target],order[index]];config.order=order;markChanged();}
  function moveBefore(dragged,target){const order=orderedKeys().filter(key=>key!==dragged);const index=order.indexOf(target);order.splice(index<0?order.length:index,0,dragged);config.order=order;markChanged();}
  function archiveEntry(key){if(!config.archived.includes(key))config.archived.push(key);config.order=config.order.filter(item=>item!==key);markChanged();}
  function restoreEntry(key){config.archived=config.archived.filter(item=>item!==key);config.order.push(key);markChanged();}
  function renderArchiveList(){
    const root=document.getElementById('registryArchiveList');if(!root)return;root.replaceChildren();
    if(!config.archived.length){const empty=document.createElement('p');empty.className='meta';empty.textContent='アーカイブは空です。';root.append(empty);return;}
    config.archived.forEach(key=>{
      const custom=config.customCards.find(item=>customKey(item)===key);const original=originalItemForKey(key);const name=custom?.title||cardDisplayValues(original||{'システム名':'不明',__cardKey:key}).title;
      const row=document.createElement('div');row.className='registry-archive-row';const span=document.createElement('span');span.textContent=name;const actions=document.createElement('div');actions.className='registry-editor-actions';const restore=document.createElement('button');restore.className='btn';restore.type='button';restore.textContent='戻す';restore.onclick=()=>restoreEntry(key);actions.append(restore);
      if(custom){const del=document.createElement('button');del.className='btn';del.type='button';del.textContent='完全削除';del.onclick=()=>{if(confirm('この追加カードを完全に削除しますか？')){config.customCards=config.customCards.filter(item=>customKey(item)!==key);config.archived=config.archived.filter(item=>item!==key);delete config.cards[key];markChanged();}};actions.append(del);}
      row.append(span,actions);root.append(row);
    });
  }

  function openCardForm(key){
    editingKey=key;
    const formPanel=document.getElementById('registryCardFormPanel');
    const title=document.getElementById('registryCardFormTitle');
    const custom=config.customCards.find(item=>customKey(item)===key);
    const item=currentItemForKey(key);
    const display=item?cardDisplayValues(item):{title:'',summary:''};
    const finalItem=item?applyAssetInfo(applyConfirmedInfo(item)):{};
    title.textContent=key?'カードを編集':'カードを追加';
    document.getElementById('registryCardName').value=custom?.title||display.title||'';
    document.getElementById('registryCardSummary').value=custom?.summary||display.summary||'';
    document.getElementById('registryCardUrl').value=custom?.url||finalItem['利用者向けURL']||'';
    document.getElementById('registryCardCategory').value=custom?.category||finalItem['分類']||'管理・運営';
    document.getElementById('registryCardStatus').value=custom?.status||finalItem['状態']||'本番使用中';
    const categories=[...new Set((rawBaseSystems||[]).map(item=>String(item['分類']||'')).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ja'));
    const datalist=document.getElementById('registryCategoryList');datalist.replaceChildren(...categories.map(value=>{const o=document.createElement('option');o.value=value;return o;}));
    formPanel.classList.remove('hidden');document.getElementById('registryCardName').focus();
  }
  function closeCardForm(){document.getElementById('registryCardFormPanel').classList.add('hidden');editingKey='';}
  function saveCardForm(event){
    event.preventDefault();
    const title=document.getElementById('registryCardName').value.trim();if(!title)return;
    const summary=document.getElementById('registryCardSummary').value.trim();
    const url=document.getElementById('registryCardUrl').value.trim();
    const category=document.getElementById('registryCardCategory').value.trim()||'未分類';
    const status=document.getElementById('registryCardStatus').value.trim()||'要確認';
    if(!editingKey){
      const id=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
      const custom={id,title,summary,url,category,status};config.customCards.push(custom);config.order.unshift(customKey(custom));
    }else{
      const custom=config.customCards.find(item=>customKey(item)===editingKey);
      if(custom)Object.assign(custom,{title,summary,url,category,status});
      else config.cards[editingKey]=Object.assign({},config.cards[editingKey]||{},{title,summary,url,category,status});
    }
    closeCardForm();markChanged();
  }

  injectUi();
  const settingsButton=document.getElementById('openCardSettings');
  if(settingsButton){
    settingsButton.removeEventListener('click',openCardSettings);
    settingsButton.textContent='編集・設定';
    settingsButton.addEventListener('click',openManagement);
  }
})();
