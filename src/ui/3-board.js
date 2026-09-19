// ===== Transition: UI v4 (board-game layout; overrides v3 render functions) =====
Object.assign(STR.en, { dPolicy:'Policies', dDecrees:'Decrees', dMoney:'Money', dPeople:'People', dSupply:'Supply', dProgress:'Progress',
  subBudget:'Budget', subActions:'Salaries & loans', subCharts:'Charts', subCycles:'Cycles', subNews:'News', close:'Close',
  influenceLbl:'influence', planned:'{0} planned', locked:'Not discovered yet', cyclesHelp:'Cycles are chains that feed themselves. Play to discover all five.',
  policySub:'Rules that stay in place until you change them.', decreesSub:'Big one-time moves. Each costs ⭐ influence.', moneySub:'Where the money goes, and how to get more.',
  peopleSub:'Four Syrians and their monthly budgets. Your choices reach their tables.', supplySub:'If one link breaks, everything after it suffers.', progressSub:'What’s being built, how things are trending, and what you’ve learned.' });
Object.assign(STR.ar, { dPolicy:'السياسات', dDecrees:'المراسيم', dMoney:'المال', dPeople:'الناس', dSupply:'الإمداد', dProgress:'التقدّم',
  subBudget:'الميزانية', subActions:'الرواتب والقروض', subCharts:'الرسوم', subCycles:'الحلقات', subNews:'الأخبار', close:'إغلاق',
  influenceLbl:'نفوذ', planned:'{0} مخطّط', locked:'لم تُكتشف بعد', cyclesHelp:'الحلقات سلاسل تغذّي نفسها. العب لتكتشف الخمس كلها.',
  policySub:'قواعد تبقى سارية حتى تغيّرها.', decreesSub:'قرارات كبيرة لمرة واحدة، كل منها يكلّف ⭐ نفوذاً.', moneySub:'أين يذهب المال، وكيف تجلب المزيد.',
  peopleSub:'أربعة سوريين وميزانياتهم الشهرية. قراراتك تصل إلى موائدهم.', supplySub:'إذا انكسرت حلقة، يتضرّر كل ما بعدها.', progressSub:'ما يُبنى الآن، واتجاه الأمور، وما تعلّمته.' });
UI.drawer = null; UI.provOpen = false; UI.adv = null; UI.advOpen = true; UI.sub = { money:'actions', progress:'charts' };

const DRAWERS = [
  ['policy', '📜', 'dPolicy', 'policySub'], ['decrees', '⭐', 'dDecrees', 'decreesSub'], ['money', '💰', 'dMoney', 'moneySub'],
  ['people', '👥', 'dPeople', 'peopleSub'], ['chains', '🔗', 'dSupply', 'supplySub'], ['progress', '📈', 'dProgress', 'progressSub'],
];
const isPhone = () => window.innerWidth <= 760;

// ---------- HUD ----------
function res(key, val, now, next, goodUp, dtxt){
  const g = GLOSS[key], G = L2(g), dl = next - now;
  const cls = Math.abs(dl) < 1e-6 ? 'flat' : (dl > 0) === goodUp ? 'up' : 'down';
  const arrow = Math.abs(dl) < 1e-6 ? '•' : dl > 0 ? '▲' : '▼';
  const fl = (UI.flash && UI.flash[key]) ? ' fl-' + UI.flash[key] : '';
  return `<button class="res h-${health(key, now)}${fl}" data-act="gloss" data-k="${key}" aria-label="${esc(G.name)}: ${esc(val)}">
    <span class="bub" aria-hidden="true">${g.icon}</span><span><div class="num">${val}</div><div class="lab"><span class="lt">${esc(G.short)}</span><span class="dl ${cls}">${arrow} ${dtxt}</span></div></span></button>`;
}
function renderHUD(P){
  const tn = Math.min(S.turn, MAX_TURNS), rw = realWage(S), nu = natUnrest(S), st = S.flags.stats;
  const total = S.mission ? S.mission.end - S.mission.start : MAX_TURNS, done = S.mission ? S.turn - S.mission.start : tn - 1;
  const C = 2 * Math.PI * 22, frac = clamp(done / total, 0, 1);
  const ring = `<div class="ring" title="${done}/${total}"><svg viewBox="0 0 54 54" aria-hidden="true"><circle cx="27" cy="27" r="22" fill="var(--board-2)" stroke="var(--board-2)" stroke-width="6"/><circle cx="27" cy="27" r="22" fill="none" stroke="var(--gold)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(C * frac).toFixed(1)} ${C.toFixed(1)}"/></svg><span class="ic">${seasonOf(S.turn) === 'H1' ? '🌾' : '❄️'}</span></div>`;
  const pw = nationalHours(S);
  return `<header class="hud">
    <div class="turn">${ring}<div><div class="yr">${yearOf(tn)}</div><div class="ss">${seasonOf(S.turn) === 'H1' ? t('harvest') : t('winter')} · ${done + 1}/${total}</div></div></div>
    <div class="tray" role="group">
      ${res('cash', bn(S.treasury), S.treasury, P.treasury, true, sign(P.treasury - S.treasury, 1))}
      ${res('usd', usdM(S.reserves), S.reserves, P.reserves, true, (P.reserves >= S.reserves ? '+' : MINUS) + usdM(Math.abs(P.reserves - S.reserves)))}
      ${res('fx', st ? S.parallel.toFixed(0) : fog(S.parallel, 5), S.parallel, P.parallel, false, sign((P.parallel / S.parallel - 1) * 100, 0) + '%')}
      ${res('pay', st ? usd(rw) : '~' + usd(rw), rw, realWage(P), true, sign(realWage(P) - rw, 1))}
    </div>
    <div class="tray" role="group">
      ${res('trust', st ? Math.round(S.trust) : fog(S.trust, 5), S.trust, P.trust, true, sign(P.trust - S.trust, 1))}
      ${res('anger', st ? Math.round(nu) : fog(nu, 5), nu, natUnrest(P), false, sign(natUnrest(P) - nu, 1))}
      ${res('power', pw.toFixed(1) + (AR() ? 'س' : 'h'), pw, nationalHours(P), true, sign(nationalHours(P) - pw, 1))}
    </div>
    <span class="spacer"></span>
    <button class="iconbtn lang" data-act="lang" aria-label="${t('language')}">🌐 <span class="lt2">${t('language')}</span></button>
    <button class="iconbtn" data-act="menu" aria-label="${t('menu')}">☰</button>
  </header>` + (S.mission ? `<div class="mission"><span>${MISSION_TXT[S.mission.id].icon} ${esc(L2(MISSION_TXT[S.mission.id])[0])}</span><span>${fill(t('seasonsLeft'), [Math.max(0, S.mission.end - S.turn)])}</span></div>` : '');
}

// ---------- advisors ----------
function renderAdvisors(P){
  const a = advisors(P), rank = { bad:2, warn:1, ok:0 };
  const cur = UI.adv || (rank[a.sec.lvl] > rank[a.econ.lvl] ? 'sec' : 'econ');
  const x = a[cur];
  const por = (k, icon, lvl, name) => `<button class="portrait" data-act="adv" data-v="${k}" aria-pressed="${UI.advOpen && cur === k}" aria-label="${esc(name)}">${icon}<span class="dot ${lvl}"></span></button>`;
  return `<div class="advisors"><div class="portraits">${por('econ', '🧑‍💼', a.econ.lvl, t('economist'))}${por('sec', '🎖️', a.sec.lvl, t('securityChief'))}</div>
    ${UI.advOpen ? `<div class="bubble"><div class="who">${cur === 'econ' ? t('economist') : t('securityChief')}</div>${esc(x.text)}<span class="act">${esc(x.act)}</span>
      ${x.go || x.sel ? `<div class="row"><button class="btn small primary" data-act="advgo" data-go="${x.go || ''}" data-sel="${x.sel || ''}">${t('showMe')}</button></div>` : ''}</div>` : ''}</div>`;
}

// ---------- map ----------
function renderMapSvg(){
  const order = PROVS.filter(p => p.id !== 'damascus').concat([PROV_BY.damascus]);
  const paths = order.map(p => `<path class="prov${UI.provOpen && UI.sel === p.id ? ' sel' : ''}" fill-rule="evenodd" d="${MAP.paths[p.id]}" fill="${layerOf(p.id).fill}" data-act="sel" data-id="${p.id}" tabindex="0" role="button" aria-label="${esc(PN(p.id))}"><title>${esc(PN(p.id))}</title></path>`).join('');
  const selPath = UI.provOpen ? `<path fill-rule="evenodd" d="${MAP.paths[UI.sel]}" fill="none" stroke="#2a2438" stroke-width="5" stroke-linejoin="round" pointer-events="none"/>` : '';
  const labels = PROVS.map(p => {
    const [cx, cy] = MAP.cent[p.id], L = layerOf(p.id), badge = provBadge(p.id);
    if (LEFT_LABELS[p.id]){ const [lx, ly] = LEFT_LABELS[p.id];
      return `<g pointer-events="none"><line x1="${lx + 4}" y1="${ly - 5}" x2="${cx}" y2="${cy}" stroke="var(--ink-soft)" stroke-width="1.2"/><circle cx="${cx}" cy="${cy}" r="3.5" fill="var(--ink)"/>
        <text x="${lx}" y="${ly}" text-anchor="end" class="lname side">${esc(PN(p.id))} ${L.val} ${badge}</text></g>`; }
    const big = ['homs','deir','hasakeh','raqqa','aleppo'].includes(p.id);
    if (p.id === 'rif'){ const w = PN('rif').split(' ');
      return `<g pointer-events="none"><text x="${cx + 45}" y="${cy - 18}" text-anchor="middle" class="lname">${esc(w[0])}</text><text x="${cx + 45}" y="${cy - 2}" text-anchor="middle" class="lname">${esc(w.slice(1).join(' '))}</text><text x="${cx + 45}" y="${cy + 16}" text-anchor="middle" class="lval">${L.val}${badge ? ' ' + badge : ''}</text></g>`; }
    return `<g pointer-events="none"><text x="${cx}" y="${cy - 4}" text-anchor="middle" class="lname${big ? ' big' : ''}">${esc(PN(p.id))}</text><text x="${cx}" y="${cy + (big ? 20 : 15)}" text-anchor="middle" class="lval${big ? ' big' : ''}">${L.val}${badge ? ' ' + badge : ''}</text></g>`;
  }).join('');
  const [dx, dy] = [65.4, 558.4], IX = 575, IY = 648, IR = 92, Z = 5;
  const insetPath = id => `<path class="prov" fill-rule="evenodd" d="${MAP.paths[id]}" fill="${layerOf(id).fill}" vector-effect="non-scaling-stroke" data-act="sel" data-id="${id}" style="stroke-width:1.5"><title>${esc(PN(id))}</title></path>`;
  const insetSel = UI.provOpen && (UI.sel === 'damascus' || UI.sel === 'rif') ? `<path fill-rule="evenodd" d="${MAP.paths[UI.sel]}" fill="none" stroke="#2a2438" stroke-width="4" vector-effect="non-scaling-stroke" pointer-events="none"/>` : '';
  const inset = `<defs><clipPath id="zc"><circle cx="${IX}" cy="${IY}" r="${IR}"/></clipPath></defs>
    <rect x="${dx - 14}" y="${dy - 12}" width="28" height="23" rx="5" fill="none" stroke="var(--gold)" stroke-width="2" stroke-dasharray="5 3" pointer-events="none"/>
    <path d="M${dx + 14},${dy + 6} C 250,${dy + 60} 400,${IY + 10} ${IX - IR},${IY}" fill="none" stroke="var(--gold)" stroke-width="1.6" stroke-dasharray="5 4" opacity=".8" pointer-events="none"/>
    <circle cx="${IX}" cy="${IY + 6}" r="${IR}" fill="rgba(8,12,28,.4)"/><circle cx="${IX}" cy="${IY}" r="${IR}" fill="var(--board-2)"/>
    <g clip-path="url(#zc)"><g transform="translate(${IX},${IY}) scale(${Z}) translate(${-dx},${-dy})">${['quneitra','daraa','rif','damascus'].map(insetPath).join('')}${insetSel}</g></g>
    <circle cx="${IX}" cy="${IY}" r="${IR}" fill="none" stroke="var(--card)" stroke-width="4" pointer-events="none"/>
    <text x="${IX}" y="${IY - IR - 12}" text-anchor="middle" class="ztitle" pointer-events="none">🔍 ${t('zoom')}</text>
    <g pointer-events="none"><text x="${IX}" y="${IY - 2}" text-anchor="middle" class="lname">${t('damascusCity')}</text><text x="${IX}" y="${IY + 17}" text-anchor="middle" class="lval">${layerOf('damascus').val}</text>
    <text x="${IX}" y="${IY + IR - 22}" text-anchor="middle" class="lname zsm">${esc(PN('rif'))} ${layerOf('rif').val}</text></g>`;
  const Cn = STR[LANG].countries;
  const neighbors = `<text x="420" y="-8" class="ctry">${Cn.TURKEY}</text><text x="760" y="470" class="ctry" text-anchor="middle">${Cn.IRAQ}</text><text x="330" y="755" class="ctry">${Cn.JORDAN}</text><text x="-60" y="455" class="ctry" text-anchor="middle">${Cn.LEBANON}</text><text x="-95" y="150" class="sea" text-anchor="middle">${Cn.sea1}</text><text x="-95" y="170" class="sea" text-anchor="middle">${Cn.sea2}</text>`;
  const star = `<g transform="translate(${MAP.cent.damascus[0]},${MAP.cent.damascus[1]})" pointer-events="none"><path d="M0,-8 L2.3,-2.3 L8,-2.3 L3.5,1.2 L5,7 L0,3.5 L-5,7 L-3.5,1.2 L-8,-2.3 L-2.3,-2.3Z" fill="var(--gold)" stroke="#fff9ee" stroke-width="1.2"/></g>`;
  return `<svg class="map" viewBox="-190 -30 1010 800" preserveAspectRatio="xMidYMid meet" direction="ltr">${neighbors}<g class="country">${paths}</g>${selPath}${labels}${inset}${star}</svg>`;
}
function renderLayers(){
  return `<div class="layers" role="group">${[['unrest','🔥','layerAnger'],['power','💡','layerPower'],['damage','🏚️','layerDamage'],['mines','💣','layerMines']].map(([k, i, l]) => `<button data-act="layer" data-v="${k}" aria-pressed="${UI.layer === k}">${i} ${t(l)}</button>`).join('')}</div>`;
}
function renderLegend(){
  const items = UI.layer === 'unrest' ? ['calm','tense','riot','revolt'].map(x => `<span><i style="background:${TIER_COL[x]}"></i>${tierName(x)}</span>`).join('')
    : UI.layer === 'power' ? `<span><i style="background:#3a3f55"></i>${t('legDark')}</span><span><i style="background:#f2c94c"></i>${t('legLight')}</span>`
    : UI.layer === 'damage' ? `<span><i style="background:#6f9d8f"></i>${t('legLittle')}</span><span><i style="background:#8e2f36"></i>${t('legHeavy')}</span>`
    : `<span><i style="background:#6f9d8f"></i>${t('legClear')}</span><span><i style="background:#c8612f"></i>${t('legMined')}</span>`;
  return `<div class="legend">${items}<span>✅ ${t('legBuilt')}</span><span>🏗️ ${t('legBuilding')}</span></div>`;
}

// ---------- province card ----------
function renderProvince(){
  const id = UI.sel, p = PROV_BY[id], pv = S.provs[id], x = PROJECTS[id], tx = L2(PROJ_TXT[id]);
  const tier = tierOf(pv.u), hrs = provHours(S, id), on = D.projects.includes(id), c = draftCosts(S, D);
  const usdAvail = S.reserves - c.usd + Math.max(0, S.grant - c.fromGrant);
  let why = ''; if (!pv.project && !on){ if (x.pc > pcLeft()) why = fill(t('needsInfluence'), [x.pc]); else if (x.usd > usdAvail) why = fill(t('needsUsdProj'), [x.usd]); }
  const meter = (icon, k, v, pct, col) => `<div class="meter"><div>${icon} ${k}</div><div class="mv">${v}</div><div class="bar"><i style="width:${clamp(pct, 0, 100)}%;background:${col}"></i></div></div>`;
  const A = AR(), good = [];
  if (x.unrest) good.push([`🔥 ${sign(x.unrest)}`, true]); if (x.power) good.push([`💡 +${x.power}${A ? 'س' : 'h'}`, true]); if (x.mines) good.push([A ? '💣 نزع ألغام' : '💣 clears mines', true]);
  if (x.rev) good.push([`💵 +${bn(x.rev)}`, true]); if (x.transit) good.push([`🏦 +${usdM(x.transit)}`, true]); if (x.phosphate) good.push([`🏦 +${usdM(x.phosphate)}`, true]); if (x.oil) good.push([`🛢️ +${usdM(x.oil)}`, true]);
  if (x.wheat) good.push([`🌾 ${MINUS}${usdM(x.wheat)}`, true]); if (x.mw) good.push([`⚡ +${x.mw} MW`, true]); if (x.cap) good.push([A ? '🏭 اقتصاد أكبر' : '🏭 bigger economy', true]); if (x.trust) good.push([`🤝 +${x.trust}`, true]);
  const mode = D.projMode[id] || 'tender';
  const durF = projDuration(id, 'fast'), durT = projDuration(id, 'tender');
  const leakF = Math.round(x.usd * projLeakRate(S, 'fast')), leakT = Math.round(x.usd * projLeakRate(S, 'tender'));
  const pending = (S.pipe || []).find(i => i.kind === 'proj' && i.id === id);
  let action;
  if (pv.project === true) action = `<span class="chip up">${t('builtTag')}</span>${pv.leak > 0.05 ? `<div class="why">${fill(t('leaked'), [Math.round(x.usd * pv.leak)])}</div>` : ''}`;
  else if (pv.project === 'building') action = `<span class="chip">🏗️ ${pending && pending.due - S.turn <= 0 ? t('buildingEnd') : fill(t('building'), [seasonsTxt(pending ? pending.due - S.turn : 1)])}</span>`;
  else action = `<div class="contract">
      <button class="opt mini${on && mode === 'fast' ? ' sel' : ''}" data-act="proj" data-id="${id}" data-mode="fast" ${why && !on ? 'disabled' : ''}><b>⚡ ${t('buildFast')}</b><span class="t">${fill(t('fastTxt'), [seasonsTxt(durF), leakF])}</span></button>
      <button class="opt mini${on && mode === 'tender' ? ' sel' : ''}" data-act="proj" data-id="${id}" data-mode="tender" ${why && !on ? 'disabled' : ''}><b>⚖️ ${t('buildTender')}</b><span class="t">${fill(t('tenderTxt'), [seasonsTxt(durT), leakT])}</span></button></div>`;
  const note = id === 'rif' ? t('rifNote') : id === 'damascus' ? t('damNote') : '';
  return `<aside class="pcard" aria-label="${esc(PN(id))}"><div class="head"><div><h2>${esc(PN(id))}</h2><span class="tierpill" style="background:${TIER_COL[tier]}">${tierName(tier)}</span></div>
      <button class="close" data-act="closeProv" aria-label="${t('close')}">✕</button></div>
    <div class="body"><p class="muted" style="margin:0 0 10px;font-size:13px">${note}${fill(t('people'), [p.pop.toFixed(1)])}</p>
      <div class="meters">${meter('🔥', t('anger'), (S.flags.stats ? Math.round(pv.u) : fog(pv.u, 5)), pv.u, TIER_COL[tier])}${meter('💡', t('electricity'), hrs.toFixed(1) + ' ' + t('hDay'), hrs / 24 * 100, '#e2b93b')}
        ${meter('🏚️', t('destroyed'), usdM(pv.dmg * 1000), pv.dmg / Math.max(1, pv.dmg0) * 100, '#b4513a')}${meter('💣', t('landmines'), Math.round(pv.mines) + '%', pv.mines, '#c8612f')}</div>
      <div class="quest${pv.project === true ? ' done' : ''}"><div class="qt">🏗️ ${t('bigProject')}</div><h4>${esc(tx[0])}</h4>
        <p><b>${t('problem')}</b> ${esc(tx[1])}</p><div class="reward">${good.map(([g]) => `<span class="chip up">${esc(g)}</span>`).join('')}</div>
        <div class="row" style="margin-bottom:8px"><span class="chip">🏦 ${usdM(x.usd)}</span><span class="chip">💵 ${bn(x.syp)}</span>${x.pc ? `<span class="chip">⭐ ${x.pc}</span>` : ''}</div>
        ${action}${why && !on && !pv.project ? `<div class="why">${esc(why)}</div>` : ''}</div></div></aside>`;
}

// ---------- drawer contents ----------
function renderPolicy(){
  return Object.keys(POL).map(k => { const p = L2(POL[k]), cur = D.policy[k];
    return `<div class="pol"><div class="ph"><span class="pic" aria-hidden="true">${POL[k].icon}</span><div><h3>${p.name}</h3><div class="q">${p.q}</div></div></div>
      <div class="seg" role="group">${POL_VALUES[k].map(v => `<button data-act="pol" data-k="${k}" data-v="${v}" aria-pressed="${String(cur) === String(v)}">${p.opts[String(v)]}</button>`).join('')}</div>
      <div class="hint">${esc(p.hint[String(cur)])}</div></div>`; }).join('');
}
function renderDecrees(){
  const pcl = pcLeft(), usl = usdLeft();
  return DECREES.map(x => {
    const tx = L2(DEC_TXT[x.id]), done = S.decrees[x.id] !== undefined, on = D.decrees.includes(x.id);
    let why = ''; if (!done && !on){ if (x.pc > pcl) why = fill(t('needsInfluence'), [x.pc]); else if (x.usd > usl) why = fill(t('needsUsd'), [x.usd]); else if (x.req && !x.req(S)) why = AR() ? 'يحتاج ثقة 40 أو أكثر' : 'Needs trust of 40+'; }
    return `<div class="dcard${on ? ' on' : ''}${done ? ' done' : ''}"><span class="gem">⭐ ${x.pc}</span><h4>${esc(tx[0])}</h4><p class="kid">${esc(tx[1])}</p><div class="fx">${esc(tx[2])}</div>
      <div class="row spread"><div class="row">${x.syp ? `<span class="chip">💵 ${bn(x.syp)}</span>` : ''}${x.usd ? `<span class="chip">🏦 ${usdM(x.usd)}</span>` : ''}</div>
      ${done ? `<span class="chip up">${t('done')}</span>` : `<button class="btn${on ? ' on' : ''}" data-act="decree" data-id="${x.id}" ${why ? 'disabled' : ''}>${on ? t('chosen') : t('choose')}</button>`}</div>
      ${why ? `<div class="why">${esc(why)}</div>` : ''}</div>`;
  }).join('');
}
function renderMoneyActions(){
  const pcl = pcLeft(), rw = realWage(S);
  let h = `<div class="group"><h3>👷 ${t('raiseTitle')}</h3><p>${fill(t('raiseText'), [rw.toFixed(0), (S.expWage || 25).toFixed(0)])}</p>
    <div class="seg">${[0,10,25].map(v => `<button data-act="wage" data-v="${v}" aria-pressed="${D.wageRaise === v}">${v ? '+' + v + '%' : t('noRaise')}</button>`).join('')}</div></div>`;
  h += `<div class="group"><h3>⭐ ${t('buyTitle')}</h3><p>${t('buyText')}</p>
    <div class="dcard${D.grantPop ? ' on' : ''}"><span class="gem">⭐ +8</span><h4>${t('giftTitle')}</h4><div class="row spread"><span class="chip">💵 ${bn(7)}</span><button class="btn${D.grantPop ? ' on' : ''}" data-act="grantPop">${D.grantPop ? t('chosen') : t('choose')}</button></div></div>
    <div class="dcard${D.relief ? ' on' : ''}"><span class="gem">⭐ +6</span><h4>${t('reliefTitle')}</h4><div class="row spread"><div class="row"><span class="chip">🏦 ${usdM(40)}</span><span class="chip up">${fill(CHIP[LANG].trust, ['+2'])}</span></div><button class="btn${D.relief ? ' on' : ''}" data-act="relief" ${!D.relief && usdLeft() < 40 ? 'disabled' : ''}>${D.relief ? t('chosen') : t('choose')}</button></div></div></div>`;
  h += `<div class="group"><h3>🌍 ${t('abroadTitle')}</h3><p>${t('abroadText')}${S.grant > 0 ? ' ' + fill(t('grantOnHand'), [usdM(S.grant)]) : ''}</p>` + FACILITIES.map(f => {
    const tx = L2(FAC_TXT[f.id]), st = S.facilities[f.id], on = D.facilities.includes(f.id);
    let why = ''; if (!st && !on){ if (f.pc > pcl) why = fill(t('needsInfluence'), [f.pc]); else if (f.signReq && !f.signReq(S)) why = f.id === 'gulf' ? (AR() ? 'يحتاج فساداً أقل من 50' : 'Needs corruption below 50') : (AR() ? 'يحتاج ثقة 40 أو أكثر' : 'Needs trust of 40+'); }
    const total = f.tranches.reduce((a, x) => a + x[1], 0);
    let status = ''; if (st) status = st.frozen ? `<span class="chip down">${t('frozen')}</span>` : st.paid >= f.tranches.length ? `<span class="chip up">${t('allPaid')}</span>` : `<span class="chip">${fill(t('paidOf'), [st.paid, f.tranches.length])}</span>`;
    return `<div class="dcard${on ? ' on' : ''}${st ? ' done' : ''}">${f.pc ? `<span class="gem">⭐ ${f.pc}</span>` : ''}<h4>${esc(tx[0])}</h4><p class="kid">🏦 <b>${usdM(total)}</b> · ${esc(tx[1])}</p>
      <div class="row spread"><div class="row"><span class="chip down">${t('independence')} ${MINUS}${f.sov}</span>${f.debt ? `<span class="chip down">+${usdM(f.debt)} ${t('debt')}</span>` : ''}</div>
      ${st ? status : `<button class="btn${on ? ' on' : ''}" data-act="fac" data-id="${f.id}" ${why ? 'disabled' : ''}>${on ? t('chosen') : t('sign')}</button>`}</div>${why ? `<div class="why">${esc(why)}</div>` : ''}</div>`;
  }).join('') + '</div>';
  return h;
}
function renderMoneyBudget(P){
  const Lg = P.last.ledger, LB = LEDGER[LANG];
  const bars = (rows, fmt, title) => { const mx = Math.max(...rows.map(r => Math.abs(r[1])), 1), tot = rows.reduce((a, r) => a + r[1], 0);
    return `<h3 class="bh">${title}</h3>${rows.map(r => `<div class="brow"><span>${esc(LB[r[0]] || r[0])}</span><div class="btrack"><i class="${r[1] < 0 ? 'neg' : 'pos'}" style="width:${Math.abs(r[1]) / mx * 100}%"></i></div><b class="${r[1] < 0 ? 'bad' : 'good'}">${fmt(r[1])}</b></div>`).join('')}
      <div class="brow total"><span>${t('leftOver')}</span><div></div><b class="${tot < 0 ? 'bad' : 'good'}">${fmt(tot)}</b></div>`; };
  return `<p class="muted" style="font-size:13px;margin:0">${t('budgetIntro')}</p>` + bars(Lg.syp, v => (v < 0 ? MINUS : '+') + bn(Math.abs(v)), '💵 ' + t('cashLira')) + bars(Lg.usd, v => (v < 0 ? MINUS : '+') + usdM(Math.abs(v)), '🏦 ' + t('dollars'));
}
function renderPeople(){
  const ps = personas(S), PL = PERSONA_LINES[LANG];
  return Object.entries(PERSONA_TXT).map(([k, pt]) => {
    const o = ps[k], tx = L2(pt), mx = Math.max(o.i, o.e), ratio = clamp(o.i / o.e / 1.4, 0, 1);
    const bar = (rows, cls) => rows.filter(r => r[1] > 0.5).map(r => `<div class="brow"><span>${PL[r[0]]}</span><div class="btrack"><i class="${cls}" style="width:${r[1] / mx * 100}%"></i></div><b>${usd(r[1])}</b></div>`).join('');
    return `<div class="person"><div class="ph"><div class="face" aria-hidden="true">${pt.icon}<span class="mood">${o.mood}</span></div><div><h4>${esc(tx[0])}</h4><div class="role">${esc(tx[1])}</div></div></div>
      <div class="wallet"><div class="track"><i style="width:${ratio * 100}%;background:${o.net >= 0 ? 'var(--good)' : 'var(--bad)'}"></i></div><b class="${o.net >= 0 ? 'good' : 'bad'}">${o.net >= 0 ? '+' : MINUS}${usd(Math.abs(o.net))}</b></div>
      <div class="pline"><b>${o.net >= 0 ? t('leftMonth') : t('shortMonth')}.</b> ${esc(PL[o.status])}${o.why ? ' ' + esc(PL[o.why]) : ''}</div>
      <details><summary>${t('income')} ${usd(o.i)} · ${t('spending')} ${usd(o.e)}</summary>${bar(o.inc, 'pos')}${bar(o.exp, 'neg')}</details></div>`;
  }).join('');
}
function renderChains(){ const c = chains(S); return renderChain(t('breadChain'), '🍞', c.bread, c.sb) + renderChain(t('energyChain'), '💡', c.energy, c.se); }
function renderProgressCharts(){
  const G = k => L2(GLOSS[k]).name;
  const pipe = (S.pipe || []).slice().sort((a, b) => a.due - b.due);
  let h = `<h3 class="bh" style="margin-top:0">⏳ ${t('comingSoon')}</h3>` + (pipe.length ? pipe.map(i => `<div class="pipe"><span>${i.kind === 'mw' ? '⚡ ' + fill(t('mwArrives'), [Math.round(i.mw)]) : '🏗️ ' + esc(PN(i.id)) + ': ' + esc(L2(PROJ_TXT[i.id])[0])}</span><b>${i.due - S.turn <= 0 ? t('atEnd') : fill(t('inSeasons'), [seasonsTxt(i.due - S.turn)])}</b></div>`).join('') : `<p class="muted" style="font-size:13px">${t('comingNone')}</p>`);
  h += `<h3 class="bh">📈 ${t('subCharts')}</h3>` + (S.history.length < 2 ? `<p class="muted" style="font-size:13px">${t('chartsEmpty')}</p>` :
    spark('trust', '🤝 ' + G('trust'), v => v.toFixed(0), true, '#35b6a3') + spark('anger', '🔥 ' + G('anger'), v => v.toFixed(0), false, '#f08a3c') +
    spark('usd', '🏦 ' + G('usd'), usdM, true, '#4c86d6') + spark('cash', '💵 ' + G('cash'), bn, true, '#3f9a4a') +
    spark('fx', '💱 ' + G('fx'), v => v.toFixed(0), false, '#d89412') + spark('pay', '👷 ' + G('pay'), usd, true, '#8c5cc7') + spark('power', '💡 ' + G('power'), v => v.toFixed(1), true, '#e2b93b'));
  return h;
}
function renderProgressCycles(){
  return `<p class="muted" style="font-size:13px;margin-top:0">${t('cyclesHelp')} (${(S.cycles || []).length}/5)</p>` + Object.keys(CYCLE_TXT).map(id => (S.cycles || []).includes(id)
    ? `<button class="cyclecard ${CYCLE_TXT[id].bad ? 'bad' : 'good'}" data-act="cycle" data-id="${id}">${CYCLE_TXT[id].bad ? '🔻' : '🔺'} ${esc(L2(CYCLE_TXT[id])[0])}</button>`
    : `<div class="cyclecard locked">🔒 ${t('locked')}</div>`).join('');
}
function drawerBody(id, P){
  switch(id){
    case 'policy': return renderPolicy();
    case 'decrees': return renderDecrees();
    case 'money': return UI.sub.money === 'budget' ? renderMoneyBudget(P) : renderMoneyActions();
    case 'people': return renderPeople();
    case 'chains': return renderChains();
    case 'progress': return UI.sub.progress === 'cycles' ? renderProgressCycles() : UI.sub.progress === 'news' ? renderNews() : renderProgressCharts();
  }
}
function renderDrawer(P){
  const d = DRAWERS.find(x => x[0] === UI.drawer); if (!d) return '';
  let sub = d[3] === 'decreesSub' ? fill(t('decreesIntro'), [Math.round(pcLeft())]) : t(d[3]);
  const subtabs = d[0] === 'money' ? [['actions','subActions'],['budget','subBudget']] : d[0] === 'progress' ? [['charts','subCharts'],['cycles','subCycles'],['news','subNews']] : null;
  return `<aside class="drawer" aria-label="${t(d[2])}"><div class="head"><span class="dic" aria-hidden="true">${d[1]}</span><h2>${t(d[2])}</h2><button class="close" data-act="closeDrawer" aria-label="${t('close')}">✕</button></div>
    <div class="sub">${sub}</div>
    ${subtabs ? `<div class="subtabs" role="tablist">${subtabs.map(([k, l]) => `<button role="tab" data-act="subtab" data-d="${d[0]}" data-v="${k}" aria-selected="${UI.sub[d[0]] === k}">${t(l)}</button>`).join('')}</div>` : ''}
    <div class="body">${drawerBody(d[0], P)}</div></aside>`;
}

// ---------- dock ----------
function renderDock(){
  const ps = personas(S), sad = Object.values(ps).filter(o => o.net < 0).length, ch = chains(S);
  const plans = D.decrees.length + D.projects.length + D.facilities.length + (D.wageRaise ? 1 : 0) + (D.grantPop ? 1 : 0) + (D.relief ? 1 : 0);
  const badge = { people: sad ? `<span class="badge">${sad}</span>` : '', chains: (ch.sb === 2 || ch.se === 2) ? '<span class="badge">!</span>' : '', progress: UI.newCycle ? '<span class="badge star">★</span>' : '' };
  const btn = ([k, i, l]) => `<button class="dbtn" data-act="drawer" data-v="${k}" aria-pressed="${UI.drawer === k}"><span class="di" aria-hidden="true">${i}</span><span class="dt">${t(l)}</span>${badge[k] || ''}</button>`;
  return `<nav class="dock"><div class="dgroup">${DRAWERS.slice(0, 3).map(btn).join('')}</div><div class="dgroup">${DRAWERS.slice(3).map(btn).join('')}</div>
    <span class="spacer"></span>
    <button class="influence" data-act="drawer" data-v="decrees"><span class="st" aria-hidden="true">⭐</span><span><span class="n">${Math.round(pcLeft())}</span><span class="l">${t('influenceLbl')}</span></span></button>
    ${S.over ? `<button class="endturn" data-act="restart">${t('playAgain')}</button>` : `<button class="endturn" data-act="review">${plans ? `<span class="plans">${fill(t('planned'), [plans])}</span>` : ''}${t('endSeason')} <span aria-hidden="true">${AR() ? '◀' : '▶'}</span></button>`}</nav>`;
}

// ---------- render ----------
function render(){
  const P = projection();
  if (isPhone() && UI.drawer && UI.provOpen) UI.provOpen = false;
  const cls = ['board', UI.drawer ? 'has-drawer' : '', UI.provOpen ? 'has-prov' : ''].join(' ');
  $('#root').innerHTML = renderHUD(P) + `<main class="${cls}">
      <div class="mapbox">${renderMapSvg()}</div>
      ${S.over ? '' : renderAdvisors(P)}${renderLayers()}${renderLegend()}
      ${UI.provOpen ? renderProvince() : ''}${UI.drawer ? renderDrawer(P) : ''}
    </main>` + renderDock();
}
