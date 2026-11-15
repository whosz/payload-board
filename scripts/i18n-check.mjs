// Verifies translations: every t('…')/tx('…') key used in src/ exists (non-empty, same {placeholders},
// right plural forms) in each non-English dictionary. Usage: npm run qa:i18n [-- --list]  (exit 1 on problems)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { transform } from 'esbuild'; // ships with vite; strips the TypeScript types from the dictionaries

const root = new URL('..', import.meta.url).pathname;
const src = join(root, 'src');
const SKIP = /(DesignReference|[\\/]i18n[\\/]|ProfileList|StatusBar|AppTile)/; // dev-only page + its old components

function walk(dir) {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|mts)$/.test(f) ? [p] : [];
  });
}

const used = new Map(); // key -> first file
const re = /\btx?\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g;
for (const file of walk(src).filter(f => !SKIP.test(f))) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(re)) {
    const key = (m[1] ?? m[2]).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\n/g, '\n');
    if (!used.has(key)) used.set(key, relative(root, file));
  }
}
if (process.argv.includes('--list')) { console.log([...used.keys()].sort().join('\n')); process.exit(0); }

const LANGS = ['pl', 'de', 'es', 'fr'];
const dicts = {};
for (const l of [...LANGS, 'en']) {
  const { code } = await transform(readFileSync(join(src, 'i18n', `${l}.ts`), 'utf8'), { loader: 'ts', format: 'esm' });
  dicts[l] = (await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64')))[l];
}

const placeholders = s => [...String(s).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');
const forms = lang => { const r = new Intl.PluralRules(lang); return new Set(Array.from({ length: 101 }, (_, n) => r.select(n))); };
let problems = 0;
const bad = msg => { problems++; console.log('FAIL  ' + msg); };

for (const [key, file] of used) {
  const isPlural = typeof dicts.en[key] === 'object' || /\{count\}/.test(key);
  for (const lang of LANGS) {
    const v = dicts[lang][key];
    if (v === undefined || v === '') { bad(`[${lang}] missing: "${key}"  (${file})`); continue; }
    if (isPlural) {
      if (typeof v !== 'object') { bad(`[${lang}] "${key}" needs plural forms`); continue; }
      for (const f of forms(lang)) if (!v[f]) bad(`[${lang}] "${key}" lacks plural form "${f}"`);
      if (!v.other) bad(`[${lang}] "${key}" lacks "other"`);
      for (const [f, text] of Object.entries(v)) if (placeholders(text) !== placeholders(key)) bad(`[${lang}] "${key}" (${f}): placeholders differ`);
    } else {
      if (typeof v !== 'string') { bad(`[${lang}] "${key}" must be a string`); continue; }
      if (placeholders(v) !== placeholders(key)) bad(`[${lang}] "${key}": placeholders differ -> "${v}"`);
    }
  }
}
for (const key of Object.keys(dicts.en)) if (/\{count\}/.test(key) && typeof dicts.en[key] !== 'object') bad(`[en] "${key}" must be a plural object`);
for (const lang of [...LANGS, 'en']) for (const key of Object.keys(dicts[lang])) if (!used.has(key)) console.log(`warn  [${lang}] unused key: "${key}"`);
console.log(`\n${used.size} keys × ${LANGS.length} languages checked`);
console.log(problems ? `${problems} problem(s)` : 'all translations complete');
process.exit(problems ? 1 : 0);
