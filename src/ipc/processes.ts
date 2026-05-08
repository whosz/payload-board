import { invoke } from '@tauri-apps/api/core';

export function startApp(profile_id: string, entry_id: string): Promise<void> {
  return invoke('start_app', { profile_id, entry_id });
}

export function stopApp(entry_id: string, force = false): Promise<void> {
  return invoke('stop_app', { entry_id, force });
}

export function restartApp(profile_id: string, entry_id: string): Promise<void> {
  return invoke('restart_app', { profile_id, entry_id });
}

export function openPath(profile_id: string, entry_id: string): Promise<void> {
  return invoke('open_path', { profile_id, entry_id });
}

export function stopAll(profile_id: string): Promise<void> {
  return invoke('stop_all', { profile_id });
}
