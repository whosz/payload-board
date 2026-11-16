import { appColor } from './appColor';
import { statusLabel as processStatusLabel, type ProcessInfo } from '../hooks/useProcessStatus';
import { t } from '../i18n';
import type { AppEntry, Profile } from '../types';

export type PaletteGroup = 'Actions' | 'Apps' | 'Profiles';
export const GROUP_ORDER: PaletteGroup[] = ['Actions', 'Apps', 'Profiles'];

export interface PaletteItem {
  id: string;
  group: PaletteGroup;
  title: string;
  subtitle?: string;
  keywords?: string;
  /** right-hand hint, e.g. "↵ start" */
  hint?: string;
  /** apps only */
  app?: AppEntry;
  status?: ProcessInfo['status'];
  color?: string;
  disabled?: boolean;
  description?: string;
  run: () => void;
}

export interface PaletteAppHandlers {
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onOpenPath: () => void;
  onEdit: (app: AppEntry) => void;
}

export interface PaletteContext {
  profiles: Profile[];
  activeProfile?: Profile;
  getStatus: (id: string) => ProcessInfo;
  launching: boolean;
  anyRunning: boolean;
  runSequence: () => void;
  cancelSequence: () => void;
  endSession: () => void;
  addApp: () => void;
  newProfile: () => void;
  openSettings: () => void;
  switchProfile: (id: string) => void;
  appHandlers: (app: AppEntry) => PaletteAppHandlers;
}

/** Everything the palette can do right now, in display order. */
export function buildPaletteItems(c: PaletteContext): PaletteItem[] {
  const apps = [...(c.activeProfile?.apps ?? [])].sort((a, b) => a.order - b.order);
  const items: PaletteItem[] = [
    c.launching
      ? { id: 'cancel', group: 'Actions', title: t('Cancel sequence'), description: t('Stop launching the remaining apps.'), run: c.cancelSequence }
      : { id: 'run', group: 'Actions', title: t('Run sequence'), subtitle: t('Start {count} apps in order', { count: apps.filter(a => a.enabled).length }), keywords: t('start launch run'), disabled: apps.length === 0 || c.anyRunning, description: t('Start every enabled app of this profile in launch order.'), run: c.runSequence },
    { id: 'end', group: 'Actions', title: t('End session'), subtitle: t('Stop everything in this profile'), keywords: t('stop kill close end'), disabled: !c.anyRunning, description: t('Gracefully close all running apps of this profile.'), run: c.endSession },
    { id: 'add', group: 'Actions', title: t('Add app…'), subtitle: c.activeProfile ? t('New entry in {name}', { name: c.activeProfile.name }) : undefined, disabled: !c.activeProfile, description: t('Add an application to the active profile.'), run: c.addApp },
    { id: 'new-profile', group: 'Actions', title: t('New profile…'), description: t('Create another set of apps.'), run: c.newProfile },
    { id: 'settings', group: 'Actions', title: t('Settings'), keywords: t('theme options storage language'), description: t('Theme, language, shortcuts, tray, SteamGridDB key, storage.'), run: c.openSettings },
  ];

  for (const app of apps) {
    const status = c.getStatus(app.id).status;
    items.push({
      id: `app:${app.id}`, group: 'Apps', title: app.name, subtitle: app.executable_path.split(/[\\/]/).pop(),
      keywords: app.executable_path, app, status, color: appColor(app.order),
      hint: status === 'running' ? t('↵ stop') : t('↵ start'),
      run: status === 'running' ? c.appHandlers(app).onStop : c.appHandlers(app).onStart,
    });
  }
  for (const p of c.profiles.filter(p => p.id !== c.activeProfile?.id)) {
    items.push({ id: `profile:${p.id}`, group: 'Profiles', title: t('Switch to {name}', { name: p.name }), subtitle: t('{count} apps', { count: p.apps.length }), keywords: p.name, description: t('Make this the active profile.'), run: () => c.switchProfile(p.id) });
  }
  return items;
}

/** 0 = no match. Prefix > substring > in-order subsequence. */
export function score(query: string, text: string): number {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (!q) return 1;
  if (t.startsWith(q)) return 100 - Math.min(t.length, 50) * 0.1;
  const at = t.indexOf(q);
  if (at >= 0) return 80 - Math.min(at, 40);
  let i = 0;
  let gaps = 0;
  for (const ch of t) {
    if (ch === q[i]) i++;
    else if (i > 0) gaps++;
    if (i === q.length) return Math.max(5, 40 - gaps);
  }
  return 0;
}

/** Matching items; groups ordered by their best match (default order when the query is empty). */
export function filterItems(items: PaletteItem[], query: string): PaletteItem[] {
  const scored = items
    .map(item => ({
      item,
      s: Math.max(score(query, item.title), score(query, item.keywords ?? '') * 0.9, score(query, item.subtitle ?? '') * 0.6),
    }))
    .filter(x => x.s > 0);
  const best = new Map<PaletteGroup, number>();
  for (const x of scored) best.set(x.item.group, Math.max(best.get(x.item.group) ?? 0, x.s));
  return scored
    .sort((a, b) =>
      (best.get(b.item.group)! - best.get(a.item.group)!) ||
      GROUP_ORDER.indexOf(a.item.group) - GROUP_ORDER.indexOf(b.item.group) ||
      b.s - a.s)
    .map(x => x.item);
}

/** Index of the first item that can actually run (0 when none). */
export const firstEnabled = (items: PaletteItem[]) => Math.max(0, items.findIndex(i => !i.disabled));

export const statusLabel = (s?: ProcessInfo['status']) => (s ? processStatusLabel(s) : '');
