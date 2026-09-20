// ===== Decisions come to you =====
// The rest of this game asks the player to go looking: open a panel, find a subtab, read a card,
// decide. That is fine once you know the game and hopeless on your first evening with it. This
// layer turns the same systems into what a casual player actually wants — one question at a time,
// two or three answers, and the consequence shown before you commit. The simulation underneath is
// untouched: every option here calls the same ACT.* the panels call.
//
// Two rules, both learned the hard way:
//   1. A question is only built when the player can afford it AND reach it (`isOpen()` per branch).
//      A card offering a greyed-out answer is worse than no card at all.
//   2. Filter skipped items BEFORE picking the best one, or skipping the top item silences the
//      whole category.
// How often these questions come at all is decided by `mentorLevel()` in 8-levels.js: a player who
// runs the country from the panels gets asked less, until they are not asked at all.

UI.deck = []; UI.decSkip = {}; UI.decHide = false;

const decMonthsBase = 10;                                // how long a skipped question stays away
const decMonths = () => decMonthsBase + (typeof mentorLevel === 'function' ? mentorLevel() * 6 : 0);
// month 0 is a real month: `|| -99` would treat a skip at t=0 as never having happened
const decSkipped = id => (UI.decSkip[id] === undefined ? -99 : UI.decSkip[id]) > S.t - decMonths();
function decSkip(id){ UI.decSkip[id] = S.t; }
// the best two things in a category that the player has not just waved away
const pick2 = (list, id) => list.filter(x => !decSkipped(id(x))).slice(0, 2);

// ---------- building the questions ----------
function decisionDeck(){
  if (!S || S.over) return [];
  const out = [], A = AR();
  const money = (usd, syp) => [usd ? `🏦 ${usdM(usd)}` : '', syp ? `💵 ${bn(syp)}` : ''].filter(Boolean);

  // 1. the province that is angriest and still fixable — properly, or fast and leaky
  if (isOpen('projects')){
    const p = PROVS.map(x => ({ id:x.id, u:S.provs[x.id].u }))
      .filter(x => !S.provs[x.id].project && S.reserves + S.grant >= PROJECTS[x.id].usd && S.pc >= PROJECTS[x.id].pc
        && !decSkipped('prov_' + x.id))
      .sort((a, b) => b.u - a.u)[0];
    if (p){
      const x = PROJECTS[p.id], tx = L2(PROJ_TXT[p.id]);
      out.push({ id:'prov_' + p.id, icon:'🏗️', weight:p.u, why:t('decProv'),
        title:`${PN(p.id)}: ${tx[0]}`, text:tx[1],
        opts:[
          { label:t('decBuildT'), sub:fill(t('tenderTxt'), [monthsTxt(projMonths(p.id, 'tender')), Math.round(x.usd * projLeakRate(S, 'tender'))]), chips:money(x.usd, x.syp),
            run:() => withEffects(`${PN(p.id)}: ${tx[0]}`, () => ACT.project(S, p.id, 'tender')) && guideTick('project') },
          { label:t('decBuildF'), sub:fill(t('fastTxt'), [monthsTxt(projMonths(p.id, 'fast')), Math.round(x.usd * projLeakRate(S, 'fast'))]), chips:money(x.usd, x.syp),
            run:() => withEffects(`${PN(p.id)}: ${tx[0]}`, () => ACT.project(S, p.id, 'fast')) && guideTick('project') },
        ] });
    }
  }

  // 2. a policy that is visibly hurting — stop it, or ease off
  if (S.policy.print >= 15 && isOpen('polPrint') && !decSkipped('pol_print')){
    const pol = L2(POL.print), half = S.policy.print >= 30 ? 15 : 5;
    out.push({ id:'pol_print', icon:'🖨️', weight:70, why:t('decPolicy'), title:pol.name, text:pol.hint[String(S.policy.print)],
      opts:[
        { label:pol.opts['0'], sub:pol.hint['0'], chips:[], run:() => withEffects(`${pol.name}: ${pol.opts['0']}`, () => { S.policy.print = 0; return true; }) },
        { label:pol.opts[String(half)], sub:pol.hint[String(half)], chips:[], run:() => withEffects(`${pol.name}: ${pol.opts[String(half)]}`, () => { S.policy.print = half; return true; }) },
      ] });
  }
  // The treasury is empty. There is never one way to close that hole, so the card offers the real
  // ones side by side — including printing money, because watching that go wrong is the lesson.
  if (S.treasury < -15 && isOpen('policy') && !decSkipped('pol_budget')){
    const ways = [
      ['fuel', 'market', S.policy.fuel !== 'market'],
      ['tax', 'aggressive', S.policy.tax !== 'aggressive' && isOpen('polTax')],
      ['bread', 'partial', S.policy.bread === 'full'],
      ['bread', 'removed', S.policy.bread === 'partial'],
      ['print', 5, S.policy.print === 0 && isOpen('polPrint')],
    ].filter(w => w[2]).slice(0, 3);
    if (ways.length){
      const opts = ways.map(([k, v]) => { const pol = L2(POL[k]);
        return { label:`${POL[k].icon} ${pol.name}: ${pol.opts[String(v)]}`, sub:pol.hint[String(v)], chips:[],
          run:() => withEffects(`${pol.name}: ${pol.opts[String(v)]}`, () => { S.policy[k] = v; return true; }) }; });
      out.push({ id:'pol_budget', icon:'💸', weight:64, why:t('decPolicy'), title:t('decBudgetTitle'),
        text:fill(t('decBudgetText'), [bn(-S.treasury)]), opts });
    }
  }

  // 3. people are paid less than they expect — three sizes of answer
  if (isOpen('money') && !cooldown('lastRaise', 6) && realWage(S) < (S.expWage || 25) - 6 && S.treasury > 5 && !decSkipped('wage')){
    out.push({ id:'wage', icon:'👷', weight:60, why:t('decWage'), title:t('raiseTitle'),
      text:fill(t('raiseText'), [realWage(S).toFixed(0), (S.expWage || 25).toFixed(0)]),
      opts:[5, 10, 25].map(v => ({ label:'+' + v + '%', sub:'', chips:[],
        run:() => withEffects(`${t('raiseTitle')} +${v}%`, () => { ACT.wage(S, v); S.flags.lastRaise = S.t; return true; }) })) });
  }

  // 4. schools and clinics behind the population — the two furthest behind
  if (isOpen('services')){
    const short = Object.keys(SERVICES).filter(k => (k !== 'unis' || isOpen('unis')) && svcCover(S, k) < 0.85
      && S.reserves >= SERVICES[k].usd && !S.pipe.some(q => q.kind === 'svc' && q.id === k)
      && !(SERVICES[k].req && !SERVICES[k].req(S))).sort((a, b) => svcCover(S, a) - svcCover(S, b));
    const two = pick2(short, k => 'svc_' + k);
    if (two.length){
      out.push({ id:'svc_' + two[0], icon:SVC_ICON[two[0]], weight:58 + (1 - svcCover(S, two[0])) * 20, why:t('decSvc'),
        title:svcLabel(two[0]), text:{ schools:t('svcSchoolsTxt'), clinics:t('svcClinicsTxt'), unis:t('svcUnisTxt') }[two[0]],
        opts:two.map(k => ({ label:`${SVC_ICON[k]} ${svcLabel(k)}`, sub:fill(t('svcCover'), [S.svc[k] || 0, svcNeed(S, k)]), chips:money(SERVICES[k].usd, SERVICES[k].syp),
          run:() => withEffects(svcLabel(k), () => ACT.service(S, k)) })) });
    }
  }

  // 5. nothing is being made here — two factories, and they are not the same choice
  if (isOpen('sectors')){
    const ok = Object.keys(INVEST).filter(id => INVEST[id].sector && (!INVEST[id].supply || isOpen('supply'))
      && S.reserves >= INVEST[id].usd && (S.invests[id] || 0) < (INVEST[id].max || 3)
      && !S.pipe.some(q => q.kind === 'invest' && q.id === id) && !(INVEST[id].req && !INVEST[id].req(S)))
      .sort((a, b) => (INVEST[b].jobs || 0) - (INVEST[a].jobs || 0));
    const two = pick2(ok, k => 'inv_' + k);
    if (two.length){
      const tx = L2(INV_TXT[two[0]]);
      out.push({ id:'inv_' + two[0], icon:INV_TXT[two[0]].icon, weight:50 + (joblessNat(S) - 40) * 0.5, why:t('decSector'),
        title:tx[0], text:tx[1],
        opts:two.map(k => ({ label:`${INV_TXT[k].icon} ${L2(INV_TXT[k])[0]}`, sub:fill(t('jobsChip'), ['+' + INVEST[k].jobs]), chips:money(INVEST[k].usd, 0),
          run:() => withEffects(L2(INV_TXT[k])[0], () => ACT.invest(S, k)) })) });
    }
  }

  // 6. something the whole country waits on could be bigger
  if (isOpen('build')){
    const ok = INFRA_ORDER.filter(k => infraOpen(k) && iLvl(S, k) < INFRA[k].max
      && !S.pipe.some(q => q.kind === 'infra' && q.id === k) && S.reserves >= infraCost(S, k).usd * 2.5)
      .sort((a, b) => infraScore(b) - infraScore(a));
    const two = pick2(ok, k => 'infra_' + k);
    if (two.length){
      const tx = L2(INFRA_TXT[two[0]]);
      out.push({ id:'infra_' + two[0], icon:INFRA_TXT[two[0]].icon, weight:50 + (nationalHours(S) < 8 ? 22 : 0), why:t('decInfra'),
        title:tx[0], text:tx[1],
        opts:two.map(k => { const c = infraCost(S, k);
          return { label:`${INFRA_TXT[k].icon} ${fill(t('infraUpTo'), [L2(INFRA_TXT[k])[0], iLvl(S, k) + 1])}`, sub:L2(INFRA_TXT[k])[2],
            chips:money(c.usd, c.syp).concat([`⏳ ${monthsTxt(c.months)}`]),
            run:() => withEffects(fill(t('infraUpTo'), [L2(INFRA_TXT[k])[0], iLvl(S, k) + 1]), () => ACT.infra(S, k)) }; }) });
    }
  }

  // 7. the docks, not the factories, are the bottleneck
  if (isOpen('ports')){
    const ok = ['latakia', 'tartus'].filter(k => S.ports[k].lvl < 3 && S.reserves >= PORT_UPGRADE.usd
      && !S.pipe.some(q => q.kind === 'port' && q.id === k));
    const two = pick2(ok, k => 'port_' + k);
    if (two.length){
      out.push({ id:'port_' + two[0], icon:'⚓', weight:40 + Math.min(30, (S.clogged || 0) * 1.4), why:t('decPort'),
        title:t('portsTitle'), text:t('portsSub'),
        opts:two.map(k => ({ label:`⚓ ${PORT_NAME[LANG][k]} → ${S.ports[k].lvl + 1}`, sub:fill(t('upgradeTxt'), [usdM(PORT_UPGRADE.usd)]),
          chips:money(PORT_UPGRADE.usd, 0).concat([`⏳ ${monthsTxt(PORT_UPGRADE.months)}`]),
          run:() => withEffects(`${t('upgrade')}: ${PORT_NAME[LANG][k]}`, () => ACT.portUpgrade(S, k)) })) });
    }
  }

  // 8. a neighbour is offering something — two of them, side by side
  if (isOpen('partners')){
    const ok = Object.keys(PARTNERS).filter(id => !S.deals[id] && S.pc >= PARTNERS[id].pc
      && (PARTNERS[id].lvlReq || 1) <= levelNow()
      && !(PARTNERS[id].usd && S.reserves < PARTNERS[id].usd) && !(PARTNERS[id].signReq && !PARTNERS[id].signReq(S)))
      .sort((a, b) => PARTNERS[a].sov - PARTNERS[b].sov);
    const two = pick2(ok, k => 'deal_' + k);
    if (two.length){
      const tx = L2(PART_TXT[two[0]]);
      out.push({ id:'deal_' + two[0], icon:PARTNERS[two[0]].flag, weight:44, why:t('decDeal'), title:`${tx[0]}: ${tx[1]}`, text:tx[2],
        opts:two.map(k => ({ label:`${PARTNERS[k].flag} ${L2(PART_TXT[k])[0]}`, sub:L2(PART_TXT[k])[3],
          chips:[`⭐ ${PARTNERS[k].pc}`].concat(PARTNERS[k].sov ? [`${t('independence')} ${MINUS}${PARTNERS[k].sov}`] : []),
          run:() => withEffects(`${L2(PART_TXT[k])[0]}: ${L2(PART_TXT[k])[1]}`, () => ACT.deal(S, k)) })) });
    }
  }

  // 9. a route you already have could carry more
  if (isOpen('routes')){
    const ok = Object.keys(S.deals).filter(id => PARTNERS[id] && (S.deals[id].lvl || 1) < (PARTNERS[id].max || 1)
      && S.pc >= dealCost(S, id).pc && S.reserves >= dealCost(S, id).usd * 2.2)
      .sort((a, b) => dealCost(S, a).sov - dealCost(S, b).sov);
    const two = pick2(ok, k => 'route_' + k);
    if (two.length){
      out.push({ id:'route_' + two[0], icon:PARTNERS[two[0]].flag, weight:42, why:t('decRoute'),
        title:fill(t('routeWiden'), [L2(PART_TXT[two[0]])[0]]), text:t('routeWiderGives'),
        opts:two.map(k => { const c = dealCost(S, k);
          return { label:`${PARTNERS[k].flag} ${L2(PART_TXT[k])[0]} → ${(S.deals[k].lvl || 1) + 1}`, sub:L2(PART_TXT[k])[3],
            chips:[`⭐ ${c.pc}`].concat(c.usd ? [`🏦 ${usdM(c.usd)}`] : []).concat(c.sov ? [`${t('independence')} ${MINUS}${c.sov}`] : []),
            run:() => withEffects(fill(t('routeWiden'), [L2(PART_TXT[k])[0]]), () => ACT.dealWiden(S, k)) }; }) });
    }
  }

  // 10. influence burning a hole in your pocket
  if (isOpen('decrees') && S.pc >= 35){
    const ok = DECREES.filter(d => S.decrees[d.id] === undefined && S.pc >= d.pc && S.reserves >= (d.usd || 0)
      && !(d.req && !d.req(S))).sort((a, b) => b.pc - a.pc);
    const two = pick2(ok, d => 'dec_' + d.id);
    if (two.length){
      const tx = L2(DEC_TXT[two[0].id]);
      out.push({ id:'dec_' + two[0].id, icon:'⭐', weight:40, why:t('decDecree'), title:tx[0], text:tx[1],
        opts:two.map(d => ({ label:L2(DEC_TXT[d.id])[0], sub:L2(DEC_TXT[d.id])[2], chips:[`⭐ ${d.pc}`].concat(money(d.usd, d.syp)),
          run:() => withEffects(L2(DEC_TXT[d.id])[0], () => ACT.decree(S, d.id)) })) });
    }
  }

  // A question with two answers is a decision; a question with one is a notification. Where the game
  // has a real either/or to offer, it gets asked first.
  return out.sort((a, b) => (b.weight + (b.opts.length > 1 ? 3 : 0)) - (a.weight + (a.opts.length > 1 ? 3 : 0)));
}
// which network the country is hurting for most right now
function infraScore(k){
  switch(k){
    case 'grid': return 100 - nationalHours(S) * 5;
    case 'water': return 70 - S.health;
    case 'housing': return 30 + PROVS.reduce((a, p) => a + S.provs[p.id].dmg, 0) * 0.6;
    case 'roads': return joblessNat(S) - 20 + (S.clogged || 0) * 0.5;
    case 'egov': return S.corr - 25;
    case 'rail': return 20 + (S.clogged || 0) * 0.8;
    case 'air': return 15 + ((S.ind && S.ind.tourism) || 0) * 12;
  }
  return 0;
}

// ---------- the card ----------
function renderDeck(){
  const box = $('#deckbox'); if (!box) return;
  if (!S || S.over || UI.decHide || UI.drawer || UI.provOpen || $('#modal').innerHTML.trim()){ box.innerHTML = ''; return; }
  const deck = decisionDeck(); UI.deck = deck;
  if (!deck.length){ box.innerHTML = ''; return; }
  const d = deck[0];
  box.innerHTML = `<div class="deck" role="group" aria-label="${t('decHeading')}">
    <button class="close" data-act="decHide" aria-label="${t('hide')}">✕</button>
    <div class="dhead"><span class="dico" aria-hidden="true">${d.icon}</span>
      <div><div class="dwhy">${esc(d.why)}</div><h3>${esc(d.title)}</h3></div></div>
    <p class="dtext">${esc(d.text)}</p>
    ${d.opts.map((o, i) => `<button class="opt" data-act="decPick" data-i="${i}"><b>${esc(o.label)}</b>${o.sub ? `<span class="t">${esc(o.sub)}</span>` : ''}
      <span class="chips">${o.chips.map(c => `<span class="chip">${esc(c)}</span>`).join('')}</span></button>`).join('')}
    <div class="row"><button class="btn small" data-act="decLater">${t('decLater')}</button>${deck.length > 1 ? `<button class="btn small" data-act="decNext">${t('decSkip')} →</button>` : ''}</div></div>`;
}

// ---------- hooks ----------
const decBaseFrame = ensureFrame;
ensureFrame = function(){
  decBaseFrame();
  if (!$('#deckbox')){ const b = $('#board'); if (b){ const e = document.createElement('div'); e.id = 'deckbox'; b.appendChild(e); } }
};
const decBaseRender = render;
render = function(force){ decBaseRender(force); renderDeck(); };

document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act;
  if (a !== 'decPick' && a !== 'decLater' && a !== 'decNext' && a !== 'decHide' && a !== 'decShow') return;
  const d = UI.deck[0];
  if (a === 'decHide'){ UI.decHide = true; return render(true); }
  if (a === 'decShow'){ UI.decHide = false; return render(true); }
  if (!d) return;
  if (a === 'decLater'){ decSkip(d.id); persist(); return render(true); }
  if (a === 'decNext'){ decSkip(d.id); persist(); return render(true); }
  if (a === 'decPick'){ const o = d.opts[+b.dataset.i]; if (o && o.run){ S.cardActs = (S.cardActs || 0) + 1; o.run(); } persist(); return render(true); }
});
