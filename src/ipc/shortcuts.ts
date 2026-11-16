import { invoke } from '@tauri-apps/api/core';
import type { ShortcutAction, ShortcutsState } from '../lib/shortcuts';

export const getShortcuts = () => invoke<ShortcutsState>('get_shortcuts');
/** Rejects with a ShortcutError ({kind: 'invalid' | 'conflict' | 'taken'}). */
export const setShortcut = (action: ShortcutAction, accelerator: string | null) =>
  invoke<ShortcutsState>('set_shortcut', { action, accelerator });
export const resetShortcut = (action: ShortcutAction) => invoke<ShortcutsState>('reset_shortcut', { action });
export const setGlobalShortcutsEnabled = (enabled: boolean) =>
  invoke<ShortcutsState>('set_global_shortcuts_enabled', { enabled });
export const suspendGlobalShortcuts = (suspended: boolean) => invoke<void>('suspend_global_shortcuts', { suspended });
export const setActiveProfile = (profileId: string | null) => invoke<void>('set_active_profile', { profileId });
