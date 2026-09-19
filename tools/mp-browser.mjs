// Two real browsers, one room. Checks that a friend who opens the invite link ends up on the
// same scoreboard, sees the other player's score move, and that nothing throws along the way.
//   npm run build && node tools/mp-browser.mjs
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCORES = 9000 + Math.floor(Math.random() * 900), SITE = SCORES + 1;
const relay = `http://localhost:${SCORES}`;
const errors = [];
let expectOffline = false;   // after we kill the server on purpose, refused connections are the point
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };

// If a stray server from an earlier run owns the port, everything below would quietly test
// against IT and the teardown checks would lie. Prove the port is ours before going on.
await fetch(`${relay}/`).then(() => { throw new Error(`port ${SCORES} is already in use`); }, () => {});
const scores = spawn(process.execPath, [path.join(root, 'worker', 'server.js'), String(SCORES)], { stdio: ['ignore', 'ignore', 'inherit'] });
scores.on('exit', c => { if (c) errors.push('score server died with code ' + c); });
const site = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(fs.readFileSync(path.join(root, 'dist', 'index.html')));
}).listen(SITE);
await sleep(500);
await fetch(`${relay}/`).then(r => r.json()).then(j => { if (!j.ok) throw 0; }, () => { throw new Error('score server did not start'); });

const browser = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
const open = async (url, name) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, locale: 'en-US' });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`${name}: ${e.message}`));
  page.on('console', m => {   // the sandbox blocks fonts.googleapis.com; that is the harness, not the page
    const txt = m.text();
    if (m.type() !== 'error') return;
    if (/ERR_CERT_AUTHORITY_INVALID|fonts\.g/.test(txt)) return;               // the sandbox blocks Google Fonts
    if (expectOffline && /ERR_CONNECTION_REFUSED|Failed to fetch/.test(txt)) return;
    errors.push(`${name} console: ${txt}`);
  });
  await page.goto(url);
  await page.waitForTimeout(500);
  return page;
};
// A crisis can pop up at any moment and its scrim eats clicks; the player would just close it.
const clear = async page => { await page.evaluate(() => { if (document.querySelector('#modal .scrim') && typeof closeModal === 'function') closeModal(); }); };
const tap = async (page, sel) => { await clear(page); await page.click(sel); };
const startGame = async page => {
  await page.click('[data-act=newgame][data-v=learner]');
  for (let i = 0; i < 8; i++){ const b = await page.$('.modal .btn.primary'); if (b) await b.click(); await page.waitForTimeout(60); }
};

// --- player one: makes the room from the start screen ---
const A = await open(`http://localhost:${SITE}/`, 'A');
ok(!!(await A.$('[data-act=mpLobby]')), 'the start screen offers "Play with friends"');
await A.click('.modal [data-act=mpLobby]');
await A.fill('#mpname', 'Karam');
await A.click('[data-act=mpServer]');
await A.fill('#mprelay', relay);
await A.click('[data-act=mpRelaySave]');
ok((await A.inputValue('#mpname')) === 'Karam', 'the name survives a trip to the server settings');
await A.click('[data-act=mpNew]');
const room = await A.inputValue('#mproom');
ok(/^[A-Z0-9]{5}$/.test(room), `room code generated (${room})`);
await A.click('[data-act=mpGo]');
await startGame(A);
await A.waitForTimeout(900);
ok(!!(await A.$('.mpchip')), 'player one has a scoreboard chip in the header');

// --- player two: arrives on the invite link, having set nothing up ---
const link = await A.evaluate(() => mpInviteLink());
ok(link.includes('room=') && link.includes('relay='), 'invite link carries the room and the server');
const B = await open(link, 'B');
ok(!!(await B.$('#mpname')), 'the link drops the friend straight into the lobby');
await B.fill('#mpname', 'Lina');
ok((await B.inputValue('#mproom')) === room, 'the room code is already filled in for them');
await B.click('[data-act=mpGo]');
await startGame(B);
await B.waitForTimeout(1200);

// --- both play; the board should fill in on its own ---
await tap(A, '[data-act=speed][data-v="3"]');
await tap(B, '[data-act=speed][data-v="2"]');
for (let i = 0; i < 14; i++){
  await sleep(700);
  for (const p of [A, B]){
    const opt = await p.$('.modal .opt[data-act=choose]:not([disabled])'); if (opt) await opt.click();
    const close = await p.$('.modal [data-act=close], .modal [data-act=nextq], .modal [data-act=afterresults]'); if (close) await close.click();
  }
}
await tap(A, '[data-act=mpBoard]');
await A.waitForTimeout(1500);
const names = await A.$$eval('.mprow .nm b', els => els.map(e => e.textContent));
ok(names.includes('Karam') && names.includes('Lina'), `player one sees both names (${names.join(', ')})`);
ok((await A.$$('.mprow')).length === 2, 'exactly two rows, no duplicates');
ok(!!(await A.$('.mprow.me')), 'player one\'s own row is marked');
const live = await A.textContent('.mppanel .sub');
ok(/Live/.test(live), `board reports a live connection (${live.trim()})`);
const scoresShown = await A.$$eval('.mprow .sc', els => els.map(e => Number(e.textContent)));
ok(scoresShown.every(n => Number.isFinite(n) && n >= 0 && n <= 100), `scores look like scores (${scoresShown.join(', ')})`);
await A.screenshot({ path: 'tools/shot-mp-en.png' });

// --- Arabic, right to left ---
await tap(A, '.hud [data-act=lang]');
await A.waitForTimeout(400);
ok((await A.getAttribute('html', 'dir')) === 'rtl', 'Arabic flips the page to right-to-left');
ok(/الأصدقاء/.test(await A.textContent('.mppanel h2')), 'the scoreboard is in Arabic');
await A.screenshot({ path: 'tools/shot-mp-ar.png' });
await tap(A, '.hud [data-act=lang]');

// --- the server going away must not break the game ---
expectOffline = true;
scores.kill();
await sleep(600);
let sub = '';
for (let i = 0; i < 10; i++){
  await A.evaluate(() => mpSync(true));
  await sleep(600);
  sub = (await A.textContent('.mppanel .sub')) || '';
  if (/Offline/.test(sub)) break;
}
ok(/Offline/.test(sub), `a dead server shows as offline (saw: ${sub.trim()}, state: ${await A.evaluate(() => MP.state)})`);
await tap(A, '[data-act=speed][data-v="2"]');
await A.waitForTimeout(1500);
const year = await A.innerText('.turn .yr');
ok(/\d{4}/.test(year), `the game keeps running with no server (${year.replace(/\n/g, ' ')})`);

// --- a phone, with the board open ---
const P = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ar' });
const page3 = await P.newPage();
page3.on('pageerror', e => errors.push('phone: ' + e.message));
await page3.goto(link);
await page3.waitForTimeout(500);
await page3.fill('#mpname', 'سامي');
await page3.click('[data-act=mpGo]');
await startGame(page3);
await page3.waitForTimeout(600);
await tap(page3, '[data-act=mpBoard]');
await page3.waitForTimeout(400);
const box = await page3.$('.mppanel');
ok(!!box, 'the scoreboard opens on a phone');
const w = (await box.boundingBox()).width;
ok(w <= 390, `the panel fits the screen (${Math.round(w)}px)`);
await page3.screenshot({ path: 'tools/shot-mp-phone.png' });

await browser.close(); site.close(); scores.kill();
if (errors.length){ console.error('\nPAGE ERRORS:\n' + errors.join('\n')); fails += errors.length; }
console.log(fails ? `\n${fails} FAILED` : '\nall browser checks passed');
process.exit(fails ? 1 : 0);
