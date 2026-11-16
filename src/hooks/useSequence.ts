import { useEffect, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { runSequence, cancelSequence } from '../ipc/processes';

export interface SequenceInfo {
  state: 'idle' | 'launching' | 'done' | 'cancelled';
  /** 1-based step being launched (or completed when done) */
  step: number;
  total: number;
}

interface SequenceProgress {
  profile_id: string;
  state: 'launching' | 'done' | 'cancelled';
  step: number;
  total: number;
  app_id?: string;
  error?: string;
}

const IDLE: SequenceInfo = { state: 'idle', step: 0, total: 0 };

/**
 * Thin client for the Rust sequencer (`run_sequence` / `cancel_sequence`).
 * `onStartError` is called for every app that failed to launch.
 */
export function useSequence(profileId: string | null, onStartError: (appId: string, message: string) => void) {
  const [byProfile, setByProfile] = useState<Record<string, SequenceInfo>>({});
  const errorRef = useRef(onStartError);
  errorRef.current = onStartError;

  useEffect(() => {
    const unlisten = listen<SequenceProgress>('sequence_progress', ({ payload: p }) => {
      setByProfile(prev => ({ ...prev, [p.profile_id]: { state: p.state, step: p.step, total: p.total } }));
      if (p.error && p.app_id) errorRef.current(p.app_id, p.error);
    });
    return () => { unlisten.then(f => f()); };
  }, []);

  const info = (profileId && byProfile[profileId]) || IDLE;
  return {
    ...info,
    launching: info.state === 'launching',
    run: () => (profileId ? runSequence(profileId) : Promise.resolve()),
    cancel: () => (profileId ? cancelSequence(profileId) : Promise.resolve()),
  };
}
