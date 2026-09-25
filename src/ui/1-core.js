// ===== Transition: UI v3 (part A) =====
const KEY = 'transition-syria-v6';
let S, D, LANG = 'en';
const UI = { tab:'policy', right:'province', sel:'damascus', layer:'unrest', active:'campaign', queue:[] };
let STORE = { active:'campaign', campaign:null, mission:null };

// ---------- i18n ----------
const $ = sel => document.querySelector(sel);
const esc = x => String(x).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
function fill(str, args){ return String(str).replace(/\{(\d)\}/g, (m, i) => args[i] !== undefined ? args[i] : m); }
function t(key, ...args){ const v = STR[LANG][key] ?? STR.en[key] ?? key; return args.length ? fill(v, args) : v; }
const PN = id => PROV_NAME[LANG][id];
const L2 = obj => obj[LANG] || obj.en;
const AR = () => LANG === 'ar';
const MINUS = '\u2212';
const sign = (v, dp=0) => (v > 0 ? '+' : v < 0 ? MINUS : '\u00b1') + Math.abs(v).toFixed(dp);
function bn(v){ const s = (v < 0 ? MINUS : '') + Math.abs(v).toFixed(1); return AR() ? s + ' مليار' : s + 'bn'; }
function usdM(v){ const a = Math.abs(v), neg = v < 0 ? MINUS : '';
  if (AR()) return a >= 1000 ? `${neg}${(a/1000).toFixed(2)} مليار$` : `${neg}${a.toFixed(0)} مليون$`;
  return a >= 1000 ? `${neg}$${(a/1000).toFixed(2)}B` : `${neg}$${a.toFixed(0)}M`; }
const usd = v => AR() ? `${v.toFixed(0)}$` : `$${v.toFixed(0)}`;
const fog = (v, stepv, dp=0) => v.toFixed(dp);   // the dashboard tells you the truth; guessing was not teaching anyone anything
const TIER_COL = { calm:'var(--calm)', tense:'var(--tense)', riot:'var(--riot)', revolt:'var(--revolt)' };
const tierName = tr => t({ calm:'tierCalm', tense:'tierTense', riot:'tierRiot', revolt:'tierRevolt' }[tr]);
const arrowFwd = () => AR() ? '←' : '→';

function setLang(l){
  LANG = l; document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  document.title = t('title') + ': ' + t('subtitle');
  try { localStorage.setItem(KEY + '-lang', l); } catch(e){}
}

// ---------- saves ----------
function snap(s){
  const w = s.last && s.last.why;
  return { t:s.turn - 1, cash:s.treasury, usd:s.reserves, fx:s.parallel, pay:realWage(s), trust:s.trust, anger:natUnrest(s), power:nationalHours(s),
    print:s.policy.print, capex:s.policy.capex, corr:s.corr, cap:s.cap, mw:s.mw, debt:s.debt, privB:(s.last && s.last.privB) || 0, contagion:(s.last && s.last.maxContagion) || 0 };
}
function persist(){ STORE[UI.active] = { S, D }; STORE.active = UI.active; try { localStorage.setItem(KEY, JSON.stringify(STORE)); } catch(e){} }
function restore(){
  try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!o) return false; STORE = o; UI.active = o.active || 'campaign';
    const slot = STORE[UI.active]; if (!slot || !slot.S || slot.S.v !== 3) return false; S = slot.S; D = slot.D || emptyDraft(S); return true; } catch(e){ return false; }
}
function begin(diff, mission){
  UI.active = mission ? 'mission' : 'campaign';
  S = startGame(undefined, diff, mission); D = emptyDraft(S); S.history = [snap(S)]; S.cycles = []; S.log = [];
  UI.drawer = null; UI.provOpen = false; persist();
}
function saveCode(){ return btoa(unescape(encodeURIComponent(JSON.stringify({ v:3, S, D, active:UI.active })))); }
function loadCode(code){
  try { const o = JSON.parse(decodeURIComponent(escape(atob(code.trim())))); if (!o.S || o.S.v !== 3) return false;
    UI.active = o.active || 'campaign'; S = o.S; D = o.D || emptyDraft(S); persist(); return true; } catch(e){ return false; }
}

// ---------- projection helpers ----------
function projection(){ return step(S, D); }
function pcLeft(){ const c = draftCosts(S, D); return S.pc + draftPcGain(D) - c.pc; }
function usdLeft(){ return S.reserves - draftCosts(S, D).usd; }

function effChips(e){
  const C = CHIP[LANG], out = [];
  const push = (txt, good) => out.push(`<span class="chip ${good === true ? 'up' : good === false ? 'down' : ''}">${esc(txt)}</span>`);
  if (e.usd) push(fill(C.usd, [e.usd > 0 ? '+' : MINUS, Math.abs(e.usd)]), e.usd > 0);
  if (e.syp) push(fill(C.syp, [e.syp > 0 ? '+' : MINUS, Math.abs(e.syp)]), e.syp > 0);
  if (e.pc) push(fill(C.pc, [sign(e.pc)]), e.pc > 0);
  if (e.trust) push(fill(C.trust, [sign(e.trust)]), e.trust > 0);
  if (e.unrest) push(fill(C.unrest, [sign(e.unrest)]), e.unrest < 0);
  if (e.prov) Object.entries(e.prov).forEach(([k, v]) => push(fill(C.prov, [PN(k), sign(v)]), v < 0));
  if (e.corr) push(fill(C.corr, [sign(e.corr)]), e.corr < 0);
  if (e.sov) push(fill(C.sov, [sign(e.sov)]), e.sov > 0);
  if (e.cap) push(fill(C.cap, [sign(e.cap)]), e.cap > 0);
  if (e.comp) push(fill(C.comp, [sign(e.comp)]), e.comp > 0);
  if (e.mw) push(fill(C.mw, [sign(e.mw)]), e.mw > 0);
  if (e.debt) push(fill(C.debt, [e.debt]), false);
  if (e.fx) push(e.fx > 0 ? fill(C.fxUp, [e.fx]) : fill(C.fxDown, [e.fx]), e.fx < 0);
  if (e.wage) push(fill(C.wage, [e.wage]), null);
  if (e.flag === 'phosConcession') push(C.phos, false);
  if (e.flag === 'remitBoost') push(C.remit, true);
  if (!out.length) out.push(`<span class="chip">${t('nothingChanges')}</span>`);
  return out.join('');
}

// ---------- dashboard ----------
function health(key, v){
  const r = { cash:[0, 15], usd:[250, 500], fx:[250, 160], pay:[15, 22], pc:[10, 30], trust:[25, 45], anger:[65, 50], power:[4, 8], jobs:[52, 38], sov:[30, 45] }[key];
  if (key === 'fx' || key === 'anger' || key === 'jobs') return v > r[0] ? 'bad' : v > r[1] ? 'warn' : 'ok';
  return v < r[0] ? 'bad' : v < r[1] ? 'warn' : 'ok';
}
function metric(key, val, now, next, goodUp, dtxt, sub){
  const g = GLOSS[key], G = L2(g), dl = next - now;
  const dcls = Math.abs(dl) < 1e-6 ? 'muted' : (dl > 0) === goodUp ? 'good' : 'bad';
  const arrow = Math.abs(dl) < 1e-6 ? '\u2192' : dl > 0 ? '\u2191' : '\u2193';
  return `<button class="metric h-${health(key, now)}" data-act="gloss" data-k="${key}">
    <div class="k"><span class="ico" aria-hidden="true">${ic(g.icon)}</span><span class="lf">${G.name}</span><span class="ls">${G.short}</span></div>
    <div class="v">${val}</div><div class="d ${sub ? 'muted' : dcls}">${sub ? esc(sub) : `${arrow} ${dtxt} ${t('nextSeason')}`}</div></button>`;
}
function renderRibbon(P){
  const tn = Math.min(S.turn, MAX_TURNS), rw = realWage(S), nu = natUnrest(S);
  const st = S.flags.stats;
  const mission = S.mission ? `<div class="mbar">${MISSION_TXT[S.mission.id].icon} <b>${esc(L2(MISSION_TXT[S.mission.id])[0])}</b> · ${fill(t('seasonsLeft'), [Math.max(0, S.mission.end - S.turn)])}</div>` : '';
  return `<div class="ribbon" role="region">
    <div class="date"><div class="yr">${yearOf(tn)}</div><div class="season">${seasonOf(S.turn) === 'H1' ? ' ' + t('harvest') : ' ' + t('winter')} · ${tn}/${S.mission ? S.mission.end - 1 : MAX_TURNS}</div>
      <div class="progress"><i style="width:${S.mission ? (S.turn - S.mission.start) / (S.mission.end - S.mission.start) * 100 : (tn - 1) / MAX_TURNS * 100}%"></i></div>
      <button class="langbtn" data-act="lang"> ${t('language')}</button></div>
    ${metric('cash', bn(S.treasury), S.treasury, P.treasury, true, sign(P.treasury - S.treasury, 1))}
    ${metric('usd', usdM(S.reserves), S.reserves, P.reserves, true, (P.reserves >= S.reserves ? '+' : MINUS) + usdM(Math.abs(P.reserves - S.reserves)))}
    ${metric('fx', st ? S.parallel.toFixed(0) : fog(S.parallel, 5), S.parallel, P.parallel, false, sign((P.parallel / S.parallel - 1) * 100, 0) + '%')}
    ${metric('pay', usd(rw), rw, realWage(P), true, sign(realWage(P) - rw, 1))}
    ${metric('pc', `${Math.round(S.pc)}`, S.pc, P.pc, true, '', fill(t('leftToSpend'), [Math.round(pcLeft())]))}
    ${metric('trust', st ? Math.round(S.trust) : fog(S.trust, 5), S.trust, P.trust, true, sign(P.trust - S.trust, 1))}
    ${metric('anger', st ? Math.round(nu) : fog(nu, 5), nu, natUnrest(P), false, sign(natUnrest(P) - nu, 1))}
    ${metric('power', nationalHours(S).toFixed(1) + (AR() ? ' س' : 'h'), nationalHours(S), nationalHours(P), true, sign(nationalHours(P) - nationalHours(S), 1))}
  </div>${mission}`;
}

// ---------- advisors (two voices that can disagree) ----------
function advisors(P){
  const A = ADV[LANG];
  const netUsd = P.reserves - S.reserves, runway = netUsd < 0 ? Math.max(1, Math.floor(S.reserves / -netUsd)) : 99;
  const econ = [], sec = [];
  if (runway <= 3) econ.push({ lvl:'bad', text:fill(A.usd, [runway]), act:A.usdAct, go:'money' });
  if (P.treasury < -20 || (S.treasury < 0 && P.treasury < S.treasury)) econ.push({ lvl:'bad', text:A.cash, act:A.cashAct, go:'policy' });
  if (D.policy.print >= 15) econ.push({ lvl:'warn', text:A.print, act:A.printAct, go:'policy' });
  const rw = realWage(S), ex = S.expWage || 25;
  if (rw < ex - 6) econ.push({ lvl:'warn', text:fill(A.pay, [rw.toFixed(0), ex.toFixed(0)]), act:A.payAct, go:'money' });
  if (nationalHours(S) < 6 && D.policy.capex === 0) econ.push({ lvl:'warn', text:A.grid, act:A.gridAct, go:'policy' });
  if (!econ.length) econ.push({ lvl:'ok', text:A.calmEcon, act:A.calmEconAct });
  const worst = PROVS.map(p => ({ id:p.id, u:S.provs[p.id].u })).sort((a, b) => b.u - a.u)[0];
  if (worst.u >= 65) sec.push({ lvl:'bad', text:fill(A.prov, [PN(worst.id), Math.round(worst.u)]), act:A.provAct, sel:worst.id });
  if (natUnrest(S) >= 55 && D.policy.security !== 'heavy') sec.push({ lvl:'warn', text:A.heavy, act:A.heavyAct, go:'policy' });
  const pcl = pcLeft();
  if (pcl >= 30 && !D.decrees.length && !D.facilities.length) sec.push({ lvl:'ok', text:fill(A.spend, [Math.round(pcl)]), act:A.spendAct, go:'decrees' });
  if (!sec.length) sec.push({ lvl:'ok', text:A.calmSec, act:A.calmSecAct });
  return { econ:econ[0], sec:sec[0] };
}
function renderAdvisors(P){
  const a = advisors(P);
  const card = (who, icon, x) => `<div class="advisor lvl-${x.lvl}"><div class="av" aria-hidden="true">${ic(icon)}</div><div class="atext"><div class="who">${who}</div>${esc(x.text)} <span class="muted">${esc(x.act)}</span></div>
    ${x.go || x.sel ? `<button class="btn small" data-act="advgo" data-go="${x.go || ''}" data-sel="${x.sel || ''}">${t('showMe')}</button>` : ''}</div>`;
  return `<div class="advisors">${card(t('economist'), '', a.econ)}${card(t('securityChief'), '', a.sec)}</div>`;
}

// ---------- left panels ----------
function renderPolicy(){
  return `<p class="intro">${t('policyIntro')}</p>` + Object.keys(POL).map(k => {
    const p = L2(POL[k]), cur = D.policy[k];
    return `<div class="group"><h3><span aria-hidden="true">${POL[k].icon}</span> ${p.name}</h3><p>${p.q}</p>
      <div class="seg" role="group">${POL_VALUES[k].map(v => `<button data-act="pol" data-k="${k}" data-v="${v}" aria-pressed="${String(cur) === String(v)}">${p.opts[String(v)]}</button>`).join('')}</div>
      <div class="hint">${esc(p.hint[String(cur)])}</div></div>`;
  }).join('');
}
function renderDecrees(){
  const pcl = pcLeft(), usl = usdLeft();
  return `<p class="intro">${fill(t('decreesIntro'), [Math.round(pcl)])}</p>` + DECREES.map(x => {
    const tx = L2(DEC_TXT[x.id]), done = S.decrees[x.id] !== undefined, on = D.decrees.includes(x.id);
    let why = '';
    if (!done && !on){ if (x.pc > pcl) why = fill(t('needsInfluence'), [x.pc]); else if (x.usd > usl) why = fill(t('needsUsd'), [x.usd]); else if (x.req && !x.req(S)) why = AR() ? 'يحتاج ثقة 40 أو أكثر' : 'Needs trust of 40+'; }
    return `<div class="card${on ? ' on' : ''}${done ? ' done' : ''}"><h4>${esc(tx[0])}</h4><p class="kid">${esc(tx[1])}</p><div class="fx">${esc(tx[2])}</div>
      <div class="row spread"><div class="row"><span class="chip cost"> ${x.pc}</span>${x.syp ? `<span class="chip cost"> ${bn(x.syp)}</span>` : ''}${x.usd ? `<span class="chip cost"> ${usdM(x.usd)}</span>` : ''}</div>
      ${done ? `<span class="chip up">${t('done')}</span>` : `<button class="btn${on ? ' on' : ''}" data-act="decree" data-id="${x.id}" ${why ? 'disabled' : ''}>${on ? t('chosen') : t('choose')}</button>`}</div>
      ${why ? `<div class="why">${esc(why)}</div>` : ''}</div>`;
  }).join('');
}
function renderMoney(){
  const pcl = pcLeft(), rw = realWage(S);
  let h = `<p class="intro">${t('moneyIntro')}</p>`;
  h += `<div class="group"><h3> ${t('raiseTitle')}</h3><p>${fill(t('raiseText'), [rw.toFixed(0), (S.expWage || 25).toFixed(0)])}</p>
    <div class="seg">${[0,10,25].map(v => `<button data-act="wage" data-v="${v}" aria-pressed="${D.wageRaise === v}">${v ? '+' + v + '%' : t('noRaise')}</button>`).join('')}</div></div>`;
  h += `<div class="group"><h3> ${t('buyTitle')}</h3><p>${t('buyText')}</p>
    <div class="card${D.grantPop ? ' on' : ''}"><h4>${t('giftTitle')}</h4><div class="row spread"><div class="row"><span class="chip cost"> ${bn(7)}</span><span class="chip up"> +8</span></div><button class="btn${D.grantPop ? ' on' : ''}" data-act="grantPop">${D.grantPop ? t('chosen') : t('choose')}</button></div></div>
    <div class="card${D.relief ? ' on' : ''}"><h4>${t('reliefTitle')}</h4><div class="row spread"><div class="row"><span class="chip cost"> ${usdM(40)}</span><span class="chip up"> +6</span><span class="chip up">${fill(CHIP[LANG].trust, ['+2'])}</span></div><button class="btn${D.relief ? ' on' : ''}" data-act="relief" ${!D.relief && usdLeft() < 40 ? 'disabled' : ''}>${D.relief ? t('chosen') : t('choose')}</button></div></div></div>`;
  h += `<div class="group"><h3> ${t('abroadTitle')}</h3><p>${t('abroadText')}${S.grant > 0 ? ' ' + fill(t('grantOnHand'), [usdM(S.grant)]) : ''}</p>` + FACILITIES.map(f => {
    const tx = L2(FAC_TXT[f.id]), st = S.facilities[f.id], on = D.facilities.includes(f.id);
    let why = ''; if (!st && !on){ if (f.pc > pcl) why = fill(t('needsInfluence'), [f.pc]); else if (f.signReq && !f.signReq(S)) why = f.id === 'gulf' ? (AR() ? 'يحتاج فساداً أقل من 50' : 'Needs corruption below 50') : (AR() ? 'يحتاج ثقة 40 أو أكثر' : 'Needs trust of 40+'); }
    const total = f.tranches.reduce((a, x) => a + x[1], 0);
    let status = ''; if (st) status = st.frozen ? `<span class="chip down">${t('frozen')}</span>` : st.paid >= f.tranches.length ? `<span class="chip up">${t('allPaid')}</span>` : `<span class="chip">${fill(t('paidOf'), [st.paid, f.tranches.length])}</span>`;
    return `<div class="card${on ? ' on' : ''}${st ? ' done' : ''}"><h4>${esc(tx[0])}: ${usdM(total)}</h4><p class="kid">${esc(tx[1])}</p>
      <div class="row spread"><div class="row">${f.pc ? `<span class="chip cost"> ${f.pc}</span>` : ''}<span class="chip down">${t('independence')} ${MINUS}${f.sov}</span>${f.debt ? `<span class="chip down">+${usdM(f.debt)} ${t('debt')}</span>` : ''}</div>
      ${st ? status : `<button class="btn${on ? ' on' : ''}" data-act="fac" data-id="${f.id}" ${why ? 'disabled' : ''}>${on ? t('chosen') : t('sign')}</button>`}</div>${why ? `<div class="why">${esc(why)}</div>` : ''}</div>`;
  }).join('') + '</div>';
  return h;
}
