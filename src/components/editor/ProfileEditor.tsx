import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface ProfileEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  initialName?: string;
}

export function ProfileEditor({ open, onClose, onSave, initialName = '' }: ProfileEditorProps) {
  const [name, setName] = useState(initialName);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent
        style={{
          background: '#161618',
          border: '1px solid #2A2A2F',
          boxShadow: 'none',
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="font-mono uppercase tracking-wider text-sm"
            style={{ color: '#E8E8EA' }}
          >
            {initialName ? 'Edit Profile' : 'New Profile'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Input
            placeholder="Profile name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
            style={{
              background: '#111113',
              borderColor: '#2A2A2F',
              color: '#E8E8EA',
            }}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            style={{ color: '#54545A' }}
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
