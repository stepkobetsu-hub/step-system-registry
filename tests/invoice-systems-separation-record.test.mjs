import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const registry = fs.readFileSync(new URL('../SYSTEM_REGISTRY.md', import.meta.url), 'utf8');

test('the two invoice systems are explicitly separated', () => {
  for (const text of [
    '請求管理システムV3.1（学費計算・請求データ作成）',
    '請求システム2026NEW',
    '1aeBIJZEvMuh7fvJNj64hvK-Udq764L0GUO6rlMNP8vZPYukegnA8ItVF',
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
    '2cbfc116-20cb-4f76-9283-0528b0df37eb',
    'agent/cloudflare-production-switch',
    'deb5e57',
    'PRODUCTION_SEND_APPROVED=false'
  ]) {
    assert.match(page, new RegExp(text));
    assert.match(registry, new RegExp(text));
  }
  assert.doesNotMatch(page, /CLOUDFLARE_ADMIN_API_KEY=[0-9a-f]{32,}/i);
  assert.doesNotMatch(registry, /CLOUDFLARE_ADMIN_API_KEY=[0-9a-f]{32,}/i);
});

test('the invoice delivery Apps Script source is directly identifiable', () => {
  for (const text of [
    '1SnTqPE8bSQKLkiJI6rPo-7WGQDZoqGpwY7LAAox3FFsj3sGstnHf41X1',
    'AKfycbwo1DdSQ2eUVVU35v1TqermHTgIEsT1u4U-M_67KfA50VelbHsh28W_pec56OlyBkxqaw',
    '1NXdr3f_GCQ2CAuyy0i_Ap0dC5w4cKRgNbUAfdolTN0Y',
    'コード_v022.gs',
    'Download.html',
    'v0.1.23'
  ]) {
    assert.match(page, new RegExp(text));
    assert.match(registry, new RegExp(text));
  }
  assert.doesNotMatch(registry, /専用プロジェクトは引き続き正本照合中/);
  assert.match(page, /ADMIN_AUTH_REQUIRED/);
  assert.match(registry, /ADMIN_AUTH_REQUIRED/);
});
