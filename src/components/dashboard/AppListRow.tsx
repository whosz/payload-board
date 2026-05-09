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

interface AppListRowProps {
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
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: 'var(--color-status-live)',
          boxShadow: '0 0 6px var(--color-status-live)',
          flexShrink: 0,
        }}
      />
    );
  }
  if (status === 'crashed') {
    return (
      <span style={{ animation: 'pulse-crit 1s infinite', lineHeight: 0 }}>
        <Icon icon={faTriangleExclamation} size={11} crit />
      </span>
    );
  }
  return <Icon icon={faCircleRegular} size={7} />;
}

export function AppListRow({
  app,
  status,
  onStart,
  onStop,
  onRestart,
  onOpenPath,
  onEdit,
  onRemove,
}: AppListRowProps) {
  const isRunning = status.status === 'running';
  const isStopped = status.status === 'stopped';
  const isCrashed = status.status === 'crashed';
  const [hovered, setHovered] = useState(false);
  const [removeHovered, setRemoveHovered] = useState(false);

  return (
    <div
      className="flex items-center gap-3 px-4"
      style={{
        height: 44,
        borderBottom: '1px solid var(--color-border-subtle)',
        borderLeft: `3px solid ${isCrashed ? 'var(--color-status-crit)' : isRunning ? 'var(--color-status-live)' : 'transparent'}`,
        background: hovered ? 'var(--color-bg-elevated)' : 'transparent',
        transition: 'background 0.1s',
        flexShrink: 0,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* LED */}
      <StatusLed status={status.status} />

      {/* Icon */}
      {app.icon_cache_path && (
        <img
          src={convertFileSrc(app.icon_cache_path)}
          alt=""
          style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }}
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
      )}

      {/* Name + path */}
      <div className="flex flex-col justify-center min-w-0 flex-1" style={{ gap: 1 }}>
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="font-medium truncate"
            style={{ color: 'var(--color-text-primary)', fontSize: 13 }}
            title={app.name}
          >
            {app.name}
          </span>
          {app.launch_delay_ms > 0 && (
            <span className="font-mono" style={{ color: 'var(--color-text-muted)', fontSize: 10, flexShrink: 0 }}>
              +{app.launch_delay_ms}ms
            </span>
          )}
        </div>
        <div
          className="font-mono truncate"
          style={{ color: isCrashed ? 'var(--color-status-crit)' : 'var(--color-text-muted)', fontSize: 10 }}
          title={isCrashed && status.error_message ? status.error_message : app.executable_path}
        >
          {isCrashed && status.error_message
            ? status.error_message
            : app.args.length > 0
              ? `${app.executable_path}  ${app.args.join(' ')}`
              : app.executable_path}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={onStart}
          title="Start"
          disabled={isRunning}
          className="tile-btn"
          style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', lineHeight: 0, display: 'flex', alignItems: 'center' }}
        >
          <Icon icon={faPlay} size={12} active={!isRunning} />
        </button>
        <button
          onClick={onStop}
          title="Stop"
          disabled={isStopped}
          className="tile-btn"
          style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', lineHeight: 0, display: 'flex', alignItems: 'center' }}
        >
          <Icon icon={faStop} size={12} crit={isRunning} />
        </button>
        <button
          onClick={onRestart}
          title="Restart"
          className="tile-btn"
          style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', lineHeight: 0, display: 'flex', alignItems: 'center' }}
        >
          <Icon icon={faRotateRight} size={12} />
        </button>
        <button
          onClick={onOpenPath}
          title="Open folder"
          className="tile-btn"
          style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', lineHeight: 0, display: 'flex', alignItems: 'center' }}
        >
          <Icon icon={faFolderOpen} size={12} />
        </button>

        <div style={{ width: 1, height: 16, background: 'var(--color-border-default)', margin: '0 4px', flexShrink: 0 }} />

        <button
          onClick={() => onEdit(app)}
          title="Edit settings"
          className="tile-btn"
          style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', lineHeight: 0, display: 'flex', alignItems: 'center' }}
        >
          <Icon icon={faSliders} size={12} />
        </button>
        <button
          onClick={() => onRemove(app.id)}
          title="Remove"
          className="tile-btn"
          onMouseEnter={() => setRemoveHovered(true)}
          onMouseLeave={() => setRemoveHovered(false)}
          style={{ background: 'none', border: 'none', padding: '2px 6px', cursor: 'pointer', lineHeight: 0, display: 'flex', alignItems: 'center' }}
        >
          <Icon icon={faTrash} size={12} crit={removeHovered} />
        </button>
      </div>
    </div>
  );
}
