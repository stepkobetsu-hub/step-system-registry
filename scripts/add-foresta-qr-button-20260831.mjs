import fs from 'node:fs';

const path = 'index.html';
let html = fs.readFileSync(path, 'utf8');
const marker = 'foresta-progress-qr-button-20260831';
if (html.includes(marker)) process.exit(0);

const block = `
<script id="${marker}">
(() => {
  const FORESTA_URL = 'https://stepkobetsu-hub.github.io/foresta-progress-v2/';
  const ensureStyle = () => {
    if (document.getElementById('forestaQrStyle')) return;
    const style = document.createElement('style');
    style.id = 'forestaQrStyle';
    style.textContent = '.foresta-qr-btn{background:#0f766e!important;color:#fff!important;border:0!important}.foresta-qr-dialog{border:0;border-radius:18px;padding:0;max-width:92vw;box-shadow:0 20px 60px rgba(16,42,67,.3)}.foresta-qr-dialog::backdrop{background:rgba(16,42,67,.5)}.foresta-qr-box{padding:22px;display:grid;gap:14px;text-align:center;min-width:min(360px,88vw)}.foresta-qr-box h3{margin:0;color:#102a43}.foresta-qr-box img{width:280px;max-width:75vw;height:auto;margin:auto;border:1px solid #d8e2ec;border-radius:12px;padding:8px;background:#fff}.foresta-qr-box code{font-size:12px;overflow-wrap:anywhere;color:#486581}.foresta-qr-close{border:0;border-radius:10px;padding:10px 14px;background:#e6edf5;color:#102a43;font-weight:800;cursor:pointer}';
    document.head.appendChild(style);
  };
  const showQr = () => {
    ensureStyle();
    let dialog = document.getElementById('forestaQrDialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'forestaQrDialog';
      dialog.className = 'foresta-qr-dialog';
      const qr = 'https://quickchart.io/qr?size=300&margin=2&text=' + encodeURIComponent(FORESTA_URL);
      dialog.innerHTML = '<div class="foresta-qr-box"><h3>フォレスタ進捗管理</h3><img alt="フォレスタ進捗管理 QRコード" src="' + qr + '"><code>' + FORESTA_URL + '</code><button type="button" class="foresta-qr-close">閉じる</button></div>';
      dialog.querySelector('.foresta-qr-close').onclick = () => dialog.close();
      dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
      document.body.appendChild(dialog);
    }
    dialog.showModal();
  };
  const patch = () => {
    ensureStyle();
    const card = [...document.querySelectorAll('.card')].find((node) => node.querySelector('h2')?.textContent.trim() === 'フォレスタ進捗管理');
    if (!card || card.querySelector('.foresta-qr-btn')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn foresta-qr-btn';
    button.textContent = 'QRコード';
    button.onclick = showQr;
    const target = card.querySelector('.card-body') || card;
    const row = document.createElement('div');
    row.className = 'link-row';
    row.innerHTML = '<span class="link-name">利用者向けQRコード</span>';
    row.appendChild(button);
    target.prepend(row);
  };
  patch();
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; patch(); });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
</script>
`;

if (!html.includes('</body>')) throw new Error('body closing tag not found');
html = html.replace('</body>', block + '\n</body>');
fs.writeFileSync(path, html);
