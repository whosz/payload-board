// Behaviour/a11y checks that run against the mocked UI (no Rust): command palette and shortcut settings.
// Usage: npm run qa:flows [-- --url http://localhost:1420]   (exit code 1 if any check fails)
import { chromium } from 'playwright-core';
import { findBrowser, startDevServer } from './lib.mjs';
import { installTauriMock, PROFILES } from './tauri-mock.js';

const i = process.argv.indexOf('--url');
const exe = findBrowser();
if (!exe) { console.error('No Chromium found. Run `npx playwright install chromium` or set CHROMIUM_PATH.'); process.exit(1); }
const server = i > 0 ? null : await startDevServer();
const url = i > 0 ? process.argv[i + 1] : server.url;

let failures = 0;
const ok = (name, cond) => { if (!cond) failures++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`); };

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', e => { if (!/unregisterListener/.test(e.message)) { failures++; console.log('FAIL  page error: ' + e.message); } });
  await page.addInitScript(installTauriMock, { profiles: PROFILES, theme: 'dark' });
  await page.goto(url);
  await page.waitForTimeout(800);
  const count = sel => page.locator(sel).count();

  // ── command palette ──
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(250);
  ok('palette: opens with Ctrl+K', await page.getByRole('combobox').isVisible());
  ok('palette: input is focused', await page.evaluate(() => document.activeElement?.getAttribute('role') === 'combobox'));
  const selected = () => page.evaluate(() => document.querySelector('[role=option][aria-selected=true]')?.textContent || '');
  const first = await selected();
  await page.keyboard.press('ArrowDown');
  ok('palette: ArrowDown moves the selection', first !== (await selected()));
  ok('palette: aria-activedescendant points at the selected option', await page.evaluate(() => {
    const c = document.querySelector('[role=combobox]');
    return document.getElementById(c.getAttribute('aria-activedescendant'))?.getAttribute('aria-selected') === 'true';
  }));
  ok('palette: options are grouped in a listbox', (await count('[role=listbox] [role=group] [role=option]')) > 5);
  await page.keyboard.type('zzzz');
  ok('palette: empty state', (await page.getByText('No results').count()) === 1);
  await page.keyboard.press('Control+a');
  await page.keyboard.type('settings');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  ok('palette: Enter runs the action and closes', (await page.getByRole('combobox').count()) === 0 && (await page.getByText('Appearance').count()) > 0);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+k');
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(250);
  ok('palette: Ctrl+K toggles it closed', (await page.getByRole('combobox').count()) === 0);

  // ── shortcut settings ──
  await page.keyboard.press('Control+Comma');
  await page.waitForTimeout(350);
  ok('settings: Ctrl+, opens Settings with tabs', (await page.getByRole('tab').count()) === 5);
  await page.getByRole('tab', { name: 'Shortcuts' }).click();
  ok('settings: Shortcuts tab shows the shortcut list', (await page.getByText('Enable global shortcuts').count()) > 0);
  await page.getByLabel('Change shortcut for Add app').click();
  ok('shortcuts: recording prompt shown', (await page.getByText('Press keys').count()) > 0);
  await page.keyboard.press('Control+Shift+KeyJ');
  await page.waitForTimeout(300);
  ok('shortcuts: new combination is shown', (await page.locator('kbd', { hasText: 'J' }).count()) > 0);
  await page.getByLabel('Change shortcut for Add app').click();
  await page.keyboard.press('Control+KeyK');
  await page.waitForTimeout(300);
  ok('shortcuts: conflict is reported', (await page.getByText('Already used by').count()) > 0);
  await page.getByLabel('Change shortcut for Run sequence').click();
  await page.keyboard.press('KeyZ');
  await page.waitForTimeout(300);
  ok('shortcuts: global shortcut needs a modifier', (await page.getByText('global ones need').count()) > 0);
  await page.getByLabel('Change shortcut for End session').click();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  ok('shortcuts: Esc cancels recording, Settings stays open', (await page.getByText('Press keys').count()) === 0 && (await page.getByText('Enable global shortcuts').count()) > 0);
  await page.getByLabel('Reset shortcut for Add app').click();
  await page.waitForTimeout(200);
  ok('shortcuts: Reset restores the default', (await page.locator('kbd', { hasText: /^N$/ }).count()) > 0);
  await page.getByLabel('Clear shortcut for Open settings').click();
  await page.waitForTimeout(200);
  ok('shortcuts: Clear shows "Not set"', (await page.getByText('Not set').count()) === 1);
  const sw = page.getByRole('switch', { name: 'Enable global shortcuts' });
  await sw.click();
  ok('shortcuts: master switch has an accessible name and toggles', (await sw.getAttribute('aria-checked')) === 'false');
} finally {
  await browser.close();
  server?.stop();
}
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
