import { useState, useEffect } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { InputField } from '../ui/input';
import { Icon } from '../icons/Icon';
import { faXmark } from '../icons';
import { pickExecutable, pickIconFile } from '../../ipc/profiles';
import { sgdbAutoBg } from '../../ipc/steamgriddb';
import { InstalledAppsPicker } from './InstalledAppsPicker';
import { SteamGridPicker } from './SteamGridPicker';
import type { AppEntry } from '../../types';

function resolveUrl(url: string): string {
  return url.startsWith('http') ? url : convertFileSrc(url);
}

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

export function AppEntryEditor({ open, onClose, onSave, initial }: AppEntryEditorProps) {
  const [isEditing, setIsEditing] = useState(Boolean(initial?.id));
  const [form, setForm] = useState<Omit<AppEntry, 'id' | 'order'>>({ ...defaults, ...initial });
  const [argsStr, setArgsStr] = useState((initial?.args ?? []).join(' '));
  const [picking, setPicking] = useState(false);
  const [bgPicking, setBgPicking] = useState(false);
  const [bgAutoLoading, setBgAutoLoading] = useState(false);
  const [installedPickerOpen, setInstalledPickerOpen] = useState(false);
  const [sgdbPickerOpen, setSgdbPickerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIsEditing(Boolean(initial?.id));
    setForm({ ...defaults, ...initial });
    setArgsStr((initial?.args ?? []).join(' '));
  }, [open]);

  const autoFetchBg = (name: string, currentBg?: string) => {
    if (currentBg || !name.trim()) return;
    setBgAutoLoading(true);
    sgdbAutoBg(name)
      .then(url => setForm(f => ({ ...f, background_url: f.background_url ?? url })))
      .catch(() => { /* no API key or no results — silently ignore */ })
      .finally(() => setBgAutoLoading(false));
  };

  const handleBrowse = async () => {
    setPicking(true);
    try {
      const result = await pickExecutable();
      setForm(f => {
        const name = f.name || result.suggested_name;
        autoFetchBg(name, f.background_url);
        return { ...f, executable_path: result.path, name };
      });
    } catch { /* cancelled */ } finally {
      setPicking(false);
    }
  };

  const handleLocalBg = async () => {
    setBgPicking(true);
    try {
      const path = await pickIconFile();
      setForm(f => ({ ...f, background_url: path }));
    } catch { /* cancelled */ } finally {
      setBgPicking(false);
    }
  };

  const handleSave = () => {
    if (form.name.trim() && form.executable_path.trim()) {
      const args = argsStr.trim() ? argsStr.trim().split(/\s+/) : [];
      onSave({ ...form, args });
      setForm(defaults);
      setArgsStr('');
      onClose();
    }
  };

  return (
    <>
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
              {isEditing ? 'Edit Application' : 'Add Application'}
            </span>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0 }}
            >
              <Icon icon={faXmark} size={14} />
            </button>
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-3">
            <InputField
              label="Name"
              placeholder="App name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              autoFocus
            />

            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                Executable
              </div>
              <div className="flex gap-2">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input
                    value={form.executable_path}
                    onChange={e => setForm(f => ({ ...f, executable_path: e.target.value }))}
                    placeholder="/path/to/executable"
                    className="h-7 w-full min-w-0 rounded-lg border px-2 py-1 outline-none transition-colors bg-[var(--color-bg-base)] border-[rgba(176,169,198,0.3)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[rgba(93,90,242,1)] disabled:pointer-events-none disabled:opacity-50"
                    style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 400 }}
                  />
                </div>
                <Button variant="default" size="default" onClick={handleBrowse} disabled={picking}>
                  Browse
                </Button>
                <Button variant="default" size="default" onClick={() => setInstalledPickerOpen(true)} disabled={picking}>
                  Installed...
                </Button>
              </div>
            </div>

            <InputField
              label="Arguments"
              placeholder="--no-update --windowed"
              value={argsStr}
              onChange={e => setArgsStr(e.target.value)}
              style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}
            />

            <InputField
              label="Launch Delay (ms)"
              type="number"
              value={form.launch_delay_ms}
              onChange={e => setForm(f => ({ ...f, launch_delay_ms: Number(e.target.value) }))}
              min={0}
              step={500}
            />

            {/* Process priority */}
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                Process Priority
              </div>
              <div className="flex gap-1.5">
                {(['low', 'normal', 'high'] as const).map(p => (
                  <Button
                    key={p}
                    variant={(form.priority ?? 'normal') === p ? 'fill' : 'default'}
                    size="default"
                    onClick={() => setForm(f => ({ ...f, priority: p === 'normal' ? undefined : p }))}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Background art */}
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                Background art
              </div>
              <div className="flex items-center gap-2">
                {form.background_url ? (
                  <img
                    src={resolveUrl(form.background_url)}
                    alt=""
                    style={{
                      height: 36,
                      width: 77,
                      objectFit: 'cover',
                      borderRadius: 4,
                      border: '1px solid var(--color-border-subtle)',
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
                      background: 'var(--color-bg-elevated)',
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 9, fontFamily: 'var(--font-body)' }}>
                      {bgAutoLoading ? '...' : 'none'}
                    </span>
                  </div>
                )}
                <Button variant="default" size="sm" onClick={() => setSgdbPickerOpen(true)} disabled={bgPicking}>
                  SteamGridDB...
                </Button>
                <Button variant="default" size="sm" onClick={handleLocalBg} disabled={bgPicking}>
                  Local image...
                </Button>
                {form.background_url && (
                  <Button variant="ghost" size="sm" onClick={() => setForm(f => ({ ...f, background_url: undefined }))}>
                    Clear
                  </Button>
                )}
              </div>
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
            <Button
              variant="fill"
              size="default"
              onClick={handleSave}
              disabled={!form.name.trim() || !form.executable_path.trim()}
            >
              {isEditing ? 'Save' : 'Add App'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <InstalledAppsPicker
        open={installedPickerOpen}
        onClose={() => setInstalledPickerOpen(false)}
        onSelect={picked => {
          setForm(f => {
            const name = f.name || picked.name;
            autoFetchBg(name, f.background_url);
            return {
              ...f,
              executable_path: picked.exe_path ?? f.executable_path,
              name,
            };
          });
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
