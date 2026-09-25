// Real-time play: one game month an hour, the country keeps running while the tab is shut,
// and nothing is decided for the player while they are gone.
import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path';
const file = 'file://' + path.resolve('dist/index.html');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
const errs = []; let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };

for (const [tag, loc] of [['en', 'en-US'], ['ar', 'ar']]) {
  const page = await b.newPage({ viewport: { width: 1400, height: 900 }, locale: loc });
  page.on('pageerror', e => errs.push(tag + ': ' + e.message));
  page.on('console', m => { const x = m.text(); if (m.type() === 'error' && !/ERR_CERT|fonts\.g/.test(x)) errs.push(tag + ' console: ' + x); });
  await page.goto(file); await page.waitForTimeout(400);

  // 1. the player is offered a way to play, and it is not decided for them
  const modes = await page.$$eval('.opt.mode', e => e.map(n => n.textContent.trim().slice(0, 30)));
ok(modes.length === 0, `${tag}: the start screen no longer asks how you want the clock to run (${modes.length} pickers)`);
  await page.evaluate(() => { UI.live = true; });
  await page.click('[data-act=newgame][data-v=learner]');
  for (let i = 0; i < 8; i++) { const x = await page.$('.modal .btn.primary'); if (x) await x.click(); await page.waitForTimeout(50); }
  await page.evaluate(() => { if (document.querySelector('#modal .scrim')) closeModal(); });
  const live = await page.evaluate(() => ({ live: !!S.live, at: !!S.realAt, t: S.t }));
  ok(live.live && live.at && live.t === 0, `${tag}: a live game starts at month 0 with a real timestamp`);
  ok(await page.$('.liveclock') !== null && await page.$('.clock .cbtn') === null,
    `${tag}: the dock shows when the next month lands, not speed buttons`);
  const clockTxt = await page.textContent('.liveclock');
  ok(/\d/.test(clockTxt), `${tag}: and it counts down (${clockTxt.replace(/\s+/g, ' ').trim()})`);

  // 3. go away for seven hours and come back
  await page.evaluate(() => { S.realAt = Date.now() - 7 * 3600 * 1000; persist(); });
  await page.reload(); await page.waitForTimeout(700);
  const after = await page.evaluate(() => ({ t: S.t, pending: (S.pending || []).length, modal: document.querySelector('#modal').innerText }));
  ok(after.t === 7, `${tag}: seven hours away is seven months of country (month ${after.t})`);
  ok(/\d/.test(after.modal) && after.modal.length > 40, `${tag}: and you are told what happened while you were gone`);
  ok(tag === 'en' ? /While you were away/i.test(after.modal) : /غائباً/.test(after.modal), `${tag}: in the player's language`);

  // 4. nothing was decided without them
  const noAuto = await page.evaluate(() => {
    const log = (S.log || []).filter(l => l[1] === 'event');
    return { autoAnswered: log.length, queued: (S.pending || []).length };
  });
  ok(noAuto.autoAnswered === 0, `${tag}: no crisis was answered on the player's behalf (${noAuto.autoAnswered} auto-decisions)`);
  if (after.pending) {
    await page.click('[data-act=awayGo]'); await page.waitForTimeout(300);
    const ev = await page.evaluate(() => ({ ev: S.event, opts: document.querySelectorAll('#modal [data-act=choose]').length }));
    ok(!!ev.ev && ev.opts > 1, `${tag}: the crisis that fired while away is put to them now (${ev.opts} options)`);
  } else ok(true, `${tag}: no crisis fired in those seven months, nothing queued`);

  // 5. a very long absence does not simulate more than a presidency
  await page.evaluate(() => { if (document.querySelector('#modal .scrim')) closeModal(); S.pending = []; S.realAt = Date.now() - 4000 * 3600 * 1000; persist(); });
  await page.reload(); await page.waitForTimeout(900);
  const far = await page.evaluate(() => ({ t: S.t, over: !!S.over }));
  ok(far.t <= 240 && far.over, `${tag}: a year away ends the presidency rather than running forever (month ${far.t})`);

  await page.screenshot({ path: `tools/shot-live-${tag}.png` });
  await page.close();
}
await b.close();
if (errs.length) { console.error('\nPAGE ERRORS:\n' + errs.join('\n')); fails += errs.length; }
console.log(fails ? `\n${fails} FAILED` : '\nall live-play checks passed');
process.exit(fails ? 1 : 0);
