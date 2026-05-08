import { useState } from 'react';
import {
  ResizableHandle,
  ResizablePanelGroup,
  ResizablePanel,
} from './components/ui/resizable';
import { Button } from './components/ui/button';
import { ProfileList } from './components/sidebar/ProfileList';
import { AppTile } from './components/dashboard/AppTile';
import { StatusBar } from './components/dashboard/StatusBar';
import { ProfileEditor } from './components/editor/ProfileEditor';
import { AppEntryEditor } from './components/editor/AppEntryEditor';
import { Icon } from './components/icons/Icon';
import { faPlay, faPowerOff, faPlus } from './components/icons';
import { useProfiles } from './hooks/useProfiles';
import type { AppEntry } from './types';

export default function App() {
  const {
    profiles,
    activeProfile,
    activeProfileId,
    setActiveProfileId,
    loading,
    createProfile,
    addApp,
    removeApp,
  } = useProfiles();

  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [appEditorOpen, setAppEditorOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AppEntry | undefined>();

  const handleAddApp = async (entry: Omit<AppEntry, 'id' | 'order'>) => {
    if (!activeProfileId) return;
    await addApp(activeProfileId, entry);
    setAppEditorOpen(false);
  };

  const sortedApps = activeProfile
    ? [...activeProfile.apps].sort((a, b) => a.order - b.order)
    : [];

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-full font-mono text-xs"
        style={{ color: '#54545A', background: '#0A0A0B' }}
      >
        LOADING...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#0A0A0B' }}>
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        {/* Sidebar */}
        <ResizablePanel defaultSize={18} minSize={14} maxSize={28}>
          <ProfileList
            profiles={profiles}
            activeProfileId={activeProfileId}
            onSelect={setActiveProfileId}
            onNew={() => setProfileEditorOpen(true)}
          />
        </ResizablePanel>

        <ResizableHandle style={{ background: '#1F1F22', width: 1 }} />

        {/* Main */}
        <ResizablePanel defaultSize={82}>
          <div className="flex flex-col h-full">
            {/* Top bar */}
            <div
              className="flex items-center justify-between px-4"
              style={{
                background: '#111113',
                borderBottom: '1px solid #1F1F22',
                minHeight: 44,
              }}
            >
              <span
                className="font-mono uppercase tracking-widest text-xs"
                style={{ color: '#8A8A90' }}
              >
                {activeProfile?.name ?? 'No Profile'}
              </span>

              <div className="flex items-center gap-2">
                {activeProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setEditingApp(undefined); setAppEditorOpen(true); }}
                    style={{ borderColor: '#2A2A2F', color: '#8A8A90' }}
                  >
                    <Icon icon={faPlus} size={10} />
                    Add App
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!activeProfile || sortedApps.length === 0}
                  style={{ borderColor: '#2A2A2F', color: '#8A8A90' }}
                >
                  <Icon icon={faPlay} size={10} />
                  Run Sequence
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={!activeProfile}
                  className="font-mono uppercase tracking-wider text-xs"
                >
                  <Icon icon={faPowerOff} size={10} className="text-current" />
                  End Session
                </Button>
              </div>
            </div>

            {/* Tile grid */}
            <div className="flex-1 overflow-auto p-4">
              {!activeProfile ? (
                <div
                  className="flex flex-col items-center justify-center h-full gap-3"
                  style={{ color: '#54545A' }}
                >
                  <span className="font-mono text-xs uppercase tracking-wider">
                    No profile selected
                  </span>
                  <Button
                    variant="cockpit"
                    size="sm"
                    onClick={() => setProfileEditorOpen(true)}
                  >
                    <Icon icon={faPlus} size={10} className="text-current" />
                    New Profile
                  </Button>
                </div>
              ) : sortedApps.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center h-full gap-3"
                  style={{ color: '#54545A' }}
                >
                  <span className="font-mono text-xs uppercase tracking-wider">
                    No apps in this profile
                  </span>
                  <Button
                    variant="cockpit"
                    size="sm"
                    onClick={() => setAppEditorOpen(true)}
                  >
                    <Icon icon={faPlus} size={10} className="text-current" />
                    Add App
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3" style={{ alignContent: 'flex-start' }}>
                  {sortedApps.map(app => (
                    <AppTile
                      key={app.id}
                      app={app}
                      onEdit={a => { setEditingApp(a); setAppEditorOpen(true); }}
                      onRemove={id => removeApp(activeProfileId!, id)}
                    />
                  ))}
                </div>
              )}
            </div>

            <StatusBar profile={activeProfile} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <ProfileEditor
        open={profileEditorOpen}
        onClose={() => setProfileEditorOpen(false)}
        onSave={async name => { await createProfile(name); setProfileEditorOpen(false); }}
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
