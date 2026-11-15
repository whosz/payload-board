import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
const DesignReference = lazy(() => import('./components/DesignReference').then(m => ({ default: m.DesignReference })));
import { Button } from './components/ui/button';
import { ProfileTabs } from './components/ProfileTabs';
import { Hero } from './components/dashboard/Hero';
import { AppCarousel } from './components/dashboard/AppCarousel';
import { AppsToolbar, type SortOrder, type ViewMode } from './components/dashboard/AppsToolbar';
import { KeyHints } from './components/dashboard/KeyHints';
import { AppListRow } from './components/dashboard/AppListRow';
import { ProfileEditor } from './components/editor/ProfileEditor';
import { AppEntryEditor } from './components/editor/AppEntryEditor';
import { SettingsPanel } from './components/settings/SettingsPanel';
import {
  Dialog,
  DialogContent,
} from './components/ui/dialog';
import { Icon } from './components/icons/Icon';
import { faPlus, faXmark } from './components/icons';
import { useProfiles } from './hooks/useProfiles';
import { useProcessStatus } from './hooks/useProcessStatus';
import { startApp, stopApp, restartApp, openPath, stopAll, scanRunningApps } from './ipc/processes';
import { useSequence } from './hooks/useSequence';
import { useSessionSeconds } from './hooks/useSessionSeconds';
import type { AppEntry } from './types';

type Theme = 'dark' | 'grey' | 'light';
const THEMES: Theme[] = ['dark', 'grey', 'light'];

interface Toast {
  id: number;
  message: string;
}

export default function App() {
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
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') setDesignRefOpen(v => !v);
      if (e.key === 'Escape') setSortOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const [theme, setTheme] = useState<Theme>(() =>
    THEMES.find(t => t === localStorage.getItem('theme')) ?? 'dark'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (activeProfileId) {
      scanRunningApps(activeProfileId).catch(() => {});
    }
  }, [activeProfileId]);

  const pushError = useCallback((msg: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message: msg }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
  }, []);

  const sequence = useSequence(activeProfileId, (appId, message) => {
    const name = activeProfile?.apps.find(a => a.id === appId)?.name ?? 'App';
    pushError(`Start failed — ${name}: ${message}`);
  });

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
      pushError(`Failed to save app: ${e}`);
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
        LOADING...
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
        pushError(`Start failed — ${app.name}: ${msg}`);
        setErrorStatus(app.id, msg);
      }
    },
    onStop: async () => {
      try { await stopApp(app.id); }
      catch (e) { pushError(`Stop failed — ${app.name}: ${e}`); }
    },
    onRestart: async () => {
      if (!activeProfileId) return;
      try { await restartApp(activeProfileId, app.id); }
      catch (e) {
        const msg = String(e);
        pushError(`Restart failed — ${app.name}: ${msg}`);
        setErrorStatus(app.id, msg);
      }
    },
    onOpenPath: async () => {
      if (!activeProfileId) return;
      try { await openPath(activeProfileId, app.id); }
      catch (e) { pushError(`Open folder failed — ${app.name}: ${e}`); }
    },
    onEdit: (a: AppEntry) => { setEditingApp(a); setAppEditorOpen(true); },
    onRemove: (id: string) => {
      const found = activeProfile?.apps.find(a => a.id === id);
      if (found) setConfirmRemoveApp(found);
    },
  });

  return (
    <div className="flex flex-col h-full" onClick={() => setSortOpen(false)}>
      <ProfileTabs
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSelect={setActiveProfileId}
        onNew={() => { setEditingProfile(undefined); setProfileEditorOpen(true); }}
        onSettings={() => setSettingsOpen(true)}
      />

      {!activeProfile ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
            No profile selected
          </span>
          <Button variant="cta" size="lg" onClick={() => setProfileEditorOpen(true)}>
            <Icon icon={faPlus} size={12} />
            New Profile
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
            onRun={() => sequence.run().catch(e => pushError(`Run sequence failed: ${e}`))}
            onCancel={() => sequence.cancel().catch(e => pushError(`Cancel failed: ${e}`))}
            onEnd={async () => {
              try { await stopAll(activeProfile.id); }
              catch (e) { pushError(`End Session failed: ${e}`); }
            }}
            onAddApp={() => { setEditingApp(undefined); setAppEditorOpen(true); }}
            onEditProfile={() => { setEditingProfile(activeProfile); setProfileEditorOpen(true); }}
            onDeleteProfile={() => setConfirmDeleteId(activeProfile.id)}
            onRestartApp={id => { const a = activeProfile.apps.find(x => x.id === id); if (a) makeHandlers(a).onRestart(); }}
            onClearErrors={clearErrors}
          />

          {sortedApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-4">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                No apps in this profile
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
        </>
      )}

      {/* ── Toast notifications ── */}
      {toasts.length > 0 && (
        <div style={{ position: 'fixed', bottom: 56, right: 16, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999, maxWidth: 400 }}>
          {toasts.map(t => (
            <div
              key={t.id}
              style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-status-crit)',
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
        <DialogContent
          showCloseButton={false}
          style={{
            background: 'var(--color-bg-base)',
            border: '1px solid var(--color-btn-destructive-border)',
            borderRadius: 2,
            boxShadow: 'none',
            maxWidth: 295,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <p style={{ color: 'var(--color-text-primary)', fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 400, lineHeight: '16px', letterSpacing: '0.25px', margin: 0 }}>
            This will permanently delete <strong style={{ fontWeight: 600 }}>{profileToDelete?.name}</strong> and all its apps. Are you sure?
          </p>
          <div className="flex items-center" style={{ gap: 12 }}>
            <Button
              variant="destructive"
              size="default"
              onClick={async () => {
                if (!confirmDeleteId) return;
                try { await removeProfile(confirmDeleteId); }
                catch (e) { pushError(`Failed to delete profile: ${e}`); }
                setConfirmDeleteId(null);
              }}
            >
              Yes, delete everything
            </Button>
            <Button variant="default" size="default" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Confirm remove app ── */}
      <Dialog open={confirmRemoveApp !== null} onOpenChange={v => { if (!v) setConfirmRemoveApp(null); }}>
        <DialogContent
          showCloseButton={false}
          style={{
            background: 'var(--color-bg-base)',
            border: '1px solid var(--color-btn-destructive-border)',
            borderRadius: 2,
            boxShadow: 'none',
            maxWidth: 295,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <p style={{ color: 'var(--color-text-primary)', fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 400, lineHeight: '16px', letterSpacing: '0.25px', margin: 0 }}>
            This will permanently remove <strong style={{ fontWeight: 600 }}>{confirmRemoveApp?.name}</strong> from this profile. Are you sure?
          </p>
          <div className="flex items-center" style={{ gap: 12 }}>
            <Button
              variant="destructive"
              size="default"
              onClick={async () => {
                if (!confirmRemoveApp || !activeProfileId) return;
                try { await removeApp(activeProfileId, confirmRemoveApp.id); }
                catch (e) { pushError(`Remove failed: ${e}`); }
                setConfirmRemoveApp(null);
              }}
            >
              Yes, remove it
            </Button>
            <Button variant="default" size="default" onClick={() => setConfirmRemoveApp(null)}>Cancel</Button>
          </div>
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
            pushError(`Failed to save profile: ${e}`);
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
      />
    </div>
  );
}
