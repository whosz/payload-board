import { Icon } from '../icons/Icon';
import {
  faPlay,
  faStop,
  faRotateRight,
  faFolderOpen,
  faSliders,
  faXmark,
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

  return (
    <div
      className="flex flex-col justify-between"
      style={{
        width: 340,
        height: 170,
        background: 'var(--color-bg-elevated)',
        border: `1px solid ${status.status === 'crashed' ? 'var(--color-status-crit)' : 'var(--color-border-default)'}`,
        flexShrink: 0,
        padding: '14px 16px',
      }}
    >
      {/* Row 1: LED + name + delay badge */}
      <div className="flex items-center gap-2">
        <StatusLed status={status.status} />
        <span
          className="font-medium truncate flex-1"
          style={{ color: 'var(--color-text-primary)', fontSize: 15 }}
          title={app.name}
        >
          {app.name}
        </span>
        {app.launch_delay_ms > 0 && (
          <span className="font-mono" style={{ color: 'var(--color-text-muted)', fontSize: 11, flexShrink: 0 }}>
            +{app.launch_delay_ms}ms
          </span>
        )}
      </div>

      {/* Row 2: path */}
      <div
        className="font-mono truncate"
        style={{ color: 'var(--color-text-muted)', fontSize: 11 }}
        title={app.executable_path}
      >
        {app.executable_path}
      </div>

      {/* Row 3: process controls + edit/remove */}
      <div className="flex items-center gap-1">
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
        <TileButton onClick={() => onRemove(app.id)} title="Remove">
          <Icon icon={faXmark} size={14} crit />
        </TileButton>
      </div>
    </div>
  );
}
