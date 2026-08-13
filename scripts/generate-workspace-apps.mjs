import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

export function parseRegistry(markdown){
  const lines=String(markdown||'').split(/\r?\n/);
  const start=lines.findIndex(line=>/^\|\s*正式名称\s*\|\s*状態\s*\|/.test(line));
  if(start<0)throw new Error('登録システム一覧が見つかりません。');
  const apps=[];
  for(let index=start+2;index<lines.length;index+=1){
    const line=lines[index];if(!/^\s*\|/.test(line))break;
    const columns=line.replace(/^\s*\||\|\s*$/g,'').split('|').map(value=>value.trim().replace(/`/g,''));
    if(columns.length<3)continue;
    apps.push({'正式名称':columns[0],'状態':columns[1],'利用者向けURL':columns[2]});
  }
  return apps;
}

export function buildExport(markdown){return {generatedFrom:'SYSTEM_REGISTRY.md',apps:parseRegistry(markdown)}}

if(path.resolve(process.argv[1]||'')===fileURLToPath(import.meta.url)){
  const markdown=fs.readFileSync(path.join(root,'SYSTEM_REGISTRY.md'),'utf8');
  fs.writeFileSync(path.join(root,'workspace-apps.json'),JSON.stringify(buildExport(markdown),null,2)+'\n','utf8');
}
