import fs from 'node:fs';

const path = 'index.html';
let text = fs.readFileSync(path, 'utf8');
const marker = 'foresta-progress-v2-three-rounds-20260823';
if (text.includes(marker)) {
  console.log('Foresta three-round registry patch already applied.');
  process.exit(0);
}

const anchor = '<script id="foresta-progress-v2-registration-20260815">';
const start = text.indexOf(anchor);
if (start < 0) throw new Error('Foresta base registration block not found');
const end = text.indexOf('</script>', start);
if (end < 0) throw new Error('Foresta base registration closing script not found');
const insertAt = end + '</script>'.length;

const patch = `
<script id="${marker}">
const organizeForestaProgressV220260823Base=organizeEntryImport;
organizeEntryImport=function(items){
  const list=organizeForestaProgressV220260823Base(items);
  const record=list.find(item=>item['ID']==='foresta-progress-v2');
  if(record){
    record['状態']='本番';
    record['概要']='学校授業の先取りを目的とした通常授業用フォレスタ進捗管理。2026-08-23に3周進捗、生徒自身の周回入力、テスト範囲外確認、宿題UI改善を本番反映済み。ステップ＆ゴール進捗管理とは別システム。';
    record['Apps Script概要']='生徒・講師・管理者認証、進行表、テスト範囲、学校進度、授業、CT、宿題、目標点、コメント、注意事項、特訓部屋、監査履歴に加え、1〜3周目の日付・生徒周回入力・範囲外確認済み保存を処理。';
    const actions=Array.isArray(record['APIアクション'])?record['APIアクション']:[];
    record['APIアクション']=[...new Set([...actions,'saveStudentRoundProgress'])];
    record['最新版の場所']='stepkobetsu-hub/foresta-progress-v2（main）／3周対応本体マージ 0a0ca9bce9e48dcbe718571decbb2813b9eb02eb／2026-08-23 01:39 JST 本番API確認済み';
    record['GitHubドキュメントURL']='https://github.com/stepkobetsu-hub/step-system-registry/blob/main/docs/foresta-progress-v2-three-rounds-20260823.md';
    record['Apps Script現行版']='2026-08-23 3周対応版（既存デプロイIDを更新・本番API確認済み）';
    record['保存先シート数']='22';
    record['追加保存シート']='生徒周回進捗';
    record['3周進捗仕様']='100%=1周目、200%=2周目、300%=3周目。表示上は100%をグラフ70%位置に置き、残り30%で2・3周目を表示。各周回の日付を保存。';
    record['テスト範囲外入力']='範囲外単元も選択可能。ただし「次回テスト範囲外です」→「それでもすすみました／いいえ」を表示し、前者のみ保存。中1〜中3共通。';
    record['2周目以降の宿題']='数学：TRYの赤×直し＋エクササイズの赤×直し。英語：KEYWORDSの暗記＋TRYの赤×直し＋エクササイズの赤×直し。';
    const confirmed=Array.isArray(record['確認済み事項'])?record['確認済み事項']:[];
    record['確認済み事項']=[...new Set([...confirmed,
      'ログイン画面右上に管理者画面へを追加',
      '端末種類未選択の警告を強化',
      '進行表の章・難度等を単元名の前へ移動し1〜2行表示',
      '予想範囲／決定範囲ラベルと範囲設定自動保存',
      '進行表先読み・短時間キャッシュ',
      'テスト範囲外は確認後に入力可能',
      '生徒自身が1〜3周目を入力し日付保存',
      '100%=70%位置の3周進捗グラフ',
      '2周目以降の宿題自動作成',
      '生徒宿題カードUIをステップ＆ゴール系書式へ改善',
      '保存Spreadsheetに生徒周回進捗シートを追加（計22シート）',
      'saveStudentRoundProgress API本番稼働確認',
      '既存Apps ScriptデプロイIDのまま本番更新確認'
    ])];
    record['確認状況']='2026-08-23 01:39 JST、GET・health・新API saveStudentRoundProgress の実リクエストで本番デプロイ切替を確認済み。';
  }
  return list;
};
</script>`;

text = text.slice(0, insertAt) + patch + text.slice(insertAt);
fs.writeFileSync(path, text);
console.log('Applied Foresta three-round registry patch.');
