// ===== Shared scores: transport =====
// Everyone plays their own game; only the scoreboard travels. Two ways it travels:
// server — a tiny score server (see worker/). Anyone with the invite link plays, no account needed.
// codes — no server at all: players send each other a short score code and paste it in.
// Neither is required. Every call here is wrapped: if the network dies the game carries on unchanged.

const MP_LS = { id:'sy-mp-id', name:'sy-mp-name', room:'sy-mp-room', relay:'sy-mp-relay', codes:'sy-mp-codes' };
const MP_ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1: room codes get read out loud
const MP_PUSH_MS = 20000, MP_POLL_OPEN_MS = 6000, MP_POLL_SHUT_MS = 20000, MP_STALE_MS = 6 * 3600 * 1000;
const MP = {
 id:'', name:'', room:null, relay:'',
 state:'off', // off | codes | syncing | live | offline
 roster:[], rank:0, open:false, err:null,
 lastPush:0, lastScore:null, busy:false, timer:null, above:{},
};

function mpLS(k, v){
 try {
 if (v === undefined) return localStorage.getItem(k);
 if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v);
 } catch(e){}
 return null;
}
function mpId(){
 if (MP.id) return MP.id;
 let v = mpLS(MP_LS.id);
 if (!v || !/^p[a-z0-9]{6,16}$/.test(v)){ v = 'p' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); mpLS(MP_LS.id, v); }
 return (MP.id = v);
}
function mpNewRoom(){ let s = ''; for (let i = 0; i < 5; i++) s += MP_ALPHA[Math.floor(Math.random() * MP_ALPHA.length)]; return s; }
const mpRoomOk = v => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
const mpNameOk = v => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 18);
function mpRelayOk(v){
 const s = String(v || '').trim().replace(/\/+$/, '');
 if (!s) return '';
 if (!/^https?:\/\/[^\s/]+/i.test(s)) return null; // null = typed something that is not a URL
 if (location.protocol === 'https:' && /^http:/i.test(s)) return null; // a page on https cannot call http
 return s;
}
const mpHost = u => { try { return new URL(u).host; } catch(e){ return u; } };

// ---------- what we tell the others ----------
function mpEntry(){
 if (!S) return null;
 const lg = legacy(S), comp = {};
 Object.keys(lg.comp).forEach(k => comp[k] = Math.round(lg.comp[k]));
 const tp = tradeProfile(S);
 return { v:1, id:mpId(), name:MP.name || '—', score:Math.round(S.score * 10) / 10, grade:lg.grade, comp,
 t:S.t, diff:S.diff, mission:(S.mission && S.mission.id) || null,
 over:S.over ? (S.over.fail ? 'fail' : 'end') : null,
 // what this country could spare, what it is short of, and who it has shaken hands with.
 // A pact only counts when BOTH players publish it, so nobody can claim one alone.
 has:tp.has, needs:tp.needs,
 pacts:(S.pacts || []).slice(0, PACT_MAX).map(p => ({ w:p.with, g:p.get, s:p.give })) };
}
// Anything arriving from another player is untrusted: rebuild it field by field.
function mpClean(e, now){
 if (!e || typeof e !== 'object') return null;
 const id = String(e.id || '').slice(0, 40); if (!id) return null;
 const num = (v, lo, hi, d) => { const n = Number(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
 const comp = {};
 if (e.comp && typeof e.comp === 'object') ['Stability','Livelihoods','Reconstruction','Institutions','Solvency','Sovereignty']
 .forEach(k => { if (e.comp[k] !== undefined) comp[k] = num(e.comp[k], 0, 100, 0); });
 const at = num(e.at, 0, 4e12, now);
 const vec = o => { const r = {}; if (o && typeof o === 'object') PACT_KINDS.forEach(k => { if (o[k] !== undefined) r[k] = num(o[k], 0, 1, 0); }); return r; };
 const pacts = Array.isArray(e.pacts) ? e.pacts.slice(0, PACT_MAX).map(p => p && typeof p === 'object'
 ? { w:String(p.w || '').slice(0, 40), g:PACT_KINDS.includes(p.g) ? p.g : null, s:PACT_KINDS.includes(p.s) ? p.s : null } : null)
 .filter(p => p && p.w && p.g && p.s) : [];
 return { id, name:mpNameOk(e.name) || '—', score:num(e.score, 0, 100, 0), grade:['A','B','C','D','F'].includes(e.grade) ? e.grade : 'F',
 has:vec(e.has), needs:vec(e.needs), pacts,
 comp, t:num(e.t, 0, 100000, 0), diff:e.diff === 'realistic' ? 'realistic' : 'learner',
 mission:e.mission ? String(e.mission).slice(0, 20) : null, over:['fail','end'].includes(e.over) ? e.over : null,
 at, age:Math.max(0, now - at), src:e.src === 'code' ? 'code' : 'server' };
}

// ---------- pacts: a handshake that rides on the scoreboard ----------
// One side offers, the other mirrors it, and only when both entries agree does the pact count.
// Neither side can grant themselves anything: the bonus is sized by your own economy (see
// pactsOn in the engine), so a player faking their numbers can bring a deal forward and no more.
function mpOffer(them, give, get){
 if (!S || !them) return false;
 S.pacts = (S.pacts || []).filter(p => p.with !== them.id);
 if (S.pacts.length >= PACT_MAX) return false;
 S.pacts.push({ with:them.id, give, get, at:Date.now() });
 MP.lastPush = 0; mpSync(true); // a handshake should not wait for the next poll
 return true;
}
function mpDropPact(id){
 if (!S) return false;
 S.pacts = (S.pacts || []).filter(p => p.with !== id);
 MP.lastPush = 0; mpSync(true); // a handshake should not wait for the next poll
 return true;
}
// Live = I name them and they name me, with the halves matching.
function mpPactWith(them){
 if (!S || !them) return null;
 const mine = (S.pacts || []).find(p => p.with === them.id); if (!mine) return null;
 const theirs = (them.pacts || []).find(p => p.w === mpId());
 const agreed = !!theirs && theirs.g === mine.give && theirs.s === mine.get;
 return { give:mine.give, get:mine.get, live:agreed };
}
// What the two of them could usefully do for each other, best match first.
function mpMatch(them){
 if (!S || !them) return null;
 const me = tradeProfile(S), out = [];
 PACT_KINDS.forEach(get => { if (!(me.needs[get] > 0) || !(them.has[get] > 0)) return;
 PACT_KINDS.forEach(give => { if (get === give || !(me.has[give] > 0) || !(them.needs[give] > 0)) return;
 out.push({ give, get, fit:Math.min(me.needs[get], them.has[get]) + Math.min(me.has[give], them.needs[give]) }); }); });
 return out.sort((a, b) => b.fit - a.fit)[0] || null;
}

// ---------- score codes (work with no server at all) ----------
function mpCode(){
 const e = mpEntry(); if (!e) return '';
 delete e.comp; delete e.has; delete e.needs; delete e.pacts; // codes get pasted into chat apps: keep them short
 e.at = Date.now();
 try { return btoa(unescape(encodeURIComponent(JSON.stringify(e)))).replace(/=+$/, ''); } catch(err){ return ''; }
}
function mpReadCode(code){
 try {
 let c = String(code || '').trim().replace(/\s+/g, '');
 const m = c.match(/[A-Za-z0-9+/=]{24,}$/); if (m) c = m[0];
 while (c.length % 4) c += '=';
 const o = JSON.parse(decodeURIComponent(escape(atob(c))));
 if (!o || !o.id || o.score === undefined) return null;
 o.src = 'code';
 return mpClean(o, Date.now());
 } catch(e){ return null; }
}
function mpCodes(){ try { const o = JSON.parse(mpLS(MP_LS.codes) || '{}'); return o && typeof o === 'object' ? o : {}; } catch(e){ return {}; } }
function mpSaveCode(e){
 if (!e || e.id === mpId()) return false;
 const all = mpCodes(), key = MP.room || '-';
 const room = all[key] && typeof all[key] === 'object' ? all[key] : {};
 const old = room[e.id];
 if (old && Number(old.at) >= e.at) return false; // an older code never overwrites a newer one
 room[e.id] = e; all[key] = room;
 const ids = Object.keys(room);
 if (ids.length > 30){ ids.sort((a, b) => room[a].at - room[b].at).slice(0, ids.length - 30).forEach(k => delete room[k]); }
 mpLS(MP_LS.codes, JSON.stringify(all));
 return true;
}
function mpCodeList(now){
 const room = mpCodes()[MP.room || '-'] || {};
 return Object.values(room).map(e => mpClean(e, now)).filter(Boolean);
}

// ---------- the score server ----------
async function mpCall(entry){
 const url = MP.relay + '/r/' + encodeURIComponent(MP.room);
 const ctl = typeof AbortController === 'function' ? new AbortController() : null;
 const bail = setTimeout(() => ctl && ctl.abort(), 9000);
 try {
 const r = await fetch(url, Object.assign({ signal:ctl ? ctl.signal : undefined },
 entry ? { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify(entry) } : { method:'GET' }));
 if (!r.ok) throw new Error('HTTP ' + r.status);
 const j = await r.json();
 return { players:Array.isArray(j.players) ? j.players : [], now:Number(j.now) || Date.now() };
 } finally { clearTimeout(bail); }
}

// ---------- merge, rank, notify ----------
function mpMerge(list, now){
 const by = {};
 (list || []).forEach(e => { const c = mpClean(e, now); if (c) by[c.id] = c; });
 mpCodeList(now).forEach(c => { const cur = by[c.id]; if (!cur || cur.at < c.at) by[c.id] = c; }); // freshest wins
 const mine = mpEntry();
 if (mine) by[mine.id] = Object.assign(mpClean(mine, now), { at:now, age:0, src:'me' });
 const rows = Object.values(by).filter(e => e.age < MP_STALE_MS || e.id === MP.id);
 rows.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
 rows.forEach((e, i) => { e.place = i + 1; e.me = e.id === MP.id; });
 MP.roster = rows;
 MP.rank = (rows.find(e => e.me) || {}).place || 0;
 return rows;
}
// Who was ahead of me last time but is not now (and the other way round)? That is the whole point of playing together.
function mpNoticeMoves(rows){
 const above = {}, was = MP.above;
 rows.forEach(e => { if (!e.me && MP.rank && e.place < MP.rank) above[e.id] = e.name; });
 if (MP.seenOnce){ // not "if anyone was ahead": going from first place to second is exactly the news we want
 Object.keys(was).forEach(id => { if (!above[id] && rows.some(e => e.id === id)) mpSay(fill(t('mpPassed'), [was[id]])); });
 Object.keys(above).forEach(id => { if (!was[id]) mpSay(fill(t('mpPassedBy'), [above[id]])); });
 }
 MP.above = above; MP.seenOnce = true;
}
function mpSay(text){ if (typeof toast === 'function') toast(' ' + text); }

// ---------- the loop ----------
// One call at a time. A forced call that arrives mid-flight is not dropped, it runs straight after —
// otherwise the push that matters most (the game just ended) is the one that goes missing.
function mpSync(force){
 if (!MP.room) return Promise.resolve();
 if (MP.busy){ if (force) MP.again = true; return MP.inflight || Promise.resolve(); }
 const now0 = Date.now();
 if (!force && now0 - (MP.lastCall || 0) < 4000) return Promise.resolve(); // hard ceiling on traffic, whatever calls us
 MP.lastCall = now0; MP.busy = true;
 MP.inflight = mpRun(force, now0).then(() => {
 MP.busy = false;
 if (MP.again){ MP.again = false; return mpSync(true); }
 }, () => { MP.busy = false; });
 return MP.inflight;
}
async function mpRun(force, now0){
 const e = mpEntry();
 if (!MP.relay){ // codes only: nothing to call, just re-rank
 MP.state = 'codes'; mpMerge([], now0); if (typeof mpPaint === 'function') mpPaint();
 return;
 }
 const since = now0 - MP.lastPush;
 const changed = !e || MP.lastScore === null || Math.abs(e.score - MP.lastScore) >= 0.3 || e.over !== MP.lastOver;
 const push = e && (force || (changed && since >= 5000) || since >= MP_PUSH_MS);
 try {
 const r = await mpCall(push ? Object.assign({}, e, { at:now0 }) : null);
 if (push){ MP.lastPush = now0; MP.lastScore = e.score; MP.lastOver = e.over; }
 MP.state = 'live'; MP.err = null;
 const rows = mpMerge(r.players, r.now);
 mpNoticeMoves(rows);
 } catch(err){
 MP.state = 'offline'; MP.err = String((err && err.message) || err);
 mpMerge([], Date.now());
 } finally {
 if (typeof mpPaint === 'function') mpPaint();
 }
}
function mpLoop(){
 if (MP.timer) clearInterval(MP.timer);
 MP.timer = null;
 if (!MP.room) return;
 MP.timer = setInterval(() => { if (!document.hidden) mpSync(false); }, MP.open ? MP_POLL_OPEN_MS : MP_POLL_SHUT_MS);
}

// ---------- joining and leaving ----------
function mpJoin(room, name){
 MP.room = mpRoomOk(room); MP.name = mpNameOk(name) || '—';
 mpLS(MP_LS.room, MP.room); mpLS(MP_LS.name, MP.name);
 MP.state = MP.relay ? 'syncing' : 'codes';
 MP.above = {}; MP.seenOnce = false; MP.lastScore = null; MP.lastPush = 0; MP.roster = [];
 mpLoop(); mpSync(true);
}
function mpLeave(){
 MP.room = null; MP.roster = []; MP.rank = 0; MP.state = 'off'; MP.open = false; MP.above = {};
 mpLS(MP_LS.room, null);
 if (MP.timer) clearInterval(MP.timer);
 MP.timer = null;
}
function mpSetRelay(url){
 const v = mpRelayOk(url);
 if (v === null) return false;
 MP.relay = v; mpLS(MP_LS.relay, v || null);
 if (MP.room){ MP.lastPush = 0; MP.state = v ? 'syncing' : 'codes'; mpSync(true); }
 return true;
}
function mpInviteLink(){
 const base = location.origin + location.pathname;
 const q = ['room=' + encodeURIComponent(MP.room || '')];
 if (MP.relay) q.push('relay=' + encodeURIComponent(MP.relay));
 return base + '?' + q.join('&');
}
// Read the invite link and whatever we remembered last time. Called once, at boot.
function mpBoot(){
 mpId();
 MP.name = mpNameOk(mpLS(MP_LS.name) || '');
 MP.relay = mpRelayOk(mpLS(MP_LS.relay) || '') || '';
 let p = null;
 try { p = new URLSearchParams(location.search || ''); if (!p.get('room') && location.hash.indexOf('room=') >= 0) p = new URLSearchParams(location.hash.slice(1)); } catch(e){}
 const fromLink = p && mpRoomOk(p.get('room'));
 if (p && p.get('relay')){ const r = mpRelayOk(p.get('relay')); if (r){ MP.relay = r; mpLS(MP_LS.relay, r); } }
 const remembered = mpRoomOk(mpLS(MP_LS.room) || '');
 MP.pendingRoom = fromLink || remembered || '';
 MP.fromLink = !!fromLink;
}
