import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ledger = readFileSync(new URL('../SYSTEM_REGISTRY.md', import.meta.url), 'utf8');
const detail = readFileSync(new URL('../docs/student-qr-teacher-email-20260831.md', import.meta.url), 'utf8');

const markers = [
  'ea46ba9d22148506a371801b21c5240f33dd9278',
  'https://github.com/stepkobetsu-hub/student-QR/issues/43',
  '1jZRwuaEqbhgg6xRQq63ke5QO9Wc2ulsGOA_gbmHfiehQIsr9NQLLqSZR',
  'AKfycbzYpm-16ahuZ3BRFKRT-iSvR9nThsYcTOhxplyBp4bZmVmehfTYZEEl18THzJasypOsTQ',
  'v21',
  '講師マスター',
  'P列',
  'メールアドレス未登録'
];

test('出退くんQR講師メールの正本と本番反映記録を保持する', () => {
  assert.ok(html.includes('student-qr-teacher-email-canonical-20260831'));
  markers.forEach(marker => assert.ok(detail.includes(marker), marker));
  [
    'docs/student-qr-teacher-email-20260831.md',
    'A列=講師コード',
    'B列=氏名',
    'P列=メール',
    'Q列=QR',
    ...markers
  ].forEach(marker => assert.ok(ledger.includes(marker), marker));
});

test('公開ポータル情報にも正本・デプロイ・回帰確認を載せる', () => {
  [
    'student-qr-teacher-email-canonical-20260831',
    ...markers,
    'QR表示・新規発行・印刷',
    '講師ポータルへのフォールバックなし'
  ].forEach(marker => assert.ok(html.includes(marker), marker));
});

test('個人メール実値を台帳ファイルへ持ち込まない', () => {
  assert.equal(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(detail), false);
});
