export type WaitStrategy = 'fire_and_forget' | 'wait_for_window' | 'wait_seconds';

export interface AppEntry {
  id: string;
  name: string;
  executable_path: string;
  args: string[];
  working_dir?: string;
  launch_delay_ms: number;
  wait_strategy: WaitStrategy;
  wait_seconds?: number;
  icon_cache_path?: string;
  background_url?: string;
  enabled: boolean;
  order: number;
  requires_elevation?: boolean;
}

export interface Profile {
  id: string;
  name: string;
  color_accent?: string;
  emoji?: string;
  apps: AppEntry[];
  created_at: string;
  updated_at: string;
}
