import { Icon } from '../icons/Icon';
import { faSliders, faXmark, faCircleRegular } from '../icons';
import type { AppEntry } from '../../types';

interface AppTileProps {
  app: AppEntry;
  onEdit: (app: AppEntry) => void;
  onRemove: (id: string) => void;
}

export function AppTile({ app, onEdit, onRemove }: AppTileProps) {
  return (
    <div
      className="flex flex-col justify-between p-3"
      style={{
        width: 260,
        height: 120,
        background: '#161618',
        border: '1px solid #2A2A2F',
        flexShrink: 0,
      }}
    >
      {/* Status dot + name */}
      <div className="flex items-center gap-2">
        <Icon icon={faCircleRegular} size={6} />
        <span
          className="text-sm font-medium truncate flex-1"
          style={{ color: '#E8E8EA' }}
          title={app.name}
        >
          {app.name}
        </span>
      </div>

      {/* Executable path */}
      <div
        className="text-xs font-mono truncate"
        style={{ color: '#54545A' }}
        title={app.executable_path}
      >
        {app.executable_path}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        {app.launch_delay_ms > 0 && (
          <span className="text-xs font-mono" style={{ color: '#54545A' }}>
            +{app.launch_delay_ms}ms
          </span>
        )}
        <button
          onClick={() => onEdit(app)}
          className="transition-colors cursor-pointer"
          title="Edit"
          style={{ background: 'none', border: 'none', padding: 0 }}
          onMouseEnter={e => e.currentTarget.querySelector('svg')?.setAttribute('style', 'width:12px;height:12px;color:#E8E8EA;flex-shrink:0')}
          onMouseLeave={e => e.currentTarget.querySelector('svg')?.setAttribute('style', 'width:12px;height:12px;color:#54545A;flex-shrink:0')}
        >
          <Icon icon={faSliders} size={12} />
        </button>
        <button
          onClick={() => onRemove(app.id)}
          className="transition-colors cursor-pointer"
          title="Remove"
          style={{ background: 'none', border: 'none', padding: 0 }}
        >
          <Icon icon={faXmark} size={12} crit />
        </button>
      </div>
    </div>
  );
}
