// ===== Transition: engine (pure, no DOM) =====
const START_YEAR = 2027, MAX_TURNS = 40, BASE_FX = 125, DEMAND0 = 8500;

const PROVS = [
  // id, name, popM, base unrest target, start unrest, damage $B, jobless %, power mod, col,row, neighbors
  { id:'idlib', name:'Idlib', pop:3.0, base:30, u:48, dmg:8, jobless:58, pmod:0, c:1, r:0, nb:['aleppo','hama','latakia'] },
  { id:'aleppo', name:'Aleppo', pop:4.2, base:30, u:50, dmg:25, jobless:62, pmod:0, c:2, r:0, nb:['idlib','hama','raqqa'] },
  { id:'raqqa', name:'Raqqa', pop:0.8, base:34, u:52, dmg:7, jobless:66, pmod:-1, c:3, r:0, nb:['aleppo','hasakeh','deir','hama','homs'] },
  { id:'hasakeh', name:'Hasakeh', pop:1.2, base:36, u:50, dmg:3, jobless:56, pmod:-1, c:4, r:0, nb:['raqqa','deir'] },
  { id:'latakia', name:'Latakia', pop:1.2, base:32, u:46, dmg:2, jobless:44, pmod:1, c:0, r:1, nb:['idlib','hama','tartus'] },
  { id:'hama', name:'Hama', pop:1.6, base:28, u:42, dmg:6, jobless:50, pmod:0, c:1, r:1, nb:['idlib','aleppo','latakia','homs','raqqa','tartus'] },
  { id:'deir', name:'Deir ez-Zor', pop:1.0, base:38, u:56, dmg:9, jobless:66, pmod:-1, c:3, r:1, nb:['raqqa','hasakeh','homs'] },
  { id:'tartus', name:'Tartus', pop:0.9, base:28, u:40, dmg:1, jobless:42, pmod:1, c:0, r:2, nb:['latakia','hama','homs'] },
  { id:'homs', name:'Homs', pop:1.5, base:30, u:44, dmg:14, jobless:55, pmod:0, c:2, r:1, nb:['hama','tartus','rif','deir','raqqa'] },
  { id:'damascus', name:'Damascus', pop:2.0, base:24, u:36, dmg:5, jobless:40, pmod:2, c:1, r:2, nb:['rif','quneitra','daraa'] },
  { id:'rif', name:'Rural Damascus', pop:3.0, base:30, u:47, dmg:22, jobless:58, pmod:0, c:2, r:2, nb:['damascus','homs','daraa','suwayda'] },
  { id:'quneitra', name:'Quneitra', pop:0.1, base:34, u:45, dmg:1, jobless:60, pmod:0, c:0, r:3, nb:['damascus','daraa'] },
  { id:'daraa', name:'Daraa', pop:1.0, base:34, u:50, dmg:4, jobless:56, pmod:0, c:1, r:3, nb:['quneitra','damascus','rif','suwayda'] },
  { id:'suwayda', name:'Suwayda', pop:0.4, base:40, u:58, dmg:1, jobless:58, pmod:-1, c:2, r:3, nb:['daraa','rif'] },
];
const PROV_BY = Object.fromEntries(PROVS.map(p => [p.id, p]));

const PROJECTS = {
  aleppo:  { title:'Industrial-zone substations', issue:'Workshops in the industrial city run on private generators or not at all. Owners are relocating to Turkey and Egypt.', usd:70, syp:5, pc:0, rev:1.2, power:6, unrest:-15, cap:5, repair:0.8 },
  idlib:   { title:'Olive oil export co-op and pressing plants', issue:'Farmers sell oil at a loss to middlemen, and the presses that used to employ the valley are shut.', usd:20, syp:3, pc:5, rev:0.7, jobs:-9, unrest:-12, cap:2, repair:0.25 },
  latakia: { title:'Container port rehabilitation', issue:'Cranes are decades old and ships wait days. Freight bypasses the coast entirely.', usd:60, syp:4, pc:0, rev:1.5, transit:15, unrest:-8, cap:4, repair:0.3 },
  tartus:  { title:'Cold-chain fisheries and jobs program', issue:'Demobilized young men with no work are the most combustible group on the coast.', usd:15, syp:4, pc:0, rev:0.4, unrest:-14, cap:1, repair:0.1 },
  hama:    { title:'Al-Ghab plain irrigation', issue:'Broken canals leave the country\u2019s best farmland half-planted.', usd:35, syp:3, pc:0, rev:0.5, wheat:15, unrest:-8, cap:3, repair:0.3 },
  homs:    { title:'Refinery repair and phosphate rail link', issue:'Phosphate travels by truck on bad roads and the refinery runs at a fraction of capacity.', usd:80, syp:4, pc:0, rev:1.0, phosphate:25, unrest:-8, cap:4, repair:0.6 },
  rif:     { title:'Eastern Ghouta housing and rubble recycling', issue:'Whole districts are rubble. Families return to half-standing buildings.', usd:40, syp:8, pc:0, rev:0.3, unrest:-18, cap:2, repair:1.2, trust:2 },
  damascus:{ title:'Water network and spring pumping', issue:'Summer water cuts in the capital are the fastest route to street anger.', usd:30, syp:3, pc:0, rev:0.2, unrest:-10, cap:1, repair:0.2, trust:3 },
  quneitra:{ title:'Returnee villages and farm restart', issue:'Emptied villages with nobody left to farm them, and no work for anyone who comes back.', usd:10, syp:1.5, pc:0, rev:0.1, jobs:-12, unrest:-10, cap:0.5, repair:0.1 },
  daraa:   { title:'Nassib crossing trade zone', issue:'The Jordan crossing is open but trucks face bribes, queues, and nowhere to store goods.', usd:25, syp:2, pc:0, rev:0.6, transit:20, unrest:-10, cap:2, repair:0.2 },
  suwayda: { title:'Local solar grid and water wells', issue:'Residents trust nothing that comes from the capital. Power they control locally is different.', usd:20, syp:2, pc:8, rev:0.1, power:8, unrest:-15, cap:1, repair:0.1 },
  raqqa:   { title:'Euphrates dam turbines and canals', issue:'Turbines on the river are half-dead. Fixing them lights the north and waters the fields.', usd:45, syp:3, pc:0, rev:0.4, mw:250, wheat:10, unrest:-10, cap:3, repair:0.4 },
  deir:    { title:'Oilfield workover with tribal revenue share', issue:'Tribes guard the wells and take a cut. Cutting them in formally is cheaper than fighting them.', usd:50, syp:2, pc:10, rev:0.3, oil:35, unrest:-12, cap:2, repair:0.3 },
  hasakeh: { title:'Grain silos and Khabur water', issue:'The breadbasket has nowhere to store its wheat, so it rots or gets smuggled.', usd:30, syp:2, pc:0, rev:0.3, wheat:20, unrest:-10, cap:2, repair:0.2 },
};

const DECREES = [
  { id:'integrity', name:'Integrity Commission', desc:'An independent anti-corruption body with audit powers over ministries.', pc:25, syp:1, usd:0, fx:'Corruption falls 3 a turn. Costs 1 political capital a turn to keep alive.', ongoing:true },
  { id:'restitution', name:'Property restitution portal', desc:'A digital registry so refugees and displaced families can reclaim homes.', pc:20, syp:3, usd:0, fx:'Unrest drops 6 in Aleppo, Idlib, Homs and Rif Dimashq. Trust +4, capacity +3.' },
  { id:'tribal', name:'Eastern tribal pact', desc:'Formal revenue-sharing with tribal councils along the Euphrates.', pc:30, syp:0, usd:0, fx:'Oil income +$50M a turn. Unrest drops 10 in Deir ez-Zor and Raqqa. Sovereignty -3.' },
  { id:'northeast', name:'Northeast integration accord', desc:'Folds the autonomous administration\u2019s forces and institutions into the state.', pc:40, syp:2, usd:0, fx:'Oil +$40M a turn. Unrest drops 12 in Hasakeh and Raqqa. Sovereignty +5.', req:s=>s.trust>=40, reqLabel:'Needs public trust of 40+' },
  { id:'suwayda', name:'Suwayda local governance deal', desc:'Wide local autonomy in exchange for recognizing state authority.', pc:25, syp:0, usd:0, fx:'Unrest drops 15 in Suwayda. Sovereignty -2.' },
  { id:'audit', name:'Payroll audit', desc:'Purge ghost workers and double-dippers from the public payroll.', pc:20, syp:0, usd:0, fx:'Headcount -12%. Trust -3. Unrest +5 on the coast and in Damascus.' },
  { id:'unify', name:'Unify the exchange rate', desc:'Scrap the official peg and let the lira trade at one market rate.', pc:35, syp:0, usd:0, fx:'Remittances flow through banks, not hawala. One-time inflation shock. Trust -2.' },
  { id:'braingain', name:'Diaspora brain-gain incentives', desc:'Tax holidays and fast licensing for returning doctors, engineers and founders.', pc:15, syp:4, usd:0, fx:'Capacity +1 a turn, tax compliance +3.', ongoing:true },
  { id:'digitax', name:'Digital tax administration', desc:'E-invoicing and a single taxpayer ID. Cuts the bribe-per-assessment model.', pc:20, syp:0, usd:15, fx:'Tax compliance target +12.' },
  { id:'oligarch', name:'Oligarch asset settlements', desc:'Old-regime cronies keep part of their fortunes if they hand over the rest.', pc:30, syp:0, usd:0, fx:'+25bn lira and +$60M once. Corruption -6, trust +5.' },
  { id:'fighters', name:'Fighter integration program', desc:'Salaries, training and a uniform for ex-faction fighters.', pc:25, syp:6, usd:0, fx:'Unrest drops 4 everywhere, compliance +2. Adds 40,000 to payroll.' },
  { id:'dialogue', name:'National dialogue conference', desc:'A televised constitutional dialogue with every community at the table.', pc:35, syp:1, usd:0, fx:'Trust +8, unrest drops 5 everywhere.' },
  { id:'stats', name:'Independent statistics office', desc:'Honest numbers.', pc:10, syp:0, usd:5, fx:'Exact numbers on your dashboard.' },
  { id:'vocational', name:'Vocational training and apprenticeships', desc:'Trade schools and paid apprenticeships in every province.', pc:15, syp:0, usd:0, fx:'Unemployment falls everywhere, every month. Costs $20M a year.', ongoing:true },
];
const DECREE_BY = Object.fromEntries(DECREES.map(d => [d.id, d]));

const FACILITIES = [
  { id:'imf', name:'IMF stabilization facility', lender:'Post-conflict emergency window', pc:10, sov:4, tranches:[[0,200],[2,150],[4,150]], ring:false, debt:500,
    cond:'Fuel subsidy may not be set to full while tranches remain.', check:s=>s.policy.fuel!=='full' },
  { id:'gulf', name:'Gulf reconstruction grant', lender:'Regional development fund', pc:8, sov:2, tranches:[[0,100],[2,100],[4,100]], ring:true, debt:0,
    cond:'Spent only on provincial projects. Corruption must stay below 50.', check:s=>s.corr<50, signReq:s=>s.corr<50, signLabel:'Needs corruption below 50' },
  { id:'wb', name:'World Bank grid program', lender:'Energy sector recovery', pc:12, sov:1, tranches:[[0,75],[2,75]], grid:true, debt:0,
    cond:'Money goes straight into power stations.', check:()=>true, signReq:s=>s.trust>=40, signLabel:'Needs public trust of 40+' },
  { id:'bridge', name:'Commercial bridge loan', lender:'Private bank consortium', pc:0, sov:6, tranches:[[0,250]], ring:false, debt:300, coupon:9,
    cond:'Expensive: $9M a turn in interest on top of normal debt service.', check:()=>true },
];
const FAC_BY = Object.fromEntries(FACILITIES.map(f => [f.id, f]));

const POLICY_OPTS = {
  bread:    [['full','Full subsidy'],['partial','Targeted'],['removed','Removed']],
  fuel:     [['full','Full subsidy'],['partial','Partial'],['market','Market price']],
  tax:      [['lax','Lax'],['standard','Standard'],['aggressive','Aggressive']],
  security: [['light','Light'],['balanced','Balanced'],['heavy','Heavy']],
  print:    [[0,'None'],[5,'5bn'],[15,'15bn'],[30,'30bn']],
  capex:    [[0,'$0'],[20,'$20M'],[40,'$40M']],
  recon:    [[0,'0'],[5,'5bn'],[10,'10bn'],[20,'20bn']],
  intervene:[[0,'$0'],[25,'$25M'],[50,'$50M']],
  crackdown:[[false,'Off'],[true,'On']],
};

// ===== Engine v5 core: continuous months + trade & resources =====
const MONTH = 1 / 6;             // one month, in half-year units (all rates below are per half-year)
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const clone = o => JSON.parse(JSON.stringify(o));
function rnd(s){ s.seed = (s.seed + 0x6D2B79F5) | 0; let t = s.seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const relax = (r, dt) => 1 - Math.pow(1 - r, dt);   // per-half-year relaxation rate scaled to dt

// ---------- trade & resources data ----------
const INVEST = {
  // extraction: dollars, but few jobs
  oilwells:{ usd:60, months:8, max:3, jobs:2, req:s => eastAnger(s) < 70 },
  refinery:{ usd:50, months:8, max:3, jobs:3 },
  gasfield:{ usd:80, months:12, max:3, jobs:2 },
  offshore:{ usd:150, months:24, gamble:true, jobs:1 },
  phosphate:{ usd:50, months:8, max:3, jobs:3 },
  farm:{ usd:30, months:8, max:3, jobs:5 },
  // industry: fewer dollars per dollar spent, but this is what employs a country
  textiles:{ usd:35, months:6, max:3, jobs:11, sector:true },
  food:{ usd:30, months:6, max:3, jobs:9, sector:true },
  pharma:{ usd:45, months:9, max:3, jobs:7, sector:true },
  cement:{ usd:55, months:9, max:3, jobs:6, sector:true },
  telecom:{ usd:70, months:9, max:3, jobs:5, sector:true },
  tourism:{ usd:40, months:12, max:3, jobs:10, sector:true, req:s => natUnrest(s) < 48 },
};
// Where each sector's jobs land, and what it earns abroad per half-year, per level.
const IND = {
  textiles:{ exp:15, prov:['aleppo','idlib','hama'] },
  food:{ exp:9, prov:['hama','hasakeh','daraa'], wheatCut:9 },
  pharma:{ exp:12, prov:['damascus','rif','aleppo'] },
  cement:{ exp:5, prov:['homs','hama'], reconBoost:0.16 },
  telecom:{ exp:4, prov:['damascus','aleppo'], comp:4, capGain:0.3 },
  tourism:{ exp:0, prov:['damascus','latakia','homs'] },   // earns through visitors, not ports
};
const indLvl = (s, k) => (s.ind && s.ind[k]) || 0;
// Jobs a province gets from the sectors: full weight where they are built, a share elsewhere.
function indJobsAt(s, id){
  let j = 0;
  Object.keys(IND).forEach(k => { const n = indLvl(s, k); if (n) j += INVEST[k].jobs * n * (IND[k].prov.includes(id) ? 1 : 0.3); });
  ['oilwells','refinery','gasfield','phosphate','farm','offshore'].forEach(k => { const n = (s.invests && s.invests[k]) || 0; if (n) j += INVEST[k].jobs * n * 0.4; });
  return j;
}
function joblessNat(s){ let tot = 0, w = 0; PROVS.forEach(p => { tot += s.provs[p.id].jobless * p.pop; w += p.pop; }); return tot / w; }
// Visitors only come to a calm, lit country — and it pays in dollars with no ship involved.
function tourismIncome(s){
  const n = indLvl(s, 'tourism'); if (!n) return 0;
  return 18 * n * clamp(1.25 - natUnrest(s) / 55, 0, 1.1) * clamp(nationalHours(s) / 14, 0.3, 1);
}
function industryExports(s){ let e = 0; Object.keys(IND).forEach(k => e += IND[k].exp * indLvl(s, k)); return e; }
const PARTNERS = {
  turkey:{ flag:'🇹🇷', pc:15, sov:1, ok:s => s.provs.aleppo.u < 65 && s.provs.idlib.u < 65 },
  jordan:{ flag:'🇯🇴', pc:10, sov:0, ok:s => s.provs.daraa.u < 65 },
  iraq:{ flag:'🇮🇶', pc:12, sov:0, ok:s => s.provs.deir.u < 65 },
  lebanon:{ flag:'🇱🇧', pc:8, sov:0, usd:40, ok:s => s.provs.homs.u < 70 },
  gulf:{ flag:'🌴', pc:15, sov:2, ok:s => s.corr < 55 },
  eu:{ flag:'🇪🇺', pc:20, sov:1, ok:s => s.trust >= 45 && s.corr < 50, signReq:s => s.trust >= 45 && s.corr < 50 },
  china:{ flag:'🇨🇳', pc:10, sov:5, ok:() => true },
  russia:{ flag:'🌾', pc:8, sov:5, ok:() => true },
};
const PORT_UPGRADE = { usd:60, months:8 };
const eastAnger = s => (s.provs.deir.u + s.provs.hasakeh.u + s.provs.raqqa.u) / 3;
const dealOn = (s, id) => s.deals[id] && s.deals[id].on;

function newGame(seed, diff = 'learner', mission = null){
  const easy = diff === 'learner' || !!mission;
  const provs = {};
  PROVS.forEach(p => provs[p.id] = { id:p.id, u:p.u, dmg:p.dmg, dmg0:p.dmg, jobless:clamp(p.jobless + (easy ? 0 : 9), 0, 95), jobsMod:0, mod:0, power:0, project:false });
  return {
    v:6, diff, seed: seed ?? Math.floor(Math.random()*1e9), t:0,
    treasury: easy ? 70 : 40, reserves: easy ? 750 : 400, m2:190, official:110, parallel:125, infl:25,
    wage:3000, head:1.30, debt:6100, coupons:0,
    pc: easy ? 70 : 50, trust:42, corr:58, sov:60, comp:35, cap:20, mw:2300, demand:DEMAND0,
    grant:0, repaired:0,
    policy:{ bread:'partial', fuel:'partial', tax:'standard', security:'balanced', print:0, capex:0, recon:0, intervene:0, crackdown:false, oilHome:0.5 },
    res:{ oilCap:60, refinery:25, gas:7, phos:1, farm:1, offshore:null },
    ind:{ telecom:0, pharma:0, textiles:0, cement:0, food:0, tourism:0 }, bar:0,
    ports:{ latakia:{ lvl:1, op:'state' }, tartus:{ lvl:1, op:'state' } },
    deals:{}, invests:{}, decrees:{}, facilities:{}, flags:{}, provs,
    pipe:[], history:[], log:[], event:null, recentEvents:[], over:null, last:null, cycles:[], scoreHist:[],
  };
}
function startGame(seed, diff, mission){
  const s = newGame(seed, diff, mission);
  if (mission){ MISSIONS[mission].setup(s); s.mission = { id:mission, start:s.t, end:s.t + MISSIONS[mission].months }; }
  s.score = legacy(s).avg; return s;
}

// ---------- time helpers ----------
const monthOf = s => ((s.t % 12) + 12) % 12;
const yearNow = s => START_YEAR + Math.floor(s.t / 12);
function seasonNow(s){ const m = monthOf(s); return m >= 3 && m <= 8 ? 'H1' : 'H2'; }   // Apr–Sep harvest, Oct–Mar winter
const realWage = s => s.wage / s.parallel;
const demandNow = s => s.demand * (1 + Math.max(0, s.cap - 20) / 160);
function nationalHours(s){ return clamp(22 * Math.pow((s.mw + (s.mwImport || 0)) / demandNow(s), 1.3), 0.5, 23); }
function provHours(s, id){ return clamp(nationalHours(s) + PROV_BY[id].pmod + s.provs[id].power, 0, 24); }
function natUnrest(s){ let tot = 0, w = 0; PROVS.forEach(p => { tot += s.provs[p.id].u * p.pop; w += p.pop; }); return tot / w; }
function tierOf(u){ return u < 35 ? 'calm' : u < 55 ? 'tense' : u < 75 ? 'riot' : 'revolt'; }
const built = (s, id) => s.provs[id].project === true;
const projLeak = (s, id) => s.provs[id].leak || 0;
function projMonths(id, mode){ return (clamp(Math.ceil(PROJECTS[id].usd / 30), 1, 3) + (mode === 'tender' ? 1 : 0)) * 4; }
function projLeakRate(s, mode){ return mode === 'tender' ? s.corr / 900 : 0.12 + s.corr / 400; }

// ---------- oil & trade derived numbers (per half-year) ----------
function oilNumbers(s){
  const access = 0.3 + (s.decrees.tribal ? 0.35 : 0) + (s.decrees.northeast ? 0.35 : 0);
  const security = clamp(1 - eastAnger(s) / 120, 0.2, 1);
  const prod = s.res.oilCap * access * security;                 // thousand barrels/day
  const refineCap = s.res.refinery + (built(s, 'homs') ? 20 : 0);
  const home = Math.min(prod * s.policy.oilHome, refineCap), exp = prod - home;
  return { prod, home, exp, refineCap, access, security };
}
function exportCapacity(s){
  const L = s.ports.latakia.lvl, T = s.ports.tartus.lvl;
  return 70 + 45 * (L + T - 2) + (dealOn(s, 'turkey') ? 30 : 0) + (dealOn(s, 'jordan') ? 25 : 0) + (built(s, 'latakia') ? 20 : 0) + (built(s, 'daraa') ? 15 : 0);
}

// ---------- one month (or any dt) ----------
function step(state, dt = MONTH, policyOverride){
  const s = clone(state);
  const L = { syp:[], usd:[] }, notes = [];
  const addS = (k, v) => { v *= dt; if (Math.abs(v) > 1e-4) L.syp.push([k, v]); s.treasury += v; };
  const addU = (k, v) => { v *= dt; if (Math.abs(v) > 1e-3) L.usd.push([k, v]); s.reserves += v; };
  if (policyOverride) s.policy = clone(policyOverride);
  const P = s.policy, season = seasonNow(s);
  const months = dt * 6;
  const endT = s.t + months;

  // --- things finishing (delays) ---
  s.pipe = s.pipe.filter(item => {
    if (item.due > endT) return true;
    if (item.kind === 'mw'){ s.mw += item.mw; if (item.mw >= 50) notes.push(['gridDone', Math.round(item.mw)]); }
    if (item.kind === 'proj') finishProject(s, item, notes);
    if (item.kind === 'invest') finishInvest(s, item, notes);
    if (item.kind === 'port'){ const p = s.ports[item.id]; p.lvl = Math.min(3, p.lvl + 1); notes.push(['portDone', item.id, p.lvl]); }
    return false;
  });

  // --- facility tranches & conditions (offsets in months) ---
  Object.entries(s.facilities).forEach(([id, st]) => {
    const f = FAC_BY[id]; if (st.frozen) return;
    if (st.paid > 0 && st.paid < f.tranches.length && !f.check(s)) { st.frozen = true; s.trust -= 3; notes.push(['facFrozen', id]); return; }
    while (st.paid < f.tranches.length && endT >= st.signed + f.tranches[st.paid][0] * 6) {
      const amt = f.tranches[st.paid][1]; st.paid++;
      if (f.ring) { s.grant += amt; notes.push(['grant', amt]); }
      else if (f.grid) { s.pipe.push({ due:endT + 8, kind:'mw', mw:amt * 5 }); notes.push(['wbGrid', amt * 5]); }
      else { s.reserves += amt; L.usd.push(['loan_' + id, amt]); }
    }
  });

  // --- trade deals: active only while their conditions hold ---
  Object.entries(s.deals).forEach(([id, d]) => { const on = PARTNERS[id].ok(s); if (on !== d.on){ d.on = on; notes.push([on ? 'dealOn' : 'dealOff', id]); } });
  s.mwImport = dealOn(s, 'iraq') ? 300 : 0;

  // --- lira budget ---
  const capMult = 1 + (s.cap - 20) * 0.0125, pIdx = s.parallel / BASE_FX;
  const taxMult = { lax:0.85, standard:1, aggressive:1.2 }[P.tax];
  addS('taxes', 20 * (s.comp / 35) * capMult * taxMult * Math.pow(pIdx, 0.8));
  addS('customs', 6 * capMult * (P.crackdown ? 1.3 : 1) * pIdx * (1 - s.corr / 250));
  let projRev = 0; PROVS.forEach(p => { if (built(s, p.id)) projRev += PROJECTS[p.id].rev * (1 - projLeak(s, p.id)); });
  if (projRev) addS('projRev', projRev * Math.pow(pIdx, 0.6));
  if (P.fuel === 'market') addS('fuelSales', 3 * pIdx);
  addS('wages', -(s.head * 1e6 * s.wage * 6) / 1e9);
  addS('bread', -{ full:7, partial:4, removed:0.5 }[P.bread] * pIdx);
  if (P.fuel !== 'market') addS('fuelSub', -{ full:8, partial:4 }[P.fuel] * pIdx);
  addS('security', -{ light:3, balanced:5, heavy:8 }[P.security] * Math.pow(pIdx, 0.7));
  addS('running', -3 * Math.pow(pIdx, 0.7) * (1 + s.bar * 0.9));
  if (P.recon) addS('recon', -P.recon);
  if (s.decrees.integrity) addS('integrity', -0.5);
  if (state.treasury < 0) addS('interest', state.treasury * 0.04);
  if (P.print) addS('printed', P.print);

  // --- dollars: money from abroad ---
  const spread = s.official ? s.parallel / s.official - 1 : 0;
  const capture = clamp((s.flags.unified ? 1 : 1.1 - spread * 3) + (s.flags.remitBoost ? 0.15 : 0), 0.25, 1.1);
  addU('remit', 160 * capture * (1 + (s.trust - 42) / 200));
  // --- dollars: selling abroad (limited by what ports and border crossings can move) ---
  const euMult = dealOn(s, 'eu') ? 1.25 : 1;
  const oil = oilNumbers(s);
  const exportsWanted = {
    phos: (35 * (1 - s.provs.homs.u / 150) * s.res.phos * (s.flags.phosConcession ? 0.6 : 1) + (built(s,'homs') ? PROJECTS.homs.phosphate * (1 - projLeak(s,'homs')) : 0)) * (dealOn(s, 'china') ? 0.7 : 1),
    oilExport: oil.exp * 1.8 * euMult,
    farm: 10 * s.res.farm * euMult * clamp(1.3 - (s.provs.hama.u + s.provs.idlib.u + s.provs.hasakeh.u) / 300, 0.4, 1),
    exports: s.cap > 20 ? (s.cap - 20) * 1.5 * euMult * (dealOn(s, 'turkey') ? 1.15 : 1) : 0,
    industry: industryExports(s) * euMult * (dealOn(s, 'turkey') ? 1.15 : 1),
  };
  const wantTotal = Object.values(exportsWanted).reduce((a, b) => a + b, 0), capE = exportCapacity(s);
  const fit = wantTotal > capE ? capE / wantTotal : 1;
  Object.entries(exportsWanted).forEach(([k, v]) => { if (v > 0.05) addU(k, v * fit); });
  s.clogged = wantTotal > capE ? wantTotal - capE : 0; s.exportWant = wantTotal; s.exportCap = capE;
  // --- dollars: transit, ports, investment ---
  const south = (s.provs.daraa.u + s.provs.quneitra.u) / 2;
  const portShare = (s.ports.latakia.op === 'foreign' ? 0.15 : 0) + (s.ports.tartus.op === 'foreign' ? 0.15 : 0);
  addU('transit', (25 * (P.crackdown ? 1.2 : 1) * (1 - south / 200) * (0.8 + 0.2 * (s.ports.latakia.lvl + s.ports.tartus.lvl) / 2) * (1 - portShare)
    + (built(s,'latakia') ? 15 * (1 - projLeak(s,'latakia')) : 0) + (built(s,'daraa') ? 20 * (1 - projLeak(s,'daraa')) : 0)
    + (dealOn(s, 'jordan') ? 20 : 0) + (dealOn(s, 'lebanon') ? 12 : 0)));
  addU('overflight', 8);
  { const tr = tourismIncome(s); if (tr > 0.5) addU('tourism', tr); }
  if (dealOn(s, 'gulf')) addU('fdi', 40);
  if (dealOn(s, 'eu')) addU('euGrant', 30);
  if (s.cap > 20) addU('imports', -(s.cap - 20) * 1.4);
  // --- dollars: buying food and fuel ---
  let wheatCut = indLvl(s, 'food') * IND.food.wheatCut; ['hama','hasakeh','raqqa'].forEach(k => { if (built(s, k)) wheatCut += PROJECTS[k].wheat * (1 - projLeak(s, k)); });
  const drought = s.flags.droughtUntil && s.t < s.flags.droughtUntil ? 2.1 : 1;
  const ez = s.diff === 'learner' ? 0.88 : 1;
  const wheat = Math.max(10, 110 * { full:1, partial:0.85, removed:0.7 }[P.bread] * (season === 'H1' ? 0.55 : 1.1) * drought * (dealOn(s, 'russia') ? 0.75 : 1) - wheatCut);
  addU('wheat', -wheat * ez);
  addU('fuel', -ez * (86 * { full:1.15, partial:1, market:0.85 }[P.fuel] * (season === 'H1' ? 0.9 : 1.15) + s.mw / 2300 * 25));
  addU('homeEnergy', oil.home * 2.2 + s.res.gas * 3 + (dealOn(s, 'iraq') ? 10 : 0));
  if (dealOn(s, 'iraq')) addU('powerImport', -15);
  addU('debt', -(s.debt * 0.006 + s.coupons));
  if (P.capex) addU('grid', -P.capex);
  if (P.intervene) addU('intervene', -P.intervene);
  if (s.decrees.vocational) addU('vocational', -10);
  const outflowRate = L.usd.filter(x => x[1] < 0).reduce((a, x) => a - x[1], 0) / dt;

  // --- grid: new stations arrive 12 months later ---
  const gridEff = s.corr > 60 ? 0.7 : 1;
  if (P.capex) s.pipe.push({ due:endT + 8, kind:'mw', mw:P.capex * 6 * gridEff * dt }); else s.mw -= 25 * dt;
  s.demand *= Math.pow(1.004 + s.bar * 0.004, dt);   // a working economy wants more electricity every year

  // --- currency (rates per half-year, applied for dt) ---
  const cover = s.reserves / Math.max(1, outflowRate / 6);
  const fx = { base:2.5, print:(P.print / s.m2) * 110,
    reserves: cover < 2 ? (2 - cover) * 6 : cover < 4 ? 0.5 : -0.5 * Math.min(3, cover - 4),
    trust: -clamp((s.trust - 45) * 0.08, -3, 2), deficit: s.treasury < 0 ? Math.min(8, -s.treasury / 3) : 0, intervene: -P.intervene * 0.08, shock:0 };
  const pct = clamp(Object.values(fx).reduce((a, b) => a + b, 0) / 100, -0.025, 0.5);
  s.parallel *= Math.pow(1 + pct, dt);
  s.official = s.flags.unified ? s.parallel : s.official + (s.parallel - s.official) * relax(0.2, dt);
  s.infl = Math.max(1, s.infl + (((1 + pct) ** 2 - 1) * 100 - s.infl) * relax(0.7, dt));
  s.m2 += P.print * dt + (s.treasury < 0 ? Math.max(0, (state.treasury - s.treasury)) * 0.5 : 0);

  // --- society ---
  const rw = realWage(s), hrs = nationalHours(s), nu = natUnrest(s);
  // THE BAR. Every good year raises what counts as good enough, and it never drops back.
  // Nobody thanks you in 2040 for the electricity that made you a hero in 2029.
  const barFrom = s.diff === 'realistic' ? 38 : 44, barOver = s.diff === 'realistic' ? 36 : 40;
  s.bar = clamp(Math.max(s.bar || 0, ((s.score || 40) - barFrom) / barOver), 0, 1);
  s.expWage = 25 + Math.max(0, s.cap - 20) * 0.6 + s.bar * 32;
  const tp = { base:45, decrees:(s.trustMod || 0), bread:{ full:6, partial:0, removed:-10 }[P.bread], fuel:{ full:4, partial:0, market:-6 }[P.fuel],
    pay:clamp((rw - s.expWage) * 0.6, -15, 15), power:(hrs - 6) * 1.2, prices:clamp(-(s.infl - 20) * 0.4, -15, 5),
    security:{ light:2, balanced:0, heavy:-6 }[P.security], tax:(P.tax === 'aggressive' ? -3 : 0), anger:-(nu - 45) * 0.5, debt:(s.treasury < -30 ? -5 : 0),
    jobs:-(joblessNat(s) - 55) * 0.16, bar:-s.bar * 12 };
  s.trustTarget = clamp(Object.values(tp).reduce((a, b) => a + b, 0), 0, 100);
  s.trust = clamp(s.trust + (s.trustTarget - s.trust) * relax(0.38, dt), 0, 100);
  let dPC = 4 + (s.trust - 45) / 10 - (nu > 60 ? 3 : 0) + (P.security === 'heavy' ? 2 : 0) - (s.decrees.integrity ? 1 : 0);
  s.pc = clamp(s.pc + dPC * dt, 0, 200);
  const cT = 56 + clamp((25 - rw) * 0.8, -12, 20) + (P.crackdown ? -4 : 0) + (s.decrees.integrity ? -20 : 0) + (s.decrees.digitax ? -5 : 0) + (P.tax === 'aggressive' && rw < 25 ? 3 : 0);
  s.corr = clamp(s.corr + (cT - s.corr) * relax(0.22, dt), 5, 100);
  const compT = 38 + s.trust * 0.35 - s.corr * 0.3 + { lax:-4, standard:0, aggressive:8 }[P.tax] + (s.decrees.digitax ? 12 : 0) + (s.decrees.braingain ? 3 : 0) + indLvl(s, 'telecom') * IND.telecom.comp;
  s.comp = clamp(s.comp + (compT - s.comp) * relax(0.35, dt), 5, 95);
  const revolts = PROVS.filter(p => tierOf(s.provs[p.id].u) === 'revolt').length;
  let gain = { 0:-0.8, 20:0.5, 40:1 }[P.capex] + (hrs > 8 ? 0.5 : 0) + (s.decrees.braingain ? 1 : 0) + (s.trust > 55 ? 0.5 : 0) + (dealOn(s, 'gulf') ? 0.5 : 0)
    + indLvl(s, 'telecom') * IND.telecom.capGain + clamp((38 - joblessNat(s)) * 0.04, -0.8, 1.2);
  if (gain > 0 && s.corr > 60) gain *= 0.5;
  if (gain > 0) gain *= Math.max(0.15, 1 - s.cap / 110);
  s.cap = clamp(s.cap + (gain - revolts * 1.5 - (nu > 60 ? 1 : 0)) * dt, 5, 100);

  // --- provinces ---
  const reconB = P.recon * dt / s.parallel * (1 + indLvl(s, 'cement') * IND.cement.reconBoost);
  const privB = (s.trust > 40 ? (s.trust - 40) * s.cap * 0.0004 : 0) * dt;
  const totalDmg = PROVS.reduce((a, p) => a + s.provs[p.id].dmg, 0) || 1;
  const newU = {}, ap = { trust:0, pay:0, power:0, subsidies:0, security:0, damage:0, jobs:0, prices:0, local:0, neighbors:0 };
  let wsum = 0, maxContagion = 0;
  PROVS.forEach(p => {
    const pv = s.provs[p.id], blackout = 24 - provHours(s, p.id);
    const parts = { trust:(50 - s.trust) * 0.4, pay:clamp((s.expWage - rw) * 0.5, -10, 15), power:blackout * 0.8 - 10,
      subsidies:{ full:-4, partial:0, removed:9 }[P.bread] + { full:-2, partial:0, market:5 }[P.fuel], security:{ light:5, balanced:0, heavy:-7 }[P.security],
      damage:Math.min(12, pv.dmg / p.pop * 0.8), jobs:(pv.jobless - 55) * 0.17, prices:(s.infl - 20) * 0.15, local:pv.mod + s.bar * 5 };
    const tgt = clamp(p.base + Object.values(parts).reduce((a, b) => a + b, 0), 12, 100);
    let contagion = 0; p.nb.forEach(n => contagion += Math.max(0, s.provs[n].u - 60) * 0.06);
    maxContagion = Math.max(maxContagion, contagion);
    newU[p.id] = clamp(pv.u + (tgt - pv.u) * relax(0.44, dt) + contagion * dt, 0, 100);
    Object.keys(parts).forEach(k => ap[k] += parts[k] * p.pop); ap.neighbors += contagion * p.pop / 0.44; wsum += p.pop;
    const rep = Math.min(pv.dmg, (reconB + privB) * pv.dmg / totalDmg); pv.dmg -= rep; s.repaired += rep;
    // Work comes from factories, a calm street and the lights staying on — and goes when any of them fail.
    const jt = clamp(p.jobless + (pv.jobsMod || 0)
      - indJobsAt(s, p.id)
      - Math.max(0, s.cap - 20) * 0.38
      - (s.decrees.vocational ? 9 : 0)
      - (built(s, p.id) ? 7 : 0)
      + Math.max(0, 12 - provHours(s, p.id)) * 0.55
      + Math.max(0, pv.u - 55) * 0.35, 4, 95);
    pv.jobless = clamp(pv.jobless + (jt - pv.jobless) * relax(0.30, dt), 0, 100);
  });
  Object.keys(ap).forEach(k => ap[k] /= wsum);
  PROVS.forEach(p => s.provs[p.id].u = newU[p.id]);

  s.trust = clamp(s.trust, 0, 100); s.corr = clamp(s.corr, 5, 100); s.sov = clamp(s.sov, 0, 100);
  s.t = endT;
  s.score = legacy(s).avg;
  s.last = { ledger:L, notes, dt, privB:privB / dt, maxContagion, clogged:s.clogged, oil,
    why:{ fx, pct:pct * 100, trustParts:tp, angerParts:ap } };
  return s;
}

// ---------- completing delayed things ----------
function finishProject(s, item, notes){
  const x = PROJECTS[item.id], pv = s.provs[item.id], k = 1 - item.leak;
  pv.project = true; pv.leak = item.leak;
  pv.u += x.unrest * k; pv.mod += x.unrest * 0.4 * k;
  if (x.power) pv.power += x.power * k;
  if (x.jobs) pv.jobsMod = (pv.jobsMod || 0) + x.jobs * k;
  if (x.mw) s.mw += x.mw * k;
  if (x.trust) s.trust += x.trust * k;
  const rep = Math.min(pv.dmg, x.repair * k); pv.dmg -= rep; s.repaired += rep;
  s.cap += (s.corr > 60 ? 0.5 : 1) * x.cap * k;
  notes.push(['projDone', item.id, Math.round(x.usd * item.leak)]);
}
function finishInvest(s, item, notes){
  const r = s.res;
  if (IND[item.id]){ s.ind[item.id] = (s.ind[item.id] || 0) + 1; notes.push(['investDone', item.id]); return; }
  switch(item.id){
    case 'oilwells': r.oilCap += 25; break;
    case 'refinery': r.refinery += 20; break;
    case 'gasfield': r.gas += 3; break;
    case 'phosphate': r.phos += 0.35; break;
    case 'farm': r.farm += 1; break;
    case 'offshore': { const hit = rnd(s) < 0.5; r.offshore = hit ? 'found' : 'dry'; if (hit) r.gas += 10; notes.push(['offshore', hit]); return; }
  }
  notes.push(['investDone', item.id]);
}

// ---------- player actions (happen immediately) ----------
function canAfford(s, c){ return (!c.pc || s.pc >= c.pc) && (!c.usd || s.reserves >= c.usd) ; }
const ACT = {
  decree(s, id){
    const x = DECREE_BY[id]; if (s.decrees[id] !== undefined || !canAfford(s, x) || (x.req && !x.req(s))) return false;
    s.pc -= x.pc; s.treasury -= x.syp; s.reserves -= x.usd; s.decrees[id] = s.t;
    const pv = s.provs;
    switch(id){
      case 'restitution': ['aleppo','idlib','homs','rif'].forEach(k => pv[k].mod -= 6); s.trust += 4; s.trustMod = (s.trustMod||0) + 3; s.cap += 3; break;
      case 'tribal': pv.deir.mod -= 10; pv.raqqa.mod -= 10; s.sov -= 3; break;
      case 'northeast': pv.hasakeh.mod -= 12; pv.raqqa.mod -= 12; s.sov += 5; break;
      case 'suwayda': pv.suwayda.mod -= 15; s.sov -= 2; break;
      case 'audit': s.head *= 0.88; s.trust -= 3; ['latakia','tartus','damascus'].forEach(k => pv[k].mod += 5); break;
      case 'unify': s.flags.unified = true; s.official = s.parallel; s.infl += 8; s.trust -= 2; break;
      case 'oligarch': s.treasury += 25; s.reserves += 60; s.corr -= 6; s.trust += 5; s.trustMod = (s.trustMod||0) + 2; break;
      case 'fighters': PROVS.forEach(p => pv[p.id].mod -= 4); s.comp += 2; s.head += 0.04; break;
      case 'dialogue': s.trust += 8; s.trustMod = (s.trustMod||0) + 6; PROVS.forEach(p => pv[p.id].mod -= 5); break;
      case 'stats': s.flags.stats = true; break;
    }
    s.log.push([s.t, 'decree', id]); return true;
  },
  project(s, id, mode){
    const x = PROJECTS[id], pv = s.provs[id]; if (pv.project) return false;
    const fromGrant = Math.min(s.grant, x.usd), usdNeed = x.usd - fromGrant;
    if (s.pc < x.pc || s.reserves < usdNeed) return false;
    s.pc -= x.pc; s.grant -= fromGrant; s.reserves -= usdNeed; s.treasury -= x.syp;
    const months = projMonths(id, mode), leak = projLeakRate(s, mode);
    pv.project = 'building'; s.corr += mode === 'fast' ? 2 : -1;
    s.pipe.push({ due:s.t + months, kind:'proj', id, leak, mode });
    s.log.push([s.t, 'projStart', id, months, Math.round(x.usd * leak)]); return true;
  },
  facility(s, id){
    const f = FAC_BY[id]; if (s.facilities[id] || s.pc < f.pc || (f.signReq && !f.signReq(s))) return false;
    s.pc -= f.pc; s.facilities[id] = { signed:s.t, paid:0, frozen:false }; s.sov -= f.sov; s.debt += f.debt; if (f.coupon) s.coupons += f.coupon;
    const first = f.tranches[0][1]; s.facilities[id].paid = 1;
    if (f.ring) s.grant += first; else if (f.grid) s.pipe.push({ due:s.t + 8, kind:'mw', mw:first * 5 }); else s.reserves += first;
    s.log.push([s.t, 'facSign', id]); return true;
  },
  wage(s, pct){ s.wage *= 1 + pct / 100; s.trust += pct / 10; s.log.push([s.t, 'wage', pct]); return true; },
  gift(s){ if (s.treasury < -100) return false; s.treasury -= 7; s.pc += 8; s.log.push([s.t, 'grantPop']); return true; },
  relief(s){ if (s.reserves < 40) return false; s.reserves -= 40; s.pc += 6; s.trust += 2; s.log.push([s.t, 'relief']); return true; },
  invest(s, id){
    const x = INVEST[id]; if (s.reserves < x.usd || (x.req && !x.req(s)) || s.pipe.some(p => p.kind === 'invest' && p.id === id)) return false;
    if (id === 'offshore' && s.res.offshore) return false;
    if (x.max && (s.invests[id] || 0) >= x.max) return false;
    s.reserves -= x.usd; s.pipe.push({ due:s.t + x.months, kind:'invest', id }); s.invests[id] = (s.invests[id] || 0) + 1;
    if (id === 'offshore') s.res.offshore = 'drilling';
    s.log.push([s.t, 'investStart', id, x.months]); return true;
  },
  portUpgrade(s, id){
    const p = s.ports[id]; if (p.lvl >= 3 || s.reserves < PORT_UPGRADE.usd || s.pipe.some(x => x.kind === 'port' && x.id === id)) return false;
    s.reserves -= PORT_UPGRADE.usd; s.pipe.push({ due:s.t + PORT_UPGRADE.months, kind:'port', id }); s.log.push([s.t, 'portStart', id]); return true;
  },
  portConcession(s, id){
    const p = s.ports[id]; if (p.op === 'foreign') return false;
    p.op = 'foreign'; s.reserves += 100; s.sov -= 4;
    for (let i = p.lvl; i < 3; i++) s.pipe.push({ due:s.t + 12 * (i - p.lvl + 1), kind:'port', id });
    s.log.push([s.t, 'portConcession', id]); return true;
  },
  oilHome(s, v){ s.policy.oilHome = v; return true; },
  deal(s, id){
    const x = PARTNERS[id]; if (s.deals[id] || s.pc < x.pc || (x.usd && s.reserves < x.usd) || (x.signReq && !x.signReq(s))) return false;
    s.pc -= x.pc; if (x.usd) s.reserves -= x.usd; s.sov -= x.sov;
    s.deals[id] = { signed:s.t, on:x.ok(s) };
    if (id === 'china'){ ['latakia','tartus'].forEach(k => { if (s.ports[k].lvl < 3) s.pipe.push({ due:s.t + 8, kind:'port', id:k }); }); }
    s.log.push([s.t, 'dealSign', id]); return true;
  },
};

// ---------- missions (in months) ----------
const MISSIONS = {
  winter:{ months:48, setup:s => { s.t = 9; s.mw = 1900; s.reserves = 520; s.pc = 60; },
    check:s => nationalHours(s) >= 7 && !PROVS.some(p => tierOf(s.provs[p.id].u) === 'revolt') },
  lira:{ months:48, setup:s => { s.parallel = 260; s.official = 150; s.infl = 90; s.m2 = 260; s.treasury = 15; s.reserves = 480; s.policy.print = 15; s.trust = 36; s.pc = 70; s.wage = 4400; },
    check:s => s.parallel < 340 && s.infl < 30 },
  bread:{ months:48, setup:s => { s.flags.droughtUntil = 48; s.reserves = 380; s.provs.hasakeh.u = 60; s.provs.raqqa.u = 60; s.provs.hasakeh.mod = 5; s.provs.raqqa.mod = 5; s.pc = 60; },
    check:s => s.trust >= 40 && s.reserves >= 250 && s.provs.hasakeh.u < 55 },
  capital:{ months:48, setup:s => { s.provs.rif.u = 70; s.provs.damascus.u = 60; s.provs.rif.mod = 6; s.provs.damascus.mod = 4; s.pc = 80; },
    check:s => s.provs.rif.u < 50 && s.provs.damascus.u < 45 },
  trade:{ months:48, setup:s => { s.reserves = 450; s.pc = 80; },
    check:s => (s.last ? s.last.ledger.usd.filter(x => ['phos','oilExport','farm','exports','transit','fdi'].includes(x[0])).reduce((a, x) => a + x[1], 0) / s.last.dt : 0) >= 125 },
};

function checkFail(s){
  const revolts = PROVS.filter(p => tierOf(s.provs[p.id].u) === 'revolt');
  const nu = natUnrest(s);
  if (s.reserves <= 0) return { id:'default', title:'Sovereign default', text:'The central bank ran out of dollars. Wheat and fuel cargoes turned around at sea, creditors moved on the phosphate mines, and the lira went into free fall. The cabinet resigned within a week.' };
  if (s.infl > 300) return { id:'hyper', title:'Hyperinflation', text:'Prices doubled faster than salaries could be paid. Shops stopped quoting in lira, the state lost control of its own money, and with it, the country.' };
  if (nu >= 75 && revolts.length >= 4) return { id:'uprising', title:'General uprising', text:`Revolt spread across ${revolts.length} provinces at once. Security forces could not hold the streets and crowds reached the palace gates.` };
  if (realWage(s) < 8 && s.corr > 75) return { id:'coup', title:'Military coup', text:'Soldiers earning less than eight dollars a month watched their commanders get rich. The general staff announced a salvation council and put you under house arrest.' };
  const eastRevolt = ['hasakeh','raqqa','deir'].filter(k => tierOf(s.provs[k].u) === 'revolt').length;
  if (tierOf(s.provs.suwayda.u) === 'revolt' && eastRevolt >= 2) return { id:'fracture', title:'The map breaks apart', text:'Suwayda and the east declared self-rule on the same week and cut the oil and wheat routes to the capital. Foreign patrons moved in to protect the new statelets.' };
  if (s.pc <= 0 && s.trust <= 5) return { id:'paralysis', title:'Paralysis', text:'Nobody obeyed a decree and nobody believed a speech. Ministries stopped reporting to the palace and governors started running their own budgets.' };
  return null;
}

function legacy(s){
  const nu = natUnrest(s);
  // Two of the six are graded against what people now expect, not against 2027. Money in the
  // bank and an honest ministry are facts; whether life feels good is always a comparison.
  const bar = s.bar || 0;
  const comp = {
    Stability: clamp(100 - nu - bar * 8, 0, 100),
    Livelihoods: clamp(realWage(s) / (150 + bar * 70) * 100, 0, 100),
    Reconstruction: clamp(s.repaired / 108 * 100 * 2.5, 0, 100),
    Institutions: clamp(100 - s.corr, 0, 100),
    Solvency: clamp(s.reserves / 1500 * 60 + (1 - s.debt / 15000) * 40, 0, 100),
    Sovereignty: s.sov,
  };
  const avg = Object.values(comp).reduce((a, b) => a + b, 0) / 6;
  const grade = avg >= 75 ? 'A' : avg >= 62 ? 'B' : avg >= 50 ? 'C' : avg >= 38 ? 'D' : 'F';
  return { comp, avg, grade };
}

// ---------- events ----------
const EVENTS = [
  { id:'wheat', title:'World wheat prices jump 45%', src:'Ministry of Economy', text:'A shipping crisis in the Black Sea has sent wheat futures soaring. The strategic flour stock covers seven weeks.', opts:[
    { label:'Pay world prices', text:'Keep the loaf the same size and absorb the cost from reserves.', eff:{ usd:-110, trust:2 } },
    { label:'Mix in maize and shrink the loaf', text:'Cheaper, and everyone will notice.', eff:{ usd:-35, trust:-8, unrest:7, corr:2 } },
    { label:'Barter wheat for port access', text:'A foreign partner ships grain now in exchange for terminal rights at Tartus.', eff:{ pc:-10, sov:-8, debt:220, trust:-1 }, req:s=>s.sov>=25, reqLabel:'Sovereignty 25+' },
  ]},
  { id:'teachers', title:'Teachers walk out', src:'Ministry of Education', when:s=>realWage(s) < 32, text:'Teachers in four provinces have stopped work. They say a month\u2019s salary no longer covers two weeks of food.', opts:[
    { label:'Grant a 10% raise now', text:'Every public employee gets it, not just teachers.', eff:{ wage:10, trust:3 } },
    { label:'Pay a one-off bonus', text:'Buys a term of peace.', eff:{ syp:-4, trust:1 } },
    { label:'Dock pay for strike days', text:'Shows who is in charge.', eff:{ trust:-6, unrest:5, pc:3 } },
  ]},
  { id:'drought', title:'The rains failed', src:'Ministry of Agriculture', when:s=>seasonNow(s)==='H1', text:'Rainfall in the northeast is 40% below average. The harvest will be the worst in a decade.', opts:[
    { label:'Import extra wheat', text:'Expensive but quiet.', eff:{ usd:-70 } },
    { label:'Drain the Euphrates reservoirs', text:'Saves the crop, costs electricity for months.', eff:{ mw:-200, usd:-20 } },
    { label:'Let the bread queues form', text:'Save the dollars and take the anger.', eff:{ trust:-7, unrest:8 } },
  ]},
  { id:'winterfuel', title:'Heating oil runs short', src:'Ministry of Petroleum', when:s=>seasonNow(s)==='H2', text:'A cold snap has doubled heating oil demand. Stations in Aleppo and Homs are rationing by the litre.', opts:[
    { label:'Buy spot cargoes at a premium', text:'Tankers can arrive in ten days.', eff:{ usd:-60, trust:1 } },
    { label:'Ration heating fuel', text:'Cold homes, full reserves.', eff:{ trust:-5, unrest:5 } },
    { label:'Take a shipment with strings attached', text:'A regional power offers fuel now. It will want something later.', eff:{ sov:-6, pc:-5 } },
  ]},
  { id:'coast', title:'Violence flares on the coast', src:'Interior Ministry', when:s=>s.provs.latakia.u > 40, text:'Revenge killings in villages outside Latakia have spread panic. Families are fleeing into the mountains.', opts:[
    { label:'Send in federal security units', text:'Restores order fast, but they are not trusted there.', eff:{ pc:-8, prov:{ latakia:-12, tartus:-10 }, trust:-3 } },
    { label:'Open an independent inquiry with local elders', text:'Slower and more expensive. Also more likely to stick.', eff:{ pc:-15, syp:-2, prov:{ latakia:-10, tartus:-8 }, trust:4, corr:-2 } },
    { label:'Leave it to local authorities', text:'They asked for autonomy. Let them use it.', eff:{ prov:{ latakia:14, tartus:10 } } },
  ]},
  { id:'suwayda', title:'Standoff in Suwayda', src:'Office of the Governor', when:s=>s.provs.suwayda.u > 45, text:'Local militias have blocked the highway to the capital and are demanding control over their own security.', opts:[
    { label:'Negotiate a local security deal', text:'Local forces, state flag.', eff:{ pc:-14, prov:{ suwayda:-15 }, sov:-3 } },
    { label:'Cut fuel deliveries until they back down', text:'Pressure works, until it doesn\u2019t.', eff:{ prov:{ suwayda:16 }, trust:-3, pc:4 } },
    { label:'Invite a foreign mediator', text:'Takes the heat off you and gives an outsider a say.', eff:{ sov:-6, prov:{ suwayda:-9 } } },
  ]},
  { id:'smuggling', title:'A smuggling ring is exposed', src:'Customs Directorate', text:'Investigators traced a fuel and cigarette ring through three border crossings, a port official and a deputy minister.', opts:[
    { label:'Prosecute everyone involved', text:'Including the deputy minister.', eff:{ pc:-10, corr:-6, syp:2, trust:3 } },
    { label:'Take a cut for the treasury', text:'The ring keeps running. The state gets paid.', eff:{ corr:7, syp:4, trust:-2 } },
  ]},
  { id:'quake', title:'Earthquake in the north', src:'Civil Defense', once:true, text:'A magnitude 6.1 quake has collapsed buildings in Aleppo and Idlib. Hundreds are trapped under rubble.', opts:[
    { label:'Full emergency response', text:'Army, civil defense and every hospital bed.', eff:{ usd:-30, syp:-4, trust:5, prov:{ aleppo:-3, idlib:-3 } } },
    { label:'Launch an international appeal', text:'Donors respond, on their terms.', eff:{ usd:40, sov:-3, trust:1, prov:{ aleppo:5, idlib:5 } } },
  ]},
  { id:'strikes', title:'Cross-border strikes in the south', src:'Ministry of Defense', text:'Airstrikes hit positions near Quneitra overnight. Residents are demanding the state respond.', opts:[
    { label:'Protest at the UN and hold the line', text:'Firm words, no escalation.', eff:{ pc:-5, sov:3, trust:2, prov:{ quneitra:4, daraa:3 } } },
    { label:'Seek quiet de-escalation through a mediator', text:'Calmer south, weaker look at home.', eff:{ sov:-4, trust:-1, prov:{ quneitra:-6, daraa:-4 } } },
  ]},
  { id:'diaspora', title:'Diaspora investors want a conference', src:'Investment Authority', when:s=>s.trust>=40, text:'Syrian business owners in the Gulf, Germany and Turkey offer to come home, if they see a serious plan.', opts:[
    { label:'Host it in Damascus', text:'Costs money and attention. Could pay off for years.', eff:{ syp:-3, pc:-5, cap:4, usd:50, comp:2 } },
    { label:'Not this year', text:'There are bigger fires.', eff:{ trust:-1 } },
  ]},
  { id:'run', title:'Rumors of devaluation', src:'Central Bank', text:'Voice notes claiming the lira will be devalued are spreading on WhatsApp. Exchange shops are raising prices by the hour.', opts:[
    { label:'Defend the lira with reserves', text:'Sell dollars until the panic stops.', eff:{ usd:-60, fx:-3 } },
    { label:'Let it float', text:'Keep the dollars and let the market overshoot.', eff:{ fx:14, trust:-3 } },
    { label:'Raise deposit rates sharply', text:'Stops the run and chokes off lending.', eff:{ cap:-3, fx:4 } },
  ]},
  { id:'returns', title:'Refugees are coming home', src:'Ministry of Local Administration', when:s=>s.trust>=35, text:'Tens of thousands are crossing back from Lebanon and Turkey this season, many to homes that no longer exist.', opts:[
    { label:'Open reception centers', text:'Temporary housing, registration and school places.', eff:{ syp:-5, trust:3, prov:{ aleppo:-3, homs:-3, rif:-3, idlib:-3 }, cap:2 } },
    { label:'Slow the returns down', text:'Buys time, angers everyone including the host countries.', eff:{ sov:-2, prov:{ aleppo:4, homs:4, rif:4, idlib:4 } } },
  ]},
  { id:'plant', title:'A power station trips offline', src:'Ministry of Electricity', text:'A turbine failure at a major thermal plant has taken 300 MW off the grid.', opts:[
    { label:'Pay for emergency repairs', text:'Spare parts flown in.', eff:{ usd:-25 } },
    { label:'Run it down', text:'Longer blackouts until the next budget.', eff:{ mw:-300, trust:-2 } },
  ]},
  { id:'cell', title:'Attack in the desert', src:'Military Intelligence', when:s=>s.provs.deir.u > 35, text:'An insurgent cell ambushed a supply convoy on the Palmyra road. Tribes say the state cannot protect them.', opts:[
    { label:'Launch a sweep', text:'Costly, visible and effective for a while.', eff:{ pc:-8, syp:-4, prov:{ deir:-8, homs:-4 } } },
    { label:'Pay tribal levies to hold the road', text:'Cheaper, and another armed group on the payroll.', eff:{ syp:-2, corr:4, sov:-2, prov:{ deir:-4 } } },
  ]},
  { id:'phosphate', title:'A foreign firm wants the phosphate mines', src:'Ministry of Petroleum and Mineral Resources', once:true, text:'A state-owned mining company offers $160M upfront for a 30-year concession on the eastern Homs deposits.', opts:[
    { label:'Sign the 30-year concession', text:'Cash now, a smaller share forever.', eff:{ usd:160, sov:-9, flag:'phosConcession' } },
    { label:'Reject it', text:'The mines stay ours, slow as they are.', eff:{ sov:2 } },
    { label:'Push for a ten-year deal', text:'Less money, less surrendered.', eff:{ pc:-10, usd:60, sov:-2 } },
  ]},
  { id:'banks', title:'International banks reconnect', src:'Central Bank', once:true, when:s=>s.t>=30, text:'Correspondent banks are ready to reopen Syrian accounts, if compliance rules are met.', opts:[
    { label:'Fast-track compliance reforms', text:'Remittances start moving through banks.', eff:{ pc:-10, corr:-3, cap:3, flag:'remitBoost' } },
    { label:'Move slowly', text:'Powerful people prefer the old channels.', eff:{ corr:2 } },
  ]},
  { id:'cholera', title:'Cholera in the east', src:'Ministry of Health', text:'Cases are rising along the Euphrates where water plants are broken.', opts:[
    { label:'Chlorinate and vaccinate', text:'Fast and well-proven.', eff:{ usd:-15, syp:-2, trust:2 } },
    { label:'Rely on aid agencies', text:'They will come. Eventually.', eff:{ sov:-2, trust:-3, prov:{ deir:5, raqqa:5 } } },
  ]},
  { id:'scandal', title:'A minister\u2019s villa goes viral', src:'Presidential Media Office', when:s=>s.corr>50, text:'Photos of a minister\u2019s new seaside villa are everywhere. His salary is $180 a month.', opts:[
    { label:'Fire him publicly', text:'His allies will not forget it.', eff:{ pc:-12, trust:6, corr:-4 } },
    { label:'Suppress the story', text:'Take the posts down and move on.', eff:{ trust:-5, corr:5, pc:4 } },
  ]},
  { id:'harvest', title:'A bumper harvest', src:'Ministry of Agriculture', when:s=>seasonNow(s)==='H1' && s.provs.hasakeh.u < 55, text:'Good rains and cheap fertilizer. Farmers in the northeast have more wheat than they can store.', opts:[
    { label:'Buy the crop at a support price', text:'Lira out, dollars saved on imports.', eff:{ syp:-6, usd:70, trust:2 } },
    { label:'Let traders set the price', text:'Some of it will be smuggled across the border.', eff:{ corr:2, usd:20 } },
  ]},
  { id:'pensions', title:'Pensioners block the ministry', src:'Ministry of Finance', when:s=>s.treasury<0, text:'Pension payments are two months late. Hundreds of retirees are sitting in the road outside the Finance Ministry.', opts:[
    { label:'Pay by printing money', text:'They get paid. The lira pays the price.', eff:{ fx:5, trust:3 } },
    { label:'Issue IOUs', text:'Paper promises for paper money.', eff:{ trust:-5, unrest:3 } },
    { label:'Cut ministry budgets to pay them', text:'Projects stall across government.', eff:{ pc:-8, cap:-2, syp:5 } },
  ]},
  { id:'gulfinv', title:'A Gulf investment package', src:'Office of the President', once:true, when:s=>s.trust>=50 && s.corr<55, text:'A sovereign fund offers $120M for stakes in the airport, a cement plant and two hotels.', opts:[
    { label:'Accept the package', text:'Fast money, foreign owners.', eff:{ usd:120, sov:-4, cap:3 } },
    { label:'Demand local hiring and suppliers', text:'Smaller deal, deeper roots.', eff:{ pc:-8, usd:80, cap:4, trust:1 } },
  ]},
];

function drawEvent(s){
  if (s.t < 2 || rnd(s) > (s.diff === 'learner' ? 0.1 : 0.13) * (1 + (s.bar || 0) * 0.9)) return null;
  const pool = EVENTS.filter(e => (!e.when || e.when(s)) && !s.recentEvents.includes(e.id) && !(e.once && (s.flags['ev_' + e.id])));
  if (!pool.length) return null;
  const e = pool[Math.floor(rnd(s) * pool.length)];
  s.recentEvents.push(e.id); if (s.recentEvents.length > 8) s.recentEvents.shift();
  if (e.once) s.flags['ev_' + e.id] = true;
  return e.id;
}

function optionAllowed(s, o){
  const e = o.eff;
  if (e.usd < 0 && s.reserves < -e.usd) return { ok:false, why:`Needs $${-e.usd}M in reserves` };
  if (e.pc < 0 && s.pc < -e.pc) return { ok:false, why:`Needs ${-e.pc} political capital` };
  if (o.req && !o.req(s)) return { ok:false, why:o.reqLabel };
  return { ok:true };
}

function applyEffects(s, e){
  if (e.syp) s.treasury += e.syp;
  if (e.usd) s.reserves += e.usd;
  if (e.pc) s.pc = clamp(s.pc + e.pc, 0, 200);
  if (e.trust) s.trust = clamp(s.trust + e.trust, 0, 100);
  if (e.corr) s.corr = clamp(s.corr + e.corr, 5, 100);
  if (e.sov) s.sov = clamp(s.sov + e.sov, 0, 100);
  if (e.cap) s.cap = clamp(s.cap + e.cap, 5, 100);
  if (e.comp) s.comp = clamp(s.comp + e.comp, 5, 95);
  if (e.mw) s.mw = Math.max(500, s.mw + e.mw);
  if (e.debt) s.debt += e.debt;
  if (e.fx) s.parallel *= 1 + e.fx / 100;
  if (e.wage) s.wage *= 1 + e.wage / 100;
  if (e.flag) s.flags[e.flag] = true;
  if (e.unrest) PROVS.forEach(p => s.provs[p.id].u = clamp(s.provs[p.id].u + e.unrest, 0, 100));
  if (e.prov) Object.entries(e.prov).forEach(([k, v]) => s.provs[k].u = clamp(s.provs[k].u + v, 0, 100));
}

if (typeof module !== 'undefined' && module.exports) module.exports = { startGame, MISSIONS, newGame, step, checkFail, legacy, natUnrest, joblessNat, realWage, nationalHours, IND, INVEST, indJobsAt, tourismIncome, drawEvent, EVENTS, applyEffects, optionAllowed, PROVS, tierOf, ACT, oilNumbers, exportCapacity, MONTH, yearNow, monthOf };
