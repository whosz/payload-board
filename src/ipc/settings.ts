import { invoke } from '@tauri-apps/api/core';

export function getDataDir(): Promise<string> {
  return invoke<string>('get_data_dir');
}

export function getProfilesDir(): Promise<string> {
  return invoke<string>('get_profiles_dir');
}

export function pickConfigDir(): Promise<string | null> {
  return invoke<string | null>('pick_config_dir');
}

export function setProfilesDir(dir: string | null): Promise<void> {
  return invoke<void>('set_profiles_dir', { dir });
}

export function resetAllData(): Promise<void> {
  return invoke<void>('reset_all_data');
}

export function openProfilesDir(): Promise<void> {
  return invoke<void>('open_profiles_dir');
}

export function getSgdbKey(): Promise<string | null> {
  return invoke<string | null>('get_sgdb_key');
}

export function setSgdbKey(key: string | null): Promise<void> {
  return invoke<void>('set_sgdb_key', { key });
}

export function getStartMinimisedToTray(): Promise<boolean> {
  return invoke<boolean>('get_start_minimised_to_tray');
}

export function setStartMinimisedToTray(enable: boolean): Promise<void> {
  return invoke<void>('set_start_minimised_to_tray', { enable });
}

export function getMinimiseOnClose(): Promise<boolean> {
  return invoke<boolean>('get_minimise_on_close');
}

export function setMinimiseOnClose(enable: boolean): Promise<void> {
  return invoke<void>('set_minimise_on_close', { enable });
}

export function getAutostart(): Promise<boolean> {
  return invoke<boolean>('plugin:autostart|is_enabled');
}

export function setAutostart(enable: boolean): Promise<void> {
  return invoke<void>(enable ? 'plugin:autostart|enable' : 'plugin:autostart|disable');
}

export type BoolSetting = 'notify_on_crash' | 'auto_restart_enabled' | 'check_updates';

export interface UpdateInfo { version: string; url: string }

/** The newer release, or null when the app is up to date. */
export function checkForUpdate(): Promise<UpdateInfo | null> {
  return invoke<UpdateInfo | null>('check_for_update');
}

export function getBoolSetting(key: BoolSetting): Promise<boolean> {
  return invoke<boolean>('get_bool_setting', { key });
}

export function setBoolSetting(key: BoolSetting, value: boolean): Promise<void> {
  return invoke<void>('set_bool_setting', { key, value });
}

/** Tells the backend which language to use for notifications and shortcut feedback. */
export function setBackendLanguage(code: string): Promise<void> {
  return invoke<void>('set_language', { code });
}
