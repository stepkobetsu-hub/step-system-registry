from pathlib import Path
p=Path('SYSTEM_REGISTRY.md')
s=p.read_text()
old='| フォレスタ進捗管理 | 本番 | https://stepkobetsu-hub.github.io/foresta-progress-v2/ | [foresta-progress-v2](https://github.com/stepkobetsu-hub/foresta-progress-v2) | `main` | `index.html`、`styles.css`、`app.js`、`domain.js`、`config.js`、`manifest.webmanifest`、`apps-script/`、`data/japanese-units.json`、`tests/` | GitHub Pages＋Apps Script＋専用Google Sheet | Pagesと既存APIデプロイを更新し、health・3入口・国英数進行表・単元1,853件を確認 | 2026-08-15 | 学校授業を先取りする通常授業用。ステップ＆ゴール進捗管理とは別ID・別URL・別保存先。詳細は `docs/foresta-progress-v2-20260815.md` |'
new='| フォレスタ進捗管理 | **本番（通常経路）＋V3高速化試験中（明示ON）** | https://stepkobetsu-hub.github.io/foresta-progress-v2/<br>高速試験: https://stepkobetsu-hub.github.io/foresta-progress-v2/?fastv3=1 | [foresta-progress-v2](https://github.com/stepkobetsu-hub/foresta-progress-v2) | `main` | `index.html`、`styles.css`、`app.js`、`domain.js`、`config.js`、`apps-script/`、Supabase Edge Function `foresta-runtime-v3-staging`、`foresta_v3_*` テーブル | GitHub Pages＋Apps Script＋専用Google Sheet＋Supabase V3高速ランタイム（試験） | 通常URLは従来経路。`?fastv3=1` のみセッションキャッシュ・ダッシュボード/進行表スナップショット・高速保存queue・ブラウザSWRを使用。失敗時はGASへ自動フォールバック | 2026-08-31 | 1320 smokeでダッシュボードcache hit約0.57秒、進行表cache hit約0.51秒、宿題チェック保存受付約0.69秒を確認。初回cache missはGAS律速のため継続改善。詳細 `docs/foresta-progress-v2-20260815.md` / `docs/foresta-progress-v3-fast-runtime-20260831.md` |'
if old not in s:
    raise SystemExit('Foresta registry row not found')
s=s.replace(old,new,1)
p.write_text(s)
