// Independence, end to end in a real browser: the player can see it every month, find out
// what it is, watch it cost them something when they sell it, and buy it back with money.
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

  // 1. it is on the dashboard from month 0 — the whole point of this change
  const chip = await page.$('[data-act=gloss][data-k=sov]');
  ok(!!chip, `${tag}: independence is a dashboard number from month 0`);
  const v0 = await page.$eval('[data-act=gloss][data-k=sov] .num', e => e.textContent.trim());
  ok(v0 === '60', `${tag}: it reads 60 at the start (${v0})`);

  // 2. tapping it explains itself, in this language, like every other number
  await chip.click(); await page.waitForTimeout(200);
  const gl = await page.evaluate(() => document.querySelector('#modal').innerText);
  ok(gl.length > 80, `${tag}: tapping it opens an explanation (${gl.split('\n')[0].slice(0, 34)})`);
  ok(tag === 'en' ? /independence/i.test(gl) : /الاستقلال/.test(gl), `${tag}: the explanation is in the player's language`);
  await clear(page); await page.waitForTimeout(150);

  // 3. selling it costs something you can feel, not just score. Two identical countries,
  //    six months apart only in how much of themselves they have signed away.
  const ab = await page.evaluate(() => {
    let a = clone(S), z = clone(S); z.sov = 10;
    for (let i = 0; i < 6; i++){ a = step(a); z = step(z); }
    return { hiTrust:a.trustTarget, loTrust:z.trustTarget, hiPC:a.pc, loPC:z.pc,
      cut:(z.last.ledger.usd.find(r => r[0] === 'foreignCut') || [0, 0])[1], angry:z.last.why.angerParts.foreign };
  });
  ok(ab.loTrust < ab.hiTrust - 4, `${tag}: giving the country away drags trust down (${ab.hiTrust.toFixed(0)} → ${ab.loTrust.toFixed(0)})`);
  ok(ab.loPC < ab.hiPC - 0.4, `${tag}: and your decrees carry less weight (influence ${ab.hiPC.toFixed(1)} → ${ab.loPC.toFixed(1)})`);
  ok(ab.cut < 0, `${tag}: foreign partners take a cut of exports ($${Math.abs(ab.cut).toFixed(0)}M a half-year)`);
  ok(ab.angry > 2, `${tag}: and provinces get angrier (+${ab.angry.toFixed(1)})`);
  await page.evaluate(() => { S.sov = 10; render(true); });
  await clear(page);

  // 4. the score panel shows all six parts, any month, not once every five years
  await page.evaluate(() => { for (let i = 0; i < 20; i++) S = step(S); render(true); });
  await clear(page);
  await page.click('.scorebadge'); await page.waitForTimeout(250);
  const rows = await page.$$eval('.drawer .scores > div', e => e.map(n => n.textContent.trim()));
  ok(rows.length === 6, `${tag}: the score panel lists all six parts (${rows.length})`);
  ok(rows.some(r => tag === 'en' ? /Independence/.test(r) : /الاستقلال/.test(r)), `${tag}: independence is one of them`);
  const warned = await page.$('.drawer .warnbox');
  ok(!!warned, `${tag}: and it warns you when foreign partners have a grip`);

  // 5. there is a way back: money buys the hook out
  await page.evaluate(() => { S.reserves = 3000; S.sov = 10; render(true); UI.drawer = 'money'; UI.sub.money = 'actions'; render(true); });
  await page.waitForTimeout(250);
  const btn = await page.$('[data-act=repay][data-v="1000"]:not([disabled])');
  ok(!!btn, `${tag}: the money panel offers to pay off old debt`);
  const bSov = await page.evaluate(() => S.sov);
  await btn.click(); await page.waitForTimeout(300);
  const aSov = await page.evaluate(() => ({ sov: S.sov, debt: S.debt }));
  ok(aSov.sov > bSov + 9, `${tag}: paying $1,000M buys independence back (${bSov.toFixed(0)} → ${aSov.sov.toFixed(0)})`);

  // 6. but only what you sold — money never buys more standing than you inherited
  await page.evaluate(() => { S.reserves = 9000; for (let i = 0; i < 12; i++) ACT.repay(S, 1000); render(true); });
  const capped = await page.evaluate(() => S.sov);
  ok(capped <= 60.001, `${tag}: it never climbs past where you started (${capped.toFixed(0)})`);

  // 7. and the game asks about it unprompted, which is how a casual player will ever find it
  await page.evaluate(() => {
    S.sov = 20; S.reserves = 2000; S.debt = 3000;   // step 6 above cleared the debt
    UI.drawer = null; UI.provOpen = false; UI.decHide = false; UI.decSkip = {};
    render(true);
  });
  await page.evaluate(() => { if (document.querySelector('#modal .scrim')) closeModal(); });
  await page.waitForTimeout(300);
  const deck = await page.evaluate(() => decisionDeck().map(d => d.id));
  // a province about to revolt still outranks it, and should — but nothing else does
  ok(deck.slice(0, 2).includes('sovBuy'), `${tag}: the game asks about it unprompted (${deck.slice(0, 3).join(', ')})`);
  await page.evaluate(() => { UI.deck = decisionDeck(); });
  const card = await page.evaluate(() => { const d = decisionDeck().find(x => x.id === 'sovBuy'); return d && [d.why, d.title, d.text, d.opts[0].label, d.opts[0].sub].join(' | '); });
  ok(card && !/decSov|repayTitle|sovBite|undefined/.test(card), `${tag}: the card is written, not raw keys (${(card || '').slice(0, 40)})`);

  await page.screenshot({ path: `tools/shot-indep-${tag}.png` });
  await page.close();
}
await b.close();
if (errs.length) { console.error('\nPAGE ERRORS:\n' + errs.join('\n')); fails += errs.length; }
console.log(fails ? `\n${fails} FAILED` : '\nall independence checks passed');
process.exit(fails ? 1 : 0);
