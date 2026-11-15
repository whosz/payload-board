import { useEffect, useState } from 'react';

/** Seconds since `active` became true (null while inactive). Ticks once a second. */
export function useSessionSeconds(active: boolean): number | null {
  const [start, setStart] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) { setStart(null); return; }
    setStart(s => s ?? Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  return active && start ? Math.max(0, Math.floor((now - start) / 1000)) : null;
}

export const formatClock = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
