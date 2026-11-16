import { useCallback, useEffect, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import * as ipc from '../ipc/shortcuts';
import { describeError, matches, type ShortcutAction, type ShortcutsState } from '../lib/shortcuts';
import { t } from '../i18n';

export interface ShortcutsApi {
  state: ShortcutsState | null;
  /** resolves to an error message, or null on success */
  set: (action: ShortcutAction, accelerator: string | null) => Promise<string | null>;
  reset: (action: ShortcutAction) => Promise<void>;
  setGlobalEnabled: (enabled: boolean) => Promise<void>;
  /** pause OS-level shortcuts + in-window handling while a new key combination is recorded */
  setRecording: (recording: boolean) => void;
}

type Handlers = Partial<Record<ShortcutAction, () => void>>;

/**
 * Loads the shortcut table and runs in-window handlers. Global shortcuts are handled in Rust;
 * they only fall back to the window when OS registration is off or failed.
 */
export function useShortcuts(
  handlers: Handlers,
  onFeedback: (message: string, kind: 'info' | 'warn' | 'error') => void,
): ShortcutsApi {
  const [state, setState] = useState<ShortcutsState | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const feedbackRef = useRef(onFeedback);
  feedbackRef.current = onFeedback;
  const stateRef = useRef(state);
  stateRef.current = state;
  const recording = useRef(false);
  const lastEnd = useRef(0);

  useEffect(() => { ipc.getShortcuts().then(setState).catch(() => {}); }, []);

  useEffect(() => {
    const triggered = listen<{ action: string }>('shortcut_triggered', ({ payload }) => {
      if (payload.action === 'palette') handlersRef.current.palette_global?.();
    });
    const feedback = listen<{ message: string; kind: 'info' | 'warn' | 'error' }>('shortcut_feedback', ({ payload }) => {
      feedbackRef.current(payload.message, payload.kind);
    });
    return () => { triggered.then(f => f()); feedback.then(f => f()); };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const st = stateRef.current;
      if (!st || recording.current || e.repeat) return;
      for (const entry of st.entries) {
        if (!entry.accelerator || !matches(entry.accelerator, e)) continue;
        // global shortcuts are already handled by the OS hook unless it is off/failed
        if (entry.scope === 'global' && st.global_enabled && !entry.error) continue;
        const run = handlersRef.current[entry.action];
        if (!run) continue;
        e.preventDefault();
        if (entry.action === 'end_session') {
          const now = Date.now();
          if (now - lastEnd.current > 2000) { lastEnd.current = now; feedbackRef.current(t('Press again within 2 s to end the session'), 'warn'); return; }
          lastEnd.current = 0;
        }
        run();
        return;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const set = useCallback(async (action: ShortcutAction, accelerator: string | null) => {
    try { setState(await ipc.setShortcut(action, accelerator)); return null; }
    catch (e) { return describeError(e); }
  }, []);
  const reset = useCallback(async (action: ShortcutAction) => { setState(await ipc.resetShortcut(action)); }, []);
  const setGlobalEnabled = useCallback(async (enabled: boolean) => { setState(await ipc.setGlobalShortcutsEnabled(enabled)); }, []);
  const setRecording = useCallback((r: boolean) => {
    recording.current = r;
    ipc.suspendGlobalShortcuts(r).catch(() => {});
  }, []);

  return { state, set, reset, setGlobalEnabled, setRecording };
}
