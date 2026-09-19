// The casual loop: the game asks, you tap, something real happens.
import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path';
const file = 'file://' + path.resolve('dist/index.html');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
const errs = []; let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };

for (const [tag, vp, loc] of [['en', { width: 1280, height: 880 }, 'en-US'], ['ar', { width: 390, height: 844 }, 'ar']]) {
  const page = await b.newPage({ viewport: vp, locale: loc });
  page.on('pageerror', e => errs.push(tag + ': ' + e.message));
  page.on('console', m => { const x = m.text(); if (m.type() === 'error' && !/ERR_CERT|fonts\.g/.test(x)) errs.push(tag + ' console: ' + x); });
  await page.goto(file); await page.waitForTimeout(400);
  await page.click('[data-act=newgame][data-v=learner]');
  for (let i = 0; i < 9; i++) { const x = await page.$('.modal .btn.primary'); if (x) await x.click(); await page.waitForTimeout(40); }
  await page.evaluate(() => { if (document.querySelector('#modal .scrim')) closeModal(); render(true); });
  await page.waitForTimeout(300);

  ok(await page.$('.deck'), `${tag}: the game asks a question without being asked`);
  const opts = await page.$$eval('.deck [data-act=decPick]', e => e.length);
  ok(opts >= 1 && opts <= 3, `${tag}: it offers ${opts} answers, not a menu`);
  const card = await page.$('.deck'); const box = await card.boundingBox();
  ok(box.width <= vp.width && box.y + box.height <= vp.height, `${tag}: the card fits the screen (${Math.round(box.width)}px)`);

  // every option must be affordable and unlocked — the card must never offer what you cannot do
  const affordable = await page.evaluate(() => UI.deck[0].opts.length > 0 && !document.querySelector('.deck .opt[disabled]'));
  ok(affordable, `${tag}: every answer offered is one the player can actually take`);

  // tapping does something real in the engine
  const before = await page.evaluate(() => ({ proj: Object.values(S.provs).filter(p => p.project).length, usd: Math.round(S.reserves) }));
  await page.click('.deck [data-act=decPick][data-i="0"]'); await page.waitForTimeout(350);
  const after = await page.evaluate(() => ({ proj: Object.values(S.provs).filter(p => p.project).length, usd: Math.round(S.reserves) }));
  ok(after.proj > before.proj || after.usd !== before.usd, `${tag}: tapping an answer changes the country (${before.usd} → ${after.usd})`);
  ok(await page.$('.effect'), `${tag}: and shows what it did, right now and over 3 months`);

  // the next question arrives on its own
  await page.evaluate(() => { UI.effect = null; renderEffect(); render(true); }); await page.waitForTimeout(300);
  const q2 = await page.$eval('.deck h3', e => e.textContent).catch(() => null);
  ok(!!q2, `${tag}: the next question arrives by itself (${(q2 || '').slice(0, 40)})`);

  // "not now" moves on and does not come straight back
  await page.click('.deck [data-act=decLater]'); await page.waitForTimeout(300);
  const q3 = await page.$eval('.deck h3', e => e.textContent).catch(() => null);
  ok(q3 !== q2, `${tag}: "not now" moves on to something else`);

  // it gets out of the way when you are reading a panel
  await page.evaluate(() => { UI.drawer = 'policy'; render(true); }); await page.waitForTimeout(200);
  ok(!(await page.$('.deck')), `${tag}: the card steps aside when a panel is open`);
  await page.evaluate(() => { UI.drawer = null; render(true); }); await page.waitForTimeout(200);

  // and it can be dismissed
  await page.click('.deck .close'); await page.waitForTimeout(200);
  ok(!(await page.$('.deck')), `${tag}: it can be closed`);

  await page.screenshot({ path: `tools/shot-decide-${tag}.png` });
  await page.close();
}
await b.close();
if (errs.length) { console.error('\nPAGE ERRORS:\n' + errs.join('\n')); fails += errs.length; }
console.log(fails ? `\n${fails} FAILED` : '\nall decision checks passed');
process.exit(fails ? 1 : 0);
