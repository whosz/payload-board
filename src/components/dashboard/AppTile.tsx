import { useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Icon } from '../icons/Icon';
import {
  faPlay,
  faStop,
  faRotateRight,
  faFolderOpen,
  faSliders,
  faTrash,
  faCircleRegular,
  faTriangleExclamation,
} from '../icons';
import type { AppEntry } from '../../types';
import type { ProcessInfo } from '../../hooks/useProcessStatus';

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

function StatusLed({ status }: { status: ProcessInfo['status'] }) {
  if (status === 'running') {
    return (
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--color-status-live)',
          boxShadow: '0 0 8px var(--color-status-live)',
          flexShrink: 0,
        }}
      />
    );
  }
  if (status === 'crashed') {
    return (
      <span style={{ animation: 'pulse-crit 1s infinite', lineHeight: 0 }}>
        <Icon icon={faTriangleExclamation} size={12} crit />
      </span>
    );
  }
  return <Icon icon={faCircleRegular} size={8} />;
}

function TileButton({
  onClick,
  title,
  children,
  disabled,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="tile-btn"
      style={{
        background: 'none',
        border: 'none',
        padding: '2px 4px',
        cursor: 'pointer',
        lineHeight: 0,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {children}
    </button>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      title="Remove"
      className="tile-btn"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'none',
        border: 'none',
        padding: '2px 4px',
        cursor: 'pointer',
        lineHeight: 0,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Icon icon={faTrash} size={14} crit={hovered} />
    </button>
  );
}

export function AppTile({
  app,
  status,
  onStart,
  onStop,
  onRestart,
  onOpenPath,
  onEdit,
  onRemove,
}: AppTileProps) {
  const isRunning = status.status === 'running';
  const isStopped = status.status === 'stopped';

  const bgSrc = app.background_url
    ? (app.background_url.startsWith('http') ? app.background_url : convertFileSrc(app.background_url))
    : null;

  const bgStyle: React.CSSProperties = bgSrc
    ? {
        backgroundImage: `linear-gradient(rgba(10,10,11,0.82) 0%, rgba(10,10,11,0.72) 50%, rgba(10,10,11,0.88) 100%), url("${bgSrc}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : { background: 'var(--color-bg-elevated)' };

  return (
    <div
      className="flex flex-col"
      style={{
        width: 340,
        height: 170,
        ...bgStyle,
        border: `1px solid ${status.status === 'crashed' ? 'var(--color-status-crit)' : 'var(--color-border-default)'}`,
        flexShrink: 0,
        padding: '14px 16px',
      }}
    >
      {/* Row 1: LED + icon + name + delay badge */}
      <div className="flex items-center gap-2">
        <StatusLed status={status.status} />
        {app.icon_cache_path && (
          <img
            src={convertFileSrc(app.icon_cache_path)}
            alt=""
            style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <span
          className="font-medium truncate flex-1"
          style={{ color: bgSrc ? '#e8e8ea' : 'var(--color-text-primary)', fontSize: 15 }}
          title={app.name}
        >
          {app.name}
        </span>
        {app.launch_delay_ms > 0 && (
          <span className="font-mono" style={{ color: bgSrc ? '#7a7a8a' : 'var(--color-text-muted)', fontSize: 11, flexShrink: 0 }}>
            +{app.launch_delay_ms}ms
          </span>
        )}
      </div>

      {/* Row 2: path + optional error — immediately below name */}
      <div className="flex flex-col gap-0.5" style={{ marginTop: 4 }}>
        <div
          className="font-mono truncate"
          style={{ color: bgSrc ? '#7a7a8a' : 'var(--color-text-muted)', fontSize: 11 }}
          title={app.executable_path}
        >
          {app.executable_path}
        </div>
        {status.status === 'crashed' && status.error_message && (
          <div
            className="font-mono truncate"
            style={{ color: 'var(--color-status-crit)', fontSize: 10 }}
            title={status.error_message}
          >
            {status.error_message}
          </div>
        )}
        {app.args.length > 0 && (
          <div
            className="font-mono truncate"
            style={{ color: bgSrc ? 'rgba(255,255,255,0.25)' : 'var(--color-text-disabled)', fontSize: 10 }}
            title={app.args.join(' ')}
          >
            {app.args.join(' ')}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Row 3: process controls + edit/remove */}
      <div
        className="flex items-center gap-1"
        style={bgSrc ? {
          background: 'rgba(10,10,11,0.55)',
          margin: '0 -16px -14px',
          padding: '6px 16px 14px',
        } : undefined}
      >
        <TileButton onClick={onStart} title="Start" disabled={isRunning}>
          <Icon icon={faPlay} size={14} active={!isRunning && !isStopped ? false : !isRunning} />
        </TileButton>
        <TileButton onClick={onStop} title="Stop" disabled={isStopped}>
          <Icon icon={faStop} size={14} crit={isRunning} />
        </TileButton>
        <TileButton onClick={onRestart} title="Restart">
          <Icon icon={faRotateRight} size={14} />
        </TileButton>
        <TileButton onClick={onOpenPath} title="Open folder">
          <Icon icon={faFolderOpen} size={14} />
        </TileButton>

        <div style={{ flex: 1 }} />

        <TileButton onClick={() => onEdit(app)} title="Edit settings">
          <Icon icon={faSliders} size={14} />
        </TileButton>
        <RemoveButton onClick={() => onRemove(app.id)} />
      </div>
    </div>
  );
}
