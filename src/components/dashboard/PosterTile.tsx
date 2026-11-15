import { AppControls } from './AppControls';
import { TileBackdrop } from './TileBackdrop';
import { appColor } from '../../lib/appColor';
import { artworkSrc, exeName } from '../../lib/appArt';
import { statusLabel, type ProcessInfo } from '../../hooks/useProcessStatus';
import type { AppEntry } from '../../types';
import { t } from '../../i18n';

interface Props {
  app: AppEntry;
  status: ProcessInfo;
  index: number;
  tabIndex: number;
  ref?: React.Ref<HTMLDivElement>;
  onFocusTile: () => void;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onOpenPath: () => void;
  onEdit: (app: AppEntry) => void;
  onRemove: (id: string) => void;
}

const mono = { fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' } as const;

/** Big Picture tile: tall poster; controls appear on hover / keyboard focus. */
export function PosterTile({ ref, index, tabIndex, onFocusTile, ...p }: Props) {
  const { app, status } = p;
  const running = status.status === 'running';
  const crashed = status.status === 'crashed';
  const art = artworkSrc(app);

  return (
    <div
      ref={ref}
      role="listitem"
      tabIndex={tabIndex}
      data-index={index}
      aria-label={`${app.name}, ${statusLabel(status.status)}`}
      onFocus={e => { onFocusTile(); e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'center' }); }}
      className="poster"
      style={crashed ? { borderColor: 'var(--color-status-crit)' } : undefined}
    >
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        {art ? (
          <img src={art} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
        ) : (
          <TileBackdrop color={appColor(app.order)} name={app.name} state={running ? 'live' : crashed ? 'crashed' : 'idle'} />
        )}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, color-mix(in srgb, var(--color-bg-surface) 94%, transparent) 100%)' }} />

        <div style={{ ...mono, position: 'absolute', top: 12, left: 14, display: 'flex', alignItems: 'center', gap: 6, color: crashed ? 'var(--color-error-text)' : running ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
            background: running ? 'var(--color-status-live)' : crashed ? 'var(--color-status-crit)' : 'var(--color-border-default)',
            boxShadow: running ? '0 0 6px var(--color-status-live)' : 'none',
            animation: crashed ? 'pulse-crit 1s infinite' : undefined,
          }} />
          {statusLabel(status.status)}
        </div>

        {crashed && (
          <div title={status.error_message} style={{
            ...mono, position: 'absolute', top: 38, left: 14, right: 14, padding: '5px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            color: 'var(--color-error-text)', background: 'color-mix(in srgb, var(--color-bg-surface) 88%, var(--color-status-crit) 12%)', border: '1px solid var(--color-status-crit)',
          }}>
            {status.error_message ?? t('Process crashed')}
          </div>
        )}

        <div title={app.name} className="poster__name" style={{
          position: 'absolute', left: 14, right: 14, bottom: 12, fontSize: 26, fontWeight: 700, lineHeight: 1.1,
          color: status.status === 'stopped' ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {app.name}
        </div>
      </div>

      <div style={{ position: 'relative', height: 44, borderTop: '1px solid var(--color-border-divider)' }}>
        <div className="poster__meta" style={{ ...mono, padding: '0 14px', color: 'var(--color-text-muted)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {exeName(app)}
        </div>
        <div className="poster__controls">
          <div style={{ flex: 1 }}><AppControls {...p} /></div>
        </div>
      </div>
    </div>
  );
}
