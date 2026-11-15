// Shared helpers for the visual-QA scripts: find a Chromium, start/stop the Vite dev server.
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function findBrowser() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = join(homedir(), '.cache', 'ms-playwright');
  if (!existsSync(base)) return null;
  for (const d of readdirSync(base).filter(x => x.startsWith('chromium_headless_shell')).sort().reverse()) {
    const p = join(base, d, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
    if (existsSync(p)) return p;
  }
  return null;
}

export async function waitFor(u) {
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(u)).ok) return; } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('dev server did not start: ' + u);
}


/** Starts Vite on :1420 (directly, so kill() really stops it). Returns { url, stop }. */
export async function startDevServer() {
  const url = 'http://localhost:1420';
  const vite = fileURLToPath(new URL('../../node_modules/vite/bin/vite.js', import.meta.url));
  const server = spawn(process.execPath, [vite, '--port', '1420', '--strictPort'], { stdio: 'ignore' });
  await waitFor(url);
  return { url, stop: () => server.kill() };
}
