import { invoke } from '@tauri-apps/api/core';

export interface SgdbGame {
  id: number;
  name: string;
}

export interface SgdbGrid {
  id: number;
  url: string;
  thumb: string;
}

export function sgdbSearch(query: string): Promise<SgdbGame[]> {
  return invoke<SgdbGame[]>('sgdb_search', { query });
}

export function sgdbGrids(gameId: number): Promise<SgdbGrid[]> {
  return invoke<SgdbGrid[]>('sgdb_grids', { gameId });
}

export function sgdbAutoBg(name: string): Promise<string> {
  return invoke<string>('sgdb_auto_bg', { name });
}
