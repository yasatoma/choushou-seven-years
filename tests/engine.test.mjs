import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as e from '../src/engine.js';
import {characters,glossary} from '../src/story.js';
import {rubyUnits,plainText,annotate,chapterRubyTexts} from '../src/ruby.js';
const copy=structuredClone;
test('all reachable states can reach an ending; choices, references and facts are valid',()=>{
 const queue=[e.fresh()],visited=new Set(),nodes=new Set(),ends=new Set(),edges=new Map(),terminal=new Set();
 const key=s=>JSON.stringify([s.node,s.flags,s.evidence.slice().sort()]);
 while(queue.length){const s=queue.shift(),k=key(s);if(visited.has(k))continue;visited.add(k);nodes.add(s.node);const n=e.story[s.node];assert.ok(n.lines.length);for(const l of n.lines){assert.ok(!l.who||characters[l.who],l.who);assert.ok(fs.existsSync(`assets/${l.bg||n.bg}.png`));}
  s.line=n.lines.length-1;e.finishNode(s);assert.deepEqual(e.validateState(s),s);const targets=[];
  if(n.ending){assert.ok(e.endings[n.ending]);ends.add(n.ending);terminal.add(k);}else{const choices=e.getChoices(s);if(choices.length){for(let i=0;i<choices.length;i++){const c=choices[i];assert.ok(e.story[c.to]);if(c.disabled){assert.throws(()=>e.choose(copy(s),i));continue;}const next=copy(s);e.choose(next,i);targets.push(key(next));queue.push(next);}}else{const next=copy(s);assert.ok(e.nextNode(s),'dead end '+s.node);e.applyNode(next,e.nextNode(s));targets.push(key(next));queue.push(next);}}
  edges.set(k,targets);
 }
 assert.equal(nodes.size,Object.keys(e.story).length);assert.deepEqual([...ends].sort(),Object.keys(e.endings).sort());
 const good=new Set(terminal);let changes=true;while(changes){changes=false;for(const [k,targets]of edges)if(!good.has(k)&&targets.some(t=>good.has(t))){good.add(k);changes=true;}}
 assert.equal(good.size,visited.size,'every reachable state has an exit to a conclusion');
 fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/routes.json',JSON.stringify({nodes:nodes.size,states:visited.size,endings:[...ends]},null,2));
});
test('save and transfer preserve a full reading history and reject other works / tampering',async()=>{
 const s=e.fresh();s.node='true_end';s.line=3;s.flags={visits:0,door:true,flowers:true,testimony:true,trusted:true};s.evidence=Object.keys(e.evidence);s.trail=e.LINE_IDS.slice();
 const meta={seen:e.LINE_IDS,endings:Object.keys(e.endings)};const code=await e.encodeTransfer(s,meta),d=await e.decodeTransfer(code);assert.deepEqual(d.state,s);assert.deepEqual(d.meta.seen,meta.seen);assert.deepEqual(d.meta.endings,meta.endings);
 await assert.rejects(e.decodeTransfer(code.replace('CHOU1','NAGI1')));await assert.rejects(e.decodeTransfer(code+'x'));assert.throws(()=>e.validateState({...s,node:'missing'}));assert.throws(()=>e.validateState({...s,line:-1}));assert.throws(()=>e.validateState({...s,flags:{door:'yes'}}));
});
test('ruby is atomic, preserves literal HTML, repeats only at chapter first appearance on actual route',()=>{
 assert.deepEqual(rubyUnits('「{弔鐘|ちょうしょう}」'),[{text:'「'},{text:'弔鐘',reading:'ちょうしょう'},{text:'」'}]);assert.equal(plainText('{澪|みお}が来る'),'澪が来る');assert.equal(plainText('<script>hi</script>'),'<script>hi</script>');
 const known=new Set();assert.equal(annotate('水原澪。澪が話す。',glossary,known),'{水原澪|みずはらみお}。澪が話す。');assert.equal(annotate('澪',glossary,known),'澪');
 const fixture={a:{chapter:'一',lines:[{id:'a:0',text:'澪と弔鐘'},{id:'a:1',text:'澪の弔鐘'}]},b:{chapter:'二',lines:[{id:'b:0',text:'澪と弔鐘'}]}};
 const first=chapterRubyTexts(fixture,glossary,['a:0','a:1','b:0']);assert.equal(first.get('a:1'),'澪の弔鐘');assert.match(first.get('b:0'),/\{澪\|みお\}/);
 const alternate=chapterRubyTexts(fixture,glossary,['a:1','a:0']);assert.match(alternate.get('a:1'),/\{澪\|みお\}/);assert.equal(alternate.get('a:0'),'澪と弔鐘');
});
test('scenario IDs and evidence gates stay stable and volume matches scope',()=>{
 assert.equal(new Set(e.LINE_IDS).size,e.LINE_IDS.length);const lines=Object.values(e.story).flatMap(n=>n.lines);const chars=lines.reduce((n,l)=>n+plainText(l.text).length,0);assert.ok(chars>=44000&&chars<=54000,chars);
 assert.deepEqual(e.story.synthesis.next,'paper');assert.deepEqual(e.story.theory.choices[2].need,['bolt','ribbon','accounts']);
 assert.equal(e.getChoices(e.fresh()).length,2);
});

import {chapterRubyHistory} from '../src/ruby.js';
test('backlog keeps ruby on the first occurrence even when a scene is revisited',()=>{
 const fixture={a:{chapter:'一',lines:[{id:'a:0',text:'澪'}]},b:{chapter:'一',lines:[{id:'b:0',text:'続き'}]}};
 const h=chapterRubyHistory(fixture,glossary,['a:0','b:0','a:0']);assert.equal(h[0].text,'{澪|みお}');assert.equal(h[2].text,'澪');
});
