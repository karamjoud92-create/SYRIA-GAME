// ===== Levels, infrastructure, wider trade routes, medals, and a mentor that steps back =====
// Loaded last. Nothing here touches the simulation: it reads `S.xp`, `S.infra`, `S.deals[].lvl` and
// `S.medals`, all of which the engine maintains, and turns them into a progression the player can see.

// ---------- what counts as the player acting on their own ----------
// Answering a card is not the same as opening a panel and deciding. The ratio between the two is
// how the game works out whether it should still be holding a hand.
const SELF_ACTS = ['pol','decree','proj','fac','wage','grantPop','relief','invest','svc','portUp','portCon','deal','dealWiden','infra','oilHome'];

// ---------- the mentor ----------
// Four settings, picked automatically unless the player overrides it in the Guide. Higher means the
// game asks fewer questions, because the player has shown they go looking themselves.
const MENTOR_MIN = [0, 46, 60, 76];              // a question must weigh at least this much to be asked
function mentorLevel(){
  if (!S) return 0;
  const set = S.flags && S.flags.mentorSet;
  if (set !== undefined && set !== null && set !== 'auto') return clamp(+set, 0, 3);
  const self = S.selfActs || 0, card = S.cardActs || 0, total = self + card;
  const ratio = total >= 8 ? self / total : 0, lv = levelNow();
  let m = 0;
  if (lv >= 4 || ratio > 0.50) m = 1;
  if (lv >= 7 || ratio > 0.68) m = 2;
  if (lv >= 10 || (ratio > 0.82 && total >= 20)) m = 3;
  return m;
}
function renderMentor(){
  // Five settings with sentences for labels: a segmented control shreds them into three lines each,
  // in both languages. A stacked list of the same buttons reads, and matches the decision card.
  const m = mentorLevel(), set = String((S.flags && S.flags.mentorSet) !== undefined && S.flags.mentorSet !== null ? S.flags.mentorSet : 'auto');
  const opts = [['auto', t('mentorAuto'), t('mentorSub')], ['0', t('mentor0'), t('mentorWhy0')],
    ['1', t('mentor1'), t('mentorWhy1')], ['2', t('mentor2'), t('mentorWhy2')], ['3', t('mentor3'), t('mentorWhy3')]];
  return `<h3 class="bh">🎓 ${t('mentorTitle')}</h3>
    <p class="small muted" style="margin:0 0 8px">${esc(fill(t('mentorNow'), [t('mentor' + m)]))}</p>
    <div class="contract">${opts.map(([v, l, sub]) => `<button class="opt mini${set === v ? ' sel' : ''}" data-act="mentor" data-v="${v}" aria-pressed="${set === v}">
      <b>${esc(l)}</b><span class="t">${esc(sub)}</span></button>`).join('')}</div>`;
}

// ---------- the build panel ----------
// `INFRA_ORDER` lives in the engine on purpose: the first render happens before this file has
// evaluated, and a `const` declared here would still be in its temporal dead zone when
// `renderDock()` asks `infraReady()` for the badge. Function declarations hoist; consts do not.
function infraKey(k){ return 'infra' + k.charAt(0).toUpperCase() + k.slice(1); }
function infraOpen(k){ return isOpen(infraKey(k)); }
// how many tracks the player could upgrade right now — the number on the dock button
function infraReady(){
  if (!S || S.over) return 0;
  return INFRA_ORDER.filter(k => infraOpen(k) && iLvl(S, k) < INFRA[k].max
    && !(S.pipe || []).some(q => q.kind === 'infra' && q.id === k)
    && S.reserves >= infraCost(S, k).usd).length;
}
function renderInfra(){
  const open = INFRA_ORDER.filter(infraOpen), shut = INFRA_ORDER.filter(k => !infraOpen(k));
  // the drawer header already carries `buildSub`; repeating it here printed it twice
  let h = open.length ? '' : `<p class="muted small" style="margin-top:0">${esc(t('infraNone'))}</p>`;
  h += open.map(k => {
    const x = INFRA[k], tx = L2(INFRA_TXT[k]), n = iLvl(S, k), c = infraCost(S, k);
    const running = (S.pipe || []).find(q => q.kind === 'infra' && q.id === k), maxed = n >= x.max;
    let why = ''; if (!running && !maxed && S.reserves < c.usd) why = fill(t('needsUsd'), [c.usd]);
    const dots = `<div class="stars">${Array.from({ length:x.max }, (_, i) => `<span class="${i < n ? 'on' : ''}">■</span>`).join('')} <span class="small muted">${fill(t('infraLvl'), [n, x.max])}</span></div>`;
    const action = running ? `<span class="chip">⏳ ${fill(t('infraBuilding'), [monthsTxt(running.due - S.t)])}</span>`
      : maxed ? `<span class="chip up">✅ ${t('infraMaxed')}</span>`
      : `<button class="btn primary" data-act="infra" data-id="${k}" ${why ? 'disabled' : ''}>${t('infraUpgrade')} → ${n + 1}</button>`;
    return `<div class="dcard infra${maxed ? ' done' : ''}"><span class="gem">${maxed ? '★' : '🏦 ' + usdM(c.usd)}</span>
      <h4>${INFRA_TXT[k].icon} ${esc(tx[0])}</h4><p class="kid">${esc(tx[1])}</p><div class="fx">✨ ${esc(tx[2])}</div>${dots}
      <div class="row spread"><div class="row">${maxed ? '' : `<span class="chip">💵 ${bn(c.syp)}</span><span class="chip">⏳ ${monthsTxt(c.months)}</span>`}</div>${action}</div>
      ${why ? `<div class="why">${esc(why)}</div>` : ''}</div>`;
  }).join('');
  if (shut.length) h += shut.map(k => {
    const tx = L2(INFRA_TXT[k]), need = UNLOCK[infraKey(k)] || 1;
    return `<div class="dcard locked"><h4>🔒 ${INFRA_TXT[k].icon} ${esc(tx[0])}</h4><p class="kid">${esc(tx[1])}</p>
      <span class="chip">${esc(fill(t('needsLevel'), [need]))}</span></div>`;
  }).join('');
  return h;
}

// ---------- the medal shelf ----------
function renderMedals(){
  const got = Object.keys(S.medals || {}).length;
  let h = `<div class="rcard"><div class="rh"><span class="ri" aria-hidden="true">🏅</span><div><h3>${t('medalsTitle')}</h3>
      <div class="rv">${esc(fill(t('medalsCount'), [got, MEDALS.length]))}</div></div></div>
    <div class="bar big"><i style="width:${(got / MEDALS.length * 100).toFixed(0)}%;background:var(--gold)"></i></div>
    <p class="small muted">${esc(t('medalsSub'))}</p></div>`;
  h += `<div class="medalgrid">` + MEDALS.map(m => {
    const tx = MEDAL_TXT[m.id], have = (S.medals || {})[m.id] !== undefined;
    return `<div class="medal${have ? ' on' : ''}"><span class="mi" aria-hidden="true">${have ? tx.icon : '🔒'}</span>
      <div><b>${esc(L2(tx))}</b><span class="small muted">${have ? t('medalGot') : fill(t('medalXp'), [m.xp])}</span></div></div>`;
  }).join('') + `</div>`;
  return h + renderMentor();
}

// ---------- trade partners, now with route levels ----------
function renderTradePartners(){
  const lv = levelNow();
  return `<p class="small muted" style="margin-top:0">${t('partnersSub')}</p>` + Object.keys(PARTNERS).map(id => {
    const x = PARTNERS[id], tx = L2(PART_TXT[id]), d = S.deals[id];
    if ((x.lvlReq || 1) > lv && !d) return `<div class="dcard locked"><h4>🔒 ${x.flag} ${esc(tx[0])}</h4><p class="kid">${esc(tx[2])}</p>
      <span class="chip">${esc(fill(t('needsLevel'), [x.lvlReq]))}</span></div>`;
    const n = d ? (d.lvl || 1) : 0, max = x.max || 1, c = d ? dealCost(S, id) : null;
    let why = '';
    if (!d){ if (x.pc > S.pc) why = fill(t('needsInfluence'), [x.pc]); else if (x.usd && S.reserves < x.usd) why = fill(t('needsUsd'), [x.usd]); else if (x.signReq && !x.signReq(S)) why = t('needs') + ' ' + tx[4]; }
    else if (n < max && isOpen('routes')){ if (c.pc > S.pc) why = fill(t('needsInfluence'), [c.pc]); else if (c.usd > S.reserves) why = fill(t('needsUsd'), [c.usd]); }
    const status = d ? (d.on ? `<span class="chip up">✅ ${t('dealActive')}</span>` : `<span class="chip down">⏸ ${t('dealPaused')}</span>`)
      : `<button class="btn primary" data-act="deal" data-id="${id}" ${why ? 'disabled' : ''}>${t('dealSign')}</button>`;
    const widen = !d || !isOpen('routes') ? '' : n >= max ? `<span class="chip up">${t('routeMax')}</span>`
      : `<button class="btn primary" data-act="dealWiden" data-id="${id}" ${why ? 'disabled' : ''}>${t('routeWidenBtn')} → ${n + 1}
          <span class="chip">⭐ ${c.pc}</span>${c.usd ? `<span class="chip">🏦 ${usdM(c.usd)}</span>` : ''}</button>`;
    const dots = d ? `<div class="stars">${Array.from({ length:max }, (_, i) => `<span class="${i < n ? 'on' : ''}">🚚</span>`).join('')} <span class="small muted">${fill(t('routeLvl'), [n, max])}</span></div>` : '';
    return `<div class="dcard partner${d ? (d.on ? ' on' : ' paused') : ''}"><span class="gem">⭐ ${x.pc}</span>
      <div class="ph"><span class="flag" aria-hidden="true">${x.flag}</span><div><div class="small muted">${esc(tx[0])}</div><h4>${esc(tx[1])}</h4></div></div>
      <p class="kid">${esc(tx[2])}</p><div class="fx">✨ ${esc(tx[3])}</div>${dots}
      <div class="small muted">🔒 ${t('needs')} ${esc(tx[4])}${x.sov ? ` · ${t('independence')} ${MINUS}${x.sov}` : ''}</div>
      <div class="row spread" style="margin-top:8px"><span></span>${status}</div>
      ${widen ? `<div style="margin-top:8px">${widen}</div>` : ''}${why ? `<div class="why">${esc(why)}</div>` : ''}</div>`;
  }).join('');
}

// ---------- news lines for the new things ----------
const lvBaseNote = noteText;
noteText = function(n){
  const N = NOTE[LANG], k = n[1];
  if (k === 'infraStart') return fill(N.infraStart, [L2(INFRA_TXT[n[2]])[0], n[4], monthsTxt(n[3])]);
  if (k === 'infraDone') return fill(N.infraDone, [L2(INFRA_TXT[n[2]])[0], n[3]]);
  if (k === 'dealWiden') return fill(N.dealWiden, [L2(PART_TXT[n[2]])[0], n[3]]);
  if (k === 'medal') return fill(N.medal, [L2(MEDAL_TXT[n[2]]), n[3]]);
  return lvBaseNote(n);
};

// ---------- the guide gets the mentor control ----------
const lvBaseGuide = renderGuide;
renderGuide = function(){ return lvBaseGuide() + renderMentor(); };

// ---------- the deck asks less as the player needs it less ----------
const lvBaseDeck = decisionDeck;
decisionDeck = function(){
  const deck = lvBaseDeck(), min = MENTOR_MIN[mentorLevel()];
  return deck.filter(d => d.weight >= min);
};

// ---------- input ----------
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-act=mentor]'); if (!b) return;
  S.flags.mentorSet = b.dataset.v === 'auto' ? 'auto' : +b.dataset.v;
  sfx('tap'); persist(); render(true);
});

// ---------- the networks, on the map ----------
// Seven networks existed only as a list in a drawer, in a game with a map in the middle of the
// screen. Three of them have real geography and now get drawn: roads between neighbouring
// provinces, a rail spine that grows line by line, and markers at the ports and airports. The
// other four — water, housing, digital government, and the grid's own level — have no geography,
// so they are stated in the legend rather than faked as a colour on a province.
//
// Called from renderMapSvg() during the very first render, so: function declarations only, and
// nothing here may reach for a `const` declared in this file. See rule 10 in CLAUDE.md.
function railLines(n){
  // each level lays another line, in the order a country with one railway budget would lay them
  const all = [
    ['tartus', 'homs', 'damascus'],                 // the coast to the capital
    ['homs', 'hama', 'aleppo'],                     // up the spine
    ['aleppo', 'raqqa', 'deir'],                    // out to the east
    ['deir', 'hasakeh'],                            // and the far northeast
  ];
  return all.slice(0, Math.max(0, n));
}
function netOverlay(){
  if (!S || UI.layer !== 'build') return '';
  const C = MAP.cent, road = iLvl(S, 'roads'), rail = iLvl(S, 'rail'), air = iLvl(S, 'air');
  const seen = {}, out = [];

  // --- roads: every border between neighbours, thicker and more solid with each level ---
  const w = 1.4 + road * 1.15, op = (0.28 + road * 0.125).toFixed(2);
  PROVS.forEach(p => p.nb.forEach(n => {
    const key = [p.id, n].sort().join('|'); if (seen[key]) return; seen[key] = 1;
    const [x1, y1] = C[p.id], [x2, y2] = C[n];
    out.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#e8d5a8" stroke-width="${w.toFixed(1)}" stroke-linecap="round"
      opacity="${op}"${road ? '' : ' stroke-dasharray="6 7"'}/>`);
  }));

  // --- rail: a double line, the classic way to say "this is a railway and not a road" ---
  railLines(rail).forEach(line => {
    const d = line.map((id, i) => `${i ? 'L' : 'M'}${C[id][0]},${C[id][1]}`).join(' ');
    out.push(`<path d="${d}" fill="none" stroke="#2f2a3d" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/>
      <path d="${d}" fill="none" stroke="#f7f1e3" stroke-width="2.4" stroke-linecap="butt" stroke-dasharray="3 7" opacity=".9"/>`);
  });

  // --- ports and airports: a marker you can count, not a number in a drawer ---
  const pin = (x, y, icon, sub) => `<g pointer-events="none"><circle cx="${x}" cy="${y}" r="13" fill="var(--card)" stroke="var(--gold-deep)" stroke-width="2.5"/>
    <text x="${x}" y="${y + 6}" text-anchor="middle" style="font-size:15px">${icon}</text>
    ${sub ? `<text x="${x}" y="${y + 25}" text-anchor="middle" class="lval">${sub}</text>` : ''}</g>`;
  ['latakia', 'tartus'].forEach(id => { const p = S.ports[id];
    out.push(pin(C[id][0] + 26, C[id][1] - 22, '⚓', '●'.repeat(p.lvl) + '○'.repeat(3 - p.lvl))); });
  ['damascus', 'latakia', 'aleppo'].slice(0, air).forEach((id, i) =>
    out.push(pin(C[id][0] - (id === 'damascus' ? 30 : 26), C[id][1] + 26, '✈️', '')));

  return `<g class="netlayer" pointer-events="none">${out.join('')}</g>`;
}
// what the map cannot show, said plainly instead of coloured in
function netLegend(){
  const rows = [['grid', '⚡'], ['water', '🚰'], ['housing', '🏘️'], ['egov', '🖥️'], ['roads', '🛣️'], ['rail', '🚂'], ['air', '✈️']]
    .filter(([k]) => infraOpen(k))
    .map(([k, i]) => `<span title="${esc(L2(INFRA_TXT[k])[0])}">${i} ${iLvl(S, k)}/${INFRA[k].max}</span>`).join('');
  return rows || `<span>${esc(t('infraNone'))}</span>`;
}
