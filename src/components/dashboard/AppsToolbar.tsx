import { Button } from '../ui/button';
import { Icon } from '../icons/Icon';
import { faList, faTableCellsLarge, faChevronDown } from '../icons';
import { t } from '../../i18n';

export type SortOrder = 'manual' | 'az' | 'za';
export type ViewMode = 'grid' | 'list';

interface Props {
  sortOrder: SortOrder;
  onSort: (s: SortOrder) => void;
  sortOpen: boolean;
  onSortOpen: (open: boolean) => void;
  viewMode: ViewMode;
  onView: (v: ViewMode) => void;
}

const sortLabel = (s: SortOrder) => ({ manual: t('Launch order'), az: t('A → Z'), za: t('Z → A') })[s];

/** "Apps · launch order" heading with sort menu and view toggle. */
export function AppsToolbar({ sortOrder, onSort, sortOpen, onSortOpen, viewMode, onView }: Props) {
  return (
    <div className="flex items-center flex-shrink-0" style={{ gap: 6, padding: '16px 40px 0' }} onClick={e => e.stopPropagation()}>
      <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
        {t('Apps')} · {sortLabel(sortOrder)}
      </span>

      <div style={{ position: 'relative' }}>
        <Button variant="outline" size="default" aria-haspopup="menu" aria-expanded={sortOpen} onClick={() => onSortOpen(!sortOpen)} style={{ gap: 6 }}>
          {t('Sort: {order}', { order: sortLabel(sortOrder) })}
          <Icon icon={faChevronDown} size={8} />
        </Button>
        {sortOpen && (
          <div role="menu" style={{
            position: 'absolute', top: 'calc(100% + 4px)', right: 0, minWidth: 160, zIndex: 100, overflow: 'hidden',
            background: 'var(--color-bg-base)', border: '1px solid var(--color-border-default)', borderRadius: 2,
          }}>
            {(['manual', 'az', 'za'] as const).map(opt => (
              <button key={opt} role="menuitemradio" aria-checked={sortOrder === opt} onClick={() => { onSort(opt); onSortOpen(false); }} style={{
                display: 'block', width: '100%', textAlign: 'left', minHeight: 36, padding: '0 14px', border: 'none', cursor: 'pointer',
                background: sortOrder === opt ? 'var(--color-bg-elevated)' : 'transparent',
                color: sortOrder === opt ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
              }}>
                {sortLabel(opt)}
              </button>
            ))}
          </div>
        )}
      </div>

      <Button variant={viewMode === 'grid' ? 'fill' : 'outline'} size="icon" onClick={() => onView('grid')} title={t('Poster view')} aria-label={t('Poster view')} aria-pressed={viewMode === 'grid'}>
        <Icon icon={faTableCellsLarge} size={12} color={viewMode === 'grid' ? 'var(--color-accent-fg)' : undefined} />
      </Button>
      <Button variant={viewMode === 'list' ? 'fill' : 'outline'} size="icon" onClick={() => onView('list')} title={t('List view')} aria-label={t('List view')} aria-pressed={viewMode === 'list'}>
        <Icon icon={faList} size={12} color={viewMode === 'list' ? 'var(--color-accent-fg)' : undefined} />
      </Button>
    </div>
  );
}
