// A dead-end sweep: play the game at every level, in both languages, on desktop and phone, and
// look for anything a player can walk into and get stuck in — a panel that opens empty, a control
// that is disabled without saying why, a locked thing with no stated way in, a click that throws.
import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path';
const file = 'file://' + path.resolve('dist/index.html');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath:'/opt/pw-browsers/chromium' } : {});
const found = []; let checks = 0;
const note = (where, what) => { found.push(`${where}: ${what}`); console.log(`  ⚠️  ${where}: ${what}`); };
const SUB = { money:['actions','budget'], trade:['resources','ports','partners'], people:['families','services','pop'], progress:['why','medals','charts','cycles','news'] };
const ALL = ['guide','policy','decrees','money','build','trade','people','chains','progress'];

for (const [tag, vp, loc] of [['desktop-en', { width:1280, height:900 }, 'en-US'], ['phone-ar', { width:390, height:844 }, 'ar']]) {
  const page = await b.newPage({ viewport:vp, locale:loc });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { const x = m.text(); if (m.type()==='error' && !/ERR_CERT|fonts\.g/.test(x)) errs.push('console: '+x); });
  await page.goto(file); await page.waitForTimeout(400);
  await page.click('[data-act=newgame][data-v=learner]');
  for (let i=0;i<9;i++){ const x = await page.$('.modal .btn.primary'); if (x) await x.click(); await page.waitForTimeout(30); }
  await page.evaluate(() => { if (document.querySelector('#modal .scrim')) closeModal(); render(true); });
  console.log(`\n=== ${tag} ===`);

  // --- 1. every level, every panel, every subtab ---
  for (const lvl of [1,2,3,4,5,6,7,8,9,10,11,12]) {
    await page.evaluate(l => { begin('learner', null); S.xp = [0,0,200,500,900,1400,2000,2700,3400,4300,5600,7800,11000][l];
      S.reserves = 6000; S.pc = 250; S.treasury = 40; UI.decHide = true;
      for (let i=0;i<6;i++) advance();
      if (document.querySelector('#modal .scrim')) closeModal(); render(true); }, lvl);
    await page.waitForTimeout(120);
    const real = await page.evaluate(()=>levelNow());
    const dock = await page.$$eval('.dbtn:not(.lockbtn)', e => e.map(n=>n.dataset.v));
    // anything gated at or below this level must be reachable from the dock
    const shouldBeOpen = await page.evaluate(() => ALLDRAWERS().filter(k => isOpen(k)), []).catch(async () =>
      page.evaluate(() => ['guide','policy','decrees','money','build','trade','people','chains','progress'].filter(k => isOpen(k))));
    for (const k of shouldBeOpen) if (!dock.includes(k)) note(`${tag} L${real}`, `panel "${k}" is unlocked but has no dock button`);
    // THE INVARIANT: nothing may be silently absent. Anything still locked must either be named in
    // the 🔒 list, or be an infrastructure track, which the Build panel greys with its own level.
    // Breaking this is what made a player think the Progress button was dead: there was no button.
    const disc = await page.evaluate(() => {
      const named = lockedThings().map(x => x.key);
      const shut = Object.keys(UNLOCK).filter(k => !isOpen(k));
      return { missing: shut.filter(k => !k.startsWith('infra') && !named.includes(k)),
               shut: shut.length, hasBtn: !!document.querySelector('.lockbtn') };
    });
    checks++;
    if (disc.missing.length) note(`${tag} L${real}`, `locked but named nowhere a player can see: ${disc.missing.join(', ')}`);
    if (disc.shut && !disc.hasBtn) note(`${tag} L${real}`, `${disc.shut} things are locked but there is no 🔒 button to reveal them`);
    if (!disc.shut && disc.hasBtn) note(`${tag} L${real}`, 'nothing is locked yet the 🔒 button is still shown');
    for (const d of dock) {
      for (const s of (SUB[d] || [null])) {
        if (s && !(await page.evaluate(ss => isOpen(ss), s))) continue;
        errs.length = 0;
        await page.evaluate(([dd,ss]) => { UI.drawer = dd; if (ss) UI.sub[dd] = ss; render(true); }, [d,s]);
        await page.waitForTimeout(70);
        const r = await page.evaluate(() => {
          const body = document.querySelector('.drawer .body'); if (!body) return null;
          const txt = body.innerText.trim();
          const btns = [...body.querySelectorAll('button')];
          const silent = btns.filter(x => x.disabled).filter(x => {
            const card = x.closest('.dcard, .quest, .rcard, .group, .pol, .contract');
            return !(card && card.querySelector('.why'));
          }).map(x => (x.textContent||'').trim().replace(/\s+/g,' ').slice(0,30));
          const rawKeys = (txt.match(/\b(sub[A-Z]\w+|d[A-Z]\w+|\w+Sub|undefined|NaN|\{\d\})\b/g)||[]);
          return { len:txt.length, silent, rawKeys };
        });
        checks++;
        // a subtab must never be offered above its own level: that is the panel disagreeing with
        // the guide about what the player has been given
        const gateOk = await page.evaluate(ss => !ss || isOpen(ss), s);
        const tabShown = await page.evaluate(ss => !ss || [...document.querySelectorAll('.subtabs button')].some(n => n.dataset.v === ss), s);
        if (!gateOk && tabShown) note(`${tag} L${real} ${d}/${s}`, 'subtab offered before its level');
        const where = `${tag} L${real} ${d}${s?'/'+s:''}`;
        if (!r) { note(where, 'drawer did not open at all'); continue; }
        if (errs.length) note(where, 'THREW: ' + errs.join(' | '));
        if (r.len < 25) note(where, `opens but is empty (${r.len} chars)`);
        if (r.silent.length) note(where, `disabled with no reason given: ${r.silent.join(', ')}`);
        if (r.rawKeys.length) note(where, `raw text leaked: ${[...new Set(r.rawKeys)].join(', ')}`);
      }
    }
    await page.evaluate(() => { UI.drawer = null; render(true); });
    // --- 2. every map layer ---
    const layers = await page.$$eval('.layers button', e => e.map(n=>n.dataset.v));
    for (const L of layers) { checks++; errs.length = 0;
      await page.click(`.layers button[data-v=${L}]`); await page.waitForTimeout(70);
      if (errs.length) note(`${tag} L${real} layer:${L}`, 'THREW: '+errs.join(' | '));
      const paths = await page.$$eval('path.prov', e => e.filter(n => !n.getAttribute('fill') || n.getAttribute('fill')==='undefined').length);
      if (paths) note(`${tag} L${real} layer:${L}`, `${paths} provinces have no colour`);
    }
    // --- 3. every province card ---
    errs.length = 0;
    const provs = await page.$$eval('path.prov[data-id]', e => [...new Set(e.map(n=>n.dataset.id))]);
    for (const id of provs) { checks++;
      await page.evaluate(i => { UI.sel = i; UI.provOpen = true; render(true); }, id);
      await page.waitForTimeout(40);
      const r = await page.evaluate(() => { const c = document.querySelector('.pcard .body');
        if (!c) return null; const t = c.innerText.trim();
        const silent = [...c.querySelectorAll('button')].filter(x=>x.disabled).length && !c.querySelector('.why');
        return { len:t.length, silent }; });
      if (!r) note(`${tag} L${real} prov:${id}`, 'province card did not open');
      else { if (r.len < 40) note(`${tag} L${real} prov:${id}`, `card is empty (${r.len})`);
             if (r.silent) note(`${tag} L${real} prov:${id}`, 'build button disabled with no reason'); }
    }
    if (errs.length) note(`${tag} L${real} provinces`, 'THREW: '+errs.join(' | '));
    await page.evaluate(() => { UI.provOpen = false; render(true); });
  }
  await page.close();
}
await b.close();
console.log(`\n${checks} things checked. ${found.length ? found.length + ' issue(s) found' : 'no dead ends found'}`);
process.exit(found.length ? 1 : 0);
