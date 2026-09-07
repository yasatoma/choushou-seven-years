// 新作のためのオリジナル小編成スコア。サンプル・既存曲は使用しない。
// 6/8拍子。3小節単位の旋律と8和音の進行を組み合わせ、長い周期で変化する。
export const scores={
 warm:{bpm:68,chords:[[50,57,65],[53,60,67],[55,62,69],[57,60,64],[50,57,64],[46,53,62],[48,55,64],[45,52,61]],melody:[69,0,65,0,64,62,0,65,69,0,67,0,64,0,62,61,0,62]},
 investigate:{bpm:82,chords:[[50,57,62],[48,55,62],[46,53,60],[45,52,61],[50,55,64],[48,57,65],[46,55,62],[45,52,64]],melody:[74,0,69,72,0,70,69,0,65,67,0,64,65,0,69,61,0,62]},
 unease:{bpm:58,chords:[[38,45,53],[39,46,52],[41,48,54],[37,44,51],[38,45,52],[34,41,50],[36,43,49],[33,40,49]],melody:[62,0,0,61,0,0,65,0,63,0,62,0,58,0,0,61,0,0]},
 sad:{bpm:60,chords:[[50,57,65],[48,55,64],[46,53,62],[45,52,61],[43,50,58],[46,53,60],[48,55,62],[45,52,64]],melody:[69,0,67,65,0,64,62,0,65,69,0,70,67,0,65,64,0,62]},
 hope:{bpm:76,chords:[[53,60,65],[50,57,65],[46,53,62],[48,55,64],[53,57,67],[50,58,65],[46,55,62],[48,55,64]],melody:[69,0,72,74,0,72,69,0,67,65,0,69,70,0,69,67,0,65]}
};
export class Soundscape{
 constructor(){this.ctx=null;this.mood='unease';this.settings={music:35,ambient:28,effects:40};this.step=0;this.next=0;this.muted=false;}
 async start(){
  if(!this.ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.ctx=new C();
   this.master=this.ctx.createGain();this.master.gain.value=.58;this.master.connect(this.ctx.destination);
   for(const name of ['music','amb','fx']){this[name]=this.ctx.createGain();this[name].connect(this.master);}
   const impulse=this.ctx.createBuffer(2,this.ctx.sampleRate*1.8,this.ctx.sampleRate);let seed=431;
   for(let c=0;c<2;c++){const d=impulse.getChannelData(c);for(let i=0;i<d.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;d[i]=(seed/4294967296*2-1)*Math.pow(1-i/d.length,3)*.23;}}
   const reverb=this.ctx.createConvolver();reverb.buffer=impulse;this.music.connect(reverb);const wet=this.ctx.createGain();wet.gain.value=.24;reverb.connect(wet);wet.connect(this.master);
   // Seeded filtered noise: distant rain and surf, no downloaded samples.
   const noise=this.ctx.createBuffer(1,this.ctx.sampleRate*4,this.ctx.sampleRate),samples=noise.getChannelData(0);let rainSeed=1709;
   for(let i=0;i<samples.length;i++){rainSeed=(Math.imul(rainSeed,1664525)+1013904223)>>>0;samples[i]=(rainSeed/4294967296*2-1)*.15;}
   const source=this.ctx.createBufferSource();source.buffer=noise;source.loop=true;const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=680;source.connect(filter);filter.connect(this.amb);source.start();
   this.next=this.ctx.currentTime+.1;this.update(this.settings);this.timer=setInterval(()=>this.schedule(),90);
  }
  this.muted=false;if(this.ctx.state==='suspended')await this.ctx.resume();this.schedule();
 }
 update(s){this.settings=s;if(!this.ctx)return;const t=this.ctx.currentTime;this.music.gain.setTargetAtTime(s.music/100*.38,t,.15);this.amb.gain.setTargetAtTime(s.ambient/100,t,.15);this.fx.gain.setTargetAtTime(s.effects/100*.25,t,.15);}
 setMood(m){if(!scores[m])m='warm';if(this.mood===m)return;this.mood=m;this.step=0;if(this.ctx)this.next=this.ctx.currentTime+.1;}
 note(midi,t,dur,amp,dest=this.music){const hz=440*2**((midi-69)/12);for(const [ratio,level]of [[1,1],[2,.16],[3,.035]]){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.frequency.value=hz*ratio;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(amp*level,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+.03);o.onended=()=>{o.disconnect();g.disconnect();};}}
 schedule(){if(!this.ctx||this.ctx.state!=='running'||this.muted)return;if(this.next<this.ctx.currentTime)this.next=this.ctx.currentTime+.03;const score=scores[this.mood];while(this.next<this.ctx.currentTime+.3){const beat=this.step%6,chord=score.chords[Math.floor(this.step/6)%8],t=this.next,d=60/score.bpm/2;this.note(chord[[0,1,2,1,2,1][beat]],t,d*2.8,.12);if(beat===0)this.note(chord[0]-12,t,d*5,.12);const melody=score.melody[this.step%18];if(melody)this.note(melody,t+.015,d*3.8,.19);this.next+=d;this.step++;}}
 effect(kind='tap'){if(!this.ctx||this.muted)return;const t=this.ctx.currentTime;if(kind==='bell'){[62,69,74].forEach((n,i)=>this.note(n,t+i*.16,1,.22,this.fx));}else this.note(kind==='choice'?76:72,t,.09,.12,this.fx);}
 async pause(){this.muted=true;if(this.ctx?.state==='running')await this.ctx.suspend();}
 async resume(){this.muted=false;if(this.ctx?.state==='suspended')await this.ctx.resume();}
}
