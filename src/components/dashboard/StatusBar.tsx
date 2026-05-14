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
    <>
    <div style={{ height: 1, background: 'var(--color-border-divider)', margin: '0 24px', flexShrink: 0 }} />
    <div
      className="flex items-center gap-6 px-6"
      style={{
        minHeight: 57,
        flexShrink: 0,
      }}
    >
      <Stat label="Total" value={total} />
      <Stat label="Alive" value={running} />
      <Stat label="Crashed" value={crashed} />
    </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '1.5px',
        lineHeight: '16px',
        textTransform: 'uppercase',
        color: 'var(--color-text-secondary)',
      }}
    >
      {label}{'  '}{value}
    </span>
  );
}
