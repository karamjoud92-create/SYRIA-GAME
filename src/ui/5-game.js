// ===== Transition: UI v5 (continuous time + trade). Overrides earlier render functions. =====
const SPEEDS = [0, 9500, 5600, 3000];
UI.started = false;   // a real game is in play, not the placeholder sitting behind the start screen
UI.speed = 0; UI.flash = {}; UI.effect = null; UI.toasts = []; UI.sub = { money:'actions', progress:'why', trade:'resources', people:'families' }; UI.pdown = false; UI.hover = false; UI.dirty = false;
let TIMER = null, TOAST_ID = 0;
D = { policy:{}, decrees:[], projects:[], projMode:{}, facilities:[], wageRaise:0 };
// A save from an earlier build of v6 is missing whatever was added since (s.firms, s.ind, s.bar,
// s.lvl …). Rather than bump the key and throw everyone's country away, fill the gaps from a fresh
// game: only keys that are absent, never a value the player earned. Unguarded reads of a late field
// used to blank a whole panel for anyone with an old save code.
function heal(s){
  if (!s) return s;
  const fresh = newGame(s.seed, s.diff || 'learner');
  for (const k of Object.keys(fresh)){
    if (s[k] === undefined){ s[k] = fresh[k]; continue; }
    const a = s[k], b = fresh[k];
    if (b && typeof b === 'object' && !Array.isArray(b) && a && typeof a === 'object' && !Array.isArray(a))
      for (const j of Object.keys(b)) if (a[j] === undefined) a[j] = b[j];
  }
  for (const id of Object.keys(fresh.provs)){
    const a = s.provs[id], b = fresh.provs[id];
    if (!a){ s.provs[id] = b; continue; }
    for (const j of Object.keys(b)) if (a[j] === undefined) a[j] = b[j];
  }
  return s;
}
const syncD = () => { if (S){ heal(S); D.policy = S.policy; } };

const DRAWERS5 = [
  ['guide', '🧭', 'dGuide', 'guideSub'],
  ['policy', '📜', 'dPolicy', 'policySub'], ['decrees', '⭐', 'dDecrees', 'decreesSub'], ['money', '💰', 'dMoney', 'moneySub'],
  ['trade', '🚢', 'dTrade', 'tradeSub'],
  ['people', '👥', 'dPeople', 'peopleSub'], ['chains', '🔗', 'dSupply', 'supplySub'], ['progress', '📈', 'dProgress', 'progressSub'],
];


// ---------- opening up slowly ----------
// A new president does not get fourteen provinces and twelve industries on day one. Each stage
// hands over one more part of the job, so the player learns it before the next thing arrives.
const GAME_MONTHS = 240;                        // twenty years, then history has its say
// A presidency in real time: one game month an hour, so twenty years is ten days. The country
// keeps running while the tab is shut; you come back to what happened, not to a paused screen.
const LIVE_MS_PER_MONTH = 3600 * 1000;
const LIVE_CATCHUP_MAX = 240;                   // never simulate more than a whole presidency at once
const LIVE_QUEUE_MAX = 3;                       // crises that waited for you, rather than being decided
// The game opens up by LEVEL, not by calendar. It used to be months 0/7/15/27/45, which meant
// trade arrived in year 2 whether or not you had built anything — a clock, not a progression.
// Now each level hands over panels, dials and sectors, and you reach it by doing the things on
// its checklist. Every level's targets are reachable with what the PREVIOUS levels gave you:
// capex arrives at 2 because level 3 asks for six hours of power, berths at 4 because level 5
// asks for a second one. Break that chain and the game dead-ends.
const UNLOCK = {
  guide:1, policy:1, money:1, people:1, layerUnrest:1, projects:1,
  decrees:2, layerPower:2, polCapex:2, polTax:2, families:2,
  progress:3, chains:3, layerDamage:3, polPrint:3, polRecon:3,
  trade:4, ports:4, partners:4, layerJobs:4,
  sectors:5, firms:5,
  services:6, polIntervene:6, polCrackdown:6,
  supply:7, unis:7,
};
const lvlNow = () => (S && S.lvl) || 1;
const isOpen = f => lvlNow() >= (UNLOCK[f] === undefined ? 1 : UNLOCK[f]);
// what each level hands over, for the announcement. Index is the level itself.
const LEVEL_GIFTS = [[], [],
  ['dDecrees', 'layerPower', 'polCapexName'],
  ['dProgress', 'dChains'],
  ['dTrade', 'subPorts'],
  ['sectorTitle', 'subFirms'],
  ['subServices', 'polCrackdownName'],
  ['extractTitle', 'svcUnis'],
  [], [], []];
// Kept so old code and tests that ask "which stage is this" still answer sensibly.
function stageNow(){ return Math.max(0, Math.min(4, lvlNow() - 1)); }

// ---------- time words ----------
function monthsTxt(n){
  n = Math.round(n);
  if (n <= 0) return t('soon');
  if (n % 12 === 0) return n === 12 ? t('years1') : fill(t('yearsN'), [n / 12]);
  return n === 1 ? t('months1') : fill(t('monthsN'), [n]);
}
const whenTxt = tt => `${MONTHS[LANG][((tt % 12) + 12) % 12]} ${START_YEAR + Math.floor(tt / 12)}`;
const seasonsTxt = n => monthsTxt(n);
const gradeOf = v => v >= 75 ? 'A' : v >= 62 ? 'B' : v >= 50 ? 'C' : v >= 38 ? 'D' : 'F';

// ---------- saves ----------
function snap(s){ return { t:s.t, popM:s.popM, cash:s.treasury, usd:s.reserves, fx:s.parallel, pay:realWage(s), trust:s.trust, anger:natUnrest(s), power:nationalHours(s), score:s.score, jobs:joblessNat(s), bar:s.bar || 0,
  print:s.policy.print, capex:s.policy.capex, corr:s.corr, cap:s.cap, mw:s.mw, debt:s.debt, privB:(s.last && s.last.privB) || 0, contagion:(s.last && s.last.maxContagion) || 0 }; }
// A save outlives the build that wrote it, and a save that parses is not a save that is safe
// to play. Every load goes: version -> migrate -> heal -> validate -> play, and one that fails
// any step is refused out loud rather than handed the country in a broken state.
const SAVE_V = 6, BAK = KEY + '-bak';

// vN -> vN+1, pure, applied in order. **Keep every one forever** - deleting a migration strands
// every save written before it. Empty today because v6 is current; the chain is what makes the
// next shape change three lines instead of a redesign, and it is why heal() can stay what it
// is: a filler for keys that were only ever *added* within v6, never ones that changed meaning.
const MIGRATIONS = {};

function migrate(s){
  if (!s || typeof s !== 'object' || Array.isArray(s)) return { err:'broken' };
  let v = s.v === undefined ? 1 : s.v;
  if (typeof v !== 'number' || !isFinite(v)) return { err:'broken' };
  if (v > SAVE_V) return { err:'newer' };          // from a later build: refuse, never guess
  while (v < SAVE_V){
    const m = MIGRATIONS[v]; if (!m) return { err:'broken' };
    s = m(s); v += 1; s.v = v;
  }
  return { s };
}

// Truncated codes, hand-edited ones and half-written storage all parse as JSON. Check the
// shape before playing it, and drop ids that no longer exist rather than letting a panel throw.
const SAVE_NUMS = ['t','treasury','reserves','parallel','official','m2','infl','wage','debt','pc',
  'trust','corr','sov','comp','cap','mw','demand','popM','edu','health'];
const SAVE_MAPS = ['policy','res','ind','svc','ports','provs','deals','invests','decrees','firms','flags'];
function validate(s){
  for (const k of SAVE_NUMS) if (typeof s[k] !== 'number' || !isFinite(s[k])) return 'number:' + k;
  if (s.t < 0 || s.t > GAME_MONTHS * 50) return 'range:t';
  if (s.popM <= 0 || s.popM > 500) return 'range:popM';
  for (const k of SAVE_MAPS) if (!s[k] || typeof s[k] !== 'object' || Array.isArray(s[k])) return 'map:' + k;
  for (const k of ['pipe','history','log']) if (!Array.isArray(s[k])) return 'list:' + k;
  for (const p of PROVS){
    const q = s.provs[p.id];
    if (!q || typeof q.u !== 'number' || !isFinite(q.u)) return 'prov:' + p.id;
  }
  for (const k of ['latakia','tartus']){
    const h = s.ports[k]; if (!h || typeof h.lvl !== 'number' || !isFinite(h.lvl)) return 'port:' + k;
  }
  // content removed in a later build must not crash a panel - drop it quietly
  for (const k of Object.keys(s.ind)) if (!INVEST[k]) delete s.ind[k];
  for (const k of Object.keys(s.invests)) if (!INVEST[k]) delete s.invests[k];
  for (const k of Object.keys(s.firms)) if (!FIRMS[k]) delete s.firms[k];
  s.pipe = s.pipe.filter(i => i && typeof i.due === 'number' && isFinite(i.due));
  return null;
}

// heal() can fill in anything, which means it can also manufacture a whole game out of
// {"v":6} - rubble loaded as a country, and the player's real save quietly replaced by a new
// one. So a save has to prove it *was* a game before we start repairing it. PROVS has never
// changed and cannot without a migration, so a save missing even one province is corrupt
// rather than old, and heal() must not be allowed to paper over it.
function core(s){
  if (typeof s.t !== 'number' || !isFinite(s.t)) return 'core:t';
  if (typeof s.reserves !== 'number' || typeof s.treasury !== 'number') return 'core:money';
  if (!s.policy || typeof s.policy !== 'object' || Array.isArray(s.policy)) return 'core:policy';
  if (!s.provs || typeof s.provs !== 'object' || Array.isArray(s.provs)) return 'core:provs';
  for (const p of PROVS){
    const q = s.provs[p.id];
    if (!q || typeof q.u !== 'number' || !isFinite(q.u)) return 'core:prov:' + p.id;
  }
  return null;
}

// The one door every save comes through, from storage or from a pasted code.
function accept(raw){
  const m = migrate(raw); if (m.err) return m;
  const rubble = core(m.s); if (rubble) return { err:'broken', detail:rubble };
  heal(m.s);
  const bad = validate(m.s); if (bad) return { err:'broken', detail:bad };
  return { s:m.s };
}

// The previous save is kept one deep. It is only ever rotated from a value a running game
// already wrote, so the backup is always a whole save, never a half-written one.
function persist(){
  STORE[UI.active] = { S }; STORE.active = UI.active;
  try {
    const next = JSON.stringify(STORE), prev = localStorage.getItem(KEY);
    if (prev && prev !== next) localStorage.setItem(BAK, prev);
    localStorage.setItem(KEY, next);
  } catch(e){
    // out of room: the backup is the older, smaller copy - drop it and keep the live game
    try { localStorage.removeItem(BAK); localStorage.setItem(KEY, JSON.stringify(STORE)); } catch(e2){}
  }
}
function restore(){
  for (const key of [KEY, BAK]){
    let o = null; try { o = JSON.parse(localStorage.getItem(key) || 'null'); } catch(e){}
    if (!o || typeof o !== 'object') continue;
    const act = o.active === 'mission' ? 'mission' : 'campaign', slot = o[act];
    if (!slot || !slot.S) continue;
    const r = accept(slot.S); if (r.err) continue;   // damaged: fall through to the backup
    STORE = o; UI.active = act; slot.S = r.s; S = r.s; syncD(); UI.started = true;
    UI.fromBak = key === BAK;   // told to the player once the frame exists
    return true;
  }
  return false;
}
// Months owed since the tab was closed. Nothing here decides anything for the player: crises
// that would have fired are queued and asked on return, never answered on their behalf.
function monthsOwed(){
  if (!S || !S.live || S.over) return 0;
  return Math.min(LIVE_CATCHUP_MAX, Math.floor((Date.now() - (S.realAt || Date.now())) / LIVE_MS_PER_MONTH));
}
function catchUp(){
  const owed = monthsOwed(); if (owed < 1) return null;
  const before = snap(S), notes = [], queued = S.pending || [];
  let done = 0, fail = null;
  for (let i = 0; i < owed; i++){
    S = step(S); done++;
    S.last.notes.forEach(n => { notes.push(n); S.log.push([S.t, ...n]); });
    S.history.push(snap(S)); if (S.history.length > 480) S.history.shift();
    fail = checkFail(S); if (fail){ S.over = { fail:fail.id }; break; }
    if (!S.mission && S.t >= GAME_MONTHS * (S.chapter || 1)){ S.over = { won:true, chapter:S.chapter || 1 }; break; }
    if (S.mission && S.t >= S.mission.end){ S.over = { mission:MISSIONS[S.mission.id].check(S) }; break; }
    if (queued.length < LIVE_QUEUE_MAX){ const id = drawEvent(S); if (id) queued.push(id); }
  }
  S.realAt = (S.realAt || Date.now()) + done * LIVE_MS_PER_MONTH;
  S.pending = queued;
  if (S.log.length > 80) S.log = S.log.slice(-80);
  syncD(); persist();
  return { months:done, before, notes, queued:queued.length, fail:S.over };
}
function begin(diff, mission){
  setSpeed(0);
  UI.active = mission ? 'mission' : 'campaign';
  S = startGame(undefined, diff, mission); S.history = [snap(S)]; S.log = []; syncD();
  if (UI.live){ S.live = true; S.realAt = Date.now(); S.pending = []; }
  UI.drawer = null; UI.provOpen = false; UI.toasts = []; UI.started = true; persist();
}
function saveCode(){ return btoa(unescape(encodeURIComponent(JSON.stringify({ v:6, S, active:UI.active })))); }
function loadCode(code){
  let o = null;
  try { o = JSON.parse(decodeURIComponent(escape(atob(code.trim())))); } catch(e){ UI.loadErr = 'broken'; return false; }
  if (!o || !o.S){ UI.loadErr = 'broken'; return false; }
  const r = accept(o.S);
  if (r.err){ UI.loadErr = r.err; return false; }   // say why it failed, not just that it did
  UI.active = o.active === 'mission' ? 'mission' : 'campaign';
  S = r.s; syncD(); setSpeed(0); UI.started = true; persist(); return true;
}
function pcLeft(){ return S.pc; }
function usdLeft(){ return S.reserves; }
const cooldown = (key, months = ACT_COOLDOWN) => S.flags[key] !== undefined && S.t - S.flags[key] < months;

// ---------- clock ----------
function setSpeed(v){
  UI.speed = v; if (TIMER) clearInterval(TIMER); TIMER = null;
  if (S && S.live){ TIMER = setInterval(liveTick, 15000); return; }   // the wall decides, not a button
  if (v > 0) TIMER = setInterval(tick, SPEEDS[v]);
}
// In a live game the clock is the real one. Poll often enough to feel prompt, advance only
// when an hour of real time has actually passed.
function liveTick(){
  if (!S || !S.live || S.over) return;
  if (monthsOwed() < 1){ renderLiveClock(); return; }
  if ($('#modal').innerHTML.trim()) return;
  S.realAt = (S.realAt || Date.now()) + LIVE_MS_PER_MONTH;
  advance();
}
function tick(){
  if (!S || S.over || document.hidden || $('#modal').innerHTML.trim()) return;
  advance();
}
function advance(){
  if (S.over) return;                           // a finished presidency does not keep running
  const prevScore = S.score, prev = S;
  S = step(S); syncD();
  UI.flash = {};
  [['cash', s => s.treasury, 1.5, true], ['usd', s => s.reserves, 12, true], ['fx', s => s.parallel, 1.5, false], ['pay', s => realWage(s), 0.3, true], ['trust', s => s.trust, 0.35, true], ['anger', s => natUnrest(s), 0.35, false], ['power', s => nationalHours(s), 0.08, true]]
    .forEach(([k, g, thr, goodUp]) => { const d = g(S) - g(prev); if (Math.abs(d) >= thr) UI.flash[k] = (d > 0) === goodUp ? 'up' : 'down'; });
  S.last.notes.forEach(n => { const k = n[0]; if (['projDone','investDone','portDone','gridDone'].includes(k)) sfx('done'); else if (k === 'dealOff' || k === 'facFrozen' || (k === 'offshore' && !n[1])) sfx('bad'); else if (k === 'offshore' || k === 'dealOn') sfx('cycle'); else if (k === 'grant') sfx('coin'); });
  if (S.score - prevScore >= 0.4) sfx('up'); else if (S.score - prevScore <= -0.4) sfx('down'); else sfx('tick');
  S.last.notes.forEach(n => { S.log.push([S.t, ...n]); toast(noteText([S.t, ...n])); });
  if (S.log.length > 80) S.log = S.log.slice(-80);
  S.history.push(snap(S)); if (S.history.length > 480) S.history.shift();
  UI.scoreDelta = S.score - prevScore;
  if (S.t % 6 === 0){ const nc = detectCycles(); if (nc.length){ S.cycles = (S.cycles || []).concat(nc); UI.newCycle = true; UI.queue = nc.map(id => ['cycle', id]); } }
  const fail = checkFail(S);
  if (fail){ S.over = { fail:fail.id }; setSpeed(0); persist(); render(true); sfx('fail'); return showFail(fail.id); }
  // Reaching a level is the game's reward moment: it stops the clock and shows what it opened.
  // The summit gets a victory screen of its own, and the ladder carries on afterwards.
  if ((S.lvl || 1) > (prev.lvl || 1)){
    setSpeed(0); persist(); render(true); sfx('cycle');
    return (S.lvl === LEVEL_MAX) ? showSummit() : showLevelUp(S.lvl);
  }
  if (S.mission && S.t >= S.mission.end){ S.over = { mission:MISSIONS[S.mission.id].check(S) }; setSpeed(0); persist(); render(true); return showMissionEnd(); }
  if (S.t % 12 === 0){ const ago = S.history.find(h => h.t === S.t - 12); toast(fill(t('newYear'), [yearNow(S), Math.round(S.score), ago ? sign(S.score - ago.score, 0) : '±0']), 'year'); sfx('year'); }
  if (!S.mission && S.t >= GAME_MONTHS * (S.chapter || 1)){ S.over = { won:true, chapter:S.chapter || 1 }; setSpeed(0); persist(); render(true); sfx('year'); return showLegacy(); }
  if (!S.mission && S.t > 0 && S.t % 60 === 0){ persist(); render(true); sfx('year'); return showMilestone(); }
  if (UI.queue && UI.queue.length){ persist(); render(true); sfx('cycle'); const [, id] = UI.queue.shift(); return showCycle(id, true); }
  S.event = drawEvent(S);
  persist(); render();
  if (S.event){ sfx('crisis'); showEvent(); }
}
function afterResults(){ if (UI.queue && UI.queue.length){ const [, id] = UI.queue.shift(); return showCycle(id, true); } if (S.event) return showEvent(); closeModal(); render(true); }

// ---------- effects of a decision: now, and over the next 6 months ----------
const EFX_KEYS = [
  ['pc', s => s.pc, 1, true, v => sign(v, 0)], ['cash', s => s.treasury, 0.5, true, v => sign(v, 1) + (AR() ? ' مليار' : 'bn')],
  ['usd', s => s.reserves, 3, true, v => (v > 0 ? '+' : MINUS) + usdM(Math.abs(v))], ['fx', s => s.parallel, 0.8, false, v => sign(v, 0) + (AR() ? ' ليرة' : ' lira')],
  ['pay', s => realWage(s), 0.25, true, v => (v > 0 ? '+' : MINUS) + usd(Math.abs(v))], ['trust', s => s.trust, 0.4, true, v => sign(v, 1)],
  ['anger', s => natUnrest(s), 0.4, false, v => sign(v, 1)], ['power', s => nationalHours(s), 0.1, true, v => sign(v, 1) + (AR() ? 'س' : 'h')],
  ['poor', s => (s.cls || classes(s)).poor, 0.4, false, v => sign(v, 1) + '%'],
  ['edu', s => s.edu, 0.35, true, v => sign(v, 1)], ['health', s => s.health, 0.35, true, v => sign(v, 1)],
  ['sov', s => s.sov, 0.5, true, v => sign(v, 0)],
  ['score', s => s.score, 0.2, true, v => sign(v, 1)],
];
const EFX_ICON = { poor:'🧍' };
function withEffects(title, fn){
  const before = clone(S), pB = step(before, 0.5);
  const ok = fn();
  if (!ok){ toast('⚠️ ' + t('cantNow')); return false; }   // a click that does nothing is a bug, not a no-op
  const pA = step(S, 0.5), now = [], later = [];
  EFX_KEYS.forEach(([k, get, thr, goodUp, fmt]) => {
    const dn = get(S) - get(before), dl = (get(pA) - get(pB)) - dn;
    if (Math.abs(dn) >= thr) now.push([k, dn, (dn > 0) === goodUp, fmt(dn)]);
    if (Math.abs(dl) >= thr) later.push([k, dl, (dl > 0) === goodUp, fmt(dl)]);
  });
  UI.flash = {}; [...now, ...later].forEach(([k, , good]) => { if (k !== 'pc' && k !== 'score') UI.flash[k] = good ? 'up' : 'down'; });
  const id = Date.now(); UI.effect = { id, title, now, later };
  setTimeout(() => { if (UI.effect && UI.effect.id === id){ UI.effect = null; renderEffect(); } }, 9000);
  sfx(later.some(x => !x[2]) && !later.some(x => x[2]) ? 'down' : 'decide');
  return true;
}
function effChip([k, , good, txt]){ const g = GLOSS[k]; return `<span class="chip ${good ? 'up' : 'down'}">${EFX_ICON[k] || (g ? g.icon : '⭐')} ${esc(txt)}</span>`; }
function renderEffect(){
  const el = $('#effectbox'); if (!el) return;
  const e = UI.effect; if (!e){ el.innerHTML = ''; return; }
  const A = AR();
  el.innerHTML = `<div class="effect" role="status"><button class="close" data-act="closeEffect" aria-label="${t('close')}">✕</button><div class="et">✅ ${esc(e.title)}</div>
    ${e.now.length ? `<div class="erow"><span class="el">${A ? 'الآن' : 'Right now'}</span><span class="chips">${e.now.map(effChip).join('')}</span></div>` : ''}
    <div class="erow"><span class="el">${A ? 'خلال 3 أشهر' : 'Over 3 months'}</span><span class="chips">${e.later.length ? e.later.map(effChip).join('') : `<span class="chip">${A ? 'تأثير صغير أو بطيء' : 'Small or slow effect'}</span>`}</span></div></div>`;
}

// ---------- toasts ----------
function toast(text, kind){
  if (!text) return; const id = ++TOAST_ID;
  UI.toasts.push({ id, text, kind }); if (UI.toasts.length > 4) UI.toasts.shift();
  renderToasts(); setTimeout(() => { UI.toasts = UI.toasts.filter(x => x.id !== id); renderToasts(); }, kind === 'year' ? 7000 : 5000);
}
function renderToasts(){ const el = $('#toasts'); if (el) el.innerHTML = UI.toasts.map(x => `<div class="toast ${x.kind || ''}">${esc(x.text)}</div>`).join(''); }

// ---------- notes / news ----------
function noteText(n){
  const N = NOTE[LANG], [, k, a, b, c] = n;
  const inv = id => L2(INV_TXT[id])[0], partner = id => L2(PART_TXT[id])[0];
  switch(k){
    case 'relief': case 'grantPop': return N[k];
    case 'wage': return fill(N.wage, [a]);
    case 'decree': return fill(N.decree, [L2(DEC_TXT[a])[0]]);
    case 'projStart': return c > 3 ? fill(N.projStartLeak, [PN(a), monthsTxt(b), c]) : fill(N.projStart, [PN(a), monthsTxt(b)]);
    case 'projDone': return b > 3 ? fill(N.projDoneLeak, [PN(a), L2(PROJ_TXT[a])[0], b]) : fill(N.projDone, [PN(a), L2(PROJ_TXT[a])[0]]);
    case 'facSign': case 'facFrozen': return fill(N[k], [L2(FAC_TXT[a])[0]]);
    case 'firmSigned': return fill(N.firmSigned, [L2(FIRM_TXT[a])[1], L2(INV_TXT[b])[0]]);
    case 'firmDone': return fill(N.firmDone, [L2(FIRM_TXT[a])[1], L2(INV_TXT[b])[0]]);
    case 'grant': case 'wbGrid': case 'gridDone': return fill(N[k], [a]);
    case 'private': return '';
    case 'event': return fill(t('youChose'), [L2(EV_TXT[a])[0], L2(EV_TXT[a])[2][b][0]]);
    case 'svcStart': return fill(N.svcStart, [svcLabel(a), monthsTxt(b)]);
    case 'lvlStart': return fill(N.lvlStart, [a, monthsTxt(b)]);
    case 'lvlDone': return fill(N.lvlDone, [a]);
    case 'svcDone': return fill(N.svcDone, [svcLabel(a), b]);
    case 'portDone': return fill(N.portDone, [PORT_NAME[LANG][a], b]);
    case 'portStart': case 'portConcession': return fill(N[k], [PORT_NAME[LANG][a]]);
    case 'dealOn': case 'dealOff': case 'dealSign': return fill(N[k], [partner(a)]);
    case 'investStart': return fill(N.investStart, [inv(a), monthsTxt(b)]);
    case 'investDone': return fill(N.investDone, [inv(a)]);
    case 'offshore': return a ? N.offshoreHit : N.offshoreDry;
    default: return '';
  }
}
function renderNews(){
  const items = S.log.slice().reverse().map(e => [e[0], noteText(e)]).filter(x => x[1]).slice(0, 30);
  if (!items.length) return `<p class="muted">${t('newsEmpty')}</p>`;
  return `<ul class="newslist">${items.map(([tt, x]) => `<li><span class="nd">${esc(whenTxt(tt))}</span>${esc(x)}</li>`).join('')}</ul>`;
}

// ---------- world-state helpers that used seasons ----------
function provBadge(id){ const pv = S.provs[id]; return (pv.project === true ? '✅' : pv.project === 'building' ? '🏗️' : '') + (tierOf(pv.u) === 'revolt' ? '⚠️' : ''); }
function personas(s){
  const P = s.policy, rw = realWage(s), infl = Math.max(0, s.infl - 20), h = id => provHours(s, id);
  const breadC = { full:5, partial:8, removed:15 }[P.bread], trans = { full:4, partial:7, market:11 }[P.fuel], out = {};
  { const gen = (24 - h('aleppo')) * 1.1, bro = s.flags.unified || s.flags.remitBoost ? 45 : 32;
    out.rana = { inc:[['salary', rw], ['side', 12], ['brother', bro]], exp:[['food', 36 * (1 + infl / 200)], ['bread', breadC], ['generator', gen], ['transport', trans], ['rent', 18]], why: gen > 14 ? 'why_power' : rw < 22 ? 'why_pay' : breadC > 10 ? 'why_bread' : null }; }
  { const drought = s.flags.droughtUntil && s.t < s.flags.droughtUntil;
    const crop = 95 * (drought ? 0.45 : 1) * (1 - s.provs.hasakeh.jobless / 260) * (built(s, 'hasakeh') ? 1.25 : 1) * { full:1.15, partial:1, removed:0.9 }[P.bread] * (1 - Math.max(0, s.provs.hasakeh.u - 60) / 100) * (s.res.farm > 1 ? 1 + (s.res.farm - 1) * 0.1 : 1);
    out.khaled = { inc:[['crop', crop]], exp:[['diesel', { full:8, partial:14, market:22 }[P.fuel]], ['seeds', 15 * (1 + infl / 150)], ['food', 30 * (1 + infl / 200)], ['bread', breadC * 0.6], ['generator', (24 - h('hasakeh')) * 0.6]], why: drought ? 'why_drought' : s.provs.hasakeh.jobless > 45 ? 'why_nojobs' : null }; }
  { const pv = s.provs.rif, back = hasDecree(s, 'restitution');
    out.hiba = { inc:[['labor', 55 * (1 + (s.cap - 20) / 120) * (1 - pv.u / 250) * clamp(1.3 - pv.jobless / 90, 0.45, 1.15)]], exp:[['rent', back ? 0 : 18 + 22 * (pv.dmg / pv.dmg0)], ['food', 28 * (1 + infl / 200)], ['bread', breadC], ['generator', (24 - h('rif')) * 0.8], ['transport', trans]], why: pv.jobless > 48 ? 'why_nojobs' : back ? 'why_homeback' : 'why_home' }; }
  { const hd = h('damascus'), bribe = s.corr * 0.35;
    out.samer = { inc:[['shop', 75 * (1 + (s.cap - 20) / 100) * clamp(hd / 12, 0.45, 1.4) * (P.tax === 'aggressive' ? 0.9 : 1)]], exp:[['generator', (24 - hd) * 1.8], ['bribes', bribe], ['stock', 20 * (1 + infl / 100)], ['rent', 28], ['food', 30 * (1 + infl / 200)]], why: (24 - hd) * 1.8 > 25 ? 'why_power' : bribe > 18 ? 'why_bribes' : infl > 10 ? 'why_fx' : null }; }
  Object.values(out).forEach(o => { o.i = o.inc.reduce((a, x) => a + x[1], 0); o.e = o.exp.reduce((a, x) => a + x[1], 0); o.net = o.i - o.e; const r = o.i / o.e;
    o.status = r >= 1.08 ? 's_ok' : r >= 0.9 ? 's_tight' : (s.trust < 35 ? 's_leave' : 's_bad'); o.mood = r >= 1.08 ? '🙂' : r >= 0.9 ? '😐' : '😟'; });
  return out;
}
function chains(s){
  const east = (s.provs.hasakeh.u + s.provs.raqqa.u) / 2, drought = s.flags.droughtUntil && s.t < s.flags.droughtUntil;
  const hrs = nationalHours(s), rw = realWage(s), R = s.reserves, lvl = (bad, weak) => bad ? 2 : weak ? 1 : 0, clog = (s.clogged || 0) > 5;
  const bread = [['farms', lvl(east > 70 || (drought && east > 55), east > 55 || drought), 'r_farms'], ['silos', built(s, 'hasakeh') ? 0 : 1, 'r_silos'], ['ports', lvl(R < 120, R < 300 || clog), 'r_ports'],
    ['mills', lvl(hrs < 3, hrs < 6), 'r_mills'], ['trucks', lvl(R < 100, s.provs.deir.u > 65 || (s.policy.fuel === 'market' && R < 250)), 'r_trucks'], ['bakeries', s.policy.bread === 'removed' ? 1 : 0, 'r_bak'], ['families', lvl(rw < 15, rw < 25), 'r_fam']];
  const eastAll = (s.provs.deir.u + s.provs.hasakeh.u + s.provs.raqqa.u) / 3, dem = s.demand * (1 + Math.max(0, s.cap - 20) / 160);
  const energy = [['oilfields', lvl(eastAll > 70, !(hasDecree(s, 'tribal') || hasDecree(s, 'northeast')) || eastAll > 55), 'r_oil'], ['fuelimp', lvl(R < 100, R < 250), 'r_fimp'], ['refinery', built(s, 'homs') || s.res.refinery > 25 ? 0 : 1, 'r_ref'],
    ['plants', lvl(s.mw / dem < 0.25, s.mw / dem < 0.5), 'r_pl'], ['gridlines', s.policy.capex >= 20 ? 0 : 1, 'r_grid'], ['homes', lvl(hrs < 6, hrs < 12), 'r_homes']];
  const status = ch => { const b = ch.filter(x => x[1] === 2).length, w = ch.filter(x => x[1] === 1).length; return b >= 2 ? 2 : (b || w >= 2) ? 1 : 0; };
  return { bread, energy, sb:status(bread), se:status(energy) };
}

// ---------- live "why" ----------
function whyLive(){
  const H = S.history, n = H.length; if (n < 3 || !S.last) return [];
  const a = H[Math.max(0, n - 7)], c = H[n - 1], w = S.last.why, W = WHY[LANG], out = [], st = (txt, cls) => ({ txt, cls });
  const pct = (c.fx / a.fx - 1) * 100;
  if (Math.abs(pct) >= 1){
    const f = w.fx, up = pct > 0, cand = [[f.print, fill(W.print, [S.policy.print * 2])], [f.reserves, f.reserves > 0 ? W.reserves : W.reservesGood], [f.deficit, W.deficit], [f.trust, f.trust > 0 ? W.lowTrust : W.highTrust], [f.intervene, W.intervene], [f.trade, f.trade > 0 ? W.tradeBad : W.tradeGood]];
    const dr = cand.filter(([v]) => up ? v > 0.5 : v < -0.5).sort((x, y) => Math.abs(y[0]) - Math.abs(x[0])).slice(0, 2).map(x => x[1]);
    const ch = [st(dr.length ? dr.join(' + ') : W.base, 'cause'), st(up ? fill(W.fxUp, [pct.toFixed(1)]) : fill(W.fxDown, [pct.toFixed(1)]), up ? 'bad' : 'good')];
    const dp = c.pay - a.pay; if (Math.abs(dp) >= 0.3) ch.push(st(dp < 0 ? fill(W.payDown, [Math.abs(dp).toFixed(1)]) : fill(W.payUp, [dp.toFixed(1)]), dp < 0 ? 'bad' : 'good'));
    const dt = c.trust - a.trust; if (Math.abs(dt) >= 0.5 && dp * dt > 0) ch.push(st(dt < 0 ? fill(W.trustDown, [Math.abs(dt).toFixed(1)]) : fill(W.trustUp, [dt.toFixed(1)]), dt < 0 ? 'bad' : 'good'));
    out.push({ icon:'💱', steps:ch, weight:Math.abs(pct) * 2 });
  }
  if ((S.clogged || 0) > 3) out.push({ icon:'🚢', weight:6, steps:[st(W.clogged, 'cause'), st(fill(W.lostExports, [usdM(S.clogged * 2)]), 'bad')] });
  { const dt = c.trust - a.trust; if (Math.abs(dt) >= 0.5){
      const parts = Object.entries(w.trustParts).filter(([k, v]) => k !== 'base' && Math.abs(v) >= 1.5).sort((x, y) => dt < 0 ? x[1] - y[1] : y[1] - x[1]).slice(0, 2);
      if (parts.length) out.push({ icon:'🤝', weight:Math.abs(dt) * 1.5, steps:[st(parts.map(([k, v]) => `${W['t_' + k]} (${sign(v, 0)})`).join(' + '), 'cause'), st(dt < 0 ? fill(W.trustDown, [Math.abs(dt).toFixed(1)]) : fill(W.trustUp, [dt.toFixed(1)]), dt < 0 ? 'bad' : 'good')] });
  } }
  { const da = c.anger - a.anger; if (Math.abs(da) >= 0.5){
      const parts = Object.entries(w.angerParts).filter(x => da > 0 ? x[1] >= 2 : x[1] <= -2).sort((x, y) => da > 0 ? y[1] - x[1] : x[1] - y[1]).slice(0, 2);
      if (parts.length) out.push({ icon:'🔥', weight:Math.abs(da) * 1.5, steps:[st(parts.map(([k]) => W[(da > 0 ? 'a_' : 'b_') + k]).join(' + '), 'cause'), st(da > 0 ? fill(W.angerUp, [da.toFixed(1)]) : fill(W.angerDown, [Math.abs(da).toFixed(1)]), da > 0 ? 'bad' : 'good')] });
  } }
  { const d = c.cash - a.cash; if (Math.abs(d) >= 3){ const rows = S.last.ledger.syp.slice().sort((x, y) => d < 0 ? x[1] - y[1] : y[1] - x[1]); if (rows.length)
      out.push({ icon:'💵', weight:Math.abs(d) / 3, steps:[st(fill(d < 0 ? W.biggestCost : W.biggestIncome, [LEDGER[LANG][rows[0][0]] || rows[0][0]]), 'cause'), st(fill(d < 0 ? W.cashDown : W.cashUp, [Math.abs(d).toFixed(1)]), d < 0 ? 'bad' : 'good')] }); } }
  { const dh = c.power - a.power; if (dh >= 0.3) out.push({ icon:'⚡', weight:4, steps:[st(W.gridArrived, 'cause'), st(fill(W.powerUp, [dh.toFixed(1)]), 'good')] }); }
  return out.sort((x, y) => y.weight - x.weight).slice(0, 3);
}
function detectCycles(){
  const H = S.history, n = H.length; if (n < 13) return [];
  const a = H[n - 13], b = H[n - 7], c = H[n - 1], found = [];
  if (b.print > 0 && c.print > 0 && c.fx > b.fx && b.fx > a.fx && c.pay < b.pay) found.push('printing');
  if (b.capex > 0 && c.capex > 0 && c.mw > a.mw + 150 && c.cap > a.cap && c.usd > b.usd) found.push('growth');
  if (c.trust > b.trust && b.trust > a.trust && c.privB > 0.1 && c.anger < a.anger) found.push('trust');
  if (c.contagion > 1 && c.anger > b.anger) found.push('anger');
  if (c.debt > a.debt && c.usd < b.usd && b.usd < a.usd) found.push('debt');
  return found.filter(id => !(S.cycles || []).includes(id));
}

// ---------- HUD ----------
function renderHUD(P){
  const rw = realWage(S), nu = natUnrest(S), pw = nationalHours(S), jb = joblessNat(S);
  const total = S.mission ? S.mission.end - S.mission.start : 60, done = S.mission ? S.t - S.mission.start : S.t % 60;
  const C = 2 * Math.PI * 22, frac = clamp(done / total, 0, 1);
  const ring = `<div class="ring"><svg viewBox="0 0 54 54" aria-hidden="true"><circle cx="27" cy="27" r="22" fill="var(--board-2)" stroke="var(--board-2)" stroke-width="6"/><circle cx="27" cy="27" r="22" fill="none" stroke="var(--gold)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(C * frac).toFixed(1)} ${C.toFixed(1)}"/></svg><span class="ic">${seasonNow(S) === 'H1' ? '🌾' : '❄️'}</span></div>`;
  const sc = S.score, P6 = P, dsc = P6.score - sc, g = gradeOf(sc);
  const pop = UI.scoreDelta && Math.abs(UI.scoreDelta) >= 0.4 ? `<span class="spop ${UI.scoreDelta > 0 ? 'up' : 'down'}">${sign(UI.scoreDelta, 1)}</span>` : '';
  UI.scoreDelta = 0;
  // The bar is how many of this level's targets are met, not an abstract point total. A player
  // can look at it and know what to do; levelPoints() could only ever be stared at.
  const lv = S.lvl || 1, nd = levelNeeds(S), met = nd.filter(d => needMet(S, d)).length;
  const plan = levelPlan(S);
  const toNext = plan ? 100 : clamp(nd.length ? met / nd.length * 100 : 0, 0, 100);
  // The level block IS the town hall: it says where you are, how close the next one is, and
  // tapping it opens the whole ladder. It used to open the score panel, which is a different
  // thing entirely, and the progress bar had no label at all.
  const lvReady = !plan && nd.length && met === nd.length;
  const lvSub = plan ? '🏗️ ' + fill(t('lvlBuilding'), [monthsTxt(plan.due - S.t)])
    : nd.length ? '🎯 ' + fill(t('lvlProgress'), [met, nd.length]) : '';
  return `<button class="turn lvl" data-act="levels" aria-label="${fill(t('levelN'), [lv])}">${ring}<div>
      <div class="yr">${fill(t('levelN'), [lv])}${plan || lvReady ? `<span class="lvdot" aria-hidden="true">${plan ? '🏗️' : '⭐'}</span>` : ''}</div>
      <div class="ss lvgoal">${esc(lvSub)}</div>
      <div class="mbarwrap lvlbar${plan ? ' building' : ''}"><i style="width:${toNext.toFixed(0)}%"></i></div></div></button>
    <button class="scorebadge g-${g}" data-act="showScore" aria-label="${t('score')}: ${Math.round(sc)}"><span class="sg">${g}</span><span><span class="sn">${Math.round(sc)}</span><span class="sl">${S.chapter > 1 ? fill(t('chapterN'), [S.chapter]) + ' · ' : ''}${esc(MONTHS[LANG][monthOf(S)])} ${yearNow(S)} <span class="dl ${dsc > 0.05 ? 'up' : dsc < -0.05 ? 'down' : 'flat'}">${dsc > 0.05 ? '▲' : dsc < -0.05 ? '▼' : '•'} ${sign(dsc, 1)}</span></span></span>${pop}</button>
    <div class="tray" role="group">
      ${res('cash', bn(S.treasury), S.treasury, P.treasury, true, sign(P.treasury - S.treasury, 1))}
      ${res('usd', usdM(S.reserves), S.reserves, P.reserves, true, (P.reserves >= S.reserves ? '+' : MINUS) + usdM(Math.abs(P.reserves - S.reserves)))}
      ${res('fx', S.parallel.toFixed(0), S.parallel, P.parallel, false, sign((P.parallel / S.parallel - 1) * 100, 0) + '%')}
      ${res('pay', usd(rw), rw, realWage(P), true, sign(realWage(P) - rw, 1))}
    </div>
    <div class="tray" role="group">
      ${res('trust', Math.round(S.trust), S.trust, P.trust, true, sign(P.trust - S.trust, 1))}
      ${res('anger', Math.round(nu), nu, natUnrest(P), false, sign(natUnrest(P) - nu, 1))}
      ${res('jobs', Math.round(jb) + '%', jb, joblessNat(P), false, sign(joblessNat(P) - jb, 1))}
      ${res('power', pw.toFixed(1) + (AR() ? 'س' : 'h'), pw, nationalHours(P), true, sign(nationalHours(P) - pw, 1))}
      ${res('sov', Math.round(S.sov), S.sov, P.sov, true, sign(P.sov - S.sov, 1))}
    </div>
    <div class="hudbtns">
    <button class="iconbtn" data-act="mute" aria-label="${SFX.on ? t('soundOff') : t('soundOn')}" title="${SFX.on ? t('soundOff') : t('soundOn')}">${SFX.on ? '🔊' : '🔇'}</button>
    <button class="iconbtn lang" data-act="lang" aria-label="${t('language')}">🌐 <span class="lt2">${t('language')}</span></button>
    <button class="iconbtn" data-act="menu" aria-label="${t('menu')}">☰</button><!--hudbtns--></div>`;
}

// ---------- advisors ----------
function advisors(P){
  const A = ADV[LANG], net = P.reserves - S.reserves, runway = net < 0 ? Math.max(1, Math.floor(S.reserves / -net * 6)) : 999;
  const econ = [], sec = [];
  if (runway <= 18) econ.push({ lvl:'bad', text:fill(A.usd, [runway]), act:A.usdAct, go:'money' });
  if (P.treasury < -20 || (S.treasury < 0 && P.treasury < S.treasury)) econ.push({ lvl:'bad', text:A.cash, act:A.cashAct, go:'policy', need:'polTax' });
  if ((S.clogged || 0) > 5) econ.push({ lvl:'warn', text:A.clog, act:A.clogAct, go:'trade', need:'trade' });
  if (S.policy.print >= 15) econ.push({ lvl:'warn', text:A.print, act:A.printAct, go:'policy', need:'polPrint' });
  const rw = realWage(S), ex = S.expWage || 25;
  if (rw < ex - 6) econ.push({ lvl:'warn', text:fill(A.pay, [rw.toFixed(0), ex.toFixed(0)]), act:A.payAct, go:'money' });
  if (nationalHours(S) < 6 && S.policy.capex === 0) econ.push({ lvl:'warn', text:A.grid, act:A.gridAct, go:'policy', need:'polCapex' });

  const worst = PROVS.map(p => ({ id:p.id, u:S.provs[p.id].u })).sort((a, b) => b.u - a.u)[0];
  if (worst.u >= 65) sec.push({ lvl:'bad', text:fill(A.prov, [PN(worst.id), Math.round(worst.u)]), act:A.provAct, sel:worst.id });
  if (natUnrest(S) >= 55 && S.policy.security !== 'heavy') sec.push({ lvl:'warn', text:A.heavy, act:A.heavyAct, go:'policy' });
  if (S.pc >= 40 && isOpen('decrees')) sec.push({ lvl:'ok', text:fill(A.spend, [Math.round(S.pc)]), act:A.spendAct, go:'decrees' });
  if (!sec.length) sec.push({ lvl:'ok', text:A.calmSec, act:A.calmSecAct });

  // health and schools
  const hea = [];
  if (S.health < 34) hea.push({ lvl:'bad', text:A.health, act:A.healthAct, go:'people', sub:['people', 'services'] });
  if (S.edu < 34) hea.push({ lvl:'bad', text:A.school, act:A.schoolAct, go:'people', sub:['people', 'services'] });
  if (S.edu >= 45 && !(S.svc.unis || 0) && isOpen('unis')) hea.push({ lvl:'warn', text:A.uni, act:A.uniAct, go:'people', sub:['people', 'services'] });
  if (!hea.length) hea.push({ lvl:'ok', text:A.calmHealth, act:A.calmHealthAct, go:'people', sub:['people', 'services'] });

  // factories and getting the goods out
  const ind = [];
  const sectorsBuilt = Object.keys(IND).reduce((n, k) => n + ((S.ind && S.ind[k]) || 0), 0);
  if ((S.clogged || 0) > 5) ind.push({ lvl:'bad', text:A.clogNow, act:A.clogNowAct, go:'trade', sub:['trade', 'ports'], need:'trade' });
  if (joblessNat(S) > 52) ind.push({ lvl:'bad', text:A.jobsBad, act:A.jobsBadAct, go:'trade', need:'trade' });
  if (!sectorsBuilt && isOpen('sectors')) ind.push({ lvl:'warn', text:A.noInd, act:A.noIndAct, go:'trade', need:'sectors' });
  if (!ind.length) ind.push({ lvl:'ok', text:A.calmInd, act:A.calmIndAct, go:'trade' });

  // an adviser who can only point at a locked panel says the calm line instead
  const usable = (arr, fallback) => { const ok = arr.filter(x => !x.need || isOpen(x.need)); return ok.length ? ok[0] : fallback; };
  return {
    econ:usable(econ, isOpen('trade') ? { lvl:'ok', text:A.calmEcon, act:A.calmEconAct, go:'trade' } : { lvl:'ok', text:t('calmEconEarly'), act:t('calmEconEarlyAct') }),
    sec:usable(sec, { lvl:'ok', text:A.calmSec, act:A.calmSecAct }),
    health:usable(hea, { lvl:'ok', text:A.calmHealth, act:A.calmHealthAct }),
    ind:usable(ind, { lvl:'ok', text:A.calmInd, act:A.calmIndAct }),
  };
}
const ADVISORS = [['econ', '🧑‍💼', 'economist'], ['sec', '🎖️', 'securityChief'], ['health', '🩺', 'ministerHealth'], ['ind', '🏭', 'ministerInd']];
// Never suggest something the player cannot reach yet: a minister whose panel is still locked
// has nothing useful to say, however worried they are.
const advisorsOpen = () => ADVISORS.filter(([k]) => k === 'econ' || k === 'sec' || (k === 'health' && isOpen('services')) || (k === 'ind' && isOpen('trade')));
function renderAdvisors(P){
  const a = advisors(P), rank = { bad:2, warn:1, ok:0 };
  // only ministers whose brief is open yet
  const shown = advisorsOpen();
  const cur = UI.adv && a[UI.adv] && shown.some(([k]) => k === UI.adv) ? UI.adv
    : shown.slice().sort((x, y) => rank[a[y[0]].lvl] - rank[a[x[0]].lvl])[0][0];
  const x = a[cur], who = shown.find(([k]) => k === cur);
  const por = ([k, icon, name]) => `<button class="portrait" data-act="adv" data-v="${k}" aria-pressed="${UI.advOpen && cur === k}" aria-label="${esc(t(name))}" title="${esc(t(name))}">${icon}<span class="dot ${a[k].lvl}"></span></button>`;
  return `<div class="advisors"><div class="portraits">${shown.map(por).join('')}</div>
    ${UI.advOpen ? `<div class="bubble"><button class="advhide" data-act="advhide" aria-label="${t('hide')}" title="${t('hide')}">✕</button><div class="who">${esc(t(who[2]))}</div>${esc(x.text)}<span class="act">${esc(x.act)}</span>
      ${x.go || x.sel ? `<div class="row"><button class="btn small primary" data-act="advgo" data-go="${x.go || ''}" data-sel="${x.sel || ''}" data-sub="${x.sub ? x.sub.join(',') : ''}">${t('showMe')}</button></div>` : ''}</div>` : ''}</div>`;
}

// ---------- province card (instant actions) ----------
function renderProvince(){
  const id = UI.sel, p = PROV_BY[id], pv = S.provs[id], x = PROJECTS[id], tx = L2(PROJ_TXT[id]);
  const tier = tierOf(pv.u), hrs = provHours(S, id);
  let why = ''; if (!pv.project){ if (x.pc > S.pc) why = fill(t('needsInfluence'), [x.pc]); else if (x.usd > S.reserves + S.grant) why = fill(t('needsUsdProj'), [x.usd]); }
  const meter = (icon, k, v, pct, col) => `<div class="meter"><div>${icon} ${k}</div><div class="mv">${v}</div><div class="bar"><i style="width:${clamp(pct, 0, 100)}%;background:${col}"></i></div></div>`;
  const A = AR(), good = [];
  if (x.unrest) good.push(`🔥 ${sign(x.unrest)}`); if (x.power) good.push(`💡 +${x.power}${A ? 'س' : 'h'}`); if (x.jobs) good.push(A ? `💼 ${-x.jobs} فرصة عمل` : `💼 ${-x.jobs} jobs`);
  if (x.rev) good.push(`💵 +${bn(x.rev * 2)}/${A ? 'سنة' : 'yr'}`); if (x.transit) good.push(`🏦 +${usdM(x.transit * 2)}/${A ? 'سنة' : 'yr'}`); if (x.phosphate) good.push(`⛏️ +${usdM(x.phosphate * 2)}/${A ? 'سنة' : 'yr'}`); if (x.oil) good.push(`🛢️ +${usdM(x.oil * 2)}/${A ? 'سنة' : 'yr'}`);
  if (x.wheat) good.push(`🌾 ${MINUS}${usdM(x.wheat * 2)}/${A ? 'سنة' : 'yr'}`); if (x.mw) good.push(`⚡ +${x.mw} MW`); if (x.cap) good.push(A ? '🏭 اقتصاد أكبر' : '🏭 bigger economy'); if (x.trust) good.push(`🤝 +${x.trust}`);
  const mF = projMonths(id, 'fast'), mT = projMonths(id, 'tender'), lF = Math.round(x.usd * projLeakRate(S, 'fast')), lT = Math.round(x.usd * projLeakRate(S, 'tender'));
  const pending = (S.pipe || []).find(i => i.kind === 'proj' && i.id === id);
  let action;
  if (pv.project === true) action = `<span class="chip up">${t('builtTag')}</span>${pv.leak > 0.05 ? `<div class="why">${fill(t('leaked'), [Math.round(x.usd * pv.leak)])}</div>` : ''}`;
  else if (pv.project === 'building') action = `<span class="chip">🏗️ ${fill(t('building'), [monthsTxt(pending ? pending.due - S.t : 1)])}</span>`;
  else action = `<div class="contract">
      <button class="opt mini" data-act="proj" data-id="${id}" data-mode="fast" ${why ? 'disabled' : ''}><b>⚡ ${t('buildFast')}</b><span class="t">${fill(t('fastTxt'), [monthsTxt(mF), lF])}</span></button>
      <button class="opt mini" data-act="proj" data-id="${id}" data-mode="tender" ${why ? 'disabled' : ''}><b>⚖️ ${t('buildTender')}</b><span class="t">${fill(t('tenderTxt'), [monthsTxt(mT), lT])}</span></button></div>`;
  const note = id === 'rif' ? t('rifNote') : id === 'damascus' ? t('damNote') : '';
  return `<aside class="pcard"><div class="head"><div><h2>${esc(PN(id))}</h2><span class="tierpill" style="background:${TIER_COL[tier]}">${tierName(tier)}</span></div><button class="close" data-act="closeProv" aria-label="${t('close')}">✕</button></div>
    <div class="body"><p class="muted" style="margin:0 0 10px;font-size:13px">${note}${fill(t('people'), [p.pop.toFixed(1)])}</p>
      <div class="meters">${meter('🔥', t('anger'), Math.round(pv.u), pv.u, TIER_COL[tier])}${meter('💡', t('electricity'), hrs.toFixed(1) + ' ' + t('hDay'), hrs / 24 * 100, '#e2b93b')}
        ${meter('🏚️', t('destroyed'), usdM(pv.dmg * 1000), pv.dmg / Math.max(1, pv.dmg0) * 100, '#b4513a')}${meter('💼', t('jobless'), Math.round(pv.jobless) + '%', pv.jobless, '#c8612f')}</div>
      <div class="quest${pv.project === true ? ' done' : ''}"><div class="qt">🏗️ ${t('bigProject')}</div><h4>${esc(tx[0])}</h4><p><b>${t('problem')}</b> ${esc(tx[1])}</p>
        <div class="reward">${good.map(g => `<span class="chip up">${esc(g)}</span>`).join('')}</div>
        <div class="row" style="margin-bottom:8px"><span class="chip">🏦 ${usdM(x.usd)}</span><span class="chip">💵 ${bn(x.syp)}</span>${x.pc ? `<span class="chip">⭐ ${x.pc}</span>` : ''}</div>
        ${action}${why ? `<div class="why">${esc(why)}</div>` : ''}</div></div></aside>`;
}

// ---------- drawers ----------
const POL_GATE = { bread:'policy', fuel:'policy', security:'policy', tax:'polTax', print:'polPrint', capex:'polCapex', recon:'polRecon', intervene:'polIntervene', crackdown:'polCrackdown' };
function renderPolicy(){
  return Object.keys(POL).filter(k => isOpen(POL_GATE[k])).map(k => { const p = L2(POL[k]), cur = S.policy[k];
    return `<div class="pol"><div class="ph"><span class="pic" aria-hidden="true">${POL[k].icon}</span><div><h3>${p.name}</h3><div class="q">${p.q}</div></div></div>
      <div class="seg" role="group">${POL_VALUES[k].map(v => `<button data-act="pol" data-k="${k}" data-v="${v}" aria-pressed="${String(cur) === String(v)}">${p.opts[String(v)]}</button>`).join('')}</div>
      <div class="hint">${esc(p.hint[String(cur)])}</div></div>`; }).join('');
}
function renderDecrees(){
  return DECREES.map(x => {
    const tx = L2(DEC_TXT[x.id]), done = S.decrees[x.id] !== undefined;
    let why = ''; if (!done){ if (x.pc > S.pc) why = fill(t('needsInfluence'), [x.pc]); else if (x.usd > S.reserves) why = fill(t('needsUsd'), [x.usd]); else if (x.req && !x.req(S)) why = AR() ? 'يحتاج ثقة 40 أو أكثر' : 'Needs trust of 40+'; }
    return `<div class="dcard${done ? ' done' : ''}"><span class="gem">⭐ ${x.pc}</span><h4>${esc(tx[0])}</h4><p class="kid">${esc(tx[1])}</p><div class="fx">${esc(tx[2])}</div>
      <div class="row spread"><div class="row">${x.syp ? `<span class="chip">💵 ${bn(x.syp)}</span>` : ''}${x.usd ? `<span class="chip">🏦 ${usdM(x.usd)}</span>` : ''}</div>
      ${done ? `<span class="chip up">${t('done')}</span>` : `<button class="btn primary" data-act="decree" data-id="${x.id}" ${why ? 'disabled' : ''}>${t('choose')}</button>`}</div>${why ? `<div class="why">${esc(why)}</div>` : ''}</div>`;
  }).join('');
}
function renderMoneyActions(){
  const rw = realWage(S), raiseCd = cooldown('lastRaise', 6), giftCd = cooldown('lastGift', 6), relCd = cooldown('lastRelief', 6), A = AR();
  const cdTxt = key => fill(A ? 'متاح مجدداً خلال {0}' : 'Available again in {0}', [monthsTxt(6 - (S.t - S.flags[key]))]);
  let h = `<div class="group"><h3>👷 ${t('raiseTitle')}</h3><p>${fill(t('raiseText'), [rw.toFixed(0), (S.expWage || 25).toFixed(0)])}</p>
    <div class="row"><button class="btn primary" data-act="wage" data-v="10" ${raiseCd ? 'disabled' : ''}>+10%</button><button class="btn primary" data-act="wage" data-v="25" ${raiseCd ? 'disabled' : ''}>+25%</button></div>${raiseCd ? `<div class="why">${cdTxt('lastRaise')}</div>` : ''}</div>`;
  h += `<div class="group"><h3>⭐ ${t('buyTitle')}</h3><p>${t('buyText')}</p>
    <div class="dcard"><span class="gem">⭐ +8</span><h4>${t('giftTitle')}</h4><div class="row spread"><span class="chip">💵 ${bn(7)}</span><button class="btn primary" data-act="grantPop" ${giftCd ? 'disabled' : ''}>${t('choose')}</button></div>${giftCd ? `<div class="why">${cdTxt('lastGift')}</div>` : ''}</div>
    <div class="dcard"><span class="gem">⭐ +6</span><h4>${t('reliefTitle')}</h4><div class="row spread"><div class="row"><span class="chip">🏦 ${usdM(40)}</span><span class="chip up">${fill(CHIP[LANG].trust, ['+2'])}</span></div><button class="btn primary" data-act="relief" ${relCd || S.reserves < 40 ? 'disabled' : ''}>${t('choose')}</button></div>${relCd ? `<div class="why">${cdTxt('lastRelief')}</div>` : ''}</div></div>`;
  {
    const sov0 = S.sov0 === undefined ? 60 : S.sov0, room = Math.max(0, sov0 - S.sov);
    const spare = Math.max(0, S.reserves - 300), amts = [250, 1000].filter(a => a <= S.debt);
    // Every greyed button needs its own reason. The why used to be computed against the cheapest
    // amount only, so the $1.00B button went dead and said nothing.
    const why = S.debt <= 0 ? t('repayNone') : spare < amts[0] ? t('repayNeed')
      : amts.some(a => a > spare) ? fill(t('repaySpare'), [usdM(Math.floor(spare))]) : '';
    const dead = a => S.debt <= 0 || a > spare;
    h += `<div class="group"><h3>\u{1F9ED} ${t('repayTitle')}</h3><p>${fill(t('repayText'), [usdM(S.debt), usdM(SOV_PER_USD)])}</p>
      <div class="dcard"><h4>${t('debtLeft')}: ${usdM(S.debt)}</h4>
      <div class="row spread"><div class="row">${room > 0 ? `<span class="chip up">${fill(t('buysBack'), [Math.min(room, 250 / SOV_PER_USD).toFixed(1)])}</span>` : `<span class="chip">${t('repayDone')}</span>`}</div>
      <div class="row">${amts.map(a => `<button class="btn primary" data-act="repay" data-v="${a}" ${dead(a) ? 'disabled' : ''}>${usdM(a)}</button>`).join('')}</div></div>
      ${why ? `<div class="why">${esc(why)}</div>` : ''}</div></div>`;
  }
  h += `<div class="group"><h3>🌍 ${t('abroadTitle')}</h3><p>${t('abroadText')}${S.grant > 0 ? ' ' + fill(t('grantOnHand'), [usdM(S.grant)]) : ''}</p>` + FACILITIES.map(f => {
    const tx = L2(FAC_TXT[f.id]), st = S.facilities[f.id];
    let why = ''; if (!st){ if (f.pc > S.pc) why = fill(t('needsInfluence'), [f.pc]); else if (f.signReq && !f.signReq(S)) why = f.id === 'gulf' ? (A ? 'يحتاج فساداً أقل من 50' : 'Needs corruption below 50') : (A ? 'يحتاج ثقة 40 أو أكثر' : 'Needs trust of 40+'); }
    const total = f.tranches.reduce((a, x) => a + x[1], 0);
    let status = ''; if (st) status = st.frozen ? `<span class="chip down">${t('frozen')}</span>` : st.paid >= f.tranches.length ? `<span class="chip up">${t('allPaid')}</span>` : `<span class="chip">${fill(t('paidOf'), [st.paid, f.tranches.length])}</span>`;
    return `<div class="dcard${st ? ' done' : ''}">${f.pc ? `<span class="gem">⭐ ${f.pc}</span>` : ''}<h4>${esc(tx[0])}</h4><p class="kid">🏦 <b>${usdM(total)}</b> · ${esc(tx[1])}</p>
      <div class="row spread"><div class="row"><span class="chip down">${t('independence')} ${MINUS}${f.sov}</span>${f.debt ? `<span class="chip down">+${usdM(f.debt)} ${t('debt')}</span>` : ''}</div>
      ${st ? status : `<button class="btn primary" data-act="fac" data-id="${f.id}" ${why ? 'disabled' : ''}>${t('sign')}</button>`}</div>${why ? `<div class="why">${esc(why)}</div>` : ''}</div>`;
  }).join('') + '</div>';
  return h;
}
function renderMoneyBudget(){
  const P12 = step(S, 2), Lg = P12.last.ledger, LB = LEDGER[LANG];
  const merge = rows => { const m = {}; rows.forEach(([k, v]) => m[k] = (m[k] || 0) + v); return Object.entries(m); };
  const bars = (rows, fmt, title) => { rows = merge(rows); const mx = Math.max(...rows.map(r => Math.abs(r[1])), 1), tot = rows.reduce((a, r) => a + r[1], 0);
    return `<h3 class="bh">${title}</h3>${rows.map(r => `<div class="brow"><span>${esc(LB[r[0]] || r[0])}</span><div class="btrack"><i class="${r[1] < 0 ? 'neg' : 'pos'}" style="width:${Math.abs(r[1]) / mx * 100}%"></i></div><b class="${r[1] < 0 ? 'bad' : 'good'}">${fmt(r[1])}</b></div>`).join('')}
      <div class="brow total"><span>${t('leftOver')}</span><div></div><b class="${tot < 0 ? 'bad' : 'good'}">${fmt(tot)}</b></div>`; };
  return `<p class="muted" style="font-size:13px;margin:0">${t('budgetIntro')}</p>` + bars(Lg.syp, v => (v < 0 ? MINUS : '+') + bn(Math.abs(v)), '💵 ' + t('cashLira')) + bars(Lg.usd, v => (v < 0 ? MINUS : '+') + usdM(Math.abs(v)), '🏦 ' + t('dollars'));
}

// ---------- trade ----------
function investValue(id){
  const o = oilNumbers(S);
  switch(id){
    case 'oilwells': return 25 * o.access * o.security * 2.0 * 2;
    case 'refinery': return Math.min(20, Math.max(0, o.prod * S.policy.oilHome - o.refineCap)) * 1.2 * 2;
    case 'gasfield': return 18;
    case 'offshore': return 30;
    case 'phosphate': return 35 * 0.35 * (1 - S.provs.homs.u / 150) * 2 * (dealOn(S, 'china') ? 0.7 : 1);
    case 'farm': return 20 * (dealOn(S, 'eu') ? 1.25 : 1);
    case 'tourism': { const n = (S.ind && S.ind.tourism) || 0; const cur = tourismIncome(S);
      return cur > 0 ? cur / Math.max(1, n) * 2 : 18 * clamp(1.25 - natUnrest(S) / 55, 0, 1.1) * clamp(nationalHours(S) / 14, 0.3, 1) * 2; }
  }
  if (IND[id]) return IND[id].exp * 2 * (dealOn(S, 'eu') ? 1.25 : 1) + (IND[id].wheatCut || 0) * 2;
  return 0;
}
function renderTradeResources(){
  const o = oilNumbers(S), A = AR(), r = S.res;
  const bar = (v, max, col) => `<div class="bar big"><i style="width:${clamp(v / max * 100, 0, 100)}%;background:${col}"></i></div>`;
  let h = `<div class="rcard oil"><div class="rh"><span class="ri">🛢️</span><div><h3>${t('oilTitle')}</h3><div class="rv">${fill(t('oilProd'), [o.prod.toFixed(0)])}</div></div></div>
    ${bar(o.prod, 120, '#2a2438')}<p class="small">${fill(t('oilAccess'), [Math.round(o.access * 100), Math.round(o.security * 100)])}</p>
    <div class="q">${t('oilUseQ')}</div><div class="seg">${[0, 0.5, 1].map(v => `<button data-act="oilHome" data-v="${v}" aria-pressed="${S.policy.oilHome === v}">${t('oilUse')[v]}</button>`).join('')}</div>
    <div class="split"><span>🏠 ${fill(t('kbbl'), [o.home.toFixed(0)])}</span><div class="splitbar"><i style="width:${o.prod ? o.home / o.prod * 100 : 0}%"></i></div><span>🚢 ${fill(t('kbbl'), [o.exp.toFixed(0)])}</span></div>
    <p class="small">${fill(t('oilUseHint'), [o.refineCap])}</p></div>`;
  h += `<div class="rgrid">
    <div class="rcard"><div class="rh"><span class="ri">🔥</span><div><h3>${t('gasTitle')}</h3><div class="rv">${fill(t('gasProd'), [r.gas.toFixed(0)])}</div></div></div>${bar(r.gas, 30, '#35b6a3')}<p class="small">${t('gasHint')}</p></div>
    <div class="rcard"><div class="rh"><span class="ri">⛏️</span><div><h3>${t('phosTitle')}</h3><div class="rv">×${r.phos.toFixed(2)}</div></div></div>${bar(r.phos, 2.1, '#8c5cc7')}<p class="small">${t('phosHint')}</p></div>
    <div class="rcard"><div class="rh"><span class="ri">🫒</span><div><h3>${t('farmTitle')}</h3><div class="rv">${'●'.repeat(r.farm)}${'○'.repeat(Math.max(0, 4 - r.farm))}</div></div></div><p class="small">${t('farmHint')}</p></div></div>`;
  // one card, used by both groups below
  const investCard = id => {
    const x = INVEST[id], tx = L2(INV_TXT[id]), running = S.pipe.find(p => p.kind === 'invest' && p.id === id), count = S.invests[id] || 0;
    // no ceiling any more: the next level just costs more (investCost). Only the one-shot gamble ends.
    const maxed = id === 'offshore' && r.offshore && r.offshore !== 'drilling';
    const cost = investCost(S, id);
    const v = investValue(id), pb = v > 0.5 ? cost / v + x.months / 12 : null;
    const capped = count >= invCap(S);   // a ceiling the player cannot see is a dead click
    let why = ''; if (!running && !maxed){ if (capped) why = fill(t('lvlCapped'), [invCap(S)]); else if (S.reserves < cost) why = fill(t('needsUsd'), [cost]); else if (x.req && !x.req(S)) why = id === 'tourism' ? t('needsCalm') : t('needsCalmEast'); }
    const built = count ? `<span class="chip up">${fill(t('levelN'), [count])}</span>` : '';
    const status = running ? `<span class="chip">⏳ ${fill(t('running'), [monthsTxt(running.due - S.t)])}</span>` : maxed ? `<span class="chip up">${id === 'offshore' ? (r.offshore === 'found' ? '✅ ' + (A ? 'وُجد غاز' : 'Gas found') : '❌ ' + (A ? 'بئر جافة' : 'Dry well')) : t('maxed')}</span>`
      : `<button class="btn primary" data-act="invest" data-id="${id}" ${why ? 'disabled' : ''}>${t('investBtn')}</button>`;
    return `<div class="dcard inv"><span class="gem">🏦 ${usdM(cost)}</span><h4>${INV_TXT[id].icon} ${esc(tx[0])}</h4><p class="kid">${esc(tx[1])}</p>
      <div class="row spread"><div class="row"><span class="chip">⏳ ${monthsTxt(x.months)}</span>${x.jobs ? `<span class="chip up">💼 ${fill(t('jobsChip'), ['+' + x.jobs])}</span>` : ''}${x.gamble ? `<span class="chip down">🎲 ${t('gamble')}</span>` : ''}${pb ? `<span class="chip up">${fill(t('payback'), [monthsTxt(Math.round(pb * 12 / 6) * 6)])}</span>` : `<span class="chip">${t('paybackNever')}</span>`}${built}</div>${status}</div>
      ${why ? `<div class="why">${esc(why)}</div>` : ''}</div>`;
  };
  const SECTORS = Object.keys(INVEST).filter(k => INVEST[k].sector && !INVEST[k].supply && isOpen('sectors'))
    .concat(Object.keys(INVEST).filter(k => INVEST[k].supply && isOpen('supply')));
  const DIG = Object.keys(INVEST).filter(k => !INVEST[k].sector);
  if (SECTORS.length) h += `<h3 class="bh">🏭 ${t('sectorTitle')}</h3><p class="small muted">${t('sectorSub')}</p>` + SECTORS.map(investCard).join('');
  h += `<h3 class="bh">⛏️ ${t('extractTitle')}</h3><p class="small muted">${t('extractSub')}</p>` + DIG.map(investCard).join('');
  return h;
}
function renderTradePorts(){
  const want = (S.exportWant || 0) * 2, cap = (S.exportCap || exportCapacity(S)) * 2, A = AR();
  let h = `<div class="rcard"><div class="rh"><span class="ri">📦</span><div><h3>${t('portsTitle')}</h3><div class="small muted">${t('portsSub')}</div></div></div>
    <div class="capmeter"><i class="${want > cap ? 'over' : ''}" style="width:${clamp(want / Math.max(cap, 1) * 100, 0, 100)}%"></i></div>
    <p class="small">${fill(t('portsUse'), [usdM(want), usdM(cap)])}</p>${S.clogged > 1 ? `<p class="why">⚠️ ${fill(t('clogged'), [usdM(S.clogged * 2)])}</p>` : ''}</div>`;
  h += ['latakia', 'tartus'].map(id => {
    const p = S.ports[id], up = S.pipe.find(x => x.kind === 'port' && x.id === id);
    return `<div class="dcard port"><h4>⚓ ${PORT_NAME[LANG][id]}</h4><div class="stars">${Array.from({ length:Math.max(3, p.lvl) }, (_, i) => `<span class="${i < p.lvl ? 'on' : ''}">⚓</span>`).join('')} <span class="small muted">${fill(t('portLvl'), [p.lvl])} · ${p.op === 'foreign' ? t('portForeign') : t('portState')}</span></div>
      ${up ? `<span class="chip">⏳ ${fill(t('running'), [monthsTxt(up.due - S.t)])}</span>` :
      `<div class="contract"><button class="opt mini" data-act="portUp" data-id="${id}" ${S.reserves < portCost(p.lvl) || p.lvl >= invCap(S) ? 'disabled' : ''}><b>🏗️ ${t('upgrade')}</b><span class="t">${fill(t('upgradeTxt'), [usdM(portCost(p.lvl)), monthsTxt(PORT_UPGRADE.months)])}</span>${p.lvl >= invCap(S) ? `<span class="t">${fill(t('lvlCapped'), [invCap(S)])}</span>` : S.reserves < portCost(p.lvl) ? `<span class="t">${fill(t('needsUsd'), [portCost(p.lvl)])}</span>` : ''}</button>
        ${p.op === 'state' ? `<button class="opt mini" data-act="portCon" data-id="${id}"><b>🤝 ${t('concession')}</b><span class="t">${t('concessionTxt')}</span></button>` : ''}</div>`}</div>`;
  }).join('');
  return h;
}
// Somebody else's money, and you choose where it goes. The decision is the sector, not the firm:
// a multinational will build whatever you point it at, and take its cut of that for good.
function renderTradeFirms(){
  let h = `<p class="small muted" style="margin-top:0">${t('firmsSub')}</p>`;
  h += FIRM_IDS.map(id => {
    const f = FIRMS[id], tx = L2(FIRM_TXT[id]), got = S.firms[id];
    const building = S.pipe.find(p => p.kind === 'firm' && p.id === id);
    const pct = Math.round(f.share * 100);
    const cut = k => Math.round(IND[k].exp * Math.max(indLvl(S, k), f.lvls) * f.share * 2);
    const body = got
      ? `<span class="chip up">✅ ${fill(t('firmIn'), [esc(L2(INV_TXT[got.sector])[0])])}</span>
         ${building ? `<span class="chip">⏳ ${fill(t('running'), [monthsTxt(building.due - S.t)])}</span>` : `<span class="chip down">${fill(t('firmTakes'), [usdM(cut(got.sector))])}</span>`}`
      : !f.ok(S) ? `<div class="why">${esc(tx[2])}</div>`
      : `<div class="small muted" style="margin:6px 0 4px">${t('firmPick')}</div>
         <div class="row" style="flex-wrap:wrap">${f.sectors.map(k => `<button class="btn small primary" data-act="firm" data-id="${id}" data-sector="${k}">${INV_TXT[k].icon} ${esc(L2(INV_TXT[k])[0])}<span class="sub2"> −${pct}%</span></button>`).join('')}</div>`;
    return `<div class="dcard partner${got ? ' on' : ''}"><div class="ph"><span class="flag" aria-hidden="true">${f.flag}</span>
      <div><div class="small muted">${esc(tx[0])}</div><h4>${esc(tx[1])}</h4></div></div>
      <p class="kid">${fill(t('firmBuilds'), [f.lvls, monthsTxt(f.months)])} ${fill(t('firmShare'), [pct])} ${f.sov ? fill(t('firmSov'), [f.sov]) : t('firmNoSov')}</p>
      ${body}</div>`;
  }).join('');
  return h;
}
function renderTradePartners(){
  return `<p class="small muted" style="margin-top:0">${t('partnersSub')}</p>` + Object.keys(PARTNERS).map(id => {
    const x = PARTNERS[id], tx = L2(PART_TXT[id]), d = S.deals[id];
    let why = ''; if (!d){ if (x.pc > S.pc) why = fill(t('needsInfluence'), [x.pc]); else if (x.usd && S.reserves < x.usd) why = fill(t('needsUsd'), [x.usd]); else if (x.signReq && !x.signReq(S)) why = t('needs') + ' ' + tx[4]; }
    const status = d ? (d.on ? `<span class="chip up">✅ ${t('dealActive')}</span>` : `<span class="chip down">⏸ ${t('dealPaused')}</span>`) : `<button class="btn primary" data-act="deal" data-id="${id}" ${why ? 'disabled' : ''}>${t('dealSign')}</button>`;
    return `<div class="dcard partner${d ? (d.on ? ' on' : ' paused') : ''}"><span class="gem">⭐ ${x.pc}</span><div class="ph"><span class="flag" aria-hidden="true">${x.flag}</span><div><div class="small muted">${esc(tx[0])}</div><h4>${esc(tx[1])}</h4></div></div>
      <p class="kid">${esc(tx[2])}</p><div class="fx">✨ ${esc(tx[3])}</div><div class="small muted">🔒 ${t('needs')} ${esc(tx[4])}${x.sov ? ` · ${t('independence')} ${MINUS}${x.sov}` : ''}</div>
      <div class="row spread" style="margin-top:8px"><span></span>${status}</div>${why ? `<div class="why">${esc(why)}</div>` : ''}</div>`;
  }).join('');
}

// ---------- the guide ----------
// A new president should never be staring at a screen wondering what a button does. This panel
// always answers two questions: what should I do now, and why did that just change?
const GUIDE_TASKS = [
  { id:'start',   icon:'▶️' },
  { id:'gloss',   icon:'🔎' },
  { id:'policy',  icon:'📜', go:'policy' },
  { id:'prov',    icon:'🗺️' },
  { id:'project', icon:'🏗️' },
  { id:'money',   icon:'💰', go:'money' },
];
const guideDone = id => !!(S && S.flags && S.flags['g_' + id]);
function guideTick(id){ if (S && S.flags && !S.flags['g_' + id]){ S.flags['g_' + id] = true; persist(); } }
const guideLeft = () => GUIDE_TASKS.filter(x => !guideDone(x.id)).length;

function renderGuide(){
  const left = guideLeft(), A = AR();
  let h = '';
  // The level checklist comes FIRST. It is the spine of the game, and the Guide is the only
  // panel open from month 0 to the end, so a player must always be able to see what the country
  // is working towards and how far off it is. It used to sit under six other things, off-screen.
  {
    const plan = levelPlan(S), lv = S.lvl || 1;
    h += `<h3 class="bh" style="margin-top:0">⭐ ${fill(t('lvlReached'), [lv])} — ${esc(levelName(lv))}
      <button class="btn small" data-act="levels">${t('lvlLadder')} →</button></h3>`;
    if (plan){
      h += `<div class="quest done"><div class="qt">🏗️ ${t('lvlTargets')}</div>
        <h4>${fill(t('lvlReached'), [plan.to])}</h4>
        <p>${esc(fill(t('lvlPlanNow'), [monthsTxt(plan.due - S.t)]))}</p></div>`;
    } else {
      const nd = levelNeeds(S), met = nd.filter(d => needMet(S, d)).length;
      h += `<p class="small muted" style="margin-top:0">${esc(t('lvlTargetsSub'))}</p>`;
      h += `<div class="row" style="margin-bottom:8px"><span class="chip${met === nd.length ? ' up' : ''}">${fill(t('lvlProgress'), [met, nd.length])}</span>
        <span class="chip">🏭 ${fill(t('lvlCapNow'), [invCap(S)])}</span></div>`;
      h += needRows(S);
    }
  }

  // the six first steps, while a new player still has them
  if (left){
    const next = GUIDE_TASKS.find(x => !guideDone(x.id));
    h += `<h3 class="bh">🧭 ${t('guideSteps')} <span class="chip">${fill(t('guideLeft'), [left])}</span></h3>`;
    h += GUIDE_TASKS.map(x => {
      const ok = guideDone(x.id), isNext = !ok && x.id === next.id;
      return `<div class="gstep${ok ? ' done' : ''}${isNext ? ' now' : ''}">
        <span class="gmark" aria-hidden="true">${ok ? '✅' : isNext ? x.icon : '⚪'}</span>
        <div><b>${esc(t('gt_' + x.id))}</b>${isNext ? `<p>${esc(t('gw_' + x.id))}</p>${x.go ? `<button class="btn small primary" data-act="advgo" data-go="${x.go}">${t('showMe')}</button>` : ''}` : ''}</div></div>`;
    }).join('');
  } else {
    h += `<p class="mpnote">✅ ${t('guideDone')}</p>`;
  }

  // what to do next, in one line, from whichever adviser is most worried
  const P = step(S, 0.5), a = advisors(P), rank = { bad:2, warn:1, ok:0 };
  const keys = advisorsOpen().map(x => x[0]);
  const worst = keys.slice().sort((x, y) => rank[a[y].lvl] - rank[a[x].lvl])[0], w = a[worst];
  h += `<h3 class="bh">👉 ${t('guideNext')}</h3>
    <div class="rcard"><p style="margin:0 0 6px"><b>${esc(w.text)}</b></p><p class="small" style="margin:0 0 8px">${esc(w.act)}</p>
    ${w.go || w.sel ? `<button class="btn primary small" data-act="advgo" data-go="${w.go || ''}" data-sel="${w.sel || ''}" data-sub="${w.sub ? w.sub.join(',') : ''}">${t('showMe')}</button>` : ''}</div>`;

  // why things moved — the thing a beginner has nowhere else to look for
  const chs = whyLive();
  h += `<h3 class="bh">🔗 ${t('guideWhy')}</h3>` + (chs.length ? renderWhy(chs) : `<p class="muted small">${t('guideNothing')}</p>`);

  // and the chains themselves, always available
  h += `<h3 class="bh">⚙️ ${t('guideChains')}</h3><ul class="chainlist">`
    + [1, 2, 3, 4, 5].map(i => `<li>${esc(t('chain' + i))}</li>`).join('')
    + `</ul><p class="small muted">${t('chainHelp')}</p>`;
  return h;
}
const svcLabel = id => ({ schools:t('svcSchools'), clinics:t('svcClinics'), unis:t('svcUnis') })[id];
const SVC_ICON = { schools:'🏫', clinics:'🏥', unis:'🎓' };
function renderServices(){
  const meterRow = (key, name, v) => `<div class="rcard"><div class="rh"><span class="ri" aria-hidden="true">${GLOSS[key].icon}</span><div><h3>${name}</h3><div class="rv">${Math.round(v)} / 100</div></div></div>
    <div class="bar big"><i style="width:${clamp(v, 0, 100)}%;background:${v > 60 ? 'var(--good)' : v > 35 ? 'var(--tense)' : 'var(--bad)'}"></i></div></div>`;
  let h = `<p class="small muted" style="margin-top:0">${t('svcSub')}</p>`;
  h += `<div class="rgrid">${meterRow('edu', t('eduName'), S.edu)}${meterRow('health', t('healthName'), S.health)}</div>`;
  h += Object.keys(SERVICES).filter(id => id !== 'unis' || isOpen('unis')).map(id => {
    const x = SERVICES[id], have = S.svc[id] || 0, need = svcNeed(S, id), cov = svcCover(S, id);
    const running = S.pipe.find(p => p.kind === 'svc' && p.id === id), enough = have >= need;
    let why = ''; if (!running){ if (!svcRoom(S, id)) why = t('svcNoRoom'); else if (S.reserves < x.usd) why = fill(t('needsUsd'), [x.usd]); else if (x.req && !x.req(S)) why = t(x.reqKey); }
    const txt = { schools:t('svcSchoolsTxt'), clinics:t('svcClinicsTxt'), unis:t('svcUnisTxt') }[id];
    return `<div class="dcard"><span class="gem">🏦 ${usdM(x.usd)}</span><h4>${SVC_ICON[id]} ${esc(svcLabel(id))}</h4><p class="kid">${esc(txt)}</p>
      <div class="bar big"><i style="width:${clamp(cov * 100, 0, 100)}%;background:${enough ? 'var(--good)' : 'var(--tense)'}"></i></div>
      <div class="row spread" style="margin-top:8px"><div class="row"><span class="chip${enough ? ' up' : ''}">${fill(t('svcCover'), [have, need])}</span><span class="chip">💵 ${bn(x.syp)}</span><span class="chip">⏳ ${monthsTxt(x.months)}</span>${enough ? `<span class="chip up">${t('svcEnough')}</span>` : `<span class="chip down">${t('svcNeedMore')}</span>`}</div>
      ${running ? `<span class="chip">⏳ ${fill(t('svcRunning'), [monthsTxt(running.due - S.t)])}</span>` : `<button class="btn primary" data-act="svc" data-id="${id}" ${why ? 'disabled' : ''}>${t('svcBuild')}</button>`}</div>
      ${why ? `<div class="why">${esc(why)}</div>` : ''}</div>`;
  }).join('');
  return h;
}
function renderPopulation(){
  const c = S.cls || classes(S), H = S.history, prev = H.length > 12 ? H[H.length - 13] : null;
  const trend = prev && prev.popM ? S.popM - prev.popM : 0;
  const seg = (k, v, col) => `<div class="popseg" style="width:${clamp(v, 0, 100)}%;background:${col}" title="${esc(t(k))} ${Math.round(v)}%"></div>`;
  return `<div class="rcard"><div class="rh"><span class="ri" aria-hidden="true">👪</span><div><h3>${t('popTitle')}</h3><div class="rv">${fill(t('popNow'), [S.popM.toFixed(1)])}</div></div></div>
      ${trend < -0.02 || trend > 0.02 ? `<p class="small ${trend < 0 ? 'bad' : 'good'}">${trend < 0 ? t('popFalling') : t('popRising')}</p>` : ''}
      <div class="popbar">${seg('clsPoor', c.poor, 'var(--bad)')}${seg('clsMiddle', c.middle, 'var(--tense)')}${seg('clsRich', c.rich, 'var(--good)')}</div>
      <div class="poplegend"><span><i style="background:var(--bad)"></i>${t('clsPoor')} ${Math.round(c.poor)}%</span><span><i style="background:var(--tense)"></i>${t('clsMiddle')} ${Math.round(c.middle)}%</span><span><i style="background:var(--good)"></i>${t('clsRich')} ${Math.round(c.rich)}%</span></div>
      <p class="small muted">${t('popSub')}</p></div>` + renderBarCard();
}
// The bar is the one force the player cannot see on the map, so it gets said out loud.
function renderBarCard(){
  const b = clamp(S.bar || 0, 0, 1), pct = Math.round(b * 100);
  const line = b < 0.25 ? t('barLow') : b < 0.6 ? t('barMid') : t('barHigh');
  const col = b < 0.25 ? 'var(--calm)' : b < 0.6 ? 'var(--tense)' : 'var(--riot)';
  return `<div class="rcard"><div class="rh"><span class="ri" aria-hidden="true">📈</span><div><h3>${t('barTitle')}</h3><div class="rv">${fill(t('barNow'), [pct])}</div></div></div>
    <div class="bar big"><i style="width:${pct}%;background:${col}"></i></div>
    <p class="small">${esc(line)}</p><p class="small muted">${esc(t('barHelp'))}</p></div>`;
}
function renderWhyPanel(){
  const chs = whyLive();
  return renderBarCard() + `<h3 class="bh">🔗 ${t('whyNow')}</h3>` + renderWhy(chs);
}
function drawerBody(id){
  switch(id){
    case 'guide': return renderGuide();
    case 'policy': return renderPolicy();
    case 'decrees': return renderDecrees();
    case 'money': return UI.sub.money === 'budget' ? renderMoneyBudget() : renderMoneyActions();
    case 'trade': return UI.sub.trade === 'ports' ? renderTradePorts() : UI.sub.trade === 'partners' ? renderTradePartners() : UI.sub.trade === 'firms' ? renderTradeFirms() : renderTradeResources();
    case 'people': return UI.sub.people === 'services' ? renderServices() : UI.sub.people === 'pop' ? renderPopulation() : renderPeople();
    case 'chains': return renderChains();
    case 'progress': return UI.sub.progress === 'score' ? renderScorePanel() : UI.sub.progress === 'cycles' ? renderProgressCycles() : UI.sub.progress === 'news' ? renderNews() : UI.sub.progress === 'charts' ? renderProgressCharts() : renderWhyPanel();
  }
}
function renderDrawer(){
  const d = DRAWERS5.find(x => x[0] === UI.drawer); if (!d) return '';
  const sub = d[0] === 'decrees' ? fill(t('decreesIntro'), [Math.round(S.pc)]) : t(d[3]);
  const subtabs = d[0] === 'money' ? [['actions','subActions'],['budget','subBudget']] : d[0] === 'progress' ? [['score','subScore'],['why','subWhy'],['charts','subCharts'],['cycles','subCycles'],['news','subNews']] : d[0] === 'trade' ? [['resources','subResources'],['ports','subPorts'],['partners','subPartners']].concat(isOpen('firms') ? [['firms','subFirms']] : []) : d[0] === 'people' ? [['families','subFamilies'],['services','subServices'],['pop','subPop']] : null;
  return `<aside class="drawer"><div class="head"><span class="dic" aria-hidden="true">${d[1]}</span><h2>${t(d[2])}</h2><button class="close" data-act="closeDrawer" aria-label="${t('close')}">✕</button></div>
    <div class="sub">${sub}</div>
    ${subtabs ? `<div class="subtabs" role="tablist">${subtabs.map(([k, l]) => `<button role="tab" data-act="subtab" data-d="${d[0]}" data-v="${k}" aria-selected="${UI.sub[d[0]] === k}">${t(l)}</button>`).join('')}</div>` : ''}
    <div class="body">${drawerBody(d[0])}</div></aside>`;
}
// every pipe kind the engine can push: mw, proj, invest, firm, port, svc. Never index a text
// table off a pipe entry without a fallback — an unknown kind used to throw and kill render().
function pipeLabel(i){
  if (i.kind === 'proj') return '🏗️ ' + esc(PN(i.id));
  if (i.kind === 'port') return '⚓ ' + esc((PORT_NAME[LANG] || {})[i.id] || i.id);
  if (i.kind === 'svc') return (SVC_ICON[i.id] || '🏫') + ' ' + esc(svcLabel(i.id) || i.id);
  if (i.kind === 'lvl') return '⭐ ' + esc(fill(t('lvlReached'), [i.to]));
  if (i.kind === 'firm'){
    const f = FIRM_TXT[i.id], sec = INV_TXT[i.sector];
    return '🏢 ' + esc((f ? L2(f)[1] : i.id) + (sec ? ' — ' + L2(sec)[0] : ''));
  }
  const x = INV_TXT[i.id];
  return x ? x.icon + ' ' + esc(L2(x)[0]) : '🏭 ' + esc(String(i.id || ''));
}
function renderProgressCharts(){
  const G = k => L2(GLOSS[k]).name, pipe = (S.pipe || []).filter(i => !(i.kind === 'mw' && i.mw < 20)).slice().sort((a, b) => a.due - b.due);
  const mwSoon = (S.pipe || []).filter(i => i.kind === 'mw').reduce((a, i) => a + i.mw, 0);
  let h = `<h3 class="bh" style="margin-top:0">⏳ ${t('comingSoon')}</h3>`;
  if (mwSoon > 1) h += `<div class="pipe"><span>⚡ ${fill(t('mwArrives'), [Math.round(mwSoon)])}</span><b>${t('inTime').replace('{0}', monthsTxt(12))}</b></div>`;
  h += pipe.filter(i => i.kind !== 'mw').map(i => `<div class="pipe"><span>${pipeLabel(i)}</span><b>${fill(t('inTime'), [monthsTxt(i.due - S.t)])}</b></div>`).join('');
  if (!pipe.length && mwSoon <= 1) h += `<p class="muted" style="font-size:13px">${t('comingNone')}</p>`;
  h += `<h3 class="bh">📈 ${t('subCharts')}</h3>` + (S.history.length < 3 ? `<p class="muted" style="font-size:13px">${t('chartsEmpty')}</p>` :
    spark('score', '🏆 ' + t('score'), v => v.toFixed(0), true, '#d89412') + spark('trust', '🤝 ' + G('trust'), v => v.toFixed(0), true, '#35b6a3') + spark('anger', '🔥 ' + G('anger'), v => v.toFixed(0), false, '#f08a3c') +
    spark('jobs', '💼 ' + G('jobs'), v => v.toFixed(0) + '%', false, '#c8612f') +
    spark('usd', '🏦 ' + G('usd'), usdM, true, '#4c86d6') + spark('cash', '💵 ' + G('cash'), bn, true, '#3f9a4a') + spark('fx', '💱 ' + G('fx'), v => v.toFixed(0), false, '#b07a10') + spark('pay', '👷 ' + G('pay'), usd, true, '#8c5cc7') + spark('power', '💡 ' + G('power'), v => v.toFixed(1), true, '#e2b93b'));
  return h;
}

// ---------- dock ----------
function renderDock(){
  const DR = DRAWERS5.filter(d => isOpen({ guide:'guide', policy:'policy', decrees:'decrees', money:'money', trade:'trade', people:'people', chains:'chains', progress:'progress' }[d[0]]));
  const ps = personas(S), sad = Object.values(ps).filter(o => o.net < 0).length, ch = chains(S);
  const badge = { guide: guideLeft() ? `<span class="badge star">${guideLeft()}</span>` : '', people: sad ? `<span class="badge">${sad}</span>` : '', chains: (ch.sb === 2 || ch.se === 2) ? '<span class="badge">!</span>' : '', progress: UI.newCycle ? '<span class="badge star">★</span>' : '', trade: (S.clogged || 0) > 5 ? '<span class="badge">!</span>' : '' };
  const btn = ([k, i, l]) => `<button class="dbtn" data-act="drawer" data-v="${k}" aria-pressed="${UI.drawer === k}"><span class="di" aria-hidden="true">${i}</span><span class="dt">${t(l)}</span>${badge[k] || ''}</button>`;
  const sp = [[0, '❚❚', 'pause'], [1, '▶', 'slow'], [2, '▶▶', 'normal'], [3, '▶▶▶', 'fastest']];
  const tr = DR.find(d => d[0] === 'trade'), rest = DR.filter(d => d[0] !== 'trade');
  return `<div class="dgroup">${rest.slice(0, 3).map(btn).join('')}</div>${tr ? `<div class="dgroup trade">${btn(tr)}</div>` : ''}${rest.length > 3 ? `<div class="dgroup">${rest.slice(3).map(btn).join('')}</div>` : ''}
    <span class="spacer"></span>
    <button class="influence" data-act="drawer" data-v="decrees"><span class="st" aria-hidden="true">⭐</span><span><span class="n">${Math.round(S.pc)}</span><span class="l">${t('influenceLbl')}</span></span></button>
    ${S.over ? `<button class="endturn" data-act="restart">${t('playAgain')}</button>`
      : S.live ? `<div class="liveclock" role="status"><span class="lc" aria-hidden="true">⏳</span><span><span class="n" id="liveclock">${liveLeftTxt()}</span><span class="l">${t('nextMonth')}</span></span></div>`
      : `<div class="clock" role="group" aria-label="${t('play')}">${sp.map(([v, ic, l]) => `<button class="cbtn${v === 0 ? ' pause' : ''}" data-act="speed" data-v="${v}" aria-pressed="${UI.speed === v}" aria-label="${t(l)}" title="${t(l)}"><span dir="ltr">${ic}</span></button>`).join('')}</div>`}`;
}

// ---------- render (stable containers, partial updates) ----------
function ensureFrame(){
  if ($('#hud')) return;
  $('#root').innerHTML = `<header class="hud" id="hud"></header><div id="mbar"></div><main class="board" id="board"><div class="mapbox" id="mapbox"></div><div id="adv"></div><div id="layerbox"></div><div id="legendbox"></div><div id="startcue"></div><div id="pcardbox"></div><div id="drawerbox"></div><div id="effectbox"></div><div class="toasts" id="toasts"></div></main><nav class="dock" id="dock"></nav>`;
  ['pcardbox', 'drawerbox'].forEach(k => { const el = $('#' + k);
    el.addEventListener('pointerenter', () => UI.hover = true); el.addEventListener('pointerleave', () => { UI.hover = false; if (UI.dirty) render(true); }); });
}
function render(force){
  if (!S) return;
  if (!force && UI.pdown){ UI.dirty = true; return; }
  ensureFrame(); syncD();
  const P = step(S, 1);
  if (isPhone() && UI.drawer && UI.provOpen) UI.provOpen = false;
  $('#board').className = ['board', UI.drawer ? 'has-drawer' : '', UI.provOpen ? 'has-prov' : ''].join(' ');
  $('#hud').innerHTML = renderHUD(P);
  $('#mbar').innerHTML = S.mission ? `<div class="mission"><span>${MISSION_TXT[S.mission.id].icon} ${esc(L2(MISSION_TXT[S.mission.id])[0])}</span><span>${fill(t('seasonsLeft'), [monthsTxt(Math.max(0, S.mission.end - S.t))])}</span></div>` : '';
  $('#mapbox').innerHTML = renderMapSvg();
  $('#adv').innerHTML = S.over ? '' : renderAdvisors(P);
  $('#layerbox').innerHTML = renderLayers(); $('#legendbox').innerHTML = renderLegend();
  $('#startcue').innerHTML = !S.over && UI.speed === 0 && S.t === (S.mission ? S.mission.start : 0) ? `<button class="startcue" data-act="speed" data-v="1">▶ ${t('startPrompt')}</button>` : '';
  if (force || !UI.hover){
    const keep = el => { const b = el && el.querySelector('.body'); return b ? b.scrollTop : 0; };
    const dS = keep($('#drawerbox')), pS = keep($('#pcardbox'));
    $('#pcardbox').innerHTML = UI.provOpen ? renderProvince() : ''; $('#drawerbox').innerHTML = UI.drawer ? renderDrawer() : '';
    const setK = (el, v) => { const b = el && el.querySelector('.body'); if (b) b.scrollTop = v; };
    setK($('#drawerbox'), dS); setK($('#pcardbox'), pS);
    UI.dirty = false;
  } else UI.dirty = true;
  $('#dock').innerHTML = renderDock(); renderToasts(); renderEffect();
}

// ---------- what the score is made of ----------
// Independence used to be a chip on a contract and then a number you saw once every five
// years. It is a tab you can open any month now, next to the other five things it averages.
const BAR_GRADED = { Stability:1, Livelihoods:1, Sovereignty:1 };
function scoresBlock(){
  const Lg = legacy(S), N = LEGACY_TXT[LANG].names, bar = S.bar || 0;
  return `<div class="scores">${Object.entries(Lg.comp).map(([k, v]) => {
    const note = BAR_GRADED[k] && bar > 0.05 ? ` <span class="muted" style="font-size:11px;font-weight:400">· ${t('vsBar')}</span>` : '';
    return `<div><div class="row spread"><span>${N[k]}${note}</span><b>${Math.round(v)}</b></div><div class="bar"><i style="width:${clamp(v, 0, 100)}%;background:var(--wheat)"></i></div></div>`;
  }).join('')}</div>`;
}
function renderScorePanel(){
  const Lg = legacy(S), g = Lg.grade, gp = grip(S), G = L2(GLOSS.sov);
  const sov0 = S.sov0 === undefined ? 60 : S.sov0, room = Math.max(0, sov0 - S.sov);
  return `<div class="row" style="align-items:center;gap:14px">
      <span class="scorebadge g-${g}" style="box-shadow:none;padding:0"><span class="sg">${g}</span></span>
      <span><span style="font-size:26px;font-weight:800;display:block;line-height:1">${Math.round(Lg.avg)}</span><span class="muted" style="font-size:12.5px">${t('score')}</span></span>
    </div>
    <h3 class="bh">\u{1F3C6} ${t('scoreParts')}</h3>${scoresBlock()}
    <p class="muted" style="font-size:13px">${t('scoreAvg')}</p>
    <div class="dcard"><h4>\u{1F9ED} ${esc(G.name)} — ${Math.round(S.sov)}</h4>
      <p class="kid">${esc(G.what)}</p>
      ${gp > 0.01 ? `<p class="warnbox">⚠️ ${t('sovBite')}</p>` : ''}
      <div class="row" style="margin-top:10px"><button class="btn" data-act="gloss" data-k="sov">${t('whatIsThis')}</button>
      ${S.debt > 0 && room > 0 ? `<button class="btn primary" data-act="drawer" data-v="money">${t('repayTitle')} →</button>` : ''}</div></div>`;
}

UI.live = false;   // opt-in: the fast clock stays the default so a single sitting still works
function startScreen(){
  const pick = (k, on) => `<button class="opt mode${on ? ' on' : ''}" data-act="livemode" data-v="${k}" aria-pressed="${on}"><b>${t(k + 'Mode')}</b><span class="t">${t(k + 'ModeTxt')}</span></button>`;
  modal(`<div class="row spread"><div class="tut-icon" aria-hidden="true">\u{1F54A}\u{FE0F}</div><button class="btn" data-act="lang">\u{1F310} ${t('language')}</button></div>
  <h2>${t('title')}</h2><div class="src">${t('subtitle')}</div>
  <p class="lede">${t('howPlay')}</p>${pick('live', UI.live)}${pick('fast', !UI.live)}
  <p class="lede" style="margin-top:16px">${t('pickDiff')}</p>
  <button class="opt" data-act="newgame" data-v="learner"><b>${t('learner')}</b><span class="t">${t('learnerTxt')}</span></button>
  <button class="opt" data-act="newgame" data-v="realistic"><b>${t('realistic')}</b><span class="t">${t('realisticTxt')}</span></button>
  <button class="opt" data-act="missions"><b>${t('missionsBtn')}</b><span class="t">${t('missionsTxt')}</span></button>
  <button class="opt" data-act="loadcode"><b>\u{1F4E5} ${t('loadCode')}</b></button>
  <p class="muted" style="font-size:13px;margin:14px 0 0">${t('disclaimer')}</p>`);
}

// ---------- chapters ----------
// Twenty years is where history has its say, not where the country stops. The verdict stands,
// the grade is recorded, and then the same Syria carries on with more expected of it.
function nextChapter(){
  const lg = legacy(S);
  S.chapters = (S.chapters || []).concat([{ n:S.chapter || 1, score:Math.round(lg.avg), grade:lg.grade, lvl:S.lvl || 1 }]);
  S.chapter = (S.chapter || 1) + 1;
  S.over = null;
  // What counted as good enough last chapter is the floor of this one.
  S.bar = clamp(Math.max(S.bar || 0, 0.25 + (S.chapter - 2) * 0.12), 0, 1);
  S.pending = []; if (S.live) S.realAt = Date.now();
  persist(); closeModal(); render(true); setSpeed(UI.speed);
  toast('\u{1F4D6} ' + fill(t('chapterStart'), [S.chapter]), 'year'); sfx('cycle');
}

// ---------- coming back to a country that kept running ----------
const liveLeft = () => Math.max(0, LIVE_MS_PER_MONTH - (Date.now() - (S.realAt || Date.now())));
function liveLeftTxt(){
  const m = Math.ceil(liveLeft() / 60000);
  return m >= 60 ? fill(t('inHours'), [Math.round(m / 60)]) : fill(t('inMins'), [Math.max(1, m)]);
}
function renderLiveClock(){ const el = $('#liveclock'); if (el) el.textContent = liveLeftTxt(); }
function showAway(r){
  const a = r.before, c = snap(S), A = AR();
  const rows = [
    ['\u{1F3C6}', t('score'), a.score, c.score, 1, v => v.toFixed(0)],
    ['\u{1F91D}', L2(GLOSS.trust).name, a.trust, c.trust, 1, v => v.toFixed(0)],
    ['\u{1F525}', L2(GLOSS.anger).name, a.anger, c.anger, -1, v => v.toFixed(0)],
    ['\u{1F3E6}', L2(GLOSS.usd).name, a.usd, c.usd, 1, usdM],
    ['\u{1F4A1}', L2(GLOSS.power).name, a.power, c.power, 1, v => v.toFixed(1) + (A ? 'س' : 'h')],
    ['\u{1F4BC}', L2(GLOSS.jobs).name, a.jobs, c.jobs, -1, v => v.toFixed(0) + '%'],
  ].filter(x => Math.abs(x[3] - x[2]) > 0.05);
  const done = (r.notes || []).filter(n => ['projDone','investDone','portDone','gridDone','svcDone'].includes(n[0])).slice(0, 5);
  modal(`<div class="tut-icon" aria-hidden="true">\u{1F305}</div><h2>${t('awayTitle')}</h2>
    <div class="src">${fill(t('awaySub'), [monthsTxt(r.months), esc(whenTxt(S.t))])}</div>
    <div class="scores" style="margin-top:14px">${rows.map(([ic, name, from, to, good, fmt]) => {
      // The arrow says which way the number moved; the colour says whether that is good news.
      // They used to be the same flag, so unemployment falling was drawn as ↓ in red and rising as ↑ in green.
      const rose = to > from, well = (to - from) * good > 0;
      return `<div><div class="row spread"><span>${ic} ${esc(name)}</span><b class="${well ? 'good' : 'bad'}">${rose ? '↑' : '↓'} ${esc(fmt(to))}</b></div>
        <div class="small muted" style="margin:0">${esc(fmt(from))} → ${esc(fmt(to))}</div></div>`; }).join('')}</div>
    ${done.length ? `<h3 class="bh">✅ ${t('awayDone')}</h3>${done.map(n => `<div class="pipe"><span>${esc(noteText([S.t, ...n]))}</span></div>`).join('')}` : ''}
    ${r.queued ? `<p class="tipbox">⚠️ ${fill(t('awayWaiting'), [r.queued])}</p>` : ''}
    <div class="row"><button class="btn primary" data-act="awayGo">${r.queued ? t('awaySee') : t('keepPlaying')} ▶</button></div>`);
}
// A crisis that fired while you were away waits for you. It is never answered on your behalf.
function nextPending(){
  if (!S.pending || !S.pending.length){ closeModal(); render(true); return; }
  S.event = S.pending.shift(); persist(); render(true); sfx('crisis'); showEvent();
}

// ---------- milestone, crisis, endings ----------
function levelName(n){ const a = L2(LEVEL_TXT[Math.min(n, LEVEL_MAX)] || LEVEL_TXT[LEVEL_MAX]); return a[0]; }
function levelBlurb(n){ const a = L2(LEVEL_TXT[Math.min(n, LEVEL_MAX)] || LEVEL_TXT[LEVEL_MAX]); return a[1]; }
// One row per target: what it asks, where you are, and whether it is done. The same rows draw
// in the Guide while you are working and in the level-up screen once you are not.
function needRows(s){
  return levelNeeds(s).map(d => {
    const have = d.get(s), ok = needMet(s, d), n = v => d.dp ? v.toFixed(d.dp) : Math.round(v);
    return `<div class="gstep lvlstep${ok ? ' done' : ' now'}"><span class="gmark">${ok ? '✅' : '⬜'}</span>
      <div><b>${esc(fill(t('need_' + d.id), [n(d.want)]))}</b>
      <p style="margin:2px 0 0">${esc(fill(t(ok ? 'needDone' : 'needNow'), [n(have), n(d.want)]))}</p></div></div>`;
  }).join('');
}
// The whole ladder in one place, opened by tapping the level in the corner. A player should
// never have to go hunting in a drawer to find out what the country is working towards.
function showLevels(){
  const lv = S.lvl || 1, plan = levelPlan(S), nd = levelNeeds(S), met = nd.filter(d => needMet(S, d)).length;
  const next = lv + 1;
  // what the next level hands over, so the targets have a visible prize
  const gifts = (LEVEL_GIFTS[next] || []).map(k => t(k)).filter(Boolean);
  const past = (S.chapters || []).length;
  let h = `<div class="tut-icon" aria-hidden="true">${lv >= LEVEL_MAX ? '🕊️' : '⭐'}</div>
    <h2>${fill(t('levelN'), [lv])} — ${esc(levelName(lv))}</h2>
    <div class="src">${esc(levelBlurb(lv))}</div>`;
  if (plan){
    h += `<div class="quest done" style="margin-top:14px"><div class="qt">🏗️ ${t('lvlTargets')}</div>
      <h4>${fill(t('lvlReached'), [plan.to])}</h4>
      <p>${esc(fill(t('lvlPlanNow'), [monthsTxt(plan.due - S.t)]))}</p></div>`;
  } else {
    h += `<h3 class="bh">🎯 ${fill(t('lvlNextTargets'), [next])}</h3>
      <div class="row" style="margin-bottom:8px"><span class="chip${met === nd.length ? ' up' : ''}">${fill(t('lvlProgress'), [met, nd.length])}</span></div>
      ${needRows(S)}`;
  }
  if (gifts.length) h += `<h3 class="bh">🔓 ${fill(t('lvlOpensAt'), [next])}</h3>
    <p class="lede" style="font-size:16px">${gifts.map(g => esc(g)).join(' · ')}</p>`;
  h += `<div class="tipbox">${esc(fill(t('lvlCapNow'), [invCap(S)]))}</div>`;
  // the ladder itself, so the summit is visible from the bottom of it
  h += `<h3 class="bh">🪜 ${t('lvlLadder')}</h3><div class="ladder">`;
  for (let n = 1; n <= LEVEL_MAX; n++){
    const cls = n < lv ? 'done' : n === lv ? 'here' : '';
    h += `<div class="rung ${cls}"><b>${n}</b><span>${esc(levelName(n))}</span>${n === LEVEL_MAX ? '<i>🕊️</i>' : n === lv ? '<i>📍</i>' : n < lv ? '<i>✅</i>' : ''}</div>`;
  }
  if (lv > LEVEL_MAX) h += `<div class="rung here"><b>${lv}</b><span>${esc(levelName(lv))}</span><i>📍</i></div>`;
  h += `</div>`;
  if (past) h += `<p class="small muted">${fill(t('chapterDone'), [past])}</p>`;
  h += `<div class="row"><button class="btn primary" data-act="close">${t('gotIt')}</button></div>`;
  modal(h);
}
function showLevelUp(n){
  const gifts = (LEVEL_GIFTS[n] || []).map(k => t(k)).filter(Boolean);
  modal(`<div class="tut-icon" aria-hidden="true">⭐</div><h2>${fill(t('lvlReached'), [n])}</h2>
    <div class="src">${esc(levelName(n))}</div>
    <p class="lede">${esc(levelBlurb(n))}</p>
    ${gifts.length ? `<h3 class="bh">🔓 ${t('stageTitle')}</h3>
      <p class="lede" style="font-size:16px">${gifts.map(g => esc(fill(t('newUnlocked'), [g]))).join('<br>')}</p>` : ''}
    <div class="tipbox">${esc(fill(t('lvlCapNow'), [invCap(S)]))}</div>
    <h3 class="bh">🎯 ${fill(t('lvlNextTargets'), [n + 1])}</h3>
    ${needRows(S)}
    <div class="row"><button class="btn primary" data-act="close">${t('stageGo')}</button></div>`);
}
// The summit. Not an ending — there is no dead end any more — but the moment the game says
// you did the thing it spent twenty years asking you to do.
function showSummit(){
  const Lg = legacy(S), cl = classes(S), A = AR();
  modal(`<div class="tut-icon" aria-hidden="true">🕊️</div><h2>${t('summitTitle')}</h2>
    <div class="src">${fill(t('summitSub'), [yearNow(S)])}</div>
    <p class="lede">${t('summitText')}</p>
    <div class="scores">
      <div class="row spread"><span>🏆 ${t('score')}</span><b>${Math.round(Lg.avg)} ${Lg.grade}</b></div>
      <div class="row spread"><span>💡 ${L2(GLOSS.power).name}</span><b>${nationalHours(S).toFixed(1)}${A ? 'س' : 'h'}</b></div>
      <div class="row spread"><span>💼 ${L2(GLOSS.jobs).name}</span><b>${Math.round(joblessNat(S))}%</b></div>
      <div class="row spread"><span>🎓 ${t('eduName')}</span><b>${Math.round(S.edu)}</b></div>
      <div class="row spread"><span>🏗️ ${t('builtLbl')}</span><b>${PROVS.filter(p => S.provs[p.id].project === true).length} / ${PROVS.length}</b></div>
      <div class="row spread"><span>👥 ${t('poorLbl')}</span><b>${Math.round(cl.poor)}%</b></div>
    </div>
    <div class="tipbox">${t('summitOn')}</div>
    <div class="row"><button class="btn primary" data-act="close">${t('summitGo')}</button></div>`);
}
function showMilestone(){
  const yrs = S.t / 12, Lg = legacy(S), chs = whyLive();
  modal(`<div class="row" style="align-items:flex-end;gap:18px"><div class="grade">${Lg.grade}</div><div><h2>${fill(t('milestoneTitle'), [yrs])}</h2><div class="src">${fill(t('milestoneSub'), [esc(whenTxt(S.t))])}</div></div></div>
    ${scoresBlock()}<h3 class="bh">🔗 ${t('whyNow')}</h3>${renderWhy(chs)}
    <div class="row" style="margin-top:14px"><button class="btn primary" data-act="close">${t('keepPlaying')} ▶</button></div>`);
}
function choose(i){
  const e = EVENTS.find(x => x.id === S.event), o = e.opts[i];
  applyEffects(S, o.eff); S.log.push([S.t, 'event', e.id, i]); S.event = null;
  const fail = checkFail(S);
  if (fail){ S.over = { fail:fail.id }; setSpeed(0); persist(); render(true); return showFail(fail.id); }
  persist(); closeModal(); render(true);
}
function showFail(id){
  const f = L2(FAIL_TXT[id]), revolts = PROVS.filter(p => tierOf(S.provs[p.id].u) === 'revolt').length;
  const hist = { default:'lebanon', hyper:'zimbabwe', uprising:'rwanda', coup:'iraq', fracture:'rwanda', paralysis:'lebanon' }[id];
  modal(`<div class="tut-icon" aria-hidden="true">💥</div><h2>${esc(f[0])}</h2><div class="src">${esc(whenTxt(S.t))} · ${fill(t('afterN'), [monthsTxt(S.t - (S.mission ? S.mission.start : 0))])}</div><p class="lede">${esc(fill(f[1], [revolts]))}</p>
  <p class="tipbox">💡 <b>${t('tipLabel')}</b> ${esc(f[2])}</p>${histCard(hist)}${scoresBlock()}
  <div class="row"><button class="btn primary" data-act="restart">${t('tryAgain')}</button><button class="btn" data-act="close">${t('lookMap')}</button></div>`, 'fail');
}
function showMissionEnd(){
  const id = S.mission.id, m = L2(MISSION_TXT[id]), won = S.over.mission;
  const hist = { winter:'germany', lira:'zimbabwe', bread:'lebanon', capital:'iraq', trade:'germany' }[id];
  modal(`<div class="tut-icon" aria-hidden="true">${won ? '🏆' : '🎯'}</div><h2>${won ? t('missionWon') : t('missionLost')}</h2><div class="src">${MISSION_TXT[id].icon} ${esc(m[0])}</div>
  <p><b>${t('missionGoal')}:</b> ${esc(m[1])}</p><p class="tipbox">💡 ${esc(m[2])}</p>${histCard(hist)}
  <div class="row"><button class="btn primary" data-act="missions">${t('missionsBtn')}</button><button class="btn" data-act="mission" data-v="${id}">${t('tryAgain')}</button><button class="btn" data-act="close">${t('lookMap')}</button></div>`);
}

// ---------- input ----------
function doAct(ok, fb){ if (ok){ persist(); render(true); } else if (fb) toast(fb); }
document.addEventListener('pointerdown', () => { UI.pdown = true; });
document.addEventListener('pointerup', () => { UI.pdown = false; if (UI.dirty && !UI.hover) setTimeout(() => render(), 0); });
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, v = b.dataset.v, id = b.dataset.id;
  const always = ['close','restart','sel','layer','menu','tut','gloss','newgame','lang','missions','mission','startscreen','savecode','loadcode','doload','cycle','nextq','afterresults','drawer','closeDrawer','closeProv','subtab','adv','showScore','levels','awayGo','livemode','nextChapter'];
  if (S && S.over && !always.includes(a)){ toast('⏹️ ' + t('overNow')); return; }   // never a dead click
  if (['drawer','subtab','layer','sel','adv','closeDrawer','closeProv','tab','menu','gloss','speed','showScore'].includes(a)) sfx('tap');
  const T = LANG === 'ar';
  switch(a){
    case 'mute': sfxToggle(); break;
    case 'closeEffect': UI.effect = null; renderEffect(); return;
    case 'speed': setSpeed(+v); if (+v > 0) guideTick('start'); break;
    case 'drawer': UI.drawer = UI.drawer === v ? null : v; if (v === 'progress') UI.newCycle = false; if (v === 'money') guideTick('money'); if (UI.drawer && isPhone()) UI.provOpen = false; break;
    case 'closeDrawer': UI.drawer = null; break;
    case 'awayGo': return nextPending();
    case 'nextChapter': return nextChapter();
    case 'livemode': UI.live = v === 'live'; return startScreen();
    case 'levels': return showLevels();
    case 'showScore': if (!isOpen('progress')) return gloss('score');   // the panel is not hers yet
      UI.drawer = 'progress'; UI.sub.progress = 'score'; if (isPhone()) UI.provOpen = false; break;
    case 'closeProv': UI.provOpen = false; break;
    case 'subtab': UI.sub[b.dataset.d] = v; break;
    case 'adv': if (UI.advOpen && UI.adv === v) UI.advOpen = false; else { UI.adv = v; UI.advOpen = true; } break;
    case 'advhide': UI.advOpen = false; break;
    case 'layer': UI.layer = v; break;
    case 'sel': UI.sel = id; UI.provOpen = true; guideTick('prov'); if (isPhone()) UI.drawer = null; break;
    case 'advgo': if (b.dataset.sub){ const [d, v] = b.dataset.sub.split(','); UI.sub[d] = v; }
      if (b.dataset.go){ UI.drawer = b.dataset.go; if (isPhone()) UI.provOpen = false; } if (b.dataset.sel){ UI.sel = b.dataset.sel; UI.provOpen = true; if (isPhone()) UI.drawer = null; } break;
    case 'pol': { const k = b.dataset.k, val = POL_VALUES[k].find(o => String(o) === v); if (S.policy[k] === val) break; const p = L2(POL[k]);
      withEffects(`${p.name}: ${p.opts[String(val)]}`, () => { S.policy[k] = val; return true; }); guideTick('policy'); persist(); break; }
    case 'oilHome': if (S.policy.oilHome !== +v) withEffects(`${t('oilTitle')}: ${t('oilUse')[+v]}`, () => ACT.oilHome(S, +v)); persist(); break;
    case 'decree': withEffects(L2(DEC_TXT[id])[0], () => ACT.decree(S, id)); break;
    case 'proj': if (withEffects(`${PN(id)}: ${L2(PROJ_TXT[id])[0]}`, () => ACT.project(S, id, b.dataset.mode))) guideTick('project'); break;
    case 'fac': withEffects(L2(FAC_TXT[id])[0], () => ACT.facility(S, id)) && sfx('coin'); break;
    case 'wage': withEffects(`${t('raiseTitle')} +${v}%`, () => ACT.wage(S, +v)); break;
    case 'grantPop': withEffects(t('giftTitle'), () => ACT.gift(S)); break;
    case 'relief': withEffects(t('reliefTitle'), () => ACT.relief(S)); break;
    case 'repay': withEffects(t('repayTitle'), () => ACT.repay(S, +v)) && sfx('coin'); break;
    case 'invest': withEffects(L2(INV_TXT[id])[0], () => ACT.invest(S, id)); break;
    case 'svc': withEffects(svcLabel(id), () => ACT.service(S, id)); break;
    case 'firm': withEffects(L2(FIRM_TXT[id])[1], () => ACT.firmDeal(S, id, b.dataset.sector)) && sfx('coin'); break;
    case 'portUp': withEffects(`${t('upgrade')}: ${PORT_NAME[LANG][id]}`, () => ACT.portUpgrade(S, id)); break;
    case 'portCon': withEffects(`${t('concession')}: ${PORT_NAME[LANG][id]}`, () => ACT.portConcession(S, id)) && sfx('coin'); break;
    case 'deal': withEffects(`${L2(PART_TXT[id])[0]}: ${L2(PART_TXT[id])[1]}`, () => ACT.deal(S, id)); break;
    case 'gloss': guideTick('gloss'); return gloss(b.dataset.k);
    case 'afterresults': case 'nextq': return afterResults();
    case 'choose': sfx('decide'); return choose(+b.dataset.i);
    case 'cycle': return showCycle(id, false);
    case 'tut': return tutorial(+b.dataset.i);
    case 'newgame': begin(v, null); render(true); return tutorial(0);
    case 'missions': return missionsScreen();
    case 'mission': begin('learner', v); render(true); { const m = L2(MISSION_TXT[v]); return modal(`<div class="tut-icon">${MISSION_TXT[v].icon}</div><h2>${esc(m[0])}</h2><p class="lede">${esc(m[1])}</p><button class="btn primary" data-act="close">${t('startPlaying')}</button>`); }
    case 'startscreen': return startScreen();
    case 'lang': { setLang(AR() ? 'en' : 'ar'); render(true); if ($('#modal [data-act=newgame]')) return startScreen(); if ($('#modal [data-act=savecode]')) return menu(); return; }
    case 'savecode': return saveCodeModal();
    case 'loadcode': return loadCodeModal(false);
    case 'doload': { const code = ($('#codein') || {}).value || ''; if (loadCode(code)){ render(true); return closeModal(); } return loadCodeModal(true); }
    case 'close': closeModal(); render(true); if (S && S.event && !S.over) return showEvent(); return;
    case 'menu': return menu();
    case 'restart': setSpeed(0); return startScreen();
  }
  persist(); render(true);
});
document.addEventListener('keydown', ev => {
  if (ev.key === ' ' && ev.target === document.body && !$('#modal').innerHTML.trim() && S && !S.over){ ev.preventDefault(); setSpeed(UI.speed ? 0 : 1); render(true); return; }
  if (ev.key === 'Escape' && !$('#modal').innerHTML.trim() && (UI.drawer || UI.provOpen)){ if (UI.drawer) UI.drawer = null; else UI.provOpen = false; render(true); return; }
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('path.prov')){ ev.preventDefault(); ev.target.dispatchEvent(new MouseEvent('click', { bubbles:true })); }
});

// ---------- boot ----------
(function(){
  let l = null; try { l = localStorage.getItem(KEY + '-lang'); } catch(e){}
  if (!l) l = (navigator.language || 'en').toLowerCase().startsWith('ar') ? 'ar' : 'en';
  setLang(l);
  if (isPhone()) UI.advOpen = false;
  if (restore()){
    const away = catchUp();
    render(true); setSpeed(UI.speed);
    if (UI.fromBak){ UI.fromBak = false; toast('\u{1F6DF} ' + t('restoredBak')); }
    if (away && away.months) return showAway(away);
    if (S.over){ return S.over.fail ? showFail(S.over.fail) : S.over.won ? showLegacy() : showMissionEnd(); }
    if (S.pending && S.pending.length) return nextPending();
    if (S.event) showEvent();
  }
  else { S = startGame(undefined, 'learner'); S.history = [snap(S)]; S.log = []; syncD(); render(true); startScreen(); }
})();
