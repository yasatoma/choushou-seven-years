import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'dist');
// Never delete an arbitrary directory. Only add/overwrite the explicit build outputs.
fs.mkdirSync(out,{recursive:true});
for(const name of ['index.html','src','assets','Start-Game.cmd'])fs.cpSync(path.join(root,name),path.join(out,name),{recursive:true});
fs.mkdirSync(path.join(out,'tools'),{recursive:true});fs.copyFileSync(path.join(root,'tools/serve.mjs'),path.join(out,'tools/serve.mjs'));
fs.cpSync(path.join(root,'docs/licenses'),path.join(out,'docs/licenses'),{recursive:true});
fs.writeFileSync(path.join(out,'package.json'),JSON.stringify({name:'choushou-seven-years',version:'1.0.0',private:true,type:'module',scripts:{start:'node tools/serve.mjs'}},null,2));
const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
fs.writeFileSync(path.join(out,'README.md'),readme.split('## 配布・開発')[0]+'\n## 制作とライセンス\n\n企画・脚本・実装：こでちゃん（Codex）。背景8枚・人物4人は本作用の画像生成素材。新規5曲と雨・海の音をWeb Audioで合成。QR関連ライブラリの著作権表示はsrc/vendor、ライセンス全文はdocs/licenses。本文と素材は本作用の新作で、基本システムは前作をもとに改良しています。広告・解析・外部CDNはありません。\n');
const manifest=[];
function scan(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())scan(p);else if(entry.name!=='BUILD-MANIFEST.json'){const data=fs.readFileSync(p);manifest.push({file:path.relative(out,p).replaceAll('\\','/'),bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')});}}}
scan(out);fs.writeFileSync(path.join(out,'BUILD-MANIFEST.json'),JSON.stringify({title:'弔鐘は七年前を告げる',version:'1.0.0',files:manifest},null,2));
console.log(JSON.stringify({output:out,files:manifest.length,bytes:manifest.reduce((n,x)=>n+x.bytes,0)}));
