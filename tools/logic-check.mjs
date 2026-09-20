// Does the game behave the way it says it does? One check per logical claim the game makes
// about itself — in its text, its glossary, or CLAUDE.md. Each of these was false once.
import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path';
const file = 'file://' + path.resolve('dist/index.html');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
const errs = []; let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
const clear = p => p.evaluate(() => { if (document.querySelector('#modal .scrim') && typeof closeModal === 'function') closeModal(); });

for (const [tag, loc] of [['en', 'en-US'], ['ar', 'ar']]) {
  const page = await b.newPage({ viewport: { width: 1400, height: 900 }, locale: loc });
  page.on('pageerror', e => errs.push(tag + ': ' + e.message));
  page.on('console', m => { const x = m.text(); if (m.type() === 'error' && !/ERR_CERT|fonts\.g/.test(x)) errs.push(tag + ' console: ' + x); });
  await page.goto(file); await page.waitForTimeout(400);
  await page.click('[data-act=newgame][data-v=learner]');
  for (let i = 0; i < 8; i++) { const x = await page.$('.modal .btn.primary'); if (x) await x.click(); await page.waitForTimeout(50); }
  await clear(page);

  // 1. the presidency is twenty years long, and then history has its say.
  //    Kept solvent on the way, so this tests the ending and not a bankruptcy.
  const before = await page.evaluate(() => {
    for (let i = 0; i < 239; i++){ S.reserves = Math.max(S.reserves, 900); S.treasury = Math.max(S.treasury, 60); S = step(S); }
    render(true); return S.t;
  });
  await clear(page);
  ok(before === 239 && !(await page.evaluate(() => !!S.over)), `${tag}: a month short of twenty years, still playing (month ${before})`);
  const ended = await page.evaluate(() => { advance(); return { over: S.over, t: S.t, speed: UI.speed }; });
  await page.waitForTimeout(300);
  ok(ended.over && ended.over.won === true, `${tag}: the game ends at twenty years (month ${ended.t})`);
  const verdict = await page.evaluate(() => document.querySelector('#modal').innerText);
  ok(/2047/.test(verdict), `${tag}: the ending names the year you reached`);
  ok(verdict.split('\n').filter(Boolean).length > 6, `${tag}: it shows a grade, a verdict and the six parts`);
  ok(tag === 'en' ? /Twenty years/i.test(verdict) : /عشرون/.test(verdict), `${tag}: in the player's language`);
  ok(ended.speed === 0, `${tag}: the clock is paused`);
  const stopped = await page.evaluate(() => { const t0 = S.t; advance(); return S.t === t0; });
  ok(stopped, `${tag}: and a finished presidency does not keep running`);
  const dock = await page.evaluate(() => !!document.querySelector('[data-act=restart]'));
  ok(dock, `${tag}: the dock offers another go`);
  // 2. a decree signed in the first month works exactly as well as one signed later.
  //    s.decrees[id] stores the month it was signed, and month 0 is a real month.
  const m0 = await page.evaluate(() => {
    const sign = t => { let s = newGame(7, 'learner'); s.pc = 500; s.reserves = 900; s.treasury = 300;
      for (let i = 0; i < t; i++) s = step(s);
      ACT.decree(s, 'integrity');
      for (let i = 0; i < 24; i++) s = step(s); return s.corr; };
    return { now: sign(0), later: sign(1) };
  });
  ok(Math.abs(m0.now - m0.later) < 0.5, `${tag}: a decree signed in month 0 works (corruption ${m0.now.toFixed(1)} vs ${m0.later.toFixed(1)} a month later)`);

  // 3. the statistics office does what its name says, and the game no longer claims
  //    the dashboard is guessing when it is not
  const st = await page.evaluate(() => {
    const leak = on => { let s = newGame(7, 'learner'); s.pc = 500; s.reserves = 3000; s.treasury = 300;
      if (on) ACT.decree(s, 'stats'); ACT.project(s, 'aleppo', 'tender');
      return s.pipe.find(p => p.kind === 'proj').leak; };
    return { off: leak(false), on: leak(true) };
  });
  ok(st.on < st.off * 0.7, `${tag}: honest books mean less project money vanishes (${(st.off * 100).toFixed(1)}% -> ${(st.on * 100).toFixed(1)}%)`);
  const body = await page.evaluate(() => document.body.innerText);
  ok(!/\(~\)|estimates|تقديرية/.test(body), `${tag}: nothing tells the player the numbers are estimates`);

  // 4. the twice-a-year rule on raises, gifts and relief is the engine's, not the button's
  const cd = await page.evaluate(() => {
    const spam = fn => { let s = newGame(7, 'learner'); let n = 0;
      for (let i = 0; i < 10; i++) if (fn(s)) n++; return n; };
    let back = newGame(7, 'learner'); ACT.gift(back);
    for (let i = 0; i < 6; i++) back = step(back);
    return { gift: spam(s => ACT.gift(s)), wage: spam(s => ACT.wage(s, 25)),
      relief: spam(s => ACT.relief(s)), returns: ACT.gift(back) };
  });
  ok(cd.gift === 1 && cd.wage === 1 && cd.relief === 1,
    `${tag}: ten calls in one instant land once each (gift ${cd.gift}, raise ${cd.wage}, relief ${cd.relief})`);
  ok(cd.returns, `${tag}: and they come back six months later`);

  // 5. "Keep the lights on so workshops can run" — the jobs glossary says it, so it must be true.
  //    Extraction is meant to shrug a blackout off; making things is not.
  const pw = await page.evaluate(() => {
    const run = mw => { let s = newGame(7, 'learner');
      s.ind = { textiles:3, food:3, pharma:3, cement:3, telecom:3, tourism:0, logistics:3, coldchain:3, packaging:3 };
      s.mw = mw; s.reserves = 3000;
      for (let i = 0; i < 24; i++) s = step(s);
      const g = k => (s.last.ledger.usd.find(r => r[0] === k) || [0, 0])[1] / s.last.dt;
      return { h: nationalHours(s), ind: g('industry'), oil: g('oilExport') + g('phos') + g('farm') }; };
    return { lit: run(9000), dark: run(900) };
  });
  ok(pw.dark.ind < pw.lit.ind * 0.4,
    `${tag}: the factories stop in the dark ($${pw.lit.ind.toFixed(0)}M at ${pw.lit.h.toFixed(1)}h -> $${pw.dark.ind.toFixed(0)}M at ${pw.dark.h.toFixed(1)}h)`);
  ok(pw.dark.oil > pw.lit.oil * 0.8,
    `${tag}: but a wellhead runs on its own power ($${pw.lit.oil.toFixed(0)}M -> $${pw.dark.oil.toFixed(0)}M)`);

  // 6. a province in revolt burns, and the score counts what is standing rather than the effort
  const war = await page.evaluate(() => {
    const total = s => PROVS.reduce((a, p) => a + s.provs[p.id].dmg, 0);
    const run = burn => { let s = newGame(7, 'learner'); s.reserves = 6000; s.treasury = 4000;
      for (let i = 0; i < 120; i++){ s.policy.recon = 20; s.treasury = Math.max(s.treasury, 400);
        if (burn) ['aleppo','rif','homs'].forEach(k => s.provs[k].mod = 70);
        else PROVS.forEach(p => s.provs[p.id].mod = -20);
        s = step(s); }
      return { left: total(s), repaired: s.repaired, recon: legacy(s).comp.Reconstruction }; };
    return { calm: run(false), burn: run(true) };
  });
  ok(war.burn.left > 108, `${tag}: twenty years of revolt destroys things ($108B of damage -> $${war.burn.left.toFixed(0)}B)`);
  ok(war.calm.left < 108, `${tag}: and a calm country rebuilds ($${war.calm.left.toFixed(0)}B left)`);
  ok(war.burn.recon < war.calm.recon,
    `${tag}: the score counts what is standing, not the effort (burning ${war.burn.recon.toFixed(0)} < calm ${war.calm.recon.toFixed(0)}, though it repaired nearly as much)`);

  // 7. the border crackdown is a decision, not a button: it used to be better on score, trust,
  //    anger, corruption AND cash at once, with no cost written anywhere
  const cr = await page.evaluate(() => {
    const run = on => { let s = newGame(7, 'learner'); s.reserves = 4000;
      for (let i = 0; i < 120; i++){ const P = s.policy; P.crackdown = on; P.fuel = 'market'; P.tax = 'aggressive';
        P.capex = s.reserves > 450 ? 40 : 20;
        s = step(s); s.reserves = Math.max(s.reserves, 600); }
      const border = ['idlib','aleppo','hasakeh','deir','homs','daraa'].reduce((a, k) => a + s.provs[k].u, 0) / 6;
      const cost = (s.last.ledger.syp.find(r => r[0] === 'borders') || [0, 0])[1];
      return { cash: s.treasury, corr: s.corr, border, cost }; };
    return { on: run(true), off: run(false) };
  });
  ok(cr.on.cash > cr.off.cash && cr.on.corr < cr.off.corr,
    `${tag}: cracking down still pays (cash ${cr.off.cash.toFixed(0)} -> ${cr.on.cash.toFixed(0)}bn, corruption ${cr.off.corr.toFixed(0)} -> ${cr.on.corr.toFixed(0)})`);
  ok(cr.on.border > cr.off.border + 3 && cr.on.cost < 0,
    `${tag}: and it costs you the crossings (border anger ${cr.off.border.toFixed(0)} -> ${cr.on.border.toFixed(0)}, plus a bill to man them)`);

  await page.screenshot({ path: `tools/shot-logic-${tag}.png` });
  await page.close();
}
await b.close();
if (errs.length) { console.error('\nPAGE ERRORS:\n' + errs.join('\n')); fails += errs.length; }
console.log(fails ? `\n${fails} FAILED` : '\nall logic checks passed');
process.exit(fails ? 1 : 0);
