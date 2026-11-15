import { Icon } from './icons/Icon';
import { faPlus, faGear } from './icons';
import type { Profile } from '../types';

interface Props {
  profiles: Profile[];
  activeProfileId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onSettings: () => void;
  onPalette: () => void;
}

export function ProfileTabs({ profiles, activeProfileId, onSelect, onNew, onSettings, onPalette }: Props) {
  return (
    <header className="flex items-center flex-shrink-0" style={{ height: 56, gap: 24, padding: '0 24px', borderBottom: '1px solid var(--color-border-divider)' }}>
      <div className="flex items-center flex-shrink-0" style={{ gap: 10 }}>
        <img src="/logo.svg" alt="" width={22} height={22} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 19, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Payload Board
        </span>
      </div>

      <nav aria-label="Profiles" className="flex items-stretch min-w-0 flex-1" style={{ gap: 22, overflowX: 'auto', height: '100%' }}>
        {profiles.map(p => {
          const active = p.id === activeProfileId;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              aria-current={active ? 'true' : undefined}
              className="flex items-center flex-shrink-0"
              style={{
                gap: 8,
                background: 'none',
                border: 'none',
                borderBottom: `3px solid ${active ? 'var(--color-accent)' : 'transparent'}`,
                padding: '3px 2px 0',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: 17,
                fontWeight: active ? 700 : 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              {p.emoji && <span aria-hidden="true" style={{ fontSize: 15 }}>{p.emoji}</span>}
              {p.name}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center flex-shrink-0" style={{ gap: 4 }}>
        <button onClick={onPalette} title="Command palette (Ctrl+K)" aria-label="Open command palette" className="tile-btn">
          <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true" style={{ color: 'var(--color-text-secondary)' }}>
            <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2.2" /><path d="M12 12l6 6" stroke="currentColor" strokeWidth="2.2" />
          </svg>
        </button>
        <button onClick={onNew} title="New profile" aria-label="New profile" className="tile-btn"><Icon icon={faPlus} size={14} /></button>
        <button onClick={onSettings} title="Settings" aria-label="Settings" className="tile-btn"><Icon icon={faGear} size={14} /></button>
      </div>
    </header>
  );
}
