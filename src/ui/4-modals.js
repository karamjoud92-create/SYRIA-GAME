// ===== Transition: UI v3 (part C) =====
// ---------- "why did this happen?" ----------
function whyChains(before, after){
  const W = WHY[LANG], w = after.last.why, out = [];
  const step = (txt, cls) => ({ txt, cls });
  // 1) currency chain
  if (Math.abs(w.pct) >= 1){
    const f = w.fx, up = w.pct > 0, cand = [
      [f.print, fill(W.print, [after.policy.print])], [f.reserves, f.reserves > 0 ? W.reserves : W.reservesGood], [f.deficit, W.deficit],
      [f.trust, f.trust > 0 ? W.lowTrust : W.highTrust], [f.intervene, W.intervene], [f.trade, f.trade > 0 ? W.tradeBad : W.tradeGood], [f.shock, W.shock]];
    const drivers = cand.filter(([v]) => up ? v > 0.5 : v < -0.5).map(([v, l]) => [Math.abs(v), l]);
    drivers.sort((a, b) => b[0] - a[0]);
    const c = [step(drivers.length ? drivers.slice(0, 2).map(d => d[1]).join(AR() ? ' + ' : ' + ') : W.base, 'cause'),
      step(w.pct > 0 ? fill(W.fxUp, [w.pct.toFixed(1)]) : fill(W.fxDown, [w.pct.toFixed(1)]), w.pct > 0 ? 'bad' : 'good')];
    const dp = w.rw1 - w.rw0;
    if (Math.abs(dp) >= 0.3) c.push(step(dp < 0 ? fill(W.payDown, [Math.abs(dp).toFixed(1)]) : fill(W.payUp, [dp.toFixed(1)]), dp < 0 ? 'bad' : 'good'));
    const dt = w.trustAfter - w.trustBefore;
    if (Math.abs(dt) >= 0.5 && dp * dt > 0) c.push(step(dt < 0 ? fill(W.trustDown, [Math.abs(dt).toFixed(1)]) : fill(W.trustUp, [dt.toFixed(1)]), dt < 0 ? 'bad' : 'good'));
    out.push({ icon:'💱', steps:c, weight:Math.abs(w.pct) * 2 });
  }
  // 2) trust chain
  { const dt = w.trustAfter - w.trustBefore;
    if (Math.abs(dt) >= 0.5){
      const parts = Object.entries(w.trustParts).filter(([k]) => k !== 'base').map(([k, v]) => [k, v]).filter(x => Math.abs(x[1]) >= 1.5)
        .sort((a, b) => (dt < 0 ? a[1] - b[1] : b[1] - a[1])).slice(0, 2);
      if (parts.length) out.push({ icon:'🤝', weight:Math.abs(dt) * 1.5, steps:[step(parts.map(([k, v]) => `${W['t_' + k]} (${sign(v, 0)})`).join(' + '), 'cause'),
        step(dt < 0 ? fill(W.trustDown, [Math.abs(dt).toFixed(1)]) : fill(W.trustUp, [dt.toFixed(1)]), dt < 0 ? 'bad' : 'good')] });
    } }
  // 3) anger chain
  { const da = natUnrest(after) - natUnrest(before);
    if (Math.abs(da) >= 0.5){
      const parts = Object.entries(w.angerParts).filter(x => (da > 0 ? x[1] >= 2 : x[1] <= -2)).sort((a, b) => da > 0 ? b[1] - a[1] : a[1] - b[1]).slice(0, 2);
      if (parts.length) out.push({ icon:'🔥', weight:Math.abs(da) * 1.5, steps:[step(parts.map(([k]) => W[(da > 0 ? 'a_' : 'b_') + k]).join(' + '), 'cause'),
        step(da > 0 ? fill(W.angerUp, [da.toFixed(1)]) : fill(W.angerDown, [Math.abs(da).toFixed(1)]), da > 0 ? 'bad' : 'good')] });
    } }
  // 4) budget chain
  { const d = after.treasury - before.treasury, rows = after.last.ledger.syp;
    if (Math.abs(d) >= 3){
      const big = rows.slice().sort((a, b) => d < 0 ? a[1] - b[1] : b[1] - a[1])[0];
      const c = [step(fill(d < 0 ? W.biggestCost : W.biggestIncome, [LEDGER[LANG][big[0]] || big[0]]), 'cause'), step(fill(d < 0 ? W.cashDown : W.cashUp, [Math.abs(d).toFixed(1)]), d < 0 ? 'bad' : 'good')];
      if (after.treasury < 0 && d < 0) c.push(step(W.deficit, 'bad'), step(AR() ? 'الدولار يغلو' : 'Dollar gets pricier', 'bad'));
      out.push({ icon:'💵', weight:Math.abs(d) / 3, steps:c });
    } }
  // 5) delayed power
  { const done = after.last.notes.find(n => n[0] === 'gridDone'), dh = w.hrs1 - w.hrs0;
    if (done && dh > 0.1) out.push({ icon:'⚡', weight:4, steps:[step(W.gridArrived + ` (+${done[1]} MW)`, 'cause'), step(fill(W.powerUp, [dh.toFixed(1)]), 'good'), step(W.a_power + ' ↓', 'good')] }); }
  return out.sort((a, b) => b.weight - a.weight).slice(0, 3);
}
function renderWhy(chs){
  if (!chs.length) return `<p class="muted">${WHY[LANG].noneYet}</p>`;
  return chs.map(c => `<div class="whychain"><span class="wicon" aria-hidden="true">${c.icon}</span>${c.steps.map((s, i) => `<span class="wstep ${s.cls}">${esc(s.txt)}</span>${i < c.steps.length - 1 ? `<span class="warr" aria-hidden="true">${arrowFwd()}</span>` : ''}`).join('')}</div>`).join('');
}

// ---------- cycles ----------
function detectCycles(){
  const H = S.history, n = H.length; if (n < 3) return [];
  const a = H[n - 3], b = H[n - 2], c = H[n - 1], found = [];
  if (b.print > 0 && c.print > 0 && c.fx > b.fx && b.fx > a.fx && c.pay < b.pay) found.push('printing');
  if (b.capex > 0 && c.capex > 0 && c.mw > a.mw + 150 && c.cap > a.cap && c.usd > b.usd) found.push('growth');
  if (c.trust > b.trust && b.trust > a.trust && c.privB > 0.1 && c.anger < a.anger) found.push('trust');
  if (c.contagion > 1 && c.anger > b.anger) found.push('anger');
  if (c.debt > a.debt && c.usd < b.usd && b.usd < a.usd) found.push('debt');
  return found.filter(id => !(S.cycles || []).includes(id));
}
function cycleSvg(id){
  const cy = CYCLE_TXT[id], nodes = L2(cy)[1], N = nodes.length, R = 118, cx = 170, cyy = 150, col = cy.bad ? 'var(--revolt)' : 'var(--calm)';
  const pos = nodes.map((_, i) => { const ang = -Math.PI / 2 + i * 2 * Math.PI / N; return [cx + R * Math.cos(ang), cyy + R * Math.sin(ang)]; });
  // Where the line leaves a pill: the ray from the centre, clipped by that pill's own box.
  // (The old version offset x and y by different amounts, which pulled both ends off the line
  //  and left nothing but a floating arrowhead.)
  const halfW = nodes.map(txt => Math.max(124, txt.length * 7.2 + 26) / 2 + 7), halfH = 16 + 7;
  const arcs = pos.map((p, i) => { const j = (i + 1) % N, q = pos[j], dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
    const edge = k => Math.min(Math.abs(ux) > 1e-6 ? halfW[k] / Math.abs(ux) : 1e6, Math.abs(uy) > 1e-6 ? halfH / Math.abs(uy) : 1e6);
    const a = Math.min(edge(i), len * 0.42), b = Math.min(edge(j) + 9, len * 0.42);   // +9 leaves room for the arrowhead
    const s0 = [p[0] + ux * a, p[1] + uy * a], e0 = [q[0] - ux * b, q[1] - uy * b];
    const mxp = (s0[0] + e0[0]) / 2, myp = (s0[1] + e0[1]) / 2, ox = (mxp - cx) * 0.25, oy = (myp - cyy) * 0.25;
    return `<path d="M${s0[0].toFixed(1)},${s0[1].toFixed(1)} Q${(mxp + ox).toFixed(1)},${(myp + oy).toFixed(1)} ${e0[0].toFixed(1)},${e0[1].toFixed(1)}" fill="none" stroke="${col}" stroke-width="2.5" marker-end="url(#ah)"/>`; }).join('');
  // the pill grows with the label: a fixed width cut long ones in half
  const labels = nodes.map((txt, i) => { const [x, y] = pos[i], w = Math.max(124, txt.length * 7.2 + 26);
    return `<g><rect x="${(x - w / 2).toFixed(1)}" y="${y - 16}" width="${w.toFixed(1)}" height="32" rx="16" fill="var(--card-ink)" stroke="${col}" stroke-width="1.5"/><text x="${x}" y="${y + 5}" text-anchor="middle" class="cyc">${esc(txt)}</text></g>`; }).join('');
  return `<svg viewBox="-60 0 460 300" class="cyclesvg" direction="ltr" aria-hidden="true"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10z" fill="${col}"/></marker></defs>${arcs}${labels}<text x="${cx}" y="${cyy + 6}" text-anchor="middle" font-size="30">${cy.bad ? '🔻' : '🔺'}</text></svg>`;
}
function showCycle(id, fromQueue){
  const cy = CYCLE_TXT[id], tx = L2(cy);
  modal(`<div class="src">${fromQueue ? '🎉 ' + t('cycleFound') : ''}</div><h2>${esc(tx[0])}</h2><div class="chip ${cy.bad ? 'down' : 'up'}" style="display:inline-block;margin-bottom:8px">${cy.bad ? t('cycleVicious') : t('cycleVirtuous')}</div>
    ${cycleSvg(id)}<div class="row" style="margin-top:12px"><button class="btn primary" data-act="${fromQueue ? 'nextq' : 'close'}">${t('keepGoing')}</button></div>`);
}

// ---------- modals ----------
function modal(html, cls = ''){ $('#modal').innerHTML = `<div class="scrim" role="dialog" aria-modal="true"><div class="modal ${cls}">${html}</div></div>`; const f = $('#modal .btn.primary') || $('#modal button'); if (f) f.focus(); }
function closeModal(){ $('#modal').innerHTML = ''; }
function tutorial(i){
  const T = TUT[LANG], x = T[i];
  modal(`<div class="tut-icon" aria-hidden="true">${x[0]}</div><h2>${esc(x[1])}</h2><p class="lede">${esc(x[2])}</p>
  <div class="dots">${T.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div>
  <div class="row spread">${i > 0 ? `<button class="btn" data-act="tut" data-i="${i - 1}">${t('back')}</button>` : '<span></span>'}
  ${i < T.length - 1 ? `<button class="btn primary" data-act="tut" data-i="${i + 1}">${t('next')}</button>` : `<button class="btn primary" data-act="close">${t('startPlaying')}</button>`}</div>`);
}
function startScreen(){
  modal(`<div class="row spread"><div class="tut-icon" aria-hidden="true">🕊️</div><button class="btn" data-act="lang">🌐 ${t('language')}</button></div>
  <h2>${t('title')}</h2><div class="src">${t('subtitle')}</div><p class="lede">${t('pickDiff')}</p>
  <button class="opt" data-act="newgame" data-v="learner"><b>${t('learner')}</b><span class="t">${t('learnerTxt')}</span></button>
  <button class="opt" data-act="newgame" data-v="realistic"><b>${t('realistic')}</b><span class="t">${t('realisticTxt')}</span></button>
  <button class="opt" data-act="missions"><b>${t('missionsBtn')}</b><span class="t">${t('missionsTxt')}</span></button>
  <button class="opt" data-act="loadcode"><b>📥 ${t('loadCode')}</b></button>
  <p class="muted" style="font-size:13px;margin:14px 0 0">${t('disclaimer')}</p>`);
}
function missionsScreen(){
  modal(`<h2>🎯 ${t('missionsTitle')}</h2>` + Object.keys(MISSIONS).map(id => { const m = MISSION_TXT[id], x = L2(m);
    return `<button class="opt" data-act="mission" data-v="${id}"><b>${m.icon} ${esc(x[0])}</b><span class="t">${esc(x[1])}</span></button>`; }).join('') +
    `<button class="btn" data-act="startscreen">${t('back')}</button>`);
}
function gloss(k){
  const g = GLOSS[k], G = L2(g);
  modal(`<div class="tut-icon" aria-hidden="true">${g.icon}</div><h2>${G.name}</h2><p class="lede">${esc(G.what)}</p><p><b>${t('why')}</b> ${esc(G.why)}</p><p><b>${t('how')}</b> ${esc(G.fix)}</p>
  <button class="btn primary" data-act="close">${t('gotIt')}</button>`);
}
function menu(){
  modal(`<h2>${t('menu')}</h2><p class="muted" style="margin:0 0 16px">${t('menuSaved')}</p>
  <div class="row"><button class="btn primary" data-act="close">${t('backToGame')}</button><button class="btn" data-act="tut" data-i="0">${t('howToPlay')}</button><button class="btn" data-act="lang">🌐 ${t('language')}</button></div>
  <div class="row" style="margin-top:10px"><button class="btn" data-act="savecode">📤 ${t('saveCode')}</button><button class="btn" data-act="loadcode">📥 ${t('loadCode')}</button><button class="btn" data-act="restart">${t('newGame')}</button></div>`);
}
function saveCodeModal(){
  const code = saveCode();
  try { navigator.clipboard && navigator.clipboard.writeText(code).catch(() => {}); } catch(e){}
  modal(`<h2>📤 ${t('saveCode')}</h2><p>${t('saveCopied')}</p><textarea class="code" readonly onclick="this.select()">${code}</textarea><button class="btn primary" data-act="close">${t('gotIt')}</button>`);
  const ta = $('#modal textarea'); if (ta){ ta.focus(); ta.select(); }
}
function loadCodeModal(err){
  modal(`<h2>📥 ${t('loadCode')}</h2>${err ? `<p class="bad">${t('badCode')}</p>` : ''}<textarea class="code" id="codein" placeholder="${t('pasteCode')}"></textarea>
  <div class="row"><button class="btn primary" data-act="doload">${t('load')}</button><button class="btn" data-act="${S ? 'close' : 'startscreen'}">${t('back')}</button></div>`);
}
function compareRows(a, b){
  const row = (key, va, vb, fmt, goodUp) => { const d = vb - va, cls = Math.abs(d) < 1e-6 ? 'muted' : (d > 0) === goodUp ? 'good' : 'bad', arr = Math.abs(d) < 1e-6 ? '→' : d > 0 ? '↑' : '↓';
    return `<div class="stat"><span>${GLOSS[key].icon} ${L2(GLOSS[key]).name}</span><b>${fmt(va)} <span class="${cls}">${arr} ${fmt(vb)}</span></b></div>`; };
  return row('cash', a.treasury, b.treasury, bn, true) + row('usd', a.reserves, b.reserves, usdM, true) + row('fx', a.parallel, b.parallel, v => v.toFixed(0), false)
    + row('pay', realWage(a), realWage(b), usd, true) + row('trust', a.trust, b.trust, v => v.toFixed(0), true) + row('anger', natUnrest(a), natUnrest(b), v => v.toFixed(0), false);
}
function review(){
  const P = projection(), items = [];
  D.decrees.forEach(id => items.push('⭐ ' + L2(DEC_TXT[id])[0]));
  D.projects.forEach(id => items.push('🏗️ ' + PN(id) + ': ' + L2(PROJ_TXT[id])[0] + ' (' + t(D.projMode[id] === 'fast' ? 'buildFast' : 'buildTender') + ')'));
  D.facilities.forEach(id => items.push('🌍 ' + L2(FAC_TXT[id])[0]));
  if (D.wageRaise) items.push(`👷 ${t('raiseTitle')} +${D.wageRaise}%`);
  if (D.grantPop) items.push('💵 ' + t('giftTitle')); if (D.relief) items.push('📦 ' + t('reliefTitle'));
  const fail = checkFail(P);
  modal(`<h2>${t('readyEnd')}</h2><div class="src">${esc(whenTxt(S.turn))}</div>
  ${items.length ? `<p style="margin:0 0 6px"><b>${t('yourChoices')}</b></p><ul class="notes" style="margin-bottom:14px">${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : `<p class="muted">${t('noChoices')}</p>`}
  ${compareRows(S, P)}${fail ? `<p class="warnbox">${fill(t('wouldEnd'), [esc(L2(FAIL_TXT[fail.id])[0])])}</p>` : ''}
  <div class="row" style="margin-top:18px"><button class="btn primary" data-act="commit">${t('endSeason')} ${AR() ? '◀' : '▶'}</button><button class="btn" data-act="close">${t('goBack')}</button></div>`);
}
function commit(){
  const before = S, tn = S.turn;
  S = step(S, D);
  S.log.push({ t:tn, items:S.last.notes.slice() }); if (S.log.length > 40) S.log.shift();
  S.history.push(snap(S));
  const chs = whyChains(before, S);
  D = emptyDraft(S);
  const newCycles = detectCycles(); S.cycles = (S.cycles || []).concat(newCycles); UI.queue = newCycles.map(id => ['cycle', id]); if (newCycles.length) UI.newCycle = true; UI.adv = null; UI.advOpen = true;
  const fail = checkFail(S);
  if (fail){ S.over = { fail:fail.id, n:fail.title }; persist(); render(); return showFail(fail.id); }
  if (S.mission && S.turn >= S.mission.end){ S.over = { mission:MISSIONS[S.mission.id].check(S) }; persist(); render(); return showMissionEnd(); }
  if (!S.mission && S.turn > MAX_TURNS){ S.over = { won:true }; persist(); render(); return showLegacy(); }
  S.event = drawEvent(S);
  persist(); render(); showResults(before, chs);
}
function showResults(before, chs){
  const b = (S.trust - before.trust) - (natUnrest(S) - natUnrest(before));
  const mood = b > 1.5 ? ['🙂', t('better')] : b < -1.5 ? ['😟', t('worse')] : ['😐', t('same')];
  const L = S.log[S.log.length - 1];
  modal(`<div class="evhead"><div class="tut-icon" aria-hidden="true">${mood[0]}</div><div><div class="src">${fill(t('endOf'), [esc(whenTxt(L.t))])}</div><h2>${mood[1]}</h2></div></div>
  <h3 class="bh">🔗 ${t('whyTitle')}</h3>${renderWhy(chs)}
  ${L.items.length ? `<ul class="notes" style="margin:12px 0">${L.items.map(noteText).map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
  ${compareRows(before, S)}
  <div style="margin-top:18px"><button class="btn primary" data-act="afterresults">${S.event && !UI.queue.length ? t('crisisNeeds') : t('nextSeasonBtn')}</button></div>`);
}
function afterResults(){
  if (UI.queue.length){ const [kind, id] = UI.queue.shift(); if (kind === 'cycle') return showCycle(id, true); }
  if (S.event) return showEvent();
  closeModal();
}
function showEvent(){
  const e = EVENTS.find(x => x.id === S.event); if (!e){ S.event = null; persist(); return closeModal(); }
  const tx = L2(EV_TXT[e.id]);
  modal(`<div class="evhead"><div class="tut-icon" aria-hidden="true">${EV_ICON[e.id] || '🚨'}</div><div><div class="src">${t('crisis')} · ${esc(EV_SRC[LANG][e.id])}</div><h2>${esc(tx[0])}</h2></div></div><p class="lede">${esc(tx[1])}</p>
  <p style="margin:0 0 8px"><b>${t('whatDo')}</b></p>
  ${e.opts.map((o, i) => { const ok = optionAllowed(S, o); const why = ok.ok ? '' : (ok.why.includes('reserves') ? fill(t('needsUsd'), [-o.eff.usd]) : ok.why.includes('political') ? fill(t('needsInfluence'), [-o.eff.pc]) : (AR() ? 'غير متاح' : ok.why));
    return `<button class="opt" data-act="choose" data-i="${i}" ${ok.ok ? '' : 'disabled'}><b>${esc(tx[2][i][0])}</b><span class="t">${esc(tx[2][i][1])}${why ? ' (' + esc(why) + ')' : ''}</span><span class="chips">${effChips(o.eff)}</span></button>`; }).join('')}`);
}
function choose(i){
  const e = EVENTS.find(x => x.id === S.event), o = e.opts[i];
  applyEffects(S, o.eff);
  S.log[S.log.length - 1].items.push(['event', e.id, i]);
  S.event = null; D = emptyDraft(S);
  const fail = checkFail(S);
  if (fail){ S.over = { fail:fail.id }; persist(); render(); return showFail(fail.id); }
  persist(); render(); closeModal();
}
function scoresBlock(){
  const Lg = legacy(S), N = LEGACY_TXT[LANG].names;
  return `<div class="scores">${Object.entries(Lg.comp).map(([k, v]) => `<div><div class="row spread"><span>${N[k]}</span><b>${Math.round(v)}</b></div><div class="bar"><i style="width:${v}%;background:var(--wheat)"></i></div></div>`).join('')}</div>`;
}
function histCard(id){ const h = L2(HIST_TXT[id]); return `<div class="histcard"><div class="src">📚 ${t('history')}</div><h4>${esc(h[0])}</h4><p>${esc(h[1])}</p></div>`; }
function showFail(id){
  const f = L2(FAIL_TXT[id]), tn = S.turn - 1, revolts = PROVS.filter(p => tierOf(S.provs[p.id].u) === 'revolt').length;
  const hist = { default:'lebanon', hyper:'zimbabwe', uprising:'rwanda', coup:'iraq', fracture:'rwanda', paralysis:'lebanon' }[id];
  modal(`<div class="tut-icon" aria-hidden="true">💥</div><h2>${esc(f[0])}</h2><div class="src">${esc(whenTxt(tn))} · ${fill(t('afterN'), [tn - (S.mission ? S.mission.start - 1 : 0)])}</div><p class="lede">${esc(fill(f[1], [revolts]))}</p>
  <p class="tipbox">💡 <b>${t('tipLabel')}</b> ${esc(f[2])}</p>${histCard(hist)}${scoresBlock()}
  <div class="row"><button class="btn primary" data-act="restart">${t('tryAgain')}</button><button class="btn" data-act="close">${t('lookMap')}</button></div>`, 'fail');
}
function showLegacy(){
  const Lg = legacy(S), c = Lg.comp, LT = LEGACY_TXT[LANG];
  const weak = Object.entries(c).sort((a, b) => a[1] - b[1])[0][0], strong = Object.entries(c).sort((a, b) => b[1] - a[1])[0][0];
  const hist = { Solvency:'lebanon', Livelihoods:'germany', Stability:'rwanda', Institutions:'iraq', Reconstruction:'germany', Sovereignty:'lebanon' }[weak];
  modal(`<div class="row" style="align-items:flex-end;gap:20px"><div class="grade">${Lg.grade}</div><div><h2>${fill(t('madeIt'), [START_YEAR + 20 * (S.chapter || 1)])}</h2><div class="src">${fill(t('chapterDone'), [S.chapter || 1])} · ${fill(t('levelN'), [S.lvl || 1])}</div></div></div>
  <p class="lede" style="margin-top:14px">${LT.verdict[Lg.grade]} ${fill(t('didBest'), [LT.lower[strong], LT.lower[weak]])}</p>${scoresBlock()}${histCard(hist)}
  <div class="row">${S.over && S.over.chapter ? `<button class="btn primary" data-act="nextChapter">${fill(t('chapterGo'), [(S.chapter || 1) + 1])} ▶</button>` : ''}<button class="btn" data-act="restart">${t('playAgain')}</button><button class="btn" data-act="close">${t('lookMap')}</button></div>`);
}
function showMissionEnd(){
  const id = S.mission.id, m = L2(MISSION_TXT[id]), won = S.over.mission;
  const hist = { winter:'germany', lira:'zimbabwe', bread:'lebanon', capital:'iraq' }[id];
  modal(`<div class="tut-icon" aria-hidden="true">${won ? '🏆' : '🎯'}</div><h2>${won ? t('missionWon') : t('missionLost')}</h2><div class="src">${MISSION_TXT[id].icon} ${esc(m[0])}</div>
  <p><b>${t('missionGoal')}:</b> ${esc(m[1])}</p><p class="tipbox">💡 ${esc(m[2])}</p>${histCard(hist)}
  <div class="row"><button class="btn primary" data-act="missions">${t('missionsBtn')}</button><button class="btn" data-act="mission" data-v="${id}">${t('tryAgain')}</button><button class="btn" data-act="close">${t('lookMap')}</button></div>`);
}

