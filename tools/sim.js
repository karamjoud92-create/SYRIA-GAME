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
  console.log(name.padEnd(10),diff.padEnd(9), fail?('FAIL '+fail.id+' @'+(s.t/12).toFixed(1)+'y'):'survived', 'score',L.avg.toFixed(0),L.grade,'res',s.reserves.toFixed(0),'fx',s.parallel.toFixed(0),'pay',E.realWage(s).toFixed(0),'hrs',E.nationalHours(s).toFixed(1),'cap',s.cap.toFixed(0),'clog',(s.clogged||0).toFixed(0));
}
const passive=()=>{};
const smart=(s,m)=>{ const P=s.policy; P.fuel='market'; P.tax='aggressive'; P.crackdown=true; P.capex=s.reserves>300?40:20; P.recon=s.treasury>20?10:0; P.print=s.treasury<0?5:0;
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
for (const d of ['learner','realistic']){ run('passive',passive,7,d); run('smart',smart,7,d); run('trader',trader,7,d); run('trader2',trader,11,d); }
