import fs from 'node:fs';

const row='| フォレスタ進捗管理 | **V3本番稼働中（Supabase標準経路・旧GASロールバック可）** | https://stepkobetsu-hub.github.io/foresta-progress-v2/<br>緊急時: https://stepkobetsu-hub.github.io/foresta-progress-v2/?legacy=1 | [foresta-progress-v2](https://github.com/stepkobetsu-hub/foresta-progress-v2) | `main`（本番 `13cfb846bbab29775e0b5a2ad9ad587e7ef9dd18`） | `app.js`、`v3-homework-ui-fix.js`、`apps-script/Code.gs`、Supabase Edge Functions `foresta-runtime-v3` / `foresta-timetable-sync` / `foresta-homework-adjust-v3`、`foresta_v3_*` テーブル | GitHub Pages＋Supabase V3＋Apps Script v17＋旧Google Sheet（ロールバック・非同期ミラー用） | 通常読込はSupabaseスナップショット、通常保存はmutation queue。宿題archive/restore/deleteは受付トランザクション内で通常／アーカイブ両スナップショットを即時更新。次回宿題調整はSupabase overrideで保存。時間割マスタを受講科目の正本として同期。`?legacy=1` のみ旧GAS経路 | 2026-08-31 | 75名・289スナップショット。1320で保存・宿題調整の非表示→復元を確認。1001でarchive→即表示→restoreをROLLBACK試験。1180は算数＋国語をREAD ONLY確認。講師の旧「宿題・進行表を訂正」を廃止し「次回宿題を確認・調整」（橙）＋「進行表を開く」（青緑）へ分離。詳細 `docs/foresta-progress-v3-production-20260831.md` / `docs/foresta-progress-v3-homework-archive-fix-20260831.md` |';
let md=fs.readFileSync('SYSTEM_REGISTRY.md','utf8');
if(!/^\| フォレスタ進捗管理 \|.*$/m.test(md)) throw new Error('Foresta registry row not found');
md=md.replace(/^\| フォレスタ進捗管理 \|.*$/m,row);
fs.writeFileSync('SYSTEM_REGISTRY.md',md);

let html=fs.readFileSync('index.html','utf8');
const marker='foresta-v3-homework-fix-20260831';
if(!html.includes(marker)){
  const block=`\n<script id="${marker}">\nconst organizeForestaHomeworkFix20260831Base=organizeEntryImport;\norganizeEntryImport=function(items){\n  const list=organizeForestaHomeworkFix20260831Base(items);\n  const record=list.find(item=>item['ID']==='foresta-progress-v2');\n  if(record){\n    record['状態']='V3本番稼働中';\n    record['最新版の場所']='stepkobetsu-hub/foresta-progress-v2 main / 13cfb846bbab29775e0b5a2ad9ad587e7ef9dd18';\n    record['GitHubドキュメントURL']='https://github.com/stepkobetsu-hub/step-system-registry/blob/main/docs/foresta-progress-v3-production-20260831.md';\n    record['宿題アーカイブ修正']='2026-08-31、archive/restore/delete受付と同一DBトランザクションで通常・アーカイブ両スナップショットを即時更新。GASミラー待ちによる空表示を解消。';\n    record['講師宿題操作']='旧「宿題・進行表を訂正」を廃止。「次回宿題を確認・調整」（オレンジ）と「進行表を開く」（青緑）へ分離。次回宿題調整はSupabase V3 overrideで永続化。';\n    record['宿題修正詳細']='https://github.com/stepkobetsu-hub/step-system-registry/blob/main/docs/foresta-progress-v3-homework-archive-fix-20260831.md';\n    const confirmed=Array.isArray(record['確認済み事項'])?record['確認済み事項']:[];\n    record['確認済み事項']=[...new Set([...confirmed,'1001 archive→即表示→restore ROLLBACK試験成功','1320 次回宿題 非表示→復元→元状態確認','1180 算数＋国語 READ ONLY再確認','foresta-homework-adjust-v3 v1 ACTIVE','GitHub Pages 13cfb846 build/deploy成功'])];\n  }\n  return list;\n};\n</script>\n`;
  const at=html.lastIndexOf('</body>'); if(at<0) throw new Error('body close not found');
  html=html.slice(0,at)+block+html.slice(at);
  fs.writeFileSync('index.html',html);
}
console.log('Updated Foresta homework fix registry.');
