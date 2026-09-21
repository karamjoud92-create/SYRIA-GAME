import { chromium } from 'playwright';
import path from 'path';

const DRAWERS = ['guide','policy','decrees','money','trade','people','chains','progress'];
const SUBS = {
  money:['actions','budget'],
  trade:['resources','ports','partners','firms'],
  people:['families','services','pop'],
  progress:['score','why','charts','cycles','news'],
};

const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport:{width:1440,height:900}, locale:'en-US' });
const errs=[]; p.on('pageerror', e=>errs.push('pageerror: '+e.message));
p.on('console', m=>{ const t=m.text(); if(m.type()==='error' && !/ERR_CERT|fonts\.g/.test(t)) errs.push('console: '+t); });
await p.goto('file://' + path.resolve('dist/index.html')); await p.waitForTimeout(500);

// language button on start screen?
console.log('START langbtn count =', await p.$$eval('[data-act=lang]', n=>n.length));

await p.click('[data-act=newgame][data-v=learner]');
for (let i=0;i<10;i++){ const x=await p.$('.modal .btn.primary'); if(x) await x.click(); await p.waitForTimeout(40); }
await p.evaluate(()=>{ if(document.querySelector('#modal .scrim')) closeModal(); });
await p.waitForTimeout(200);

await p.evaluate(()=>{ for(let i=0;i<60;i++) S=step(S); S.reserves=99999; S.pc=900; S.treasury=9999; render(true); });
await p.waitForTimeout(300);
await p.evaluate(()=>{ if(document.querySelector('#modal .scrim')) closeModal(); });
await p.waitForTimeout(200);

console.log('HUD langbtn visible =', await p.evaluate(()=>{ const e=document.querySelector('.hud [data-act=lang]'); if(!e) return 'MISSING'; const r=e.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),inView: r.x>=0 && r.right<=innerWidth && r.bottom<=innerHeight}); }));

// what drawer tab buttons exist
console.log('drawer tabs:', await p.$$eval('[data-act=drawer]', ns=>ns.map(n=>n.dataset.v+':'+(n.offsetParent!==null))));

const report = [];

async function inspect(label){
  await p.waitForTimeout(250);
  const r = await p.evaluate(()=>{
    const sel = ['#drawer','.drawer','#panel','.panelwrap','#drawerBody'];
    let root=null;
    for (const s of sel){ const e=document.querySelector(s); if(e && e.offsetParent!==null){ root=e; break; } }
    if(!root) root = document.querySelector('#drawer') || document.querySelector('.drawer');
    if(!root) return {err:'NO DRAWER ROOT'};
    const txt = root.innerText || '';
    const html = root.innerHTML || '';
    const bad = [];
    // raw camelCase key leaks in visible text
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const leaks=new Set(), tokens=new Set();
    let n;
    while((n=walker.nextNode())){
      const s=(n.nodeValue||'').trim();
      if(!s) continue;
      if(/^[a-z][a-z0-9]*[A-Z][A-Za-z0-9]*$/.test(s) && s.length>3) leaks.add(s);
      for (const w of s.split(/\s+/)){
        if(/^[a-z][a-z0-9]*[A-Z][A-Za-z0-9]*$/.test(w) && w.length>4) tokens.add(w);
      }
    }
    const emptyBtns = [...root.querySelectorAll('button')]
      .filter(x=>x.offsetParent!==null && !(x.innerText||'').trim() && !(x.getAttribute('aria-label')||'').trim())
      .map(x=>x.outerHTML.slice(0,120));
    const subtabs = [...document.querySelectorAll('[data-act=subtab]')].map(x=>x.dataset.d+'/'+x.dataset.v+'='+(x.innerText||'').trim());
    return {
      len: txt.trim().length,
      head: txt.trim().slice(0,140).replace(/\n/g,' | '),
      objObj: (txt.match(/\[object Object\]/g)||[]).length,
      undef: (txt.match(/\bundefined\b/g)||[]).length,
      nan: (txt.match(/\bNaN\b/g)||[]).length,
      nullTxt: (txt.match(/\bnull\b/g)||[]).length,
      leaks:[...leaks], tokens:[...tokens],
      emptyBtns, subtabs,
      htmlUndef: (html.match(/undefined/g)||[]).length,
    };
  });
  report.push([label, r]);
  console.log('\n=== '+label+' ===');
  console.log(JSON.stringify(r,null,1));
}

for (const d of DRAWERS){
  const btn = await p.$(`[data-act=drawer][data-v=${d}]`);
  if (btn) { await btn.click(); } else { await p.evaluate(k=>{ UI.drawer=k; render(true); }, d); }
  await p.waitForTimeout(200);
  const cur = await p.evaluate(()=>UI.drawer);
  if (cur !== d) { console.log(`!! could not open drawer ${d}; UI.drawer=${cur}`); await p.evaluate(k=>{ UI.drawer=k; render(true); }, d); await p.waitForTimeout(150); }
  const subs = SUBS[d];
  if (!subs) { await inspect(d); continue; }
  for (const s of subs){
    const sb = await p.$(`[data-act=subtab][data-d=${d}][data-v=${s}]`);
    if (sb) await sb.click();
    else await p.evaluate(([dd,ss])=>{ UI.sub[dd]=ss; render(true); }, [d,s]);
    await p.waitForTimeout(220);
    const got = await p.evaluate(dd=>UI.sub[dd], d);
    await inspect(`${d} / ${s}` + (got===s?'':` (UI.sub=${got} !!)`));
  }
}

console.log('\n\n#### ERRORS ####');
console.log(errs.length? errs.join('\n') : '(none)');
await p.screenshot({path:'tools/_audit_shot.png'});
await b.close();
