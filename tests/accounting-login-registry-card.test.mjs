import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const editor=fs.readFileSync(new URL('../registry-editor.js',import.meta.url),'utf8');

test('経理ログイン管理を本番カードとして登録する',()=>{
  assert.match(html,/'ID':'accounting-login-app'/);
  assert.match(html,/'システム名':'経理ログイン管理'/);
  assert.match(html,/'分類':'請求・会計'/);
  assert.match(html,/AKfycbzPMsfBR4XkOqqQJrt-JCc-ALjI7Pha2XEq80DVtyd3-OCBRwdMbuDUq_vmL57yMhql7A\/exec/);
  assert.match(editor,/customUrl&&String\(item\['利用者向けURL'\]/);
});
