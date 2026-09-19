# The score server

A single file that does one thing: remember a name and a score for each player in a room,
and hand the list back. No accounts, no cookies, no game state. Each player's Syria never
leaves their own device — only the scoreboard travels.

```
POST /r/{ROOM}   {id, name, score, grade, comp, t, diff, mission, over}  ->  {now, players:[…]}
GET  /r/{ROOM}                                                           ->  {now, players:[…]}
```

A room is forgotten 24 hours after its last player, and holds at most 60 players.

## Put it on Cloudflare (free, one command)

```bash
cd worker
npx wrangler login     # once
npx wrangler deploy
```

It prints an address like `https://syria-scores.<your-name>.workers.dev`. Open the game,
press 🏆 → ⚙️ **Score server**, paste that address, save. From then on your invite links
carry the address with them, so your friends set up nothing at all.

If the deploy complains about Durable Objects, your account is on an older plan that does
not include them. Run the Node version below on any host instead — the game does not care
which one answers, as long as it speaks the two lines above.

## Or run it anywhere with Node

```bash
node worker/server.js 8787                 # in memory
node worker/server.js 8787 scores.json     # survives a restart
```

For friends on other networks this has to be reachable from the internet (a small VPS, a
free container host, or a tunnel). On your own wifi, `http://<your-computer's-ip>:8787`
is enough — but note that a game served over `https://` cannot call an `http://` server,
so use the local `file://` copy of the game, or put the server behind https.

## What it does not do

It takes each player at their word about their own score. Anyone who can open the browser
console can post a score they did not earn. That is the right trade for a game you play
with friends: making it cheat-proof would mean running the whole simulation on the server
and turning a link you can hand out into an account people have to create.
