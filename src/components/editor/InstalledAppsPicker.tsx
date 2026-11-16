import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  ModalHeader,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { listInstalledApps } from '../../ipc/profiles';
import type { InstalledApp } from '../../ipc/profiles';
import { t } from '../../i18n';

interface InstalledAppsPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (app: InstalledApp) => void;
}

export function InstalledAppsPicker({ open, onClose, onSelect }: InstalledAppsPickerProps) {
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setLoading(true);
    listInstalledApps()
      .then(setApps)
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return q ? apps.filter(a => a.name.toLowerCase().includes(q)) : apps;
  }, [apps, query]);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent width={520}>
        <ModalHeader title={t('Installed apps')} />

        <Input
          placeholder={t('Search…')}
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
          style={{
            background: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border-default)',
            color: 'var(--color-text-primary)',
            marginBottom: 8,
          }}
        />

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {loading ? (
            <div
              className="font-mono text-xs uppercase tracking-wider text-center py-8"
              style={{ color: 'var(--color-text-disabled)' }}
            >
              {t('Loading…')}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="font-mono text-xs uppercase tracking-wider text-center py-8"
              style={{ color: 'var(--color-text-disabled)' }}
            >
              {t('No apps found')}
            </div>
          ) : (
            filtered.map((app, i) => (
              <button
                key={i}
                onClick={() => { onSelect(app); onClose(); }}
                className="w-full text-left flex flex-col"
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--color-border-subtle)',
                  padding: '8px 10px',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <span style={{ color: 'var(--color-text-primary)', fontSize: 13 }}>
                  {app.name}
                </span>
                {app.exe_path && (
                  <span
                    className="font-mono truncate"
                    style={{ color: 'var(--color-text-muted)', fontSize: 11, marginTop: 1 }}
                  >
                    {app.exe_path}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
