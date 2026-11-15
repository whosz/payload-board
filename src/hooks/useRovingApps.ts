import { useRef, useState } from 'react';
import type { AppEntry } from '../types';
import type { ProcessInfo } from './useProcessStatus';

export interface AppHandlers {
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onOpenPath: () => void;
  onEdit: (app: AppEntry) => void;
  onRemove: (id: string) => void;
}

interface Options {
  apps: AppEntry[];
  getStatus: (id: string) => ProcessInfo;
  makeHandlers: (app: AppEntry) => AppHandlers;
  axis: 'horizontal' | 'vertical';
  /** class of the focusable item elements (keys inside their inner buttons keep default behaviour) */
  itemClass: string;
}

/**
 * Roving focus over a list/strip of apps: arrows (by axis) + Home/End move, Enter/Space start-stop,
 * E edit, R restart, Del remove. Spread `onKeyDown` on the container; use `items`, `tabIndexFor`, `onFocusItem` per item.
 */
export function useRovingApps({ apps, getStatus, makeHandlers, axis, itemClass }: Options) {
  const [focusIdx, setFocusIdx] = useState(0);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const focus = (i: number) => items.current[Math.max(0, Math.min(apps.length - 1, i))]?.focus();
  const [next, prev] = axis === 'horizontal' ? ['arrowright', 'arrowleft'] : ['arrowdown', 'arrowup'];

  const onKeyDown = (e: React.KeyboardEvent) => {
    const el = e.target as HTMLElement;
    if (!el.classList.contains(itemClass)) return;
    const i = Number(el.dataset.index);
    const app = apps[i];
    if (!app) return;
    const h = makeHandlers(app);
    const running = getStatus(app.id).status === 'running';
    const key = e.key.toLowerCase();
    if (key === next) focus(i + 1);
    else if (key === prev) focus(i - 1);
    else if (key === 'home') focus(0);
    else if (key === 'end') focus(apps.length - 1);
    else if (key === 'enter' || key === ' ') (running ? h.onStop : h.onStart)();
    else if (key === 'e') h.onEdit(app);
    else if (key === 'r') h.onRestart();
    else if (key === 'delete') h.onRemove(app.id);
    else return;
    e.preventDefault();
  };

  return {
    items,
    onKeyDown,
    tabIndexFor: (i: number) => (i === Math.min(focusIdx, apps.length - 1) ? 0 : -1),
    onFocusItem: (i: number) => setFocusIdx(i),
  };
}
