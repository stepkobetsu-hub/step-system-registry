import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ledger = readFileSync(new URL('../SYSTEM_REGISTRY.md', import.meta.url), 'utf8');
const detail = readFileSync(new URL('../docs/student-qr-admin-pc-20260820.md', import.meta.url), 'utf8');

test('出退くんQR管理者アプリの2026-08-20改善記録を保持する', () => {
  [
    'student-qr-admin-pc-registration-20260820',
    '54mm×74mm',
    'A4縦3×3',
    '月単位へ戻すリセット',
    '開始日・終了日の日本語曜日表示',
    '89b251c9c6888135db906df328530fc014b94d8f',
    'batchPrintHost'
  ].forEach(marker => assert.ok(html.includes(marker), marker));
  [
    '管理者QR登録',
    'docs/student-qr-admin-pc-20260820.md',
    'QR確認は複数選択',
    '通知先メールは1名選択',
    '2026年8月31日（月）'
  ].forEach(marker => assert.ok(ledger.includes(marker), marker));
  [
    'AES-GCM',
    '1ページ最大9枚',
    '「新規QR発行」',
    '検索語が空の間は候補ボックスを表示しない',
    'PR #41',
    '1枚印刷の白紙ページ修正'
  ].forEach(marker => assert.ok(detail.includes(marker), marker));
});
