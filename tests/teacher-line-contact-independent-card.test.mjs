import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const registry=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('LINE講師連絡システムを独立カードとして登録する',()=>{
  assert.match(registry,/'ID':'teacher-line-contact-system'/);
  assert.match(registry,/'システム名':'LINE講師連絡システム'/);
  assert.match(registry,/'校舎検索仕様':[^\n]*講師マスターR列/);
  assert.match(registry,/送信内容のクリック表示/);
  assert.match(registry,/STEP配信システムとの相互リンク/);
  assert.match(registry,/公式LINEボタン/);
  assert.match(registry,/'Apps Scriptバージョン':'6'/);
  assert.match(registry,/画像のみ送信/);
  assert.match(registry,/teacherLineContactCleanupImages/);
  assert.match(registry,/送信ログ確認の左へ横並び/);
});
