/** Plain text plus {base|reading}. Script-like source remains literal text. */
export function rubyUnits(text){
 const units=[];const re=/\{([^{}|]+)\|([^{}|]+)\}/gu;let offset=0;
 for(const m of text.matchAll(re)){units.push(...Array.from(text.slice(offset,m.index),text=>({text})));units.push({text:m[1],reading:m[2]});offset=m.index+m[0].length;}
 units.push(...Array.from(text.slice(offset),text=>({text})));return units;
}
export function plainText(text){return rubyUnits(text).map(u=>u.text).join('');}
export function renderRuby(target,text,visible=Infinity){
 const fragment=document.createDocumentFragment();rubyUnits(text).forEach((u,i)=>{
  const e=document.createElement(u.reading?'ruby':'span');
  if(u.reading){e.append(document.createTextNode(u.text));const rt=document.createElement('rt');rt.textContent=u.reading;e.append(rt);}else e.textContent=u.text;
  if(i>=visible){e.className='pending';e.setAttribute('aria-hidden','true');}fragment.append(e);
 });target.replaceChildren(fragment);
}
const nameGroups=[['瀬尾直人','瀬尾','直人'],['三崎灯里','三崎','灯里'],['水原澪','水原','澪'],['久世怜司','怜司'],['冬木修一','冬木','修一'],['久世紗夜','紗夜']];
const group=word=>nameGroups.find(g=>g.includes(word))?.[0]||word;
export function annotate(text,glossary,known=new Set()){
 const ordered=[...glossary].sort((a,b)=>b[0].length-a[0].length);
 let result='';let index=0;
 while(index<text.length){
  // Preserve authored ruby as a unit; never nest markup.
  const explicit=/^\{([^{}|]+)\|([^{}|]+)\}/u.exec(text.slice(index));
  if(explicit){const key=group(explicit[1]);result+=known.has(key)?explicit[1]:explicit[0];known.add(key);index+=explicit[0].length;continue;}
  const item=ordered.find(([word])=>text.startsWith(word,index));
  if(item){const [word,reading]=item,key=group(word);result+=known.has(key)?word:`{${word}|${reading}}`;known.add(key);index+=word.length;}
  else{const c=String.fromCodePoint(text.codePointAt(index));result+=c;index+=c.length;}
 }
 return result;
}
/** Replay actual reading order, so optional investigation order and restored saves agree. */
export function chapterRubyHistory(story,glossary,trail){
 const lookup=Object.fromEntries(Object.values(story).flatMap(n=>n.lines.map(l=>[l.id,{...l,chapter:n.chapter}])));
 const chapters=new Map(),result=[];
 for(const id of trail){const l=lookup[id];if(!l)continue;let known=chapters.get(l.chapter);if(!known){known=new Set();chapters.set(l.chapter,known);}result.push({id,text:annotate(l.text,glossary,known)});}
 return result;
}

export function chapterRubyTexts(story,glossary,trail){return new Map(chapterRubyHistory(story,glossary,trail).map(x=>[x.id,x.text]));}
