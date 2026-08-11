import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const registry = fs.readFileSync(new URL('../SYSTEM_REGISTRY.md', import.meta.url), 'utf8');

test('the two invoice systems are explicitly separated', () => {
  for (const text of [
    '請求管理システムV3.1（学費計算・請求データ作成）',
    '請求システム2026NEW',
    '1FQElz87j5yB-FNwuDE9LJ3_nD8rzF_vIGTTWKDr15KDygGxXnZLlXhIp',
    'STEP請求書PDF作成・配信システム',
    'Cloudflare版コードやPDF配信用Script Propertiesを設定しない'
  ]) {
    assert.match(page, new RegExp(text));
    assert.match(registry, new RegExp(text));
  }
});

test('the invoice delivery Cloudflare production connection is recorded without secrets', () => {
  for (const text of [
    'step-invoice-api',
    'step-invoice-db',
    'step-invoice-pdfs',
    '7b6dbbe4-1fea-4374-a5dd-9bb8d043d2a2',
    'agent/cloudflare-production-switch',
    'deb5e57',
    '534cbd0'
  ]) {
    assert.match(page, new RegExp(text));
    assert.match(registry, new RegExp(text));
  }
  assert.doesNotMatch(page, /CLOUDFLARE_ADMIN_API_KEY=[0-9a-f]{32,}/i);
  assert.doesNotMatch(registry, /CLOUDFLARE_ADMIN_API_KEY=[0-9a-f]{32,}/i);
});

test('the August 12 invoice delivery release and load test are accumulated', () => {
  for (const text of [
    '本番稼働中（100件送信を約65秒で完了確認）',
    '同一CSV再取込でも別請求書を作成',
    '100件実送信を約65秒で完了',
    '配信履歴100件すべて',
    '一覧カード約8件',
    'メモ・タグを作成日側の次行へ配置',
    '請求管理システムV3.1と分離'
  ]) {
    assert.match(page, new RegExp(text));
    assert.match(registry, new RegExp(text));
  }
  assert.match(page, /filter\(entry=>entry!=='本番メール送信無効'\)/);
});

test('the invoice delivery Apps Script source is directly identifiable', () => {
  for (const text of [
    '1SnTqPE8bSQKLkiJI6rPo-7WGQDZoqGpwY7LAAox3FFsj3sGstnHf41X1',
    'AKfycbwo1DdSQ2eUVVU35v1TqermHTgIEsT1u4U-M_67KfA50VelbHsh28W_pec56OlyBkxqaw',
    '1NXdr3f_GCQ2CAuyy0i_Ap0dC5w4cKRgNbUAfdolTN0Y',
    'コード_v023.gs',
    'Download.html',
    'バージョン39'
  ]) {
    assert.match(page, new RegExp(text));
    assert.match(registry, new RegExp(text));
  }
  assert.doesNotMatch(registry, /専用プロジェクトは引き続き正本照合中/);
  assert.match(page, /testCloudflareIntegration実行完了/);
  assert.match(registry, /testCloudflareIntegration` の実行完了/);
  assert.doesNotMatch(page, /ADMIN_AUTH_REQUIRED/);
  assert.doesNotMatch(registry, /ADMIN_AUTH_REQUIRED/);
});
