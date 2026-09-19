// ===== Soft sound effects (Web Audio, synthesized, quiet) =====
const SFX = { ctx:null, master:null, on:true, last:{} };
try { SFX.on = localStorage.getItem('transition-sfx') !== 'off'; } catch(e){}
function sfxInit(){
  if (!SFX.ctx){
    try { const C = window.AudioContext || window.webkitAudioContext; if (!C) return; SFX.ctx = new C();
      SFX.master = SFX.ctx.createGain(); SFX.master.gain.value = 0.32; SFX.master.connect(SFX.ctx.destination); } catch(e){ return; }
  }
  if (SFX.ctx.state === 'suspended') SFX.ctx.resume();
}
function sfxToggle(){ SFX.on = !SFX.on; try { localStorage.setItem('transition-sfx', SFX.on ? 'on' : 'off'); } catch(e){} if (SFX.on){ sfxInit(); sfx('tap'); } }
function tone(freq, dur, opt = {}){
  const c = SFX.ctx, t0 = c.currentTime + (opt.at || 0), g = c.createGain(), o = c.createOscillator();
  o.type = opt.type || 'sine'; o.frequency.setValueAtTime(freq, t0);
  if (opt.to) o.frequency.exponentialRampToValueAtTime(opt.to, t0 + dur);
  const peak = opt.gain || 0.08;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + (opt.attack || 0.012)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(SFX.master); o.start(t0); o.stop(t0 + dur + 0.05);
}
function sfx(name){
  if (!SFX.on || !SFX.ctx || SFX.ctx.state !== 'running') return;
  const now = performance.now(); if (SFX.last[name] && now - SFX.last[name] < 140) return; SFX.last[name] = now;
  switch(name){
    case 'tap':    tone(1100, 0.05, { type:'triangle', gain:0.035 }); break;
    case 'tick':   tone(760, 0.05, { type:'sine', gain:0.018 }); break;
    case 'decide': tone(523, 0.16, { gain:0.07 }); tone(784, 0.22, { gain:0.06, at:0.08 }); break;
    case 'coin':   tone(988, 0.08, { type:'triangle', gain:0.05 }); tone(1319, 0.2, { type:'triangle', gain:0.05, at:0.07 }); break;
    case 'up':     tone(660, 0.18, { gain:0.045, to:880 }); break;
    case 'down':   tone(440, 0.22, { gain:0.045, to:330 }); break;
    case 'done':   tone(880, 0.7, { gain:0.06 }); tone(1320, 0.6, { gain:0.03, at:0.02 }); break;
    case 'year':   [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, { gain:0.05, at:i * 0.09 })); break;
    case 'crisis': tone(247, 0.35, { type:'triangle', gain:0.08 }); tone(208, 0.5, { type:'triangle', gain:0.08, at:0.22 }); break;
    case 'bad':    tone(392, 0.2, { type:'triangle', gain:0.05 }); tone(311, 0.35, { type:'triangle', gain:0.05, at:0.14 }); break;
    case 'cycle':  [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.28, { type:'triangle', gain:0.04, at:i * 0.07 })); break;
    case 'fail':   [392, 330, 262, 196].forEach((f, i) => tone(f, 0.45, { type:'triangle', gain:0.06, at:i * 0.18 })); break;
  }
}
document.addEventListener('pointerdown', sfxInit, { once:false, passive:true });
