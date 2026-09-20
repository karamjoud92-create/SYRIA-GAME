// Drives a winning game through the live advance() in both languages and checks the level system
// the player actually sees: the badge shows a level, level-ups toast, and the game ENDS at month
// 240 on a final level — it used to run forever.
import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path';
const file = 'file://' + path.resolve('dist/index.html');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
let fails = 0; const errs = [];
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
for (const [tag, loc] of [['en', 'en-US'], ['ar', 'ar']]) {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 }, locale: loc });
  p.on('pageerror', e => errs.push(tag + ': ' + e.message));
  await p.goto(file); await p.waitForTimeout(250);
  await p.click('[data-act=newgame][data-v=learner]'); await p.waitForTimeout(120);
  for (let i = 0; i < 10; i++) { const x = await p.$('.modal .btn.primary'); if (!x) break; await x.click(); await p.waitForTimeout(30); }
  const r = await p.evaluate(() => { if (document.querySelector('#modal .scrim')) closeModal();
    const badge0 = document.querySelector('.scorebadge .sg')?.textContent, name0 = document.querySelector('.scorebadge .sl')?.textContent, clock0 = document.querySelector('.turn .yr')?.textContent;
    const smart = (s, m) => { const P = s.policy; P.fuel = 'market'; P.tax = 'aggressive'; P.crackdown = true; P.capex = s.reserves > 450 ? 40 : s.reserves > 220 ? 20 : 0; P.recon = s.treasury > 20 ? 10 : 0; P.print = s.treasury < 0 ? 5 : 0;
      if (realWage(s) < s.expWage - 4 && s.treasury > 10 && m % 6 == 0) ACT.wage(s, 10);
      if (!s.facilities.imf) ACT.facility(s, 'imf');
      for (const id of ['tribal','integrity','audit','digitax','dialogue','restitution','unify','northeast','braingain','suwayda']) if (s.decrees[id] === undefined && ACT.decree(s, id)) break;
      if (!s.facilities.gulf) ACT.facility(s, 'gulf'); if (!s.facilities.wb) ACT.facility(s, 'wb');
      for (const k of ['aleppo','rif','hasakeh','deir','homs','hama','daraa','suwayda','idlib','raqqa','latakia','damascus','tartus','quneitra']) if (!s.provs[k].project && (s.grant >= 20 || s.reserves > 500)) { ACT.project(s, k, 'tender'); break; } };
    const builder = (s, m) => { smart(s, m);
      if (s.reserves > 200) for (const id of ['schools','clinics','unis']) ACT.service(s, id);
      if (s.reserves > 260) for (const id of ['textiles','food','pharma','logistics','coldchain','packaging','cement','telecom','tourism']) ACT.invest(s, id);
      if (s.reserves > 700) { for (const id of ['refinery','farm','oilwells']) ACT.invest(s, id); ACT.portUpgrade(s, 'latakia'); ACT.portUpgrade(s, 'tartus'); }
      for (const id of ['jordan','turkey','iraq','gulf','eu']) ACT.deal(s, id); };
    const ups = [], downs = [], levelsSeen = new Set([S.level]); let endModal = null, bigNum = null, endSrc = null, milestone60 = null;
    for (let m = 0; m < 250; m++) {
      if (S.over) break;
      builder(S, m);
      if (S.event) { const e = EVENTS.find(x => x.id === S.event); const i = e.opts.findIndex(o => optionAllowed(S, o).ok); choose(i < 0 ? e.opts.length - 1 : i); }
      const before = S.level; advance(); levelsSeen.add(S.level);
      if (S.level > before) ups.push(S.t); if (S.level < before) downs.push(S.t);
      const h = document.querySelector('.modal h2');
      if (h && S.t === 60) milestone60 = { title: h.textContent, big: document.querySelector('.modal .grade')?.textContent, src: document.querySelector('.modal .src')?.textContent };
      if (S.over && S.over.won) { endModal = h?.textContent; bigNum = document.querySelector('.modal .grade')?.textContent; endSrc = document.querySelector('.modal .src')?.textContent; }
      if (document.querySelector('#modal .scrim') && !(S.over && S.over.won)) closeModal();
    }
    return { badge0, name0, clock0, t: S.t, over: S.over, level: S.level, score: Math.round(S.score), ups, downs, levelsSeen: [...levelsSeen].sort((a, b) => a - b), endModal, bigNum, endSrc, milestone60,
      badgeNow: document.querySelector('.scorebadge .sg')?.textContent, nameNow: document.querySelector('.scorebadge .sl')?.textContent, dir: document.documentElement.dir };
  });
  ok(r.badge0 === '3', `${tag}: a new game starts on level 3 (badge shows "${r.badge0}", ${r.name0?.trim().split(' ')[0]})`);
  ok(/\d+/.test(r.clock0) && !/20\d\d/.test(r.clock0), `${tag}: the clock counts months, not years ("${r.clock0}")`);
  ok(r.ups.length >= 4, `${tag}: levels were gained during the game (${r.ups.length} ups at months ${r.ups.slice(0, 6).join(',')}${r.ups.length > 6 ? '…' : ''})`);
  ok(r.milestone60 && /^\d+$/.test(r.milestone60.big || ''), `${tag}: the month-60 report card leads with the level (${r.milestone60 && r.milestone60.big}: ${r.milestone60 && r.milestone60.src})`);
  ok(r.over && r.over.won === true && r.t === 240, `${tag}: the game ENDS at month 240 (t=${r.t}, over=${JSON.stringify(r.over)})`);
  ok(r.endModal && /^(\d|10)$/.test(r.bigNum || ''), `${tag}: the ending shows the final level (${r.bigNum}: "${r.endModal}")`);
  ok(r.endSrc && !/20\d\d/.test(r.endSrc), `${tag}: the ending names the level, not a year ("${r.endSrc}")`);
  ok(r.level >= 9, `${tag}: a builder finishes on level 9 or 10 (level ${r.level}, score ${r.score})`);
  ok(String(r.badgeNow) === String(r.level), `${tag}: the badge matches the state (${r.badgeNow} = ${r.level}), name "${r.nameNow?.trim().split('  ')[0]}"`);
  ok(r.downs.length === 0 || r.downs[0] > 24, `${tag}: no level-down in the opening months while investments are still building (downs: ${r.downs.join(',') || 'none'})`);
  // a finished game reloaded must show its ending again, not crash into the mission screen
  await p.reload(); await p.waitForTimeout(500);
  const again = await p.evaluate(() => ({ over: S.over, h2: document.querySelector('.modal h2')?.textContent, big: document.querySelector('.modal .grade')?.textContent }));
  ok(again.over && again.over.won && again.h2 && /^(\d|10)$/.test(again.big || ''), `${tag}: reloading a finished game shows the ending again (${again.big}: "${again.h2}")`);
  if (tag === 'ar') ok(r.dir === 'rtl', `ar: page is RTL (${r.dir})`);
  await p.screenshot({ path: `tools/shot-levels-${tag}.png` });
  await p.close();
}
await b.close();
if (errs.length) { console.error('\nPAGE ERRORS:\n' + errs.join('\n')); fails += errs.length; }
console.log(fails ? `\n${fails} FAILED` : '\nall level browser checks passed'); process.exit(fails ? 1 : 0);
