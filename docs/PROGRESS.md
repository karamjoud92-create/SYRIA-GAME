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
8. **Decisions come to you.** The primary way to play is now a card that asks one question and offers two or
   three answers, in the decision-making genre (which is what *Conquer Countries* actually is — Supersonic name
   the genre themselves). The panels are all still there underneath for anyone who wants them.
9. **The Guide.** A panel open from month 0 that says what to do next, ticks off six first steps as you do
   them, explains why the numbers just moved, and lists the cause-and-effect chains.
10. **Independence is a real system.** It used to be a chip on a contract and a number the player saw once
   every five years. It is now a dashboard chip from month 0 with its own glossary entry, a Score tab in
   Progress that shows all six components any month, four live consequences below 40 (`grip()`), and a way
   back: paying off the $6.1B of inherited debt buys it back at $100M a point, up to where you started.

11. **A logic pass over the whole engine.** Twelve things the game asserted about itself and did not
   do. The presidency never ended; factories ran at full output in the dark; nothing ever destroyed
   anything; schools cost more than the entire tax take; population was read in two places; the
   statistics office sold a benefit that did not exist; a decree signed in month 0 did nothing;
   the crackdown was free; the refinery lost money; extraction and industry were the wrong way
   round; living standards ignored whether anyone worked; population grew four times too fast.
   `npm run logic` now holds every one of them.

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
- **If the game says it in prose, the code has to do it.** Every finding in the logic pass was a
  sentence somewhere — in the glossary, a policy hint, an investment card or CLAUDE.md — that the
  engine did not implement. "Keep the lights on so workshops can run" was in the jobs glossary while
  industrial output ignored electricity entirely. Prose is a specification; check it against a probe.
- **Dead code hides live bugs.** The twenty-year ending was unreachable for as long as it was,
  because the old turn-based `advance()` still held the check and still looked right. This is the
  second bug that file has caused. When overriding a function, read what the old one did last.
- **Month 0 is a real month.** `s.decrees[id] = s.t` is falsy on the first month. This has now bitten
  twice — once in the decision deck's skip list, once across nine decree effects. Store a timestamp,
  test with `!== undefined`.
- **A rate is per half-year unless it says otherwise, and conversions are where the bugs are.**
  Population growth read `* dt * 2` where a year is `dt / 2`. Four times too fast for long enough
  that every surviving strategy sat on the 40M ceiling, which made the bug invisible.
- **Tuning the test to pass is not fixing the game.** Three times in this pass a scripted strategy
  stopped working because a rule that had been free suddenly cost something. Each time the question
  is whether the bot was modelling a strategy or exploiting the gap: the sim's crisis picker was
  arbitrary (fixed), the builder's grid funding was tuned for a world where power did not matter
  (the engine gained a $60M tier instead), and the crackdown bots were simply wrong to leave it on.
- **Making a dial real usually needs a matching lever.** Factories needing power made a full
  industrial economy unpowerable until capex got a $60M tier. Giving independence teeth needed
  `ACT.repay`. A cost with no counterplay is a trap, not a decision.
- **A score component the player cannot see is not a mechanic.** Independence was one sixth of the score
  with no readout, no glossary entry and no gameplay effect: signing every loan, deal and concession on
  offer cost about 1.8 points across 20 years. Anything that feeds `legacy()` needs a live readout and a
  consequence the player feels between milestones, or it is decoration.
- **Teeth need a way back.** `grip()` would have been a trap without `ACT.repay`: a player who sold the
  country early had no agency left. Buying independence back is capped at `s.sov0`, so it undoes a bargain
  you regret without becoming a way for a rich late game to buy score.
- **The grip threshold is 40, not 50.** At 50 the scripted strategies sat inside the penalty band purely
  because the sim takes whichever crisis option comes first, and `builder` stopped beating `trader` on
  Realistic. A little foreign help has to be free; only dependency is a spiral.
- **The balance sim now picks crisis options deliberately.** It used to take the first affordable one —
  arbitrary, and harmless only while sovereignty did nothing. It now avoids selling independence, and a
  `seller` strategy was added that deliberately takes every foreign hand: it ends the richest in dollars
  ($13.8B) and near the bottom in score (57 C / 45 D against builder's 74 B / 63 B). That row is the
  regression test for the whole mechanic — if `seller` ever scores well, the teeth have fallen out.

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
- **Old saves no longer break on every state change** (fixed). `heal()` in `src/ui/5-game.js` runs
  from `syncD` on every load path and fills any key a save is missing from a fresh `newGame`,
  without overwriting anything the player earned. The key is still `transition-syria-v6`; bump it
  only for a change that cannot be healed.

## Resuming

```
npm run check     # build + balance sim + missions + scoreboard tests. Run after ANY engine change.
npm run onboard   # browser: does the game still open up slowly, in both languages?
npm run econ      # browser: sectors, factories, the work layer, the bar
npm run indep     # browser: the independence chip, score panel, teeth and the buy-back
npm run logic     # browser: the claims the game makes about itself, in both languages
npm run panels    # browser: panels open, greyed buttons explain themselves, nothing off the edge
npm run browser   # browser: two players in one room
npm run serve     # a local score server on :8787 while working on the scoreboard
```

Branch: `claude/multiplayer-game-shared-scores-l72mdf` (the repository's default branch).
Every change in this project was verified in a real browser in English and Arabic before shipping.
Keep doing that: three of the bugs fixed here were invisible to the unit tests and obvious on screen.

## The panel audit (last round)

Twenty-seven agents went over the built page in parallel — panels, dead clicks, Arabic/RTL, the new
features, saves, and thrown errors over a long playthrough — and every finding was handed to
independent skeptics who tried to refute it first. Sixteen survived; five were correctly refuted.
All sixteen are fixed, and `npm run panels` now fails if any of them comes back.

Worth not undoing:

- **`pipeLabel()` handles all six pipe kinds.** The Progress drawer used to assume anything that was
  not a project or a port was a factory, so a school or a multinational in the queue threw inside
  `render()` and blanked the panel for good. The fallback branch matters as much as the six cases.
- **`heal()` on every load path.** See above. This is why old save codes still open Trade → Companies.
- **Factories really have no ceiling now.** `max:3` was still sitting in every `INVEST` entry and the
  UI honoured it, so the escalating-cost ladder was unreachable. The cards also quoted the base price
  forever; they charge `investCost(S, id)` now and show `Level N` instead of ●●○.
- **The HUD and the dock wrap at every width**, and their buttons are checked at seven viewport widths
  in both languages with every panel unlocked. Two separate 760px blocks in the stylesheet meant the
  phone rules were being outranked and never applied at all.
- **The dig-vs-make trade-off is measured without the supply sectors.** Counting packaging, cold chain
  and logistics as "industry" made extraction and industry tie to within 0.2% on dollars per dollar —
  which would have meant industry strictly dominates, and no choice at all. Excluded, the gap is 25%.

Still open after this round:

- **Ports still jam late.** A fully built industrial economy outruns the berth ladder (the sim's
  builder ends with 348 of unmet export demand). The answer exists in the game — more berths, more
  logistics — but eight months a berth is slow, and the only warning is a badge on the Trade panel.
- **Dead code from older layouts** is still in `src/ui/1-core.js` and `src/ui/2-map-panels.js`.
