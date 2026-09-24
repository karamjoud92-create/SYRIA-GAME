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
- `npm run trade` → two real browsers, two Syrias, one room: a trade is suggested from what each
  country actually has and needs, one side offering is not a deal, both agreeing makes it live, the
  bonus lands on the country that was short, a friend claiming a perfect score cannot inflate it,
  and either side can end it.
- `npm run live`   → real-time play: the start screen offers live or all-at-once, a live game runs on
  the wall clock, seven hours away is seven months of country, you are told what happened, no crisis
  is ever answered on your behalf, and a very long absence ends the presidency. Both languages.
- `npm run logic`  → the claims the game makes about itself: the presidency ends at twenty years,
  a month-0 decree works, factories stop in the dark but wellheads do not, revolt destroys things,
  the border crackdown costs something, a refinery pays back, extraction earns more per dollar while
  industry employs people, schools are affordable, and population changes the budget. Both languages.
- `npm run indep`  → independence end to end: it is a dashboard number from month 0, it explains itself,
  selling it costs trust, influence, export dollars and calm, the score panel shows all six parts, and
  money buys it back — but never past where you started. Both languages.
- `npm run saves`  → saves, end to end: a code round-trips, a save from a newer build is refused
  and says so, a truncated or hand-edited one changes nothing, a sector that no longer exists is
  dropped rather than crashed on, an old save still opens healed, **a damaged save falls back to
  the backup instead of costing the player their country**, two unusable copies mean a fresh start,
  and the migration chain carries an older save up. Both languages.
- `npm run panels` → the panels themselves: every kind of thing under construction draws, a greyed
  button always says why, an old save still opens every drawer, the floating effect box never
  covers the drawer beside it, and **no header or dock button sits off the edge** at 1920 / 1400 /
  1100 / 900 / 820 / 700 / 390px with every panel unlocked. Both languages. Run it after any CSS or
  panel change.
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
    jobs land and what they earn abroad. Extraction earns more dollars per dollar spent (0.56 vs 0.45
    a year per $ put in); industry employs people (11.3pp of unemployment vs 3.2pp), and people are what
    hold the country together. The three `supply:true` sectors are a third thing and sit out that
    comparison — they do not export, they multiply what everything else fetches, and counting them as
    "industry" flattened the whole trade-off to a 0.2% tie. Levels live in `s.ind`, built count in
    `s.invests`. **No sector has a ceiling**; `investCost` charges 40% more for each level, and the UI
    must quote `investCost(s, id)`, never the base `INVEST[id].usd`.
    Tourism earns without a ship, so the ports never throttle it — unrest and blackouts do.
  - **Services, `s.edu`, `s.health`.** `SERVICES` (schools, clinics, universities) are built in waves against a
    need that scales with `s.popM`; `svcCover` is how much of that need is met. Education and health relax toward
    targets set by that coverage and drag on unrest, trust, capacity and unemployment when neglected. They decay
    if you build nothing, but only to the floor the war left behind — never to zero.
  - **`popRatio(s)` — how many people live here.** `POP0` is 21.9M. The bread and fuel bills, the
    payroll, the cost of running the state, the tax base and electricity demand all scale with
    `popRatio`; `indJobsAt` is divided by it, because a mill employing a fixed number of people
    covers less of a bigger country. Growth is about 1%/yr (the rate read `* dt * 2` when `dt` is
    in half-years — four times too fast, which pinned every surviving strategy at the 40M ceiling).
    Stability and Livelihoods both carry the share of people who stayed, so emigration cannot be
    played as a way to shrink the budget.
  - **`industryPower(s)` — factories need electricity.** `(hours/12)^0.6`, floored at 0.22: 23% of
    full output at one hour a day, 66% at six, full at twelve. It scales industrial exports, the
    capacity export line and food's cut to the wheat bill. Extraction is deliberately exempt — a
    wellhead runs on its own power, which is why pumping oil survives a blackout and making things
    does not. A fully built industrial economy needs the $60M capex tier to stay lit.
  - **`hasDecree(s, id)`.** `s.decrees[id]` stores the month it was signed and month 0 is a real
    month, so `s.decrees.x ? …` silently ignored anything signed in the first month. Never test
    that map for truthiness.
  - **`classes(s)` and `s.popM`.** Population grows, and shrinks when people emigrate (driven by unemployment,
    wages against expectations, unrest and trust). `classes()` splits it into poor / getting by / rich as a
    *result* of wages, work, health, schooling, inflation and corruption — never a dial. `poor` is one of the
    effects every decision previews, which is how a player sees what a policy does to people rather than ledgers.
  - **`sov` — independence, and `grip(s)`.** `s.sov` is how many of the country's decisions are still
    yours. It starts at 60 (`s.sov0`), only loans, foreign deals and concessions spend it, and nothing
    gives it back on its own. `grip(s)` is `(40 - sov)/40` clamped to 0..1: **above 40 it is zero and
    independence costs nothing but score.** Below 40 it bites four ways at once — partners take
    `grip * 20%` off the top of export dollars (ledger line `foreignCut`), the trust target drops
    `grip * 16`, every province gains `grip * 8` anger, and influence grows `grip * 3.5` slower. The way
    back is `ACT.repay(s, $M)`: clearing debt buys one point per `SOV_PER_USD` ($100M), capped at
    `s.sov0`, so money can undo a bargain you regret but never buy more standing than you inherited.
    Sovereignty is graded against `s.bar` like Stability and Livelihoods — a wrecked country leaning on
    its neighbours is forgiven, a working one that still lets foreigners run its ports is not.
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
  hides behind drawers and modals, and "Not now" parks that question for `decMonths`. The `sovBuy` source is the
  one that asks about independence: only once `grip()` is actually biting, only with the dollars to act on it. When adding a source,
  filter skipped items *before* picking the best one, or skipping the top item silences the whole category.
- **The Guide** (`GUIDE_TASKS`, `renderGuide()` in `src/ui/5-game.js`) is the first panel a new player sees and
  the only one open from month 0 to the end. It holds four things: the six first steps (ticked off by
  `guideTick()` from the real click handlers, stored in `S.flags.g_*` so no save bump is needed), the single most
  useful thing to do next, why the numbers just moved (`whyLive()`), and the cause-and-effect chains.
  **Any advice must be reachable.** An adviser suggestion that points at a locked control carries `need:'<unlock
  key>'` and is filtered out by `usable()`; `advisorsOpen()` hides ministers whose brief has not opened. This
  was wrong twice — the guide told a brand-new player to build schools, then to fund power stations, both of
  them months away from existing. `npm run guide` now fails if it happens again.
- **Trading between players** (`tradeProfile`, `pactsOn`, `PACT_KINDS` in the engine; `mpOffer`,
  `mpPactWith`, `mpMatch` in `src/net/net.js`; `mpTradeLine` in `6-multiplayer.js`). Everyone plays
  their own Syria and the simulation stays on their own device, so **nothing tradeable can ever be a
  quantity a player claims to own** — that is the one thing a browser cannot be trusted about.
  Instead: `tradeProfile(s)` reads what a country has spare and what it is short of off the state it
  already publishes; `mpMatch` finds a pair that suits both; and a live pact hands each side a bonus
  **sized by their own economy** (more hours of power, a cheaper wheat bill, more port space, cheaper
  fuel, more investment). The neighbour decides *which* bonus you get, never *how big*. A pact only
  counts when both entries name each other with matching halves, so nobody can grant themselves one,
  and `PACT_MAX` caps how many at once. This needs no server change: the handshake rides on the
  scoreboard entry that already travels.
- **Multinationals** (`FIRMS`, `ACT.firmDeal`, `firmProfits` in the engine; `renderTradeFirms` in
  `5-game.js`; Trade → Companies, unlocked with the rest of trade at month 15). Five firms, each
  with its own conditions and its own shortlist of sectors. **The player chooses the sector** — that
  is the whole decision. The firm builds levels at its own cost and the jobs and output are the
  country's, but it keeps a share of **everything that sector ever earns abroad**, including levels
  the player builds later, and letting it in costs independence. So pointing one at logistics (low
  export value, free levels that unclog the ports) is a coup, and pointing one at your biggest
  earner is a mistake that bleeds for the rest of the game. Any new firm needs both: a real gift and
  a cut that grows with your success, or it is free money like the old crackdown was.
- **Levels and chapters — nothing has a ceiling.** Every sector, berth and service is a ladder:
  `investCost(s, id)` and `portCost(lvl)` charge about 40% more for each level while what a level
  returns stays linear, so growth is paid for out of growth and the wall is the economy rather than
  a number in a table. `countryLevel(s)` is the headline number in the corner where the year used to
  be — a square root of `levelPoints(s)`, so every level asks more than the last, and `s.lvl`
  ratchets so it is a record of what was built. Twenty years is a **chapter**, not an end:
  `nextChapter()` records the grade, carries the same Syria forward and raises the floor of the bar,
  so the game never finishes in one sitting. Watch for caps hiding in two places — the port cap was
  in `ACT.portUpgrade` *and* in the pipe handler, so paying for a fourth berth took the money and
  gave nothing.
- **Nothing may fail silently.** `withEffects` toasts when an action is refused. A cap the player
  cannot see is a dead click: the services cap (`svcRoom`) sat only in the engine, so the button
  stayed live and nothing happened. Any new refusal needs a reason on the control too. The reason
  must be computed **per control**, not for the cheapest one: the repay card greyed its $1B button
  against the $250M test and said nothing. After `S.over` every non-`always` action toasts rather
  than returning silently.
- **Never index a text table off a pipe entry without a fallback.** The engine pushes six kinds
  (`mw`, `proj`, `invest`, `firm`, `port`, `svc`); the Progress drawer assumed anything that wasn't
  a project or a port was an `INVEST` id, so one school in the queue threw inside `render()` and
  blanked the whole panel. `pipeLabel()` handles all six and falls back on an unknown kind.
- **Saves: version → migrate → core → heal → validate → play.** One door, `accept(raw)`, for
  storage and pasted codes alike, because a save that *parses* is not a save that is safe to play.
  - `migrate()` walks `MIGRATIONS` as pure `vN → vN+1` steps and refuses a save from a **newer**
    build rather than guessing at fields it does not know. **Keep every migration forever** —
    deleting one strands every save written before it. The map is empty while v6 is current; the
    chain is what makes the next shape change three lines instead of a redesign.
  - `core()` runs **before** `heal()`. `heal()` can fill in anything, which means it can
    manufacture a whole game out of `{"v":6}` — rubble loading as a country and quietly replacing
    the player's real save. So a save must prove it *was* a game first: the clock, the money, the
    dials and **all fourteen provinces**. `PROVS` cannot change without a migration, so a province
    missing means corruption, not age.
  - `heal(s)` then fills any key added inside v6 from a fresh `newGame`, never overwriting a value
    the player earned — that is what keeps old codes working without a key bump.
  - `validate()` checks types and ranges (no NaN, no strings where numbers go) and **drops content
    that no longer exists** — a sector id removed in a patch must not take a panel down with it.
  - `persist()` keeps the previous save one deep in `KEY + '-bak'`, rotated only from a value a
    running game already wrote, and `restore()` falls back to it. Out of quota, the backup is
    dropped before the live game. Before this, one bad write cost a player twenty years.
  - A refusal says **which** refusal it was (`badCodeNewer` / `badCodeBroken`), in both languages.
  - `npm run saves` covers all of it. Two clues it is right: the suite found the `core()` hole
    while being written, and tightening `restore()` broke a panels test that had been clearing
    only the primary key.
- **CSS: specificity beats order, and two blocks share the 760px breakpoint.** `.dock .dbtn` in the
  first block silently outranked `.dbtn` in the second, so none of the phone shrinking applied and
  the speed buttons ran off a page that cannot scroll. Match the specificity when overriding, and
  let `npm run panels` prove it at 390px.
- **Live play** (`LIVE_MS_PER_MONTH`, `catchUp()`, `showAway()` in `src/ui/5-game.js`). A game started
  in live mode runs on the wall clock: one game month per real hour, recorded in `S.realAt`. On open,
  `catchUp()` steps the months owed, collects what finished, and `showAway()` reports it. **Crises that
  fire while the player is away are queued in `S.pending`, never answered for them** — they are asked
  on return, up to `LIVE_QUEUE_MAX`. Catch-up is capped at a whole presidency. `UI.live` is opt-in and
  defaults false, so the speed buttons and every existing browser test are untouched.
- **Progressive unlock** (`STAGE_AT`, `UNLOCK`, `isOpen()` in `src/ui/5-game.js`). The game opens in stages at
  months 0 / 7 / 15 / 27 / 45: three panels, three policy dials and one map layer to start, the whole game by
  year 4. Gate new UI by adding a key to `UNLOCK` and wrapping the control in `isOpen('key')` — and add it to
  `STAGE_GIFTS` so the unlock is announced. This is engine-independent: `stageNow()` reads only `S.t`, so the
  balance sim and missions are unaffected.
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
3. **Balance:** after touching `engine.js`, run `npm run check` **and read the table it prints** —
   the suite does not fail on balance, it only prints, so grepping the output down to the pass line
   hides drift. That is how uncapping the ladders slipped through: the bots' rule was "buy it if you
   can afford it", which was bounded when everything capped at 3 and became "spend every dollar the
   month it arrives" once nothing did. They ended at 8.7 hours of power and $554M. Doing nothing must eventually fail; steady play
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

## Where we are
See `docs/PROGRESS.md` for what has been built, the decisions worth not undoing, and what is still open.

## Saves
Browser `localStorage` key `transition-syria-v6`, the previous save one deep in
`transition-syria-v6-bak`, plus copy/paste save codes (base64 JSON). v6 added `pv.jobless`,
`s.ind` and `s.bar`, and dropped `pv.mines`.

**Prefer a migration to a key bump.** A bump throws away every country anyone is playing. Add a
`MIGRATIONS[6] = s => …` and raise `SAVE_V` instead; bump the key only for a change no migration
can express. Whatever you do, run `npm run saves` — and add the new shape to it.
