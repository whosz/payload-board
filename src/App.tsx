import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
const DesignReference = lazy(() => import('./components/DesignReference').then(m => ({ default: m.DesignReference })));
import { Button } from './components/ui/button';
import { ProfileTabs } from './components/ProfileTabs';
import { Hero } from './components/dashboard/Hero';
import { AppCarousel } from './components/dashboard/AppCarousel';
import { AppsToolbar, type SortOrder, type ViewMode } from './components/dashboard/AppsToolbar';
import { KeyHints } from './components/dashboard/KeyHints';
import { CommandPalette } from './components/CommandPalette';
import { buildPaletteItems } from './lib/palette';
import { AppListRow } from './components/dashboard/AppListRow';
import { ProfileEditor } from './components/editor/ProfileEditor';
import { AppEntryEditor } from './components/editor/AppEntryEditor';
import { SettingsPanel } from './components/settings/SettingsPanel';
import {
  Dialog,
  DialogContent,
  ModalFooter,
  ModalHeader,
} from './components/ui/dialog';
import { Icon } from './components/icons/Icon';
import { faPlus, faXmark } from './components/icons';
import { useProfiles } from './hooks/useProfiles';
import { useProcessStatus } from './hooks/useProcessStatus';
import { startApp, stopApp, restartApp, openPath, stopAll, scanRunningApps } from './ipc/processes';
import { useSequence } from './hooks/useSequence';
import { useSessionSeconds } from './hooks/useSessionSeconds';
import { applyAccent } from './lib/accent';
import { useShortcuts } from './hooks/useShortcuts';
import { t, tx, useLanguage } from './i18n';
import { setActiveProfile } from './ipc/shortcuts';
import { setBackendLanguage } from './ipc/settings';
import type { AppEntry } from './types';

type Theme = 'dark' | 'grey' | 'light';
const THEMES: Theme[] = ['dark', 'grey', 'light'];

interface Toast {
  id: number;
  message: string;
  kind: 'info' | 'warn' | 'error';
}

export default function App() {
  const lang = useLanguage(); // re-render the whole tree when the language changes
  useEffect(() => { setBackendLanguage(lang).catch(() => {}); }, [lang]);
  const {
    profiles,
    activeProfile,
    activeProfileId,
    setActiveProfileId,
    loading,
    createProfile,
    updateProfile,
    removeProfile,
    addApp,
    updateApp,
    removeApp,
    reload,
  } = useProfiles();

  const { getStatus, setErrorStatus, clearErrors } = useProcessStatus();

  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<typeof profiles[0] | undefined>();
  const [appEditorOpen, setAppEditorOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AppEntry | undefined>();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmRemoveApp, setConfirmRemoveApp] = useState<AppEntry | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('manual');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [designRefOpen, setDesignRefOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') setDesignRefOpen(v => !v);
      if (e.key === 'Escape') setSortOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const anyDialogOpen = profileEditorOpen || appEditorOpen || settingsOpen || confirmDeleteId !== null || confirmRemoveApp !== null;

  const [theme, setTheme] = useState<Theme>(() =>
    THEMES.find(t => t === localStorage.getItem('theme')) ?? 'dark'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => { applyAccent(activeProfile?.color_accent, theme); }, [activeProfile?.color_accent, theme]);

  useEffect(() => {
    if (activeProfileId) {
      scanRunningApps(activeProfileId).catch(() => {});
    }
  }, [activeProfileId]);

  const pushToast = useCallback((msg: string, kind: Toast['kind'] = 'error') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message: msg, kind }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), kind === 'error' ? 6000 : 3000);
  }, []);
  const pushError = useCallback((msg: string) => pushToast(msg, 'error'), [pushToast]);

  const sequence = useSequence(activeProfileId, (appId, message) => {
    const name = activeProfile?.apps.find(a => a.id === appId)?.name ?? 'App';
    pushError(t('Start failed — {name}: {error}', { name, error: message }));
  });

  const shortcuts = useShortcuts({
    palette: () => { if (paletteOpen) setPaletteOpen(false); else if (!anyDialogOpen) setPaletteOpen(true); },
    palette_global: () => { if (!anyDialogOpen) setPaletteOpen(true); },
    run_sequence: () => { if (activeProfile) sequence.run().catch(e => pushError(t('Run sequence failed: {error}', { error: String(e) }))); },
    end_session: () => { if (activeProfile) stopAll(activeProfile.id).catch(e => pushError(t('End session failed: {error}', { error: String(e) }))); },
    add_app: () => { if (!anyDialogOpen && !paletteOpen && activeProfile) { setEditingApp(undefined); setAppEditorOpen(true); } },
    new_profile: () => { if (!anyDialogOpen && !paletteOpen) { setEditingProfile(undefined); setProfileEditorOpen(true); } },
    settings: () => { if (!anyDialogOpen && !paletteOpen) setSettingsOpen(true); },
  }, pushToast);

  useEffect(() => { setActiveProfile(activeProfileId).catch(() => {}); }, [activeProfileId]);

  const dismissToast = (id: number) =>
    setToasts(prev => prev.filter(t => t.id !== id));

  const handleSaveApp = async (entry: Omit<AppEntry, 'id' | 'order'>) => {
    if (!activeProfileId) return;
    try {
      if (editingApp) {
        await updateApp(activeProfileId, { ...entry, id: editingApp.id, order: editingApp.order });
      } else {
        await addApp(activeProfileId, entry);
      }
    } catch (e) {
      pushError(t('Failed to save app: {error}', { error: String(e) }));
    }
    setAppEditorOpen(false);
    setEditingApp(undefined);
  };

  const profileToDelete = profiles.find(p => p.id === confirmDeleteId);

  const sortedApps = activeProfile
    ? [...activeProfile.apps].sort((a, b) => {
        if (sortOrder === 'az') return a.name.localeCompare(b.name);
        if (sortOrder === 'za') return b.name.localeCompare(a.name);
        return a.order - b.order;
      })
    : [];

  const runningCount = activeProfile
    ? activeProfile.apps.filter(a => getStatus(a.id).status === 'running').length
    : 0;


  const crashedApps = (activeProfile?.apps ?? [])
    .filter(a => getStatus(a.id).status === 'crashed')
    .map(a => ({ id: a.id, name: a.name, error: getStatus(a.id).error_message }));

  const sessionSeconds = useSessionSeconds(runningCount > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--color-text-disabled)', fontFamily: 'var(--font-display)' }}>
        {t('Loading…')}
      </div>
    );
  }

  if (designRefOpen) {
    return (
      <Suspense fallback={null}>
        <div style={{ position: 'fixed', inset: 0, overflow: 'auto', zIndex: 9999 }}>
          <DesignReference />
        </div>
      </Suspense>
    );
  }

  /* ── App actions shared between grid and list ── */
  const makeHandlers = (app: AppEntry) => ({
    onStart: async () => {
      if (!activeProfileId) return;
      try { await startApp(activeProfileId, app.id); }
      catch (e) {
        const msg = String(e);
        pushError(t('Start failed — {name}: {error}', { name: app.name, error: msg }));
        setErrorStatus(app.id, msg);
      }
    },
    onStop: async () => {
      try { await stopApp(app.id); }
      catch (e) { pushError(t('Stop failed — {name}: {error}', { name: app.name, error: String(e) })); }
    },
    onRestart: async () => {
      if (!activeProfileId) return;
      try { await restartApp(activeProfileId, app.id); }
      catch (e) {
        const msg = String(e);
        pushError(t('Restart failed — {name}: {error}', { name: app.name, error: msg }));
        setErrorStatus(app.id, msg);
      }
    },
    onOpenPath: async () => {
      if (!activeProfileId) return;
      try { await openPath(activeProfileId, app.id); }
      catch (e) { pushError(t('Open folder failed — {name}: {error}', { name: app.name, error: String(e) })); }
    },
    onEdit: (a: AppEntry) => { setEditingApp(a); setAppEditorOpen(true); },
    onRemove: (id: string) => {
      const found = activeProfile?.apps.find(a => a.id === id);
      if (found) setConfirmRemoveApp(found);
    },
  });

  const paletteItems = paletteOpen
    ? buildPaletteItems({
        profiles,
        activeProfile: activeProfile ?? undefined,
        getStatus,
        launching: sequence.launching,
        anyRunning: runningCount > 0,
        runSequence: () => sequence.run().catch(e => pushError(t('Run sequence failed: {error}', { error: String(e) }))),
        cancelSequence: () => sequence.cancel().catch(e => pushError(t('Cancel failed: {error}', { error: String(e) }))),
        endSession: async () => {
          if (!activeProfile) return;
          try { await stopAll(activeProfile.id); } catch (e) { pushError(t('End session failed: {error}', { error: String(e) })); }
        },
        addApp: () => { setEditingApp(undefined); setAppEditorOpen(true); },
        newProfile: () => { setEditingProfile(undefined); setProfileEditorOpen(true); },
        openSettings: () => setSettingsOpen(true),
        switchProfile: setActiveProfileId,
        appHandlers: makeHandlers,
      })
    : [];

  return (
    <div className="flex flex-col h-full" onClick={() => setSortOpen(false)}>
      <ProfileTabs
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSelect={setActiveProfileId}
        onNew={() => { setEditingProfile(undefined); setProfileEditorOpen(true); }}
        onSettings={() => setSettingsOpen(true)}
        onPalette={() => { if (!anyDialogOpen) setPaletteOpen(true); }}
      />

      {!activeProfile ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
            {t('No profile selected')}
          </span>
          <Button variant="cta" size="lg" onClick={() => setProfileEditorOpen(true)}>
            <Icon icon={faPlus} size={12} />
            {t('New profile')}
          </Button>
        </div>
      ) : (
        <>
          <Hero
            profile={activeProfile}
            appStates={[...activeProfile.apps].sort((a, b) => a.order - b.order).map(a => ({ id: a.id, order: a.order, status: getStatus(a.id).status }))}
            launching={sequence.launching}
            step={sequence.step}
            total={sequence.total}
            crashed={crashedApps}
            sessionSeconds={sessionSeconds}
            runDisabled={sortedApps.length === 0}
            onRun={() => sequence.run().catch(e => pushError(t('Run sequence failed: {error}', { error: String(e) })))}
            onCancel={() => sequence.cancel().catch(e => pushError(t('Cancel failed: {error}', { error: String(e) })))}
            onEnd={async () => {
              try { await stopAll(activeProfile.id); }
              catch (e) { pushError(t('End session failed: {error}', { error: String(e) })); }
            }}
            onAddApp={() => { setEditingApp(undefined); setAppEditorOpen(true); }}
            onEditProfile={() => { setEditingProfile(activeProfile); setProfileEditorOpen(true); }}
            onDeleteProfile={() => setConfirmDeleteId(activeProfile.id)}
            onRestartApp={id => { const a = activeProfile.apps.find(x => x.id === id); if (a) makeHandlers(a).onRestart(); }}
            onClearErrors={clearErrors}
          />

          <div className="mini-hide" style={{ display: 'contents' }}>
          {sortedApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-4">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                {t('No apps in this profile')}
              </span>
            </div>
          ) : (
            <>
              <AppsToolbar sortOrder={sortOrder} onSort={setSortOrder} sortOpen={sortOpen} onSortOpen={setSortOpen} viewMode={viewMode} onView={setViewMode} />
              {viewMode === 'grid' ? (
                <>
                  <AppCarousel
                    apps={sortedApps}
                    getStatus={getStatus}
                    makeHandlers={makeHandlers}
                    onAdd={() => { setEditingApp(undefined); setAppEditorOpen(true); }}
                  />
                  <KeyHints />
                </>
              ) : (
                <div className="flex flex-col flex-1 overflow-auto gap-1.5" style={{ padding: '16px 40px 24px' }}>
                  {sortedApps.map(app => (
                    <AppListRow key={app.id} app={app} status={getStatus(app.id)} {...makeHandlers(app)} />
                  ))}
                </div>
              )}
            </>
          )}
          </div>
        </>
      )}

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={paletteItems}
        onRestart={item => item.app && makeHandlers(item.app).onRestart()}
        onEdit={item => item.app && makeHandlers(item.app).onEdit(item.app)}
        onOpenFolder={item => item.app && makeHandlers(item.app).onOpenPath()}
      />

      {/* ── Toast notifications ── */}
      {toasts.length > 0 && (
        <div style={{ position: 'fixed', bottom: 56, right: 16, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999, maxWidth: 400 }}>
          {toasts.map(t => (
            <div
              key={t.id}
              style={{
                background: 'var(--color-bg-elevated)',
                border: `1px solid ${t.kind === 'error' ? 'var(--color-status-crit)' : t.kind === 'warn' ? 'var(--color-accent)' : 'var(--color-border-control)'}`,
                borderRadius: 2,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <span style={{ color: 'var(--color-text-primary)', fontSize: 12, fontFamily: 'var(--font-body)', lineHeight: 1.4, flex: 1, wordBreak: 'break-word' }}>
                {t.message}
              </span>
              <button onClick={() => dismissToast(t.id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, marginTop: 1 }}>
                <Icon icon={faXmark} size={12} crit />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Confirm delete profile ── */}
      <Dialog open={confirmDeleteId !== null} onOpenChange={v => { if (!v) setConfirmDeleteId(null); }}>
        <DialogContent width={420} tone="danger">
          <ModalHeader title={t('Delete profile')} />
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 15, lineHeight: 1.4, margin: 0 }}>
            {tx('This will permanently delete {name} and all its apps. Are you sure?', { name: <strong style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>{profileToDelete?.name}</strong> })}
          </p>
          <ModalFooter>
            <Button variant="ghost" size="default" onClick={() => setConfirmDeleteId(null)}>{t('Cancel')}</Button>
            <Button
              variant="destructive"
              size="default"
              onClick={async () => {
                if (!confirmDeleteId) return;
                try { await removeProfile(confirmDeleteId); }
                catch (e) { pushError(t('Failed to delete profile: {error}', { error: String(e) })); }
                setConfirmDeleteId(null);
              }}
            >
              {t('Yes, delete everything')}
            </Button>
          </ModalFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm remove app ── */}
      <Dialog open={confirmRemoveApp !== null} onOpenChange={v => { if (!v) setConfirmRemoveApp(null); }}>
        <DialogContent width={420} tone="danger">
          <ModalHeader title={t('Remove app')} />
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 15, lineHeight: 1.4, margin: 0 }}>
            {tx('This will permanently remove {name} from this profile. Are you sure?', { name: <strong style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>{confirmRemoveApp?.name}</strong> })}
          </p>
          <ModalFooter>
            <Button variant="ghost" size="default" onClick={() => setConfirmRemoveApp(null)}>{t('Cancel')}</Button>
            <Button
              variant="destructive"
              size="default"
              onClick={async () => {
                if (!confirmRemoveApp || !activeProfileId) return;
                try { await removeApp(activeProfileId, confirmRemoveApp.id); }
                catch (e) { pushError(t('Remove failed: {error}', { error: String(e) })); }
                setConfirmRemoveApp(null);
              }}
            >
              {t('Yes, remove it')}
            </Button>
          </ModalFooter>
        </DialogContent>
      </Dialog>

      <ProfileEditor
        open={profileEditorOpen}
        onClose={() => { setProfileEditorOpen(false); setEditingProfile(undefined); }}
        initial={editingProfile}
        onSave={async fields => {
          try {
            if (editingProfile) {
              await updateProfile({ ...editingProfile, ...fields });
            } else {
              await createProfile(fields);
            }
          } catch (e) {
            pushError(t('Failed to save profile: {error}', { error: String(e) }));
          }
          setProfileEditorOpen(false);
          setEditingProfile(undefined);
        }}
      />
      <AppEntryEditor
        key={editingApp?.id ?? 'new'}
        open={appEditorOpen}
        onClose={() => { setAppEditorOpen(false); setEditingApp(undefined); }}
        onSave={handleSaveApp}
        initial={editingApp}
      />
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
        onReset={() => reload()}
        shortcuts={shortcuts}
      />
    </div>
  );
}
