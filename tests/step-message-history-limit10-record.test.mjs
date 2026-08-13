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

test('Apps Script再デプロイ待ちを完了済みと誤記しない', () => {
  assert.match(page, /既存Apps Scriptデプロイの新バージョン更新待ち/);
  assert.match(page, /新しいデプロイは作らず既存URL・デプロイIDを維持/);
  assert.match(page, /appsscript\.json・StepMessageDeliveryTrack系・555\.gsは変更しない/);
  assert.match(registry, /GAS高速化の本番反映は既存デプロイ更新待ち/);
});

test('SYSTEM_REGISTRY一覧にも今回の正本と運用を蓄積する', () => {
  assert.match(registry, /STEP配信システム \| 本番使用中（履歴画面は直近10件版）/);
  assert.match(registry, /画面 `2a9a183`／GAS高速化 `1b2a595`/);
  assert.match(registry, /送信履歴タブで条件解除・自動取得/);
});
