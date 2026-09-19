// ===== Transition: UI v3 (part B) =====
// ---------- map ----------
const LEFT_LABELS = { latakia:[-18, 250], tartus:[-18, 350], damascus:[-18, 530], quneitra:[-18, 600], daraa:[-18, 675] };
function mix(a, b, x){ return `color-mix(in srgb, ${b} ${Math.round(clamp(x, 0, 1) * 100)}%, ${a})`; }
function layerOf(id){
  const pv = S.provs[id];
  switch(UI.layer){
    case 'unrest': return { fill:TIER_COL[tierOf(pv.u)], val:S.flags.stats ? Math.round(pv.u) : fog(pv.u, 5) };
    case 'power': { const h = provHours(S, id); return { fill:mix('#3a3f55', '#f2c94c', h / 20), val:h.toFixed(0) + (AR() ? 'س' : 'h') }; }
    case 'damage': return { fill:mix('#6f9d8f', '#8e2f36', pv.dmg / 20), val:(AR() ? '' : '$') + pv.dmg.toFixed(pv.dmg < 10 ? 1 : 0) + (AR() ? ' مليار$' : 'B') };
    case 'jobs': return { fill:mix('#6f9d8f', '#c8612f', (pv.jobless - 15) / 60), val:Math.round(pv.jobless) + '%' };
  }
}
function provBadge(id){ const pv = S.provs[id]; return (pv.project === true ? '✅' : pv.project === 'building' ? '🏗️' : D.projects.includes(id) ? '🚧' : '') + (tierOf(pv.u) === 'revolt' ? '⚠️' : ''); }
function renderMap(){
  const order = PROVS.filter(p => p.id !== 'damascus').concat([PROV_BY.damascus]);
  const paths = order.map(p => `<path class="prov" fill-rule="evenodd" d="${MAP.paths[p.id]}" fill="${layerOf(p.id).fill}" data-act="sel" data-id="${p.id}" tabindex="0" role="button" aria-label="${esc(PN(p.id))}"><title>${esc(PN(p.id))}</title></path>`).join('');
  const selPath = `<path fill-rule="evenodd" d="${MAP.paths[UI.sel]}" fill="none" stroke="var(--text)" stroke-width="3.5" pointer-events="none"/>`;
  const labels = PROVS.map(p => {
    const [cx, cy] = MAP.cent[p.id], L = layerOf(p.id), badge = provBadge(p.id);
    if (LEFT_LABELS[p.id]){ const [lx, ly] = LEFT_LABELS[p.id];
      return `<g pointer-events="none"><line x1="${lx + 4}" y1="${ly - 5}" x2="${cx}" y2="${cy}" stroke="var(--muted)" stroke-width="1"/><circle cx="${cx}" cy="${cy}" r="3" fill="var(--text)"/>
        <text x="${lx}" y="${ly}" text-anchor="end" class="lname side">${esc(PN(p.id))} ${L.val} ${badge}</text></g>`; }
    const big = ['homs','deir','hasakeh','raqqa','aleppo'].includes(p.id);
    if (p.id === 'rif'){ const words = PN('rif').split(' ');
      return `<g pointer-events="none"><text x="${cx + 45}" y="${cy - 18}" text-anchor="middle" class="lname">${esc(words[0])}</text><text x="${cx + 45}" y="${cy - 2}" text-anchor="middle" class="lname">${esc(words.slice(1).join(' '))}</text><text x="${cx + 45}" y="${cy + 16}" text-anchor="middle" class="lval">${L.val}${badge ? ' ' + badge : ''}</text></g>`; }
    return `<g pointer-events="none"><text x="${cx}" y="${cy - 4}" text-anchor="middle" class="lname${big ? ' big' : ''}">${esc(PN(p.id))}</text><text x="${cx}" y="${cy + (big ? 20 : 15)}" text-anchor="middle" class="lval${big ? ' big' : ''}">${L.val}${badge ? ' ' + badge : ''}</text></g>`;
  }).join('');
  const [dx, dy] = [65.4, 558.4], IX = 575, IY = 648, IR = 92, Z = 5;
  const insetPath = id => `<path class="prov" fill-rule="evenodd" d="${MAP.paths[id]}" fill="${layerOf(id).fill}" vector-effect="non-scaling-stroke" data-act="sel" data-id="${id}"><title>${esc(PN(id))}</title></path>`;
  const insetSel = (UI.sel === 'damascus' || UI.sel === 'rif') ? `<path fill-rule="evenodd" d="${MAP.paths[UI.sel]}" fill="none" stroke="var(--text)" stroke-width="3" vector-effect="non-scaling-stroke" pointer-events="none"/>` : '';
  const inset = `<defs><clipPath id="zc"><circle cx="${IX}" cy="${IY}" r="${IR}"/></clipPath></defs>
    <rect x="${dx - 14}" y="${dy - 12}" width="28" height="23" rx="3" fill="none" stroke="var(--wheat)" stroke-width="1.6" stroke-dasharray="4 3" pointer-events="none"/>
    <path d="M${dx + 14},${dy + 6} C 250,${dy + 60} 400,${IY + 10} ${IX - IR},${IY}" fill="none" stroke="var(--wheat)" stroke-width="1.3" stroke-dasharray="4 3" opacity=".8" pointer-events="none"/>
    <circle cx="${IX}" cy="${IY}" r="${IR}" fill="var(--panel2)"/>
    <g clip-path="url(#zc)"><g transform="translate(${IX},${IY}) scale(${Z}) translate(${-dx},${-dy})">${['quneitra','daraa','rif','damascus'].map(insetPath).join('')}${insetSel}</g></g>
    <circle cx="${IX}" cy="${IY}" r="${IR}" fill="none" stroke="var(--wheat)" stroke-width="2" pointer-events="none"/>
    <text x="${IX}" y="${IY - IR - 10}" text-anchor="middle" class="ztitle" pointer-events="none">🔍 ${t('zoom')}</text>
    <g pointer-events="none"><text x="${IX}" y="${IY - 2}" text-anchor="middle" class="lname">${t('damascusCity')}</text><text x="${IX}" y="${IY + 17}" text-anchor="middle" class="lval">${layerOf('damascus').val}</text>
    <text x="${IX}" y="${IY + IR - 22}" text-anchor="middle" class="lname zsm">${esc(PN('rif'))} ${layerOf('rif').val}</text></g>`;
  const C = STR[LANG].countries;
  const neighbors = `<text x="420" y="-8" class="ctry">${C.TURKEY}</text><text x="760" y="470" class="ctry" text-anchor="middle">${C.IRAQ}</text>
    <text x="330" y="752" class="ctry">${C.JORDAN}</text><text x="-60" y="455" class="ctry" text-anchor="middle">${C.LEBANON}</text><text x="-90" y="150" class="sea" text-anchor="middle">${C.sea1}</text><text x="-90" y="170" class="sea" text-anchor="middle">${C.sea2}</text>`;
  const star = `<g transform="translate(${MAP.cent.damascus[0]},${MAP.cent.damascus[1]})" pointer-events="none"><path d="M0,-7 L2,-2 L7,-2 L3,1 L4.5,6 L0,3 L-4.5,6 L-3,1 L-7,-2 L-2,-2Z" fill="var(--wheat)" stroke="var(--bg)" stroke-width="1"/></g>`;
  const legend = UI.layer === 'unrest' ? ['calm','tense','riot','revolt'].map(x => `<span><i style="background:${TIER_COL[x]}"></i>${tierName(x)}</span>`).join('') + `<span>${t('revoltAt')}</span>`
    : UI.layer === 'power' ? `<span><i style="background:#3a3f55"></i>${t('legDark')}</span><span><i style="background:#f2c94c"></i>${t('legLight')}</span><span>${t('legPowerTxt')}</span>`
    : UI.layer === 'damage' ? `<span><i style="background:#6f9d8f"></i>${t('legLittle')}</span><span><i style="background:#8e2f36"></i>${t('legHeavy')}</span><span>${t('legDamageTxt')}</span>`
    : `<span><i style="background:#6f9d8f"></i>${t('legWorking')}</span><span><i style="background:#c8612f"></i>${t('legNoWork')}</span><span>${t('legJobsTxt')}</span>`;
  return `<div class="maphead"><h2>${t('mapTitle')}</h2><div class="layers" role="group">
      ${[['unrest','🔥','layerAnger'],['power','💡','layerPower'],['damage','🏚️','layerDamage'],['jobs','💼','layerJobs']].map(([k, i, l]) => `<button data-act="layer" data-v="${k}" aria-pressed="${UI.layer === k}">${i} ${t(l)}</button>`).join('')}
    </div></div>
    <svg class="map" viewBox="-190 -30 1010 800" preserveAspectRatio="xMidYMid meet" direction="ltr">${neighbors}<g>${paths}</g>${selPath}${labels}${inset}${star}</svg>
    <div class="legend">${legend}<span>✅ ${t('legBuilt')}</span><span>🏗️ ${t('legBuilding')}</span><span>⭐ ${t('legCapital')}</span>${S.flags.stats ? '' : `<span class="muted">~ ${t('noStats')}</span>`}</div>`;
}

// ---------- province dossier ----------
function renderProvince(){
  const id = UI.sel, p = PROV_BY[id], pv = S.provs[id], x = PROJECTS[id], tx = L2(PROJ_TXT[id]);
  const tier = tierOf(pv.u), hrs = provHours(S, id), on = D.projects.includes(id), c = draftCosts(S, D);
  const usdAvail = S.reserves - c.usd + Math.max(0, S.grant - c.fromGrant);
  let why = ''; if (!pv.project && !on){ if (x.pc > pcLeft()) why = fill(t('needsInfluence'), [x.pc]); else if (x.usd > usdAvail) why = fill(t('needsUsdProj'), [x.usd]); }
  const meter = (icon, k, v, pct, col) => `<div class="meter"><div class="row spread"><span>${icon} ${k}</span><b>${v}</b></div><div class="bar"><i style="width:${clamp(pct, 0, 100)}%;background:${col}"></i></div></div>`;
  const good = [], A = AR();
  if (x.unrest) good.push(fill(CHIP[LANG].prov, [PN(id), sign(x.unrest)])); if (x.power) good.push(A ? `+${x.power} ساعات كهرباء` : `+${x.power} hours of electricity`); if (x.jobs) good.push(A ? 'يخلق فرص عمل' : 'creates jobs');
  if (x.rev) good.push(A ? `يكسب ${bn(x.rev)} كل موسم` : `earns ${bn(x.rev)} cash every season`); if (x.transit) good.push(A ? `+${usdM(x.transit)} تجارة كل موسم` : `+${usdM(x.transit)} trade money every season`);
  if (x.phosphate) good.push(A ? `+${usdM(x.phosphate)} تعدين كل موسم` : `+${usdM(x.phosphate)} mining money every season`); if (x.oil) good.push(A ? `+${usdM(x.oil)} نفط كل موسم` : `+${usdM(x.oil)} oil money every season`);
  if (x.wheat) good.push(A ? `استيراد قمح أقل بـ${usdM(x.wheat)} كل موسم` : `${usdM(x.wheat)} less wheat to import every season`); if (x.mw) good.push(A ? 'كهرباء أكثر لكل البلاد' : 'more power for the whole country');
  if (x.cap) good.push(A ? 'اقتصاد أكبر' : 'bigger economy'); if (x.trust) good.push(fill(CHIP[LANG].trust, ['+' + x.trust]));
  const mode = D.projMode[id] || 'tender';
  const durF = projDuration(id, 'fast'), durT = projDuration(id, 'tender');
  const leakF = Math.round(x.usd * projLeakRate(S, 'fast')), leakT = Math.round(x.usd * projLeakRate(S, 'tender'));
  const pending = (S.pipe || []).find(i => i.kind === 'proj' && i.id === id);
  let action;
  if (pv.project === true) action = `<span class="chip up">${t('builtTag')}</span>${pv.leak > 0.05 ? `<div class="why">${fill(t('leaked'), [Math.round(x.usd * pv.leak)])}</div>` : ''}`;
  else if (pv.project === 'building') action = `<span class="chip">🏗️ ${fill(t('building'), [seasonsTxt(pending ? pending.due - S.turn : 1)])}</span>`;
  else action = `<div class="contract">
      <button class="opt mini${on && mode === 'fast' ? ' sel' : ''}" data-act="proj" data-id="${id}" data-mode="fast" ${why && !on ? 'disabled' : ''}><b>⚡ ${t('buildFast')}</b><span class="t">${fill(t('fastTxt'), [seasonsTxt(durF), leakF])}</span></button>
      <button class="opt mini${on && mode === 'tender' ? ' sel' : ''}" data-act="proj" data-id="${id}" data-mode="tender" ${why && !on ? 'disabled' : ''}><b>⚖️ ${t('buildTender')}</b><span class="t">${fill(t('tenderTxt'), [seasonsTxt(durT), leakT])}</span></button></div>`;
  const note = id === 'rif' ? t('rifNote') : id === 'damascus' ? t('damNote') : '';
  return `<div class="dossier"><div class="row spread"><h2>${esc(PN(id))}</h2><span class="tier" style="background:${TIER_COL[tier]}">${tierName(tier)}</span></div>
    <p class="muted" style="margin:2px 0 12px">${note}${fill(t('people'), [p.pop.toFixed(1)])}</p>
    ${meter('🔥', t('anger'), (S.flags.stats ? Math.round(pv.u) : fog(pv.u, 5)) + ' / 100', pv.u, TIER_COL[tier])}
    ${meter('💡', t('electricity'), hrs.toFixed(1) + ' ' + t('hDay'), hrs / 24 * 100, '#e2b93b')}
    ${meter('🏚️', t('destroyed'), usdM(pv.dmg * 1000), pv.dmg / Math.max(1, pv.dmg0) * 100, '#b4513a')}
    ${meter('💼', t('jobless'), Math.round(pv.jobless) + '%', pv.jobless, '#c8612f')}
    <div class="card project${on ? ' on' : ''}${pv.project === true ? ' done' : ''}"><div class="ptag">🏗️ ${t('bigProject')}</div>
      <h4>${esc(tx[0])}</h4><p><b>${t('problem')}</b> ${esc(tx[1])}</p><p><b>${t('ifBuilt')}</b> ${esc(good.join(AR() ? '، ' : ', '))}.</p>
      <div class="row" style="margin-bottom:8px"><span class="chip cost">🏦 ${usdM(x.usd)}</span><span class="chip cost">💵 ${bn(x.syp)}</span>${x.pc ? `<span class="chip cost">⭐ ${x.pc}</span>` : ''}</div>
      ${action}${why && !on && !pv.project ? `<div class="why">${esc(why)}</div>` : ''}</div>
    <p class="muted" style="font-size:13px">${t('tapAnother')}</p></div>`;
}

// ---------- people ----------
function personas(s){
  const P = s.policy, rw = realWage(s), infl = Math.max(0, s.infl - 20);
  const h = id => provHours(s, id);
  const breadC = { full:5, partial:8, removed:15 }[P.bread], trans = { full:4, partial:7, market:11 }[P.fuel];
  const out = {};
  // Rana
  { const gen = (24 - h('aleppo')) * 1.1, bro = s.flags.unified || s.flags.remitBoost ? 45 : 32;
    const inc = [['salary', rw], ['side', 12], ['brother', bro]], exp = [['food', 36 * (1 + infl / 200)], ['bread', breadC], ['generator', gen], ['transport', trans], ['rent', 18]];
    const why = gen > 14 ? 'why_power' : rw < 22 ? 'why_pay' : breadC > 10 ? 'why_bread' : null; out.rana = { inc, exp, why }; }
  // Abu Khaled
  { const drought = s.flags.droughtUntil && s.turn <= s.flags.droughtUntil;
    const crop = 95 * (drought ? 0.45 : 1) * (1 - s.provs.hasakeh.jobless / 260) * (built(s, 'hasakeh') ? 1.25 : 1) * { full:1.15, partial:1, removed:0.9 }[P.bread] * (1 - Math.max(0, s.provs.hasakeh.u - 60) / 100);
    const diesel = { full:8, partial:14, market:22 }[P.fuel];
    const inc = [['crop', crop]], exp = [['diesel', diesel], ['seeds', 15 * (1 + infl / 150)], ['food', 30 * (1 + infl / 200)], ['bread', breadC * 0.6], ['generator', (24 - h('hasakeh')) * 0.6]];
    const why = drought ? 'why_drought' : diesel > 15 ? 'why_power' : s.provs.hasakeh.jobless > 45 ? 'why_nojobs' : null; out.khaled = { inc, exp, why: why === 'why_power' ? null : why }; }
  // Hiba
  { const pv = s.provs.rif, homeBack = !!s.decrees.restitution;
    const inc = [['labor', 55 * (1 + (s.cap - 20) / 120) * (1 - pv.u / 250)]];
    const rent = homeBack ? 0 : 18 + 22 * (pv.dmg / pv.dmg0);
    const exp = [['rent', rent], ['food', 28 * (1 + infl / 200)], ['bread', breadC], ['generator', (24 - h('rif')) * 0.8], ['transport', trans]];
    out.hiba = { inc, exp, why: homeBack ? 'why_homeback' : 'why_home' }; }
  // Samer
  { const hd = h('damascus'), bribe = s.corr * 0.35;
    const inc = [['shop', 75 * (1 + (s.cap - 20) / 100) * clamp(hd / 12, 0.45, 1.4) * (P.tax === 'aggressive' ? 0.9 : 1)]];
    const exp = [['generator', (24 - hd) * 1.8], ['bribes', bribe], ['stock', 20 * (1 + infl / 100)], ['rent', 28], ['food', 30 * (1 + infl / 200)]];
    const why = (24 - hd) * 1.8 > 25 ? 'why_power' : bribe > 18 ? 'why_bribes' : infl > 10 ? 'why_fx' : null; out.samer = { inc, exp, why }; }
  Object.values(out).forEach(o => { o.i = o.inc.reduce((a, x) => a + x[1], 0); o.e = o.exp.reduce((a, x) => a + x[1], 0); o.net = o.i - o.e; const r = o.i / o.e;
    o.status = r >= 1.08 ? 's_ok' : r >= 0.9 ? 's_tight' : (s.trust < 35 ? 's_leave' : 's_bad'); o.mood = r >= 1.08 ? '🙂' : r >= 0.9 ? '😐' : '😟'; });
  return out;
}
function renderPeople(){
  const ps = personas(S), PL = PERSONA_LINES[LANG];
  return `<p class="intro">${t('peopleIntro')}</p>` + Object.entries(PERSONA_TXT).map(([k, pt]) => {
    const o = ps[k], tx = L2(pt), mx = Math.max(o.i, o.e);
    const bar = (rows, cls) => rows.filter(r => r[1] > 0.5).map(r => `<div class="brow"><span>${PL[r[0]]}</span><div class="btrack"><i class="${cls}" style="width:${r[1] / mx * 100}%"></i></div><b>${usd(r[1])}</b></div>`).join('');
    return `<div class="card person"><div class="row"><div class="pic" aria-hidden="true">${pt.icon}</div><div style="flex:1"><h4>${esc(tx[0])} <span class="mood">${o.mood}</span></h4><div class="muted" style="font-size:13px">${esc(tx[1])}</div></div></div>
      <div class="pstat ${o.net >= 0 ? 'good' : 'bad'}">${o.net >= 0 ? t('leftMonth') : t('shortMonth')}: <b>${usd(Math.abs(o.net))}</b></div>
      <p class="pline">${esc(PL[o.status])}${o.why ? ' ' + esc(PL[o.why]) : ''}</p>
      <details><summary>${t('income')} ${usd(o.i)} · ${t('spending')} ${usd(o.e)}</summary>${bar(o.inc, 'pos')}${bar(o.exp, 'neg')}</details></div>`;
  }).join('');
}

// ---------- supply chains ----------
function chains(s){
  const east = (s.provs.hasakeh.u + s.provs.raqqa.u) / 2, drought = s.flags.droughtUntil && s.turn <= s.flags.droughtUntil;
  const hrs = nationalHours(s), rw = realWage(s), R = s.reserves;
  const lvl = (bad, weak) => bad ? 2 : weak ? 1 : 0;
  const bread = [
    ['farms', lvl(east > 70 || (drought && east > 55), east > 55 || drought), 'r_farms'],
    ['silos', built(s, 'hasakeh') ? 0 : 1, 'r_silos'],
    ['ports', lvl(R < 120, R < 300), 'r_ports'],
    ['mills', lvl(hrs < 3, hrs < 6), 'r_mills'],
    ['trucks', lvl(R < 100, s.provs.deir.u > 65 || s.policy.fuel === 'market' && R < 250), 'r_trucks'],
    ['bakeries', s.policy.bread === 'removed' ? 1 : 0, 'r_bak'],
    ['families', lvl(rw < 15, rw < 25), 'r_fam'],
  ];
  const eastAll = (s.provs.deir.u + s.provs.hasakeh.u + s.provs.raqqa.u) / 3;
  const energy = [
    ['oilfields', lvl(eastAll > 70, !(s.decrees.tribal || s.decrees.northeast) || eastAll > 55), 'r_oil'],
    ['fuelimp', lvl(R < 100, R < 250), 'r_fimp'],
    ['refinery', built(s, 'homs') ? 0 : 1, 'r_ref'],
    ['plants', lvl(s.mw / s.demand < 0.25, s.mw / s.demand < 0.5), 'r_pl'],
    ['gridlines', s.policy.capex >= 20 ? 0 : 1, 'r_grid'],
    ['homes', lvl(hrs < 6, hrs < 12), 'r_homes'],
  ];
  const status = ch => { const b = ch.filter(x => x[1] === 2).length, w = ch.filter(x => x[1] === 1).length; return b >= 2 ? 2 : (b || w >= 2) ? 1 : 0; };
  return { bread, energy, sb:status(bread), se:status(energy) };
}
function renderChain(title, icon, list, st){
  const C = CHAIN_TXT[LANG], stTxt = [t('statusSteady'), t('statusRisk'), t('statusBreaking')][st], stCls = ['good', 'warn', 'bad'][st];
  return `<div class="chainbox"><div class="row spread"><h3 class="bh">${icon} ${title}</h3><span class="chip ${['up','','down'][st]}">${stTxt}</span></div>
    <div class="chain">${list.map(([k, l, r], i) => `<div class="node l${l}" title="${esc(C[r + (l ? '_bad' : '_ok')])}"><div class="nname">${C[k]}</div><div class="nstat">${[t('linkOk'), t('linkWeak'), t('linkBroken')][l]}</div></div>${i < list.length - 1 ? `<div class="arrow l${Math.max(l, list[i + 1][1])}" aria-hidden="true">${arrowFwd()}</div>` : ''}`).join('')}</div>
    <ul class="reasons">${list.filter(x => x[1] > 0).map(([k, l, r]) => `<li class="${l === 2 ? 'bad' : ''}"><b>${C[k]}:</b> ${esc(C[r + '_bad'])}</li>`).join('') || `<li class="good">${AR() ? 'كل الحلقات تعمل.' : 'Every link is working.'}</li>`}</ul></div>`;
}
function renderChains(){
  const c = chains(S);
  return `<p class="intro">${t('chainsIntro')}</p>` + renderChain(t('breadChain'), '🍞', c.bread, c.sb) + renderChain(t('energyChain'), '💡', c.energy, c.se);
}

// ---------- charts + cycles ----------
function spark(key, label, fmt, goodUp, color){
  const H = S.history; if (H.length < 2) return '';
  const vals = H.map(h => h[key]), mn = Math.min(...vals), mx = Math.max(...vals), rng = mx - mn || 1, w = 280, h = 64;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1) * w).toFixed(1)},${(h - 6 - (v - mn) / rng * (h - 12)).toFixed(1)}`).join(' ');
  const first = vals[0], last = vals[vals.length - 1], cls = Math.abs(last - first) < 1e-6 ? 'muted' : (last > first) === goodUp ? 'good' : 'bad';
  const zy = (h - 6 - (0 - mn) / rng * (h - 12)).toFixed(1);
  return `<div class="spark"><div class="row spread"><span>${label}</span><b class="${cls}">${fmt(last)}</b></div>
    <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" direction="ltr" aria-hidden="true">${key === 'cash' && mn < 0 && mx > 0 ? `<line x1="0" x2="${w}" y1="${zy}" y2="${zy}" stroke="var(--muted)" stroke-dasharray="3 3"/>` : ''}<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.2" vector-effect="non-scaling-stroke"/></svg></div>`;
}
function renderCharts(){
  const G = k => L2(GLOSS[k]).name;
  let h = S.history.length < 2 ? `<p class="intro">${t('chartsEmpty')}</p>` : `<p class="intro">${t('chartsIntro')}</p>` +
    spark('trust', '🤝 ' + G('trust'), v => v.toFixed(0), true, '#4f9483') + spark('anger', '🔥 ' + G('anger'), v => v.toFixed(0), false, '#d4703a') +
    spark('usd', '🏦 ' + G('usd'), usdM, true, '#6c9bd2') + spark('cash', '💵 ' + G('cash'), bn, true, '#86bd83') +
    spark('fx', '💱 ' + G('fx'), v => v.toFixed(0), false, '#c9a444') + spark('pay', '👷 ' + G('pay'), usd, true, '#b48bd6') + spark('power', '💡 ' + G('power'), v => v.toFixed(1), true, '#e2b93b');
  h += `<h3 class="bh" style="margin-top:18px">🔁 ${t('cyclesTitle')}</h3>`;
  h += (S.cycles || []).length ? S.cycles.map(id => `<button class="cyclecard ${CYCLE_TXT[id].bad ? 'bad' : 'good'}" data-act="cycle" data-id="${id}">${CYCLE_TXT[id].bad ? '🔻' : '🔺'} ${esc(L2(CYCLE_TXT[id])[0])}</button>`).join('') : `<p class="muted" style="font-size:13px">${t('cyclesNone')}</p>`;
  return h;
}

// ---------- budget + pipeline ----------
function renderBudget(P){
  const Lg = P.last.ledger, LB = LEDGER[LANG];
  const bars = (rows, fmt, title) => { const mx = Math.max(...rows.map(r => Math.abs(r[1])), 1), tot = rows.reduce((a, r) => a + r[1], 0);
    return `<h3 class="bh">${title}</h3>${rows.map(r => `<div class="brow"><span>${esc(LB[r[0]] || r[0])}</span><div class="btrack"><i class="${r[1] < 0 ? 'neg' : 'pos'}" style="width:${Math.abs(r[1]) / mx * 100}%"></i></div><b class="${r[1] < 0 ? 'bad' : 'good'}">${fmt(r[1])}</b></div>`).join('')}
      <div class="brow total"><span>${t('leftOver')}</span><div></div><b class="${tot < 0 ? 'bad' : 'good'}">${fmt(tot)}</b></div>`; };
  const pipe = (S.pipe || []).slice().sort((a, b) => a.due - b.due);
  const pipeHtml = pipe.length ? pipe.map(i => `<div class="pipe"><span>${i.kind === 'mw' ? '⚡ ' + fill(t('mwArrives'), [Math.round(i.mw)]) : '🏗️ ' + fill(t('projArrives'), [PN(i.id), L2(PROJ_TXT[i.id])[0]])}</span><b>${i.due - S.turn <= 0 ? t('atEnd') : fill(t('inSeasons'), [seasonsTxt(i.due - S.turn)])}</b></div>`).join('') : `<p class="muted" style="font-size:13px">${t('comingNone')}</p>`;
  return `<h3 class="bh">⏳ ${t('comingSoon')}</h3>${pipeHtml}<p class="intro" style="margin-top:16px">${t('budgetIntro')}</p>` +
    bars(Lg.syp, v => (v < 0 ? MINUS : '+') + bn(Math.abs(v)), '💵 ' + t('cashLira')) + bars(Lg.usd, v => (v < 0 ? MINUS : '+') + usdM(Math.abs(v)), '🏦 ' + t('dollars'));
}
function noteText(n){
  const N = NOTE[LANG], [k, a, b, c] = n;
  switch(k){
    case 'relief': case 'grantPop': return N[k];
    case 'wage': return fill(N.wage, [a]);
    case 'decree': return fill(N.decree, [L2(DEC_TXT[a])[0]]);
    case 'projStart': return c > 3 ? fill(N.projStartLeak, [PN(a), seasonsTxt(b), c]) : fill(N.projStart, [PN(a), seasonsTxt(b)]);
    case 'projDone': return b > 3 ? fill(N.projDoneLeak, [PN(a), L2(PROJ_TXT[a])[0], b]) : fill(N.projDone, [PN(a), L2(PROJ_TXT[a])[0]]);
    case 'facSign': return fill(N.facSign, [L2(FAC_TXT[a])[0]]);
    case 'facFrozen': return fill(N.facFrozen, [L2(FAC_TXT[a])[0]]);
    case 'grant': case 'wbGrid': case 'gridDone': case 'private': return fill(N[k], [a]);
    case 'event': return fill(t('youChose'), [L2(EV_TXT[a])[0], L2(EV_TXT[a])[2][b][0]]);
    default: return String(k);
  }
}
function renderNews(){
  if (!S.log.length) return `<p class="intro">${t('newsEmpty')}</p>`;
  return S.log.slice().reverse().slice(0, 10).map(l => `<h3 class="bh">${esc(whenTxt(l.t))}</h3><ul class="notes">${(l.items.length ? l.items.map(noteText) : [t('quiet')]).map(i => `<li>${esc(i)}</li>`).join('')}</ul>`).join('');
}
