import { convertFileSrc } from '@tauri-apps/api/core';
import type { AppEntry } from '../types';

/** Artwork URL for an app's tile (remote URL or local file), or null for the lettered fallback. */
export function artworkSrc(app: AppEntry): string | null {
  if (!app.background_url) return null;
  return app.background_url.startsWith('http') ? app.background_url : convertFileSrc(app.background_url);
}

export const exeName = (app: AppEntry) => app.executable_path.split(/[\\/]/).pop() ?? '';
