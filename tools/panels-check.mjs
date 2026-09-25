// The panels themselves, in a real browser: every drawer opens without throwing, every greyed
// button says why, nothing sits off the edge of a page that cannot scroll, and an old save still
// opens. Each check here is a bug that shipped once — a crash in the Progress drawer, dials that
// looked live after the presidency ended, a hard `left:` that covered the Arabic drawer's ✕.
import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path';
const file = 'file://' + path.resolve('dist/index.html');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
const esc0 = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const clear = p => p.evaluate(() => { if (document.querySelector('#modal .scrim') && typeof closeModal === 'function') closeModal(); });

for (const [tag, loc] of [['en', 'en-US'], ['ar', 'ar']]) {
  const errs = [];
  const page = await b.newPage({ viewport: { width: 1400, height: 900 }, locale: loc });
  page.on('pageerror', e => errs.push(tag + ': ' + e.message));
  page.on('console', m => { const x = m.text(); if (m.type() === 'error' && !/ERR_CERT|fonts\.g/.test(x)) errs.push(tag + ' console: ' + x); });
  await page.goto(file); await page.waitForTimeout(400);
  await page.click('[data-act=newgame][data-v=learner]');
  for (let i = 0; i < 8; i++) { const x = await page.$('.modal .btn.primary'); if (x) await x.click(); await page.waitForTimeout(50); }
  await clear(page);

  // 1. Every kind of thing under construction draws. The Progress drawer used to assume every
  //    pipe entry was a factory, so a school or a firm in the queue threw and blanked the panel.
  await page.evaluate(() => {
    S.t = 60; S.lvl = 10; S.reserves = 9000; S.treasury = 400;
    S.pipe = [{ due:S.t + 4, kind:'proj', id:'homs', leak:0, mode:'fast' },
              { due:S.t + 5, kind:'port', id:'latakia' },
              { due:S.t + 6, kind:'invest', id:'textiles' },
              { due:S.t + 7, kind:'svc', id:'schools' },
              { due:S.t + 8, kind:'firm', id:'anadolu', sector:'logistics', lvls:2 },
              { due:S.t + 9, kind:'mw', mw:300 },
              { due:S.t + 10, kind:'somethingNew', id:'not-a-real-id' }];
    UI.drawer = 'progress'; UI.sub.progress = 'charts'; render(true);
  });
  await page.waitForTimeout(250);
  const pipes = await page.$$eval('.drawer .pipe', els => els.map(e => e.innerText.replace(/\s+/g, ' ').trim()));
  const pipeIcons = await page.$$eval('.drawer .pipe span svg.i', e => e.length);
  ok(pipes.length >= 6, `${tag}: everything under construction is listed (${pipes.length} entries)`);
  const joined = pipes.join(' | ');
  ok(!/undefined|\[object/.test(joined), `${tag}: with a name each, not undefined (${joined.slice(0, 60)})`);
  ok(pipes.some(p => new RegExp(esc0(tag === 'en' ? 'Schools' : 'المدارس'), 'i').test(p)),
    `${tag}: a school under construction shows up by name (${pipes.join(' | ').slice(0, 50)})`);
  ok(pipeIcons >= 6, `${tag}: and every row carries a real icon, not an emoji (${pipeIcons} svgs)`);
  ok(errs.length === 0, `${tag}: and nothing threw (${errs.length} errors)`);

  // 2. A sector card quotes the price of the NEXT level, not the first one forever, and there
  //    is no ceiling to hit. It used to say $35M at level 6 and then refuse the click.
  // sectors are a level-5 unlock and cap at level+2, so a country that has earned them
  await page.evaluate(() => { S.lvl = 12; S.invests.textiles = 5; S.ind.textiles = 5; S.pipe = []; UI.drawer = 'trade'; UI.sub.trade = 'resources'; render(true); });
  await page.waitForTimeout(250);
  const card = await page.evaluate(() => {
    const h = [...document.querySelectorAll('.dcard.inv')].find(e => e.querySelector('[data-id=textiles]'));
    return h && { gem:h.querySelector('.gem').innerText, txt:h.innerText.replace(/\s+/g, ' '),
      dead:!!h.querySelector('[data-act=invest][data-id=textiles]').disabled, real:investCost(S, 'textiles') };
  });
  ok(card && new RegExp('\\$' + Math.round(card.real)).test(card.gem.replace(/[^\d$]/g, '')) || (card && card.gem.includes(String(Math.round(card.real)))),
    `${tag}: the card charges what the next level actually costs ($${card && card.real}, card says ${card && card.gem.trim()})`);
  ok(card && !card.dead, `${tag}: and a sixth mill is still allowed — nothing says "fully built"`);
  ok(card && !/Fully built|مكتمل/.test(card.txt), `${tag}: no ceiling is claimed on the card`);

  // 3. A greyed button always says why. The big repay button used to grey in silence whenever
  //    you could afford the small one but not it.
  await page.evaluate(() => { S.debt = 4000; S.reserves = 700; S.sov = 30; UI.drawer = 'money'; UI.sub.money = 'actions'; render(true); });
  await page.waitForTimeout(250);
  const rp = await page.evaluate(() => {
    const bs = [...document.querySelectorAll('[data-act=repay]')];
    const g = bs[0] && bs[0].closest('.dcard');
    return { n:bs.length, small:bs[0] && bs[0].disabled, big:bs[1] && bs[1].disabled, why:g && g.querySelector('.why') && g.querySelector('.why').innerText.trim() };
  });
  ok(rp.n === 2 && rp.small === false && rp.big === true, `${tag}: with $700M spare you can repay $250M but not $1B`);
  ok(!!rp.why && rp.why.length > 5, `${tag}: and the card says why the big one is greyed ("${(rp.why || '').slice(0, 44)}")`);

  // 4. Nothing is a dead click after the presidency ends. The dials still drew as live.
  await page.evaluate(() => { UI.drawer = 'policy'; S.over = { won:true }; UI.toasts = []; render(true); });
  await page.waitForTimeout(200);
  const dial = await page.$('.drawer [data-act=pol]');
  if (dial) { await dial.click({ force: true }); await page.waitForTimeout(250); }
  const toasted = await page.evaluate(() => (document.querySelector('#toasts') || { innerText:'' }).innerText.trim());
  ok(!!dial && toasted.length > 4, `${tag}: a dial after the end says so instead of doing nothing ("${toasted.slice(0, 40)}")`);
  await page.evaluate(() => { S.over = null; UI.drawer = null; render(true); });

  // 5. The panel that floats over the map must never cover the drawer it sits beside — in
  //    Arabic the drawer is on the other side, and a hard `left:` put it straight on top of ✕.
  await page.evaluate(() => {
    UI.drawer = 'money'; UI.effect = { title:'test', now:[['cash', 1, 'bn']], later:[] };
    render(true); if (typeof renderEffect === 'function') renderEffect();
  });
  await page.waitForTimeout(250);
  const boxes = await page.evaluate(() => {
    const e = document.querySelector('#effectbox'), d = document.querySelector('.drawer');
    if (!e || !d || !e.innerHTML.trim()) return null;
    const a = e.getBoundingClientRect(), c = d.getBoundingClientRect();
    return { overlap: a.left < c.right && a.right > c.left, ew:a.width, inView: a.left >= -1 && a.right <= window.innerWidth + 1 };
  });
  ok(boxes && !boxes.overlap, `${tag}: it sits clear of the open drawer, whichever side that is`);
  ok(boxes && boxes.inView, `${tag}: and inside the window`);
  await page.evaluate(() => { UI.effect = null; UI.drawer = null; render(true); if (typeof renderEffect === 'function') renderEffect(); });

  // 6. An old save code still opens every panel. s.firms, s.ind and s.bar were added inside v6,
  //    so a code saved before them left the Companies tab reading a field that was not there.
  await page.evaluate(() => {
    const old = JSON.parse(JSON.stringify(S));
    delete old.firms; delete old.ind; delete old.bar; delete old.lvl; delete old.chapter; delete old.sov0;
    delete old.svc; delete old.popM;
    window.__oldCode = btoa(unescape(encodeURIComponent(JSON.stringify({ v:6, S:old, active:'campaign' }))));
  });
  const loaded = await page.evaluate(() => loadCode(window.__oldCode));
  ok(loaded, `${tag}: a save written before the newest fields still loads`);
  const healed = await page.evaluate(() => ({ firms:!!S.firms, ind:!!S.ind, bar:S.bar !== undefined, lvl:S.lvl !== undefined, svc:!!S.svc, pop:S.popM !== undefined }));
  ok(Object.values(healed).every(Boolean), `${tag}: and the missing fields are filled in (${JSON.stringify(healed)})`);
  const before = errs.length;
  await page.evaluate(() => { S.lvl = 10; UI.drawer = 'trade'; UI.sub.trade = 'firms'; render(true); });
  await page.waitForTimeout(250);
  const firmsHtml = await page.evaluate(() => (document.querySelector('.drawer .body') || { innerText:'' }).innerText.trim().length);
  ok(errs.length === before && firmsHtml > 40, `${tag}: Companies opens on that old save (${firmsHtml} chars, ${errs.length - before} new errors)`);
  await page.evaluate(() => { UI.drawer = null; render(true); });

  // 7. Nothing the player has to press may sit off the edge. The page does not scroll, so a
  //    button past the edge is a button that does not exist. Test it with every panel unlocked
  //    and every extra chip showing — the crowded case is the one that breaks.
  await page.evaluate(() => { S.lvl = 10; S.clogged = 40; MP.room = 'TEST7'; MP.name = 'A'; UI.drawer = null; render(true); });
  await page.waitForTimeout(250);
  const panels = await page.evaluate(() => document.querySelectorAll('.dock [data-act=drawer]').length);
  ok(panels >= 8, `${tag}: all ${panels} panels are open for the crowded test`);
  for (const w of [1920, 1400, 1100, 900, 820, 700, 390]) {
    await page.setViewportSize({ width: w, height: 860 });
    await page.waitForTimeout(220);
    const off = await page.evaluate(() => {
      const bad = [];
      for (const e of document.querySelectorAll('.hud [data-act], .dock [data-act]')) {
        const r = e.getBoundingClientRect();
        if (r.width < 1 && r.height < 1) continue;
        if (r.left < -1 || r.right > window.innerWidth + 1 || r.bottom > window.innerHeight + 1)
          bad.push((e.dataset.act || '?') + ':' + (e.dataset.v || '') + ' @' + Math.round(r.left) + '–' + Math.round(r.right));
      }
      return bad;
    });
    ok(off.length === 0, `${tag}: every header and dock button is on screen at ${w}px (${off.slice(0, 3).join(', ') || 'all in'})`);
  }
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.evaluate(() => { MP.room = null; S.clogged = 0; render(true); });

  // 8. Sound, language and menu stay together on one row.
  const grouped = await page.evaluate(() => {
    const ys = ['mute', 'lang', 'menu'].map(a => { const e = document.querySelector(`.hud [data-act=${a}]`); return e ? Math.round(e.getBoundingClientRect().top) : null; });
    return { ys, same: ys.every(y => y !== null && Math.abs(y - ys[0]) < 4) };
  });
  ok(grouped.same, `${tag}: sound, language and menu share a row (tops ${grouped.ys.join('/')})`);

  // 9. Save codes are hidden for now. Nothing may point at them, and the two screens they used
  //     to sit on must still be whole — the multiplayer button anchored itself off one of them,
  //     and the language switcher identified the menu by the other.
  await page.evaluate(() => { localStorage.removeItem('transition-syria-v6'); localStorage.removeItem('transition-syria-v6-bak'); });
  await page.reload(); await page.waitForTimeout(500);
  const startBtns = await page.$$eval('#modal [data-act]', e => e.map(n => n.dataset.act));
  ok(!startBtns.includes('loadcode'), `${tag}: the start screen offers no save code (${startBtns.join(',')})`);
  ok(startBtns.includes('newgame') && !startBtns.includes('livemode'),
    `${tag}: one way in — no clock pick, no difficulty pick (${startBtns.join(',')})`);
  await page.click('[data-act=newgame][data-v=learner]');
  for (let i = 0; i < 8; i++) { const x = await page.$('.modal .btn.primary'); if (x) await x.click(); await page.waitForTimeout(50); }
  await clear(page);
  await page.click('[data-act=menu]'); await page.waitForTimeout(250);
  const menuBtns = await page.$$eval('#modal [data-act]', e => e.map(n => n.dataset.act));
  ok(!menuBtns.includes('savecode') && !menuBtns.includes('loadcode'), `${tag}: nor does the menu (${menuBtns.join(',')})`);
  ok(menuBtns.includes('restart') && menuBtns.includes('lang'), `${tag}: which still restarts and still switches language`);
  // the language switch used to find the menu by the savecode button; it must still come back
  await page.click('#modal [data-act=lang]'); await page.waitForTimeout(300);
  const stillMenu = await page.evaluate(() => !!document.querySelector('#modal [data-menu]'));
  ok(stillMenu, `${tag}: and switching language in the menu keeps you in the menu`);
  await page.click('#modal [data-act=lang]'); await page.waitForTimeout(300);   // back to this arm's language
  await clear(page);

  // 10. No English abbreviation may leak into Arabic. The oil split read "30k".
  await page.evaluate(() => { S.lvl = 10; UI.drawer = 'trade'; UI.sub.trade = 'resources'; render(true); });
  await page.waitForTimeout(250);
  const split = await page.$eval('.rcard.oil .split', e => e.innerText.replace(/\s+/g, ' ').trim());
  ok(tag === 'en' ? /k/.test(split) : !/[A-Za-z]/.test(split), `${tag}: the oil split is written in this language ("${split}")`);

  // 11. The away report's arrow says which way a number went; the colour says whether that is
  //     good. They used to be the same flag, so unemployment falling was a red ↓.
  await page.evaluate(() => {
    S.live = true;
    showAway({ months:6, before:{ score:S.score, trust:S.trust, anger:natUnrest(S), treasury:S.treasury, reserves:S.reserves,
      parallel:S.parallel, usd:S.reserves, cash:S.treasury, power:nationalHours(S), jobs:joblessNat(S) + 9 }, notes:[], queued:0, fail:null });
  });
  await page.waitForTimeout(300);
  const jobRow = await page.evaluate(() => {
    const want = L2(GLOSS.jobs).name;
    const r = [...document.querySelectorAll('#modal .scores > div')].find(e => e.innerText.includes(want));
    if (!r) return null; const b = r.querySelector('b');
    return { arrow:b.innerText.trim()[0], cls:b.className };
  });
  ok(jobRow && jobRow.arrow === '↓' && jobRow.cls === 'good',
    `${tag}: unemployment falling is drawn as ↓ in green (${jobRow && jobRow.arrow} ${jobRow && jobRow.cls})`);
  await clear(page);

  await page.screenshot({ path: `tools/shot-panels-${tag}.png` });
  if (errs.length) { console.error(`\n${tag} PAGE ERRORS:\n` + errs.join('\n')); fails += errs.length; }
  await page.close();
}
await b.close();
console.log(fails ? `\n${fails} FAILED` : '\nall panel checks passed');
process.exit(fails ? 1 : 0);
