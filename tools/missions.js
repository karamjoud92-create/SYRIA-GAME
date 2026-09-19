const E=require('../src/engine/engine.js');
function run(m, fn, label){ let s=E.startGame(3,'learner',m), fail=null;
 while(s.t < s.mission.end){ fn(s); s=E.step(s); fail=E.checkFail(s); if(fail) break;
   const id=E.drawEvent(s); if(id){const ev=E.EVENTS.find(e=>e.id==id);const o=ev.opts.find(o=>E.optionAllowed(s,o).ok)||ev.opts.at(-1);E.applyEffects(s,o.eff);} }
 console.log(m.padEnd(8),label.padEnd(8), fail?fail.id:(E.MISSIONS[m].check(s)?'WIN':'lose'),'hrs',E.nationalHours(s).toFixed(1),'fx',s.parallel.toFixed(0),'infl',s.infl.toFixed(0),'trust',s.trust.toFixed(0),'rif',s.provs.rif.u.toFixed(0),'dam',s.provs.damascus.u.toFixed(0),'res',s.reserves.toFixed(0),'has',s.provs.hasakeh.u.toFixed(0));}
const none=()=>{};
run('winter',none,'nothing'); run('winter',s=>{s.policy.capex=40; E.ACT.facility(s,'wb'); E.ACT.project(s,'raqqa','fast'); E.ACT.deal(s,'iraq');},'smart');
run('lira',none,'nothing'); run('lira',s=>{const P=s.policy;P.print=0;P.intervene=s.reserves>250?50:0;P.fuel='market';P.tax='aggressive';E.ACT.facility(s,'imf');E.ACT.decree(s,'audit');E.ACT.decree(s,'unify');},'smart');
run('bread',none,'nothing'); run('bread',s=>{E.ACT.facility(s,'imf');E.ACT.project(s,'hasakeh','fast');E.ACT.deal(s,'russia');if(s.trust>=40)E.ACT.decree(s,'northeast');},'smart');
run('capital',none,'nothing'); run('capital',s=>{E.ACT.project(s,'rif','fast');E.ACT.project(s,'damascus','fast');E.ACT.decree(s,'dialogue');E.ACT.decree(s,'restitution');},'smart');
run('trade',none,'nothing'); run('trade',s=>{E.ACT.deal(s,'jordan');E.ACT.deal(s,'turkey');E.ACT.facility(s,'imf');if(s.reserves>250){E.ACT.invest(s,'oilwells');E.ACT.invest(s,'phosphate');E.ACT.portUpgrade(s,'latakia');E.ACT.invest(s,'farm');} E.ACT.decree(s,'tribal');},'smart');
