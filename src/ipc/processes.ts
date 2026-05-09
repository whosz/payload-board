import { invoke } from '@tauri-apps/api/core';

export function startApp(profileId: string, entryId: string): Promise<void> {
  return invoke('start_app', { profileId, entryId });
}

export function stopApp(entryId: string, force = false): Promise<void> {
  return invoke('stop_app', { entryId, force });
}

export function restartApp(profileId: string, entryId: string): Promise<void> {
  return invoke('restart_app', { profileId, entryId });
}

export function openPath(profileId: string, entryId: string): Promise<void> {
  return invoke('open_path', { profileId, entryId });
}

export function stopAll(profileId: string): Promise<void> {
  return invoke('stop_all', { profileId });
}

export function scanRunningApps(profileId: string): Promise<void> {
  return invoke('scan_running_apps', { profileId });
}
