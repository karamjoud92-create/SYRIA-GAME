// Levels instead of years, the Build panel, wider trade routes, medals, and a mentor that steps back.
// Checked in a real browser, in both languages, because three of the bugs in this project were
// invisible to the node tests and obvious on screen.
import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path';
const file = 'file://' + path.resolve('dist/index.html');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
const errs = []; let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
const clear = p => p.evaluate(() => { if (document.querySelector('#modal .scrim') && typeof closeModal === 'function') closeModal(); render(true); });
const setXp = (p, xp) => p.evaluate(v => { S.xp = v; render(true); }, xp);
const openDrawer = async (p, k, sub) => { await p.evaluate(([d, s]) => { UI.drawer = d; if (s) UI.sub[d] = s; render(true); }, [k, sub || null]); await p.waitForTimeout(220); };

for (const [tag, vp, loc] of [['en', { width:1280, height:900 }, 'en-US'], ['ar', { width:390, height:844 }, 'ar']]) {
  const page = await b.newPage({ viewport:vp, locale:loc });
  page.on('pageerror', e => errs.push(tag + ': ' + e.message));
  page.on('console', m => { const x = m.text(); if (m.type() === 'error' && !/ERR_CERT|fonts\.g/.test(x)) errs.push(tag + ' console: ' + x); });
  await page.goto(file); await page.waitForTimeout(400);
  await page.click('[data-act=newgame][data-v=learner]');
  for (let i = 0; i < 9; i++) { const x = await page.$('.modal .btn.primary'); if (x) await x.click(); await page.waitForTimeout(40); }
  await clear(page);

  // ---------- 1. the clock is a level, not a year ----------
  ok(await page.$('.lvchip'), `${tag}: the dashboard leads with a level`);
  ok(await page.$('.xpwrap'), `${tag}: and a bar showing how far to the next one`);
  const lvTxt = await page.$eval('.turn .yr', e => e.innerText);
  ok(!/20\d\d/.test(lvTxt), `${tag}: no calendar year in the clock (${lvTxt.replace(/\n/g, ' ')})`);
  ok(await page.evaluate(() => levelNow() === 1), `${tag}: a new game starts at level 1`);

  // ---------- 2. experience is earned by doing things ----------
  const xp0 = await page.evaluate(() => S.xp || 0);
  await page.evaluate(() => { S.pc = 200; S.reserves = 4000; ACT.decree(S, 'dialogue'); render(true); });
  ok(await page.evaluate(x => S.xp > x, xp0), `${tag}: taking a decision earns experience`);

  // ---------- 3. crossing a level is announced, and hands something over ----------
  await page.evaluate(() => { S.xp = 195; UI.speed = 0; advance(); });
  await page.waitForTimeout(250);
  const lvup = await page.$('.modal .lvbadge');
  ok(!!lvup, `${tag}: crossing a level stops the clock and says so`);
  const lvBody = lvup ? await page.$eval('.modal', e => e.innerText) : '';
  ok(/\d/.test(lvBody) && lvBody.length > 20, `${tag}: the level-up names the level and what it gave`);
  ok(!/undefined|\{0\}/.test(lvBody), `${tag}: with no missing strings in it`);
  await clear(page);

  // ---------- 4. the Build panel ----------
  await setXp(page, 600);          // level 3: grid / water / housing open, roads and the rest not
  const dock = await page.$$eval('.dbtn', e => e.map(n => n.dataset.v));
  ok(dock.includes('build'), `${tag}: the Build panel is open by level 3 (${dock.length} panels)`);
  await openDrawer(page, 'build');
  const tracks = await page.$$eval('.drawer .dcard', e => e.length);
  const openUp = await page.$$eval('.drawer [data-act=infra]', e => e.map(n => n.dataset.id));
  const locked = await page.$$eval('.drawer .dcard.locked', e => e.length);
  ok(tracks === 7, `${tag}: seven networks in all (${tracks})`);
  ok(openUp.length === 3 && locked === 4, `${tag}: three open at level 3, four still locked (${openUp.join(',')})`);
  ok(await page.$$eval('.drawer .dcard.locked .chip', e => e.some(n => /\d/.test(n.innerText))), `${tag}: a locked network says which level opens it`);
  ok(!(await page.$('.drawer .dcard.locked [data-act=infra]')), `${tag}: and offers no button that would not work`);

  // upgrading it actually builds, and the next level costs more
  const cost1 = await page.evaluate(() => infraCost(S, 'grid').usd);
  await page.evaluate(() => { S.reserves = 6000; render(true); });
  await page.click('.drawer [data-act=infra][data-id=grid]'); await page.waitForTimeout(250);
  ok(await page.evaluate(() => S.pipe.some(q => q.kind === 'infra' && q.id === 'grid')), `${tag}: tapping upgrade starts the work`);
  ok(await page.$('.effect'), `${tag}: and shows what it will do`);
  await page.evaluate(() => { UI.effect = null; for (let i = 0; i < 10; i++) S = step(S); render(true); }); await page.waitForTimeout(200);
  await clear(page); await openDrawer(page, 'build');
  ok(await page.evaluate(() => iLvl(S, 'grid') === 1), `${tag}: the grid reached level 1`);
  const cost2 = await page.evaluate(() => infraCost(S, 'grid').usd);
  ok(cost2 > cost1, `${tag}: level 2 costs more than level 1 ($${cost1}M → $${cost2}M)`);
  ok(await page.$$eval('.drawer .dcard.infra .stars span.on', e => e.length >= 1), `${tag}: the level is shown on the card`);

  // ---------- 5. trade: more countries, and routes that can be widened ----------
  await setXp(page, 2200);          // level 6: routes can be widened, Egypt open, Africa not
  await openDrawer(page, 'trade', 'partners');
  const partners = await page.$$eval('.drawer .dcard', e => e.length);
  ok(partners === 11, `${tag}: eleven countries and blocs (${partners})`);
  const lockedP = await page.$$eval('.drawer .dcard.locked h4', e => e.map(n => n.innerText));
  ok(lockedP.length >= 1, `${tag}: the furthest markets are still locked (${lockedP.length})`);
  await page.evaluate(() => { S.pc = 300; S.reserves = 6000; ACT.deal(S, 'jordan'); render(true); }); await page.waitForTimeout(220);
  ok(await page.$('.drawer [data-act=dealWiden][data-id=jordan]'), `${tag}: a signed route can be widened`);
  await page.click('.drawer [data-act=dealWiden][data-id=jordan]'); await page.waitForTimeout(250);
  ok(await page.evaluate(() => S.deals.jordan.lvl === 2), `${tag}: widening it raised the route to level 2`);
  await clear(page); await openDrawer(page, 'trade', 'partners');
  ok(await page.$$eval('.drawer .dcard.partner .stars span.on', e => e.length >= 2), `${tag}: the route level is shown as loaded trucks`);
  await setXp(page, 12000); await openDrawer(page, 'trade', 'partners');
  ok((await page.$$eval('.drawer .dcard.locked', e => e.length)) === 0, `${tag}: by the top level every market is reachable`);

  // ---------- 6. medals ----------
  await openDrawer(page, 'progress', 'medals');
  const medals = await page.$$eval('.medal', e => e.length);
  const earned = await page.$$eval('.medal.on', e => e.length);
  ok(medals >= 20, `${tag}: a shelf of medals to collect (${medals})`);
  ok(earned >= 1, `${tag}: the ones already earned are lit (${earned})`);
  const medTxt = await page.$eval('.drawer .body', e => e.innerText);
  ok(!/undefined|\{0\}/.test(medTxt), `${tag}: every medal has real text in this language`);

  // ---------- 7. the mentor steps back ----------
  await clear(page);
  const counts = await page.evaluate(() => {
    S.pc = 300; S.reserves = 9000; S.treasury = 60; S.policy.print = 30;
    const out = {};
    for (const m of ['0', '1', '2', '3']){ S.flags.mentorSet = +m; UI.decSkip = {}; out[m] = decisionDeck().length; }
    S.flags.mentorSet = 'auto'; return out;
  });
  ok(counts['0'] >= counts['1'] && counts['1'] >= counts['2'] && counts['2'] >= counts['3'],
     `${tag}: the game asks less as the player needs it less (${counts['0']}→${counts['1']}→${counts['2']}→${counts['3']})`);
  ok(counts['0'] > counts['3'], `${tag}: and noticeably less at the far end (${counts['0']} vs ${counts['3']})`);
  const optRange = await page.evaluate(() => { S.flags.mentorSet = 0; UI.decSkip = {}; const d = decisionDeck();
    return { n:d.length, min:Math.min(...d.map(x => x.opts.length)), max:Math.max(...d.map(x => x.opts.length)),
      two:d.filter(x => x.opts.length >= 2).length }; });
  ok(optRange.max <= 3, `${tag}: no card is a menu (at most ${optRange.max} answers)`);
  ok(optRange.two >= optRange.n - 1, `${tag}: all but at most one card is a real either/or (${optRange.two}/${optRange.n})`);

  // the control is in the Guide, and it works
  await openDrawer(page, 'guide');
  ok(await page.$('.drawer [data-act=mentor]'), `${tag}: the player can set this themselves`);
  await page.click('.drawer [data-act=mentor][data-v="3"]'); await page.waitForTimeout(200);
  ok(await page.evaluate(() => S.flags.mentorSet === 3 && mentorLevel() === 3), `${tag}: and turning it off sticks`);
  await page.click('.drawer [data-act=mentor][data-v="auto"]'); await page.waitForTimeout(200);
  ok(await page.evaluate(() => S.flags.mentorSet === 'auto'), `${tag}: and can be handed back to the game`);

  // ---------- 8. a save survives a round trip ----------
  await clear(page);
  ok(await page.evaluate(() => { const c = saveCode(); const before = { xp:Math.round(S.xp), grid:iLvl(S, 'grid'), jordan:S.deals.jordan.lvl };
    return loadCode(c) && Math.round(S.xp) === before.xp && iLvl(S, 'grid') === before.grid && S.deals.jordan.lvl === before.jordan; }),
     `${tag}: levels, networks and routes survive a save code`);

  await page.screenshot({ path:`tools/shot-levels-${tag}.png`, fullPage:false });
  await page.close();
}
await b.close();
if (errs.length) { console.error('\nPAGE ERRORS:\n' + errs.join('\n')); fails += errs.length; }
console.log(fails ? `\n${fails} FAILED` : '\nall level checks passed');
process.exit(fails ? 1 : 0);
