import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import type { ShortcutsApi } from '../../hooks/useShortcuts';
import { actionLabel, acceleratorFromEvent, formatAccelerator, type ShortcutAction } from '../../lib/shortcuts';
import { t } from '../../i18n';

const mono = { fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' } as const;

function Keys({ accelerator }: { accelerator: string | null }) {
  if (!accelerator) return <span style={{ ...mono, color: 'var(--color-text-muted)' }}>{t('Not set')}</span>;
  return (
    <span className="flex items-center" style={{ gap: 4 }}>
      {formatAccelerator(accelerator).map((k, i) => (
        <kbd key={i} style={{ ...mono, padding: '3px 7px', border: '1px solid var(--color-border-control)', background: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}>{k}</kbd>
      ))}
    </span>
  );
}

/** Settings → Shortcuts: master switch for global ones, then one row per action with press-to-record. */
export function ShortcutsSection({ api }: { api: ShortcutsApi }) {
  const { state } = api;
  const [recording, setRecording] = useState<ShortcutAction | null>(null);
  const [error, setError] = useState<{ action: ShortcutAction; message: string } | null>(null);

  useEffect(() => {
    if (!recording) return;
    api.setRecording(true);
    const onKey = async (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') { setRecording(null); return; }
      const acc = acceleratorFromEvent(e);
      if (!acc) return; // bare modifier: keep waiting
      const message = await api.set(recording, acc);
      setError(message ? { action: recording, message } : null);
      setRecording(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => { window.removeEventListener('keydown', onKey, true); api.setRecording(false); };
  }, [recording]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state) return <div style={{ ...mono, color: 'var(--color-text-muted)' }}>{t('Loading…')}</div>;

  return (
    <div className="flex flex-col" style={{ gap: 12 }}>
      <div className="flex items-center justify-between" style={{ gap: 12 }}>
        <div>
          <div style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>{t('Enable global shortcuts')}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{t('Work from any app, even when this window is hidden. Turn off if they clash with your games.')}</div>
        </div>
        <Switch checked={state.global_enabled} onCheckedChange={v => api.setGlobalEnabled(v)} aria-label={t('Enable global shortcuts')} />
      </div>

      {state.entries.map(entry => {
        const isRecording = recording === entry.action;
        const globalOff = entry.scope === 'global' && !state.global_enabled;
        const problem = error?.action === entry.action ? error.message : entry.error && !globalOff ? entry.error : null;
        return (
          <div key={entry.action} style={{ borderTop: '1px solid var(--color-border-divider)', paddingTop: 10, opacity: globalOff ? 0.5 : 1 }}>
            <div className="flex items-center flex-wrap" style={{ gap: '6px 12px' }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>{actionLabel(entry.action)}</span>{' '}
                <span style={{ ...mono, fontSize: 10, color: entry.scope === 'global' ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>{entry.scope === 'global' ? t('global') : t('window')}</span>
              </div>
              {isRecording
                ? <span style={{ ...mono, color: 'var(--color-accent)' }} aria-live="polite">{t('Press keys… (Esc to cancel)')}</span>
                : <Keys accelerator={entry.accelerator} />}
              <div className="flex items-center" style={{ gap: 4 }}>
                <Button variant="outline" size="sm" onClick={() => { setError(null); setRecording(isRecording ? null : entry.action); }} aria-label={t('Change shortcut for {action}', { action: actionLabel(entry.action) })}>
                  {isRecording ? t('Cancel') : t('Change')}
                </Button>
                <Button variant="ghost" size="sm" disabled={entry.accelerator === entry.default} onClick={() => { setError(null); api.reset(entry.action); }} aria-label={t('Reset shortcut for {action}', { action: actionLabel(entry.action) })}>{t('Reset')}</Button>
                <Button variant="ghost" size="sm" disabled={!entry.accelerator} onClick={() => { setError(null); api.set(entry.action, null); }} aria-label={t('Clear shortcut for {action}', { action: actionLabel(entry.action) })}>{t('Clear')}</Button>
              </div>
            </div>
            {problem && <div role="alert" style={{ marginTop: 6, fontSize: 13, color: 'var(--color-error-text)' }}>{problem}</div>}
          </div>
        );
      })}
    </div>
  );
}
