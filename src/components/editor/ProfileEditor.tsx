import { useState, useEffect } from 'react';
import { Dialog, DialogContent, ModalHeader, ModalFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ACCENT_PRESETS } from '../../lib/accent';
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
  onSave: (fields: { name: string; emoji?: string; color_accent?: string }) => void;
  initial?: Partial<Pick<Profile, 'name' | 'emoji' | 'color_accent'>>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
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
  const [accent, setAccent] = useState(initial?.color_accent ?? '');

  useEffect(() => {
    if (!open) return;
    setIsEditing(Boolean(initial?.name));
    setName(initial?.name ?? '');
    setEmoji(initial?.emoji ?? '');
    setAccent(initial?.color_accent ?? '');
  }, [open]);

  const handleSave = () => {
    if (name.trim()) {
      onSave({
        name: name.trim(),
        emoji: emoji || undefined,
        color_accent: accent || undefined,
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

        {/* Accent colour */}
        <div>
          <FieldLabel>Accent colour</FieldLabel>
          <div className="flex items-center flex-wrap" style={{ gap: 8 }} role="group" aria-label="Accent colour">
            <button
              onClick={() => setAccent('')}
              aria-label="Default accent"
              aria-pressed={!accent}
              title="Default"
              style={{
                width: 32, height: 32, borderRadius: 2, cursor: 'pointer', background: 'var(--color-bg-elevated)',
                border: `2px solid ${!accent ? 'var(--color-text-primary)' : 'var(--color-border-control)'}`,
                color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
              }}
            >
              A
            </button>
            {ACCENT_PRESETS.map(p => (
              <button
                key={p.color}
                onClick={() => setAccent(p.color)}
                aria-label={p.name}
                aria-pressed={accent === p.color}
                title={p.name}
                style={{
                  width: 32, height: 32, borderRadius: 2, cursor: 'pointer', background: p.color,
                  border: `2px solid ${accent === p.color ? 'var(--color-text-primary)' : 'transparent'}`,
                  outlineOffset: -4,
                  boxShadow: accent === p.color ? 'inset 0 0 0 2px var(--color-bg-surface)' : 'none',
                }}
              />
            ))}
          </div>
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
