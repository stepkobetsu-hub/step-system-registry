from pathlib import Path

code = Path('accounting-login-app/Code.gs')
text = code.read_text(encoding='utf-8')

text = text.replace(
    "const FAVICON_URL = 'https://stepkobetsu-hub.github.io/step-system-registry/images/accounting-login-favicon.png';\n",
    "const FAVICON_SOURCE_URL = 'https://stepkobetsu-hub.github.io/step-system-registry/images/accounting-login-favicon-v2.png';\nconst FAVICON_FILE_ID_KEY = 'ACCOUNTING_FAVICON_DRIVE_FILE_ID';\n"
)
text = text.replace(
    ".setFaviconUrl(FAVICON_URL)\n",
    ".setFaviconUrl(getFaviconUrl_())\n"
)

helper = """function getFaviconUrl_() {
  const props = PropertiesService.getScriptProperties();
  let fileId = props.getProperty(FAVICON_FILE_ID_KEY);
  if (!fileId) {
    const response = UrlFetchApp.fetch(FAVICON_SOURCE_URL, { muteHttpExceptions: false });
    const blob = response.getBlob().setName('accounting-login-favicon.png');
    const file = DriveApp.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    fileId = file.getId();
    props.setProperty(FAVICON_FILE_ID_KEY, fileId);
  }
  return 'https://drive.google.com/uc?id=' + encodeURIComponent(fileId) + '&.png';
}

"""

if 'function getFaviconUrl_()' not in text:
    marker = 'function setupSpreadsheet() {'
    if marker not in text:
        raise SystemExit('setupSpreadsheet marker not found')
    text = text.replace(marker, helper + marker, 1)

code.write_text(text, encoding='utf-8')

readme = Path('accounting-login-app/README.md')
md = readme.read_text(encoding='utf-8')
note = """
## ファビコン

- 経理ログイン管理専用の青い「￥＋帳簿」PNGを使用します。
- 初回アクセス時にApps Scriptが画像をGoogle Driveへコピーし、「リンクを知っている全員（閲覧者）」として公開します。
- `setFaviconUrl()` には `https://drive.google.com/uc?id=...&.png` 形式を渡します。
- DriveファイルIDはScript Propertiesの `ACCOUNTING_FAVICON_DRIVE_FILE_ID` に保存するため、毎回ファイルは作成しません。
"""
if '## ファビコン' not in md:
    readme.write_text(md + note, encoding='utf-8')
