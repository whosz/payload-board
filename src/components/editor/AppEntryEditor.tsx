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
import { pickExecutable } from '../../ipc/profiles';
import { InstalledAppsPicker } from './InstalledAppsPicker';
import { SteamGridPicker } from './SteamGridPicker';
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

export function AppEntryEditor({ open, onClose, onSave, initial }: AppEntryEditorProps) {
  const isEditing = Boolean(initial?.id);
  const [form, setForm] = useState<Omit<AppEntry, 'id' | 'order'>>({ ...defaults, ...initial });

  const [installedPickerOpen, setInstalledPickerOpen] = useState(false);
  const [sgdbPickerOpen, setSgdbPickerOpen] = useState(false);

  useEffect(() => {
    setForm({ ...defaults, ...initial });
  }, [open]);
  const [picking, setPicking] = useState(false);

  const handleBrowse = async () => {
    setPicking(true);
    try {
      const result = await pickExecutable();
      setForm(f => ({
        ...f,
        executable_path: result.path,
        name: f.name || result.suggested_name,
      }));
    } catch {
      // user cancelled
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
    <>
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
            {isEditing ? 'Edit Application' : 'Add Application'}
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
                style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}
              >
                Browse
              </Button>
              <Button
                variant="outline"
                onClick={() => setInstalledPickerOpen(true)}
                disabled={picking}
                style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)', fontSize: 12, whiteSpace: 'nowrap' }}
              >
                Installed...
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

          <div>
            <div style={labelStyle}>Background art</div>
            <div className="flex items-center gap-2">
              {form.background_url ? (
                <img
                  src={form.background_url}
                  alt=""
                  style={{
                    height: 36,
                    width: 77,
                    objectFit: 'cover',
                    border: '1px solid var(--color-border-default)',
                    flexShrink: 0,
                  }}
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div
                  style={{
                    height: 36,
                    width: 77,
                    border: '1px solid var(--color-border-subtle)',
                    background: 'var(--color-bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: 'var(--color-text-disabled)', fontSize: 9, fontFamily: 'monospace' }}>NONE</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSgdbPickerOpen(true)}
                style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)', fontSize: 12 }}
              >
                SteamGridDB...
              </Button>
              {form.background_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setForm(f => ({ ...f, background_url: undefined }))}
                  style={{ color: 'var(--color-text-muted)', fontSize: 12 }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} style={{ color: 'var(--color-text-muted)' }}>
            Cancel
          </Button>
          <Button
            variant="cockpit"
            onClick={handleSave}
            disabled={!form.name.trim() || !form.executable_path.trim()}
          >
            {isEditing ? 'Save' : 'Add App'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <InstalledAppsPicker
      open={installedPickerOpen}
      onClose={() => setInstalledPickerOpen(false)}
      onSelect={app => {
        setForm(f => ({
          ...f,
          executable_path: app.exe_path ?? f.executable_path,
          name: f.name || app.name,
        }));
      }}
    />
    <SteamGridPicker
      open={sgdbPickerOpen}
      onClose={() => setSgdbPickerOpen(false)}
      initialQuery={form.name}
      onSelect={url => setForm(f => ({ ...f, background_url: url }))}
    />
    </>
  );
}
