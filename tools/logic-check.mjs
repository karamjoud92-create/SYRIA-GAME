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
  await page.screenshot({ path: `tools/shot-logic-${tag}.png` });
  await page.close();
}
await b.close();
if (errs.length) { console.error('\nPAGE ERRORS:\n' + errs.join('\n')); fails += errs.length; }
console.log(fails ? `\n${fails} FAILED` : '\nall logic checks passed');
process.exit(fails ? 1 : 0);
