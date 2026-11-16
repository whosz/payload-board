import { useState, useEffect } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { Dialog, DialogContent, ModalHeader } from '../ui/dialog';
import { ShortcutsSection } from './ShortcutsSection';
import { getBoolSetting, setBoolSetting, checkForUpdate, type BoolSetting, type UpdateInfo } from '../../ipc/settings';
import type { ShortcutsApi } from '../../hooks/useShortcuts';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import {
  getProfilesDir,
  pickConfigDir,
  setProfilesDir,
  resetAllData,
  openProfilesDir,
  getSgdbKey,
  setSgdbKey,
  getAutostart,
  setAutostart,
  getStartMinimisedToTray,
  setStartMinimisedToTray,
  getMinimiseOnClose,
  setMinimiseOnClose,
} from '../../ipc/settings';
import { SGDB_API_URL, openExternal } from '../../lib/links';
import { t, getLanguage, setLanguage, LANGUAGES } from '../../i18n';

type Theme = 'dark' | 'grey' | 'light';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  onReset: () => void;
  shortcuts: ShortcutsApi;
  /** tab shown when the dialog opens */
  initialTab?: 'appearance' | 'general' | 'shortcuts' | 'data' | 'about';
}

function SectionLabel({ children, crit }: { children: React.ReactNode; crit?: boolean }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: crit ? 'var(--color-status-crit)' : 'var(--color-text-muted)',
        borderBottom: `1px solid ${crit ? 'var(--color-status-crit)' : 'var(--color-border-divider)'}`,
        paddingBottom: 8,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function CrashSettings() {
  const [values, setValues] = useState<Record<BoolSetting, boolean>>({ notify_on_crash: true, auto_restart_enabled: true, check_updates: true });
  useEffect(() => {
    (['notify_on_crash', 'auto_restart_enabled', 'check_updates'] as const).forEach(k =>
      getBoolSetting(k).then(v => setValues(prev => ({ ...prev, [k]: v }))).catch(() => {}));
  }, []);
  const rows: { key: BoolSetting; label: string; hint: string }[] = [
    { key: 'notify_on_crash', label: t('Notify when an app crashes'), hint: t('System notification, only when this window is not in front.') },
    { key: 'auto_restart_enabled', label: t('Allow auto-restart'), hint: t('Master switch. Each app opts in under Restart if it crashes.') },
    { key: 'check_updates', label: t('Check for updates on startup'), hint: t('Asks GitHub once at launch whether a newer release exists.') },
  ];
  return (
    <div className="flex flex-col gap-3">
      {rows.map(r => (
        <div key={r.key} className="flex items-center gap-3">
          <Switch
            aria-label={r.label}
            checked={values[r.key]}
            onCheckedChange={v => { setValues(prev => ({ ...prev, [r.key]: v })); setBoolSetting(r.key, v).catch(() => setValues(prev => ({ ...prev, [r.key]: !v }))); }}
          />
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text-secondary)' }}>{r.label}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-muted)' }}>{r.hint}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const THEMES: { value: Theme; label: () => string }[] = [
  { value: 'dark', label: () => t('Dark') },
  { value: 'grey', label: () => t('Grey') },
  { value: 'light', label: () => t('Light') },
];

export function SettingsPanel({ open, onClose, theme, onThemeChange, onReset, shortcuts, initialTab = 'appearance' }: SettingsPanelProps) {
  const [version, setVersion] = useState('...');
  const [profilesDir, setProfilesDirState] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [dirLoading, setDirLoading] = useState(false);
  const [sgdbKey, setSgdbKeyState] = useState('');
  const [sgdbSaving, setSgdbSaving] = useState(false);
  const [sgdbStatus, setSgdbStatus] = useState<'saved' | 'error' | null>(null);
  const [updateState, setUpdateState] = useState<'checking' | 'latest' | 'error' | UpdateInfo | null>(null);
  const handleCheckUpdate = () => {
    setUpdateState('checking');
    checkForUpdate().then(u => setUpdateState(u ?? 'latest')).catch(() => setUpdateState('error'));
  };
  const [autostart, setAutostartState] = useState(false);
  const [startMinimised, setStartMinimisedState] = useState(false);
  const [minimiseOnClose, setMinimiseOnCloseState] = useState(false);

  useEffect(() => {
    if (!open) return;
    getVersion().then(setVersion).catch(() => setVersion('?'));
    getProfilesDir().then(setProfilesDirState).catch(() => {});
    getSgdbKey().then(k => setSgdbKeyState(k ?? '')).catch(() => {});
    getAutostart().then(setAutostartState).catch(() => {});
    getStartMinimisedToTray().then(setStartMinimisedState).catch(() => {});
    getMinimiseOnClose().then(setMinimiseOnCloseState).catch(() => {});
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
      <DialogContent width={600}>
        <ModalHeader title={t('Settings')} />

        <TabsPrimitive.Root defaultValue={initialTab}>
          <TabsPrimitive.List className="stabs" aria-label={t('Settings')}>
            <TabsPrimitive.Tab value="appearance" className="stab">{t('Appearance')}</TabsPrimitive.Tab>
            <TabsPrimitive.Tab value="general" className="stab">{t('General')}</TabsPrimitive.Tab>
            <TabsPrimitive.Tab value="shortcuts" className="stab">{t('Shortcuts')}</TabsPrimitive.Tab>
            <TabsPrimitive.Tab value="data" className="stab">{t('Data')}</TabsPrimitive.Tab>
            <TabsPrimitive.Tab value="about" className="stab">{t('About')}</TabsPrimitive.Tab>
          </TabsPrimitive.List>
          <TabsPrimitive.Panel value="appearance" className="spanel flex flex-col gap-6">
          <section>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              {t('Theme')}
            </div>
            <div className="flex gap-1.5" style={{ marginBottom: 16 }}>
              {THEMES.map(th => (
                <Button
                  key={th.value}
                  variant={theme === th.value ? 'fill' : 'default'}
                  size="default"
                  aria-pressed={theme === th.value}
                  onClick={() => onThemeChange(th.value)}
                >
                  {th.label()}
                </Button>
              ))}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              {t('Language')}
            </div>
            <div className="flex flex-wrap gap-1.5" style={{ marginBottom: 16 }} role="group" aria-label={t('Language')}>
              {LANGUAGES.map(l => (
                <Button
                  key={l.code}
                  variant={getLanguage() === l.code ? 'fill' : 'default'}
                  size="default"
                  aria-pressed={getLanguage() === l.code}
                  lang={l.code}
                  onClick={() => setLanguage(l.code)}
                >
                  {l.label}
                </Button>
              ))}
            </div>
          </section>
          </TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="general" className="spanel flex flex-col gap-6">
          <section>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Switch aria-label={t('Launch on startup')} checked={autostart} onCheckedChange={v => { setAutostartState(v); setAutostart(v).catch(() => setAutostartState(!v)); }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text-secondary)' }}>
                  {t('Launch on startup')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Switch aria-label={t('Start minimised to tray')} checked={startMinimised} onCheckedChange={v => { setStartMinimisedState(v); setStartMinimisedToTray(v).catch(() => setStartMinimisedState(!v)); }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text-secondary)' }}>
                  {t('Start minimised to tray')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Switch aria-label={t('Minimise on close')} checked={minimiseOnClose} onCheckedChange={v => { setMinimiseOnCloseState(v); setMinimiseOnClose(v).catch(() => setMinimiseOnCloseState(!v)); }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text-secondary)' }}>
                  {t('Minimise on close')}
                </span>
              </div>
            </div>
          </section>

          <section>
            <SectionLabel>{t('Crashes')}</SectionLabel>
            <CrashSettings />
          </section>
          </TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="shortcuts" className="spanel flex flex-col gap-6">
          <section>
            <ShortcutsSection api={shortcuts} />
          </section>
          </TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="data" className="spanel flex flex-col gap-6">
          <section>
            <SectionLabel>SteamGridDB</SectionLabel>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 400, lineHeight: '16px', letterSpacing: '0.25px', color: 'var(--color-text-primary)', marginBottom: 8 }}>
              {t('API key from steamgriddb.com/api — used to fetch game background artwork for tiles.')}
            </div>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder={t('Paste API key…')}
                value={sgdbKey}
                onChange={e => { setSgdbKeyState(e.target.value); setSgdbStatus(null); }}
                onKeyDown={e => e.key === 'Enter' && handleSaveSgdbKey()}
                style={{ flex: 1 }}
              />
              <Button variant="default" size="default" onClick={handleSaveSgdbKey} disabled={sgdbSaving}>
                {t('Save')}
              </Button>
              <Button variant="default" size="default" onClick={() => openExternal(SGDB_API_URL)}>
                {t('Get an API key')}
              </Button>
            </div>
            {sgdbStatus && (
              <div style={{ marginTop: 6, fontSize: 11, fontFamily: 'var(--font-body)', color: sgdbStatus === 'saved' ? 'var(--color-status-live)' : 'var(--color-status-crit)' }}>
                {sgdbStatus === 'saved' ? t('API key saved.') : t('Failed to save API key.')}
              </div>
            )}
          </section>

          <section>
            <SectionLabel>{t('Storage')}</SectionLabel>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                color: 'var(--color-text-muted)',
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 2,
                padding: '8px 10px',
                lineHeight: 1.5,
                wordBreak: 'break-all',
                marginBottom: 8,
                cursor: 'pointer',
              }}
              onClick={() => openProfilesDir().catch(() => {})}
              title={t('Click to open in file manager')}
            >
              {profilesDir || '...'}
            </div>
            <div className="flex gap-2">
              <Button variant="default" size="default" disabled={dirLoading} onClick={handleChangeDir}>
                {t('Change directory…')}
              </Button>
              <Button variant="ghost" size="default" disabled={dirLoading} onClick={handleResetToDefault}>
                {t('Reset to default')}
              </Button>
            </div>
          </section>

          <section>
            <SectionLabel crit>{t('Danger zone')}</SectionLabel>
            {!confirmReset ? (
              <Button variant="destructive" size="default" onClick={() => setConfirmReset(true)}>
                {t('Reset all data')}
              </Button>
            ) : (
              <div
                className="flex flex-col gap-3 p-3"
                style={{ border: '1px solid var(--color-status-crit)', borderRadius: 2, background: 'var(--color-bg-elevated)' }}
              >
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 400, lineHeight: '16px', letterSpacing: '0.25px', color: 'var(--color-text-primary)' }}>
                  {t('This will permanently delete all profiles and apps. Are you sure?')}
                </span>
                <div className="flex gap-2">
                  <Button variant="destructive" size="default" onClick={handleReset}>
                    {t('Yes, delete everything')}
                  </Button>
                  <Button variant="default" size="default" onClick={() => setConfirmReset(false)}>
                    {t('Cancel')}
                  </Button>
                </div>
              </div>
            )}
          </section>
          </TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="about" className="spanel flex flex-col gap-6">
          <section>
            <div className="flex items-center gap-4">
              <img src="/logo.svg" alt="Payload Board" style={{ width: 48, height: 48, flexShrink: 0 }} />
              <div className="flex flex-col gap-1">
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '1px', color: 'var(--color-text-secondary)' }}>
                  Payload Board v{version}
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 400, lineHeight: '16px', letterSpacing: '0.25px', color: 'var(--color-text-primary)' }}>
                  {t('Made by Matt')} · github.com/whosz/payload-board
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3" style={{ marginTop: 16 }}>
              <Button variant="default" size="default" disabled={updateState === 'checking'} onClick={handleCheckUpdate}>
                {t('Check for updates')}
              </Button>
              <span role="status" style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text-secondary)' }}>
                {updateState === 'latest' ? t('You have the latest version')
                  : updateState === 'error' ? t('Could not check for updates')
                  : typeof updateState === 'object' && updateState ? t('Version {version} is available', { version: updateState.version }) : ''}
              </span>
              {typeof updateState === 'object' && updateState && (
                <Button variant="fill" size="default" onClick={() => openExternal(updateState.url)}>{t('Download')}</Button>
              )}
            </div>
          </section>
          </TabsPrimitive.Panel>
        </TabsPrimitive.Root>
      </DialogContent>
    </Dialog>
  );
}
