(() => {
  'use strict';

  const LOCAL_KEY='stepSystemRegistryDetailLinksV1';
  const SHARED_KEY='registryDetailLinksConfig';
  let config=loadLocal();
  let editingKey='';
  let draft=[];
  let saveTimer=null;
  let saving=false;
  let dirtySinceSharedLoad=false;

  const clone=value=>JSON.parse(JSON.stringify(value));
  const makeId=prefix=>`${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
  function normalizeLink(link){
    const openUrl=String(link?.openUrl||link?.url||'').trim();
    const copyUrl=String(link?.copyUrl||openUrl).trim();
    return {id:String(link?.id||makeId('link')),title:String(link?.title||'').trim(),openUrl,copyUrl,memo:String(link?.memo||'').trim()};
  }
  function normalizeGroup(group){
    return {id:String(group?.id||makeId('group')),title:String(group?.title||'').trim()||'【詳細】',note:String(group?.note||'').trim(),links:Array.isArray(group?.links)?group.links.map(normalizeLink):[]};
  }
  function normalizeConfig(value){
    const out={schemaVersion:1,cards:{}};
    if(value&&typeof value==='object'&&value.cards&&typeof value.cards==='object'){
      Object.entries(value.cards).forEach(([key,groups])=>{if(Array.isArray(groups))out.cards[String(key)]=groups.map(normalizeGroup);});
    }
    return out;
  }
  function loadLocal(){try{return normalizeConfig(JSON.parse(localStorage.getItem(LOCAL_KEY)||'null'));}catch(_){return normalizeConfig(null);}}
  function persistLocal(){try{localStorage.setItem(LOCAL_KEY,JSON.stringify(config));}catch(_){}}
  function itemKey(item){return item?.__cardKey||cardCustomizationKey(item,item?.__sourceIndex||0);}
  function findItemForArticle(article){return systems.find(item=>cardAnchor(item)===article.id)||null;}
  function findArticleForKey(key){const item=systems.find(entry=>itemKey(entry)===key);return item?document.getElementById(cardAnchor(item)):null;}
  function hasOverride(key){return Object.prototype.hasOwnProperty.call(config.cards,key);}
  function cleanText(node,removeSelector){if(!node)return '';const copy=node.cloneNode(true);if(removeSelector)copy.querySelectorAll(removeSelector).forEach(el=>el.remove());return copy.textContent.trim();}

  function captureRenderedGroups(article){
    const body=article?.querySelector('.card-body');if(!body)return [];
    return Array.from(body.children).filter(node=>node.classList?.contains('group')&&node.querySelector('.link-row')).map((group,index)=>{
      const title=cleanText(group.querySelector('h3'),'.registry-detail-group-edit');
      const note=Array.from(group.children).filter(node=>node.tagName==='P'&&!node.classList.contains('registry-detail-memo')).map(node=>node.textContent.trim()).filter(Boolean).join('\n');
      const links=Array.from(group.querySelectorAll('.link-row')).map((row,rowIndex)=>{
        const open=row.querySelector('a.open');
        const url=open?.href||'';
        const memo=row.nextElementSibling?.classList?.contains('registry-detail-memo')?row.nextElementSibling.textContent.trim():'';
        return {id:`captured-${index}-${rowIndex}`,title:cleanText(row.querySelector('.link-name'),'.billing-adjustment-url'),openUrl:url,copyUrl:url,memo};
      }).filter(link=>link.title||link.openUrl||link.memo);
      return {id:`captured-group-${index}`,title:title||'【詳細】',note,links};
    });
  }
  function groupsForKey(key,article){return hasOverride(key)?clone(config.cards[key]):captureRenderedGroups(article||findArticleForKey(key));}

  function createLinkBlock(link){
    const block=document.createElement('div');block.className='registry-detail-link-block';
    const row=document.createElement('div');row.className='link-row registry-detail-custom-row';
    const name=document.createElement('span');name.className='link-name';name.textContent=link.title||'名称未設定';
    const openUrl=String(link.openUrl||'').trim();const copyTarget=String(link.copyUrl||openUrl).trim();
    let open;
    if(openUrl){open=document.createElement('a');open.className='open';open.textContent='開く';open.href=normalizePortalUrl(openUrl);open.target='_blank';open.rel='noopener noreferrer';}
    else{open=document.createElement('button');open.className='open registry-detail-disabled';open.type='button';open.textContent='開く';open.disabled=true;}
    const copy=document.createElement('button');copy.className='copy';copy.type='button';copy.textContent='URLをコピー';copy.disabled=!copyTarget;if(copyTarget)copy.addEventListener('click',()=>copyUrl(normalizePortalUrl(copyTarget)));
    row.append(name,open,copy);block.append(row);
    if(link.memo){const memo=document.createElement('p');memo.className='registry-detail-memo';memo.textContent=link.memo;block.append(memo);}
    return block;
  }
  function createGroup(group,key,index){
    const section=document.createElement('section');section.className='group registry-detail-custom-group';section.dataset.registryDetailGroupId=group.id;
    const heading=document.createElement('h3');heading.textContent=group.title||'【詳細】';
    const edit=document.createElement('button');edit.type='button';edit.className='registry-detail-group-edit';edit.textContent='✎ 編集';edit.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openEditor(key,findArticleForKey(key),index);});heading.append(edit);section.append(heading);
    group.links.forEach(link=>section.append(createLinkBlock(link)));
    if(group.note){const note=document.createElement('p');note.className='technical-note registry-detail-group-note';note.textContent=group.note;section.append(note);}
    return section;
  }
  function replacementAnchor(body){
    return Array.from(body.children).find(node=>node.classList?.contains('details')||node.classList?.contains('flow')||node.classList?.contains('generation')||node.classList?.contains('warning-box')||node.classList?.contains('technical-note')||node.classList?.contains('asset-section')||node.classList?.contains('investigation-item')||node.classList?.contains('detail-bottom-toggle'))||null;
  }
  function renderOverride(article,key){
    const body=article.querySelector('.card-body');if(!body)return;
    Array.from(body.children).filter(node=>node.classList?.contains('group')&&node.querySelector('.link-row')).forEach(node=>node.remove());
    body.querySelectorAll(':scope > .registry-detail-add').forEach(node=>node.remove());
    const groups=config.cards[key]||[];const anchor=replacementAnchor(body);
    groups.forEach((group,index)=>body.insertBefore(createGroup(group,key,index),anchor));
  }
  function decorateDetails(){
    if(!canCustomizeCards())return;
    document.querySelectorAll('#cards .card').forEach(article=>{
      const item=findItemForArticle(article);if(!item)return;const key=itemKey(item);const body=article.querySelector('.card-body');if(!body)return;
      if(hasOverride(key))renderOverride(article,key);
      else Array.from(body.children).filter(node=>node.classList?.contains('group')&&node.querySelector('.link-row')).forEach((group,index)=>{
        const h3=group.querySelector('h3');if(!h3||h3.querySelector('.registry-detail-group-edit'))return;
        const button=document.createElement('button');button.type='button';button.className='registry-detail-group-edit';button.textContent='✎ 編集';button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openEditor(key,article,index);});h3.append(button);
      });
      if(!body.querySelector(':scope > .registry-detail-add')){
        const add=document.createElement('button');add.type='button';add.className='btn registry-detail-add';add.textContent='＋ 詳細項目を追加';add.addEventListener('click',()=>openEditor(key,article,-1,true));
        const bottom=body.querySelector('.detail-bottom-toggle');body.insertBefore(add,bottom||body.firstChild);
      }
    });
  }

  const baseRender=render;render=function(){baseRender();decorateDetails();};
  const baseShowPortal=showPortal;showPortal=function(items){baseShowPortal(items);queueMicrotask(loadShared);};

  function setSync(text,state){const el=document.getElementById('registryDetailSync');if(el){el.textContent=text;el.dataset.state=state||'';}}
  async function loadShared(){
    try{const result=await api('getWorkspaceConfig');if(!result?.success)return;const remote=result.sharedState?.[SHARED_KEY];if(remote&&!dirtySinceSharedLoad){config=normalizeConfig(remote);persistLocal();render();setSync('全パソコンで共有中','ready');}else if(remote)setSync('この端末の変更を保存待ちです','saving');else setSync('編集内容は保存時に全パソコンへ共有されます','local');}
    catch(_){setSync('現在はこの端末の設定を表示しています','error');}
  }
  function scheduleSharedSave(){clearTimeout(saveTimer);setSync('全パソコンへ保存待ち…','saving');saveTimer=setTimeout(saveShared,650);}
  async function saveShared(){
    if(saving)return;saving=true;
    try{const fresh=await api('getWorkspaceConfig');if(!fresh?.success)throw new Error(fresh?.error||'共有設定を取得できませんでした。');const envelope=fresh.sharedState&&typeof fresh.sharedState==='object'?clone(fresh.sharedState):{};const expectedVersion=Number(fresh.version||0);envelope[SHARED_KEY]=clone(config);const saved=await api('saveWorkspaceConfig',{sharedState:envelope,expectedVersion});if(!saved?.success){if(saved?.code==='WORKSPACE_VERSION_CONFLICT'){setSync('別端末の更新と重なりました。再保存します…','conflict');saveTimer=setTimeout(saveShared,900);return;}throw new Error(saved?.error||'共有設定を保存できませんでした。');}dirtySinceSharedLoad=false;setSync(`全パソコンへ保存しました（版 ${saved.version||expectedVersion+1}）`,'ready');}
    catch(error){setSync(error.message||'共有設定を保存できませんでした','error');}finally{saving=false;}
  }

  function injectUi(){
    const style=document.createElement('style');style.id='registry-detail-editor-style';style.textContent=`
      .group>h3{display:flex;align-items:center;gap:8px}.registry-detail-group-edit{margin-left:auto;border:1px solid #bfd4f6;background:#edf4ff;color:#1d4ed8;border-radius:7px;padding:4px 8px;font-size:12px;font-weight:800;cursor:pointer}.registry-detail-add{margin-top:12px}.registry-detail-memo{margin:3px 0 9px;padding:6px 9px;border-left:3px solid #9bbcf5;background:#f5f9ff;color:#486581;border-radius:0 7px 7px 0;font-size:12px;line-height:1.55;white-space:pre-wrap}.registry-detail-disabled{opacity:.45;cursor:not-allowed}
      .registry-detail-panel{position:fixed;inset:0;background:rgba(15,35,55,.64);z-index:110;padding:16px;overflow:auto}.registry-detail-dialog{width:min(1180px,100%);margin:2vh auto;background:#fff;border-radius:18px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.3)}.registry-detail-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.registry-detail-head h2{margin:0;color:#102a43}.registry-detail-head p{margin:5px 0 0;color:#627d98}.registry-detail-groups{display:grid;gap:14px;margin-top:16px}.registry-detail-group-editor{border:1px solid #d8e2ec;border-radius:13px;padding:12px;background:#f8fbff}.registry-detail-group-top{display:grid;grid-template-columns:minmax(230px,1fr) minmax(260px,1.2fr) auto;gap:8px;align-items:end}.registry-detail-group-top label,.registry-detail-link-editor label{font-size:12px;font-weight:800;color:#486581}.registry-detail-group-top input,.registry-detail-group-top textarea,.registry-detail-link-editor input,.registry-detail-link-editor textarea{display:block;width:100%;margin-top:5px;border:1px solid #bcccdc;border-radius:9px;padding:9px;background:#fff;color:#152536;font:inherit}.registry-detail-group-top textarea{min-height:58px;resize:vertical}.registry-detail-group-actions,.registry-detail-link-actions{display:flex;gap:5px;align-items:center}.registry-detail-links{display:grid;gap:9px;margin-top:10px}.registry-detail-link-editor{display:grid;grid-template-columns:minmax(150px,.75fr) minmax(190px,1fr) minmax(190px,1fr) minmax(200px,1.1fr) auto;gap:7px;align-items:end;border-top:1px dashed #cbd8e6;padding-top:9px}.registry-detail-link-editor textarea{min-height:58px;resize:vertical}.registry-detail-group-footer{margin-top:9px}.registry-detail-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:14px}.registry-detail-toolbar .spacer{flex:1}.registry-detail-sync{font-size:12px;font-weight:800;color:#486581}.registry-detail-sync[data-state="ready"]{color:#147d4d}.registry-detail-sync[data-state="saving"]{color:#9a6700}.registry-detail-sync[data-state="error"],.registry-detail-sync[data-state="conflict"]{color:#b42318}.registry-detail-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:18px;padding-top:14px;border-top:1px solid #d8e2ec}.registry-detail-empty{padding:18px;border:1px dashed #bcccdc;border-radius:12px;text-align:center;color:#627d98;background:#f8fbff}
      @media(max-width:900px){.registry-detail-panel{padding:8px}.registry-detail-dialog{padding:14px}.registry-detail-group-top,.registry-detail-link-editor{grid-template-columns:1fr}.registry-detail-group-actions,.registry-detail-link-actions{justify-content:flex-end}}
    `;document.head.append(style);
    const panel=document.createElement('section');panel.id='registryDetailPanel';panel.className='registry-detail-panel hidden';panel.innerHTML=`<div class="registry-detail-dialog"><div class="registry-detail-head"><div><h2>詳細の編集</h2><p id="registryDetailCardName"></p></div><button class="btn" id="registryDetailClose" type="button">×</button></div><div class="registry-detail-groups" id="registryDetailGroups"></div><div class="registry-detail-toolbar"><button class="open" id="registryDetailAddGroup" type="button">＋ 詳細グループを追加</button><span class="spacer"></span><span class="registry-detail-sync" id="registryDetailSync">共有状態を確認中…</span></div><div class="registry-detail-footer"><button class="btn" id="registryDetailReset" type="button">元の詳細に戻す</button><button class="btn" id="registryDetailCancel" type="button">キャンセル</button><button class="open" id="registryDetailSave" type="button">保存</button></div></div>`;document.body.append(panel);
    document.getElementById('registryDetailClose').onclick=closeEditor;document.getElementById('registryDetailCancel').onclick=closeEditor;document.getElementById('registryDetailAddGroup').onclick=()=>{draft.push(normalizeGroup({title:'【詳細】',links:[]}));renderDraft();};document.getElementById('registryDetailSave').onclick=saveDraft;document.getElementById('registryDetailReset').onclick=resetDraft;panel.addEventListener('click',event=>{if(event.target===panel)closeEditor();});
  }
  function openEditor(key,article,index=-1,addNew=false){
    editingKey=key;draft=groupsForKey(key,article).map(normalizeGroup);if(addNew){draft.push(normalizeGroup({title:'【詳細】',links:[]}));index=draft.length-1;}const item=systems.find(entry=>itemKey(entry)===key);document.getElementById('registryDetailCardName').textContent=item?`${cardDisplayValues(item).title} の詳細リンク・メモ`:'詳細リンク・メモ';renderDraft();document.getElementById('registryDetailPanel').classList.remove('hidden');document.body.style.overflow='hidden';if(index>=0)setTimeout(()=>document.querySelector(`[data-detail-group-index="${index}"] input`)?.focus(),0);
  }
  function closeEditor(){document.getElementById('registryDetailPanel').classList.add('hidden');document.body.style.overflow='';editingKey='';draft=[];}
  function renderDraft(){
    const root=document.getElementById('registryDetailGroups');root.replaceChildren();if(!draft.length){const empty=document.createElement('div');empty.className='registry-detail-empty';empty.textContent='編集対象の詳細リンクはありません。「＋ 詳細グループを追加」で追加できます。';root.append(empty);return;}
    draft.forEach((group,gIndex)=>{
      const box=document.createElement('section');box.className='registry-detail-group-editor';box.dataset.detailGroupIndex=String(gIndex);
      const top=document.createElement('div');top.className='registry-detail-group-top';
      const title=document.createElement('label');title.textContent='詳細の見出し';const titleInput=document.createElement('input');titleInput.value=group.title;titleInput.addEventListener('input',()=>group.title=titleInput.value);title.append(titleInput);
      const note=document.createElement('label');note.textContent='グループメモ（任意）';const noteInput=document.createElement('textarea');noteInput.value=group.note||'';noteInput.placeholder='この詳細グループ全体への補足';noteInput.addEventListener('input',()=>group.note=noteInput.value);note.append(noteInput);
      const actions=document.createElement('div');actions.className='registry-detail-group-actions';const up=makeButton('↑',()=>moveGroup(gIndex,-1),gIndex===0);const down=makeButton('↓',()=>moveGroup(gIndex,1),gIndex===draft.length-1);const del=makeButton('グループ削除',()=>{draft.splice(gIndex,1);renderDraft();});actions.append(up,down,del);top.append(title,note,actions);box.append(top);
      const links=document.createElement('div');links.className='registry-detail-links';group.links.forEach((link,lIndex)=>links.append(renderLinkEditor(group,link,gIndex,lIndex)));box.append(links);
      const footer=document.createElement('div');footer.className='registry-detail-group-footer';const add=makeButton('＋ タイトル・URL・メモを追加',()=>{group.links.push(normalizeLink({title:'',openUrl:'',copyUrl:'',memo:''}));renderDraft();});add.classList.add('open');footer.append(add);box.append(footer);root.append(box);
    });
  }
  function renderLinkEditor(group,link,gIndex,lIndex){
    const row=document.createElement('div');row.className='registry-detail-link-editor';
    const title=field('タイトル','input',link.title,value=>link.title=value,'例：Apps Scriptを編集');
    const open=field('開く先URL','url',link.openUrl,value=>link.openUrl=value,'https://');
    const copy=field('コピーURL','url',link.copyUrl===link.openUrl?'':link.copyUrl,value=>link.copyUrl=value,'空欄なら開く先URLと同じ');
    const memo=field('コメント（メモ）','textarea',link.memo||'',value=>link.memo=value,'このリンクのすぐ下に表示するメモ');
    const actions=document.createElement('div');actions.className='registry-detail-link-actions';actions.append(makeButton('↑',()=>moveLink(group,lIndex,-1),lIndex===0),makeButton('↓',()=>moveLink(group,lIndex,1),lIndex===group.links.length-1),makeButton('削除',()=>{group.links.splice(lIndex,1);renderDraft();}));
    row.append(title,open,copy,memo,actions);return row;
  }
  function field(labelText,type,value,onInput,placeholder){const label=document.createElement('label');label.textContent=labelText;const input=type==='textarea'?document.createElement('textarea'):document.createElement('input');if(type!=='textarea')input.type=type;input.value=value||'';input.placeholder=placeholder||'';input.addEventListener('input',()=>onInput(input.value));label.append(input);return label;}
  function makeButton(text,handler,disabled=false){const button=document.createElement('button');button.type='button';button.className='btn';button.textContent=text;button.disabled=!!disabled;button.onclick=handler;return button;}
  function moveGroup(index,direction){const target=index+direction;if(target<0||target>=draft.length)return;[draft[index],draft[target]]=[draft[target],draft[index]];renderDraft();}
  function moveLink(group,index,direction){const target=index+direction;if(target<0||target>=group.links.length)return;[group.links[index],group.links[target]]=[group.links[target],group.links[index]];renderDraft();}
  function saveDraft(){
    if(!editingKey)return;const normalized=draft.map(group=>normalizeGroup({id:group.id,title:group.title,note:group.note,links:group.links.map(link=>{const openUrl=String(link.openUrl||'').trim();return {id:link.id,title:String(link.title||'').trim()||'名称未設定',openUrl,copyUrl:String(link.copyUrl||'').trim()||openUrl,memo:String(link.memo||'').trim()};})}));config.cards[editingKey]=normalized;dirtySinceSharedLoad=true;persistLocal();render();scheduleSharedSave();const toast=document.getElementById('toast');if(toast){toast.textContent='詳細を保存しました';toast.classList.remove('hidden');setTimeout(()=>{toast.classList.add('hidden');toast.textContent='URLをコピーしました';},1800);}closeEditor();
  }
  function resetDraft(){if(!editingKey)return;if(!confirm('このカードの詳細リンク編集をやめ、元の詳細表示に戻しますか？'))return;delete config.cards[editingKey];dirtySinceSharedLoad=true;persistLocal();render();scheduleSharedSave();closeEditor();}

  injectUi();
})();