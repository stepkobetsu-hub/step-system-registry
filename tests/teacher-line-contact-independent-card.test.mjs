import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const registry=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('LINE講師連絡システムを独立カードとして登録する',()=>{
  assert.match(registry,/'ID':'teacher-line-contact-system'/);
  assert.match(registry,/'システム名':'LINE講師連絡システム'/);
  assert.match(registry,/'状態':'本番稼働中（Supabase再構築版）'/);
  assert.match(registry,/'検索':[^\n]*ひらがな・カタカナ・ローマ字・教室/);
  assert.match(registry,/'画像添付':[^\n]*JPEG・PNG/);
  assert.match(registry,/画像のみ送信/);
  assert.match(registry,/送信内容を見る/);
  assert.match(registry,/'認証・セッション':[^\n]*「ログアウト」/);
  assert.match(registry,/'起動高速化':/);
  assert.match(registry,/通常画面には設定案内やコード入力欄を表示せず/);
  assert.match(registry,/設定ボタンはSTEP配信システムへのボタンの左側/);
  assert.match(registry,/起動時の設定案内ちらつき防止/);
  assert.match(registry,/step-form\/pull\/9/);
});
