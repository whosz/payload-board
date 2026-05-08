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
