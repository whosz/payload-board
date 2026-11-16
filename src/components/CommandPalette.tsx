import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { t } from '../i18n';
import { filterItems, firstEnabled, statusLabel, type PaletteGroup, type PaletteItem } from '../lib/palette';

interface Props {
  open: boolean;
  onClose: () => void;
  items: PaletteItem[];
  /** app-specific shortcuts inside the palette */
  onRestart: (item: PaletteItem) => void;
  onEdit: (item: PaletteItem) => void;
  onOpenFolder: (item: PaletteItem) => void;
}

const waitLabel = (w: string) => ({ fire_and_forget: t('Fire and forget'), wait_for_window: t('Wait for window'), wait_seconds: t('Wait seconds') })[w] ?? w;
const priorityLabel = (p: string) => ({ low: t('Low'), normal: t('Normal'), high: t('High') })[p] ?? p;
const groupLabel = (g: string) => ({ Actions: t('Actions'), Apps: t('Apps'), Profiles: t('Profiles') })[g] ?? g;

const mono = { fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' } as const;

export function CommandPalette({ open, ...rest }: Props) {
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) rest.onClose(); }}>
      <DialogContent width={940} className="p-0 gap-0 overflow-hidden" style={{ top: '38%' }}>
        <DialogTitle className="sr-only">{t('Command palette')}</DialogTitle>
        <PaletteBody {...rest} />
      </DialogContent>
    </Dialog>
  );
}

function PaletteBody({ items, onClose, onRestart, onEdit, onOpenFolder }: Omit<Props, 'open'>) {
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => filterItems(items, query), [items, query]);
  const [active, setActive] = useState(() => firstEnabled(results));
  const current = results[Math.min(active, results.length - 1)];

  useEffect(() => { setActive(firstEnabled(results)); }, [query]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active, results]);

  const run = (item?: PaletteItem) => {
    if (!item || item.disabled) return;
    onClose();
    item.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const n = results.length;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => (n ? (i + 1) % n : 0)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => (n ? (i - 1 + n) % n : 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(current); }
    else if ((e.ctrlKey || e.metaKey) && current?.app) {
      const k = e.key.toLowerCase();
      const act = k === 'r' ? onRestart : k === 'e' ? onEdit : k === 'o' ? onOpenFolder : null;
      if (act) { e.preventDefault(); onClose(); act(current); }
    }
  };

  let optionIndex = -1;
  return (
    <div onKeyDown={onKeyDown}>
      <div className="flex items-center" style={{ gap: 14, padding: '0 20px', height: 64, borderBottom: '1px solid var(--color-border-divider)' }}>
        <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" style={{ flex: 'none' }}>
          <circle cx="8" cy="8" r="5.5" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" /><path d="M12 12l6 6" stroke="var(--color-text-muted)" strokeWidth="2" />
        </svg>
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('Search apps, actions, profiles…')}
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-autocomplete="list"
          aria-label={t('Search')}
          aria-activedescendant={current ? `palette-opt-${results.indexOf(current)}` : undefined}
          style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', outline: 'none', color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)', fontSize: 22, fontWeight: 600 }}
        />
        <span style={{ ...mono, border: '1px solid var(--color-border-control)', padding: '4px 8px', color: 'var(--color-text-muted)' }}>{t('Esc')}</span>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 300px', height: 400 }}>
        <div ref={listRef} id="palette-list" role="listbox" aria-label={t('Results')} style={{ overflowY: 'auto', padding: '8px 0' }}>
          {results.length === 0 && <div style={{ ...mono, padding: '24px 20px', color: 'var(--color-text-muted)' }}>{t('No results')}</div>}
          {([...new Set(results.map(r => r.group))] as PaletteGroup[]).map(group => {
            const rows = results.filter(r => r.group === group);
            if (!rows.length) return null;
            return (
              <div key={group} role="group" aria-label={groupLabel(group)}>
                <div aria-hidden="true" style={{ ...mono, padding: '10px 20px 6px', color: 'var(--color-text-muted)' }}>{groupLabel(group)}</div>
                {rows.map(item => {
                  const i = ++optionIndex;
                  const isActive = item === current;
                  return (
                    <div
                      key={item.id}
                      id={`palette-opt-${i}`}
                      role="option"
                      aria-selected={isActive}
                      aria-disabled={item.disabled || undefined}
                      onMouseMove={() => setActive(i)}
                      onClick={() => run(item)}
                      className="flex items-center"
                      style={{
                        gap: 14, minHeight: 52, padding: '6px 20px', cursor: item.disabled ? 'not-allowed' : 'pointer',
                        opacity: item.disabled ? 0.45 : 1,
                        background: isActive ? 'var(--color-bg-elevated)' : 'transparent',
                        boxShadow: isActive ? 'inset 3px 0 0 var(--color-accent)' : 'none',
                      }}
                    >
                      <Glyph item={item} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 17, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                        {item.subtitle && <div style={{ ...mono, fontSize: 10, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.subtitle}</div>}
                      </div>
                      {item.status && <span style={{ ...mono, color: item.status === 'crashed' ? 'var(--color-error-text)' : item.status === 'running' ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>{statusLabel(item.status)}</span>}
                      {item.hint && isActive && !item.disabled && <span style={{ ...mono, color: 'var(--color-text-muted)', minWidth: 64, textAlign: 'right' }}>{item.hint}</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <aside aria-label={t('Details')} style={{ borderLeft: '1px solid var(--color-border-divider)', background: 'var(--color-bg-base)', padding: 20, overflowY: 'auto' }}>
          {current ? <Details item={current} /> : null}
        </aside>
      </div>

      <div aria-live="polite" className="sr-only">{t('{count} results', { count: results.length })}</div>
      <div className="flex items-center flex-wrap" style={{ gap: '6px 22px', padding: '0 20px', minHeight: 44, borderTop: '1px solid var(--color-border-divider)', background: 'var(--color-bg-surface)' }}>
        {[['↑↓', t('navigate')], ['Enter', t('run')], ...(current?.app ? [['Ctrl R', t('restart')], ['Ctrl E', t('edit')], ['Ctrl O', t('folder')]] : [])].map(([k, l]) => (
          <span key={k} style={{ ...mono, color: 'var(--color-text-muted)' }}><span style={{ color: 'var(--color-text-primary)' }}>{k}</span> {l}</span>
        ))}
      </div>
    </div>
  );
}

function Glyph({ item }: { item: PaletteItem }) {
  const letter = (item.title.match(/[\p{L}\p{N}]/u)?.[0] ?? '·').toUpperCase();
  const color = item.color ?? 'var(--color-border-control)';
  return (
    <div aria-hidden="true" style={{
      width: 34, height: 34, flex: 'none', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-letter)', fontSize: 20,
      border: `1px solid ${color}`, color: item.color ? color : 'var(--color-text-secondary)',
      background: item.color ? `color-mix(in srgb, ${color} 14%, transparent)` : 'transparent',
    }}>
      {item.app ? letter : item.group === 'Profiles' ? '⇄' : '›'}
    </div>
  );
}

function Details({ item }: { item: PaletteItem }) {
  const a = item.app;
  const rows: [string, string][] = a
    ? [
        [t('Executable'), a.executable_path],
        [t('Arguments'), a.args.join(' ') || '—'],
        [t('Delay'), a.launch_delay_ms ? `+${(a.launch_delay_ms / 1000).toFixed(1)}s` : '—'],
        [t('Wait for'), waitLabel(a.wait_strategy)],
        [t('Priority'), priorityLabel(a.priority ?? 'normal')],
      ]
    : [];
  return (
    <div className="flex flex-col" style={{ gap: 12 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 26, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1 }}>{item.title}</div>
      {item.status && <div style={{ ...mono, color: 'var(--color-text-muted)' }}>{statusLabel(item.status)}</div>}
      {item.description && <p style={{ margin: 0, fontSize: 15, lineHeight: 1.4, color: 'var(--color-text-secondary)' }}>{item.description}</p>}
      {rows.map(([k, v]) => (
        <div key={k} style={{ borderTop: '1px solid var(--color-border-divider)', paddingTop: 8 }}>
          <div style={{ ...mono, fontSize: 10, color: 'var(--color-text-muted)' }}>{k}</div>
          <div style={{ fontSize: 14, fontWeight: 600, wordBreak: 'break-all' }}>{v}</div>
        </div>
      ))}
    </div>
  );
}
