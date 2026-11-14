import { useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Icon } from '../icons/Icon';
import { AppControls } from './AppControls';
import {
  faCircleRegular,
  faTriangleExclamation,
} from '../icons';
import type { AppEntry } from '../../types';
import { STATUS_LABEL, type ProcessInfo } from '../../hooks/useProcessStatus';

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

export function AppListRow({ app, status, onStart, onStop, onRestart, onOpenPath, onEdit, onRemove }: AppListRowProps) {
  const isRunning = status.status === 'running';
  const isCrashed = status.status === 'crashed';
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex items-center"
      style={{
        padding: '8px 16px',
        gap: 16,
        minHeight: 52,
        borderRadius: 2,
        background: hovered ? 'var(--color-row-bg-hover)' : 'var(--color-row-bg)',
        border: `1px solid ${isCrashed ? 'var(--color-status-crit)' : 'var(--color-border-divider)'}`,
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

      {/* Name */}
      <div className="flex flex-col justify-center min-w-0 flex-1" style={{ gap: 2 }}>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            letterSpacing: '0.02em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={app.name}
        >
          {app.name}
        </div>
        {isCrashed && status.error_message && (
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--color-error-text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={status.error_message}
          >
            {status.error_message}
          </div>
        )}
      </div>

      <span style={{
        flexShrink: 0, width: 72, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
        color: isCrashed ? 'var(--color-error-text)' : isRunning ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
      }}>
        {STATUS_LABEL[status.status]}
      </span>

      <div className="flex-shrink-0" style={{ width: 240 }}>
        <AppControls app={app} status={status} onStart={onStart} onStop={onStop} onRestart={onRestart} onOpenPath={onOpenPath} onEdit={onEdit} onRemove={onRemove} />
      </div>
    </div>
  );
}
