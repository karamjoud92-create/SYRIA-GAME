// ===== Decisions come to you =====
// The rest of this game asks the player to go looking: open a panel, find a subtab, read a card,
// decide. That is fine once you know the game and hopeless on your first evening with it. This
// layer turns the same systems into what a casual player actually wants — one question at a time,
// two or three answers, and the consequence shown before you commit. The simulation underneath is
// untouched: every option here calls the same ACT.* the panels call.

UI.deck = []; UI.decSkip = {}; UI.decHide = false;

const decMonths = 10;                                   // how long a skipped question stays away
// month 0 is a real month: `|| -99` would treat a skip at t=0 as never having happened
const decSkipped = id => (UI.decSkip[id] === undefined ? -99 : UI.decSkip[id]) > S.t - decMonths;
function decSkip(id){ UI.decSkip[id] = S.t; }

// ---------- building the questions ----------
function decisionDeck(){
  if (!S || S.over) return [];
  const out = [], A = AR();
  const money = (usd, syp) => [usd ? `🏦 ${usdM(usd)}` : '', syp ? `💵 ${bn(syp)}` : ''].filter(Boolean);

  // 1. the province that is angriest and still fixable
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

  // 2. a policy that is visibly hurting
  if (S.policy.print >= 15 && isOpen('polPrint') && !decSkipped('pol_print')){
    const pol = L2(POL.print);
    out.push({ id:'pol_print', icon:'🖨️', weight:70, why:t('decPolicy'), title:pol.name, text:pol.hint[String(S.policy.print)],
      opts:[{ label:pol.opts['0'], sub:pol.hint['0'], chips:[], run:() => withEffects(`${pol.name}: ${pol.opts['0']}`, () => { S.policy.print = 0; return true; }) }] });
  }
  if (S.treasury < -15 && S.policy.fuel !== 'market' && isOpen('policy') && !decSkipped('pol_fuel')){
    const pol = L2(POL.fuel);
    out.push({ id:'pol_fuel', icon:'⛽', weight:64, why:t('decPolicy'), title:pol.name, text:pol.hint[S.policy.fuel],
      opts:[{ label:pol.opts.market, sub:pol.hint.market, chips:[], run:() => withEffects(`${pol.name}: ${pol.opts.market}`, () => { S.policy.fuel = 'market'; return true; }) }] });
  }

  // 2b. dollars piling up in the bank while the budget has no lira in it
  if (isOpen('polFx') && !S.policy.fxWindow && S.reserves > 600 && S.treasury < 15 && !decSkipped('pol_fx')){
    const pol = L2(POL.fxWindow);
    out.push({ id:'pol_fx', icon:'🏦', weight:66, why:t('decFx'), title:pol.name, text:pol.hint['0'],
      opts:[50, 150].map(v => ({ label:pol.opts[String(v)], sub:pol.hint[String(v)], chips:[],
        run:() => withEffects(`${pol.name}: ${pol.opts[String(v)]}`, () => { S.policy.fxWindow = v; return true; }) })) });
  }

  // 3. people are paid less than they expect
  if (isOpen('money') && !cooldown('lastRaise', 6) && realWage(S) < (S.expWage || 25) - 6 && S.treasury > 5 && !decSkipped('wage')){
    out.push({ id:'wage', icon:'👷', weight:60, why:t('decWage'), title:t('raiseTitle'),
      text:fill(t('raiseText'), [realWage(S).toFixed(0), (S.expWage || 25).toFixed(0)]),
      opts:[10, 25].map(v => ({ label:'+' + v + '%', sub:'', chips:[],
        run:() => withEffects(`${t('raiseTitle')} +${v}%`, () => { ACT.wage(S, v); S.flags.lastRaise = S.t; return true; }) })) });
  }

  // 4. schools and clinics behind the population
  if (isOpen('services')){
    const short = Object.keys(SERVICES).filter(k => (k !== 'unis' || isOpen('unis')) && svcCover(S, k) < 0.85
      && S.reserves >= SERVICES[k].usd && !S.pipe.some(q => q.kind === 'svc' && q.id === k)
      && !(SERVICES[k].req && !SERVICES[k].req(S))).sort((a, b) => svcCover(S, a) - svcCover(S, b))[0];
    if (short && !decSkipped('svc_' + short)){
      const x = SERVICES[short];
      out.push({ id:'svc_' + short, icon:SVC_ICON[short], weight:58 + (1 - svcCover(S, short)) * 20, why:t('decSvc'),
        title:svcLabel(short), text:{ schools:t('svcSchoolsTxt'), clinics:t('svcClinicsTxt'), unis:t('svcUnisTxt') }[short],
        opts:[{ label:t('svcBuild'), sub:fill(t('svcCover'), [S.svc[short] || 0, svcNeed(S, short)]), chips:money(x.usd, x.syp),
          run:() => withEffects(svcLabel(short), () => ACT.service(S, short)) }] });
    }
  }

  // 5. nothing is being made here
  if (isOpen('sectors')){
    const k = Object.keys(INVEST).filter(id => INVEST[id].sector && (!INVEST[id].supply || isOpen('supply'))
      && S.reserves >= INVEST[id].usd && (S.invests[id] || 0) < (INVEST[id].max || 3)
      && !S.pipe.some(q => q.kind === 'invest' && q.id === id) && !(INVEST[id].req && !INVEST[id].req(S)))
      .sort((a, b) => (INVEST[b].jobs || 0) - (INVEST[a].jobs || 0))[0];
    if (k && !decSkipped('inv_' + k)){
      const x = INVEST[k], tx = L2(INV_TXT[k]);
      out.push({ id:'inv_' + k, icon:INV_TXT[k].icon, weight:50 + (joblessNat(S) - 40) * 0.5, why:t('decSector'),
        title:tx[0], text:tx[1],
        opts:[{ label:t('investBtn'), sub:fill(t('jobsChip'), ['+' + x.jobs]), chips:money(x.usd, 0),
          run:() => withEffects(tx[0], () => ACT.invest(S, k)) }] });
    }
  }

  // 6. a neighbour is offering something
  if (isOpen('partners')){
    const k = Object.keys(PARTNERS).filter(id => !S.deals[id] && S.pc >= PARTNERS[id].pc
      && !(PARTNERS[id].usd && S.reserves < PARTNERS[id].usd) && !(PARTNERS[id].signReq && !PARTNERS[id].signReq(S)))
      .sort((a, b) => PARTNERS[a].sov - PARTNERS[b].sov)[0];
    if (k && !decSkipped('deal_' + k)){
      const tx = L2(PART_TXT[k]);
      out.push({ id:'deal_' + k, icon:PARTNERS[k].flag, weight:44, why:t('decDeal'), title:`${tx[0]}: ${tx[1]}`, text:tx[2],
        opts:[{ label:t('dealSign'), sub:tx[3], chips:[`⭐ ${PARTNERS[k].pc}`].concat(PARTNERS[k].sov ? [`${t('independence')} ${MINUS}${PARTNERS[k].sov}`] : []),
          run:() => withEffects(`${tx[0]}: ${tx[1]}`, () => ACT.deal(S, k)) }] });
    }
  }

  // 7. influence burning a hole in your pocket
  if (isOpen('decrees') && S.pc >= 35){
    const k = DECREES.filter(d => S.decrees[d.id] === undefined && S.pc >= d.pc && S.reserves >= (d.usd || 0)
      && !(d.req && !d.req(S))).sort((a, b) => b.pc - a.pc)[0];
    if (k && !decSkipped('dec_' + k.id)){
      const tx = L2(DEC_TXT[k.id]);
      out.push({ id:'dec_' + k.id, icon:'⭐', weight:40, why:t('decDecree'), title:tx[0], text:tx[1],
        opts:[{ label:t('choose'), sub:tx[2], chips:[`⭐ ${k.pc}`].concat(money(k.usd, k.syp)),
          run:() => withEffects(tx[0], () => ACT.decree(S, k.id)) }] });
    }
  }

  return out.sort((a, b) => b.weight - a.weight);
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
  if (a === 'decPick'){ const o = d.opts[+b.dataset.i]; if (o && o.run) o.run(); persist(); return render(true); }
});
