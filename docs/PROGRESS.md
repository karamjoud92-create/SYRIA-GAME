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

A bilingual country-management game. You are president of post-war Syria for 240 months. Time runs month by
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
8. **Decisions come to you.** The primary way to play is now a card that asks one question and offers two or
   three answers, in the decision-making genre (which is what *Conquer Countries* actually is — Supersonic name
   the genre themselves). The panels are all still there underneath for anyone who wants them.
9. **The Guide.** A panel open from month 0 that says what to do next, ticks off six first steps as you do
   them, explains why the numbers just moved, and lists the cause-and-effect chains.

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
- **A decision card must never offer what the player cannot do.** Same rule as the guide's advice, and it is
  enforced per branch in `decisionDeck()`: affordability *and* `isOpen()`. A card offering a greyed-out option
  is worse than no card.
- **Advice must be reachable.** The guide suggested building schools, and then funding power stations, to
  players who were months away from either panel existing. Suggestions carry `need:'<unlock key>'` and are
  filtered; `npm run guide` fails if a suggestion ever names a locked panel again. When adding a new adviser
  line, ask what it points at and whether that is open yet.
- **No fogged numbers.** `fog()` returns the exact value. If something should be hidden, hide it.

### The lira has a tax base now, and the dollars have a way home

For eleven versions the game modelled a **dollar economy and a lira payroll**. Tax revenue was
`20 × compliance × capacity × rate` — a constant `20`, with no term for output, jobs, factories or
population. You could build all 27 sector levels, employ a third of the country, and the tax line did
not move by one lira; only telecom touched it, through compliance. `popM` appeared twice in the whole
engine, both times as a cost. Meanwhile `expWage` climbed with capacity and the bar, so over a 20-year
run the wage bill rose 4×. Success was priced in lira and paid in dollars. A near-perfect builder ended
with $16.4B idle in reserves and a treasury that had never left break-even, which is exactly what a
player notices and cannot explain: *when everything is going well, the lira isn't.*

Three things changed, and they belong together:

- **`domesticBase(s)`** — what the state can actually tax at home: people in steady work, the
  population, and whether the lights are on for the shops. It is measured against January 2027 and is
  exactly `1.0` on day one, so this changes how the tax base *grows*, never what you start with.
- **`bizTax`** — a company tax line, one per sector level. Industry now pays at home as well as abroad,
  which is the second reason to build a factory rather than a well.
- **`fxWindow`** — the central bank sells reserves and the treasury is credited in lira. It is the only
  way a dollar becomes a salary, and it is Dutch disease in one dial: `dutch` cuts manufactured, farm
  and tourism earnings by up to 30% at the top setting. `intervene` credits the treasury too — it used
  to debit reserves and credit *nobody*, which was a plain accounting hole.

The other half of the truth had to come with it, or the treasury simply overflowed instead of the
reserves: the **state scales with the country**. `wages` and `running` are multiplied by `statePop`.
A country that grows 21.9M → 40M needs more teachers, clerks and pensions, and the extra taxpayers do
not come free. Without this the builder treasury ran to 5,010bn — the same broken pattern, new currency.
`fxSlack` gives intervention diminishing returns: selling dollars can stop a currency falling, it cannot
make it permanently strong. Without it the lira could be pushed to 60 and `realWage` bought score.

Measured over 8 seeds × 240 months, the window is score-neutral at $50M and $150M and costs ~7 points at
$400M. It is a real trade-off — lira now, exports later — not a button.

**The caveat, stated plainly.** This moved `builder` on Learner from 73.1 avg / 0-in-8 A-grades to
74.9 / 5-in-8, i.e. straddling the A/B line rather than sitting under it. The gain is *not* the treasury
level — trimming the coefficients changed the scores by literally nothing. It is that a solvent budget
never trips `fx.deficit`, so the lira stops collapsing, and `reconB` divides the rebuilding budget by
`s.parallel`: a stable lira makes reconstruction money go ~36% further. That is the engine's own model
working correctly, and the honest lesson. Holding the A line would mean nerfing the Reconstruction
score (`repaired / 108 * 100 * 2.5`), which would break scoreboard comparability with every score
already posted. Left alone deliberately. `builder` on Realistic went 61 C → 71 B; `smart` is unchanged
at 71 B / 58 C; `trader` on Realistic slipped 58 → 55, because extraction now grows the population and
the state without growing the tax base. That last one is the rentier trap, and it is a feature.

No save bump: `policy.fxWindow` is backfilled in `syncD()`, because `esc(undefined)` renders the literal
word "undefined" and every v6 save in a player's browser lacks the key.

### Levels instead of years, and the game finally ends

Every calendar date is gone from what the player reads: the header clock is a month name for the season and a
month number for the clock, the news log says "Month 26", missions are "48-month challenges", rates are "every
12 months", and durations are in months. `tools/years-check.js` enforces it in both languages and runs inside
`npm run check`; the only years it allows are the real-world citations. Internal names went with it (`sfx('year')`
→ `sfx('level')`, `.toast.year` → `.toast.level`) so nothing is left to trip over.

Progress is now a **level, 1 to 10, earned by score and lost the same way.** `LEVELS` in the engine holds the
bands; they were fitted to measured play, not guessed: both difficulties start on level 3 (scores 35–37), passive
play sinks to 2 and fails, `smart` lands 6–8, `builder` lands 9 and touches 10 on good seeds. `levelOf()` carries
hysteresis so a score hovering on a line does not flip the level every month — a full builder game changes level
about seven times. The badge shows the level number where the grade letter was and the level name where "Legacy
score" was; the month-60 report cards and the ending lead with it. Level-ups toast in gold, level-downs in red.
The A–F grade survives underneath (`levelTone()` maps levels onto its colours, the scoreboard wire still carries
it, so old and new builds can share a room).

**The game had no ending.** `showLegacy` was only called from `commit()` in `ui/4-modals.js`, gated on
`S.turn > MAX_TURNS` — `S.turn` does not exist in the continuous-time state, and `commit()` is never called by
the live layer. A winning run sailed past month 240 ("20 years in office · Report card, Jan 2047") and kept going
forever. `advance()` now ends the game at `GAME_MONTHS` with a revived `showLegacy` that reports the final level.
`npm run levels` drives a real game to 240 in both languages and asserts it.

Port sizes were called "Level 1 of 3", which would have collided with the new levels on screen; they are
"Size 1 of 3" now.

**The level names went through an Arabic review for this audience, and it changed two of them.** The
first draft had level 3 as "صامدون" and level 1 as "حالة طوارئ". Both are words one side of the war owns:
الصمود is factional vocabulary in Syrian political discourse, and حالة الطوارئ is the 1963–2011 emergency
law. They are "نتماسك" and "انهيار" now (English "Falling apart" for 1, to match). Rule 6 applies to level
names as much as to crisis options — the reviewer also flagged إصلاحات (political reforms, not repairs) and
متمرّد (the state's word for the uprising) as words to keep out of anything a level card says.

Two bugs the review caught in the same pass: reloading a finished campaign crashed (`restore()` sent every
non-fail ending to `showMissionEnd()`, which reads `S.mission.id`), and a score jump of two bands that landed
inside a point of the top floor froze the level instead of settling one band down. Both have tests now. The
12-month score toast — the old "new year" toast with a new name — is gone: it was a year rhythm in disguise
and fired in the same frame as level toasts. On phones the badge now keeps the level name and drops only the
score delta; before, it showed a bare "3 | 37".

## Open, and worth doing next

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
- **The tax base saturates by year 5.** `domesticBase` hits its 1.55 ceiling early, because provincial
  `jobless` floors at 4 and `popM` clamps at 40M — both pre-existing. The interesting pull (build a
  factory, watch the tax line move) is all in years 0–8. After that only `bizTax` still grows.
- **A strong lira is still a free Reconstruction multiplier.** `reconB = P.recon * dt / s.parallel`
  treats rebuilding as 100% imported. It is mostly domestic — labour, cement, rubble. Blending the
  two would remove the last place where currency strength buys score directly.

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
