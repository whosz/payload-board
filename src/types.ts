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
  priority?: 'low' | 'normal' | 'high';
  launch_minimised?: boolean;
  /** relaunch automatically after a crash (up to max_retries, default 3) */
  restart_on_crash?: boolean;
  max_retries?: number;
}

export interface Profile {
  id: string;
  name: string;
  color_accent?: string;
  /** hero background image: remote URL or local file path */
  cover_url?: string;
  emoji?: string;
  apps: AppEntry[];
  created_at: string;
  updated_at: string;
}
