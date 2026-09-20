// Does the game actually start small and open up? And do the new panels work?
import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path';
const file = 'file://' + path.resolve('dist/index.html');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
const errs = []; let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
const clear = p => p.evaluate(() => { if (document.querySelector('#modal .scrim') && typeof closeModal === 'function') closeModal(); });
const jump = (p, months) => p.evaluate(m => { for (let i = 0; i < m; i++) S = step(S); render(true); }, months);

for (const [tag, loc] of [['en', 'en-US'], ['ar', 'ar']]) {
  const page = await b.newPage({ viewport: { width: 1280, height: 880 }, locale: loc });
  page.on('pageerror', e => errs.push(tag + ': ' + e.message));
  page.on('console', m => { const x = m.text(); if (m.type() === 'error' && !/ERR_CERT|fonts\.g/.test(x)) errs.push(tag + ' console: ' + x); });
  await page.goto(file); await page.waitForTimeout(400);
  await page.click('[data-act=newgame][data-v=learner]');
  for (let i = 0; i < 8; i++) { const x = await page.$('.modal .btn.primary'); if (x) await x.click(); await page.waitForTimeout(40); }
  await clear(page);

  // --- month 0: a small game ---
  const dock0 = await page.$$eval('.dbtn', e => e.map(n => n.dataset.v));
  ok(dock0.length === 4 && ['guide','policy','money','people'].every(k => dock0.includes(k)),
     `${tag}: month 0 offers 4 panels, not 8 (${dock0.join(',')})`);
  const layers0 = await page.$$eval('.layers button', e => e.length);
  ok(layers0 === 1, `${tag}: month 0 has one map layer (${layers0})`);
  await page.click('.dbtn[data-v=policy]'); await page.waitForTimeout(200);
  const dials0 = await page.$$eval('.drawer .pol h3', e => e.length);
  ok(dials0 === 3, `${tag}: month 0 has 3 policy dials, not 9 (${dials0})`);
  await clear(page);

  // --- the stages open up ---
  await jump(page, 8); await clear(page);
  const dock1 = await page.$$eval('.dbtn', e => e.map(n => n.dataset.v));
  ok(dock1.includes('decrees'), `${tag}: decrees open in the first 12 months (${dock1.length} panels)`);
  await jump(page, 10); await clear(page);
  const dock2 = await page.$$eval('.dbtn', e => e.map(n => n.dataset.v));
  ok(dock2.includes('trade') && dock2.includes('progress'), `${tag}: trade and progress open by month 24 (${dock2.length} panels)`);
  await jump(page, 20); await clear(page);
  const dock3 = await page.$$eval('.dbtn', e => e.map(n => n.dataset.v));
  const layers3 = await page.$$eval('.layers button', e => e.length);
  ok(dock3.length === 8 && layers3 === 4, `${tag}: by month 48 the whole game is open (${dock3.length} panels, ${layers3} layers)`);

  // --- schools, clinics, universities ---
  await page.evaluate(() => { UI.drawer = 'people'; UI.sub.people = 'services'; render(true); }); await page.waitForTimeout(250);
  const svc = await page.$$eval('.drawer .dcard [data-act=svc]', e => e.map(n => n.dataset.id));
  ok(svc.includes('schools') && svc.includes('clinics'), `${tag}: schools and clinics can be built (${svc.join(',')})`);
  await page.evaluate(() => { S.reserves = 900; render(true); });
  await page.click('[data-act=svc][data-id=schools]'); await page.waitForTimeout(200); await clear(page);
  ok(await page.evaluate(() => S.pipe.some(p => p.kind === 'svc' && p.id === 'schools')), `${tag}: a wave of schools is under construction`);
  await jump(page, 6);
  ok(await page.evaluate(() => S.svc.schools >= 1), `${tag}: the schools opened`);

  // --- population and classes ---
  await page.evaluate(() => { UI.drawer = 'people'; UI.sub.people = 'pop'; render(true); }); await page.waitForTimeout(250);
  const segs = await page.$$eval('.popseg', e => e.map(n => Math.round(parseFloat(n.style.width))));
  ok(segs.length === 3 && Math.abs(segs.reduce((a, c) => a + c, 0) - 100) <= 2, `${tag}: rich / getting by / poor add up (${segs.join('/')})`);
  const popTxt = await page.textContent('.drawer .rcard .rv');
  ok(/\d/.test(popTxt), `${tag}: population size is shown (${popTxt.trim()})`);

  // --- four advisors, and a way to shut them up ---
  await clear(page);
  const faces = await page.$$eval('.portrait', e => e.length);
  ok(faces === 4, `${tag}: four advisors by month 48 (${faces})`);
  await page.click('.advhide'); await page.waitForTimeout(200);
  ok(!(await page.$('.bubble')), `${tag}: the hide button silences them`);

  // --- supply sectors exist ---
  await page.evaluate(() => { UI.drawer = 'trade'; UI.sub.trade = 'resources'; render(true); }); await page.waitForTimeout(250);
  const invMid = await page.$$eval('.dcard.inv [data-act=invest]', e => e.map(n => n.dataset.id));
  ok(!invMid.includes('logistics'), `${tag}: supply is still closed before the last stage (${invMid.length} sectors)`);
  await jump(page, 10); await clear(page);   // past the last stage
  await page.evaluate(() => { UI.drawer = 'trade'; UI.sub.trade = 'resources'; render(true); }); await page.waitForTimeout(250);
  const inv = await page.$$eval('.dcard.inv [data-act=invest]', e => e.map(n => n.dataset.id));
  ok(['logistics','coldchain','packaging'].every(k => inv.includes(k)), `${tag}: supply sectors open last (${inv.length} sectors in all)`);

  // --- and no tildes anywhere ---
  const hud = await page.$eval('#hud', e => e.innerText);
  ok(!hud.includes('~'), `${tag}: no "~" left on the dashboard`);
  await page.screenshot({ path: `tools/shot-onboard-${tag}.png` });
}
await b.close();
if (errs.length) { console.error('\nPAGE ERRORS:\n' + errs.join('\n')); fails += errs.length; }
console.log(fails ? `\n${fails} FAILED` : '\nall onboarding checks passed');
process.exit(fails ? 1 : 0);
