import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const registry = fs.readFileSync(new URL('../SYSTEM_REGISTRY.md', import.meta.url), 'utf8');

test('Cloudflare高速受付の最終構成が公開台帳に記録されている', () => {
  for (const text of [
    'checkin-edge-shared-legacy-20260808',
    'https://step-checkin-edge-staging.stepkobetsu.workers.dev/legacy-tablet',
    '端末の校舎設定を通常受付の判定に使用しない',
    '保存トークンなしで署名済みCookie認証',
    '以前の緑色カメラのホーム画面アイコンを復元',
    '最終main 8db0ce9',
    'Worker試験33件合格',
  ]) assert.ok(page.includes(text), text);
});

test('保守用台帳に運用・認証・復旧情報がある', () => {
  for (const text of [
    '2026年8月8日：Cloudflare高速受付の校舎共通化・古いタブレット対応',
    '神領・大手町で別URL・別アプリにせず',
    'integration-test',
    'HttpOnly',
    'PR #19',
    '#28（緑色カメラアイコン）',
    '従来のApps Script直接受付はフォールバックとして削除しない',
    'Cookie署名値の実値はGitHub・台帳へ記録しない',
  ]) assert.ok(registry.includes(text), text);
});

test('日常利用のQR読み取りリンクは登録済みの運用URLを使う', () => {
  assert.ok(page.includes("const qrReaderUrl=String(item['読み取りURL']"));
  assert.ok(page.includes("'読み取りURL':'https://step-checkin-edge-staging.stepkobetsu.workers.dev/legacy-tablet'"));
});
