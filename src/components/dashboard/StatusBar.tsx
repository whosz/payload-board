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
      className="flex items-center gap-6 px-6"
      style={{
        borderTop: '1px solid var(--color-border-divider)',
        minHeight: 57,
        flexShrink: 0,
      }}
    >
      <Stat label="Total" value={total} weight={600} />
      <Stat label="Alive" value={running} weight={400} />
      <Stat label="Crashed" value={crashed} weight={400} />
    </div>
  );
}

function Stat({ label, value, weight }: { label: string; value: number; weight: number }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 10,
        fontWeight: weight,
        letterSpacing: '0.06em',
        color: 'var(--color-text-secondary)',
      }}
    >
      {label}{'  '}{value}
    </span>
  );
}
