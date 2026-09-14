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
  let typeDraft=null;
  const DEFAULT_AUDIENCE_TYPES=[
    {name:'講師',icon:'👨‍🏫',color:'#2563eb'},
    {name:'生徒',icon:'🎒',color:'#16a34a'},
    {name:'スタッフ',icon:'👥',color:'#ea580c'},
    {name:'管理者',icon:'⚙️',color:'#7c3aed'},
    {name:'その他',icon:'●',color:'#64748b'}
  ];
  const DEFAULT_PURPOSE_TYPES=[
    {name:'請求・経理',icon:'🧾',color:'#b45309'},
    {name:'講師',icon:'👨‍🏫',color:'#1d4ed8'},
    {name:'生徒・成績',icon:'📚',color:'#15803d'},
    {name:'受付・事務',icon:'🗂️',color:'#0e7490'},
    {name:'広告宣伝',icon:'📣',color:'#be185d'},
    {name:'その他',icon:'●',color:'#64748b'}
  ];
  let config=loadConfig();

  function clone(value){return JSON.parse(JSON.stringify(value));}
  function normalizeTypeList(value,defaults){
    const source=Array.isArray(value)&&value.length?value:defaults;
    const seen=new Set();
    const result=source.map(item=>({name:String(item?.name||'').trim(),icon:String(item?.icon||'●').trim()||'●',color:/^#[0-9a-f]{6}$/i.test(String(item?.color||''))?String(item.color):'#64748b'})).filter(item=>item.name&&!seen.has(item.name)&&(seen.add(item.name),true));
    if(!result.some(item=>item.name==='その他'))result.push({name:'その他',icon:'●',color:'#64748b'});
    return result;
  }
  function emptyConfig(){return {schemaVersion:3,order:[],cards:{},customCards:[],archived:[],audienceTypes:clone(DEFAULT_AUDIENCE_TYPES),purposeTypes:clone(DEFAULT_PURPOSE_TYPES)};}
  function normalizeConfig(value){
    const out=emptyConfig();
    if(value&&typeof value==='object'){
      out.order=Array.isArray(value.order)?value.order.map(String):[];
      out.cards=value.cards&&typeof value.cards==='object'?clone(value.cards):{};
      out.customCards=Array.isArray(value.customCards)?value.customCards.filter(Boolean).map(item=>Object.assign({},item)):[];
      out.archived=Array.isArray(value.archived)?value.archived.map(String):[];
      out.audienceTypes=normalizeTypeList(value.audienceTypes,DEFAULT_AUDIENCE_TYPES);
      out.purposeTypes=normalizeTypeList(value.purposeTypes,DEFAULT_PURPOSE_TYPES);
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

  function unique(values){return [...new Set(values.filter(Boolean))];}
  function defaultClassification(item){
    const title=String(cardDisplayValues(item).title||item['システム名']||item['正式名称']||'');
    const source=`${title} ${item['概要']||''} ${item['利用者']||''}`;
    const audiences=[];
    if(/講師|先生/.test(source))audiences.push('講師');
    if(/生徒|塾生|子供/.test(source))audiences.push('生徒');
    if(/スタッフ|受付/.test(source))audiences.push('スタッフ');
    if(/管理者|所有者|保護者|経理/.test(source))audiences.push('管理者');
    if(!audiences.length)audiences.push(/ホームページ|お問い合せ|問い合わせ|紹介/.test(source)?'その他':'スタッフ');

    let purpose='その他';
    if(/請求|経理|給与|証憑|領収|不達メール|ゆうちょBIZ/.test(source))purpose='請求・経理';
    else if(/講師|先生|コマ数|出勤/.test(source))purpose='講師';
    else if(/生徒マスタ|成績|進捗|定期テスト|過去問|塾生アプリ|V-code|プリント書き込み/.test(source))purpose='生徒・成績';
    else if(/ホームページ|広告|宣伝|配信システム|お知らせ|問い合わせ/.test(source))purpose='広告宣伝';
    else if(/受付|事務|面談|エントリー|紹介カード|遅刻|欠席|早退|QR|業務ホーム|管理ポータル|時間制限/.test(source))purpose='受付・事務';
    return {audiences:unique(audiences),purpose};
  }
  function classificationForItem(item){
    const defaults=defaultClassification(item);
    const custom=config.customCards.find(entry=>customKey(entry)===item.__cardKey);
    const override=custom||overrideForItem(item)||{};
    const validAudiences=new Set(config.audienceTypes.map(type=>type.name));
    const validPurposes=new Set(config.purposeTypes.map(type=>type.name));
    const chosen=Array.isArray(override.audiences)?override.audiences.map(String).filter(name=>validAudiences.has(name)):defaults.audiences.filter(name=>validAudiences.has(name));
    return {audiences:chosen.length?unique(chosen):['その他'],purpose:validPurposes.has(String(override.purpose||''))?String(override.purpose):validPurposes.has(defaults.purpose)?defaults.purpose:'その他'};
  }
  function typeDefinition(kind,name){
    const list=kind==='audience'?config.audienceTypes:config.purposeTypes;
    return list.find(type=>type.name===name)||list.find(type=>type.name==='その他')||{name,icon:'●',color:'#64748b'};
  }
  function badge(kind,name){
    const definition=typeDefinition(kind,name);
    const node=document.createElement('span');
    node.className=`registry-classification-badge registry-${kind}-badge`;
    node.style.setProperty('--badge-color',definition.color);
    node.textContent=`${definition.icon} ${definition.name}`;
    node.title=kind==='audience'?`使う人：${definition.name}`:`アプリの種類：${definition.name}`;
    return node;
  }

  function configuredBase(){
    if(!rawBaseSystems)return [];
    const archived=new Set(config.archived||[]);
    const base=rawBaseSystems.map(item=>applyFieldOverrides(Object.assign({},item))).filter(item=>!archived.has(item.__cardKey));
    config.customCards.forEach((custom,index)=>{
      const key=customKey(custom);
      if(archived.has(key))return;
      const customTitle=String(custom.title||'').trim();
      const customUrl=String(custom.url||'').trim().replace(/\/$/,'');
      if(base.some(item=>String(item['システム名']||'').trim()===customTitle||
        (customUrl&&String(item['利用者向けURL']||'').trim().replace(/\/$/,'')===customUrl)))return;
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
      .registry-card-edit{border:1px solid #bfd4f6;background:#edf4ff;color:#1d4ed8;border-radius:8px;padding:5px 9px;font-weight:800;cursor:pointer;white-space:nowrap}.registry-classification{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.registry-classification-group{display:flex;flex-wrap:wrap;gap:5px;align-items:center}.registry-classification-label{font-size:11px;font-weight:900;color:#627d98;margin-right:1px}.registry-classification-badge{display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border:1px solid color-mix(in srgb,var(--badge-color) 38%,white);border-radius:999px;background:color-mix(in srgb,var(--badge-color) 10%,white);color:var(--badge-color);font-size:12px;font-weight:900;line-height:1.25;white-space:nowrap}
      .registry-editor-panel,.registry-card-form-panel,.registry-type-panel{position:fixed;inset:0;background:rgba(15,35,55,.6);z-index:80;padding:18px;overflow:auto}
      .registry-editor-dialog{width:min(1120px,100%);margin:0 auto;background:#fff;border-radius:18px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.28)}
      .registry-editor-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.registry-editor-head h2{margin:0;color:#102a43}.registry-editor-head p{margin:5px 0 0;color:#627d98}
      .registry-editor-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:16px 0}.registry-editor-toolbar .spacer{flex:1}.registry-sync{font-size:12px;font-weight:800;color:#486581}.registry-sync[data-state="ready"]{color:#147d4d}.registry-sync[data-state="error"],.registry-sync[data-state="conflict"]{color:#b42318}.registry-sync[data-state="saving"]{color:#9a6700}
      .registry-editor-list{display:grid;gap:9px}.registry-editor-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid #d8e2ec;border-radius:12px;padding:11px;background:#f8fbff}.registry-editor-row.is-dragging{opacity:.45}.registry-editor-row.is-drop{outline:3px solid #93c5fd}.registry-order{display:flex;gap:4px}.registry-order button{min-width:34px}.registry-editor-copy strong{display:block;color:#102a43}.registry-editor-copy small{display:block;margin-top:3px;color:#627d98}.registry-editor-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
      .registry-archive-box{margin-top:18px;border-top:1px solid #d8e2ec;padding-top:14px}.registry-archive-box h3{margin:0 0 9px;color:#486581}.registry-archive-row{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid #edf2f7}
      .registry-card-form{width:min(680px,100%);margin:4vh auto;background:#fff;border-radius:18px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.28)}.registry-card-form h2{margin:0;color:#102a43}.registry-card-form>label{display:block;font-weight:800;color:#486581;margin-top:13px}.registry-card-form input,.registry-card-form textarea,.registry-card-form select{display:block;width:100%;margin-top:6px;border:1px solid #bcccdc;border-radius:10px;padding:10px 11px;font:inherit;color:#152536;background:#fff}.registry-card-form textarea{min-height:90px;resize:vertical}.registry-audience-choices{display:flex;flex-wrap:wrap;gap:7px;margin-top:7px}.registry-audience-choice{display:flex!important;align-items:center;gap:6px;margin:0!important;padding:8px 10px;border:1px solid #d8e2ec;border-radius:9px;background:#f8fbff;color:#334e68!important}.registry-audience-choice input{width:auto!important;margin:0!important}.registry-form-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
      .registry-type-dialog{width:min(820px,100%);margin:2vh auto;background:#fff;border-radius:18px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.28)}.registry-type-columns{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}.registry-type-box{border:1px solid #d8e2ec;border-radius:13px;padding:13px;background:#f8fbff}.registry-type-box h3{margin:0 0 10px;color:#102a43}.registry-type-list{display:grid;gap:8px}.registry-type-row{display:grid;grid-template-columns:70px minmax(0,1fr) 58px auto;gap:7px;align-items:center}.registry-type-row input{width:100%;min-width:0;border:1px solid #bcccdc;border-radius:8px;padding:8px;background:#fff;font:inherit}.registry-type-row input[type=color]{padding:3px;height:38px}.registry-type-actions{display:flex;justify-content:space-between;gap:8px;margin-top:12px}.registry-type-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:18px;padding-top:14px;border-top:1px solid #d8e2ec}
      @media(max-width:720px){.registry-editor-row{grid-template-columns:1fr}.registry-order,.registry-editor-actions{justify-content:flex-start}.registry-editor-panel,.registry-card-form-panel,.registry-type-panel{padding:8px}.registry-editor-dialog,.registry-card-form,.registry-type-dialog{padding:15px}.registry-type-columns{grid-template-columns:1fr}.registry-type-row{grid-template-columns:58px minmax(0,1fr) 48px auto}}
    `;
    document.head.append(style);

    const panel=document.createElement('section');
    panel.id='registryEditorPanel';panel.className='registry-editor-panel hidden';
    panel.innerHTML=`<div class="registry-editor-dialog"><div class="registry-editor-head"><div><h2>資産管理の編集・設定</h2><p>カード追加・編集・並べ替え・アーカイブと、色分けの分類項目を設定できます。</p></div><button class="btn" id="registryEditorClose" type="button">完了</button></div><div class="registry-editor-toolbar"><button class="open" id="registryAddCard" type="button">＋ カード追加</button><button class="btn" id="registryTypeSettings" type="button">🎨 分類項目の設定</button><button class="btn" id="registryPublishNow" type="button">この配置を全端末へ反映</button><span class="spacer"></span><span class="registry-sync" id="registryEditorSync">共有状態を確認中…</span></div><div class="registry-editor-list" id="registryEditorList"></div><div class="registry-archive-box"><h3>アーカイブ</h3><div id="registryArchiveList"></div></div></div>`;
    document.body.append(panel);

    const formPanel=document.createElement('section');
    formPanel.id='registryCardFormPanel';formPanel.className='registry-card-form-panel hidden';
    formPanel.innerHTML=`<form class="registry-card-form" id="registryCardForm"><div class="registry-editor-head"><div><h2 id="registryCardFormTitle">カードを編集</h2></div><button class="btn" id="registryCardFormClose" type="button">×</button></div><label>表示名<input id="registryCardName" maxlength="80" required></label><label>説明<textarea id="registryCardSummary" maxlength="500"></textarea></label><label>URL<input id="registryCardUrl" type="url" placeholder="https://"></label><label>誰が使うか（複数選択可）<span class="registry-audience-choices" id="registryCardAudiences"></span></label><label>何のアプリか<select id="registryCardPurpose"></select></label><label>従来の分類（詳細情報）<input id="registryCardCategory" list="registryCategoryList" maxlength="40"></label><datalist id="registryCategoryList"></datalist><label>状態<input id="registryCardStatus" list="registryStatusList" maxlength="60"></label><datalist id="registryStatusList"><option value="本番使用中"><option value="本番"><option value="開発中"><option value="要確認"><option value="旧システム"></datalist><div class="registry-form-actions"><button class="btn" id="registryCardCancel" type="button">キャンセル</button><button class="open" type="submit">保存</button></div></form>`;
    document.body.append(formPanel);

    const typePanel=document.createElement('section');
    typePanel.id='registryTypePanel';typePanel.className='registry-type-panel hidden';
    typePanel.innerHTML=`<div class="registry-type-dialog"><div class="registry-editor-head"><div><h2>分類項目の設定</h2><p>分類名・アイコン・色を変更できます。新しい項目も追加できます。</p></div><button class="btn" id="registryTypeClose" type="button">×</button></div><div class="registry-type-columns"><section class="registry-type-box"><h3>誰が使うか</h3><div class="registry-type-list" id="registryAudienceTypeList"></div><div class="registry-type-actions"><button class="btn" id="registryAddAudienceType" type="button">＋ 項目追加</button></div></section><section class="registry-type-box"><h3>何のアプリか</h3><div class="registry-type-list" id="registryPurposeTypeList"></div><div class="registry-type-actions"><button class="btn" id="registryAddPurposeType" type="button">＋ 項目追加</button></div></section></div><div class="registry-type-footer"><button class="btn" id="registryTypeCancel" type="button">キャンセル</button><button class="open" id="registryTypeSave" type="button">保存</button></div></div>`;
    document.body.append(typePanel);

    document.getElementById('registryEditorClose').addEventListener('click',closeManagement);
    document.getElementById('registryAddCard').addEventListener('click',()=>openCardForm(''));
    document.getElementById('registryTypeSettings').addEventListener('click',openTypeSettings);
    document.getElementById('registryPublishNow').addEventListener('click',saveSharedConfig);
    document.getElementById('registryCardFormClose').addEventListener('click',closeCardForm);
    document.getElementById('registryCardCancel').addEventListener('click',closeCardForm);
    document.getElementById('registryCardForm').addEventListener('submit',saveCardForm);
    document.getElementById('registryTypeClose').addEventListener('click',closeTypeSettings);
    document.getElementById('registryTypeCancel').addEventListener('click',closeTypeSettings);
    document.getElementById('registryTypeSave').addEventListener('click',saveTypeSettings);
    document.getElementById('registryAddAudienceType').addEventListener('click',()=>addTypeRow('audience'));
    document.getElementById('registryAddPurposeType').addEventListener('click',()=>addTypeRow('purpose'));
    panel.addEventListener('click',event=>{if(event.target===panel)closeManagement();});
    formPanel.addEventListener('click',event=>{if(event.target===formPanel)closeCardForm();});
    typePanel.addEventListener('click',event=>{if(event.target===typePanel)closeTypeSettings();});
  }

  function activeEntries(){
    return systems.map(item=>({key:item.__cardKey,item,title:cardDisplayValues(item).title,summary:cardDisplayValues(item).summary}));
  }
  function originalItemForKey(key){return rawBaseSystems?.find(item=>item.__cardKey===key)||null;}
  function currentItemForKey(key){return systems.find(item=>item.__cardKey===key)||originalItemForKey(key)||null;}
  function decorateCards(){
    document.querySelectorAll('#cards .card').forEach(article=>{
      const item=systems.find(system=>cardAnchor(system)===article.id);
      if(!item)return;
      const titleWrap=article.querySelector('.card-title-wrap');
      if(titleWrap&&!titleWrap.querySelector('.registry-classification')){
        const classification=classificationForItem(item);
        const holder=document.createElement('div');holder.className='registry-classification';
        const audienceGroup=document.createElement('span');audienceGroup.className='registry-classification-group';
        const audienceLabel=document.createElement('span');audienceLabel.className='registry-classification-label';audienceLabel.textContent='使う人';audienceGroup.append(audienceLabel,...classification.audiences.map(name=>badge('audience',name)));
        const purposeGroup=document.createElement('span');purposeGroup.className='registry-classification-group';
        const purposeLabel=document.createElement('span');purposeLabel.className='registry-classification-label';purposeLabel.textContent='種類';purposeGroup.append(purposeLabel,badge('purpose',classification.purpose));
        holder.append(audienceGroup,purposeGroup);titleWrap.append(holder);
      }
      if(!article.querySelector('.registry-card-edit')){
        const button=document.createElement('button');button.type='button';button.className='registry-card-edit';button.textContent='✎ 編集';button.addEventListener('click',()=>openCardForm(item.__cardKey));
        article.querySelector('.card-head')?.append(button);
      }
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
      const classification=classificationForItem(entry.item);const copy=document.createElement('div');copy.className='registry-editor-copy';const strong=document.createElement('strong');strong.textContent=entry.title;const small=document.createElement('small');small.textContent=[`使う人：${classification.audiences.join('・')}`,`種類：${classification.purpose}`,entry.item['状態']].filter(Boolean).join(' / ');copy.append(strong,small);
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
    const classification=item?classificationForItem(item):{audiences:['スタッフ'],purpose:'その他'};
    const audienceRoot=document.getElementById('registryCardAudiences');audienceRoot.replaceChildren(...config.audienceTypes.map(type=>{
      const label=document.createElement('label');label.className='registry-audience-choice';label.style.borderColor=`${type.color}55`;const input=document.createElement('input');input.type='checkbox';input.name='registryAudience';input.value=type.name;input.checked=classification.audiences.includes(type.name);const text=document.createElement('span');text.textContent=`${type.icon} ${type.name}`;label.append(input,text);return label;
    }));
    const purposeSelect=document.getElementById('registryCardPurpose');purposeSelect.replaceChildren(...config.purposeTypes.map(type=>{const option=document.createElement('option');option.value=type.name;option.textContent=`${type.icon} ${type.name}`;return option;}));purposeSelect.value=classification.purpose;
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
    const audiences=[...document.querySelectorAll('input[name="registryAudience"]:checked')].map(input=>input.value);
    if(!audiences.length){alert('「誰が使うか」を1つ以上選んでください。');return;}
    const purpose=document.getElementById('registryCardPurpose').value||'その他';
    const category=document.getElementById('registryCardCategory').value.trim()||'未分類';
    const status=document.getElementById('registryCardStatus').value.trim()||'要確認';
    if(!editingKey){
      const id=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
      const custom={id,title,summary,url,category,status,audiences,purpose};config.customCards.push(custom);config.order.unshift(customKey(custom));
    }else{
      const custom=config.customCards.find(item=>customKey(item)===editingKey);
      if(custom)Object.assign(custom,{title,summary,url,category,status,audiences,purpose});
      else config.cards[editingKey]=Object.assign({},config.cards[editingKey]||{},{title,summary,url,category,status,audiences,purpose});
    }
    closeCardForm();markChanged();
  }

  function openTypeSettings(){
    typeDraft={audienceTypes:clone(config.audienceTypes),purposeTypes:clone(config.purposeTypes)};
    renderTypeSettings();document.getElementById('registryTypePanel').classList.remove('hidden');
  }
  function closeTypeSettings(){document.getElementById('registryTypePanel').classList.add('hidden');typeDraft=null;}
  function renderTypeSettings(){
    if(!typeDraft)return;
    renderTypeList('audience',document.getElementById('registryAudienceTypeList'),typeDraft.audienceTypes);
    renderTypeList('purpose',document.getElementById('registryPurposeTypeList'),typeDraft.purposeTypes);
  }
  function renderTypeList(kind,root,list){
    root.replaceChildren(...list.map((type,index)=>{
      const row=document.createElement('div');row.className='registry-type-row';
      const icon=document.createElement('input');icon.value=type.icon;icon.maxLength=8;icon.title='アイコン';icon.setAttribute('aria-label','アイコン');icon.addEventListener('input',()=>type.icon=icon.value);
      const name=document.createElement('input');name.value=type.name;name.maxLength=24;name.title='分類名';name.setAttribute('aria-label','分類名');name.addEventListener('input',()=>type.name=name.value);
      const color=document.createElement('input');color.type='color';color.value=type.color;color.title='色';color.setAttribute('aria-label','色');color.addEventListener('input',()=>type.color=color.value);
      const remove=document.createElement('button');remove.type='button';remove.className='btn';remove.textContent='削除';remove.disabled=type.name==='その他';remove.addEventListener('click',()=>{list.splice(index,1);renderTypeSettings();});
      row.append(icon,name,color,remove);return row;
    }));
  }
  function addTypeRow(kind){
    if(!typeDraft)return;const list=kind==='audience'?typeDraft.audienceTypes:typeDraft.purposeTypes;list.splice(Math.max(0,list.length-1),0,{name:'新しい項目',icon:'●',color:'#2563eb'});renderTypeSettings();
  }
  function saveTypeSettings(){
    if(!typeDraft)return;
    const audienceTypes=normalizeTypeList(typeDraft.audienceTypes,DEFAULT_AUDIENCE_TYPES);const purposeTypes=normalizeTypeList(typeDraft.purposeTypes,DEFAULT_PURPOSE_TYPES);
    if(new Set(audienceTypes.map(type=>type.name)).size!==audienceTypes.length||new Set(purposeTypes.map(type=>type.name)).size!==purposeTypes.length){alert('同じ分類名は2つ登録できません。');return;}
    config.audienceTypes=audienceTypes;config.purposeTypes=purposeTypes;closeTypeSettings();markChanged();
  }

  injectUi();
  const settingsButton=document.getElementById('openCardSettings');
  if(settingsButton){
    settingsButton.removeEventListener('click',openCardSettings);
    settingsButton.textContent='編集・設定';
    settingsButton.addEventListener('click',openManagement);
  }
})();
