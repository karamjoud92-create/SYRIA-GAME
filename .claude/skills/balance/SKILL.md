---
name: balance
description: Change engine.js without breaking the game. Use whenever editing src/engine/engine.js, retuning a number, adding a sector, changing a cost, or when a balance suite moves. Encodes the traps that have already cost this project days — the ratcheting bar, caps hiding in two places, and the fact that npm run check does NOT fail on balance drift.
---

# Changing the engine without breaking the game

`npm run check` **does not fail on balance.** It prints a table and exits 0. Grepping its output
down to the pass line is how a regression shipped: builder@5y had fallen to 36 F on 8.7 hours of
power with $554M in the bank, and nothing said a word. **Read the table. Every time.**

## The loop

1. Record the current table first (`npm run check 2>&1 | tee /tmp/before.txt`). You cannot tell
   whether you moved something if you do not know where it was.
2. Make the smallest change that could work.
3. `npm run check` and diff the table against `before`.
4. `npm run logic` — the claims the game makes about itself. Several are margin-sensitive; see below.
5. Only then the browser suites that touch what you changed.

## The baseline (2026-09, after the panel audit)

```
passive    learner   FAIL fracture @8.9y  32 F
smart      learner   66 B    trader 67 B   trader2 65 B
builder    learner   74 B    builder2 68 B seller 57 C
passive    realistic FAIL fracture @6.6y  27 F
smart      realistic 61 C    trader 59 C   trader2 54 C
builder    realistic 59 C    builder2 61 C seller 48 D
builder@5y 41 D  →  @10y 53 C  →  @20y 74 B
```

What must stay true (CLAUDE.md rule 3):

- `passive` **must eventually fail** on both difficulties. Doing nothing cannot survive.
- `smart` ≈ B on Learner, C on Realistic.
- `builder` **beats** `trader`. Making things beats pumping oil, or the whole thesis is dead.
- The builder curve **climbs and then fights**: 41 → 53 → 74, not a runaway to A.
- `seller` (signs every foreign deal) ends worst. Selling the country is not a strategy.

## Traps that have already bitten

**The bar ratchets off your own score and never falls.** So a strategy that scores *less* keeps the
bar *low*, and raising the bar to make the game harder can make bad play look better. Pushing the
Learner bar harder is what un-fixed the crackdown, the schools and emigration in one go. Tune
Realistic (`barFrom`/`barOver`) and leave Learner alone unless you have a reason.

**Caps hide in two places.** The port cap lived in `ACT.portUpgrade` *and* in the pipe handler, so
paying for a fourth berth took the money and gave nothing. `max:3` lived in the `INVEST` table and
in two UI files, so the escalating-cost ladder was unreachable for weeks. When you remove a
ceiling, `grep -rn` the id across engine, UI *and* tools.

**The sim bots were written for a capped world.** Their rule was "buy it if you can afford it",
which was bounded when everything capped at 3 and became "spend every dollar the month it arrives"
once nothing did. They now keep a `BUFFER`. If you change what things cost, check the bots still
behave like players and not like a spending algorithm — and say so when you change them.

**One fix can undercut another.** Raising the crude price to make oil worth pumping collapsed the
refining margin that had just been fixed. Anything touching `oilExport` must be checked against
`refinery` payback in `npm run logic`, and vice versa.

**A test passing by 0.2% is not passing.** The extraction-vs-industry assertion read 0.563 vs 0.562
for a long time — a coin flip dressed as a design property, and it meant industry strictly
dominated. When `npm run logic` prints a margin, look at the margin, not the tick.

## Rates

Every rate in `engine.js` is **per half-year**, and `dt` is in half-years (`MONTH = 1/6`). A line
that reads `* dt * 2` is a per-year rate — population growth had exactly this bug and ran 4× too
fast, pinning every surviving strategy at the 40M ceiling and hiding the fact that popM did nothing.
Flows multiply by `dt`; relaxation uses `relax(rate, dt)`.

## Before you commit

- [ ] The table read, not grepped
- [ ] passive fails, smart ≈ B/C, builder > trader, the curve climbs
- [ ] `npm run logic` green **and its margins sane**
- [ ] `npm run missions` — "nothing" loses, "smart" wins, every mission
- [ ] If any prose in CLAUDE.md now describes something false, fix the prose in the same commit
