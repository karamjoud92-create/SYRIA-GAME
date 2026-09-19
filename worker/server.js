// The same score server as index.js, as a plain Node program — for testing on your own machine,
// or for running on any host that gives you Node (a small VPS, Render, Glitch, a Raspberry Pi).
//   node worker/server.js 8787 [scores.json]
// Then, in the game: ⚙️ Score server -> http://localhost:8787
const http = require('http'), fs = require('fs');
const PORT = Number(process.argv[2]) || 8787, FILE = process.argv[3] || null;
const MAX_PLAYERS = 60, KEEP_MS = 24 * 3600 * 1000, MAX_BODY = 4096;
const COMP = ['Stability', 'Livelihoods', 'Reconstruction', 'Institutions', 'Solvency', 'Sovereignty'];

let rooms = {};
if (FILE) try { rooms = JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch(e){}
const save = () => { if (FILE) try { fs.writeFileSync(FILE, JSON.stringify(rooms)); } catch(e){} };

const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, ' ').trim().slice(0, n);
const num = (v, lo, hi) => { const x = Number(v); return Number.isFinite(x) ? Math.max(lo, Math.min(hi, x)) : 0; };
function clean(raw, now){
  if (!raw || typeof raw !== 'object') return null;
  const id = str(raw.id, 40).replace(/[^A-Za-z0-9_-]/g, ''); if (!id) return null;
  const comp = {};
  if (raw.comp && typeof raw.comp === 'object') COMP.forEach(k => { if (raw.comp[k] !== undefined) comp[k] = Math.round(num(raw.comp[k], 0, 100)); });
  return { id, name:str(raw.name, 18) || '—', score:Math.round(num(raw.score, 0, 100) * 10) / 10,
    grade:['A','B','C','D','F'].includes(raw.grade) ? raw.grade : 'F', comp,
    t:Math.round(num(raw.t, 0, 100000)), diff:raw.diff === 'realistic' ? 'realistic' : 'learner',
    mission:raw.mission ? str(raw.mission, 20) : null, over:['fail','end'].includes(raw.over) ? raw.over : null, at:now };
}

http.createServer((req, res) => {
  const head = { 'access-control-allow-origin':'*', 'access-control-allow-methods':'GET,POST,OPTIONS',
    'access-control-allow-headers':'content-type', 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' };
  const send = (code, body) => { res.writeHead(code, head); res.end(JSON.stringify(body)); };
  if (req.method === 'OPTIONS'){ res.writeHead(204, head); return res.end(); }
  const m = (req.url || '').split('?')[0].match(/^\/r\/([A-Za-z0-9]{1,10})\/?$/);
  if (!m) return send(req.url === '/' ? 200 : 404, req.url === '/' ? { ok:true, service:'transition-syria scores' } : { error:'not found' });
  const room = m[1].toUpperCase(), now = Date.now();
  let body = '';
  req.on('data', c => { body += c; if (body.length > MAX_BODY) req.destroy(); });
  req.on('end', () => {
    let list = (rooms[room] || []).filter(p => now - p.at < KEEP_MS);
    if (req.method === 'POST'){
      let entry = null;
      try { entry = clean(JSON.parse(body || '{}'), now); } catch(e){ return send(400, { error:'bad json' }); }
      if (!entry) return send(400, { error:'bad entry' });
      const i = list.findIndex(p => p.id === entry.id);
      if (i >= 0) list[i] = entry;
      else if (list.length < MAX_PLAYERS) list.push(entry);
      else { list.sort((a, b) => a.at - b.at); list[0] = entry; }
    } else if (req.method !== 'GET') return send(405, { error:'method' });
    rooms[room] = list; save();
    send(200, { now, players:list.slice().sort((a, b) => b.score - a.score) });
  });
}).listen(PORT, () => console.log('score server on http://localhost:' + PORT));
