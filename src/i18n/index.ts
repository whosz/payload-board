// Tiny i18n: the English text IS the key. `t('Run sequence')` returns the translation for the current
// language, or the English text when no entry exists. `{name}` placeholders are filled from `params`.
// Plural entries are objects ({ one, few, many, other }) and are selected with `params.count`.
import { cloneElement, isValidElement, useSyncExternalStore, type ReactNode } from 'react';
import { de } from './de';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { pl } from './pl';

export type Lang = 'en' | 'pl' | 'de' | 'es' | 'fr';
export type Entry = string | Partial<Record<Intl.LDMLPluralRule, string>>;
export type Dict = Record<string, Entry>;

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'pl', label: 'Polski' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
];

const DICTS: Record<Lang, Dict> = { en, pl, de, es, fr };
const STORAGE_KEY = 'language';

function detect(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in DICTS) return saved as Lang;
    const browser = navigator.language.slice(0, 2).toLowerCase();
    if (browser in DICTS) return browser as Lang;
  } catch { /* no storage: fall through */ }
  return 'en';
}

let current: Lang = detect();
const listeners = new Set<() => void>();
if (typeof document !== 'undefined') document.documentElement.lang = current;

export function getLanguage(): Lang { return current; }

export function setLanguage(lang: Lang) {
  current = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  listeners.forEach(f => f());
}

/** Subscribes the calling component to language changes (call once near the root). */
export function useLanguage(): Lang {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb); }; }, () => current);
}

function pick(text: string, count: number): string {
  const entry = DICTS[current][text];
  if (entry === undefined) return text;
  if (typeof entry === 'string') return entry;
  const rule = new Intl.PluralRules(current).select(count);
  return entry[rule] ?? entry.other ?? text;
}

export function t(text: string, params?: Record<string, string | number>): string {
  const s = pick(text, Number(params?.count ?? 0));
  return params ? s.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`)) : s;
}

/** Like `t`, but placeholders may be React nodes (e.g. a <strong> name). */
export function tx(text: string, params: Record<string, ReactNode>): ReactNode[] {
  const s = pick(text, Number(params.count ?? 0));
  return s.split(/(\{\w+\})/g).filter(Boolean).map((part, i) => {
    const m = part.match(/^\{(\w+)\}$/);
    const v = m ? params[m[1]] : part;
    return isValidElement(v) ? cloneElement(v, { key: i }) : (v as string);
  });
}
