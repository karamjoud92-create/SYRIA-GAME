// Does a brand-new player get told what to do, and does the game notice when they do it?
import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path';
const file = 'file://' + path.resolve('dist/index.html');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
const errs = []; let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
const clear = p => p.evaluate(() => { if (document.querySelector('#modal .scrim') && typeof closeModal === 'function') closeModal(); });

for (const [tag, loc] of [['en', 'en-US'], ['ar', 'ar']]) {
  const page = await b.newPage({ viewport: { width: 1280, height: 880 }, locale: loc });
  page.on('pageerror', e => errs.push(tag + ': ' + e.message));
  page.on('console', m => { const x = m.text(); if (m.type() === 'error' && !/ERR_CERT|fonts\.g/.test(x)) errs.push(tag + ' console: ' + x); });
  await page.goto(file); await page.waitForTimeout(400);

  // the tutorial now ends by pointing at the guide
  await page.click('[data-act=newgame][data-v=learner]');
  const slides = [];
  for (let i = 0; i < 10; i++) {
    const h = await page.$('.modal h2'); if (!h) break;
    slides.push(await h.textContent());
    const x = await page.$('.modal .btn.primary'); if (!x) break; await x.click(); await page.waitForTimeout(50);
  }
  ok(slides.length >= 7, `${tag}: the tutorial runs (${slides.length} screens)`);
  await clear(page);

  // a new game opens on a question you can answer, with the guide one tap away
  ok(await page.$('.deck'), `${tag}: a new game opens with a decision to make`);
  ok(await page.$('.dbtn[data-v=guide] .badge'), `${tag}: the guide is one tap away, badged`);
  await page.evaluate(() => { UI.drawer = 'guide'; render(true); }); await page.waitForTimeout(200);
  const steps = await page.$$eval('.gstep', e => e.length);
  ok(steps === 6, `${tag}: six first steps are listed (${steps})`);
  const nowStep = await page.$$eval('.gstep.now b', e => e.map(n => n.textContent));
  ok(nowStep.length === 1, `${tag}: exactly one step is highlighted as next (${nowStep[0]})`);
  ok(await page.$('.gstep.now p'), `${tag}: the highlighted step explains itself`);

  // the badge counts what is left
  const badge = await page.textContent('.dbtn[data-v=guide] .badge');
  ok(badge.trim() === '6', `${tag}: the dock badge shows 6 steps left (${badge.trim()})`);

  // it always answers "what now" and "why"
  const heads = await page.$$eval('.drawer .body h3.bh', e => e.map(n => n.textContent.trim()));
  ok(heads.length >= 4, `${tag}: the guide has first steps, what to do next, why, and the chains (${heads.length} sections)`);
  const chains = await page.$$eval('.chainlist li', e => e.length);
  ok(chains === 5, `${tag}: five cause-and-effect chains are shown (${chains})`);

  // doing the thing ticks the box
  await page.evaluate(() => { UI.drawer = null; render(true); }); await page.waitForTimeout(150);
  await page.click('[data-act=speed][data-v="1"]'); await page.waitForTimeout(200);
  await page.evaluate(() => { UI.drawer = 'guide'; render(true); }); await page.waitForTimeout(150);
  ok(await page.evaluate(() => S.flags.g_start === true), `${tag}: starting the clock ticks the first step off`);
  const done1 = await page.$$eval('.gstep.done', e => e.length);
  ok(done1 === 1, `${tag}: one step now shows as done (${done1})`);

  await page.evaluate(() => { setSpeed(0); });
  await clear(page);
  await page.click('[data-act=gloss][data-k=anger]'); await page.waitForTimeout(200);
  ok(await page.evaluate(() => S.flags.g_gloss === true), `${tag}: reading a dashboard number ticks its step off`);
  await clear(page);
  await page.click('path.prov[data-id=aleppo]'); await page.waitForTimeout(250);
  ok(await page.evaluate(() => S.flags.g_prov === true), `${tag}: opening a province ticks its step off`);

  await page.evaluate(() => { UI.provOpen = false; UI.drawer = 'guide'; render(true); }); await page.waitForTimeout(200);
  const left = await page.textContent('.dbtn[data-v=guide] .badge');
  ok(left.trim() === '3', `${tag}: the badge is down to 3 (${left.trim()})`);
  await page.screenshot({ path: `tools/shot-guide-${tag}.png` });

  // The guide must never tell a player to use something they have not been given yet.
  const LOCKABLE = { Trade:'trade', Decrees:'decrees', Progress:'progress', 'التجارة':'trade', 'المراسيم':'decrees', 'التقدّم':'progress' };
  for (const jump of [0, 10, 10, 20, 20]) {
    if (jump) await page.evaluate(n => { for (let i = 0; i < n; i++) S = step(S); }, jump);
    await page.evaluate(() => { if (document.querySelector('#modal .scrim')) closeModal(); UI.drawer = 'guide'; render(true); });
    await page.waitForTimeout(150);
    const advice = await page.$eval('.drawer .body .rcard', e => e.innerText);
    const panels = await page.$$eval('.dbtn', e => e.map(x => x.dataset.v));
    const goEl = await page.$('.drawer .body .rcard [data-act=advgo]');
    const go = goEl ? await goEl.getAttribute('data-go') : '';
    const named = Object.keys(LOCKABLE).filter(w => advice.includes(w) && !panels.includes(LOCKABLE[w]));
    const month = await page.evaluate(() => S.t);
    ok(named.length === 0 && (!go || panels.includes(go)),
       `${tag}: month ${month} advice is reachable (${panels.length} panels open${named.length ? ', names locked ' + named.join(',') : ''})`);
  }

  // The first steps used to stop at month 3 and the player was handed a new panel every few months
  // with nothing walking them into it. Each later step appears only once its panel has opened —
  // the same rule the adviser lines follow — and counts itself done from the state, so answering a
  // decision card ticks it exactly as using the panel does.
  const XP = [0, 0, 200, 500, 900, 1400, 2000, 2700, 3400, 4300, 5600, 7800, 11000];
  const stepsAt = async lvl => { await page.evaluate(x => { begin('learner', null); S.xp = x;
      if (document.querySelector('#modal .scrim')) closeModal(); render(true); }, XP[lvl]);
    await page.waitForTimeout(110);
    return page.evaluate(() => guideTasks().map(x => x.id)); };
  const s1 = await stepsAt(1), s7 = await stepsAt(7);
  ok(s1.length === 6, `${tag}: a new player still gets exactly six first steps (${s1.length})`);
  ok(s7.length > s1.length, `${tag}: and more arrive as the game opens up (${s1.length} → ${s7.length} by level 7)`);
  // no step may point at something that has not opened yet
  const bad = await page.evaluate(() => guideTasks().filter(x => x.need && !isOpen(x.need)).map(x => x.id));
  ok(bad.length === 0, `${tag}: no step points at a panel the player has not been given (${bad.join(',') || 'none'})`);
  // and doing the thing ticks the step, however the player did it
  await page.evaluate(() => { S.reserves = 9000; S.pc = 300; render(true); });
  for (const [id, run] of [['infra', 'ACT.infra(S,"grid")'], ['port', 'ACT.portUpgrade(S,"latakia")'],
      ['deal', 'ACT.deal(S,"jordan")'], ['school', 'ACT.service(S,"schools")'], ['factory', 'ACT.invest(S,"textiles")']]) {
    const before = await page.evaluate(i => guideDone(i), id);
    await page.evaluate(r => { eval(r); render(true); }, run);
    const after = await page.evaluate(i => guideDone(i), id);
    ok(!before && after, `${tag}: doing it ticks the "${id}" step off (${before} → ${after})`);
  }
}
await b.close();
if (errs.length) { console.error('\nPAGE ERRORS:\n' + errs.join('\n')); fails += errs.length; }
console.log(fails ? `\n${fails} FAILED` : '\nall guide checks passed');
process.exit(fails ? 1 : 0);
