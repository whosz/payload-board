import { useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { AppControls } from './AppControls';
import { TileBackdrop } from './TileBackdrop';
import { appColor } from '../../lib/appColor';
import type { AppEntry } from '../../types';
import { STATUS_LABEL, type ProcessInfo } from '../../hooks/useProcessStatus';

interface AppTileProps {
  app: AppEntry;
  status: ProcessInfo;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onOpenPath: () => void;
  onEdit: (app: AppEntry) => void;
  onRemove: (id: string) => void;
}

const monoLabel = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
} as const;

export function AppTile(props: AppTileProps) {
  const { app, status } = props;
  const [hovered, setHovered] = useState(false);
  const isRunning = status.status === 'running';
  const isCrashed = status.status === 'crashed';
  const color = appColor(app.order);
  const ledColor = isRunning ? 'var(--color-status-live)' : isCrashed ? 'var(--color-status-crit)' : 'var(--color-border-default)';

  const bgSrc = app.background_url
    ? (app.background_url.startsWith('http') ? app.background_url : convertFileSrc(app.background_url))
    : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: 260,
        height: 196,
        borderRadius: 2,
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg-surface)',
        border: `1px solid ${isCrashed ? 'var(--color-status-crit)' : hovered ? 'var(--color-text-muted)' : 'var(--color-border-divider)'}`,
        transition: 'border-color 0.15s ease',
      }}
    >
      {/* ── Backdrop: artwork if set, otherwise a track outline in the app's colour ── */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        {bgSrc ? (
          <img
            src={bgSrc}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: hovered ? 1 : 0.6, transition: 'opacity 0.15s ease' }}
          />
        ) : (
          <TileBackdrop color={color} order={app.order} state={isRunning ? 'live' : isCrashed ? 'crashed' : 'idle'} />
        )}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 42%, color-mix(in srgb, var(--color-bg-surface) 92%, transparent) 100%)' }} />

        {/* top-left: icon or step number */}
        <div style={{ position: 'absolute', top: 10, left: 12 }}>
          {app.icon_cache_path ? (
            <img
              src={convertFileSrc(app.icon_cache_path)}
              alt=""
              style={{ width: 28, height: 28, objectFit: 'contain' }}
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <span style={{ ...monoLabel, color: 'var(--color-text-muted)' }}>{String(app.order + 1).padStart(2, '0')}</span>
          )}
        </div>

        {/* top-right: status text + LED (never colour alone) */}
        <div style={{ ...monoLabel, position: 'absolute', top: 10, right: 12, display: 'flex', alignItems: 'center', gap: 6, color: isCrashed ? 'var(--color-error-text)' : isRunning ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
          {STATUS_LABEL[status.status]}
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: ledColor, display: 'inline-block',
            boxShadow: isRunning ? '0 0 6px var(--color-status-live)' : 'none',
            animation: isCrashed ? 'pulse-crit 1s infinite' : undefined,
          }} />
        </div>

        {isCrashed && (
          <div style={{
            ...monoLabel, fontSize: 11, position: 'absolute', top: 36, left: 12, right: 12, padding: '5px 8px',
            color: 'var(--color-error-text)', background: 'color-mix(in srgb, var(--color-bg-surface) 88%, var(--color-status-crit) 12%)', border: '1px solid var(--color-status-crit)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }} title={status.error_message}>
            {status.error_message ?? 'Process crashed'}
          </div>
        )}

        {/* name */}
        <div
          title={app.name}
          style={{
            position: 'absolute', left: 12, right: 12, bottom: 10,
            fontFamily: 'var(--font-body)', fontSize: 21, fontWeight: 700, lineHeight: 1.1,
            color: status.status === 'stopped' ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {app.name}
        </div>
      </div>

      {/* decorative signal strip */}
      <div aria-hidden="true" style={{ height: 2, margin: '0 12px', opacity: 0.45, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 4 }}>
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} style={{ background: isRunning ? color : isCrashed && i < 4 ? 'var(--color-status-crit)' : 'var(--color-border-divider)' }} />
        ))}
      </div>

      <div style={{ height: 44, padding: '0 6px', display: 'flex', alignItems: 'center' }}>
        <div style={{ flex: 1 }}><AppControls {...props} /></div>
      </div>
    </div>
  );
}
