# Where this project is, and how to pick it up again

Written so a future session (or a future you) can resume without re-reading the whole history.
Architecture and the rules for changing things live in `CLAUDE.md` — read that first. This file is
the *state of play*: what exists, why it was built that way, and what is still open.

## Play it / share it

| Link | Who can open it | Live shared scores |
|---|---|---|
| https://claude.ai/artifact/3uGH9P8cq58Uj8uFYsB7Ye | anyone with the link | no — score codes only |
| `https://karamjoud92-create.github.io/SYRIA-GAME/` | anyone | yes, once a score server is set |
| `dist/index.html` | anyone you send the file to | no — score codes only |

The github.io site is **not live yet**. The build and all tests pass in CI on every push; only the
final deploy step fails, with `Ensure GitHub Pages has been enabled`. One switch, once, by the repo
owner: **Settings → Pages → Source: GitHub Actions**, then re-run the latest workflow. Nothing in the
code needs to change.

Live shared scores also need the score server deployed once: `cd worker && npx wrangler deploy`, then
paste the printed address into 🏆 → ⚙️ in the game. See `worker/README.md`.

## What the game is now

A bilingual country-management game. You are president of post-war Syria. Time runs month by month on a slow
clock, shown as a **level and a month count — never a calendar year**; a legacy score (0–100, A–F) moves every
month. The through-line is **systems**: nothing you touch has one effect.

Built in this session, in order:

1. **Shared scoreboard.** Everyone plays their own Syria; only name, score, grade and date travel.
   Room codes, invite links that carry the server address, and score codes as a no-server fallback.
   `src/net/net.js` + `src/ui/6-multiplayer.js` + `worker/`.
2. **Work replaced landmines.** Mines were a timer you waited out. `pv.jobless` is a system: it falls
   when factories open and the lights stay on, and rises with blackouts and violence.
3. **Twelve → fifteen sectors.** Extraction (oil, gas, phosphate, farms) earns more dollars per dollar
   spent. Industry (textiles, food, medicine, cement, telecom, tourism) employs people. Supply (trucks,
   cold chain, packaging) is what lets any of it reach a buyer.
4. **The rising bar** (`s.bar`). Ratchets up with the score, never falls. Succeeding is what makes the
   game hard.
5. **Schools, clinics, universities**, plus `s.edu` / `s.health`.
6. **A population** (`s.popM`) that grows and emigrates, split into poor / getting by / rich by
   `classes()` — a result, never a dial. `poor` is previewed on every decision.
7. **Progressive unlock.** Three panels and one map layer at month 0; the whole game by month 45.
8. **Decisions come to you.** The primary way to play is now a card that asks one question and offers two or
   three answers, in the decision-making genre (which is what *Conquer Countries* actually is — Supersonic name
   the genre themselves). The panels are all still there underneath for anyone who wants them.
9. **The Guide.** A panel open from month 0 that says what to do next, ticks off six first steps as you do
   them, explains why the numbers just moved, and lists the cause-and-effect chains.
10. **Twelve levels instead of years.** The clock reads `Level 6 · Month 23`. A level arrives on whichever comes
   first, months or experience, so a passive player still sees the whole game on the old schedule and an active
   one gets there about twice as fast. Levels 1/3/5/7/9 *are* the old stages at months 0/7/15/27/45.
11. **Seven infrastructure networks, five levels each.** Grid, water, housing, roads, digital government, rail,
   airports — a Clash-of-Clans upgrade ladder with a visible cost, build time and payoff, and none of the
   patience tax. Each level costs ~60% more and takes ~25% longer, and every built level is charged **upkeep
   every month**, which is what stops "build everything and coast".
12. **Trade routes have width.** Eleven partners now, three of them (Egypt, India, African markets) opening at
   higher levels, and every signed route can be widened twice for more influence, dollars and sometimes
   independence. A route whose condition breaks is worth nothing however wide it is.
13. **Experience and 24 medals.** Medals pay in experience, never in money — money would make the played game
   easier than the simulated one and silently break every number in `npm run sim`.
14. **A mentor that steps back.** The game counts what the player does from the panels against what they do by
   answering cards and, with their level, decides how often to ask. Four settings, automatic by default,
   overridable in the Guide. Cards keep two or three real answers at every setting; what shrinks is how often
   one appears — from nine questions waiting to one.

15. **The networks are on the map.** Roads between neighbouring provinces that thicken as you build them, a
   railway that lays one more line per level, and markers at the ports and airports. The four networks with no
   geography are counted in the legend instead of being faked as a colour.
16. **CI actually runs the tests.** `npm run check` plus all seven browser suites — the dead-end audit
   included — on every branch and pull request; Pages only publishes from the default branch once both are
   green.

17. **Nothing is silently absent any more.** A 🔒 button in the dock lists every panel, map layer, policy
   dial and feature still to come, grouped by the level that opens it. This was reported as "the Progress
   button is not clicking" — it was gated to level 5 and simply was not rendered, so there was no button.
18. **`npm run audit`** — a dead-end sweep across twelve levels, two languages and two screen sizes: ~800
   checks for empty panels, silently disabled controls, raw string keys, thrown clicks, subtabs offered
   above their level, and anything locked that is named nowhere.

## Decisions worth not undoing

- **The artifact cannot host live shared scores.** Declaring the artifact database makes a page
  organization-internal and unshareable by link — that is in the runtime contract, not a guess. The
  game therefore calls a plain score server over HTTP, which is also why it degrades to score codes.
- **Scores are client-reported.** Deliberate. Making it cheat-proof means running the simulation
  server-side and turning a link into an account system. See `worker/README.md`.
- **New systems are pivoted at the country's starting value, not at zero.** Both jobs and services were
  first written so that the war itself was a permanent penalty; that broke the missions and made
  Realistic unwinnable. Anything new that drives unrest or trust should read ≈0 at game start and pay
  off as you build. This mistake has now been made twice — do not make it a third time.
- **The bar had to touch the *score*, not just trust,** or it did nothing. Two of the six components are
  measured against expectations; the other four stay absolute, because money in the bank and an honest
  ministry are facts while "is life good" is always a comparison.
- **Unlock is UI-only, and experience does not break that.** `levelNow()` reads `S.t` and `S.xp`. The engine
  *writes* `S.xp` and never reads it back, so the balance sim and the missions still never see a level.
  `npm run progress` asserts it: a state with 999,999 experience runs identically to one with none.
- **Level-ups pay in unlocks and medals, never in resources.** A free $100M on level-up would make the UI game
  measurably easier than every strategy in `tools/sim.js`, and the balance table would quietly stop meaning
  anything.
- **Networks have upkeep.** Without it, `infra` scored 75 on Learner with no industry at all and Reconstruction
  pinned at 100 — a free A by ignoring the economy. With it, `infra` is a 68 on Learner and dies of a default at
  year 4 on Realistic. That failing line in `npm run sim` is the intended lesson, not a regression.
- **A hidden control reads as a broken one.** The Progress panel was fine; it just did not exist below
  level 5, and nothing said so. Users do not conclude "not unlocked yet", they conclude "this button is
  broken". Anything gated must announce itself and its level.
- **Gate the subtab, not just the panel.** `UNLOCK.services` was set to level 7 and the guide obeyed it, but
  the People panel rendered a "Schools & clinics" tab from month 0 with a working build button. The gate has
  to be applied where the control is drawn, or the panel quietly contradicts the advice.
- **`UNLOCK.families` gated nothing.** There was no `isOpen('families')` anywhere — dead config carried over
  from the stage table. The new audit invariant ("locked but named nowhere") is what surfaced it.
- **Don't fake geography.** Water, housing and digital government are national, and tinting provinces by them
  would have been a lie dressed as information. They are counted in the legend instead. Only roads, rail, ports
  and airports are drawn, because only those are actually somewhere.
- **The mentor shrinks the number of questions, not the number of answers.** A card with one answer is a
  notification; a card with two is a decision. Never "simplify" a card by removing an option.
- **Anything the first render touches must already exist.** `5-game.js` ends with the boot IIFE, so a `const` in
  `7-`/`8-` is in its temporal dead zone when `renderDock()` runs and throws. `INFRA_ORDER` therefore lives in
  the engine, and `infraReady()` is a function declaration. This cost one debugging round.
- **A decision card must never offer what the player cannot do.** Same rule as the guide's advice, and it is
  enforced per branch in `decisionDeck()`: affordability *and* `isOpen()`. A card offering a greyed-out option
  is worse than no card.
- **Advice must be reachable.** The guide suggested building schools, and then funding power stations, to
  players who were months away from either panel existing. Suggestions carry `need:'<unlock key>'` and are
  filtered; `npm run guide` fails if a suggestion ever names a locked panel again. When adding a new adviser
  line, ask what it points at and whether that is open yet.
- **No fogged numbers.** `fog()` returns the exact value. If something should be hidden, hide it.

## Open, and worth doing next

- **Levels 10–12 hand over nothing new.** They are the mastery tail: the mentor goes quiet and the remaining
  medals are the only content. If the game grows, that is where new systems belong.
- **Tests must set up their own state.** The map checks in `levels-check.mjs` max out the roads, the railway
  and both ports, which silently changed what the mentor section after them was measuring. Each section now
  builds the state it needs.
- **The decision deck now has ten sources** (ports and infrastructure were added; oil policy, facilities/loans,
  crisis follow-ups and the scoreboard still never surface as questions).
- **The Build panel can bankrupt a careless player on Realistic.** The card refuses to offer an upgrade without
  2.5× its cost in reserves, but the panel itself will happily sell you one you cannot run. That is arguably the
  lesson; if it proves too harsh, the panel should warn rather than block.

- **Provinces are not staged.** All 14 are yours from month 0. Locking them behind "extending state
  authority" fits post-war Syria and would cut the early-game load further, but it needs real engine
  work: unrest in a province you do not control has to be scored differently, or you are punished for
  a place you were never given.
- **The decision deck has seven sources.** Ports, oil policy, facilities/loans, crisis follow-ups and the
  multiplayer scoreboard never surface as questions; a player who only taps cards will never meet them.
- **The first steps do not cover the later game.** The six guide tasks teach months 0–3. Nothing walks a
  player through their first factory, their first school or their first trade deal when those unlock; the
  "what to do next" line carries all of it alone.
- **Ports still jam late.** Supply sectors cut the sim's clog from 160 to 16, but a player who builds
  industry hard and ignores logistics still loses output at the dock with only an advisor line to warn
  them. A louder signal on the map would help.
- **Dead code from older layouts.** `src/ui/1-core.js` and `src/ui/2-map-panels.js` still hold render
  functions that later files override and nothing calls. They reference CSS variables this theme does
  not define. Harmless, but they have already caused one real bug (the invisible cycle labels) and will
  cause another.
- **Old saves break on every state change.** Key is `transition-syria-v6` today. There is no migration
  path, by design; if the game gets an audience that has to change.

## Resuming

```
npm run check     # build + balance sim + missions + progression + scoreboard tests. After ANY engine change.
npm run levels    # browser: levels, the Build panel, wider trade routes, medals, the mentor
npm run strings   # browser: every string exists in English and Arabic
npm run onboard   # browser: does the game still open up slowly, in both languages?
npm run econ      # browser: sectors, factories, the work layer, the bar
npm run browser   # browser: two players in one room
npm run serve     # a local score server on :8787 while working on the scoreboard
```

Branch: `claude/intelligent-bohr-8c06n0`.
Every change in this project was verified in a real browser in English and Arabic before shipping.
Keep doing that: three of the bugs fixed here were invisible to the unit tests and obvious on screen.
