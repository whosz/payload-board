import { useState } from 'react';
import { Icon } from '../icons/Icon';
import { faPlay, faStop, faRotateRight, faFolderOpen, faSliders, faTrash } from '../icons';
import type { AppEntry } from '../../types';
import type { ProcessInfo } from '../../hooks/useProcessStatus';
import { t } from '../../i18n';
import { withKey } from '../../lib/shortcuts';

interface Props {
  app: AppEntry;
  status: ProcessInfo;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onOpenPath: () => void;
  onEdit: (app: AppEntry) => void;
  onRemove: (id: string) => void;
}

function IconBtn({ onClick, label, keys, disabled, children }: {
  onClick: () => void; label: string; keys?: string; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} title={withKey(label, keys)} aria-label={label} disabled={disabled} className="tile-btn">
      {children}
    </button>
  );
}

// Shared by AppTile and AppListRow: 6 icon buttons, 32px hit area each.
export function AppControls({ app, status, onStart, onStop, onRestart, onOpenPath, onEdit, onRemove }: Props) {
  const [removeHovered, setRemoveHovered] = useState(false);
  const isRunning = status.status === 'running';
  const isStopped = status.status === 'stopped';

  return (
    <div className="flex items-center justify-between" style={{ gap: 8 }}>
      <div className="flex items-center" style={{ gap: 2 }}>
        <IconBtn onClick={onStart} label={t('Start')} keys="Enter" disabled={isRunning}>
          <Icon icon={faPlay} size={14} active={!isRunning} />
        </IconBtn>
        <IconBtn onClick={onStop} label={t('Stop')} keys="Enter" disabled={isStopped}>
          <Icon icon={faStop} size={14} crit={isRunning} />
        </IconBtn>
        <IconBtn onClick={onRestart} label={t('Restart')} keys="R">
          <Icon icon={faRotateRight} size={14} />
        </IconBtn>
        <IconBtn onClick={onOpenPath} label={t('Open folder')}>
          <Icon icon={faFolderOpen} size={14} />
        </IconBtn>
      </div>
      <div className="flex items-center" style={{ gap: 2 }}>
        <IconBtn onClick={() => onEdit(app)} label={t('Edit')} keys="E">
          <Icon icon={faSliders} size={14} />
        </IconBtn>
        <span onMouseEnter={() => setRemoveHovered(true)} onMouseLeave={() => setRemoveHovered(false)} style={{ display: 'flex' }}>
          <IconBtn onClick={() => onRemove(app.id)} label={t('Remove')} keys="Del">
            <Icon icon={faTrash} size={14} crit={removeHovered} />
          </IconBtn>
        </span>
      </div>
    </div>
  );
}
