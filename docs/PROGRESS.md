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

A bilingual country-management game. You are president of post-war Syria from 2027. Time runs month by
month on a slow clock; a legacy score (0–100, A–F) moves every month. The through-line is **systems**:
nothing you touch has one effect.

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
7. **Progressive unlock.** Three panels and one map layer at month 0; the whole game by year 4.

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
- **Unlock is UI-only.** `stageNow()` reads `S.t` and nothing else, so the balance sim and the missions
  never see it. Keep it that way.
- **No fogged numbers.** `fog()` returns the exact value. If something should be hidden, hide it.

## Open, and worth doing next

- **Provinces are not staged.** All 14 are yours from month 0. Locking them behind "extending state
  authority" fits post-war Syria and would cut the early-game load further, but it needs real engine
  work: unrest in a province you do not control has to be scored differently, or you are punished for
  a place you were never given.
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
npm run check     # build + balance sim + missions + scoreboard tests. Run after ANY engine change.
npm run onboard   # browser: does the game still open up slowly, in both languages?
npm run econ      # browser: sectors, factories, the work layer, the bar
npm run browser   # browser: two players in one room
npm run serve     # a local score server on :8787 while working on the scoreboard
```

Branch: `claude/multiplayer-game-shared-scores-l72mdf` (the repository's default branch).
Every change in this project was verified in a real browser in English and Arabic before shipping.
Keep doing that: three of the bugs fixed here were invisible to the unit tests and obvious on screen.
