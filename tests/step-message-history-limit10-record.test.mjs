import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const registry = fs.readFileSync(new URL('../SYSTEM_REGISTRY.md', import.meta.url), 'utf8');

test('STEP配信システムの直近10件履歴仕様を公開台帳へ記録する', () => {
  for (const text of [
    'step-message-history-limit10-release-20260813',
    '送信履歴タブ選択時の自動取得',
    '検索・クリア横の更新ボタン',
    '直近10件表示',
    'Code.gsのlimit=10',
    'c330388',
    '1b2a595',
    '2a9a183'
  ]) assert.match(page, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('Apps Script v52と開封キャッシュの本番反映を記録する', () => {
  assert.match(page, /既存Webアプリを新バージョン52へ更新済み/);
  assert.match(page, /URL・デプロイIDを維持/);
  assert.match(page, /appsscript\.json・StepMessageDeliveryTracking\.gs・555\.gsは変更していない/);
  assert.match(page, /履歴表示時は外部共通ログを読まない/);
  assert.match(registry, /Apps Script v52・既存データ同期済み/);
});

test('SYSTEM_REGISTRY一覧にも今回の正本と運用を蓄積する', () => {
  assert.match(registry, /STEP配信システム \| 本番使用中（直近10件・開封確認高速版）/);
  assert.match(registry, /開封確認高速化 `860553d`/);
  assert.match(registry, /履歴タブを開くと直近10件を新しい順に自動取得/);
  assert.match(registry, /開封確認あり／なし／データなし/);
});
