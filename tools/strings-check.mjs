// Every player-facing string exists in English and in Arabic.
// `t()` falls back to printing the key itself when a string is missing, so a forgotten one does not
// crash — it just shows up on screen as "subWhy". This check found exactly that, twice.
import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path';
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath:'/opt/pw-browsers/chromium' } : {});
const p = await b.newPage();
await p.goto('file://' + path.resolve('dist/index.html')); await p.waitForTimeout(400);
const UI = ['1-core', '2-map-panels', '3-board', '4-modals', '5-game', '6-multiplayer', '7-decisions', '8-levels'];
const src = UI.map(f => fs.readFileSync(`src/ui/${f}.js`, 'utf8')).join('\n');
// keys named directly, plus the ones passed to t() through a table (drawer titles, subtab labels)
const keys = [...new Set([...src.matchAll(/\bt\('([A-Za-z0-9_]+)'\)/g)].map(m => m[1])
  .concat([...src.matchAll(/'(sub[A-Z][A-Za-z]+|d[A-Z][A-Za-z]+|[a-z]+Sub)'/g)].map(m => m[1])))];
const missEn = await p.evaluate(ks => ks.filter(k => STR.en[k] === undefined), keys);
const missAr = await p.evaluate(ks => ks.filter(k => STR.en[k] !== undefined && STR.ar[k] === undefined), keys);
// and the bilingual tables, which are objects rather than STR entries
const tables = await p.evaluate(() => {
  const out = [];
  const check = (name, obj, fields) => Object.entries(obj).forEach(([k, v]) => {
    fields.forEach(f => { if (!v[f] || (Array.isArray(v[f]) && !v[f].length)) out.push(`${name}.${k}.${f}`); });
  });
  check('INFRA_TXT', INFRA_TXT, ['en', 'ar']); check('MEDAL_TXT', MEDAL_TXT, ['en', 'ar']);
  check('PART_TXT', PART_TXT, ['en', 'ar']); check('INV_TXT', INV_TXT, ['en', 'ar']);
  LEVEL_TITLE.forEach((x, i) => { if (!x.en || !x.ar) out.push('LEVEL_TITLE[' + i + ']'); });
  // every engine thing the player can see needs a name in both languages
  Object.keys(INFRA).forEach(k => { if (!INFRA_TXT[k]) out.push('INFRA_TXT missing ' + k); });
  Object.keys(PARTNERS).forEach(k => { if (!PART_TXT[k]) out.push('PART_TXT missing ' + k); });
  MEDALS.forEach(m => { if (!MEDAL_TXT[m.id]) out.push('MEDAL_TXT missing ' + m.id); });
  return out;
});
const fails = missEn.length + missAr.length + tables.length;
console.log(`  ${missEn.length ? 'FAIL ' : 'ok   '}${keys.length} keys have English${missEn.length ? ': ' + missEn.join(', ') : ''}`);
console.log(`  ${missAr.length ? 'FAIL ' : 'ok   '}and all of them have Arabic${missAr.length ? ': ' + missAr.join(', ') : ''}`);
console.log(`  ${tables.length ? 'FAIL ' : 'ok   '}every name, medal, network and partner is in both languages${tables.length ? ': ' + tables.join(', ') : ''}`);
await b.close();
console.log(fails ? `\n${fails} FAILED` : '\nall string checks passed');
process.exit(fails ? 1 : 0);
