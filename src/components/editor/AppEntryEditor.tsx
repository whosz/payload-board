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
import { pickExecutable } from '../../ipc/profiles';
import type { AppEntry } from '../../types';

interface AppEntryEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (entry: Omit<AppEntry, 'id' | 'order'>) => void;
  initial?: Partial<AppEntry>;
}

const defaults: Omit<AppEntry, 'id' | 'order'> = {
  name: '',
  executable_path: '',
  args: [],
  launch_delay_ms: 0,
  wait_strategy: 'fire_and_forget',
  enabled: true,
};

const labelStyle: React.CSSProperties = {
  color: '#8A8A90',
  fontSize: 11,
  fontFamily: 'monospace',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  background: '#111113',
  borderColor: '#2A2A2F',
  color: '#E8E8EA',
};

export function AppEntryEditor({ open, onClose, onSave, initial }: AppEntryEditorProps) {
  const [form, setForm] = useState<Omit<AppEntry, 'id' | 'order'>>({ ...defaults, ...initial });
  const [picking, setPicking] = useState(false);

  const handleBrowse = async () => {
    setPicking(true);
    try {
      const result = await pickExecutable();
      setForm(f => ({
        ...f,
        executable_path: result.path,
        name: f.name || result.suggested_name,
        icon_cache_path: result.icon_path ?? undefined,
      }));
    } catch {
      // user cancelled — no action needed
    } finally {
      setPicking(false);
    }
  };

  const handleSave = () => {
    if (form.name.trim() && form.executable_path.trim()) {
      onSave(form);
      setForm(defaults);
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
          maxWidth: 480,
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="font-mono uppercase tracking-wider text-sm"
            style={{ color: '#E8E8EA' }}
          >
            Add Application
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-4">
          <div>
            <div style={labelStyle}>Name</div>
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="App name"
              style={inputStyle}
            />
          </div>

          <div>
            <div style={labelStyle}>Executable</div>
            <div className="flex gap-2">
              <Input
                value={form.executable_path}
                onChange={e => setForm(f => ({ ...f, executable_path: e.target.value }))}
                placeholder="/path/to/executable"
                className="flex-1 font-mono text-xs"
                style={inputStyle}
              />
              <Button
                variant="outline"
                onClick={handleBrowse}
                disabled={picking}
                style={{ borderColor: '#2A2A2F', color: '#8A8A90' }}
              >
                Browse
              </Button>
            </div>
          </div>

          <div>
            <div style={labelStyle}>Launch Delay (ms)</div>
            <Input
              type="number"
              value={form.launch_delay_ms}
              onChange={e => setForm(f => ({ ...f, launch_delay_ms: Number(e.target.value) }))}
              min={0}
              step={500}
              style={inputStyle}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} style={{ color: '#54545A' }}>
            Cancel
          </Button>
          <Button
            variant="cockpit"
            onClick={handleSave}
            disabled={!form.name.trim() || !form.executable_path.trim()}
          >
            Add App
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
