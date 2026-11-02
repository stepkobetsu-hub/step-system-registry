const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const code = fs.readFileSync(__dirname + '/Code.gs', 'utf8');
const cache = new Map();
let fetches = 0, allowed = true, held = false, writes = 0;
const ctx = vm.createContext({
  PropertiesService: {getScriptProperties: () => ({getProperty: () => 'existing-session'})},
  CacheService: {getScriptCache: () => ({get: k => cache.get(k), put: (k,v) => cache.set(k,v)})},
  LockService: {getScriptLock: () => ({waitLock: () => {assert.equal(held,false); held=true;},releaseLock: () => {held=false;}})},
  UrlFetchApp: {fetch: (url, options) => {
    assert.equal(held,false,'remote permission callback must never wait behind a held write lock');
    fetches++;
    assert.equal(JSON.parse(options.payload).action,'write');
    return {getResponseCode: () => 200,getContentText: () => JSON.stringify({allowed,staffCode:'7001'})};
  }}
});
vm.runInContext(code,ctx);
vm.runInContext("authDigest_ = x => x; appSessionKey_ = x => 'session:' + x",ctx);
assert.equal(ctx.centralAppPermission_('test','write').staffCode,'7001');
ctx.centralAppPermission_('test','write'); assert.equal(fetches,1,'allowed result cached');
cache.clear(); allowed=false;
assert.throws(()=>ctx.centralAppPermission_('test','write'),/PERMISSION_DENIED/);
assert.equal(cache.size,0,'denials never cached as allowed');
assert.throws(()=>ctx.saveEntry({serviceName:'test'},'test'),/PERMISSION_DENIED/);
assert.equal(writes,0);
allowed=true;
Object.assign(ctx,{
  revision_: () => 'revision',
  getSpreadsheet_: () => ({}), getSheet_: () => ({}), ensureOrderHeader_: () => {},
  findRowById_: () => 2, checkRevision_: () => {},
  writeRow_: () => {assert.equal(held,true,'sheet write still serialized');writes++;},
  updateSecret_: () => {}, hasSecret_: () => false, clearAppDataCache_: () => {},
  SpreadsheetApp: {flush: () => {}},
  accountingDataRuntime_: () => {assert.equal(held,false,'mirror sync after lock release');},
});
ctx.getSheet_ = () => ({getRange: () => ({getDisplayValues: () => [['Other','test','','https://example.com','','','','','','id','','1']]})});
const saved=ctx.saveEntry({id:'id',serviceName:'test',revision:'r'},'test');
assert.equal(saved.ok,true); assert.equal(writes,1); assert.equal(held,false);
ctx.writeRow_ = () => {throw new Error('sheet unavailable');};
assert.throws(()=>ctx.saveEntry({id:'id',serviceName:'test'},'test'),/sheet unavailable/);
assert.equal(held,false,'write lock released after failure');
console.log('Permission callback, cache, denial, protected write and release tests passed');
