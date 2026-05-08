import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { Profile } from '../../types';

const EMOJI_LIST = [
  '🚀','🎮','💻','🖥','⚙️','🔧','🎯','📊','🏎','🎲','🎵','🎬','📡','🔌','🖱',
  '⌨️','🖨','📱','💾','🗂','📁','📂','🗃','📋','📝','🔑','🔒','🛠','🧰','⚡',
  '🌐','🔭','🧪','🧬','🤖','🦾','👾','🎃','🔥','💡','🌟','⭐','🏆','🥇','🎖',
  '🚗','✈️','🚂','🚀','⛵','🏗','🏭','🏠','🏢','🌍','🌏','☁️','❄️','🌊','🌋',
  '🐉','🦅','🦁','🐺','🦊','🐱','🐶','🐧','🦜','🦋','🐝','🌿','🍀','🌴','🌸',
];

interface ProfileEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (fields: { name: string; emoji?: string; description?: string }) => void;
  initial?: Partial<Pick<Profile, 'name' | 'emoji' | 'description'>>;
}

const labelStyle: React.CSSProperties = {
  color: 'var(--color-text-secondary)',
  fontSize: 11,
  fontFamily: 'monospace',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  background: 'var(--color-bg-surface)',
  borderColor: 'var(--color-border-default)',
  color: 'var(--color-text-primary)',
};

export function ProfileEditor({ open, onClose, onSave, initial }: ProfileEditorProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');

  useEffect(() => {
    setName(initial?.name ?? '');
    setEmoji(initial?.emoji ?? '');
    setDescription(initial?.description ?? '');
  }, [open]);

  const handleSave = () => {
    if (name.trim()) {
      onSave({
        name: name.trim(),
        emoji: emoji || undefined,
        description: description.trim() || undefined,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-default)',
          boxShadow: 'none',
          maxWidth: 480,
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="font-mono uppercase tracking-wider text-sm"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {initial?.name ? 'Edit Profile' : 'New Profile'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div>
            <div style={labelStyle}>Name</div>
            <Input
              placeholder="Profile name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoFocus
              style={inputStyle}
            />
          </div>

          <div>
            <div style={labelStyle}>Icon (emoji)</div>
            <div className="flex items-center gap-3 mb-2">
              <div
                style={{
                  width: 40,
                  height: 40,
                  border: '1px solid var(--color-border-default)',
                  background: 'var(--color-bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                {emoji || <span style={{ color: 'var(--color-text-disabled)', fontSize: 10, fontFamily: 'monospace' }}>NONE</span>}
              </div>
              {emoji && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEmoji('')}
                  style={{ color: 'var(--color-text-muted)', fontSize: 12 }}
                >
                  Clear
                </Button>
              )}
            </div>
            <div
              className="flex flex-wrap gap-1 p-2"
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-subtle)',
                maxHeight: 120,
                overflowY: 'auto',
              }}
            >
              {EMOJI_LIST.map(e => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  style={{
                    background: emoji === e ? 'var(--color-bg-hover)' : 'none',
                    border: emoji === e ? '1px solid var(--color-accent-laser)' : '1px solid transparent',
                    cursor: 'pointer',
                    fontSize: 18,
                    padding: '2px 4px',
                    lineHeight: 1.4,
                    borderRadius: 0,
                    transition: 'background 0.1s',
                  }}
                  title={e}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={labelStyle}>Description (optional)</div>
            <Input
              placeholder="Short description..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            style={{ color: 'var(--color-text-muted)' }}
          >
            Cancel
          </Button>
          <Button
            variant="cockpit"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
