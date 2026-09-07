import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const b=await chromium.launch({channel:'msedge',headless:true}),c=await b.newContext({viewport:{width:390,height:844}}),p=await c.newPage();
const checks=[];try{
 await p.goto('http://localhost:4175/');
 await p.evaluate(async()=>{const {renderRuby}=await import('./src/ruby.js');const box=document.createElement('p');document.body.append(box);renderRuby(box,'<img src=x onerror=alert(1)>{弔鐘|ちょうしょう}',0);if(box.querySelector('img'))throw Error('HTML injection');if(box.querySelector('ruby').className!=='pending')throw Error('ruby leaked early');renderRuby(box,'{弔鐘|ちょうしょう}',1);if(box.querySelector('rt').textContent!=='ちょうしょう')throw Error('missing ruby');box.remove();});checks.push('literal HTML, pending ruby hidden, atomic reveal');
 await p.locator('#new-game').click();await p.locator('#dialogue').click();assert.equal(await p.locator('#text .pending').count(),0);assert.ok((await p.locator('#text').textContent()).includes('恋人が死んで'));await p.keyboard.press('Enter');assert.ok((await p.locator('#text').textContent()).includes('私を'));await p.locator('#dialogue').click();assert.equal(await p.locator('#text .pending').count(),0);
 // Backlog should keep the first line ruby when a later line is shown.
 for(let i=0;i<9;i++){await p.locator('#dialogue').click();await p.locator('#dialogue').click();}
 await p.locator('[data-panel=backlog]').click();assert.ok(await p.locator('.log-item ruby').count()>0);await p.locator('#close-panel').click();
 // Explicit speed 0 and auto progresses a short line, then pause from panel.
 await p.locator('[data-panel=settings]').filter({visible:true}).click();await p.locator('#setting-speed').fill('0');await p.locator('#setting-autoDelay').fill('600');await p.locator('#close-panel').click();await p.locator('#dialogue').click();const before=await p.locator('#text').textContent();await p.locator('#auto').click();await p.waitForTimeout(6000);assert.notEqual(await p.locator('#text').textContent(),before);await p.locator('#menu-button').click();const paused=await p.locator('#text').textContent();await p.waitForTimeout(3000);assert.equal(await p.locator('#text').textContent(),paused);checks.push('typing reveal, keyboard, ruby backlog, auto advance, modal pause');
 const audio=await p.evaluate(async()=>{const {Soundscape,scores}=await import('./src/audio.js');const s=new Soundscape();await s.start();const result={moods:Object.keys(scores),state:s.ctx.state,ambient:s.amb.gain.value};await s.pause();result.paused=s.ctx.state;clearInterval(s.timer);await s.ctx.close();return result;});assert.equal(audio.state,'running');assert.equal(audio.paused,'suspended');checks.push({audio});
 console.log(JSON.stringify({checks},null,2));fs.writeFileSync('test-results/interaction-report.json',JSON.stringify({checks},null,2));
}finally{await b.close();}
