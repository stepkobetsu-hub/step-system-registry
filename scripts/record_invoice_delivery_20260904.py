from pathlib import Path


def replace_row(text, prefix, new_row):
    lines = text.splitlines()
    found = False
    for i, line in enumerate(lines):
        if line.startswith(prefix):
            lines[i] = new_row
            found = True
            break
    if not found:
        raise SystemExit(f'row not found: {prefix}')
    return '\n'.join(lines) + ('\n' if text.endswith('\n') else '')

# SYSTEM_REGISTRY.md
md_path = Path('SYSTEM_REGISTRY.md')
md = md_path.read_text(encoding='utf-8')
md = md.replace('最終更新: 2026-09-02', '最終更新: 2026-09-04', 1)

md = replace_row(md, '| 不達メール管理 |',
    '| 不達メール管理 | **本番使用中（請求書不達も集約・一時エラー自動再試行）** | https://stepkobetsu-hub.github.io/student-QR/delivery_failures.html | [student-QR](https://github.com/stepkobetsu-hub/student-QR) | `main`（一時停止自動再試行 `36fa64b95b6345f3910616f2ce354262afcdf055`） | `delivery_failures.html`、`gas/DeliveryFailures.js`、`gas/コード.js`、入退室ログ2「不達メール管理」 | GitHub Pages＋Apps Script「生徒QR」v85＋Brevo＋Google Sheet | GitHub正本をApps Scriptの同名ファイルへ同期し、既存WebアプリのデプロイID／URLを維持して新バージョンへ更新。請求書不達はinvoice-pdfのD1配信イベントから同画面へ集約 | 2026-09-04 | 通常の送信済み・開封・PDF閲覧は各送信元システムで確認し、不達メール管理は対応が必要な異常を集約。一時エラー `soft_bounce` / `deferred` / `error` は24時間「一時停止（自動）」後、次の新しい通知だけを1回自動再試行。`hard_bounce` / `blocked` / `invalid_email` / `spam` と手動停止は自動解除しない。詳細 `docs/invoice-delivery-bounce-management-20260904.md` |')

md = replace_row(md, '| 出退くんQR作成・読取 |',
    '| 出退くんQR作成・読取 | **本番使用中（Apps Script v85・一時エラー自動再試行対応）** | **管理者QR登録:** https://stepkobetsu-hub.github.io/student-QR/student_qr_register.html<br>**講師QR作成:** https://stepkobetsu-hub.github.io/student-QR/teacher_qr_create.html<br>**塾生用QR:** https://stepkobetsu-hub.github.io/student-QR/my_qr.html<br>**タブレット読取:** https://step-checkin-edge-staging.stepkobetsu.workers.dev/legacy-tablet<br>**Apps Script本番:** https://script.google.com/macros/s/AKfycbzYpm-16ahuZ3BRFKRT-iSvR9nThsYcTOhxplyBp4bZmVmehfTYZEEl18THzJasypOsTQ/exec | [student-QR](https://github.com/stepkobetsu-hub/student-QR) | `main`（一時停止自動再試行 `36fa64b95b6345f3910616f2ce354262afcdf055`） | `teacher_qr_create.html`、`student_qr_register.html`、`my_qr.html`、`tablet_checkin.html`、`cloudflare/checkin-edge/`、`gas/コード.js`、`gas/DeliveryFailures.js`、Apps Script「生徒QR」 | GitHub Pages＋Cloudflare Workers/Durable Objects＋Apps Script v85＋Google Sheet＋Brevo | 画面は `student-QR/main` を更新。GASはGitHub正本と同期し、既存デプロイIDを維持して新バージョンへ更新。新しいWebアプリは作成しない | 2026-09-04 | 一時エラーは永久停止せず24時間の自動一時停止とし、24時間後の古いメールは送らず「次の新しい入退室通知」で1回だけ再試行。成功時は自動解除、再失敗なら再度24時間停止。Issue [#45](https://github.com/stepkobetsu-hub/student-QR/issues/45)でApps Script v84→v85、既存URL維持・HTTP 200を確認。講師メールP列正本など従来仕様も維持。詳細 `docs/invoice-delivery-bounce-management-20260904.md` |')

md = replace_row(md, '| 請求システム |',
    '| 請求システム | **Cloudflare完全統合・本番稼働中（Apps Script／Brevo実送信・不達管理連携）** | **請求管理:** https://stepkobetsu-hub.github.io/invoice-pdf/#adjustments<br>**請求書配信・PDF作成:** https://stepkobetsu-hub.github.io/invoice-pdf/#invoices<br>**旧料金調整互換URL:** https://stepkobetsu-hub.github.io/seiseki-kanri/billing_adjustment.html | [invoice-pdf](https://github.com/stepkobetsu-hub/invoice-pdf) | `main`（2026-09-04反映済み） | `index.html`、`assets/app.js`、`assets/receipt-pdf.js`、`apps-script/Code.gs`、`cloudflare/src/index.js`、D1 `step-invoice-db`、R2 `step-invoice-pdfs` | GitHub Pages＋Worker `step-invoice-api`＋D1＋非公開R2＋Apps Script＋Brevo。請求業務データはD1、PDFはR2を正本とし、メール送信は認証済みApps Script／Brevo経路 | 生徒選択時に生徒マスタを正本として氏名・フリガナ・郵便番号・住所・保護者メール・学年を取引先マスタへ同期。取引先独自項目は維持。手動「生徒マスタ更新」も可能。PDF閲覧URLの過剰レート制限を緩和し、請求書不達を中央の不達メール管理へ連携 | 2026-09-04 | 「1個ずつ作成」へ名称変更。取引先メール欠落時は生徒マスタから補完して保存。実運用送信元は `admin@educrest.jp`、返信先は `stepkobetsu@gmail.com`。請求書側の送信済み・開封・URL閲覧・PDF閲覧／ダウンロード表示は維持し、不達管理には対応が必要な失敗だけを集約。「未開封」は不達扱いにしない。Cloudflareの単独 `/api/send` 保護は維持し、実送信はApps Script／Brevo経路。詳細 `docs/invoice-delivery-bounce-management-20260904.md` |')

md_path.write_text(md, encoding='utf-8')

# index.html: append a latest override after all older asset-detail wrappers.
index_path = Path('index.html')
html = index_path.read_text(encoding='utf-8')
marker = '<script src="registry-editor.js?v=20260903-1"></script>'
if marker not in html:
    raise SystemExit('index insertion marker not found')
if 'id="invoice-delivery-bounce-20260904"' not in html:
    block = r'''<script id="invoice-delivery-bounce-20260904">
(() => {
  const baseApply=applyAssetInfo;
  const arr=v=>Array.isArray(v)?v:(v?[String(v)]:[]);
  const append=(base,key,text)=>[base[key],text].filter(Boolean).join('\n\n');
  const merge=(base,key,items)=>[...new Set([...arr(base[key]),...items])];
  applyAssetInfo=function(item){
    const base=baseApply(item);
    const name=String(base['システム名']||base['正式名称']||'');

    if(name.includes('不達メール')){
      const note='2026年9月4日：請求書メールの配信失敗も中央の不達メール管理へ集約。通常の送信済み・開封・URL閲覧・PDF閲覧は請求システム側で確認し、不達管理は対応が必要な異常だけを扱う。出退くんQRでは soft_bounce / deferred / error を恒久停止にせず24時間の「一時停止（自動）」とし、クールダウン後の次の新しい入退室通知で1回だけ自動再試行する。成功時は解除、再失敗時は再度24時間停止。hard_bounce / blocked / invalid_email / spam と手動停止は自動解除しない。Issue #45でApps Script v84→v85へ更新し、既存deployment ID・WebアプリURL維持、HTTP 200を確認。';
      return Object.assign({},base,{
        '状態':'本番使用中（請求書不達も集約・一時エラー自動再試行）',
        '保存基盤':'GitHub Pages＋Apps Script「生徒QR」v85＋Brevo＋Google Sheet「入退室ログ２」',
        '現在のApps Script版':'バージョン85（2026年9月4日）',
        'Apps Scriptバージョン':'85',
        '正本ファイル':['delivery_failures.html','gas/DeliveryFailures.js','gas/コード.js'],
        '最新版の場所':'stepkobetsu-hub/student-QR main commit 36fa64b95b6345f3910616f2ce354262afcdf055／Apps Script「生徒QR」v85／Issue #45',
        '関連カード':[...new Set([...arr(base['関連カード']),'出退くんQR作成・読取','STEP配信システム','請求システム'])],
        '仕様メモ':append(base,'仕様メモ',note),
        '作業メモ':append(base,'作業メモ',note),
        '更新方法':'GitHub正本をApps Scriptの同名ファイルへ同期し、既存WebアプリのデプロイID／URLを維持して新バージョンへ更新する。請求書不達はinvoice-pdfの配信イベントから同画面へ集約する。',
        '確認日':'2026年9月4日',
        '確認済み事項':merge(base,'確認済み事項',['請求書不達の中央管理連携','一時エラーと恒久・手動停止を区別','一時エラーは24時間の自動一時停止','24時間後の古いメールは再送しない','次の新しい入退室通知だけを1回自動再試行','成功時の自動解除','hard_bounce・blocked・invalid_email・spamは自動解除しない','手動停止は自動解除しない','Apps Script v85','既存deployment ID・WebアプリURL維持','Issue #45完了報告']),
        '未確認項目':[],
        '確認状況':'請求書不達連携・一時エラー自動再試行・Apps Script v85本番反映まで確認済み'
      });
    }

    if(base['ID']==='qr-register'||name.includes('出退くんQR作成・読取')){
      const note='2026年9月4日：不達管理の一時エラー仕様を更新。soft_bounce / deferred / error が続いた場合は24時間「一時停止（自動）」とし、24時間経過後の次の新しい入退室通知で1回だけ送信を試す。古い入退室メールの遅延再送はしない。成功時は自動解除、再失敗なら再び24時間停止。hard_bounce / blocked / invalid_email / spam と管理者の手動停止は自動解除しない。Apps Scriptは既存Webアプリのままv85へ更新。';
      return Object.assign({},base,{
        '状態':'本番使用中（Apps Script v85・一時エラー自動再試行対応）',
        '現在のApps Script版':'バージョン85（2026年9月4日）',
        'Apps Scriptバージョン':'85',
        '最新版の場所':'stepkobetsu-hub/student-QR main commit 36fa64b95b6345f3910616f2ce354262afcdf055／Apps Script「生徒QR」v85／Issue #45',
        '仕様メモ':append(base,'仕様メモ',note),
        '作業メモ':append(base,'作業メモ',note),
        '確認日':'2026年9月4日',
        '確認済み事項':merge(base,'確認済み事項',['一時エラー24時間自動停止','次の新しい入退室通知で1回だけ自動再試行','古い通知は再送しない','成功時は自動解除','恒久・手動停止は自動解除しない','Apps Script v84→v85','既存deployment ID・WebアプリURL維持','HTTP 200確認','山本瑛介1296のconnection closed by recipient server系を一時エラー経路として確認']),
        '確認状況':'一時エラー自動再試行仕様をApps Script v85へ本番反映し、既存URL維持まで確認済み'
      });
    }

    if(name.includes('請求管理')||name.includes('請求システム')){
      const note='2026年9月4日：請求書の「1件ずつ個別作成」を「1個ずつ作成」へ変更。生徒選択時は生徒コードを基準に生徒マスタを正本として、氏名・フリガナ・郵便番号・住所・保護者メール・学年を取引先マスタへ同期する。敬称・支払期限・電話番号・CCメール・請求用メモなど取引先独自項目は維持し、「生徒マスタ更新」／「生徒マスタから更新」で手動同期も可能。取引先側メール欠落時は生徒マスタから送信前に補完して保存する。PDF閲覧URLの過剰レート制限を修正し、請求書不達を中央の不達メール管理へ連携。請求書側の送信済み・開封・URL閲覧・PDF閲覧／ダウンロード表示は維持し、未開封は不達扱いにしない。実運用送信元は admin@educrest.jp、返信先は stepkobetsu@gmail.com。';
      return Object.assign({},base,{
        '状態':'本番使用中（D1/R2正本・Apps Script/Brevo実送信・不達管理連携）',
        '利用者向けURL':'https://stepkobetsu-hub.github.io/invoice-pdf/#invoices',
        '保存基盤':'Cloudflare D1＋非公開R2（正本）＋Apps Script／Brevoメール送信',
        '正本ファイル':['index.html','assets/app.js','assets/receipt-pdf.js','apps-script/Code.gs','cloudflare/src/index.js'],
        '関連カード':[...new Set([...arr(base['関連カード']),'生徒マスタ','不達メール管理'])],
        '仕様メモ':append(base,'仕様メモ',note),
        '作業メモ':append(base,'作業メモ',note),
        '更新方法':'画面・Cloudflareはinvoice-pdf mainへ反映。Worker変更はActionsでテスト後に自動deploy。メール送信バックエンドは既存Apps Scriptデプロイを維持して更新。生徒・取引先の基礎情報は生徒マスタを正本として同期する。',
        '確認日':'2026年9月4日',
        '確認済み事項':merge(base,'確認済み事項',['「1個ずつ作成」へ名称変更','生徒マスタから取引先マスタへ氏名・フリガナ・郵便番号・住所・メール・学年を同期','取引先独自項目は維持','手動の生徒マスタ更新ボタン','メール欠落時の生徒マスタ補完','PDF閲覧URLのアクセス集中誤判定を修正','admin@educrest.jpから実送信','返信先stepkobetsu@gmail.com','請求書の送信済み・開封・URL閲覧・PDF閲覧表示を維持','請求書不達を中央管理へ連携','未開封を不達扱いしない']),
        '未確認項目':[],
        '確認状況':'生徒マスタ同期・メール送信・PDF閲覧・不達管理連携まで本番確認済み'
      });
    }
    return base;
  };
})();
</script>

'''
    html = html.replace(marker, block + marker, 1)

index_path.write_text(html, encoding='utf-8')
print('registry updated for 2026-09-04 invoice/delivery changes')
