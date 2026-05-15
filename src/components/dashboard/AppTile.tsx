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

function IconBtn({
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
        padding: 0,
        cursor: 'pointer',
        lineHeight: 0,
        width: 14,
        height: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

export function AppTile({ app, status, onStart, onStop, onRestart, onOpenPath, onEdit, onRemove }: AppTileProps) {
  const [removeHovered, setRemoveHovered] = useState(false);
  const [tileHovered, setTileHovered] = useState(false);
  const isRunning = status.status === 'running';
  const isStopped = status.status === 'stopped';
  const isCrashed = status.status === 'crashed';

  const bgSrc = app.background_url
    ? (app.background_url.startsWith('http') ? app.background_url : convertFileSrc(app.background_url))
    : null;

  return (
    <div
      onMouseEnter={() => setTileHovered(true)}
      onMouseLeave={() => setTileHovered(false)}
      style={{
        position: 'relative',
        width: 260,
        height: 180,
        borderRadius: 8,
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 18,
        background: 'var(--color-bg-elevated)',
        border: `1px solid ${isCrashed ? 'var(--color-status-crit)' : 'transparent'}`,
        transition: 'box-shadow 0.15s ease',
        boxShadow: isCrashed
          ? (tileHovered ? '0 2px 25px 0 var(--color-tile-shadow-error-hover)' : '0 2px 25px 0 var(--color-tile-shadow-error)')
          : (tileHovered ? '0 2px 20px 0 var(--color-tile-shadow-hover)' : '0 2px 20px 0 var(--color-tile-shadow)'),
      }}
    >
      {/* ── BG — absolute, covers top 128px, not a flex child ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 128, overflow: 'hidden' }}>
        {bgSrc ? (
          <>
            <img
              src={bgSrc}
              alt=""
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                opacity: tileHovered ? 1 : 0.5,
                transition: 'opacity 0.15s ease',
              }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(0deg, var(--color-tile-gradient) 0%, color-mix(in srgb, var(--color-tile-gradient) 50%, transparent) 45%, color-mix(in srgb, var(--color-tile-gradient) 25%, transparent) 65%, transparent 85%)',
            }} />
          </>
        ) : (
          <>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'var(--tile-placeholder-url)',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              opacity: tileHovered ? 1 : 0.5,
              transition: 'opacity 0.15s ease',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(0deg, var(--color-tile-gradient) 0%, color-mix(in srgb, var(--color-tile-gradient) 50%, transparent) 45%, color-mix(in srgb, var(--color-tile-gradient) 25%, transparent) 65%, transparent 85%)',
            }} />
          </>
        )}
        {app.icon_cache_path && (
          <img
            src={convertFileSrc(app.icon_cache_path)}
            alt=""
            style={{ position: 'absolute', top: 10, left: 10, width: 32, height: 32, objectFit: 'contain' }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        {/* ── Error pill — text + red dot inside, overlaid at top of BG when crashed ── */}
        {isCrashed && (
          <div style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px',
            background: 'rgba(10,8,22,0.82)',
            borderRadius: 8,
            zIndex: 2,
          }}>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--color-error-text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}>
              {status.error_message ?? 'Process crashed'}
            </span>
            <span style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'var(--color-status-crit)',
              boxShadow: '0 0 8px var(--color-status-crit)',
              flexShrink: 0,
              display: 'inline-block',
              animation: 'pulse-crit 1s infinite',
            }} />
          </div>
        )}
        {/* ── Running dot — same position as red dot in error pill ── */}
        {isRunning && (
          <span style={{
            position: 'absolute',
            top: 18,
            right: 22,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: 'var(--color-status-live)',
            boxShadow: '0 0 8px var(--color-status-live)',
            display: 'inline-block',
            zIndex: 2,
            animation: 'pulse-live 2s infinite',
          }} />
        )}
      </div>

      {/* ── Note — flex item 1, 18px spacer ── */}
      <div style={{ height: 18, flexShrink: 0 }} />

      {/* ── Header — flex item 2, 224×50, gap=16 between name and controls ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* App name */}
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            letterSpacing: '1.5px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={app.name}
        >
          {app.name}
        </div>

        {/* Controls row: LeftActions + RightActions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <IconBtn onClick={onStart} title="Start" disabled={isRunning}>
              <Icon icon={faPlay} size={14} active={!isRunning} />
            </IconBtn>
            <IconBtn onClick={onStop} title="Stop" disabled={isStopped}>
              <Icon icon={faStop} size={14} crit={isRunning} />
            </IconBtn>
            <IconBtn onClick={onRestart} title="Restart">
              <Icon icon={faRotateRight} size={14} />
            </IconBtn>
            <IconBtn onClick={onOpenPath} title="Open folder">
              <Icon icon={faFolderOpen} size={14} />
            </IconBtn>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <IconBtn onClick={() => onEdit(app)} title="Edit">
              <Icon icon={faSliders} size={14} />
            </IconBtn>
            <button
              onClick={() => onRemove(app.id)}
              title="Remove"
              className="tile-btn"
              onMouseEnter={() => setRemoveHovered(true)}
              onMouseLeave={() => setRemoveHovered(false)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon icon={faTrash} size={14} crit={removeHovered} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
