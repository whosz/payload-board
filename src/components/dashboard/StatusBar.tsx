import type { Profile } from '../../types';

interface StatusBarProps {
  profile: Profile | null;
}

export function StatusBar({ profile }: StatusBarProps) {
  const total = profile?.apps.filter(a => a.enabled).length ?? 0;

  return (
    <div
      className="flex items-center gap-4 px-4 py-2 text-xs font-mono"
      style={{
        background: '#111113',
        borderTop: '1px solid #1F1F22',
        color: '#54545A',
        minHeight: 32,
      }}
    >
      <span>
        TOTAL:{' '}
        <span style={{ color: '#8A8A90' }}>{total}</span>
        {' '}PROCESSES
      </span>
    </div>
  );
}
