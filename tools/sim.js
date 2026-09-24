const E=require('../src/engine/engine.js');
// consistency: 6 monthly steps vs one half-year step
{ let a=E.startGame(5,'learner'), b=E.startGame(5,'learner'); for(let i=0;i<6;i++) a=E.step(a); b=E.step(b,1);
  console.log('6x month', a.reserves.toFixed(0), a.treasury.toFixed(1), a.parallel.toFixed(1), a.trust.toFixed(1), E.natUnrest(a).toFixed(1));
  console.log('1x half ', b.reserves.toFixed(0), b.treasury.toFixed(1), b.parallel.toFixed(1), b.trust.toFixed(1), E.natUnrest(b).toFixed(1)); }
function run(name, fn, seed=7, diff='learner', months=240, sell=false){
  let s=E.startGame(seed,diff), fail=null;
  for(let m=0;m<months;m++){ fn(s,m); s=E.step(s); fail=E.checkFail(s); if(fail) break;
    const id=E.drawEvent(s); if(id){ const ev=E.EVENTS.find(e=>e.id==id);
      // affordable options, least independence given away first — these bots read the chip
      const okOpts=ev.opts.filter(o=>E.optionAllowed(s,o).ok);
      const keep=o=>Math.min(0,o.eff.sov||0);   // avoid selling; don't chase gains either
      const o=(sell?okOpts.sort((a,b)=>(a.eff.sov||0)-(b.eff.sov||0))[0]
                   :okOpts.sort((a,b)=>keep(b)-keep(a))[0])||ev.opts.at(-1);
      E.applyEffects(s,o.eff);} }
  const L=E.legacy(s);
  console.log(name.padEnd(10),diff.padEnd(9), fail?('FAIL '+fail.id+' @'+(s.t/12).toFixed(1)+'y'):'survived', 'score',L.avg.toFixed(0),L.grade,'res',s.reserves.toFixed(0),'fx',s.parallel.toFixed(0),'pay',E.realWage(s).toFixed(0),'hrs',E.nationalHours(s).toFixed(1),'cap',s.cap.toFixed(0),'clog',(s.clogged||0).toFixed(0),'indep',s.sov.toFixed(0),'LVL',s.lvl||1,'mills',Object.values(s.ind||{}).reduce((a,b)=>a+b,0));
}
const passive=()=>{};
const smart=(s,m)=>{ const P=s.policy; P.fuel='market'; P.tax='aggressive'; P.crackdown=true; P.capex=s.reserves>450?40:s.reserves>220?20:0; P.recon=s.treasury>20?10:0; P.print=s.treasury<0?5:0;
  if (E.realWage(s)<s.expWage-4 && s.treasury>10 && m%6==0) E.ACT.wage(s,10);
  for (const id of ['imf']) if(!s.facilities[id]) E.ACT.facility(s,id);
  for (const id of ['tribal','integrity','audit','digitax','dialogue','restitution','unify','northeast','braingain','suwayda']) if (s.decrees[id]===undefined && E.ACT.decree(s,id)) break;
  if (!s.facilities.gulf) E.ACT.facility(s,'gulf'); if(!s.facilities.wb) E.ACT.facility(s,'wb');
  for (const k of ['aleppo','rif','hasakeh','deir','homs','hama','daraa','suwayda','idlib','raqqa','latakia','damascus','tartus','quneitra']) if(!s.provs[k].project && (s.grant>=20||s.reserves>500)){ E.ACT.project(s,k,'tender'); break; }
};
// Nothing caps any more, so "buy it if you can afford it" is no longer a strategy — it is a
// compulsion that spends every dollar the month it arrives and never funds the grid. A competent
// player keeps a buffer and stops climbing a ladder when the next rung costs more than it returns.
const BUFFER = 900;
const afford = (s, id) => s.reserves - E.investCost(s, id) > BUFFER;
const buy = (s, ids) => { for (const id of ids) if (afford(s, id)) E.ACT.invest(s, id); };
// Jammed ports are the one thing the game shouts about, so a competent player clears them first.
const berth = (s, id) => { const need = (s.clogged || 0) > 20 ? BUFFER * 0.5 : BUFFER * 1.5;
  if (s.reserves - E.portCost(s.ports[id].lvl) > need) E.ACT.portUpgrade(s, id); };

const trader=(s,m)=>{ smart(s,m);
  buy(s, ['oilwells','refinery','gasfield','phosphate','farm']);
  berth(s,'latakia'); berth(s,'tartus');
  for (const id of ['jordan','turkey','iraq','gulf','eu','lebanon']) E.ACT.deal(s,id);
};
// builds an economy out of factories and people rather than out of holes in the ground
const builder=(s,m)=>{ smart(s,m);
  // Factories are no use unlit, and a full industrial economy wants more power than it did
  // empty. Since industryPower() exists, the grid has to keep up with the mills.
  if (E.nationalHours(s) < 14 && s.reserves > 600) s.policy.capex = 60;
  // a state that teaches and treats its people, and can move what it makes
  if (s.reserves>400){ for(const id of ['schools','clinics','unis']) E.ACT.service(s,id); }
  buy(s, ['textiles','food','pharma','logistics','coldchain','packaging','cement','telecom','tourism']);
  buy(s, ['refinery','farm','oilwells']);
  berth(s,'latakia'); berth(s,'tartus');
  for (const id of ['jordan','turkey','iraq','gulf','eu']) E.ACT.deal(s,id);
};
// Sells the country: builds exactly what the builder builds, and takes every hand offered.
// It should end richer in dollars and poorer in score — that is the whole point of grip().
const seller=(s,m)=>{ builder(s,m);
  for (const id of ['bridge']) if(!s.facilities[id]) E.ACT.facility(s,id);
  for (const id of ['china','russia','gulf','turkey','lebanon']) E.ACT.deal(s,id);
  E.ACT.portConcession(s,'tartus');
};
for (const d of ['learner','realistic']){ run('passive',passive,7,d); run('smart',smart,7,d); run('trader',trader,7,d); run('trader2',trader,11,d); run('builder',builder,7,d); run('builder2',builder,11,d); run('seller',seller,7,d,240,true); }
// does the bar actually bite? same strategy, reported at 5 / 10 / 20 years
for (const yrs of [5,10,20]) run('builder@'+yrs+'y',builder,7,'learner',yrs*12);
