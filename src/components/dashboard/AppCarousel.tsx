import { useRef, useState } from 'react';
import { PosterTile } from './PosterTile';
import { Icon } from '../icons/Icon';
import { faPlus } from '../icons';
import type { AppEntry } from '../../types';
import type { ProcessInfo } from '../../hooks/useProcessStatus';
import { t } from '../../i18n';

export interface AppHandlers {
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onOpenPath: () => void;
  onEdit: (app: AppEntry) => void;
  onRemove: (id: string) => void;
}

interface Props {
  apps: AppEntry[];
  getStatus: (id: string) => ProcessInfo;
  makeHandlers: (app: AppEntry) => AppHandlers;
  onAdd: () => void;
}

const WRAP_ABOVE = 7; // more apps than this: wrap into rows instead of one scrolling strip

/** Horizontal strip of poster tiles with roving focus: ←→ Home End move, Enter start/stop, E edit, R restart, Del remove. */
export function AppCarousel({ apps, getStatus, makeHandlers, onAdd }: Props) {
  const [focusIdx, setFocusIdx] = useState(0);
  const tiles = useRef<(HTMLDivElement | null)[]>([]);
  const wrap = apps.length > WRAP_ABOVE;

  const focus = (i: number) => tiles.current[Math.max(0, Math.min(apps.length - 1, i))]?.focus();

  const onKeyDown = (e: React.KeyboardEvent) => {
    const el = e.target as HTMLElement;
    if (!el.classList.contains('poster')) return; // keys inside the tile's own buttons keep their normal behaviour
    const i = Number(el.dataset.index);
    const app = apps[i];
    const h = makeHandlers(app);
    const running = getStatus(app.id).status === 'running';
    const key = e.key.toLowerCase();
    if (key === 'arrowright') focus(i + 1);
    else if (key === 'arrowleft') focus(i - 1);
    else if (key === 'home') focus(0);
    else if (key === 'end') focus(apps.length - 1);
    else if (key === 'enter' || key === ' ') (running ? h.onStop : h.onStart)();
    else if (key === 'e') h.onEdit(app);
    else if (key === 'r') h.onRestart();
    else if (key === 'delete') h.onRemove(app.id);
    else return;
    e.preventDefault();
  };

  return (
    <div
      role="list"
      aria-label={t('Apps')}
      className={wrap ? 'carousel--wrap' : undefined}
      onKeyDown={onKeyDown}
      style={{
        flex: 1, minHeight: 0, display: 'flex', flexWrap: wrap ? 'wrap' : 'nowrap', alignContent: 'flex-start', alignItems: 'flex-start',
        gap: 18, padding: '30px 40px 24px', overflow: wrap ? 'auto' : 'auto hidden',
      }}
    >
      {apps.map((app, i) => (
        <PosterTile
          key={app.id}
          ref={el => { tiles.current[i] = el; }}
          app={app}
          status={getStatus(app.id)}
          index={i}
          tabIndex={i === Math.min(focusIdx, apps.length - 1) ? 0 : -1}
          onFocusTile={() => setFocusIdx(i)}
          {...makeHandlers(app)}
        />
      ))}
      <button
        onClick={onAdd}
        className="poster"
        style={{ borderStyle: 'dashed', borderColor: 'var(--color-border-default)', alignItems: 'center', justifyContent: 'center', gap: 14, cursor: 'pointer', color: 'var(--color-text-secondary)', background: 'transparent' }}
      >
        <Icon icon={faPlus} size={22} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t('Add app')}</span>
      </button>
    </div>
  );
}
