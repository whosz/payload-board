import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { listProfiles, saveProfile, deleteProfile } from '../ipc/profiles';
import type { Profile, AppEntry } from '../types';

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeProfile = profiles.find(p => p.id === activeProfileId) ?? null;

  const reload = useCallback(async (keepActive?: string) => {
    try {
      const data = await listProfiles();
      setProfiles(data);
      setActiveProfileId(prev => {
        const target = keepActive ?? prev;
        if (target && data.some(p => p.id === target)) return target;
        return data[0]?.id ?? null;
      });
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const createProfile = useCallback(async (name: string): Promise<Profile> => {
    const now = new Date().toISOString();
    const profile: Profile = {
      id: uuidv4(),
      name,
      apps: [],
      created_at: now,
      updated_at: now,
    };
    await saveProfile(profile);
    await reload(profile.id);
    return profile;
  }, [reload]);

  const updateProfile = useCallback(async (profile: Profile) => {
    const updated = { ...profile, updated_at: new Date().toISOString() };
    await saveProfile(updated);
    await reload(updated.id);
  }, [reload]);

  const removeProfile = useCallback(async (id: string) => {
    await deleteProfile(id);
    await reload();
  }, [reload]);

  const addApp = useCallback(async (
    profileId: string,
    app: Omit<AppEntry, 'id' | 'order'>,
  ) => {
    const target = profiles.find(p => p.id === profileId);
    if (!target) return;
    const newApp: AppEntry = { ...app, id: uuidv4(), order: target.apps.length };
    await updateProfile({ ...target, apps: [...target.apps, newApp] });
  }, [profiles, updateProfile]);

  const removeApp = useCallback(async (profileId: string, appId: string) => {
    const target = profiles.find(p => p.id === profileId);
    if (!target) return;
    await updateProfile({ ...target, apps: target.apps.filter(a => a.id !== appId) });
  }, [profiles, updateProfile]);

  return {
    profiles,
    activeProfile,
    activeProfileId,
    setActiveProfileId,
    loading,
    error,
    createProfile,
    updateProfile,
    removeProfile,
    addApp,
    removeApp,
  };
}
