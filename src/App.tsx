import { useState, useCallback } from 'react';
import { Group as PanelGroup, Panel, Separator as PanelHandle } from 'react-resizable-panels';
import { Button } from './components/ui/button';
import { ProfileList } from './components/sidebar/ProfileList';
import { AppTile } from './components/dashboard/AppTile';
import { StatusBar } from './components/dashboard/StatusBar';
import { ProfileEditor } from './components/editor/ProfileEditor';
import { AppEntryEditor } from './components/editor/AppEntryEditor';
import { Icon } from './components/icons/Icon';
import { faPlay, faPowerOff, faPlus, faXmark } from './components/icons';
import { useProfiles } from './hooks/useProfiles';
import { useProcessStatus } from './hooks/useProcessStatus';
import { startApp, stopApp, restartApp, openPath, stopAll } from './ipc/processes';
import type { AppEntry } from './types';

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
    removeProfile,
    addApp,
    removeApp,
  } = useProfiles();

  const { getStatus, statuses } = useProcessStatus();

  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [appEditorOpen, setAppEditorOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AppEntry | undefined>();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushError = useCallback((msg: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message: msg }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
  }, []);

  const dismissToast = (id: number) =>
    setToasts(prev => prev.filter(t => t.id !== id));

  const handleAddApp = async (entry: Omit<AppEntry, 'id' | 'order'>) => {
    if (!activeProfileId) return;
    try {
      await addApp(activeProfileId, entry);
    } catch (e) {
      pushError(`Failed to add app: ${e}`);
    }
    setAppEditorOpen(false);
  };

  const sortedApps = activeProfile
    ? [...activeProfile.apps].sort((a, b) => a.order - b.order)
    : [];

  const runningCount = activeProfile
    ? activeProfile.apps.filter(a => getStatus(a.id).status === 'running').length
    : 0;

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-full font-mono text-sm"
        style={{ color: '#54545A', background: '#0A0A0B' }}
      >
        LOADING...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#0A0A0B', position: 'relative' }}>
      <PanelGroup
        orientation="horizontal"
        style={{ flex: 1, display: 'flex', overflow: 'hidden' }}
      >
        {/* Sidebar */}
        <Panel defaultSize="20%" minSize="12%" maxSize="40%" style={{ overflow: 'hidden' }}>
          <ProfileList
            profiles={profiles}
            activeProfileId={activeProfileId}
            onSelect={setActiveProfileId}
            onNew={() => setProfileEditorOpen(true)}
            onDelete={async id => {
              try { await removeProfile(id); }
              catch (e) { pushError(`Failed to delete profile: ${e}`); }
            }}
          />
        </Panel>

        <PanelHandle
          style={{
            width: 4,
            background: '#2A2A2F',
            cursor: 'col-resize',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#FFE600')}
          onMouseLeave={e => (e.currentTarget.style.background = '#2A2A2F')}
        />

        {/* Main */}
        <Panel defaultSize="80%" style={{ overflow: 'hidden' }}>
          <div className="flex flex-col h-full">
            {/* Top bar */}
            <div
              className="flex items-center justify-between px-5"
              style={{
                background: '#111113',
                borderBottom: '1px solid #1F1F22',
                minHeight: 56,
              }}
            >
              <span
                className="font-mono uppercase tracking-widest text-sm"
                style={{ color: '#8A8A90' }}
              >
                {activeProfile?.name ?? 'No Profile'}
              </span>

              <div className="flex items-center gap-3">
                {activeProfile && (
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => { setEditingApp(undefined); setAppEditorOpen(true); }}
                    style={{ borderColor: '#2A2A2F', color: '#8A8A90' }}
                  >
                    <Icon icon={faPlus} size={12} />
                    Add App
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="default"
                  disabled={!activeProfile || sortedApps.length === 0}
                  style={{ borderColor: '#2A2A2F', color: '#8A8A90' }}
                >
                  <Icon icon={faPlay} size={12} />
                  Run Sequence
                </Button>
                <Button
                  variant="destructive"
                  size="default"
                  disabled={!activeProfile || runningCount === 0}
                  className="font-mono uppercase tracking-wider"
                  onClick={async () => {
                    if (!activeProfileId) return;
                    try { await stopAll(activeProfileId); }
                    catch (e) { pushError(`End Session failed: ${e}`); }
                  }}
                >
                  <Icon icon={faPowerOff} size={12} className="text-current" />
                  End Session
                </Button>
              </div>
            </div>

            {/* Tile grid */}
            <div className="flex-1 overflow-auto p-5">
              {!activeProfile ? (
                <div
                  className="flex flex-col items-center justify-center h-full gap-4"
                  style={{ color: '#54545A' }}
                >
                  <span className="font-mono text-sm uppercase tracking-wider">
                    No profile selected
                  </span>
                  <Button
                    variant="cockpit"
                    onClick={() => setProfileEditorOpen(true)}
                  >
                    <Icon icon={faPlus} size={12} className="text-current" />
                    New Profile
                  </Button>
                </div>
              ) : sortedApps.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center h-full gap-4"
                  style={{ color: '#54545A' }}
                >
                  <span className="font-mono text-sm uppercase tracking-wider">
                    No apps in this profile
                  </span>
                  <Button
                    variant="cockpit"
                    onClick={() => setAppEditorOpen(true)}
                  >
                    <Icon icon={faPlus} size={12} className="text-current" />
                    Add App
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4" style={{ alignContent: 'flex-start' }}>
                  {sortedApps.map(app => (
                    <AppTile
                      key={app.id}
                      app={app}
                      status={getStatus(app.id)}
                      onStart={async () => {
                        if (!activeProfileId) return;
                        try { await startApp(activeProfileId, app.id); }
                        catch (e) { pushError(`Start failed — ${app.name}: ${e}`); }
                      }}
                      onStop={async () => {
                        try { await stopApp(app.id); }
                        catch (e) { pushError(`Stop failed — ${app.name}: ${e}`); }
                      }}
                      onRestart={async () => {
                        if (!activeProfileId) return;
                        try { await restartApp(activeProfileId, app.id); }
                        catch (e) { pushError(`Restart failed — ${app.name}: ${e}`); }
                      }}
                      onOpenPath={async () => {
                        if (!activeProfileId) return;
                        try { await openPath(activeProfileId, app.id); }
                        catch (e) { pushError(`Open folder failed — ${app.name}: ${e}`); }
                      }}
                      onEdit={a => { setEditingApp(a); setAppEditorOpen(true); }}
                      onRemove={async id => {
                        try { await removeApp(activeProfileId!, id); }
                        catch (e) { pushError(`Remove failed: ${e}`); }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <StatusBar profile={activeProfile} statuses={statuses} />
          </div>
        </Panel>
      </PanelGroup>

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 56,
            right: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            zIndex: 9999,
            maxWidth: 400,
          }}
        >
          {toasts.map(t => (
            <div
              key={t.id}
              style={{
                background: '#161618',
                border: '1px solid #FF2D55',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <span
                style={{
                  color: '#E8E8EA',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  lineHeight: 1.4,
                  flex: 1,
                  wordBreak: 'break-word',
                }}
              >
                {t.message}
              </span>
              <button
                onClick={() => dismissToast(t.id)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, marginTop: 1 }}
              >
                <Icon icon={faXmark} size={12} crit />
              </button>
            </div>
          ))}
        </div>
      )}

      <ProfileEditor
        open={profileEditorOpen}
        onClose={() => setProfileEditorOpen(false)}
        onSave={async name => {
          try { await createProfile(name); }
          catch (e) { pushError(`Failed to create profile: ${e}`); }
          setProfileEditorOpen(false);
        }}
      />
      <AppEntryEditor
        open={appEditorOpen}
        onClose={() => { setAppEditorOpen(false); setEditingApp(undefined); }}
        onSave={handleAddApp}
        initial={editingApp}
      />
    </div>
  );
}
