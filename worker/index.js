// Score server for "Transition: Rebuild Syria".
// It holds nothing but a name and a score per player per room, and forgets a room a day after
// its last player. No accounts, no cookies, no game state: each player's Syria stays on their own device.
//
//   POST /r/{ROOM}  {id,name,score,grade,comp,t,diff,mission,over,has,needs,pacts}  -> {now, players:[...]}
//   GET  /r/{ROOM}                                                  -> {now, players:[...]}
//
// Deploy:  cd worker && npx wrangler deploy

const MAX_PLAYERS = 60, KEEP_MS = 24 * 3600 * 1000, MAX_BODY = 4096;
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
};
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, CORS),
});

const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, ' ').trim().slice(0, n);
const num = (v, lo, hi) => { const x = Number(v); return Number.isFinite(x) ? Math.max(lo, Math.min(hi, x)) : 0; };
const COMP = ['Stability', 'Livelihoods', 'Reconstruction', 'Institutions', 'Solvency', 'Sovereignty'];

const KINDS = ['power','oil','food','ports','money'];
const PACTS = 2;
// What a country can spare, what it is short of, and who it has shaken hands with. Rebuilt
// field by field like everything else: a bad client must not be able to poison a room.
const vec = raw => { const r = {}; if (raw && typeof raw === 'object') KINDS.forEach(k => { if (raw[k] !== undefined) r[k] = Math.round(num(raw[k], 0, 1) * 10) / 10; }); return r; };
const pactList = raw => Array.isArray(raw) ? raw.slice(0, PACTS)
  .map(p => p && typeof p === 'object' ? { w:str(p.w, 40).replace(/[^A-Za-z0-9_-]/g, ''), g:KINDS.includes(p.g) ? p.g : null, s:KINDS.includes(p.s) ? p.s : null } : null)
  .filter(p => p && p.w && p.g && p.s) : [];
function clean(raw, now){
  if (!raw || typeof raw !== 'object') return null;
  const id = str(raw.id, 40).replace(/[^A-Za-z0-9_-]/g, '');
  if (!id) return null;
  const comp = {};
  if (raw.comp && typeof raw.comp === 'object') COMP.forEach(k => { if (raw.comp[k] !== undefined) comp[k] = Math.round(num(raw.comp[k], 0, 100)); });
  return {
    id, name: str(raw.name, 18) || '—', score: Math.round(num(raw.score, 0, 100) * 10) / 10,
    grade: ['A', 'B', 'C', 'D', 'F'].includes(raw.grade) ? raw.grade : 'F', comp,
    t: Math.round(num(raw.t, 0, 100000)), diff: raw.diff === 'realistic' ? 'realistic' : 'learner',
    mission: raw.mission ? str(raw.mission, 20) : null,
    over: ['fail', 'end'].includes(raw.over) ? raw.over : null,
    has: vec(raw.has), needs: vec(raw.needs), pacts: pactList(raw.pacts),
    at: now,                                   // the server's clock, so nobody can fake being fresh
  };
}

export class Room {
  constructor(state){ this.state = state; }

  async fetch(request){
    const now = Date.now();
    let entry = null;
    if (request.method === 'POST'){
      const text = await request.text();
      if (text.length > MAX_BODY) return json({ error: 'too big' }, 413);
      try { entry = clean(JSON.parse(text), now); } catch(e){ return json({ error: 'bad json' }, 400); }
      if (!entry) return json({ error: 'bad entry' }, 400);
    }
    const stored = await this.state.storage.list({ prefix: 'p:' });
    const players = [];
    const drop = [];
    stored.forEach((p, key) => { if (p && now - p.at < KEEP_MS) players.push(p); else drop.push(key); });
    if (entry){
      const i = players.findIndex(p => p.id === entry.id);
      if (i >= 0) players[i] = entry;
      else if (players.length < MAX_PLAYERS) players.push(entry);
      else {                                     // room full: the stalest seat goes to whoever is playing now
        players.sort((a, b) => a.at - b.at);
        drop.push('p:' + players[0].id); players[0] = entry;
      }
      await this.state.storage.put('p:' + entry.id, entry);
    }
    if (drop.length) await this.state.storage.delete(drop);
    players.sort((a, b) => b.score - a.score);
    return json({ now, players });
  }
}

export default {
  async fetch(request, env){
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/r\/([A-Za-z0-9]{1,10})\/?$/);
    if (!m){
      if (url.pathname === '/' || url.pathname === '') return json({ ok: true, service: 'transition-syria scores' });
      return json({ error: 'not found' }, 404);
    }
    if (request.method !== 'GET' && request.method !== 'POST') return json({ error: 'method' }, 405);
    const room = m[1].toUpperCase();
    const id = env.ROOMS.idFromName(room);
    return env.ROOMS.get(id).fetch(request);
  },
};
