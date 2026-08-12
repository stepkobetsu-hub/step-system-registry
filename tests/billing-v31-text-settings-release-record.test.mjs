import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const registry = fs.readFileSync(new URL('../SYSTEM_REGISTRY.md', import.meta.url), 'utf8');

test('billing v73 text settings release is accumulated in both ledgers', () => {
  for (const text of [
    'バージョン73',
    '追加口座',
    '追加講座',
    '模試：',
    '個別指導ステップ（運営：株式会社エデュクレスト）',
    '※中３は９月より直前講座が必修受講となります。',
    '備考・振込先設定',
    'CSV 116列',
    'バージョン72'
  ]) {
    assert.match(page, new RegExp(text));
    assert.match(registry, new RegExp(text));
  }
});

test('billing v73 record does not accumulate sensitive or personal data', () => {
  for (const target of [page, registry]) {
    assert.doesNotMatch(target, /ADMIN_API_KEY\s*=\s*[0-9a-z_-]{16,}/i);
    assert.doesNotMatch(target, /CLOUDFLARE_ADMIN_API_KEY\s*=\s*[0-9a-z_-]{16,}/i);
  }
});

test('billing v74 transfer automatic rule investigation is accumulated', () => {
  for (const text of [
    'バージョン74',
    '生徒番号1300以下',
    '1301以上',
    '営業日補正なし',
    '自動設定を使用【デフォルト】',
    '在籍91名',
    '口座有効80名',
    'N列未設定11名',
    '2026/08/27',
    'バージョン73'
  ]) {
    assert.match(page, new RegExp(text));
    assert.match(registry, new RegExp(text));
  }
});
