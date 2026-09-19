// Drives the new economy in a real browser: sectors, jobs, the rising bar.
import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path';
const file = 'file://' + path.resolve('dist/index.html');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
const errs = []; let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
const clear = p => p.evaluate(() => { if (document.querySelector('#modal .scrim') && typeof closeModal === 'function') closeModal(); });

for (const [tag, loc] of [['en', 'en-US'], ['ar', 'ar']]) {
  const page = await b.newPage({ viewport: { width: 1280, height: 860 }, locale: loc });
  page.on('pageerror', e => errs.push(tag + ': ' + e.message));
  page.on('console', m => { const x = m.text(); if (m.type() === 'error' && !/ERR_CERT|fonts\.g/.test(x)) errs.push(tag + ' console: ' + x); });
  await page.goto(file); await page.waitForTimeout(400);
  await page.click('[data-act=newgame][data-v=learner]');
  for (let i = 0; i < 8; i++) { const x = await page.$('.modal .btn.primary'); if (x) await x.click(); await page.waitForTimeout(50); }
  await clear(page);

  // the work number is on the dashboard
  const jb = await page.$eval('[data-act=gloss][data-k=jobs] .num', e => e.textContent);
  if (tag === 'en') ok(/^~?\d+%$/.test(jb), `work is a headline number (${jb} — '~' until the statistics office exists)`);

  // all twelve sectors are offered, split into two groups
  await page.click('.dbtn[data-v=trade]'); await page.waitForTimeout(250);
  const cards = await page.$$eval('.dcard.inv [data-act=invest]', e => e.map(n => n.dataset.id));
  const want = ['textiles','food','pharma','cement','telecom','tourism','oilwells','refinery','gasfield','offshore','phosphate','farm'];
  if (tag === 'en') ok(want.every(w => cards.includes(w)), `all 12 sectors offered (${cards.length} buyable)`);
  const heads = await page.$$eval('.drawer .body h3.bh', e => e.map(n => n.textContent.trim()));
  if (tag === 'en') ok(heads.some(h => /Build an economy/.test(h)) && heads.some(h => /Dig it up/.test(h)), `industry and extraction are separate groups`);

  // buy a factory and watch it finish
  await page.evaluate(() => { S.reserves = 900; });
  await page.click('[data-act=invest][data-id=textiles]'); await page.waitForTimeout(200);
  await clear(page);
  const queued = await page.evaluate(() => S.pipe.some(p => p.kind === 'invest' && p.id === 'textiles'));
  if (tag === 'en') ok(queued, 'a textile mill is under construction');
  await page.evaluate(() => { for (let i = 0; i < 10; i++) { S = step(S); } render(true); });
  await page.waitForTimeout(200);
  const lvl = await page.evaluate(() => S.ind.textiles);
  if (tag === 'en') ok(lvl >= 1, `the mill opened (level ${lvl})`);

  // the work map layer
  await clear(page);
  await page.click('[data-act=layer][data-v=jobs]'); await page.waitForTimeout(250);
  const lab = await page.$$eval('svg.map text.lval', e => e.slice(0, 3).map(n => n.textContent));
  if (tag === 'en') ok(lab.every(x => /%/.test(x)), `the map shows work per province (${lab.join(' ')})`);

  // the bar is visible to the player
  await page.evaluate(() => { S.bar = 0.7; render(true); });
  await page.click('.dbtn[data-v=progress]'); await page.waitForTimeout(250);
  const barTxt = await page.textContent('.drawer .body .rcard .rv');
  ok(/70/.test(barTxt), `${tag}: the bar is shown to the player (${barTxt.trim()})`);

  // nothing left over from landmines
  const body = await page.evaluate(() => document.body.innerText);
  ok(!/landmine|Mined|ألغام/i.test(body), `${tag}: no landmines left in the interface`);
  await page.screenshot({ path: `tools/shot-econ-${tag}.png` });
}
await b.close();
if (errs.length) { console.error('\nPAGE ERRORS:\n' + errs.join('\n')); fails += errs.length; }
console.log(fails ? `\n${fails} FAILED` : '\nall economy checks passed');
process.exit(fails ? 1 : 0);
