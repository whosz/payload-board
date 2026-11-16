import { AppListRow } from './AppListRow';
import { t } from '../../i18n';
import { useRovingApps, type AppHandlers } from '../../hooks/useRovingApps';
import type { AppEntry } from '../../types';
import type { ProcessInfo } from '../../hooks/useProcessStatus';

interface Props {
  apps: AppEntry[];
  getStatus: (id: string) => ProcessInfo;
  makeHandlers: (app: AppEntry) => AppHandlers;
}

/** List view with roving focus: ↑↓ Home End, Enter start/stop, E edit, R restart, Del remove. */
export function AppList({ apps, getStatus, makeHandlers }: Props) {
  const roving = useRovingApps({ apps, getStatus, makeHandlers, axis: 'vertical', itemClass: 'lrow' });
  return (
    <div role="list" aria-label={t('Apps')} onKeyDown={roving.onKeyDown} className="flex flex-col flex-1 overflow-auto" style={{ gap: 8, padding: '16px 40px 24px' }}>
      {apps.map((app, i) => (
        <AppListRow
          key={app.id}
          ref={el => { roving.items.current[i] = el; }}
          app={app}
          status={getStatus(app.id)}
          index={i}
          tabIndex={roving.tabIndexFor(i)}
          onFocusRow={() => roving.onFocusItem(i)}
          {...makeHandlers(app)}
        />
      ))}
    </div>
  );
}
