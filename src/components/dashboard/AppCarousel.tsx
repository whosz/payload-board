import { PosterTile } from './PosterTile';
import { Icon } from '../icons/Icon';
import { faPlus } from '../icons';
import { t } from '../../i18n';
import { useRovingApps, type AppHandlers } from '../../hooks/useRovingApps';
import type { AppEntry } from '../../types';
import type { ProcessInfo } from '../../hooks/useProcessStatus';

export type { AppHandlers };

interface Props {
  apps: AppEntry[];
  getStatus: (id: string) => ProcessInfo;
  makeHandlers: (app: AppEntry) => AppHandlers;
  onAdd: () => void;
}

const WRAP_ABOVE = 7; // more apps than this: wrap into rows instead of one scrolling strip

/** Horizontal strip of poster tiles with roving focus: ←→ Home End move, Enter start/stop, E edit, R restart, Del remove. */
export function AppCarousel({ apps, getStatus, makeHandlers, onAdd }: Props) {
  const wrap = apps.length > WRAP_ABOVE;
  const roving = useRovingApps({ apps, getStatus, makeHandlers, axis: 'horizontal', itemClass: 'poster' });

  return (
    <div
      role="list"
      aria-label={t('Apps')}
      className={wrap ? 'carousel--wrap' : undefined}
      onKeyDown={roving.onKeyDown}
      style={{
        flex: 1, minHeight: 0, display: 'flex', flexWrap: wrap ? 'wrap' : 'nowrap', alignContent: 'flex-start', alignItems: 'flex-start',
        gap: 18, padding: '30px 40px 24px', overflow: wrap ? 'auto' : 'auto hidden',
      }}
    >
      {apps.map((app, i) => (
        <PosterTile
          key={app.id}
          ref={el => { roving.items.current[i] = el; }}
          app={app}
          status={getStatus(app.id)}
          index={i}
          tabIndex={roving.tabIndexFor(i)}
          onFocusTile={() => roving.onFocusItem(i)}
          {...makeHandlers(app)}
        />
      ))}
      <button onClick={onAdd} className="poster poster--add">
        <Icon icon={faPlus} size={22} color="currentColor" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t('Add app')}</span>
      </button>
    </div>
  );
}
