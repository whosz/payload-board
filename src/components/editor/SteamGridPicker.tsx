import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  ModalHeader,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { sgdbSearch, sgdbGrids } from '../../ipc/steamgriddb';
import type { SgdbGame, SgdbGrid } from '../../ipc/steamgriddb';
import { t } from '../../i18n';
import { SGDB_API_URL, openExternal } from '../../lib/links';

interface SteamGridPickerProps {
  open: boolean;
  onClose: () => void;
  initialQuery: string;
  onSelect: (url: string) => void;
  onOpenSettings?: () => void;
}

export function SteamGridPicker({ open, onClose, initialQuery, onSelect, onOpenSettings }: SteamGridPickerProps) {
  const [query, setQuery] = useState('');
  const [games, setGames] = useState<SgdbGame[]>([]);
  const [grids, setGrids] = useState<SgdbGrid[]>([]);
  const [selectedGame, setSelectedGame] = useState<SgdbGame | null>(null);
  const [searching, setSearching] = useState(false);
  const [loadingGrids, setLoadingGrids] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setQuery(initialQuery);
    setGames([]);
    setGrids([]);
    setSelectedGame(null);
    setError('');
  }, [open, initialQuery]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setGames([]);
    setGrids([]);
    setSelectedGame(null);
    setError('');
    try {
      const results = await sgdbSearch(query.trim());
      setGames(results);
      if (results.length === 0) setError(t('No games found.'));
    } catch (e) {
      setError(String(e));
    } finally {
      setSearching(false);
    }
  };

  const handleSelectGame = async (game: SgdbGame) => {
    setSelectedGame(game);
    setGrids([]);
    setLoadingGrids(true);
    setError('');
    try {
      const results = await sgdbGrids(game.id);
      setGrids(results);
      if (results.length === 0) setError(t('No grid images found for this game.'));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoadingGrids(false);
    }
  };

  const missingKey = error.includes('API key not configured');

  const labelStyle: React.CSSProperties = {
    color: 'var(--color-text-muted)',
    fontSize: 11,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 6,
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent width={600}>
        <ModalHeader title={t('SteamGridDB — Background art')} />

        {/* Search */}
        <div className="flex gap-2 mb-1">
          <Input
            placeholder={t('Search game name…')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            autoFocus
            style={{
              background: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)',
              flex: 1,
            }}
          />
          <Button
            variant="outline"
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}
          >
            {searching ? '…' : t('Search')}
          </Button>
        </div>

        {error && (
          <div style={{ padding: '4px 0' }}>
            <div className="font-mono text-xs" style={{ color: 'var(--color-status-crit)' }}>
              {missingKey ? t('SteamGridDB API key not configured') : error}
            </div>
            {missingKey && (
              <div className="flex gap-2" style={{ marginTop: 8 }}>
                {onOpenSettings && <Button variant="fill" size="sm" onClick={onOpenSettings}>{t('Open Settings')}</Button>}
                <Button variant="default" size="sm" onClick={() => openExternal(SGDB_API_URL)}>{t('Get an API key')}</Button>
              </div>
            )}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Game list */}
          {games.length > 0 && (
            <div>
              <div style={labelStyle}>{t('Select game')}</div>
              <div className="flex flex-col">
                {games.map(g => (
                  <button
                    key={g.id}
                    onClick={() => handleSelectGame(g)}
                    style={{
                      background: selectedGame?.id === g.id ? 'var(--color-bg-hover)' : 'none',
                      border: 'none',
                      borderBottom: '1px solid var(--color-border-subtle)',
                      borderLeft: selectedGame?.id === g.id
                        ? '2px solid var(--color-accent-laser)'
                        : '2px solid transparent',
                      padding: '7px 10px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: 'var(--color-text-primary)',
                      fontSize: 13,
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (selectedGame?.id !== g.id) e.currentTarget.style.background = 'var(--color-bg-surface)'; }}
                    onMouseLeave={e => { if (selectedGame?.id !== g.id) e.currentTarget.style.background = 'none'; }}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grid thumbnails */}
          {(loadingGrids || grids.length > 0) && (
            <div>
              <div style={labelStyle}>
                {selectedGame?.name} — pick background
              </div>
              {loadingGrids ? (
                <div className="font-mono text-xs text-center py-6" style={{ color: 'var(--color-text-disabled)' }}>
                  {t('Loading…')}
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(138px, 1fr))',
                    gap: 6,
                  }}
                >
                  {grids.map(grid => (
                    <button
                      key={grid.id}
                      onClick={() => { onSelect(grid.url); onClose(); }}
                      style={{
                        background: 'var(--color-bg-surface)',
                        border: '1px solid var(--color-border-default)',
                        padding: 0,
                        cursor: 'pointer',
                        overflow: 'hidden',
                        transition: 'border-color 0.1s',
                        aspectRatio: '460 / 215',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-accent-laser)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border-default)')}
                    >
                      <img
                        src={grid.thumb}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
