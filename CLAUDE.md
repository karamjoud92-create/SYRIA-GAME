# Transition: Rebuild Syria

A bilingual (English/Arabic) country-management game for young Syrians (~15 years old) about how hard it is to run a country:
systems thinking, public finance, supply chains, trade and trade-offs. The player is the president of post-war Syria.
Time runs continuously (month by month); every decision shows its effects now and over 6 months; a live legacy score (0–100, A–F) changes every month.

## Commands
- `npm run build`  → writes `dist/index.html` (single self-contained file). Also syntax-checks the combined UI script.
- `npm run sim`    → 20-year balance simulation of scripted strategies (passive / smart / trader) on both difficulties.
- `npm run missions` → checks every mission: "nothing" must lose, "smart" must win.
- `npm run mp`     → two sandboxed players against a real score server: ranking, codes, offline, hostile input.
- `npm run check`  → all of the above. Run this after every engine change.
- `npm run serve`  → a score server on localhost:8787, for working on the scoreboard.
- `npm run browser`→ two real browsers in one room (needs `npm i -D playwright`). Writes `tools/shot-mp-*.png`.
- Optional browser test: `npm i -D playwright && npx playwright install chromium`, then `node tools/smoke.mjs`.

## Architecture
- `src/engine/engine.js` — pure game logic, no DOM. Runs in the browser and in Node (`module.exports` at the bottom).
  - `step(state, dt)` advances time. **All rates are per half-year**; `dt` is in half-years (`MONTH = 1/6`). Flows are multiplied by `dt`; relaxation uses `relax(rate, dt)`.
  - `ACT.*` are player actions that mutate state immediately (decrees, projects, deals, investments, ports…).
  - Delays live in `state.pipe` with `due` in months (`state.t` = months since Jan 2027).
  - `legacy(state)` computes the score. `checkFail` returns a failure id or null.
- `src/engine/mapdata.js` — simplified SVG paths of the 14 governorates (Natural Earth, public domain). Damascus is a hole inside Rural Damascus.
- `src/text/*` — ALL player-facing text, in both `en` and `ar`. `4-time-trade.js` overrides older strings for the continuous-time version.
- `src/ui/*` — rendering and input. **Load order matters** (see `build.js`): later files redefine earlier `function` declarations
  (`5-game.js` wins). You can't redeclare `const`/`let` across files — the build's syntax check will catch it.
- `src/shell.html` — CSS and the HTML frame; `/*ENGINE*/` and `/*UI*/` placeholders are filled by the build.
- `src/net/net.js` — the shared scoreboard's transport. No DOM, no game logic: it turns `legacy(S)` into a small
  entry, sends it to a score server (`worker/`), merges what comes back with any pasted score codes, and ranks.
  Every player's game stays on their own device; only name, score, grade and date travel.
- `src/ui/6-multiplayer.js` — the lobby, the scoreboard panel and the header chip. It **wraps** `render`, `advance`,
  `begin`, `renderHUD`, `ensureFrame`, `startScreen` and `menu` rather than redefining them, so single-player
  behaviour is untouched. Add to the wrappers, don't copy the originals.
- `worker/` — the score server: a Cloudflare Worker (`index.js`) and the same thing as a plain Node program
  (`server.js`). Two routes, no accounts, rooms expire after a day.

## Rules for changes
1. **Every string needs English and Arabic.** Never add English-only UI text. Arabic should be plain Modern Standard Arabic a teenager understands; Syrian month names are used.
2. **RTL:** use CSS logical properties (`inset-inline-start`, `padding-inline-end`, `border-inline-end`…), never left/right, except inside the map SVG (which is always LTR).
3. **Balance:** after touching `engine.js`, run `npm run check`. Doing nothing must eventually fail; steady play should reach about B on Learner and C on Realistic.
4. **No external assets.** The published page's CSP blocks remote images/scripts. Sounds are synthesized with Web Audio in `0-sfx.js` and must stay quiet.
5. **Numbers are game-balanced, not real data**, except the $108B war-damage total (World Bank 2025). Don't present made-up figures as facts.
6. **Politics:** stay neutral. No real living politicians. Crisis options describe trade-offs without taking sides.
7. **Tone:** plain words for a 15-year-old, sentence case, no jargon without explanation.
8. In `build.js`, `String.replace` must use the function form — a plain string replacement turns `$$` into `$` and corrupts text.

## Rules for the scoreboard
- The game must play identically with no server, a dead server, and no room. Every network path is wrapped;
  nothing in `net.js` may throw into the game loop. `npm run mp` covers all three.
- Anything arriving from another player is untrusted: rebuild it field by field (`mpClean`) and escape it on render.
  The server does the same, so a bad client cannot poison a room.
- Scores are client-reported. That is deliberate — see `worker/README.md`. Don't add accounts to "fix" it.
- Traffic has a ceiling: one call per player per 4s, a push at most every 5s, polling 6s open / 20s closed.

## Saves
Browser `localStorage` key `transition-syria-v5`, plus copy/paste save codes (base64 JSON). Bump the key/`state.v` if the state shape changes incompatibly.
