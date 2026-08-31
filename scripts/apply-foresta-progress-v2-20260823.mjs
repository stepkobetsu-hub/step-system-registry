import fs from 'node:fs';

const path = 'index.html';
let text = fs.readFileSync(path, 'utf8');
const marker = 'foresta-progress-v2-qr-20260831';
if (text.includes(marker)) {
  console.log('Foresta QR registry patch already applied.');
  process.exit(0);
}

const block = `
<script id="${marker}">
(() => {
  const APP_URL='https://stepkobetsu-hub.github.io/foresta-progress-v2/';
  const QR_URL='https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data='+encodeURIComponent(APP_URL);
  function showQr(){
    let dialog=document.getElementById('forestaProgressQrDialog');
    if(!dialog){
      dialog=document.createElement('dialog');
      dialog.id='forestaProgressQrDialog';
      dialog.style.cssText='border:0;border-radius:18px;padding:0;max-width:390px;width:calc(100% - 32px);box-shadow:0 20px 60px rgba(0,0,0,.28)';
      dialog.innerHTML='<div style="padding:22px;text-align:center"><h2 style="margin:0 0 8px;color:#102a43">フォレスタ進捗管理 QRコード</h2><p style="margin:0 0 14px;color:#627d98;font-size:13px">通常利用URL</p><img alt="フォレスタ進捗管理 QRコード" style="width:min(280px,80vw);height:auto;border:1px solid #d8e2ec;border-radius:12px;background:#fff;padding:8px" src="'+QR_URL+'"><p style="font-size:12px;overflow-wrap:anywhere;color:#486581">'+APP_URL+'</p><div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><a class="open" target="_blank" rel="noopener" href="'+APP_URL+'">ページを開く</a><button type="button" class="btn" id="closeForestaProgressQr">閉じる</button></div></div>';
      document.body.appendChild(dialog);
      dialog.querySelector('#closeForestaProgressQr').onclick=()=>dialog.close();
      dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
    }
    if(!dialog.open)dialog.showModal();
  }
  function install(){
    const card=[...document.querySelectorAll('.card')].find(card=>card.querySelector('h2')?.textContent.trim()==='フォレスタ進捗管理');
    if(!card||card.querySelector('.forestaProgressQrButton'))return !!card;
    const body=card.querySelector('.card-body')||card;
    const group=document.createElement('div');
    group.className='group forestaProgressQrGroup';
    group.innerHTML='<h3>教室端末・スマホ用QR</h3><div class="link-row"><span class="link-name">フォレスタ進捗管理をQRで開く</span><button type="button" class="copy forestaProgressQrButton">QRコード表示</button></div>';
    body.prepend(group);
    group.querySelector('.forestaProgressQrButton').onclick=showQr;
    return true;
  }
  if(!install()){
    const observer=new MutationObserver(()=>{if(install())observer.disconnect();});
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
})();
</script>`;

const insertAt = text.lastIndexOf('</body>');
if (insertAt < 0) throw new Error('body closing tag not found');
text = text.slice(0, insertAt) + block + '\n' + text.slice(insertAt);
fs.writeFileSync(path, text);
console.log('Applied Foresta QR registry patch.');
