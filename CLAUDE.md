# Transition: Rebuild Syria

A bilingual (English/Arabic) country-management game for young Syrians (~15 years old) about how hard it is to run a country:
systems thinking, public finance, supply chains, trade and trade-offs. The player is the president of post-war Syria.
Time runs continuously (month by month); every decision shows its effects now and over the next 3 months; a live
legacy score (0–100, A–F) changes every month. The clock is deliberately slow and the consequences deliberately
fast: a player should be able to think, and should not have to wait two years to find out whether they were right.

## Commands
- `npm run build`  → writes `dist/index.html` (single self-contained file). Also syntax-checks the combined UI script.
- `npm run sim`    → 20-year balance simulation of scripted strategies (passive / smart / trader) on both difficulties.
- `npm run missions` → checks every mission: "nothing" must lose, "smart" must win.
- `npm run mp`     → two sandboxed players against a real score server: ranking, codes, offline, hostile input.
- `npm run check`  → all of the above. Run this after every engine change.
- `npm run serve`  → a score server on localhost:8787, for working on the scoreboard.
- `npm run browser`→ two real browsers in one room (needs `npm i -D playwright`). Writes `tools/shot-mp-*.png`.
- `npm run econ`   → drives the economy in a real browser: all 12 sectors offered, a factory built and opened,
  the work map layer, the bar shown to the player, no landmines left anywhere. Both languages.
- Optional browser test: `npm i -D playwright && npx playwright install chromium`, then `node tools/smoke.mjs`.

## Architecture
- `src/engine/engine.js` — pure game logic, no DOM. Runs in the browser and in Node (`module.exports` at the bottom).
  - `step(state, dt)` advances time. **All rates are per half-year**; `dt` is in half-years (`MONTH = 1/6`). Flows are multiplied by `dt`; relaxation uses `relax(rate, dt)`.
  - `ACT.*` are player actions that mutate state immediately (decrees, projects, deals, investments, ports…).
  - Delays live in `state.pipe` with `due` in months (`state.t` = months since Jan 2027).
  - `legacy(state)` computes the score. `checkFail` returns a failure id or null.
  - **Work, not landmines.** `pv.jobless` is the share of working-age people with no steady job, and it is the
    biggest single driver of provincial anger. It falls when factories open, the province's project is built,
    the economy grows and the lights stay on; it rises with blackouts and violence. `joblessNat(s)` is the
    pop-weighted national figure and a headline number on the dashboard.
  - **`INVEST` / `IND` — twelve sectors.** `INVEST` holds cost, months, `max` and `jobs` for each. The six with
    `sector:true` (textiles, food, pharma, cement, telecom, tourism) also have an `IND` entry saying where their
    jobs land and what they earn abroad. Extraction earns more dollars per dollar spent; industry employs people,
    and people are what hold the country together. Levels live in `s.ind`, built count in `s.invests`.
    Tourism earns without a ship, so the ports never throttle it — unrest and blackouts do.
  - **`s.bar` — the rising bar.** Ratchets up with the score and never falls. It raises what people expect of a
    wage, shortens their patience (trust and unrest), makes the state costlier to run, grows electricity demand,
    makes crises more frequent, and — the sharp end — is the yardstick two of the six score components are
    measured against. Doing well is what makes the game hard. It rises faster on Realistic.
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
3. **Balance:** after touching `engine.js`, run `npm run check`. Doing nothing must eventually fail; steady play
   (`smart`) should reach about B on Learner and C on Realistic, and building industry (`builder`) should beat
   pumping oil (`trader`). The sim also prints `builder@5y/@10y/@20y` — that curve should climb and then fight
   for every point, not run away to an A.
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
Browser `localStorage` key `transition-syria-v6`, plus copy/paste save codes (base64 JSON). Bump the key/`state.v` if the state shape changes incompatibly (v6 added `pv.jobless`, `s.ind` and `s.bar`, and dropped `pv.mines`).
