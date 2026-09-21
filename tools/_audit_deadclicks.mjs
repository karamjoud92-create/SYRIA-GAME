import { chromium } from 'playwright';
import path from 'path';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport:{width:1440,height:900}, locale:'en-US' });
const errs=[]; p.on('pageerror', e=>errs.push(e.message));
p.on('console', m=>{ const t=m.text(); if(m.type()==='error' && !/ERR_CERT|fonts\.g/.test(t)) errs.push('console: '+t); });
await p.goto('file://' + path.resolve('dist/index.html')); await p.waitForTimeout(500);
await p.click('[data-act=newgame][data-v=learner]');
for (let i=0;i<8;i++){ const x=await p.$('.modal .btn.primary'); if(x) await x.click(); await p.waitForTimeout(40); }
await p.evaluate(()=>{ if(document.querySelector('#modal .scrim')) closeModal(); });
await p.evaluate(()=>{ for(let i=0;i<60;i++) S=step(S); render(true); });
await p.waitForTimeout(300);

const combos = [
  ['guide',null],['policy',null],['decrees',null],
  ['money','actions'],['money','budget'],
  ['trade','resources'],['trade','ports'],['trade','partners'],['trade','firms'],
  ['people','families'],['people','services'],['people','pop'],
  ['chains',null],
  ['progress','score'],['progress','why'],['progress','charts'],['progress','cycles'],['progress','news'],
];
const out = [];
for (const [d,sub] of combos){
  await p.evaluate(([d,sub])=>{ UI.drawer=d; if(sub) UI.sub[d]=sub; UI.decHide=true; render(true); }, [d,sub]);
  await p.waitForTimeout(150);
  const items = await p.evaluate(()=>{
    return [...document.querySelectorAll('#drawerbox [data-act]')].map(el=>{
      const r = el.getBoundingClientRect();
      // find a nearby .why reason
      let why = '';
      const pw = el.closest('.row,.card,.item,li,div');
      if (pw){ const w = pw.querySelector('.why'); if (w) why = w.textContent.trim().slice(0,60); }
      return { act: el.dataset.act, v: el.dataset.v||'', id: el.dataset.id||'', k: el.dataset.k||'',
        sector: el.dataset.sector||'', mode: el.dataset.mode||'',
        txt: (el.textContent||'').replace(/\s+/g,' ').trim().slice(0,45),
        disabled: !!el.disabled, cls: el.className, why,
        vis: r.width>0 && r.height>0 };
    });
  });
  out.push({ drawer:d, sub, n: items.length, items });
}
console.log(JSON.stringify(out,null,1));
console.log('ERRS', JSON.stringify(errs));
await b.close();
