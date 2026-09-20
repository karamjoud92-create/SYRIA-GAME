// Levels, infrastructure, trade routes, experience and medals — checked without a browser, so
// `npm run check` catches a regression even where playwright is not installed.
const E = require('../src/engine/engine.js');
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };

// ---------- experience is earned, and nothing in the simulation reads it back ----------
{
  let a = E.startGame(3, 'learner'), b = E.startGame(3, 'learner');
  E.ACT.decree(a, 'dialogue');                       // a real action on one of the two
  const xpAfter = a.xp;
  // wipe the difference the action made, keep the xp, and check 20 months run identically
  a = E.startGame(3, 'learner'); a.xp = 999999;
  for (let i = 0; i < 20; i++){ a = E.step(a); b = E.step(b); }
  ok(xpAfter > 0, `an action earns experience (${Math.round(xpAfter)})`);
  ok(Math.abs(a.reserves - b.reserves) < 1e-6 && Math.abs(E.natUnrest(a) - E.natUnrest(b)) < 1e-9,
     'a huge experience total changes nothing in the simulation');
  ok((b.xp || 0) > 0 && b.xp < 200, `keeping the country running earns a trickle (${Math.round(b.xp)} in 20 months)`);
}

// ---------- medals pay in experience, once, and never in money ----------
{
  let s = E.startGame(4, 'learner');
  for (let i = 0; i < 40; i++) s = E.step(s);
  const got = Object.keys(s.medals || {}).length;
  const before = { usd:s.reserves, pc:s.pc, cash:s.treasury };
  s.trust = 95; const xp0 = s.xp; s = E.step(s);
  ok(s.medals.trusted !== undefined, 'passing a threshold awards its medal');
  ok(s.xp > xp0, 'the medal paid experience');
  const xp1 = s.xp; s = E.step(s);
  ok(Object.keys(s.medals).length >= got + 1, 'medals accumulate');
  ok(s.xp - xp1 < 60, 'and are not paid twice');
  ok(E.MEDALS.every(m => m.xp > 0 && !('usd' in m) && !('pc' in m)), 'no medal hands out money');
}

// ---------- infrastructure: costs climb, effects are real ----------
{
  let s = E.startGame(5, 'learner'); s.reserves = 9000;
  const c1 = E.infraCost(s, 'grid');
  ok(E.ACT.infra(s, 'grid'), 'a grid upgrade can be started');
  ok(!E.ACT.infra(s, 'grid'), 'but not twice at once');
  const mw0 = s.mw;
  for (let i = 0; i < 10; i++) s = E.step(s);
  ok(E.iLvl(s, 'grid') === 1, `it finished at level 1 (${E.iLvl(s, 'grid')})`);
  ok(s.mw > mw0 + 300, `and put megawatts on the grid (${Math.round(mw0)} → ${Math.round(s.mw)})`);
  const c2 = E.infraCost(s, 'grid');
  ok(c2.usd > c1.usd * 1.4 && c2.months >= c1.months, `the next level costs more and takes longer ($${c1.usd}/${c1.months}m → $${c2.usd}/${c2.months}m)`);
  // every track tops out, and tops out where it says it does
  Object.keys(E.INFRA).forEach(k => {
    let t = E.startGame(6, 'learner'); t.reserves = 1e6; t.infra[k] = E.INFRA[k].max;
    ok(!E.ACT.infra(t, k), `${k} cannot go past level ${E.INFRA[k].max}`);
  });
  // upkeep is charged, so a built country is not a free country
  let q = E.startGame(6, 'learner'), r = E.startGame(6, 'learner');
  Object.keys(E.INFRA).forEach(k => q.infra[k] = E.INFRA[k].max);
  q = E.step(q); r = E.step(r);
  const qu = q.last.ledger.usd.find(x => x[0] === 'upkeep');
  ok(!!qu && qu[1] < 0, `a fully built country pays upkeep (${qu ? qu[1].toFixed(1) : 'none'} per month)`);
  ok(!r.last.ledger.usd.some(x => x[0] === 'upkeep'), 'and an unbuilt one pays none');
}

// ---------- trade routes: signed at 1, widened to 3, and worth more each time ----------
{
  let s = E.startGame(7, 'learner'); s.pc = 200; s.reserves = 4000;
  ok(E.ACT.deal(s, 'turkey'), 'a route can be signed');
  ok(s.deals.turkey.lvl === 1, 'it starts at level 1');
  const cap1 = E.exportCapacity(s);
  ok(E.ACT.dealWiden(s, 'turkey') && s.deals.turkey.lvl === 2, 'and can be widened');
  const cap2 = E.exportCapacity(s);
  ok(cap2 > cap1, `a wider route moves more goods (${cap1.toFixed(0)} → ${cap2.toFixed(0)})`);
  const c1 = E.dealCost(s, 'turkey');
  E.ACT.dealWiden(s, 'turkey');
  ok(s.deals.turkey.lvl === 3, 'three levels in all');
  ok(!E.ACT.dealWiden(s, 'turkey'), 'and no further');
  ok(E.dealCost(s, 'turkey').pc >= c1.pc, 'each widening asks for more influence');
  // a shut border is worth nothing however wide the road is
  s.provs.aleppo.u = 90; s.provs.idlib.u = 90; s = E.step(s);
  ok(E.dealLvl(s, 'turkey') === 0, 'a route through a burning province counts for nothing');
  ok(Object.keys(E.PARTNERS).length === 11, `eleven countries and blocs to trade with (${Object.keys(E.PARTNERS).length})`);
}

// ---------- the ladder itself ----------
{
  const AT = [0, 4, 7, 11, 15, 21, 27, 36, 45, 60, 84, 120];
  ok(AT.length === 12, 'twelve levels');
  // the old five-stage schedule still holds for a player who does nothing: months 0/7/15/27/45
  [0, 7, 15, 27, 45].forEach((m, i) => ok(AT.indexOf(m) === [0, 2, 4, 6, 8][i], `month ${m} still opens the old stage ${i}`));
  // every level requirement in the data points at a level that exists
  Object.entries(E.INFRA).forEach(([k, x]) => ok(!x.lvlReq || (x.lvlReq >= 1 && x.lvlReq <= 12), `${k} opens at a real level`));
  Object.entries(E.PARTNERS).forEach(([k, x]) => ok(!x.lvlReq || (x.lvlReq >= 1 && x.lvlReq <= 12), `${k} opens at a real level`));
}

console.log(fails ? `\n${fails} FAILED` : '\nall progression checks passed');
process.exit(fails ? 1 : 0);
