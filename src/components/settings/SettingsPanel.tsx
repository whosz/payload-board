import { useState, useEffect } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Icon } from '../icons/Icon';
import { faXmark } from '../icons';
import {
  getProfilesDir,
  pickConfigDir,
  setProfilesDir,
  resetAllData,
  openProfilesDir,
  getSgdbKey,
  setSgdbKey,
} from '../../ipc/settings';

type Theme = 'purple' | 'grey';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  onReset: () => void;
}

function SectionLabel({ children, crit }: { children: React.ReactNode; crit?: boolean }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '1px',
        color: crit ? 'var(--color-status-crit)' : 'var(--color-text-secondary)',
        borderBottom: `1px solid ${crit ? 'var(--color-status-crit)' : 'var(--color-border-divider)'}`,
        paddingBottom: 8,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

const THEMES: { value: Theme; label: string }[] = [
  { value: 'purple', label: 'Purple' },
  { value: 'grey', label: 'Grey' },
];

export function SettingsPanel({ open, onClose, theme, onThemeChange, onReset }: SettingsPanelProps) {
  const [version, setVersion] = useState('...');
  const [profilesDir, setProfilesDirState] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [dirLoading, setDirLoading] = useState(false);
  const [sgdbKey, setSgdbKeyState] = useState('');
  const [sgdbSaving, setSgdbSaving] = useState(false);
  const [sgdbStatus, setSgdbStatus] = useState<'saved' | 'error' | null>(null);

  useEffect(() => {
    if (!open) return;
    getVersion().then(setVersion).catch(() => setVersion('?'));
    getProfilesDir().then(setProfilesDirState).catch(() => {});
    getSgdbKey().then(k => setSgdbKeyState(k ?? '')).catch(() => {});
  }, [open]);

  const handleSaveSgdbKey = async () => {
    setSgdbSaving(true);
    setSgdbStatus(null);
    try {
      await setSgdbKey(sgdbKey.trim() || null);
      setSgdbStatus('saved');
    } catch {
      setSgdbStatus('error');
    } finally {
      setSgdbSaving(false);
    }
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
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Settings
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0 }}
          >
            <Icon icon={faXmark} size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-6">

          {/* APPEARANCE */}
          <section>
            <SectionLabel>Appearance</SectionLabel>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              Theme
            </div>
            <div className="flex gap-1.5">
              {THEMES.map(t => (
                <Button
                  key={t.value}
                  variant={theme === t.value ? 'fill' : 'default'}
                  size="default"
                  onClick={() => onThemeChange(t.value)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </section>

          {/* STEAMGRIDDB */}
          <section>
            <SectionLabel>SteamGridDB</SectionLabel>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 400, lineHeight: '16px', letterSpacing: '0.25px', color: 'var(--color-text-primary)', marginBottom: 8 }}>
              API key from steamgriddb.com/api — used to fetch game background artwork for tiles.
            </div>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Paste API key..."
                value={sgdbKey}
                onChange={e => { setSgdbKeyState(e.target.value); setSgdbStatus(null); }}
                onKeyDown={e => e.key === 'Enter' && handleSaveSgdbKey()}
                style={{ flex: 1 }}
              />
              <Button variant="default" size="default" onClick={handleSaveSgdbKey} disabled={sgdbSaving}>
                Save
              </Button>
            </div>
            {sgdbStatus && (
              <div style={{ marginTop: 6, fontSize: 11, fontFamily: 'var(--font-body)', color: sgdbStatus === 'saved' ? 'var(--color-status-live)' : 'var(--color-status-crit)' }}>
                {sgdbStatus === 'saved' ? 'API key saved.' : 'Failed to save API key.'}
              </div>
            )}
          </section>

          {/* STORAGE */}
          <section>
            <SectionLabel>Storage</SectionLabel>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                color: 'var(--color-text-muted)',
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 8,
                padding: '8px 10px',
                lineHeight: 1.5,
                wordBreak: 'break-all',
                marginBottom: 8,
                cursor: 'pointer',
              }}
              onClick={() => openProfilesDir().catch(() => {})}
              title="Click to open in file manager"
            >
              {profilesDir || '...'}
            </div>
            <div className="flex gap-2">
              <Button variant="default" size="default" disabled={dirLoading} onClick={handleChangeDir}>
                Change directory...
              </Button>
              <Button variant="ghost" size="default" disabled={dirLoading} onClick={handleResetToDefault}>
                Reset to default
              </Button>
            </div>
          </section>

          {/* DANGER ZONE */}
          <section>
            <SectionLabel crit>Danger Zone</SectionLabel>
            {!confirmReset ? (
              <Button variant="destructive" size="default" onClick={() => setConfirmReset(true)}>
                Reset all data
              </Button>
            ) : (
              <div
                className="flex flex-col gap-3 p-3"
                style={{ border: '1px solid var(--color-status-crit)', borderRadius: 8, background: 'var(--color-bg-elevated)' }}
              >
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 400, lineHeight: '16px', letterSpacing: '0.25px', color: 'var(--color-text-primary)' }}>
                  This will permanently delete all profiles and apps. Are you sure?
                </span>
                <div className="flex gap-2">
                  <Button variant="destructive" size="default" onClick={handleReset}>
                    Yes, delete everything
                  </Button>
                  <Button variant="default" size="default" onClick={() => setConfirmReset(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* ABOUT */}
          <section>
            <SectionLabel>About</SectionLabel>
            <div className="flex items-center gap-4">
              <img src="/logo.svg" alt="Payload Board" style={{ width: 48, height: 48, flexShrink: 0 }} />
              <div className="flex flex-col gap-1">
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--color-text-secondary)' }}>
                  Payload Board v{version}
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 400, lineHeight: '16px', letterSpacing: '0.25px', color: 'var(--color-text-primary)' }}>
                  Made by Matt · github.com/whosz/payload-board
                </span>
              </div>
            </div>
          </section>

        </div>
      </DialogContent>
    </Dialog>
  );
}
