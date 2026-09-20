# Transition: Rebuild Syria

A bilingual (English/Arabic) country-management game for young Syrians (~15 years old) about how hard it is to run a country:
systems thinking, public finance, supply chains, trade and trade-offs. The player is the president of post-war Syria.
Time runs continuously (month by month) but is **never shown as a calendar year** — the player's clock is a
**level** and a month count. Every decision shows its effects now and over the next 3 months; a live
legacy score (0–100, A–F) changes every month. The clock is deliberately slow and the consequences deliberately
fast: a player should be able to think, and should not have to wait two years to find out whether they were right.
The progression borrows the good half of Clash of Clans — an upgrade ladder with a visible cost, time and payoff,
and a level that gates what you are handed next — and none of the bad half: no timer you pay to skip, no raiding
another player's country.

## Commands
- `npm run build`  → writes `dist/index.html` (single self-contained file). Also syntax-checks the combined UI script.
- `npm run sim`    → 20-year balance simulation of scripted strategies (passive / smart / trader) on both difficulties.
- `npm run missions` → checks every mission: "nothing" must lose, "smart" must win.
- `npm run mp`     → two sandboxed players against a real score server: ranking, codes, offline, hostile input.
- `npm run progress` → levels, infrastructure, trade routes, experience and medals, without a browser.
- `npm run check`  → all of the above. Run this after every engine change.
- `npm run serve`  → a score server on localhost:8787, for working on the scoreboard.
- `npm run browser`→ two real browsers in one room (needs `npm i -D playwright`). Writes `tools/shot-mp-*.png`.
- `npm run decide` → the casual loop in a real browser: the game asks a question unprompted, offers 2–3
  answers the player can actually afford, tapping one changes the country and shows what it did, "Not now"
  moves on, and the card steps aside for panels. Desktop and phone, both languages.
- `npm run guide`  → checks a new player is taught: the tutorial runs, the game opens on the Guide, the six first
  steps tick off as they are actually done, and — the important one — **no advice ever points at a panel or dial
  the player has not been given yet**. Both languages.
- `npm run onboard`→ checks the game opens up slowly: 3 panels and 1 map layer at month 0, 7 panels and 4 layers
  by year 4, schools built, the population bar adding up, four advisors, the hide button. Both languages.
- `npm run econ`   → drives the economy in a real browser: all 15 sectors offered, a factory built and opened,
  the work map layer, the bar shown to the player, no landmines left anywhere. Both languages.
- CI (`.github/workflows/ci.yml`) runs `npm run check` **and all seven browser suites, the dead-end audit
  included, on every branch and pull request**, and only publishes to Pages from the default branch once both
  are green. Before this it
  ran `build.js` and the scoreboard test on the default branch alone, so nothing else had ever run in CI.
- `npm run levels` → the progression in a real browser: the clock is a level and not a year, the Build panel
  opens at its level with the rest locked, an upgrade costs more the second time, a trade route widens, the medal
  shelf fills, the networks are drawn on the map, and the mentor asks fewer questions as it is turned down.
  Both languages.
- `npm run audit`  → the dead-end sweep: at every level, in both languages, on desktop and phone, it opens
  every panel and subtab, switches every map layer, opens every province, and fails on a panel that opens
  empty, a control disabled with no reason beside it, a raw string key on screen, a click that throws, a
  subtab offered above its own level, or anything locked that is named nowhere the player can see.
- `npm run strings`→ every `t()` key and every bilingual table has English *and* Arabic. `t()` falls back to
  printing the key, so a missing string does not crash — it just appears on screen. This found two.
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
  - **`INVEST` / `IND` — fifteen sectors.** `INVEST` holds cost, months, `max` and `jobs` for each. The nine with
    `sector:true` (textiles, food, pharma, cement, telecom, tourism, plus the three `supply:true` ones — logistics,
    cold chain, packaging) also have an `IND` entry saying where their
    jobs land and what they earn abroad. Extraction earns more dollars per dollar spent; industry employs people,
    and people are what hold the country together. Levels live in `s.ind`, built count in `s.invests`.
    Tourism earns without a ship, so the ports never throttle it — unrest and blackouts do.
  - **Services, `s.edu`, `s.health`.** `SERVICES` (schools, clinics, universities) are built in waves against a
    need that scales with `s.popM`; `svcCover` is how much of that need is met. Education and health relax toward
    targets set by that coverage and drag on unrest, trust, capacity and unemployment when neglected. They decay
    if you build nothing, but only to the floor the war left behind — never to zero.
  - **`classes(s)` and `s.popM`.** Population grows, and shrinks when people emigrate (driven by unemployment,
    wages against expectations, unrest and trust). `classes()` splits it into poor / getting by / rich as a
    *result* of wages, work, health, schooling, inflation and corruption — never a dial. `poor` is one of the
    effects every decision previews, which is how a player sees what a policy does to people rather than ledgers.
  - **`INFRA` — seven networks, each with levels.** Power grid, water, housing, roads, digital government,
    railways and airports. `infraCost(s,k)` climbs ~60% in dollars and ~25% in months per level, so level 5 of
    anything is a real commitment. Every track feeds something the rest of the simulation already understands
    (megawatts, export capacity, the health target, compliance, reconstruction), never a number of its own.
    Levels live in `s.infra`; `ACT.infra` starts one and `finishInfra` completes it. **Networks are charged
    upkeep every month** (the `upkeep` ledger line) — that is the brake that stops "build everything and coast",
    and it is why `npm run sim`'s `infra` strategy dies on Realistic: networks have to be paid for by an economy.
  - **Trade routes have levels.** A signed deal is level 1 and can be widened twice (`ACT.dealWiden`,
    `dealCost`). `dealLvl(s,id)` is 0 when the route's condition breaks, so everything scales off it and a route
    through a burning province is worth nothing however wide it is. Eleven partners; Egypt, India and the African
    markets open at higher player levels.
  - **`s.xp` and `MEDALS`.** Experience is earned for finishing things and for keeping the country running, and
    medals pay a one-off lump of it. **The engine writes `s.xp` and never reads it back** — `npm run progress`
    asserts that a huge experience total changes nothing in the simulation. Medals never pay in money, because
    that would make the played game easier than the simulated one.
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
- **Decisions come to you** (`src/ui/7-decisions.js`, loaded last). The panels ask the player to go looking;
  this layer asks *them*. `decisionDeck()` reads the current state and returns a ranked list of questions —
  the angriest fixable province, a policy that is costing money, wages behind expectations, a service behind
  the population, a sector nobody has built, a neighbour's offer, a decree you can afford — each with two or
  three options. Every option calls the same `ACT.*` the panels call; the simulation is untouched. Rules:
  a question is only built when the player can *afford it and reach it* (`isOpen()` on every branch), the card
  hides behind drawers and modals, and "Not now" parks that question for `decMonths`. When adding a source,
  filter skipped items *before* picking the best one, or skipping the top item silences the whole category.
- **The Guide** (`GUIDE_TASKS`, `renderGuide()` in `src/ui/5-game.js`) is the first panel a new player sees and
  the only one open from month 0 to the end. It holds four things: the six first steps (ticked off by
  `guideTick()` from the real click handlers, stored in `S.flags.g_*` so no save bump is needed), the single most
  useful thing to do next, why the numbers just moved (`whyLive()`), and the cause-and-effect chains.
  **Any advice must be reachable.** An adviser suggestion that points at a locked control carries `need:'<unlock
  key>'` and is filtered out by `usable()`; `advisorsOpen()` hides ministers whose brief has not opened. This
  was wrong twice — the guide told a brand-new player to build schools, then to fund power stations, both of
  them months away from existing. `npm run guide` now fails if it happens again.
- **Twelve levels** (`LEVEL_AT`, `LEVEL_XP`, `UNLOCK`, `isOpen()` in `src/ui/5-game.js`). A level is reached by
  whichever comes first: enough **months** (the floor, so a player who taps nothing still eventually sees the
  whole game) or enough **experience** (the ceiling coming down, so a player who builds gets there sooner —
  roughly twice as fast, measured against the real curves `npm run sim` prints). The old five-stage schedule is
  preserved exactly: months 0 / 7 / 15 / 27 / 45 are now levels 1 / 3 / 5 / 7 / 9, which is why the onboarding
  test still passes on pure time. Gate new UI by adding a key to `UNLOCK` and wrapping the control in
  `isOpen('key')` — and add it to `LEVEL_GIFTS` so the unlock is announced. Still engine-independent.
- **The networks on the map** (`netOverlay()`, `netLegend()` in `src/ui/8-levels.js`, map layer `build`). Three
  of the seven networks have real geography and are drawn: roads between neighbouring provinces (from `p.nb`,
  thicker and more solid with each level), a rail spine that lays one more line per level (`railLines()`), and
  markers at the two ports and at the airports as they are built. Centroids come from `MAP.cent`. The other four
  — water, housing, digital government, and the grid's own level — have no geography, so they are **counted in
  the legend rather than faked as a colour on a province**. `renderMapSvg()` calls this during the first render,
  so it follows rule 10: function declarations only, and nothing reaching for a `const` in that file.
- **The mentor** (`mentorLevel()`, `MENTOR_MIN` in `src/ui/8-levels.js`). The game counts actions the player took
  from a panel (`S.selfActs`) against actions taken by answering a card (`S.cardActs`) and, with the level,
  decides how loud to be: at 0 it asks often, at 3 it only interrupts for something serious. The deck is filtered
  by question weight, never by trimming a card's answers — a question with one answer is a notification, not a
  decision. The player can override it in the Guide, and set it back to automatic.
- `src/ui/6-multiplayer.js` — the lobby, the scoreboard panel and the header chip. It **wraps** `render`, `advance`,
  `begin`, `renderHUD`, `ensureFrame`, `startScreen` and `menu` rather than redefining them, so single-player
  behaviour is untouched. Add to the wrappers, don't copy the originals.
- `worker/` — the score server: a Cloudflare Worker (`index.js`) and the same thing as a plain Node program
  (`server.js`). Two routes, no accounts, rooms expire after a day.

## Rules for changes
1. **Every string needs English and Arabic.** Never add English-only UI text. Arabic should be plain Modern Standard Arabic a teenager understands; Syrian month names are used.
1b. **Do not show the player a fogged number.** `fog()` returns the exact value; there is no '~'. If something
   should be hidden, hide it — do not blur it.
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
9. **No calendar years in front of the player.** The clock is `Level N · Month M`. `npm run onboard` fails if a
   four-digit year appears on the dashboard or in the news.
10. **Nothing may be silently absent.** If a control is not available yet, the player must be able to find
   out that it exists and when it arrives — a locked network says "Opens at level 4", a far market says the
   same, and the dock's 🔒 button (`lockedThings()`, `showLocked()`) lists everything still to come. A panel
   that simply is not rendered reads as a broken button: that is exactly how the Progress panel was reported
   as "not clicking" when it was really gated to level 5. `npm run audit` enforces this.
11. **A subtab is gated by the same key as the thing behind it** (`renderDrawer` filters `all` through
   `isOpen`). The People panel used to offer "Schools & clinics" from month 0 and let you build them, while
   the guide was forbidden from mentioning schools until level 7 — the panel and the advice disagreeing about
   what the player had been given. When a panel's only open subtab is the first one, the tab row is hidden.
12. **Later files load after the boot render.** `src/ui/5-game.js` ends with the IIFE that renders the first
   screen, so anything that first render touches must already exist. A `const` declared in `7-`/`8-` is still in
   its temporal dead zone at that moment and throws; `function` declarations hoist and are safe. This is why
   `INFRA_ORDER` lives in the engine and `infraReady()` is a function declaration.

## Rules for the scoreboard
- The game must play identically with no server, a dead server, and no room. Every network path is wrapped;
  nothing in `net.js` may throw into the game loop. `npm run mp` covers all three.
- Anything arriving from another player is untrusted: rebuild it field by field (`mpClean`) and escape it on render.
  The server does the same, so a bad client cannot poison a room.
- Scores are client-reported. That is deliberate — see `worker/README.md`. Don't add accounts to "fix" it.
- Traffic has a ceiling: one call per player per 4s, a push at most every 5s, polling 6s open / 20s closed.

## Where we are
See `docs/PROGRESS.md` for what has been built, the decisions worth not undoing, and what is still open.

## Saves
Browser `localStorage` key `transition-syria-v7`, plus copy/paste save codes (base64 JSON). Bump the key/`state.v` if the state shape changes incompatibly (v7 added `s.xp`, `s.medals`, `s.infra`, `s.selfActs`/`s.cardActs` and a `lvl` on every entry in `s.deals`; v6 added `pv.jobless`, `s.ind` and `s.bar`, and dropped `pv.mines`).
