// Two players, two Syrias, one room. Checks that a trade is brokered from what each country
// actually has and needs, that it takes BOTH of them to make it real, and — the important one —
// that nothing mintable changes hands: the bonus is sized by your own economy, not your friend's.
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import http from 'http'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCORES = 9600 + Math.floor(Math.random() * 300), SITE = SCORES + 1;
const relay = `http://localhost:${SCORES}`;
const errors = []; let fails = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };

await fetch(`${relay}/`).then(() => { throw new Error(`port ${SCORES} in use`); }, () => {});
const scores = spawn(process.execPath, [path.join(root, 'worker', 'server.js'), String(SCORES)], { stdio: ['ignore', 'ignore', 'inherit'] });
const site = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  r.end(fs.readFileSync(path.join(root, 'dist', 'index.html'))); }).listen(SITE);
await sleep(500);
const browser = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
const open = async name => { const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'en-US' });
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(`${name}: ${e.message}`));
  p.on('console', m => { const x = m.text(); if (m.type() === 'error' && !/ERR_CERT|fonts\.g/.test(x)) errors.push(`${name} console: ${x}`); });
  await p.goto(`http://localhost:${SITE}/`); await sleep(450); return p; };
const clear = p => p.evaluate(() => { if (document.querySelector('#modal .scrim')) closeModal(); });
const start = async p => { await p.click('[data-act=newgame][data-v=learner]');
  for (let i = 0; i < 8; i++){ const b = await p.$('.modal .btn.primary'); if (b) await b.click(); await sleep(60); } };

// A makes the room; B arrives on the invite link
const A = await open('A');
await A.click('.modal [data-act=mpLobby]'); await A.fill('#mpname', 'Karam');
await A.click('[data-act=mpServer]'); await A.fill('#mprelay', relay); await A.click('[data-act=mpRelaySave]');
await A.click('[data-act=mpNew]'); await A.click('[data-act=mpGo]'); await start(A); await sleep(700);
const link = await A.evaluate(() => mpInviteLink());
const B = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'en-US' }).then(c => c.newPage());
B.on('pageerror', e => errors.push('B: ' + e.message));
await B.goto(link); await sleep(450);
await B.fill('#mpname', 'Lina'); await B.click('[data-act=mpGo]'); await start(B); await sleep(700);

// Give them complementary countries: A has power and needs food, B the other way round
const shape = (p, mw, farm) => p.evaluate(([mw, farm]) => { S.mw = mw; S.res.farm = farm; persist(); mpSync(true); }, [mw, farm]);
await clear(A); await clear(B);
// open both boards first: the roster polls every 6s while open and only every 20s while shut,
// so shaping the countries before that would not reach the other side inside the test
await A.evaluate(() => { MP.open = true; mpLoop(); mpPaint(); });
await B.evaluate(() => { MP.open = true; mpLoop(); mpPaint(); });
await sleep(400);
await shape(A, 9000, 0.5); await shape(B, 1200, 3.5);
await sleep(9000);

const prof = await A.evaluate(() => tradeProfile(S));
ok(prof.has.power > 0 && prof.needs.food > 0, `a country's offer is read off its own state (has ${Object.keys(prof.has)}, needs ${Object.keys(prof.needs)})`);

await sleep(200);
const match = await A.evaluate(() => { const them = MP.roster.find(r => !r.me); return them ? mpMatch(them) : null; });
ok(match && match.get === 'food' && match.give === 'power', `the room suggests the trade that fits both (their ${match && match.get} for your ${match && match.give})`);
const offerBtn = await A.$('[data-act=mpPactOffer]');
ok(!!offerBtn, 'and offers it as a button on their row');

// one side alone is not a deal
await offerBtn.click(); await sleep(8000);
const halfway = await A.evaluate(() => { const them = MP.roster.find(r => !r.me); return mpPactWith(them); });
ok(halfway && !halfway.live, 'offering alone does not make a trade — it waits for them');
const bonusBefore = await A.evaluate(() => { let x = clone(S); for (let i = 0; i < 6; i++) x = step(x); return nationalHours(x); });

// B mirrors it
await B.evaluate(() => mpPaint()); await sleep(600);
const bOffer = await B.$('[data-act=mpPactOffer]');
ok(!!bOffer, 'the other side is offered the mirror of it');
await bOffer.click(); await sleep(9000);

const live = await A.evaluate(() => { const them = MP.roster.find(r => !r.me); return mpPactWith(them); });
ok(live && live.live, 'when both agree, the trade is live');
const bLive = await B.evaluate(() => { const them = MP.roster.find(r => !r.me); return mpPactWith(them); });
ok(bLive && bLive.live, 'and both of them see it');

// the bonus is real, and it is sized by the receiver's own country
const bonusAfter = await B.evaluate(() => { let x = clone(S); for (let i = 0; i < 6; i++) x = step(x); return nationalHours(x); });
const bBase = await B.evaluate(() => { let x = clone(S); x.pacts = []; for (let i = 0; i < 6; i++) x = step(x); return nationalHours(x); });
ok(bonusAfter > bBase, `the country short of power gets some (${bBase.toFixed(1)}h -> ${bonusAfter.toFixed(1)}h)`);
const cheat = await B.evaluate(() => { let x = clone(S); x.pacts = [{ with:'ghost', get:'power' }];
  const roster = MP.roster.find(r => !r.me); if (roster) roster.score = 100;
  for (let i = 0; i < 6; i++) x = step(x); return nationalHours(x); });
ok(Math.abs(cheat - bonusAfter) < 0.3, 'a friend claiming a perfect score cannot make the bonus any bigger');

// ending it takes one side
await A.click('[data-act=mpPactEnd]'); await sleep(9000);
const ended = await B.evaluate(() => { const them = MP.roster.find(r => !r.me); const p = mpPactWith(them); return !p || !p.live; });
ok(ended, 'either side can end it, and the other sees it stop');

await A.screenshot({ path: 'tools/shot-trade.png' });
await browser.close(); site.close(); scores.kill();
if (errors.length){ console.error('\nPAGE ERRORS:\n' + errors.join('\n')); fails += errors.length; }
console.log(fails ? `\n${fails} FAILED` : '\nall trading checks passed');
process.exit(fails ? 1 : 0);
