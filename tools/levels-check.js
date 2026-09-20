// Levels are earned by score. This checks the bands cover 0..100 in order, the hysteresis stops
// flicker on a boundary, every game starts on level 3, and the scripted strategies land where the
// design says: doing nothing sinks, steady play reaches 7-9, building industry reaches 9-10.
const E = require('../src/engine/engine.js');
let fails = 0; const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };

// bands: contiguous, ascending, cover 0..100
let prevHi = -1, contiguous = true;
E.LEVELS.forEach(([lo, hi]) => { if (lo !== prevHi + 1) contiguous = false; prevHi = hi; });
ok(E.LEVELS.length === 10 && E.LEVELS[0][0] === 0 && prevHi === 100 && contiguous, `ten contiguous bands from 0 to 100`);
let mono = true; for (let s = 0; s <= 100; s++) if (E.levelRaw(s) < E.levelRaw(Math.max(0, s - 1))) mono = false;
ok(mono, 'level never falls as score rises');

// hysteresis: hover on the level 5 / level 6 line (50 | 51) and the level must not flip
{ let lv = E.levelOf(48); const seen = new Set([lv]);
  [50.4, 50.9, 51.2, 50.6, 51.4, 50.8, 51.6, 50.7].forEach(sc => { lv = E.levelOf(sc, lv); seen.add(lv); });
  ok(seen.size === 1 && lv === 5, `score hovering 50.4–51.6 stays on one level (${[...seen].join(',')})`);
  lv = E.levelOf(52.5, 5); ok(lv === 6, `clearing the line by a point rises (52.5 → ${lv})`);
  lv = E.levelOf(50.2, 6); ok(lv === 6, `dipping just under the floor holds (50.2 → ${lv})`);
  lv = E.levelOf(49.3, 6); ok(lv === 5, `dropping 1.5 below the floor falls (49.3 → ${lv})`); }

// a two-band jump that lands just under the top floor settles one band down, not frozen at the old level
ok(E.levelOf(51.4, 3) === 5, `a jump from level 3 to score 51.4 settles on 5, not 3 (${E.levelOf(51.4, 3)})`);
ok(E.levelOf(52.5, 3) === 6, `a jump from level 3 to score 52.5 lands on 6 (${E.levelOf(52.5, 3)})`);
ok(E.levelOf(NaN, 7) === 7 && E.levelOf(undefined, 7) === 7 && E.levelOf(NaN) === 1, 'a broken score holds the level it has, and reads 1 only with nothing to hold');

// every game starts on level 3
for (const d of ['learner', 'realistic']) { const s = E.startGame(7, d); ok(E.levelOf(s.score) === 3, `${d} starts on level 3 (score ${s.score.toFixed(0)})`); }

// strategies (same scripts as tools/sim.js)
const smart = (s, m) => { const P = s.policy; P.fuel = 'market'; P.tax = 'aggressive'; P.crackdown = true; P.capex = s.reserves > 450 ? 40 : s.reserves > 220 ? 20 : 0; P.recon = s.treasury > 20 ? 10 : 0; P.print = s.treasury < 0 ? 5 : 0;
  if (E.realWage(s) < s.expWage - 4 && s.treasury > 10 && m % 6 == 0) E.ACT.wage(s, 10);
  if (!s.facilities.imf) E.ACT.facility(s, 'imf');
  for (const id of ['tribal','integrity','audit','digitax','dialogue','restitution','unify','northeast','braingain','suwayda']) if (s.decrees[id] === undefined && E.ACT.decree(s, id)) break;
  if (!s.facilities.gulf) E.ACT.facility(s, 'gulf'); if (!s.facilities.wb) E.ACT.facility(s, 'wb');
  for (const k of ['aleppo','rif','hasakeh','deir','homs','hama','daraa','suwayda','idlib','raqqa','latakia','damascus','tartus','quneitra']) if (!s.provs[k].project && (s.grant >= 20 || s.reserves > 500)) { E.ACT.project(s, k, 'tender'); break; } };
const builder = (s, m) => { smart(s, m);
  if (s.reserves > 200) for (const id of ['schools','clinics','unis']) E.ACT.service(s, id);
  if (s.reserves > 260) for (const id of ['textiles','food','pharma','logistics','coldchain','packaging','cement','telecom','tourism']) E.ACT.invest(s, id);
  if (s.reserves > 700) { for (const id of ['refinery','farm','oilwells']) E.ACT.invest(s, id); E.ACT.portUpgrade(s, 'latakia'); E.ACT.portUpgrade(s, 'tartus'); }
  for (const id of ['jordan','turkey','iraq','gulf','eu']) E.ACT.deal(s, id); };
function run(fn, diff, seed = 7) {
  let s = E.startGame(seed, diff), lv = E.levelOf(s.score), peak = lv, changes = 0;
  for (let m = 0; m < 240; m++) { fn(s, m); s = E.step(s); const n = E.levelOf(s.score, lv); if (n !== lv) changes++; lv = n; peak = Math.max(peak, lv); if (E.checkFail(s)) break;
    const id = E.drawEvent(s); if (id) { const ev = E.EVENTS.find(e => e.id == id); const o = ev.opts.find(o => E.optionAllowed(s, o).ok) || ev.opts.at(-1); E.applyEffects(s, o.eff); } }
  return { lv, peak, changes, t: s.t, failed: !!E.checkFail(s) };
}
const p = run(() => {}, 'learner'); ok(p.failed && p.lv <= 3, `doing nothing sinks and fails (level ${p.lv} at month ${p.t})`);
const sr = run(smart, 'realistic'); ok(sr.lv >= 6 && sr.lv <= 8, `steady play on Realistic reaches level 6–8 (${sr.lv})`);
const sl = run(smart, 'learner'); ok(sl.lv >= 8 && sl.lv <= 9, `steady play on Learner reaches level 8–9 (${sl.lv})`);
const bl = run(builder, 'learner'); ok(bl.lv >= 9, `building industry on Learner reaches level 9–10 (${bl.lv})`);
const br = run(builder, 'realistic'); ok(br.lv >= 8, `building industry on Realistic reaches level 8+ (${br.lv})`);
ok(bl.changes >= 6 && bl.changes <= 14, `a full game changes level a handful of times, not constantly (${bl.changes} changes)`);
console.log(fails ? `\n${fails} FAILED` : '\nall level checks passed'); process.exit(fails ? 1 : 0);
