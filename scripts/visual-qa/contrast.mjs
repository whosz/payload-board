// WCAG contrast check of the design tokens in src/globals.css (all themes). Usage: npm run qa:contrast
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../../src/globals.css', import.meta.url), 'utf8');
const decls = block => Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map(m => [m[1], m[2]]));
const rootStart = css.indexOf(':root {');
const base = { ...decls(css.slice(css.indexOf('@theme inline'), rootStart)), ...decls(css.slice(rootStart, css.indexOf('}', rootStart))) };
const themes = { dark: base };
for (const m of css.matchAll(/\[data-theme="(\w+)"\]\s*\{([^}]*)\}/g)) themes[m[1]] = { ...base, ...decls(m[2]) };

const lum = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [foreground token, background token, minimum]  — 4.5 for text, 3 for UI/large
const pairs = [
  ['color-text-primary', 'color-bg-surface', 4.5], ['color-text-secondary', 'color-bg-surface', 4.5],
  ['color-text-muted', 'color-bg-surface', 4.5], ['color-text-muted', 'color-bg-desk', 4.5],
  ['color-text-muted', 'color-bg-elevated', 4.5], ['color-accent-fg', 'color-accent', 4.5],
  ['color-accent', 'color-bg-surface', 4.5], ['color-status-live', 'color-bg-surface', 4.5],
  ['color-status-crit', 'color-bg-surface', 4.5], ['color-error-text', 'color-bg-surface', 4.5],
  ['color-border-control', 'color-bg-surface', 3], ['color-border-control', 'color-bg-base', 3],
];
let fails = 0;
for (const [name, t] of Object.entries(themes)) {
  console.log(`\n${name}`);
  for (const [fg, bg, min] of pairs) {
    if (!t[fg] || !t[bg]) { console.log(`  ${fg} / ${bg}: skipped (not a plain hex)`); continue; }
    const r = ratio(t[fg], t[bg]); const ok = r >= min; if (!ok) fails++;
    console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${r.toFixed(2).padStart(5)} (min ${min})  ${fg} / ${bg}`);
  }
}
process.exit(fails ? 1 : 0);
