import { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';

export type ProcessStatus = 'running' | 'stopping' | 'stopped' | 'crashed';

export interface ProcessInfo {
  entry_id: string;
  pid: number | null;
  status: ProcessStatus;
  error_message?: string;
}

type StatusMap = Record<string, ProcessInfo>;

export function useProcessStatus() {
  const [statuses, setStatuses] = useState<StatusMap>({});

  useEffect(() => {
    const unlistenPromise = listen<ProcessInfo>('process_status_changed', event => {
      const info = event.payload;
      setStatuses(prev => ({ ...prev, [info.entry_id]: info }));
    });

    return () => {
      unlistenPromise.then(f => f());
    };
  }, []);

  function getStatus(entry_id: string): ProcessInfo {
    return statuses[entry_id] ?? { entry_id, pid: null, status: 'stopped' };
  }

  function setErrorStatus(entry_id: string, error_message: string) {
    setStatuses(prev => ({
      ...prev,
      [entry_id]: { ...getStatus(entry_id), status: 'crashed', error_message },
    }));
  }

  function clearErrors() {
    setStatuses(prev => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (next[key].status === 'crashed') {
          next[key] = { ...next[key], status: 'stopped', error_message: undefined };
        }
      }
      return next;
    });
  }

  return { statuses, getStatus, setErrorStatus, clearErrors };
}
