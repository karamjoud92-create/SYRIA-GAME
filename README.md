# Transition: Rebuild Syria · المرحلة الانتقالية

A bilingual (English / العربية) game about rebuilding Syria after the war. You set policies, sign trade deals, invest in oil, gas and ports,
and handle crises while a live score shows how history will judge you. Made to help young Syrians see how many connected systems a country runs on.

## Play
Open `dist/index.html` in any browser, or visit the published site. No install, no account.

## Play with friends
Everyone runs their own Syria — nothing you do changes anyone else's country. What is shared is the scoreboard:
you all see each other's legacy score move, month by month, and get told when someone passes you.

1. Press 🏆 on the start screen, type a name, press **Create a room**.
2. Press **Copy invite link** and send it to your friends. The link carries the room and the score server, so they set up nothing.
3. Each friend opens the link, types a name, and plays their own game.

For the scores to travel by themselves, one person deploys the score server once — see [`worker/README.md`](worker/README.md);
it is one command on Cloudflare's free plan. Without it the game still works: press 🔑 **My score code**, send the code to the group
chat, and paste your friends' codes in with ➕. Same scoreboard, moved by hand.

## Publish it as a website
`.github/workflows/pages.yml` publishes `dist/index.html` to GitHub Pages on every push to the default branch.
Turn it on once in **Settings → Pages → Source: GitHub Actions**.

## Develop
Requires Node.js 18+.
```
npm run build      # build dist/index.html
npm run check      # build + balance simulation + mission tests + scoreboard tests
npm run serve      # run a score server on localhost:8787 while you work
npm run browser    # two real browsers in one room (needs: npm i -D playwright)
```
See `CLAUDE.md` for architecture and rules.

## Credits
Map boundaries: Natural Earth (public domain). War-damage total: World Bank Syria damage assessment (2025). All other figures are simplified for play.
Inspired by the concept of the Arabic game "رئيس الجمهورية" by Hadeal Ahmad; no code or text from it is used.
