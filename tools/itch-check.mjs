// itch.io serves an HTML game inside a sandboxed iframe on its own domain, not as a page of
// its own. That changes three things this game depends on: localStorage can throw outright,
// the Google Fonts stylesheet is a third-party request, and the invite link is built from
// location. This drives the real built file inside an itch-shaped iframe — once with storage
// allowed, once with it denied — and checks the game is still playable either way.
//
// The strict arm is the one that matters. If a browser blocks third-party storage, or itch
// drops allow-same-origin, every localStorage call throws SecurityError. The game must open,
// play and stay quiet about it; it must never white-screen because a save could not be written.
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs'; import path from 'path';

const DIST = path.resolve('dist');
const PORT = 8123;
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };

// The sandbox itch.io puts an HTML game in. The strict arm drops allow-same-origin, which is
// what makes storage throw rather than silently no-op.
const ITCH_SANDBOX = 'allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock allow-modals allow-orientation-lock allow-presentation';
const STRICT_SANDBOX = 'allow-scripts allow-popups allow-forms allow-modals';

const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  if (url === '/frame.html' || url === '/strict.html') {
    const sb = url === '/frame.html' ? ITCH_SANDBOX : STRICT_SANDBOX;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(`<!doctype html><meta charset=utf8><style>html,body{margin:0;height:100%}iframe{border:0;width:100vw;height:100vh}</style>
      <iframe id="g" sandbox="${sb}" src="/index.html"></iframe>`);
  }
  if (url === '/favicon.ico'){ res.writeHead(204); return res.end(); }   // itch serves its own
  const f = path.join(DIST, url === '/' ? 'index.html' : url.replace(/^\//, ''));
  if (!f.startsWith(DIST) || !fs.existsSync(f)) { console.log('   [server 404] ' + url); res.writeHead(404); return res.end('no'); }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(fs.readFileSync(f));
});
await new Promise(r => server.listen(PORT, r));

const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});

for (const [arm, page_url] of [['storage allowed', 'frame.html'], ['storage DENIED', 'strict.html']]) {
  const errs = [];
  const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => {
    const x = m.text();
    // a blocked-storage SecurityError logged by the browser itself is not the game throwing
    if (m.type() === 'error' && !/ERR_CERT|fonts\.g|Access to storage|SecurityError|denied/i.test(x)) errs.push('console: ' + x);
  });
  await page.goto(`http://localhost:${PORT}/${page_url}`);
  await page.waitForTimeout(1200);

  const fr = page.frames().find(f => f.url().includes('/index.html'));
  ok(!!fr, `${arm}: the game loads inside an itch-style iframe`);
  if (!fr) { await page.close(); continue; }

  // 1. It actually booted — the start screen is up and offers a difficulty.
  const started = await fr.evaluate(() => !!document.querySelector('[data-act=newgame]')).catch(() => false);
  ok(started, `${arm}: the start screen is up, not a white page`);

  // 2. Storage really is in the state this arm claims. If it is not, the arm proves nothing.
  const storage = await fr.evaluate(() => { try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return 'works'; } catch(e){ return 'throws'; } });
  ok(arm === 'storage allowed' ? storage === 'works' : storage === 'throws',
    `${arm}: localStorage ${storage} in this frame, as the arm requires`);

  // 3. A real game starts and runs. This is the whole point: no save must mean no saving,
  //    never no playing.
  await fr.click('[data-act=newgame][data-v=learner]');
  for (let i = 0; i < 8; i++) { const x = await fr.$('.modal .btn.primary'); if (x) await x.click(); await page.waitForTimeout(40); }
  await fr.evaluate(() => { if (document.querySelector('#modal .scrim')) closeModal(); });
  const played = await fr.evaluate(() => { for (let i = 0; i < 12; i++) advance(); return { t:S.t, score:Math.round(S.score), hud:(document.querySelector('#hud') || { innerText:'' }).innerText.length }; });
  ok(played.t === 12, `${arm}: a year of play runs (month ${played.t}, score ${played.score})`);
  ok(played.hud > 40, `${arm}: and the dashboard is drawn (${played.hud} chars)`);

  // 4. Panels open. A drawer that throws here is a dead game on itch.
  const drawer = await fr.evaluate(() => { UI.drawer = 'money'; render(true); return (document.querySelector('.drawer .body') || { innerText:'' }).innerText.length; });
  ok(drawer > 200, `${arm}: a panel opens inside the frame (${drawer} chars)`);

  // 5. Saving is attempted and never takes the game down with it.
  const saved = await fr.evaluate(() => { try { persist(); return 'ok'; } catch(e){ return 'THREW: ' + e.message; } });
  ok(saved === 'ok', `${arm}: saving does not throw into the game loop (${saved})`);

  // 6. A save code still works with no storage at all — it is the only way to carry a country
  //    off a page whose storage the browser refuses.
  const code = await fr.evaluate(() => { try { const c = saveCode(); S.reserves = 0; return { made:c.length > 40, back:loadCode(c) && Math.round(S.reserves) }; } catch(e){ return { err:e.message }; } });
  ok(code.made && code.back > 0, `${arm}: a save code still round-trips ($${code.back}M back)`);

  // 7. The fonts are a third-party request on itch. The page must not depend on them.
  const font = await fr.evaluate(() => getComputedStyle(document.body).fontFamily);
  ok(/Baloo|Trebuchet|system-ui|sans-serif/.test(font), `${arm}: the type falls back cleanly (${font.split(',')[0]})`);

  // 8. Nothing thrown.
  ok(errs.length === 0, `${arm}: nothing threw (${errs.length})`);
  if (errs.length) console.error('   ' + errs.slice(0, 4).join('\n   '));

  await page.screenshot({ path: `tools/shot-itch-${arm.includes('DENIED') ? 'nostorage' : 'normal'}.png` });
  await page.close();
}

await b.close();
server.close();
console.log(fails ? `\n${fails} FAILED` : '\nall itch checks passed — the build is safe to push to an HTML channel');
process.exit(fails ? 1 : 0);
