import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Icon } from '../icons/Icon';
import { faXmark } from '../icons';
import type { Profile } from '../../types';

const EMOJI_LIST = [
  '🚀','🎮','💻','🖥','⚙️','🔧','🎯','📊','🏎','🎲','🎵','🎬','📡','🔌','🖱',
  '⌨️','🖨','📱','💾','🗂','📁','📂','🗃','📋','📝','🔑','🔒','🛠','🧰','⚡',
  '🌐','🔭','🧪','🧬','🤖','🦾','👾','🎃','🔥','💡','🌟','⭐','🏆','🥇','🎖',
  '🚗','✈️','🚂','⛵','🏗','🏭','🏠','🏢','🌍','☁️','❄️','🌊','🌋',
  '🐉','🦅','🦁','🐺','🦊','🐱','🐶','🐧','🦜','🦋','🐝','🌿','🍀','🌴','🌸',
];

interface ProfileEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (fields: { name: string; emoji?: string }) => void;
  initial?: Partial<Pick<Profile, 'name' | 'emoji'>>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-body)',
      fontSize: 10,
      fontWeight: 500,
      color: 'var(--color-text-muted)',
      marginBottom: 6,
    }}>
      {children}
    </div>
  );
}

export function ProfileEditor({ open, onClose, onSave, initial }: ProfileEditorProps) {
  const [isEditing, setIsEditing] = useState(Boolean(initial?.name));
  const [name, setName] = useState(initial?.name ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '');

  useEffect(() => {
    if (!open) return;
    setIsEditing(Boolean(initial?.name));
    setName(initial?.name ?? '');
    setEmoji(initial?.emoji ?? '');
  }, [open]);

  const handleSave = () => {
    if (name.trim()) {
      onSave({
        name: name.trim(),
        emoji: emoji || undefined,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        style={{
          background: 'var(--color-bg-base)',
          border: '1px solid var(--color-border-divider)',
          borderRadius: 8,
          boxShadow: 'none',
          maxWidth: 480,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
          }}>
            {isEditing ? 'Edit Profile' : 'New Profile'}
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0 }}
          >
            <Icon icon={faXmark} size={14} />
          </button>
        </div>

        {/* Name */}
        <div>
          <FieldLabel>Name</FieldLabel>
          <Input
            placeholder="Profile name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
          />
        </div>

        {/* Icon (emoji) */}
        <div>
          <FieldLabel>Icon</FieldLabel>
          <div className="flex items-end gap-2 mb-2">
            {/* Selected emoji display */}
            <div style={{
              width: 40,
              height: 32,
              background: 'var(--color-bg-base)',
              border: '1px solid rgba(176,169,197,0.3)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              flexShrink: 0,
            }}>
              {emoji || <span style={{ color: 'var(--color-text-muted)', fontSize: 10, fontFamily: 'var(--font-body)' }}>—</span>}
            </div>
            {emoji && (
              <Button variant="ghost" size="sm" onClick={() => setEmoji('')}>
                Clear
              </Button>
            )}
          </div>
          {/* Emoji grid */}
          <div
            className="flex flex-wrap gap-0.5 p-2"
            style={{
              background: 'var(--color-bg-base)',
              border: '1px solid rgba(176,169,197,0.3)',
              borderRadius: 8,
              maxHeight: 98,
              overflowY: 'auto',
            }}
          >
            {EMOJI_LIST.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                style={{
                  background: emoji === e ? 'var(--color-bg-elevated)' : 'none',
                  border: emoji === e ? '1px solid rgba(92,89,241,0.6)' : '1px solid transparent',
                  cursor: 'pointer',
                  fontSize: 16,
                  padding: '2px 4px',
                  lineHeight: 1.4,
                  borderRadius: 4,
                  transition: 'background 0.1s',
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 pt-3"
          style={{ borderTop: '1px solid var(--color-border-divider)' }}
        >
          <Button variant="ghost" size="default" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="fill" size="default" onClick={handleSave} disabled={!name.trim()}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
