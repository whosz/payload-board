import { convertFileSrc } from '@tauri-apps/api/core';
import type { AppEntry } from '../types';

/** Artwork URL for an app's tile (remote URL or local file), or null for the lettered fallback. */
export function artworkUrl(url?: string | null): string | null {
  if (!url) return null;
  return url.startsWith('http') ? url : convertFileSrc(url);
}

export const artworkSrc = (app: AppEntry) => artworkUrl(app.background_url);

export const exeName = (app: AppEntry) => app.executable_path.split(/[\\/]/).pop() ?? '';
