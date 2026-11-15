// Headless visual QA with a mocked Tauri backend (no Rust needed).
// Usage: npm run qa:shots -- --out docs/assets/qa --themes dark,grey,light --sizes 1280x800,900x600 --views grid,list,settings,add,installed,sgdb,profile,confirm,hover,palette,palette-search [--scenario mixed|idle|launching|accent [--accent #19e3ff]|cover] [--tab 12] [--url http://localhost:1420]
// Browser: set CHROMIUM_PATH, or it uses the newest Playwright headless shell in ~/.cache/ms-playwright.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { findBrowser, startDevServer } from './lib.mjs';
import { installTauriMock, PROFILES, STATUSES } from './tauri-mock.js';

const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : def; };
const out = arg('out', 'docs/assets/qa');
const themes = arg('themes', 'dark,grey,light').split(',');
const sizes = arg('sizes', '1280x800').split(',').map(s => s.split('x').map(Number));
const views = arg('views', 'grid').split(',');
const tabs = Number(arg('tab', 0));
// mixed = 3 live + 1 crashed (default) | idle = nothing running | launching = idle, then click Run sequence
const scenario = arg('scenario', 'mixed');
const accentColor = arg('accent', '#19e3ff'); // used by --scenario accent
let url = arg('url', '');

const exe = findBrowser();
if (!exe) { console.error('No Chromium found. Run `npx playwright install chromium` or set CHROMIUM_PATH.'); process.exit(1); }

let server;
if (!url) { server = await startDevServer(); url = server.url; }

mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
try {
  for (const theme of themes) for (const [w, h] of sizes) for (const view of views) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    page.on('pageerror', e => { if (!/unregisterListener/.test(e.message)) console.log('PAGEERROR', e.message); });
    const COVER = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b3d5c"/><stop offset=".6" stop-color="#c2410c"/><stop offset="1" stop-color="#ffd166"/></linearGradient></defs><rect width="1200" height="400" fill="url(#g)"/><path d="M0 300 C300 220 600 360 1200 200 L1200 400 L0 400Z" fill="#111" opacity=".55"/></svg>');
    const profiles = scenario === 'accent' ? PROFILES.map((p, i) => (i === 0 ? { ...p, color_accent: accentColor } : p))
      : scenario === 'cover' ? PROFILES.map((p, i) => (i === 0 ? { ...p, cover_url: COVER } : p)) : PROFILES;
    await page.addInitScript(installTauriMock, { profiles, theme });
    await page.goto(url);
    await page.waitForTimeout(800);
    if (scenario === 'mixed' || scenario === 'accent' || scenario === 'cover') await page.evaluate(s => s.forEach(p => window.__emit('process_status_changed', p)), STATUSES);
    if (scenario === 'launching') { await page.getByRole('button', { name: /run sequence/i }).click(); await page.waitForTimeout(1500); }
    if (view === 'list') await page.getByLabel('List view').click();
    if (view === 'settings') await page.getByLabel('Settings').first().click();
    if (view === 'add' || view === 'installed' || view === 'sgdb') await page.getByText('Add app').first().click();
    if (view === 'installed') await page.getByRole('button', { name: /installed/i }).click();
    if (view === 'sgdb') await page.getByRole('button', { name: /steamgriddb/i }).click();
    if (view === 'profile') await page.getByLabel('New profile').click();
    if (view === 'confirm') await page.getByLabel('Delete profile').click({ force: true });
    if (view === 'palette' || view === 'palette-search') { await page.keyboard.press('Control+k'); if (view === 'palette-search') await page.keyboard.type('rac'); await page.waitForTimeout(300); }
    if (view === 'hover') await page.locator('.hero__name').hover();
    if (tabs) for (let i = 0; i < tabs; i++) await page.keyboard.press('Tab');
    await page.waitForTimeout(400);
    const file = join(out, `${theme}-${w}x${h}-${view}${scenario !== 'mixed' ? '-' + scenario : ''}${tabs ? '-tab' + tabs : ''}.png`);
    await page.screenshot({ path: file });
    console.log(file);
    await page.close();
  }
} finally {
  await browser.close();
  server?.stop();
}
