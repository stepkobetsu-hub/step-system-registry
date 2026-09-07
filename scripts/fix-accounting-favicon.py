from pathlib import Path

ICON_URL = 'https://stepkobetsu-hub.github.io/step-system-registry/images/accounting-login-favicon.svg'

code = Path('accounting-login-app/Code.gs')
text = code.read_text(encoding='utf-8')
old_version = "const APP_VERSION = '2026-09-07-pw-order-2';"
new_version = "const APP_VERSION = '2026-09-07-pw-order-2-favicon';\nconst FAVICON_URL = '" + ICON_URL + "';"
if 'const FAVICON_URL =' not in text:
    if old_version not in text:
        raise SystemExit('APP_VERSION marker not found')
    text = text.replace(old_version, new_version, 1)
if '.setFaviconUrl(FAVICON_URL)' not in text:
    needle = ".setTitle('経理ログイン管理')\n    .addMetaTag('viewport', 'width=device-width, initial-scale=1');"
    repl = ".setTitle('経理ログイン管理')\n    .setFaviconUrl(FAVICON_URL)\n    .addMetaTag('viewport', 'width=device-width, initial-scale=1');"
    if needle not in text:
        raise SystemExit('doGet marker not found')
    text = text.replace(needle, repl, 1)
code.write_text(text, encoding='utf-8')

index = Path('index.html')
html = index.read_text(encoding='utf-8')
marker = 'accounting-login-favicon-20260907'
if marker not in html:
    injection = f'''\n<script id="{marker}">\n(() => {{\n  const targetName = '経理ログイン管理';\n  const iconUrl = '{ICON_URL}';\n  function attachAccountingFavicon() {{\n    document.querySelectorAll('#cards .card, .card').forEach(card => {{\n      if (!String(card.textContent || '').includes(targetName)) return;\n      let img = card.querySelector('img');\n      if (!img) {{\n        const holder = card.querySelector('.logo, .favicon, .card-icon, .icon, .card-logo');\n        if (!holder) return;\n        img = document.createElement('img');\n        img.alt = '';\n        holder.prepend(img);\n      }}\n      if (img.getAttribute('src') !== iconUrl) img.setAttribute('src', iconUrl);\n      img.removeAttribute('srcset');\n      img.removeAttribute('onerror');\n      img.onerror = null;\n      img.dataset.accountingFavicon = 'true';\n    }});\n  }}\n  const start = () => {{\n    attachAccountingFavicon();\n    const root = document.getElementById('cards') || document.body;\n    new MutationObserver(attachAccountingFavicon).observe(root, {{ childList: true, subtree: true }});\n  }};\n  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {{ once: true }});\n  else start();\n}})();\n</script>\n'''
    if '</body>' not in html:
        raise SystemExit('index.html has no </body>')
    html = html.replace('</body>', injection + '\n</body>', 1)
    index.write_text(html, encoding='utf-8')
