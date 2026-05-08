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
        width: 220,
        minWidth: 220,
        background: '#111113',
        borderRight: '1px solid #1F1F22',
      }}
    >
      <div
        className="px-3 py-2 text-xs font-mono uppercase tracking-widest"
        style={{ color: '#54545A', borderBottom: '1px solid #1F1F22' }}
      >
        Profiles
      </div>

      <div className="flex-1 overflow-y-auto">
        {profiles.map(profile => (
          <button
            key={profile.id}
            onClick={() => onSelect(profile.id)}
            className="w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer"
            style={{
              background: activeProfileId === profile.id ? '#1C1C1F' : 'transparent',
              color: activeProfileId === profile.id ? '#E8E8EA' : '#8A8A90',
              border: 'none',
              borderLeft: activeProfileId === profile.id
                ? '2px solid #FFE600'
                : '2px solid transparent',
            }}
          >
            {profile.name}
          </button>
        ))}
      </div>

      <div style={{ borderTop: '1px solid #1F1F22' }}>
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
          style={{ color: '#54545A', background: 'transparent', border: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#E8E8EA')}
          onMouseLeave={e => (e.currentTarget.style.color = '#54545A')}
        >
          <Icon icon={faPlus} size={11} />
          New Profile
        </button>
      </div>
    </aside>
  );
}
