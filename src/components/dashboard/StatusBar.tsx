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
        background: '#111113',
        borderTop: '1px solid #1F1F22',
        color: '#54545A',
        minHeight: 44,
        fontSize: 12,
        letterSpacing: '0.04em',
      }}
    >
      <span>
        TOTAL <span style={{ color: '#8A8A90' }}>{total}</span>
      </span>
      <span>
        ALIVE{' '}
        <span style={{ color: running > 0 ? '#00E5FF' : '#54545A' }}>{running}</span>
      </span>
      {crashed > 0 && (
        <span>
          CRASHED <span style={{ color: '#FF2D55' }}>{crashed}</span>
        </span>
      )}
    </div>
  );
}
