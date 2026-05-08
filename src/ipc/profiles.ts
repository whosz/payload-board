import { invoke } from '@tauri-apps/api/core';
import type { Profile } from '../types';

export interface PickedExecutable {
  path: string;
  suggested_name: string;
  icon_path: string | null;
}

export function listProfiles(): Promise<Profile[]> {
  return invoke<Profile[]>('list_profiles');
}

export function saveProfile(profile: Profile): Promise<void> {
  return invoke<void>('save_profile', { profile });
}

export function deleteProfile(id: string): Promise<void> {
  return invoke<void>('delete_profile', { id });
}

export function pickExecutable(): Promise<PickedExecutable> {
  return invoke<PickedExecutable>('pick_executable');
}
