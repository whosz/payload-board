import { t } from '../i18n';

// Accelerators use Tauri's format with KeyboardEvent.code key names, e.g. "CommandOrControl+Alt+KeyR".
export type ShortcutAction =
  | 'palette_global' | 'run_sequence' | 'end_session'
  | 'palette' | 'add_app' | 'new_profile' | 'settings';

export interface ShortcutEntry {
  action: ShortcutAction;
  accelerator: string | null;
  default: string;
  scope: 'global' | 'window';
  /** registration problem for global shortcuts */
  error: string | null;
}
export interface ShortcutsState { entries: ShortcutEntry[]; global_enabled: boolean }
export type ShortcutError = { kind: 'invalid' } | { kind: 'conflict'; with: ShortcutAction } | { kind: 'taken' };

export const actionLabel = (a: ShortcutAction): string => ({
  palette_global: t('Command palette (anywhere)'),
  run_sequence: t('Run sequence'),
  end_session: t('End session'),
  palette: t('Command palette (in window)'),
  add_app: t('Add app'),
  new_profile: t('New profile'),
  settings: t('Open settings'),
})[a];

const MODIFIER_CODES = /^(Control|Shift|Alt|Meta|OS)(Left|Right)$/;
const KEY_LABEL: Record<string, string> = {
  Space: 'Space', Comma: ',', Period: '.', Slash: '/', Backslash: '\\', Semicolon: ';', Quote: "'",
  BracketLeft: '[', BracketRight: ']', Minus: '-', Equal: '=', Backquote: '`',
  ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Escape: 'Esc',
};

/** Builds an accelerator from a key press, or null for a bare modifier. */
export function acceleratorFromEvent(e: KeyboardEvent): string | null {
  if (MODIFIER_CODES.test(e.code) || !e.code) return null;
  const mods = [];
  if (e.ctrlKey || e.metaKey) mods.push('CommandOrControl');
  if (e.altKey) mods.push('Alt');
  if (e.shiftKey) mods.push('Shift');
  return [...mods, e.code].join('+');
}

/** True if the key press is exactly this accelerator. */
export function matches(accelerator: string, e: KeyboardEvent): boolean {
  const parts = accelerator.split('+');
  const key = parts[parts.length - 1];
  const mods = new Set(parts.slice(0, -1));
  return e.code === key
    && (e.ctrlKey || e.metaKey) === mods.has('CommandOrControl')
    && e.altKey === mods.has('Alt')
    && e.shiftKey === mods.has('Shift');
}

/** Human-readable key caps, e.g. ["Ctrl", "Alt", "R"]. */
export function formatAccelerator(accelerator: string): string[] {
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);
  return accelerator.split('+').map(p => {
    if (p === 'CommandOrControl') return isMac ? '⌘' : 'Ctrl';
    if (p === 'Alt') return isMac ? '⌥' : 'Alt';
    return KEY_LABEL[p] ?? p.replace(/^Key|^Digit/, '');
  });
}

export function describeError(err: unknown): string {
  const e = err as Partial<ShortcutError> | undefined;
  if (e?.kind === 'conflict') return t('Already used by “{action}”', { action: actionLabel((e as { with: ShortcutAction }).with) });
  if (e?.kind === 'taken') return t('Another application already uses this shortcut');
  if (e?.kind === 'invalid') return t('Not a valid shortcut (global ones need Ctrl, Alt or Shift)');
  return t('Could not save the shortcut');
}
