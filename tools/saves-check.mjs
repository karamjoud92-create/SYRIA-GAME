// Saves, the way the save-systems discipline says to check them: a save outlives the build that
// wrote it, and a save that *parses* is not a save that is safe to play. Every load here goes
// version -> migrate -> heal -> validate -> play, and each case below is a way a real player
// loses a country if one of those steps is missing.
import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path';
const file = 'file://' + path.resolve('dist/index.html');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };

for (const [tag, loc] of [['en', 'en-US'], ['ar', 'ar']]) {
  const errs = [];
  const page = await b.newPage({ viewport: { width: 1280, height: 860 }, locale: loc });
  page.on('pageerror', e => errs.push(tag + ': ' + e.message));
  page.on('console', m => { const x = m.text(); if (m.type() === 'error' && !/ERR_CERT|fonts\.g/.test(x)) errs.push(tag + ' console: ' + x); });
  await page.goto(file); await page.waitForTimeout(400);
  await page.click('[data-act=newgame][data-v=learner]');
  for (let i = 0; i < 8; i++) { const x = await page.$('.modal .btn.primary'); if (x) await x.click(); await page.waitForTimeout(40); }
  await page.evaluate(() => { if (document.querySelector('#modal .scrim')) closeModal(); });

  // play a while so there is something to lose
  await page.evaluate(() => { for (let i = 0; i < 40; i++) S = step(S); S.reserves = 4321; S.invests.textiles = 3; persist(); render(true); });
  await page.waitForTimeout(200);

  // 1. Round trip. The baseline: what is saved comes back.
  const trip = await page.evaluate(() => {
    const code = saveCode(), before = { t:S.t, res:Math.round(S.reserves), tex:S.invests.textiles };
    S.reserves = 0; S.t = 0;                       // wreck the live state
    const okLoad = loadCode(code);
    return { okLoad, before, after:{ t:S.t, res:Math.round(S.reserves), tex:S.invests.textiles } };
  });
  ok(trip.okLoad && JSON.stringify(trip.before) === JSON.stringify(trip.after),
    `${tag}: a save code round-trips (t=${trip.after.t}, $${trip.after.res}M, ${trip.after.tex} mills)`);

  // 2. A save from a LATER build is refused, and says so. Never guess at fields you don't know.
  const newer = await page.evaluate(() => {
    const o = JSON.parse(decodeURIComponent(escape(atob(saveCode())))); o.S.v = 99;
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(o))));
    const t0 = S.t; return { loaded:loadCode(code), why:UI.loadErr, kept:S.t === t0 };
  });
  ok(!newer.loaded && newer.why === 'newer', `${tag}: a save from a newer build is refused (${newer.why})`);
  ok(newer.kept, `${tag}: and the game in front of the player is left alone`);

  // 3. The refusal is written for a person, in their language, and says WHICH refusal it was.
  await page.evaluate(() => loadCodeModal(true));
  await page.waitForTimeout(200);
  const msg = await page.evaluate(() => (document.querySelector('#modal .bad') || { innerText:'' }).innerText.trim());
  ok(msg.length > 12 && !/badCode|undefined/.test(msg), `${tag}: it tells the player why ("${msg.slice(0, 46)}")`);
  ok(tag === 'en' ? /newer/i.test(msg) : /[؀-ۿ]/.test(msg), `${tag}: in this language`);
  await page.evaluate(() => closeModal());

  // 4. A truncated code is refused. It is still valid base64 and still parses partway —
  //    the old check only looked at S.v, so half a country loaded as a whole one.
  const cut = await page.evaluate(() => {
    const code = saveCode(), t0 = S.t;
    return { loaded:loadCode(code.slice(0, Math.floor(code.length * 0.6))), why:UI.loadErr, kept:S.t === t0 };
  });
  ok(!cut.loaded && cut.kept, `${tag}: a truncated code is refused and changes nothing (${cut.why})`);

  // 5. A hand-edited code with a nonsense number is refused. NaN in reserves used to sail
  //    straight in and turn every money figure on the dashboard into NaN forever.
  const nan = await page.evaluate(() => {
    const o = JSON.parse(decodeURIComponent(escape(atob(saveCode()))));
    o.S.reserves = 'lots';                          // a string where a number belongs
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(o))));
    return { loaded:loadCode(code), why:UI.loadErr };
  });
  ok(!nan.loaded && nan.why === 'broken', `${tag}: a code with a nonsense number is refused (${nan.why})`);

  // 6. A save missing a province is refused rather than healed into one. PROVS cannot change
  //    without a migration, so a province missing means corruption, not age - and heal() filling
  //    it would hand back a country quietly rewound to the war.
  const noProv = await page.evaluate(() => {
    const o = JSON.parse(decodeURIComponent(escape(atob(saveCode()))));
    delete o.S.provs.aleppo;
    return { loaded:loadCode(btoa(unescape(encodeURIComponent(JSON.stringify(o))))), why:UI.loadErr };
  });
  ok(!noProv.loaded, `${tag}: a save with a province missing is refused (${noProv.why})`);

  // 7. Content removed in a later build is dropped, not crashed on. A sector id that no longer
  //    exists must not take a panel down with it.
  const ghost = await page.evaluate(() => {
    const o = JSON.parse(decodeURIComponent(escape(atob(saveCode())))); o.S.ind.zeppelins = 4; o.S.invests.zeppelins = 4;
    const loaded = loadCode(btoa(unescape(encodeURIComponent(JSON.stringify(o)))));
    UI.drawer = 'trade'; UI.sub.trade = 'resources'; render(true);
    return { loaded, gone:S.ind.zeppelins === undefined && S.invests.zeppelins === undefined };
  });
  await page.waitForTimeout(200);
  const panelAlive = await page.evaluate(() => (document.querySelector('.drawer .body') || { innerText:'' }).innerText.length);
  ok(ghost.loaded && ghost.gone, `${tag}: a sector that no longer exists is dropped, not crashed on`);
  ok(panelAlive > 200, `${tag}: and the panel still opens (${panelAlive} chars)`);
  await page.evaluate(() => { UI.drawer = null; render(true); });

  // 8. A save written before the newest fields still opens (heal), and keeps what was earned.
  const oldSave = await page.evaluate(() => {
    const o = JSON.parse(decodeURIComponent(escape(atob(saveCode()))));
    for (const k of ['firms','ind','bar','lvl','chapter','sov0','svc','popM']) delete o.S[k];
    const loaded = loadCode(btoa(unescape(encodeURIComponent(JSON.stringify(o)))));
    return { loaded, filled:!!S.firms && !!S.ind && S.bar !== undefined && S.popM !== undefined, kept:Math.round(S.reserves) };
  });
  ok(oldSave.loaded && oldSave.filled, `${tag}: a save from before the newest fields still opens, healed`);
  ok(oldSave.kept === 4321, `${tag}: and keeps what the player earned ($${oldSave.kept}M)`);

  // 9. THE ONE THAT MATTERS. Storage goes bad; the backup is what stands between a player and
  //    losing twenty years. Persist twice so a backup exists, then corrupt the live key.
  const saved = await page.evaluate(() => {
    S.reserves = 9999; persist();                   // good save A -> primary
    S.reserves = 8888; persist();                   // A rotates to backup, B is primary
    localStorage.setItem('transition-syria-v6', '{"campaign":{"S":{"v":6,"t":"jun');  // B is now rubble
    S = null; UI.started = false;
    const back = restore();
    return { back, res:S && Math.round(S.reserves), fromBak:UI.fromBak };
  });
  ok(saved.back && saved.res === 9999, `${tag}: a damaged save falls back to the backup ($${saved.res}M, not a lost country)`);
  ok(saved.fromBak, `${tag}: and the player is told it happened, rather than silently rewound`);

  // 10. Both copies gone means a clean start screen, not a broken game.
  const wiped = await page.evaluate(() => {
    localStorage.setItem('transition-syria-v6', 'not json at all');
    localStorage.setItem('transition-syria-v6-bak', '{"campaign":{"S":{"v":6}}}');   // parses; rubble, not a save
    return restore();
  });
  ok(wiped === false, `${tag}: two unusable copies means a fresh start, never a half-built country`);

  // 11. The migration chain exists and is wired, so the next shape change is additive.
  const chain = await page.evaluate(() => {
    MIGRATIONS[5] = d => { d.migrated = true; return d; };     // pretend v5 -> v6
    const o = JSON.parse(decodeURIComponent(escape(atob(saveCode())))); o.S.v = 5;
    const loaded = loadCode(btoa(unescape(encodeURIComponent(JSON.stringify(o)))));
    const ran = !!(S && S.migrated), v = S && S.v;
    delete MIGRATIONS[5];
    return { loaded, ran, v };
  });
  ok(chain.loaded && chain.ran && chain.v === 6,
    `${tag}: an older save is carried up the migration chain (ran, now v${chain.v})`);

  // 12. ...and a version with no path up is refused rather than played as-is.
  const orphan = await page.evaluate(() => {
    const o = JSON.parse(decodeURIComponent(escape(atob(saveCode())))); o.S.v = 2;
    return { loaded:loadCode(btoa(unescape(encodeURIComponent(JSON.stringify(o))))), why:UI.loadErr };
  });
  ok(!orphan.loaded, `${tag}: a version with no migration path is refused, not guessed at (${orphan.why})`);

  if (errs.length) { console.error(`\n${tag} PAGE ERRORS:\n` + errs.join('\n')); fails += errs.length; }
  await page.close();
}
await b.close();
console.log(fails ? `\n${fails} FAILED` : '\nall save checks passed');
process.exit(fails ? 1 : 0);
