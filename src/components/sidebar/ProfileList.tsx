import { Icon } from '../icons/Icon';
import { faPlus } from '../icons';
import type { Profile } from '../../types';

interface ProfileListProps {
  profiles: Profile[];
  activeProfileId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function ProfileList({ profiles, activeProfileId, onSelect, onNew }: ProfileListProps) {
  return (
    <aside
      className="flex flex-col h-full"
      style={{
        background: '#111113',
        borderRight: '1px solid #1F1F22',
      }}
    >
      <div
        className="px-4 py-3 font-mono uppercase tracking-widest text-xs"
        style={{ color: '#54545A', borderBottom: '1px solid #1F1F22' }}
      >
        Profiles
      </div>

      <div className="flex-1 overflow-y-auto">
        {profiles.map(profile => (
          <button
            key={profile.id}
            onClick={() => onSelect(profile.id)}
            className="w-full text-left px-4 py-3 transition-colors cursor-pointer"
            style={{
              background: activeProfileId === profile.id ? '#1C1C1F' : 'transparent',
              color: activeProfileId === profile.id ? '#E8E8EA' : '#8A8A90',
              border: 'none',
              borderLeft: activeProfileId === profile.id
                ? '3px solid #FFE600'
                : '3px solid transparent',
              fontSize: 14,
            }}
            onMouseEnter={e => {
              if (profile.id !== activeProfileId)
                e.currentTarget.style.background = '#161618';
            }}
            onMouseLeave={e => {
              if (profile.id !== activeProfileId)
                e.currentTarget.style.background = 'transparent';
            }}
          >
            {profile.name}
          </button>
        ))}
      </div>

      <div style={{ borderTop: '1px solid #1F1F22' }}>
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-4 py-3 font-mono uppercase tracking-wider cursor-pointer"
          style={{ color: '#54545A', background: 'transparent', border: 'none', fontSize: 12, transition: 'color 0.1s, background 0.1s' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#E8E8EA';
            e.currentTarget.style.background = '#161618';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#54545A';
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
