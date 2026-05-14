import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
const DesignReference = lazy(() => import('./components/DesignReference').then(m => ({ default: m.DesignReference })));
import { Button } from './components/ui/button';
import { ProfileList } from './components/sidebar/ProfileList';
import { AppTile } from './components/dashboard/AppTile';
import { AppListRow } from './components/dashboard/AppListRow';
import { StatusBar } from './components/dashboard/StatusBar';
import { ProfileEditor } from './components/editor/ProfileEditor';
import { AppEntryEditor } from './components/editor/AppEntryEditor';
import { SettingsPanel } from './components/settings/SettingsPanel';
import {
  Dialog,
  DialogContent,
} from './components/ui/dialog';
import { Icon } from './components/icons/Icon';
import { faPlay, faPowerOff, faPlus, faXmark, faList, faTableCellsLarge, faChevronDown } from './components/icons';
import { useProfiles } from './hooks/useProfiles';
import { useProcessStatus } from './hooks/useProcessStatus';
import { startApp, stopApp, restartApp, openPath, stopAll, scanRunningApps } from './ipc/processes';
import type { AppEntry } from './types';

type Theme = 'purple' | 'grey';

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

  const { getStatus, statuses, setErrorStatus } = useProcessStatus();

  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<typeof profiles[0] | undefined>();
  const [appEditorOpen, setAppEditorOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AppEntry | undefined>();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmRemoveApp, setConfirmRemoveApp] = useState<AppEntry | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'manual' | 'az' | 'za'>('manual');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
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
    (localStorage.getItem('theme') as Theme) ?? 'purple'
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

  const dismissToast = (id: number) =>
    setToasts(prev => prev.filter(t => t.id !== id));

  const handleRunSequence = async () => {
    if (!activeProfileId) return;
    for (const app of sortedApps) {
      if (!app.enabled) continue;
      if (getStatus(app.id).status === 'running') continue;
      try {
        await startApp(activeProfileId, app.id);
      } catch (e) {
        const msg = String(e);
        pushError(`Start failed — ${app.name}: ${msg}`);
        setErrorStatus(app.id, msg);
      }
      if (app.launch_delay_ms > 0) {
        await new Promise(resolve => setTimeout(resolve, app.launch_delay_ms));
      }
    }
  };

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

  const sortLabel = sortOrder === 'az' ? 'Sort: A→Z' : sortOrder === 'za' ? 'Sort: Z→A' : 'Sort: Manual';

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
    <div
      className="flex h-full p-2 gap-2"
      style={{ background: 'transparent' }}
      onClick={() => setSortOpen(false)}
    >
      {/* ── Sidebar ── */}
      <div
        className="flex-shrink-0 flex flex-col overflow-hidden"
        style={{
          width: 266,
          background: 'var(--color-bg-surface)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: 16,
        }}
      >
        <ProfileList
          profiles={profiles}
          activeProfileId={activeProfileId}
          onSelect={setActiveProfileId}
          onNew={() => { setEditingProfile(undefined); setProfileEditorOpen(true); }}
          onEdit={id => {
            const p = profiles.find(pr => pr.id === id);
            if (p) { setEditingProfile(p); setProfileEditorOpen(true); }
          }}
          onDelete={id => setConfirmDeleteId(id)}
          onSettings={() => setSettingsOpen(true)}
        />
      </div>

      {/* ── Main panel ── */}
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{
          background: 'var(--color-bg-surface)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: 16,
        }}
      >
        {/* Top header */}
        <div
          className="flex items-center justify-between px-6 flex-shrink-0"
          style={{
            borderBottom: '1px solid var(--color-border-divider)',
            minHeight: 64,
          }}
        >
          <div className="flex flex-col justify-center min-w-0 mr-4">
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                lineHeight: '22px',
                letterSpacing: '2px',
              }}
            >
              {activeProfile?.name ?? 'No Profile'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="cta"
              size="lg"
              disabled={!activeProfile || sortedApps.length === 0}
              onClick={handleRunSequence}
            >
              <Icon icon={faPlay} size={12} active />
              Run sequence
            </Button>
            <Button
              variant="destructive"
              size="lg"
              disabled={!activeProfile || runningCount === 0}
              onClick={async () => {
                if (!activeProfileId) return;
                try { await stopAll(activeProfileId); }
                catch (e) { pushError(`End Session failed: ${e}`); }
              }}
            >
              <Icon icon={faPowerOff} size={12} crit />
              End session
            </Button>
          </div>
        </div>

        {/* Table actions bar */}
        {activeProfile && sortedApps.length > 0 && (
          <div
            className="flex items-center justify-between px-6 flex-shrink-0"
            style={{ minHeight: 48, gap: 8 }}
          >
            {/* Left: Add app */}
            <Button
              variant="cta"
              size="default"
              onClick={() => { setEditingApp(undefined); setAppEditorOpen(true); }}
            >
              <Icon icon={faPlus} size={10} />
              Add app
            </Button>

            {/* Right: Sort dropdown + view toggle */}
            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
              {/* Sort dropdown */}
              <div style={{ position: 'relative' }}>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setSortOpen(v => !v)}
                  style={{ gap: 6 }}
                >
                  {sortLabel}
                  <Icon icon={faChevronDown} size={8} />
                </Button>
                {sortOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      right: 0,
                      background: 'var(--color-bg-base)',
                      border: '1px solid var(--color-border-divider)',
                      borderRadius: 8,
                      overflow: 'hidden',
                      zIndex: 100,
                      minWidth: 120,
                    }}
                  >
                    {(['manual', 'az', 'za'] as const).map(opt => (
                      <button
                        key={opt}
                        onClick={() => { setSortOrder(opt); setSortOpen(false); }}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 14px',
                          background: sortOrder === opt ? 'var(--color-bg-elevated)' : 'transparent',
                          color: sortOrder === opt ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                          fontFamily: 'var(--font-body)',
                          fontSize: 11,
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {opt === 'manual' ? 'Manual' : opt === 'az' ? 'A → Z' : 'Z → A'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View toggle */}
              <Button
                variant={viewMode === 'grid' ? 'fill' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <Icon icon={faTableCellsLarge} size={11} />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'fill' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <Icon icon={faList} size={11} />
              </Button>
            </div>
          </div>
        )}

        {/* App grid / list */}
        <div className="flex-1 overflow-auto px-6 pb-4">
          {!activeProfile ? (
            <div className="flex flex-col items-center justify-center h-full gap-4" style={{ color: 'var(--color-text-muted)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.1em' }}>
                NO PROFILE SELECTED
              </span>
              <Button variant="cta" size="lg" onClick={() => setProfileEditorOpen(true)}>
                <Icon icon={faPlus} size={12} />
                New Profile
              </Button>
            </div>
          ) : sortedApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4" style={{ color: 'var(--color-text-muted)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.1em' }}>
                NO APPS IN THIS PROFILE
              </span>
              <Button variant="cta" size="lg" onClick={() => setAppEditorOpen(true)}>
                <Icon icon={faPlus} size={12} />
                Add App
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="flex flex-wrap gap-3 pt-3" style={{ alignContent: 'flex-start' }}>
              {sortedApps.map(app => (
                <AppTile key={app.id} app={app} status={getStatus(app.id)} {...makeHandlers(app)} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 pt-3">
              {sortedApps.map(app => (
                <AppListRow key={app.id} app={app} status={getStatus(app.id)} {...makeHandlers(app)} />
              ))}
            </div>
          )}
        </div>

        <StatusBar profile={activeProfile} statuses={statuses} />
      </div>

      {/* ── Toast notifications ── */}
      {toasts.length > 0 && (
        <div style={{ position: 'fixed', bottom: 56, right: 16, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999, maxWidth: 400 }}>
          {toasts.map(t => (
            <div
              key={t.id}
              style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-status-crit)',
                borderRadius: 8,
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
            border: '1px solid rgba(251,80,96,0.6)',
            borderRadius: 8,
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
            border: '1px solid rgba(251,80,96,0.6)',
            borderRadius: 8,
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
