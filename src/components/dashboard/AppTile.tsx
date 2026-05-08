import { Icon } from '../icons/Icon';
import {
  faPlay,
  faStop,
  faRotateRight,
  faFolderOpen,
  faSliders,
  faXmark,
  faCircleSolid,
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
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#00E5FF',
          boxShadow: '0 0 8px #00E5FF',
          flexShrink: 0,
        }}
      />
    );
  }
  if (status === 'crashed') {
    return (
      <Icon
        icon={faTriangleExclamation}
        size={8}
        crit
        className="fa-icon-crit"
        style={{ animation: 'pulse 1s infinite' } as React.CSSProperties}
      />
    );
  }
  // stopped / stopping
  return <Icon icon={faCircleRegular} size={6} />;
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
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.3 : 1,
        lineHeight: 0,
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
      className="flex flex-col justify-between p-3"
      style={{
        width: 260,
        height: 120,
        background: '#161618',
        border: `1px solid ${status.status === 'crashed' ? '#FF2D55' : '#2A2A2F'}`,
        flexShrink: 0,
      }}
    >
      {/* Row 1: status LED + name */}
      <div className="flex items-center gap-2">
        <StatusLed status={status.status} />
        <span
          className="text-sm font-medium truncate flex-1"
          style={{ color: '#E8E8EA' }}
          title={app.name}
        >
          {app.name}
        </span>
        {app.launch_delay_ms > 0 && (
          <span className="text-xs font-mono" style={{ color: '#54545A', flexShrink: 0 }}>
            +{app.launch_delay_ms}ms
          </span>
        )}
      </div>

      {/* Row 2: path */}
      <div
        className="text-xs font-mono truncate"
        style={{ color: '#54545A' }}
        title={app.executable_path}
      >
        {app.executable_path}
      </div>

      {/* Row 3: process controls + edit/remove */}
      <div className="flex items-center gap-2">
        {/* Process controls */}
        <TileButton onClick={onStart} title="Start" disabled={isRunning}>
          <Icon icon={faPlay} size={11} active={!isRunning} />
        </TileButton>
        <TileButton onClick={onStop} title="Stop" disabled={isStopped}>
          <Icon icon={faStop} size={11} crit={isRunning} />
        </TileButton>
        <TileButton onClick={onRestart} title="Restart">
          <Icon icon={faRotateRight} size={11} />
        </TileButton>
        <TileButton onClick={onOpenPath} title="Open folder">
          <Icon icon={faFolderOpen} size={11} />
        </TileButton>

        <div style={{ flex: 1 }} />

        {/* Edit / remove */}
        <TileButton onClick={() => onEdit(app)} title="Edit">
          <Icon icon={faSliders} size={11} />
        </TileButton>
        <TileButton onClick={() => onRemove(app.id)} title="Remove">
          <Icon icon={faXmark} size={11} crit />
        </TileButton>
      </div>
    </div>
  );
}
