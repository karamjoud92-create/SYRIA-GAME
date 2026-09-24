# Publishing the game on itch.io

`dist/index.html` is the whole game — one self-contained file, no assets, no server. That is
exactly what itch.io's **HTML** project kind wants, so publishing is: make a page once, then
`butler push` forever.

Uploads go through **butler**, itch.io's command-line tool. It diffs against the last build and
sends only what changed, so a republish after a one-line fix is a few KB, not 461.

## Before the first push

Three steps need your itch.io account, so they are yours, not the agent's.

**1. Make the page** at <https://itch.io/game/new>.

| Field | Set it to | Why |
|---|---|---|
| **Kind of project** | **HTML** | Without this the game is a *download*, not something you press Play on. |
| Visibility | **Draft** at first | Nobody sees it until you say so. |
| Pricing | No payments / free | |

**2. Install butler** from <https://itchio.itch.io/butler>, put it on your `PATH`, then:

```bash
butler login      # opens a browser to authorize this machine
butler version    # confirms the install and the PATH
```

**3. Note your itch username.** Everything below uses `<user>/<game>`, e.g. `karam/transition-syria`.

## Pushing

```bash
npm run itch                                        # build + prove it survives itch's iframe
butler push dist <user>/transition-syria:html       # the channel MUST be named html
```

`npm run itch` is not optional politeness. itch serves the game inside a **sandboxed iframe on
its own domain**, which is not how you have been testing it. That suite loads the real built file
in an itch-shaped iframe twice — once with storage allowed, once with it **denied** — and checks
the game still opens, plays a year, draws its panels, and saves without throwing. See
[Storage in the iframe](#storage-in-the-iframe).

## After the first push — the two switches everyone forgets

An HTML5 game shows up as a **download button** unless *both* of these are set. Neither happens
from the channel name.

1. On **Edit game**, set **Kind of project = HTML**.
2. In the **Uploads** list, tick **"This file will be played in the browser"** on the `html`
   channel.
3. Press **Save**.

While you are on that page, for this game specifically:

| Setting | Value | Why |
|---|---|---|
| Viewport dimensions | **1280 × 800** | Fits the map, both trays and the dock without wrapping. |
| **Fullscreen button** | **on** | The map is the game. Give people the whole screen. |
| **Mobile friendly** | **on** | The layout is checked down to 390px in both languages by `npm run panels`. |
| Orientation | **Default / both** | It works either way; portrait is the tested phone case. |

## Updating later

```bash
npm run itch                                            # never push a build you have not run
butler push dist <user>/transition-syria:html --userversion 1.3.0
```

Push to the **same channel** every time. A typo makes a second channel and a second download
slot, not an update.

```bash
butler status <user>/transition-syria        # channels, builds, versions
butler push-preview dist <user>/transition-syria:html   # what would change; uploads nothing
```

## Things that bite on itch specifically

### Storage in the iframe

Saves live in `localStorage`, which on itch belongs to itch's sandbox domain, not yours. Two
consequences:

- **A save made on itch is not the save made on the artifact link.** Different origins, different
  storage. That is not a bug, but tell your friends once: if they played at the claude.ai link,
  they should carry the country over with **Copy save code** → **Load save code**.
- **Some browsers block third-party storage entirely**, and then every `localStorage` call
  *throws*. Every call in this codebase is wrapped, and the strict arm of `npm run itch` proves
  the game still opens, plays and keeps its panels with storage fully denied — it just cannot
  save. Save codes still work, because they are just text.

### Fonts

The page asks Google Fonts for Baloo 2 / Baloo Bhaijaan 2. On itch that is a third-party request
and can be blocked or slow. The CSS falls back to Trebuchet/Tahoma/system-ui and `npm run itch`
checks the fallback resolves. It will look slightly plainer, never broken.

### Multiplayer

`MP.relay` is empty by default, so the scoreboard starts in **code-sharing** mode: players swap
score codes by hand and nothing needs a server. If you want a live room on itch, deploy
`worker/` and have players paste the relay URL — the game plays identically with no server, a
dead server and no room, which `npm run mp` covers.

Invite links are built from `location`, so on itch they point at the iframe URL rather than your
game page. Share the **page** URL and a room code instead.

### Don't

- **Don't push a zip.** Push the `dist` folder. itch compresses on its side, and a pre-compressed
  blob makes every future patch the size of the whole game.
- **Don't push `dist` with anything else in it.** The build writes one file; keep it that way.
- **Don't rename the channel.** `html` is what carries the *playable in browser* tag.

## CI, if you ever want it

Generate an API key at <https://itch.io/user/settings/api-keys>, put it in the repo's secrets as
`BUTLER_API_KEY`, and butler picks it up instead of `butler login`. Never echo it — a key in a
public log is compromised and must be revoked on that page immediately.
