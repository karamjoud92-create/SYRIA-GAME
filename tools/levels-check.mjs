// Levels are the spine of the game: the town hall, for a country. This drives the whole claim
// in a real browser — that the game opens up because you EARNED it and not because time passed,
// that a ceiling exists and lifts, that nothing is capped forever, that a player is always told
// what to do next, and that there is finally something to win.
import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path';
const file = 'file://' + path.resolve('dist/index.html');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
const clear = p => p.evaluate(() => { if (document.querySelector('#modal .scrim') && typeof closeModal === 'function') closeModal(); });

for (const [tag, loc] of [['en', 'en-US'], ['ar', 'ar']]) {
  const errs = [];
  const page = await b.newPage({ viewport: { width: 1320, height: 900 }, locale: loc });
  page.on('pageerror', e => errs.push(tag + ': ' + e.message));
  page.on('console', m => { const x = m.text(); if (m.type() === 'error' && !/ERR_CERT|fonts\.g/.test(x)) errs.push(tag + ' console: ' + x); });
  await page.goto(file); await page.waitForTimeout(400);
  await page.click('[data-act=newgame][data-v=learner]');
  for (let i = 0; i < 8; i++) { const x = await page.$('.modal .btn.primary'); if (x) await x.click(); await page.waitForTimeout(40); }
  await clear(page);

  // 1. The player is TOLD what the country is working towards, from the first minute, in the
  //    one panel that is never closed. A gate nobody can see is just a dead end.
  await page.evaluate(() => { UI.drawer = 'guide'; render(true); }); await page.waitForTimeout(250);
  const rows = await page.$$eval('.drawer .lvlstep b', e => e.map(n => n.textContent.trim()));
  ok(rows.length >= 2, `${tag}: the Guide lists this level's targets (${rows.length})`);
  ok(rows.every(r => r.length > 6 && !/need_|undefined|\{0\}/.test(r)),
    `${tag}: written out, not raw keys ("${(rows[0] || '').slice(0, 42)}")`);
  const prog = await page.$eval('.drawer .lvlstep p', e => e.textContent.trim());
  ok(/\d/.test(prog) && !/undefined/.test(prog), `${tag}: each target says where you are now ("${prog.slice(0, 40)}")`);

  // 2. TIME buys nothing. This is the whole point of the change: the old game handed over trade
  //    at month 15 whether or not the player had done anything at all.
  const waited = await page.evaluate(() => {
    const before = document.querySelectorAll('.dbtn').length;
    for (let i = 0; i < 90; i++) S = step(S);          // seven and a half years of nothing
    render(true);
    return { before, after: document.querySelectorAll('.dbtn').length, lvl: S.lvl, t: S.t };
  });
  await page.waitForTimeout(200);
  ok(waited.after === waited.before && waited.lvl === 1,
    `${tag}: ${(waited.t / 12).toFixed(0)} years of doing nothing opens nothing (still ${waited.after} panels, level ${waited.lvl})`);

  // 3. Meeting the targets starts a national plan, and the plan — not the targets — lands the
  //    level. Slipping back mid-build must not take it away.
  const plan = await page.evaluate(() => {
    S = startGame(7, 'learner'); S.history = [snap(S)]; S.log = [];
    S.provs.aleppo.project = true; PROVS.forEach(p => { S.provs[p.id].u = 30; });
    let started = null;
    for (let i = 0; i < 3; i++){ S = step(S); if (!started) started = levelPlan(S); }
    const midway = levelPlan(S) ? { due: levelPlan(S).due, to: levelPlan(S).to } : null;
    PROVS.forEach(p => { S.provs[p.id].u = 80; });     // everything falls apart mid-plan
    let landed = 0;
    for (let i = 0; i < 12; i++){ S = step(S); if (S.lvl > 1){ landed = S.lvl; break; } }
    return { started: !!started, midway, landed };
  });
  ok(plan.started && plan.midway, `${tag}: meeting every target starts a national plan for level ${plan.midway && plan.midway.to}`);
  ok(plan.landed === 2, `${tag}: and the plan finishes even if the country slips back while it builds (level ${plan.landed})`);

  // 4. The ceiling. A sector can run two levels ahead of the country and no further, however
  //    much money is in the bank — and the refusal is on the card, never a dead click.
  const cap = await page.evaluate(() => {
    S = startGame(7, 'learner'); S.history = [snap(S)]; S.log = [];
    S.lvl = 5; S.reserves = 9e9; S.treasury = 9e5; S.invests.textiles = invCap(S);
    UI.drawer = 'trade'; UI.sub.trade = 'resources'; render(true);
    const card = [...document.querySelectorAll('.dcard.inv')].find(e => e.querySelector('[data-id=textiles]'));
    return { cap: invCap(S), refused: ACT.invest(S, 'textiles') === false,
      btnDead: !!(card && card.querySelector('[data-act=invest]') || {}).disabled,
      why: card && card.querySelector('.why') && card.querySelector('.why').textContent.trim() };
  });
  await page.waitForTimeout(200);
  ok(cap.refused, `${tag}: a sector stops at the country's level + 2 (${cap.cap}), whatever it can afford`);
  ok(cap.btnDead && cap.why && cap.why.length > 10 && !/undefined/.test(cap.why),
    `${tag}: and the card says why rather than dying on the click ("${(cap.why || '').slice(0, 44)}")`);

  // 5. ...and the ceiling LIFTS. Nothing is capped forever, because the ladder never ends.
  const lift = await page.evaluate(() => {
    const before = invCap(S); S.lvl += 1;
    return { before, after: invCap(S), allowed: ACT.invest(S, 'textiles') !== false };
  });
  ok(lift.after === lift.before + 1 && lift.allowed,
    `${tag}: one more level lifts it (${lift.before} to ${lift.after}) and the next one can be built`);

  // 6. Panels arrive with levels, in the order the checklist needs them: you cannot be asked
  //    for a second berth before ports exist.
  const gates = await page.evaluate(() => {
    const at = {};
    for (let n = 1; n <= 10; n++){ S.lvl = n; render(true); at[n] = [...document.querySelectorAll('.dbtn')].map(e => e.dataset.v); }
    return { l1:at[1].length, trade4:at[4].includes('trade'), tradeNot3:!at[3].includes('trade'), all:at[7].length, open:OPEN_AT };
  });
  await page.waitForTimeout(200);
  ok(gates.l1 === 4 && gates.all === 8, `${tag}: 4 panels at level 1, all 8 by level 7`);
  ok(gates.trade4 && gates.tradeNot3, `${tag}: trade arrives exactly at level 4`);
  // every target must be reachable with what earlier levels handed over
  const chain = await page.evaluate(() => {
    const bad = [];
    for (let n = 1; n < LEVELS.length - 1; n++){
      const needs = LEVELS[n + 1].need.map(d => d.id);
      if (needs.includes('berth') && OPEN_AT.ports > n) bad.push(`L${n + 1} wants a berth before ports open`);
      if (needs.includes('mills') && OPEN_AT.sectors > n) bad.push(`L${n + 1} wants mills before sectors open`);
      if (needs.includes('edu') && OPEN_AT.services > n) bad.push(`L${n + 1} wants schooling before services open`);
      if (needs.includes('health') && OPEN_AT.services > n) bad.push(`L${n + 1} wants health before services open`);
    }
    return bad;
  });
  ok(chain.length === 0, `${tag}: no level asks for something it has not been given yet (${chain.join('; ') || 'chain intact'})`);

  // 6b. Every gift a level promises must be a written name in BOTH languages. Four of them were
  //     raw keys the first time this panel drew — "polCapexName" is not a thing to look forward to.
  const giftWords = await page.evaluate(() => {
    const bad = [];
    for (let n = 1; n < LEVEL_GIFTS.length; n++)
      for (const k of (LEVEL_GIFTS[n] || [])){ const v = t(k); if (!v || v === k) bad.push(`L${n}:${k}`); }
    return bad;
  });
  ok(giftWords.length === 0, `${tag}: every unlock a level promises has a name (${giftWords.join(', ') || 'all written'})`);

  // 6c. The level block in the corner IS the way in. It used to open the score panel.
  await page.evaluate(() => { S.lvl = 3; UI.drawer = null; render(true); }); await page.waitForTimeout(200);
  const block = await page.evaluate(() => {
    const e = document.querySelector('.turn.lvl');
    return e && { act: e.dataset.act, goal: (e.querySelector('.lvgoal') || {}).textContent || '' };
  });
  ok(block && block.act === 'levels', `${tag}: tapping the level opens the ladder, not the score panel (${block && block.act})`);
  ok(block && /\d/.test(block.goal), `${tag}: and the corner says how close the next level is ("${(block.goal || '').trim()}")`);
  await page.click('.turn.lvl'); await page.waitForTimeout(350);
  const panel = await page.evaluate(() => (document.querySelector('#modal') || { innerText:'' }).innerText);
  ok(panel.length > 200 && !/undefined|\{0\}/.test(panel), `${tag}: the ladder panel opens and is written (${panel.length} chars)`);
  ok((panel.match(/\n/g) || []).length > 12, `${tag}: it shows the whole road, not just this rung`);
  await clear(page);

  // 7. There is something to WIN. The summit names itself, shows what was built, and says the
  //    game carries on — the complaint was "you lose but you never win".
  await page.evaluate(() => { S.lvl = LEVEL_MAX; showSummit(); }); await page.waitForTimeout(300);
  const win = await page.evaluate(() => (document.querySelector('#modal') || { innerText:'' }).innerText);
  ok(win.length > 120, `${tag}: reaching the summit shows a victory screen (${win.length} chars)`);
  ok(!/undefined|\{0\}|summit/i.test(win.replace(/Syria rebuilt|سوريا/gi, '')),
    `${tag}: written out, not raw keys`);
  ok(tag === 'en' ? /rebuilt/i.test(win) : /[؀-ۿ]/.test(win), `${tag}: in the player's language`);
  await clear(page);

  // 8. ...and it is not an ending. The ladder keeps going past the summit, and keeps asking
  //    for more, so there is never a dead end to hit.
  const past = await page.evaluate(() => {
    S.lvl = LEVEL_MAX; const a = levelNeeds(S).map(d => `${d.id}${d.want}`);
    S.lvl = LEVEL_MAX + 3; const c = levelNeeds(S).map(d => `${d.id}${d.want}`);
    return { a, c, capTop: invCap(S), want: LEVEL_MAX + 3 + 2, same: a.join() === c.join() };
  });
  ok(past.a.length > 0 && !past.same, `${tag}: past the summit the targets keep rising (${past.a.join(' ')} then ${past.c.join(' ')})`);
  ok(past.capTop === past.want, `${tag}: and the ceiling keeps rising with them (${past.capTop})`);

  // 9. A level landing announces itself and says what it opened and what is next.
  await page.evaluate(() => { S.lvl = 4; showLevelUp(4); }); await page.waitForTimeout(300);
  const up = await page.evaluate(() => (document.querySelector('#modal') || { innerText:'' }).innerText);
  ok(/\d/.test(up) && up.length > 90 && !/undefined|\{0\}/.test(up), `${tag}: the level-up screen is written (${up.length} chars)`);
  ok(/4/.test(up) && /5/.test(up), `${tag}: it names the level reached and the one being worked towards`);
  await clear(page);

  // 10. No emoji anywhere on screen. They are not a design system: the same glyph is a different
  //     picture on every platform, several render as tofu where a font is missing, and none of
  //     them can take the page's colour. Everything visual is an inline svg from ICON.
  const strays = await page.evaluate(() => {
    const re = /[\u{1F000}-\u{1FAFF}\u{2300}-\u{23FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;
    const hits = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())){
      const p = n.parentElement;
      if (!p || p.closest('script, style')) continue;
      if (re.test(n.nodeValue)) hits.push((p.className || p.tagName) + ': ' + n.nodeValue.trim().slice(0, 30));
    }
    return hits.slice(0, 6);
  });
  ok(strays.length === 0, `${tag}: no emoji left on screen (${strays.join(' | ') || 'all icons'})`);
  const svgs = await page.evaluate(() => document.querySelectorAll('svg.i').length);
  ok(svgs > 20, `${tag}: and the icons are really there (${svgs} inline svgs)`);
  // every screen has a way out, except the two you are meant to answer
  await page.evaluate(() => { UI.drawer = null; render(true); });
  await page.click('[data-act=menu]'); await page.waitForTimeout(250);
  ok(await page.$('#modal .mclose'), `${tag}: the menu has an exit`);
  await page.click('#modal .mclose'); await page.waitForTimeout(200);
  ok(!(await page.$('#modal .scrim')), `${tag}: and it closes`);
  await page.evaluate(() => { S.event = EVENTS[0].id; showEvent(); }); await page.waitForTimeout(250);
  ok(!(await page.$('#modal .mclose')), `${tag}: a crisis has none — answering it is the game`);
  await clear(page);

  if (errs.length) { console.error(`\n${tag} PAGE ERRORS:\n` + errs.join('\n')); fails += errs.length; }
  await page.screenshot({ path: `tools/shot-levels-${tag}.png` });
  await page.close();
}
await b.close();
console.log(fails ? `\n${fails} FAILED` : '\nall level checks passed');
process.exit(fails ? 1 : 0);
