import fs from 'node:fs';

const detailDoc = 'docs/foresta-progress-v3-production-20260831.md';
const detailUrl = 'https://github.com/stepkobetsu-hub/step-system-registry/blob/main/' + detailDoc;

// 1) Update the canonical Markdown registry row.
const registryPath = 'SYSTEM_REGISTRY.md';
let registry = fs.readFileSync(registryPath, 'utf8');
const lines = registry.split('\n');
const rowIndex = lines.findIndex(line => line.startsWith('| フォレスタ進捗管理 |'));
if (rowIndex < 0) throw new Error('Foresta registry row not found');
lines[rowIndex] = '| フォレスタ進捗管理 | **V3本番稼働中（Supabase標準経路・旧GASロールバック可）** | https://stepkobetsu-hub.github.io/foresta-progress-v2/<br>緊急時: https://stepkobetsu-hub.github.io/foresta-progress-v2/?legacy=1 | [foresta-progress-v2](https://github.com/stepkobetsu-hub/foresta-progress-v2) | `main`（本番 `7ae277815d380eb3a07504593c0fd43f677e8f1a`） | `app.js`、`config.js`、`apps-script/Code.gs`、Supabase Edge Functions `foresta-runtime-v3` / `foresta-timetable-sync`、`foresta_v3_*` テーブル | GitHub Pages＋Supabase V3＋Apps Script v17＋旧Google Sheet（ロールバック・非同期ミラー用） | 通常読込は事前生成済みSupabaseスナップショット、通常保存はSupabase mutation queueへ即時受付後に非同期GASミラー。時間割マスタを受講科目の正本としてSupabaseへ同期。`?legacy=1` のみ旧GAS経路 | 2026-08-31 | 75名・289スナップショット生成、1320でaccepted→mirrored保存確認、1180は算数＋国語をREAD ONLY確認、認証付き読込約1.1秒、1205・1317は元マスタ不整合としてquarantine。GitHub Pages本番deploy成功。詳細 `' + detailDoc + '` |';
registry = lines.join('\n');
fs.writeFileSync(registryPath, registry);

// 2) Layer a final production patch onto the live registry portal card.
const indexPath = 'index.html';
let html = fs.readFileSync(indexPath, 'utf8');
const marker = 'foresta-progress-v3-production-20260831';
if (!html.includes(marker)) {
  const patch = `
<script id="${marker}">
const organizeForestaV3Production20260831Base=organizeEntryImport;
organizeEntryImport=function(items){
  const list=organizeForestaV3Production20260831Base(items);
  const record=list.find(item=>item['ID']==='foresta-progress-v2');
  if(record){
    record['状態']='本番';
    record['概要']='学校授業の先取りを行う通常授業用フォレスタ進捗管理。2026-08-31にSupabase V3を通常経路へ本番切替。読込は事前生成スナップショット、保存は耐久mutation queueへ先に受付し、GAS反映は非同期。旧GASは明示ロールバック用に保全。';
    record['本番構成']='GitHub Pages → Supabase Edge Function foresta-runtime-v3 → foresta_v3_snapshots / foresta_v3_mutations 等。ログインとGoogle互換ミラーはApps Script v17を利用。';
    record['最新版の場所']='stepkobetsu-hub/foresta-progress-v2 main／本番切替 7ae277815d380eb3a07504593c0fd43f677e8f1a／Supabase Edge Function v4／Apps Script v17／GitHub Pages deploy成功';
    record['GitHubドキュメントURL']='${detailUrl}';
    record['旧高速化試験資料']='https://github.com/stepkobetsu-hub/step-system-registry/blob/main/docs/foresta-progress-v3-fast-runtime-20260831.md（本番切替前の途中経過）';
    record['Apps Script現行版']='v17（V3スナップショット生成・秘密鍵認証ミラー・mutation ID冪等化・旧GASロールバック）';
    record['Supabase本番']='project wisedgcgwaebtkprdhth／foresta-runtime-v3 v4／foresta-timetable-sync／service-role専用V3テーブル';
    record['通常利用']='https://stepkobetsu-hub.github.io/foresta-progress-v2/ （V3が既定ON。fastv3指定不要）';
    record['緊急ロールバック']='https://stepkobetsu-hub.github.io/foresta-progress-v2/?legacy=1 （旧GAS経路。Supabase・Googleデータを削除しない非破壊ロールバック）';
    record['読込モデル']='foresta_v3_snapshots。移行時に在籍77 ID中75名、合計289スナップショットを生成。初回GAS読込待ちを通常経路から外した。';
    record['保存方式']='foresta_v3_mutationsへacceptedで耐久受付 → 非同期GASミラー → mirrored。失敗時はlast_error / next_attempt_atを保持して指数バックオフ再試行。同一mutation IDは冪等処理。';
    record['時間割同期']='★生徒マスタ202606- / 時間割マスタを正本。A=生徒ID、E:AB=受講科目、AO=英語レベル、AP=数学レベル。foresta_v3_enrollmentsへ全件検証後に原子的置換。失敗時は前回正常値を維持。旧受講科目キャッシュはV3正本にしない。';
    record['時間割同期安全条件']='1180 飯田杏が算数＋国語でない場合は同期全体を拒否。同期状態はforesta_v3_sync_statusへ記録し、管理者から強制同期可能。15分単位の定期同期設計。';
    record['移行実績']='75名・289スナップショット生成。1205・1317は時間割にIDだけ残り氏名・有効生徒データがないためforesta_v3_quarantineへ隔離。';
    record['性能確認']='ダミー1320で認証付きダッシュボード／数学進行表 HTTP 200、約1.1秒。Codex前の試験ではcache hit 0.57秒／0.51秒、宿題保存受付0.69秒を確認し、初回14.31秒／7.74秒のGAS律速を本番スナップショット化で解消。';
    record['保存確認']='1320で既存目標点を同値保存し accepted → mirrored、attempts=1、保存後スナップショット再生成を確認。人工失敗でfailed / last_error / next_attempt_atも確認済み。';
    record['受講科目確認']='1180は実データを変更せずREAD ONLYで算数・国語の両方を確認。V3移行前の原因は時間割ではなく受講科目キャッシュの陳腐化だった。';
    record['セキュリティ']='生パスワード・生セッショントークン・service role key・同期secretは公開コード／台帳へ保存しない。セッションはトークンハッシュ。V3テーブルはanon/authenticatedから直接アクセス不可。';
    record['Codex前に実施した高速化']='旧app.jsのGAS全依存と保存後の全画面再取得を原因特定。foresta-runtime-v3-staging、セッションハッシュ、SWR、read snapshot、mutation queue、再試行を先行試作し、?fastv3=1で通常運用を壊さず実測。その後Supabase正本化へ進んだ。';
    record['Codex本番移行']='PR #8で時間割マスタ→Supabase同期、読込スナップショット、保存キュー、GASミラー、再試行、冪等化、隔離、安全条件、テストを実装。最終コミット7ae2778をmainへfast-forward。';
    record['公開確認']='2026-08-31 GitHub Pages run 33352221976: build / report-build-status / deploy すべてsuccess。npm test全件成功。Supabase Security AdvisorのForesta V3 ERROR解消。';
    record['保存先シート数']='22（旧Google保存Sheet。V3本番では復旧・非同期ミラー用として保全）';
    record['確認状況']='2026-08-31 V3本番切替済み。75名289スナップショット、1320保存、1180算数＋国語、約1.1秒読込、Pages deploy成功まで確認。';
    const confirmed=Array.isArray(record['確認済み事項'])?record['確認済み事項']:[];
    record['確認済み事項']=[...new Set([...confirmed,
      '旧GAS経路の保存後全画面再取得が遅延要因と特定',
      'Codex前にSupabase V3 stagingと?fastv3=1を実装・実測',
      '生トークン・パスワードをV3 DBへ保存しない制約',
      'ブラウザSWRと読込スナップショット',
      'mutation IDによる冪等保存',
      '保存キューの失敗再試行と指数バックオフ',
      '時間割マスタを受講科目の正本へ変更',
      '旧受講科目キャッシュをV3正本から除外',
      '1180 算数＋国語の同期安全条件',
      '75名・289スナップショット生成',
      '1205・1317を不整合データとしてquarantine',
      '1320でaccepted→mirrored保存と再生成確認',
      '認証付き読込約1.1秒',
      'Apps Script v17 / Supabase Edge Function v4',
      '通常URLをV3既定ONへ切替',
      '?legacy=1による旧GASロールバック',
      'GitHub Pages本番deploy成功',
      'npm test全件成功'
    ])];
  }
  return list;
};
</script>`;
  const insertAt = html.lastIndexOf('</body>');
  if (insertAt < 0) throw new Error('Closing body not found');
  html = html.slice(0, insertAt) + patch + '\n' + html.slice(insertAt);
  fs.writeFileSync(indexPath, html);
}

console.log('Updated Foresta V3 production registry and portal card.');
