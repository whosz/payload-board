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
      <div className="flex items-center gap-6 px-6" style={{ minHeight: 64, flexShrink: 0 }}>
        <Stat label="Total" value={total} />
        <Stat label="Alive" value={running} color="var(--color-status-live)" />
        <Stat label="Crashed" value={crashed} color={crashed > 0 ? 'var(--color-status-crit)' : undefined} />
      </div>
    </>
  );
}

// Segment-display style counter: mono label + boxed two-digit value.
function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <span
      className="flex items-center gap-2"
      style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}
    >
      {label}
      <span style={{
        minWidth: 40, height: 28, padding: '0 6px', display: 'inline-grid', placeItems: 'center',
        background: 'var(--color-bg-desk)', border: `1px solid ${color && value > 0 ? color : 'var(--color-border-divider)'}`, borderRadius: 2,
        fontSize: 13, letterSpacing: '0.08em', color: value > 0 && color ? color : 'var(--color-text-primary)',
      }}>
        {String(value).padStart(2, '0')}
      </span>
    </span>
  );
}
