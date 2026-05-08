import { useState, useEffect } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import {
  getProfilesDir,
  pickConfigDir,
  setProfilesDir,
  resetAllData,
  openProfilesDir,
} from '../../ipc/settings';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  onThemeChange: (t: 'dark' | 'light') => void;
  onReset: () => void;
}

function SectionLabel({ children, crit }: { children: React.ReactNode; crit?: boolean }) {
  return (
    <div
      className="font-mono uppercase tracking-widest text-xs pb-2 mb-3"
      style={{
        color: crit ? 'var(--color-status-crit)' : 'var(--color-text-muted)',
        borderBottom: `1px solid ${crit ? 'var(--color-status-crit)' : 'var(--color-border-subtle)'}`,
        opacity: crit ? 0.8 : 1,
      }}
    >
      {children}
    </div>
  );
}

function SettingsRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 gap-4">
      <span style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{label}</span>
      <div className="flex items-center gap-2 flex-shrink-0">{children}</div>
    </div>
  );
}

export function SettingsPanel({ open, onClose, theme, onThemeChange, onReset }: SettingsPanelProps) {
  const [version, setVersion] = useState('...');
  const [profilesDir, setProfilesDirState] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [dirLoading, setDirLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    getVersion().then(setVersion).catch(() => setVersion('?'));
    getProfilesDir().then(setProfilesDirState).catch(() => {});
  }, [open]);

  const handleOpenDir = async () => {
    try { await openProfilesDir(); }
    catch { /* ignore */ }
  };

  const handleChangeDir = async () => {
    setDirLoading(true);
    try {
      const picked = await pickConfigDir();
      if (picked) {
        await setProfilesDir(picked);
        setProfilesDirState(picked);
      }
    } catch { /* ignore */ } finally {
      setDirLoading(false);
    }
  };

  const handleResetToDefault = async () => {
    setDirLoading(true);
    try {
      await setProfilesDir(null);
      const dir = await getProfilesDir();
      setProfilesDirState(dir);
    } catch { /* ignore */ } finally {
      setDirLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetAllData();
      setConfirmReset(false);
      onReset();
      onClose();
    } catch { /* ignore */ }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setConfirmReset(false); onClose(); } }}>
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
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-2">

          {/* APPEARANCE */}
          <section>
            <SectionLabel>Appearance</SectionLabel>
            <SettingsRow label="Light mode">
              <Switch
                checked={theme === 'light'}
                onCheckedChange={checked => onThemeChange(checked ? 'light' : 'dark')}
              />
            </SettingsRow>
          </section>

          {/* STORAGE */}
          <section>
            <SectionLabel>Storage</SectionLabel>
            <SettingsRow label="Config directory">
              <button
                onClick={handleOpenDir}
                className="font-mono text-xs truncate max-w-48 cursor-pointer"
                style={{
                  color: 'var(--color-text-muted)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  textAlign: 'right',
                  textDecoration: 'underline',
                  textDecorationColor: 'var(--color-border-default)',
                }}
                title={profilesDir}
              >
                {profilesDir || '...'}
              </button>
            </SettingsRow>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                disabled={dirLoading}
                onClick={handleChangeDir}
                style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)', fontSize: 12 }}
              >
                Change directory...
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={dirLoading}
                onClick={handleResetToDefault}
                style={{ color: 'var(--color-text-muted)', fontSize: 12 }}
              >
                Reset to default
              </Button>
            </div>
          </section>

          {/* DANGER ZONE */}
          <section>
            <SectionLabel crit>Danger Zone</SectionLabel>
            {!confirmReset ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmReset(true)}
                className="font-mono uppercase tracking-wider"
              >
                Reset all data
              </Button>
            ) : (
              <div
                className="flex flex-col gap-3 p-3"
                style={{ border: '1px solid var(--color-status-crit)', background: 'var(--color-bg-surface)' }}
              >
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                  This will permanently delete all profiles and apps. Are you sure?
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleReset}
                    className="font-mono uppercase tracking-wider"
                  >
                    Yes, delete everything
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmReset(false)}
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* ABOUT */}
          <section>
            <SectionLabel>About</SectionLabel>
            <div className="flex flex-col gap-1" style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>
                Payload Board v{version}
              </span>
              <span style={{ color: 'var(--color-text-muted)' }}>
                Made by Matt · hello@whosz.pl
              </span>
              <span style={{ color: 'var(--color-text-muted)' }}>
                github.com/whosz/payload-board
              </span>
            </div>
          </section>

        </div>
      </DialogContent>
    </Dialog>
  );
}
