import type { Profile } from '../../types';
import type { ProcessInfo } from '../../hooks/useProcessStatus';

interface StatusBarProps {
  profile: Profile | null;
  statuses: Record<string, ProcessInfo>;
}

export function StatusBar({ profile, statuses }: StatusBarProps) {
  const total = profile?.apps.filter(a => a.enabled).length ?? 0;
  const running = profile?.apps.filter(a => statuses[a.id]?.status === 'running').length ?? 0;
  const crashed = profile?.apps.filter(a => statuses[a.id]?.status === 'crashed').length ?? 0;

  return (
    <div
      className="flex items-center gap-6 px-5 font-mono"
      style={{
        background: 'var(--color-bg-surface)',
        borderTop: '1px solid var(--color-border-subtle)',
        color: 'var(--color-text-muted)',
        minHeight: 44,
        fontSize: 12,
        letterSpacing: '0.04em',
      }}
    >
      <span>
        TOTAL <span style={{ color: 'var(--color-text-secondary)' }}>{total}</span>
      </span>
      <span>
        ALIVE{' '}
        <span style={{ color: running > 0 ? 'var(--color-status-live)' : 'var(--color-text-muted)' }}>{running}</span>
      </span>
      {crashed > 0 && (
        <span>
          CRASHED <span style={{ color: 'var(--color-status-crit)' }}>{crashed}</span>
        </span>
      )}
    </div>
  );
}
