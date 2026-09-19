// Browser smoke test. Needs Playwright once:  npm i -D playwright && npx playwright install chromium
// Run:  npm run build && node tools/smoke.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
const file = 'file://' + path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist/index.html');
const browser = await chromium.launch(); const errors = [];
for (const [name, viewport, locale] of [['desktop-en', { width:1440, height:900 }, 'en-US'], ['desktop-ar', { width:1440, height:900 }, 'ar'], ['phone', { width:390, height:844 }, 'en-US']]) {
  const page = await browser.newPage({ viewport, locale });
  page.on('pageerror', e => errors.push(`${name}: ${e.message}`));
  await page.goto(file); await page.waitForTimeout(400);
  await page.click('[data-act=newgame][data-v=learner]');
  for (let i = 0; i < 6; i++) { await page.click('.modal .btn.primary'); await page.waitForTimeout(50); }
  await page.click('.dbtn[data-v=policy]'); await page.click('[data-act=pol][data-k=fuel][data-v=market]');
  await page.click('.dbtn[data-v=trade]'); await page.click('[data-act=subtab][data-v=partners]');
  await page.click('[data-act=speed][data-v="3"]');
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(700);
    const opt = await page.$('.modal .opt[data-act=choose]:not([disabled])'); if (opt) await opt.click();
    const close = await page.$('.modal [data-act=close], .modal [data-act=nextq]'); if (close) await close.click();
  }
  await page.screenshot({ path: `tools/shot-${name}.png` });
  console.log(name, 'reached', await page.innerText('.turn .yr'));
}
await browser.close();
if (errors.length) { console.error('ERRORS:\n' + errors.join('\n')); process.exit(1); }
console.log('Smoke test passed. Screenshots in tools/shot-*.png');
