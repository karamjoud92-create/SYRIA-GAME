// End-to-end test of the shared-scoreboard client (src/net/net.js) against the score server.
// Runs two independent "players" in their own sandboxes, each with their own localStorage,
// and checks that they see each other, rank correctly, and reject junk.
const vm = require('vm'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const ENG = require('../src/engine/engine.js');
const NET = fs.readFileSync(path.join(__dirname, '..', 'src', 'net', 'net.js'), 'utf8')
  // in a browser these are script globals; in a vm sandbox top-level const stays lexical, so publish them
  + '\n;Object.assign(globalThis, { MP, mpJoin, mpSync, mpSetRelay, mpCode, mpReadCode, mpSaveCode, mpMerge, mpLeave, mpInviteLink, mpBoot, mpNewRoom, mpRoomOk, mpNameOk, mpEntry, mpCodeList, mpLoop, mpOffer, mpDropPact, mpPactWith, mpMatch });';
const PORT = 8000 + Math.floor(Math.random() * 1000), RELAY = 'http://localhost:' + PORT;

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok   ' : '  FAIL ') + msg); if (!cond) fails++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function player(name, score){
  const store = {};
  const said = [];
  const ctx = {
    S: null, legacy: ENG.legacy, console,
    // the transport reads these off the engine too, now that entries carry what a country can trade
    tradeProfile: ENG.tradeProfile, PACT_KINDS: ENG.PACT_KINDS, PACT_MAX: ENG.PACT_MAX,
    fill: (s, a) => String(s).replace(/\{(\d)\}/g, (m, i) => a[i]), t: k => k,
    toast: x => said.push(x),
    setInterval, clearInterval, setTimeout, clearTimeout, fetch, AbortController, Promise, Date, Math, JSON, URL, URLSearchParams,
    Number, Object, String, Array, Boolean, Error, isNaN, encodeURIComponent, decodeURIComponent, escape, unescape,
    btoa: s => Buffer.from(s, 'binary').toString('base64'),
    atob: s => Buffer.from(s, 'base64').toString('binary'),
    document: { hidden: false },
    location: { protocol: 'http:', search: '', hash: '', origin: 'http://localhost:5000', pathname: '/' },
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; },
    },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(NET, ctx, { filename: 'net.js' });
  ctx.S = ENG.startGame(1, 'learner');
  ctx.S.score = score;
  ctx.said = said;
  return ctx;
}

(async () => {
  const srv = spawn(process.execPath, [path.join(__dirname, '..', 'worker', 'server.js'), String(PORT)], { stdio: 'ignore' });
  process.on('exit', () => srv.kill());
  await sleep(500);

  console.log('server mode');
  const A = player('Karam', 61.4), B = player('Lina', 44.2);
  A.mpSetRelay(RELAY); B.mpSetRelay(RELAY);
  ok(A.MP.relay === RELAY, 'relay accepted');
  ok(A.mpSetRelay('not a url') === false, 'junk relay rejected');
  ok(A.MP.relay === RELAY, 'junk relay did not overwrite a good one');

  A.mpJoin('sham 7', 'Karam'); B.mpJoin('SHAM7', 'Lina');
  ok(A.MP.room === 'SHAM7', 'room code normalised (' + A.MP.room + ')');
  await sleep(600);
  await A.mpSync(true); await B.mpSync(true);
  await sleep(200);
  await A.mpSync(true);

  ok(A.MP.state === 'live', 'A is live (' + A.MP.state + ')');
  ok(A.MP.roster.length === 2, 'A sees 2 players (' + A.MP.roster.length + ')');
  ok(A.MP.rank === 1, 'A leads on 61.4 (rank ' + A.MP.rank + ')');
  ok(A.MP.roster[1].name === 'Lina', 'A sees Lina second');
  ok(A.MP.roster[0].me === true, 'A knows which row is hers');

  // B pulls ahead; A should be told she was passed.
  B.S.score = 80; B.MP.lastPush = 0;
  await B.mpSync(true); await sleep(200); await A.mpSync(true);
  ok(A.MP.rank === 2, 'A drops to 2 after Lina pulls ahead (rank ' + A.MP.rank + ')');
  ok(A.said.some(x => /mpPassedBy/.test(x)), 'A is told she was passed');

  // Score codes: no server involved at all.
  console.log('score codes');
  const C = player('Omar', 55);
  C.mpJoin('SHAM7', 'Omar');
  const code = C.mpCode();
  ok(typeof code === 'string' && code.length > 20, 'code produced (' + code.length + ' chars)');
  const D = player('Rana', 30);
  D.mpJoin('SHAM7', 'Rana');
  const read = D.mpReadCode('look at my score: ' + code);
  ok(read && read.name === 'Omar' && Math.round(read.score) === 55, 'code read back through chat noise');
  ok(D.mpSaveCode(read) === true, 'code stored');
  D.mpMerge([], Date.now());
  ok(D.MP.roster.length === 2 && D.MP.rank === 2, 'Rana ranks behind Omar with no server');
  ok(D.mpReadCode('hello') === null, 'plain text rejected');
  ok(D.mpReadCode(D.btoa('{"id":"x"}')) === null, 'code with no score rejected');
  const evil = D.mpReadCode(D.btoa(JSON.stringify({ id: 'z', name: '<img src=x>', score: 9999, grade: 'Z', t: -1 })));
  ok(evil && evil.score === 100 && evil.grade === 'F' && !/[<>]/.test(evil.name), 'hostile code clamped and stripped');

  // Offline: the game must not care.
  console.log('offline');
  const E = player('Sami', 50);
  E.mpSetRelay('http://localhost:1');
  E.mpJoin('SHAM7', 'Sami');
  await E.mpSync(true);
  ok(E.MP.state === 'offline', 'unreachable server reports offline (' + E.MP.state + ')');
  ok(E.MP.roster.length === 1 && E.MP.rank === 1, 'offline player still sees their own row');

  // Invite link carries the room and the server, so friends need to set up nothing.
  ok(A.mpInviteLink().indexOf('room=SHAM7') > 0 && A.mpInviteLink().indexOf('relay=') > 0, 'invite link carries room and server');

  A.mpLeave();
  ok(A.MP.room === null && A.MP.state === 'off' && A.MP.timer === null, 'leaving stops everything');

  srv.kill();
  console.log(fails ? '\n' + fails + ' FAILED' : '\nall multiplayer checks passed');
  process.exit(fails ? 1 : 0);
})();
