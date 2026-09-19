// Builds dist/index.html: one self-contained file (no external assets except Google Fonts).
// Script order matters: later files override earlier function declarations. See CLAUDE.md.
const fs = require('fs'), path = require('path');
const r = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const ENGINE = ['engine/engine.js', 'engine/mapdata.js'];
const UI = ['text/1-ui-strings.js', 'text/2-content.js', 'text/3-stories.js', 'text/4-time-trade.js',
  'ui/0-sfx.js', 'ui/1-core.js', 'ui/2-map-panels.js', 'ui/3-board.js', 'ui/4-modals.js', 'ui/5-game.js'];
const html = r('shell.html').replace('/*ENGINE*/', () => ENGINE.map(r).join('\n')).replace('/*UI*/', () => UI.map(r).join('\n')); // function form: avoids $ patterns in replace
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), html);
// Syntax check of the combined UI script (catches duplicate const/let declarations across files)
const tmp = path.join(__dirname, 'dist', '.ui-check.js');
fs.writeFileSync(tmp, UI.map(r).join('\n'));
try { require('child_process').execSync(`node --check "${tmp}"`, { stdio:'inherit' }); } finally { fs.unlinkSync(tmp); }
console.log(`Built dist/index.html (${(html.length / 1024).toFixed(0)} KB)`);
