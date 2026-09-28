import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const search=require('../registry-search.js');

test('card title matches kanji, hiragana, katakana, and romaji',()=>{
  for(const query of ['生徒','せいと','セイト','seito','ＳＥＩＴＯ'])assert.equal(search.matches('生徒情報検索',query),true,query);
  for(const query of ['こうし','コウシ','koushi'])assert.equal(search.matches('講師ポータル',query),true,query);
  assert.equal(search.matches('請求管理','seito'),false);
});
test('details and quoted card name are distinct search scopes',()=>{
  const title='生徒情報検索',details='口座振替を確認する';
  assert.equal(search.matches(title,'kouza'),false);
  assert.equal(search.matches(`${title} ${details}`,'kouza'),true);
  assert.equal(search.matches(`${title} ${details}`,'口座'),true);
});
test('space separated words match anywhere in the card, regardless of order or script',()=>{
  const title='生徒情報検索';
  for(const query of ['生徒 検索','検索　生徒','seito kensaku','セイト 検索'])assert.equal(search.matches(title,query),true,query);
  assert.equal(search.matches(title,'生徒 請求'),false);
  assert.equal(search.matches(title,'生徒検索'),false);
});
