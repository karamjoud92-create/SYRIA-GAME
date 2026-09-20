// The clock counts months and levels, never calendar years. This fails the build if a year word
// creeps back into anything the player can read, in either language. Real-world history cards and
// the sourced World Bank figure are the only places a year may appear.
const fs = require('fs'), path = require('path');
const FILES = [...fs.readdirSync('src/text').map(f => 'src/text/' + f), ...fs.readdirSync('src/ui').map(f => 'src/ui/' + f)].filter(f => f.endsWith('.js'));
// a line is allowed to carry a year only if it is one of these real-world citations
const ALLOW = /lebanon:|zimbabwe:|germany:|rwanda:|iraq:\{|World Bank|البنك الدولي|Natural Earth/;
const PATTERNS = [
  [/\b(year|years|yearly|annual|annually)\b/i, 'en year word'],
  [/\/yr\b/, 'en /yr'],
  [/\b20[2-4]\d\b/, 'calendar year'],
  [/سنة|سنوات|سنوي|عاماً|أعوام/, 'ar year word'],
  [/(^|[\s،.(])عام([\s،.)]|$)/, 'ar عام (year)'],       // standalone; "العام"/"عامة" (public/general) are not matched
  [/هذا العام|كل عام|بعد عام|خلال عام|في عام|منذ عام/, 'ar "the year" phrase'],
];
let bad = 0;
for (const f of FILES) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  let prevAllowed = false;
  lines.forEach((line, i) => {
    // a citation's Arabic twin sits on the next line: it inherits the allowance
    const allowed = ALLOW.test(line) || (prevAllowed && /^\s*ar:\[/.test(line));
    prevAllowed = allowed;
    if (allowed) return;
    if (/^\s*\/\//.test(line)) return;                       // comments are not player-facing
    for (const [re, why] of PATTERNS) {
      const m = line.match(re);
      if (m) { bad++; const at = Math.max(0, m.index - 40); console.log(`  ${f}:${i + 1}  [${why}]  …${line.slice(at, m.index + 60).trim()}…`); break; }
    }
  });
}
console.log(bad ? `\n${bad} year reference(s) still reachable by the player` : '\nno year words in player-facing text');
process.exit(bad ? 1 : 0);
