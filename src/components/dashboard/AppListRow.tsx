import type { CSSProperties } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { AppControls } from './AppControls';
import { appColor } from '../../lib/appColor';
import { exeName } from '../../lib/appArt';
import { statusLabel, type ProcessInfo } from '../../hooks/useProcessStatus';
import type { AppEntry } from '../../types';

interface AppListRowProps {
  app: AppEntry;
  status: ProcessInfo;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onOpenPath: () => void;
  onEdit: (app: AppEntry) => void;
  onRemove: (id: string) => void;
  /** list navigation (optional: the dev-only DesignReference page renders rows without it) */
  index?: number;
  tabIndex?: number;
  ref?: React.Ref<HTMLDivElement>;
  onFocusRow?: () => void;
}

const mono = { fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' } as const;

/** List view row: status bar in the app colour, letter/icon, name + executable, status text, controls. */
export function AppListRow({ ref, index, tabIndex, onFocusRow, ...p }: AppListRowProps) {
  const { app, status } = p;
  const running = status.status === 'running';
  const crashed = status.status === 'crashed';
  const color = appColor(app.order);
  const letter = (app.name.match(/[\p{L}\p{N}]/u)?.[0] ?? '·').toUpperCase();
  const bar = running ? color : crashed ? 'var(--color-status-crit)' : 'var(--color-border-divider)';

  return (
    <div
      ref={ref}
      role="listitem"
      tabIndex={tabIndex}
      data-index={index}
      aria-label={`${app.name}, ${statusLabel(status.status)}`}
      onFocus={e => { onFocusRow?.(); e.currentTarget.scrollIntoView({ block: 'nearest' }); }}
      className="lrow"
      style={{ '--lrow-bar': bar, ...(crashed ? { borderColor: 'var(--color-status-crit)' } : {}) } as CSSProperties}
    >
      <span className="lrow__step" aria-hidden="true" style={{ ...mono, width: 22, color: 'var(--color-text-muted)' }}>{String(app.order + 1).padStart(2, '0')}</span>

      {app.icon_cache_path ? (
        <img src={convertFileSrc(app.icon_cache_path)} alt="" style={{ width: 34, height: 34, objectFit: 'contain', flex: 'none' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
      ) : (
        <div aria-hidden="true" style={{
          width: 34, height: 34, flex: 'none', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-letter)', fontSize: 20,
          border: `1px solid ${running ? color : 'var(--color-border-control)'}`, color: running ? color : 'var(--color-text-muted)',
          background: running ? `color-mix(in srgb, ${color} 14%, transparent)` : 'transparent',
        }}>{letter}</div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="lrow__name" title={app.name} style={{ color: status.status === 'stopped' ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>{app.name}</div>
        <div style={{ ...mono, fontSize: 10, color: crashed ? 'var(--color-error-text)' : 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={crashed ? status.error_message : undefined}>
          {crashed && status.error_message ? status.error_message : exeName(app)}
        </div>
      </div>

      <div className="lrow__status flex items-center" style={{ ...mono, gap: 8, width: 112, flex: 'none', color: crashed ? 'var(--color-error-text)' : running ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', display: 'inline-block', flex: 'none',
          background: running ? 'var(--color-status-live)' : crashed ? 'var(--color-status-crit)' : 'var(--color-border-default)',
          boxShadow: running ? '0 0 6px var(--color-status-live)' : 'none',
          animation: crashed ? 'pulse-crit 1s infinite' : undefined,
        }} />
        {statusLabel(status.status)}
      </div>

      <div className="lrow__controls"><AppControls {...p} /></div>
    </div>
  );
}
