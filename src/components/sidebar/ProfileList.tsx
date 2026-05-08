import { useState } from 'react';
import { Icon } from '../icons/Icon';
import { faPlus, faXmark } from '../icons';
import type { Profile } from '../../types';

interface ProfileListProps {
  profiles: Profile[];
  activeProfileId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function ProfileList({ profiles, activeProfileId, onSelect, onNew, onDelete }: ProfileListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <aside
      className="flex flex-col h-full"
      style={{
        background: 'var(--color-bg-surface)',
        borderRight: '1px solid var(--color-border-subtle)',
      }}
    >
      <div
        className="px-4 py-3 font-mono uppercase tracking-widest text-xs"
        style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        Profiles
      </div>

      <div className="flex-1 overflow-y-auto">
        {profiles.map(profile => {
          const isActive = activeProfileId === profile.id;
          const isHovered = hoveredId === profile.id;
          return (
            <div
              key={profile.id}
              className="flex items-center"
              style={{
                background: isActive ? 'var(--color-bg-hover)' : isHovered ? 'var(--color-bg-elevated)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--color-accent-laser)' : '3px solid transparent',
                transition: 'background 0.1s',
              }}
              onMouseEnter={() => setHoveredId(profile.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <button
                onClick={() => onSelect(profile.id)}
                className="flex-1 text-left px-4 py-3 cursor-pointer"
                style={{
                  background: 'none',
                  border: 'none',
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  fontSize: 14,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {profile.name}
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(profile.id); }}
                title="Delete profile"
                className="tile-btn"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '2px 10px',
                  cursor: 'pointer',
                  lineHeight: 0,
                  flexShrink: 0,
                  opacity: isHovered ? 0.6 : 0,
                  transition: 'opacity 0.1s',
                }}
              >
                <Icon icon={faXmark} size={11} crit />
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-4 py-3 font-mono uppercase tracking-wider cursor-pointer"
          style={{
            color: 'var(--color-text-muted)',
            background: 'transparent',
            border: 'none',
            fontSize: 12,
            transition: 'color 0.1s, background 0.1s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--color-text-primary)';
            e.currentTarget.style.background = 'var(--color-bg-elevated)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--color-text-muted)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <Icon icon={faPlus} size={13} />
          New Profile
        </button>
      </div>
    </aside>
  );
}
