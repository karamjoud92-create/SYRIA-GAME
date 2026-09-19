# Transition: Rebuild Syria

A bilingual (English/Arabic) country-management game for young Syrians (~15 years old) about how hard it is to run a country:
systems thinking, public finance, supply chains, trade and trade-offs. The player is the president of post-war Syria.
Time runs continuously (month by month); every decision shows its effects now and over 6 months; a live legacy score (0–100, A–F) changes every month.

## Commands
- `npm run build`  → writes `dist/index.html` (single self-contained file). Also syntax-checks the combined UI script.
- `npm run sim`    → 20-year balance simulation of scripted strategies (passive / smart / trader) on both difficulties.
- `npm run missions` → checks every mission: "nothing" must lose, "smart" must win.
- `npm run check`  → all of the above. Run this after every engine change.
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

## Rules for changes
1. **Every string needs English and Arabic.** Never add English-only UI text. Arabic should be plain Modern Standard Arabic a teenager understands; Syrian month names are used.
2. **RTL:** use CSS logical properties (`inset-inline-start`, `padding-inline-end`, `border-inline-end`…), never left/right, except inside the map SVG (which is always LTR).
3. **Balance:** after touching `engine.js`, run `npm run check`. Doing nothing must eventually fail; steady play should reach about B on Learner and C on Realistic.
4. **No external assets.** The published page's CSP blocks remote images/scripts. Sounds are synthesized with Web Audio in `0-sfx.js` and must stay quiet.
5. **Numbers are game-balanced, not real data**, except the $108B war-damage total (World Bank 2025). Don't present made-up figures as facts.
6. **Politics:** stay neutral. No real living politicians. Crisis options describe trade-offs without taking sides.
7. **Tone:** plain words for a 15-year-old, sentence case, no jargon without explanation.
8. In `build.js`, `String.replace` must use the function form — a plain string replacement turns `$$` into `$` and corrupts text.

## Saves
Browser `localStorage` key `transition-syria-v5`, plus copy/paste save codes (base64 JSON). Bump the key/`state.v` if the state shape changes incompatibly.
