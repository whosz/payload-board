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

function Btn({
  onClick, title, children, disabled,
}: {
  onClick: () => void; title: string; children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="tile-btn"
      style={{
        background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0,
        width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}

export function AppListRow({ app, status, onStart, onStop, onRestart, onOpenPath, onEdit, onRemove }: AppListRowProps) {
  const isRunning = status.status === 'running';
  const isStopped = status.status === 'stopped';
  const isCrashed = status.status === 'crashed';
  const [hovered, setHovered] = useState(false);
  const [removeHovered, setRemoveHovered] = useState(false);

  return (
    <div
      className="flex items-center"
      style={{
        padding: '8px 16px',
        gap: 16,
        height: 52,
        borderRadius: 8,
        background: hovered ? 'var(--color-row-bg-hover)' : 'var(--color-row-bg)',
        border: `1px solid ${isCrashed ? 'var(--color-status-crit)' : 'transparent'}`,
        transition: 'background-color 0.1s',
        flexShrink: 0,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Status dot */}
      <div style={{ flexShrink: 0, width: 10, height: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isRunning ? (
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-status-live)', boxShadow: '0 0 6px var(--color-status-live)', display: 'inline-block' }} />
        ) : isCrashed ? (
          <span style={{ animation: 'pulse-crit 1s infinite', lineHeight: 0 }}>
            <Icon icon={faTriangleExclamation} size={10} crit />
          </span>
        ) : (
          <Icon icon={faCircleRegular} size={8} />
        )}
      </div>

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
      <div className="flex flex-col justify-center min-w-0 flex-1" style={{ gap: 2 }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            letterSpacing: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={app.name}
        >
          {app.name}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 500,
            color: isCrashed ? 'var(--color-error-text)' : 'var(--color-text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={isCrashed && status.error_message ? status.error_message : app.executable_path}
        >
          {isCrashed && status.error_message
            ? status.error_message
            : app.args.length > 0
              ? `${app.executable_path}  ${app.args.join(' ')}`
              : app.executable_path}
        </div>
      </div>

      {/* Controls — LeftActions (12px gap) + 24px gap + RightActions (12px gap) */}
      <div className="flex items-center flex-shrink-0" style={{ gap: 24 }}>
        <div className="flex items-center" style={{ gap: 12 }}>
          <Btn onClick={onStart} title="Start" disabled={isRunning}>
            <Icon icon={faPlay} size={12} active={!isRunning} />
          </Btn>
          <Btn onClick={onStop} title="Stop" disabled={isStopped}>
            <Icon icon={faStop} size={12} crit={isRunning} />
          </Btn>
          <Btn onClick={onRestart} title="Restart">
            <Icon icon={faRotateRight} size={12} />
          </Btn>
          <Btn onClick={onOpenPath} title="Open folder">
            <Icon icon={faFolderOpen} size={12} />
          </Btn>
        </div>
        <div className="flex items-center" style={{ gap: 12 }}>
          <Btn onClick={() => onEdit(app)} title="Edit">
            <Icon icon={faSliders} size={12} />
          </Btn>
          <button
            onClick={() => onRemove(app.id)}
            title="Remove"
            className="tile-btn"
            onMouseEnter={() => setRemoveHovered(true)}
            onMouseLeave={() => setRemoveHovered(false)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon icon={faTrash} size={12} crit={removeHovered} />
          </button>
        </div>
      </div>
    </div>
  );
}
