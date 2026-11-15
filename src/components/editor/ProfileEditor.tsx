import { useState, useEffect } from 'react';
import { Dialog, DialogContent, ModalHeader, ModalFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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
      fontSize: 11,
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
      <DialogContent>
        <ModalHeader title={isEditing ? 'Edit Profile' : 'New Profile'} />

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
              border: '1px solid var(--color-border-default)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              flexShrink: 0,
            }}>
              {emoji || <span style={{ color: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'var(--font-body)' }}>—</span>}
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
              border: '1px solid var(--color-border-default)',
              borderRadius: 2,
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
                  border: emoji === e ? '1px solid var(--color-accent)' : '1px solid transparent',
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
        <ModalFooter>
          <Button variant="ghost" size="default" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="fill" size="default" onClick={handleSave} disabled={!name.trim()}>
            Save
          </Button>
        </ModalFooter>
      </DialogContent>
    </Dialog>
  );
}
