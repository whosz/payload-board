// Hi-res app screenshots for the website (mocked backend). Usage: node scripts/visual-qa/site-shots.mjs <outDir>
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { findBrowser, startDevServer } from './lib.mjs';
import { installTauriMock, PROFILES, STATUSES } from './tauri-mock.js';

const out = process.argv[2] ?? 'site-shots';
mkdirSync(out, { recursive: true });
const server = await startDevServer();
const browser = await chromium.launch({ executablePath: findBrowser(), args: ['--no-sandbox'] });
const shots = [
  { name: 'hero-dark', theme: 'dark', size: [1440, 900] },
  { name: 'palette', theme: 'dark', size: [1440, 900], run: async p => { await p.keyboard.press('Control+k'); await p.keyboard.type('rac'); } },
  { name: 'shortcuts', theme: 'dark', size: [1100, 800], run: async p => { await p.locator('header .tile-btn').nth(2).click(); await p.getByRole('tab').nth(2).click(); } },
  { name: 'list-light', theme: 'light', size: [1440, 900], run: async p => { await p.locator('button[aria-pressed]').nth(1).click(); } },
  { name: 'grid-grey', theme: 'grey', size: [1440, 900] },
  { name: 'mini', theme: 'dark', size: [420, 760] },
];
try {
  for (const s of shots) {
    const page = await browser.newPage({ viewport: { width: s.size[0], height: s.size[1] }, deviceScaleFactor: 2 });
    await page.addInitScript(installTauriMock, { profiles: PROFILES, theme: s.theme, lang: '' });
    await page.goto(server.url);
    await page.waitForTimeout(900);
    await page.evaluate(st => st.forEach(p => window.__emit('process_status_changed', p)), STATUSES);
    if (s.run) await s.run(page);
    await page.waitForTimeout(600);
    await page.screenshot({ path: join(out, s.name + '.png') });
    console.log(s.name);
    await page.close();
  }
} finally { await browser.close(); server.stop(); }
