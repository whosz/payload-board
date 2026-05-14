import { useState } from 'react';
import { Icon } from '../icons/Icon';
import { faPlus, faTrash, faPen, faGear } from '../icons';
import type { Profile } from '../../types';

interface ProfileListProps {
  profiles: Profile[];
  activeProfileId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSettings: () => void;
}

export function ProfileList({ profiles, activeProfileId, onSelect, onNew, onEdit, onDelete, onSettings }: ProfileListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <aside className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-4 py-3"
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
        Profiles
      </div>

      {/* Profile list */}
      <div className="flex-1 overflow-y-auto px-2 flex flex-col gap-0.5">
        {profiles.map(profile => {
          const isActive = activeProfileId === profile.id;
          const isHovered = hoveredId === profile.id;
          const highlighted = isActive || isHovered;
          return (
            <div
              key={profile.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: highlighted ? 'var(--color-row-bg)' : 'transparent',
                borderRadius: 8,
                overflow: 'hidden',
                minHeight: 40,
                transition: 'background 0.1s',
                flexShrink: 0,
              }}
              onMouseEnter={() => setHoveredId(profile.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* State bar — always present, teal when active */}
              <div style={{
                width: 4,
                alignSelf: 'stretch',
                flexShrink: 0,
                background: isActive ? 'var(--color-status-live)' : 'transparent',
                transition: 'background 0.1s',
              }} />

              {/* Button */}
              <button
                onClick={() => onSelect(profile.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0 12px',
                  minHeight: 40,
                  minWidth: 0,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {profile.emoji && (
                  <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontFamily: 'var(--font-body)', lineHeight: 1 }}>{profile.emoji}</span>
                  </span>
                )}
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  fontWeight: 600,
                  lineHeight: '18px',
                  letterSpacing: '0.5px',
                  color: highlighted ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {profile.name}
                </span>
              </button>

              {/* Actions — visible on hover */}
              {isHovered && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', flexShrink: 0 }}>
                  <button
                    onClick={e => { e.stopPropagation(); onEdit(profile.id); }}
                    title="Edit profile"
                    className="tile-btn"
                    style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Icon icon={faPen} size={10} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(profile.id); }}
                    title="Delete profile"
                    className="tile-btn"
                    style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Icon icon={faTrash} size={10} crit />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions — New Profile + Settings */}
      <div style={{ borderTop: '1px solid var(--color-border-divider)', padding: '4px 8px' }}>
        <NavButton icon={<Icon icon={faPlus} size={12} />} label="New Profile" onClick={onNew} />
        <NavButton icon={<Icon icon={faGear} size={12} />} label="Settings" onClick={onSettings} />
      </div>
    </aside>
  );
}

function NavButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center gap-2 cursor-pointer"
      style={{
        background: 'none',
        border: 'none',
        borderRadius: 8,
        padding: '0 6px',
        minHeight: 40,
        color: hovered ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        transition: 'color 0.1s',
      }}
    >
      <span style={{ width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </span>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', lineHeight: '16px', textTransform: 'uppercase' }}>
        {label}
      </span>
    </button>
  );
}
