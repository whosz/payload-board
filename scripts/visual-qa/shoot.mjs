// Headless visual QA with a mocked Tauri backend (no Rust needed).
// Usage: npm run qa:shots -- --out docs/assets/qa --themes dark,grey,light --sizes 1280x800,900x600 --views grid,list,settings,add [--scenario mixed|idle|launching] [--tab 12] [--url http://localhost:1420]
// Browser: set CHROMIUM_PATH, or it uses the newest Playwright headless shell in ~/.cache/ms-playwright.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installTauriMock, PROFILES, STATUSES } from './tauri-mock.js';

const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : def; };
const out = arg('out', 'docs/assets/qa');
const themes = arg('themes', 'dark,grey,light').split(',');
const sizes = arg('sizes', '1280x800').split(',').map(s => s.split('x').map(Number));
const views = arg('views', 'grid').split(',');
const tabs = Number(arg('tab', 0));
// mixed = 3 live + 1 crashed (default) | idle = nothing running | launching = idle, then click Run sequence
const scenario = arg('scenario', 'mixed');
let url = arg('url', '');

function findBrowser() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = join(homedir(), '.cache', 'ms-playwright');
  if (!existsSync(base)) return null;
  for (const d of readdirSync(base).filter(x => x.startsWith('chromium_headless_shell')).sort().reverse()) {
    const p = join(base, d, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
    if (existsSync(p)) return p;
  }
  return null;
}

async function waitFor(u) {
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(u)).ok) return; } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('dev server did not start: ' + u);
}

const exe = findBrowser();
if (!exe) { console.error('No Chromium found. Run `npx playwright install chromium` or set CHROMIUM_PATH.'); process.exit(1); }

let server;
if (!url) {
  url = 'http://localhost:1420';
  // run vite directly (not via npx) so server.kill() really stops it
  const vite = fileURLToPath(new URL('../../node_modules/vite/bin/vite.js', import.meta.url));
  server = spawn(process.execPath, [vite, '--port', '1420', '--strictPort'], { stdio: 'ignore' });
  await waitFor(url);
}

mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
try {
  for (const theme of themes) for (const [w, h] of sizes) for (const view of views) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    page.on('pageerror', e => { if (!/unregisterListener/.test(e.message)) console.log('PAGEERROR', e.message); });
    await page.addInitScript(installTauriMock, { profiles: PROFILES, theme });
    await page.goto(url);
    await page.waitForTimeout(800);
    if (scenario === 'mixed') await page.evaluate(s => s.forEach(p => window.__emit('process_status_changed', p)), STATUSES);
    if (scenario === 'launching') { await page.getByRole('button', { name: /run sequence/i }).click(); await page.waitForTimeout(1500); }
    if (view === 'list') await page.getByLabel('List view').click();
    if (view === 'settings') await page.getByLabel('Settings').first().click();
    if (view === 'add') await page.getByText('Add app').first().click();
    if (tabs) for (let i = 0; i < tabs; i++) await page.keyboard.press('Tab');
    await page.waitForTimeout(400);
    const file = join(out, `${theme}-${w}x${h}-${view}${scenario !== 'mixed' ? '-' + scenario : ''}${tabs ? '-tab' + tabs : ''}.png`);
    await page.screenshot({ path: file });
    console.log(file);
    await page.close();
  }
} finally {
  await browser.close();
  server?.kill();
}
