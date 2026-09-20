const E=require('../src/engine/engine.js');
// consistency: 6 monthly steps vs one half-year step
{ let a=E.startGame(5,'learner'), b=E.startGame(5,'learner'); for(let i=0;i<6;i++) a=E.step(a); b=E.step(b,1);
  console.log('6x month', a.reserves.toFixed(0), a.treasury.toFixed(1), a.parallel.toFixed(1), a.trust.toFixed(1), E.natUnrest(a).toFixed(1));
  console.log('1x half ', b.reserves.toFixed(0), b.treasury.toFixed(1), b.parallel.toFixed(1), b.trust.toFixed(1), E.natUnrest(b).toFixed(1)); }
function run(name, fn, seed=7, diff='learner', months=240){
  let s=E.startGame(seed,diff), fail=null;
  for(let m=0;m<months;m++){ fn(s,m); s=E.step(s); fail=E.checkFail(s); if(fail) break;
    const id=E.drawEvent(s); if(id){ const ev=E.EVENTS.find(e=>e.id==id); const o=ev.opts.find(o=>E.optionAllowed(s,o).ok)||ev.opts.at(-1); E.applyEffects(s,o.eff);} }
  const L=E.legacy(s);
  const inf=Object.keys(E.INFRA).reduce((a,k)=>a+E.iLvl(s,k),0), rt=Object.values(s.deals).reduce((a,d)=>a+(d.lvl||1),0);
  console.log(name.padEnd(11),diff.padEnd(9), fail?('FAIL '+fail.id+' @'+(s.t/12).toFixed(1)+'y'):'survived', 'score',L.avg.toFixed(0),L.grade,'res',s.reserves.toFixed(0),'fx',s.parallel.toFixed(0),'pay',E.realWage(s).toFixed(0),'hrs',E.nationalHours(s).toFixed(1),'cap',s.cap.toFixed(0),'clog',(s.clogged||0).toFixed(0),'infra',inf,'routes',rt,'xp',Math.round(s.xp||0),'med',Object.keys(s.medals||{}).length);
}
const passive=()=>{};
const smart=(s,m)=>{ const P=s.policy; P.fuel='market'; P.tax='aggressive'; P.crackdown=true; P.capex=s.reserves>450?40:s.reserves>220?20:0; P.recon=s.treasury>20?10:0; P.print=s.treasury<0?5:0;
  if (E.realWage(s)<s.expWage-4 && s.treasury>10 && m%6==0) E.ACT.wage(s,10);
  for (const id of ['imf']) if(!s.facilities[id]) E.ACT.facility(s,id);
  for (const id of ['tribal','integrity','audit','digitax','dialogue','restitution','unify','northeast','braingain','suwayda']) if (s.decrees[id]===undefined && E.ACT.decree(s,id)) break;
  if (!s.facilities.gulf) E.ACT.facility(s,'gulf'); if(!s.facilities.wb) E.ACT.facility(s,'wb');
  for (const k of ['aleppo','rif','hasakeh','deir','homs','hama','daraa','suwayda','idlib','raqqa','latakia','damascus','tartus','quneitra']) if(!s.provs[k].project && (s.grant>=20||s.reserves>500)){ E.ACT.project(s,k,'tender'); break; }
};
const trader=(s,m)=>{ smart(s,m);
  if (s.reserves>400){ for(const id of ['oilwells','refinery','gasfield','phosphate','farm']) E.ACT.invest(s,id); E.ACT.portUpgrade(s,'latakia'); E.ACT.portUpgrade(s,'tartus'); }
  for (const id of ['jordan','turkey','iraq','gulf','eu','lebanon']) E.ACT.deal(s,id);
};
// Upgrades the networks the whole country waits on, and widens every route it has signed. This is
// the strategy a player who taps the Build panel will actually follow, so it has to be checked:
// seven tracks of five levels each is a very large hole to pour dollars into, and it must not turn
// out to be a shortcut to an A.
const infra=(s,m)=>{ smart(s,m);
  const order=['grid','water','housing','roads','egov','rail','air'];
  // the same cushion the decision card insists on: affordable is not the same as sensible
  for (const k of order) if (s.reserves > E.infraCost(s,k).usd*2.5 && E.ACT.infra(s,k)) break;
  for (const id of ['jordan','turkey','iraq','gulf','eu','lebanon','egypt','india','africa']) E.ACT.deal(s,id);
  if (s.pc>40) for (const id of Object.keys(s.deals)) if (s.reserves > E.dealCost(s,id).usd*2.2 && E.ACT.dealWiden(s,id)) break;
};
// builds an economy out of factories and people rather than out of holes in the ground
const builder=(s,m)=>{ smart(s,m);
  // a state that teaches and treats its people, and can move what it makes
  if (s.reserves>200){ for(const id of ['schools','clinics','unis']) E.ACT.service(s,id); }
  if (s.reserves>260){ for(const id of ['textiles','food','pharma','logistics','coldchain','packaging','cement','telecom','tourism']) E.ACT.invest(s,id); }
  if (s.reserves>700){ for(const id of ['refinery','farm','oilwells']) E.ACT.invest(s,id); E.ACT.portUpgrade(s,'latakia'); E.ACT.portUpgrade(s,'tartus'); }
  for (const id of ['jordan','turkey','iraq','gulf','eu']) E.ACT.deal(s,id);
};
// everything at once: factories, networks and the widest routes the country can sign
const everything=(s,m)=>{ builder(s,m);
  const order=['grid','water','housing','roads','egov','rail','air'];
  for (const k of order) if (s.reserves > E.infraCost(s,k).usd*2.5 && E.ACT.infra(s,k)) break;
  for (const id of ['lebanon','egypt','india','africa','china','russia']) E.ACT.deal(s,id);
  if (s.pc>50) for (const id of Object.keys(s.deals)) if (s.reserves > E.dealCost(s,id).usd*2.2 && E.ACT.dealWiden(s,id)) break;
};
for (const d of ['learner','realistic']){ run('passive',passive,7,d); run('smart',smart,7,d); run('trader',trader,7,d); run('trader2',trader,11,d); run('builder',builder,7,d); run('builder2',builder,11,d); run('infra',infra,7,d); run('everything',everything,7,d); }
// does the bar actually bite? same strategy, reported at 5 / 10 / 20 years
for (const yrs of [5,10,20]) run('builder@'+yrs+'y',builder,7,'learner',yrs*12);
for (const yrs of [5,10,20]) run('everything@'+yrs+'y',everything,7,'learner',yrs*12);
