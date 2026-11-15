import { useState, useEffect } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Dialog, DialogContent, ModalHeader, ModalFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { InputField } from '../ui/input';
import { Switch } from '../ui/switch';
import { pickExecutable, pickIconFile } from '../../ipc/profiles';
import { sgdbAutoBg } from '../../ipc/steamgriddb';
import { InstalledAppsPicker } from './InstalledAppsPicker';
import { SteamGridPicker } from './SteamGridPicker';
import type { AppEntry } from '../../types';
import { t } from '../../i18n';

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
        <DialogContent>
        <ModalHeader title={isEditing ? t('Edit application') : t('Add application')} />

          {/* Fields */}
          <div className="flex flex-col gap-3">
            <InputField
              label={t('Name')}
              placeholder={t('App name')}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              autoFocus
            />

            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 6 }}>
                {t('Executable')}
              </div>
              <div className="flex gap-2">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input
                    value={form.executable_path}
                    onChange={e => setForm(f => ({ ...f, executable_path: e.target.value }))}
                    placeholder={t('/path/to/executable')}
                    className="h-9 w-full min-w-0 rounded-[2px] border px-2 py-1 outline-none transition-colors bg-[var(--color-bg-base)] border-[var(--color-border-control)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] disabled:pointer-events-none disabled:opacity-50"
                    style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 400 }}
                  />
                </div>
                <Button variant="default" size="default" onClick={handleBrowse} disabled={picking}>
                  {t('Browse')}
                </Button>
                <Button variant="default" size="default" onClick={() => setInstalledPickerOpen(true)} disabled={picking}>
                  {t('Installed…')}
                </Button>
              </div>
            </div>

            {navigator.userAgent.includes('Windows') && (
              <div className="flex items-center gap-3">
                <Switch
                  checked={!!form.launch_minimised}
                  onCheckedChange={v => setForm(f => ({ ...f, launch_minimised: v || undefined }))}
                />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text-secondary)' }}>
                  {t('Launch minimised')}
                </span>
              </div>
            )}

            <InputField
              label={t('Arguments')}
              placeholder={t('--no-update --windowed')}
              value={argsStr}
              onChange={e => setArgsStr(e.target.value)}
              style={{ fontFamily: 'var(--font-body)', fontSize: 14 }}
            />

            {/* Process priority */}
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 6 }}>
                {t('Process priority')}
              </div>
              <div className="flex gap-1.5">
                {(['low', 'normal', 'high'] as const).map(p => (
                  <Button
                    key={p}
                    variant={(form.priority ?? 'normal') === p ? 'fill' : 'default'}
                    size="default"
                    onClick={() => setForm(f => ({ ...f, priority: p === 'normal' ? undefined : p }))}
                  >
                    {p === 'low' ? t('Low') : p === 'high' ? t('High') : t('Normal')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Restart on crash */}
            <div>
              <div className="flex items-center gap-3">
                <Switch
                  aria-label={t('Restart if it crashes')}
                  checked={!!form.restart_on_crash}
                  onCheckedChange={v => setForm(f => ({ ...f, restart_on_crash: v || undefined }))}
                />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text-secondary)' }}>
                  {t('Restart if it crashes')}
                </span>
              </div>
              {form.restart_on_crash && (
                <div className="flex items-center gap-1.5" style={{ marginTop: 10 }} role="group" aria-label={t('Maximum restart attempts')}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginRight: 6 }}>
                    {t('Max attempts')}
                  </span>
                  {[1, 2, 3, 5].map(n => (
                    <Button
                      key={n}
                      variant={(form.max_retries ?? 3) === n ? 'fill' : 'default'}
                      size="default"
                      aria-pressed={(form.max_retries ?? 3) === n}
                      onClick={() => setForm(f => ({ ...f, max_retries: n === 3 ? undefined : n }))}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Background art */}
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 6 }}>
                {t('Background art')}
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
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'var(--font-body)' }}>
                      {bgAutoLoading ? '…' : t('none')}
                    </span>
                  </div>
                )}
                <Button variant="default" size="sm" onClick={() => setSgdbPickerOpen(true)} disabled={bgPicking}>
                  {t('SteamGridDB…')}
                </Button>
                <Button variant="default" size="sm" onClick={handleLocalBg} disabled={bgPicking}>
                  {t('Local image…')}
                </Button>
                {form.background_url && (
                  <Button variant="ghost" size="sm" onClick={() => setForm(f => ({ ...f, background_url: undefined }))}>
                    {t('Clear')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <ModalFooter>
            <Button variant="ghost" size="default" onClick={onClose}>
              {t('Cancel')}
            </Button>
            <Button
              variant="fill"
              size="default"
              onClick={handleSave}
              disabled={!form.name.trim() || !form.executable_path.trim()}
            >
              {isEditing ? t('Save') : t('Add app')}
            </Button>
          </ModalFooter>
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
