import { Button } from '../ui/button';
import { Icon } from '../icons/Icon';
import { faPlay, faPowerOff, faPlus, faXmark, faPen, faTrash } from '../icons';
import { appColor } from '../../lib/appColor';
import { artworkUrl } from '../../lib/appArt';
import { formatClock } from '../../hooks/useSessionSeconds';
import type { Profile } from '../../types';
import type { ProcessStatus } from '../../hooks/useProcessStatus';
import { t } from '../../i18n';

export interface CrashedApp { id: string; name: string; error?: string }

interface Props {
  profile: Profile;
  appStates: { id: string; order: number; status: ProcessStatus }[];
  launching: boolean;
  step: number;
  total: number;
  crashed: CrashedApp[];
  sessionSeconds: number | null;
  runDisabled: boolean;
  onRun: () => void;
  onCancel: () => void;
  onEnd: () => void;
  onAddApp: () => void;
  onEditProfile: () => void;
  onDeleteProfile: () => void;
  onRestartApp: (id: string) => void;
  onClearErrors: () => void;
}

const mono = { fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' } as const;

/** Profile hero: name, live counters, launch-order strip and ONE contextual primary action. */
export function Hero(p: Props) {
  const live = p.appStates.filter(a => a.status === 'running').length;
  const letter = (p.profile.name.match(/[\p{L}\p{N}]/u)?.[0] ?? '·').toUpperCase();
  const first = p.crashed[0];
  const cover = artworkUrl(p.profile.cover_url);

  return (
    <section className="hero" aria-label={t('Profile {name}', { name: p.profile.name })}>
      {cover && (
        <>
          <img src={cover} alt="" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, var(--color-bg-base) 0%, color-mix(in srgb, var(--color-bg-base) 78%, transparent) 50%, color-mix(in srgb, var(--color-bg-base) 25%, transparent) 100%)' }} />
        </>
      )}
      {!cover && <svg className="hero__letter" aria-hidden="true" viewBox="0 0 100 120" preserveAspectRatio="xMaxYMid meet"
        style={{ position: 'absolute', right: 40, top: -10, height: '125%', width: 'auto', opacity: 0.55 }}>
        <text x="96" y="108" textAnchor="end" fill="none" stroke="var(--color-accent)" strokeWidth="0.9"
          style={{ fontFamily: 'var(--font-letter)', fontSize: 130 }}>{letter}</text>
      </svg>}

      <div style={{ position: 'relative' }}>
        <div className="hero__label" style={{ ...mono, color: 'var(--color-accent)', marginBottom: 8 }}>{t('Active profile')}</div>
        <div className="hero__title flex items-center" style={{ gap: 6 }}>
          <h1 className="hero__name">{p.profile.name}</h1>
          <button onClick={p.onEditProfile} title={t('Edit profile')} aria-label={t('Edit profile')} className="tile-btn"><Icon icon={faPen} size={14} /></button>
          <button onClick={p.onDeleteProfile} title={t('Delete profile')} aria-label={t('Delete profile')} className="tile-btn"><Icon icon={faTrash} size={14} crit /></button>
        </div>
      </div>

      <div className="hero__stats" style={{ position: 'relative' }}>
        <span className="hero__apps" style={{ ...mono, color: 'var(--color-text-primary)', fontSize: 13 }}>{t('{count} apps', { count: p.appStates.length })}</span>
        <span style={{ ...mono, fontSize: 13, color: 'var(--color-status-live)' }}>● {t('{count} live', { count: live })}</span>
        <span style={{ ...mono, fontSize: 13, color: p.crashed.length ? 'var(--color-error-text)' : 'var(--color-text-muted)' }}>● {t('{count} crashed', { count: p.crashed.length })}</span>
        {p.sessionSeconds !== null && <span className="hero__timer" style={{ ...mono, fontSize: 13, color: 'var(--color-text-primary)' }}>⏱ {formatClock(p.sessionSeconds)}</span>}
        <span className="hero__strip" aria-hidden="true" style={{ display: 'flex', gap: 4 }}>
          {p.appStates.map((a, i) => (
            <span key={a.id} style={{
              width: 34, height: 4,
              background: a.status === 'running' ? appColor(a.order) : a.status === 'crashed' ? 'var(--color-status-crit)' : 'var(--color-border-default)',
              opacity: p.launching && i + 1 === p.step ? 1 : 0.9,
              outline: p.launching && i + 1 === p.step ? '1px solid var(--color-text-primary)' : 'none',
            }} />
          ))}
        </span>
      </div>

      {first && (
        <div role="alert" className="hero__banner flex items-center flex-wrap" style={{
          position: 'relative', gap: 12, marginTop: 18, padding: '8px 12px',
          border: '1px solid var(--color-status-crit)', background: 'color-mix(in srgb, var(--color-bg-surface) 88%, var(--color-status-crit) 12%)',
        }}>
          <span style={{ ...mono, color: 'var(--color-error-text)', flex: 1, minWidth: 200 }}>
            {t('{name} crashed', { name: first.name })}{first.error ? ` — ${first.error}` : ''}{p.crashed.length > 1 ? ` ${t('(+{count} more)', { count: p.crashed.length - 1 })}` : ''}
          </span>
          <Button variant="default" size="default" onClick={() => p.onRestartApp(first.id)}>{t('Restart {name}', { name: first.name })}</Button>
          <Button variant="destructive" size="default" onClick={p.onClearErrors}>{t('Clear errors')}</Button>
        </div>
      )}

      <div className="hero__actions" style={{ position: 'relative' }}>
        {p.launching ? (
          <Button variant="cta" size="lg" className="h-12 px-7 text-base" onClick={p.onCancel}>
            <Icon icon={faXmark} size={14} /> {t('Cancel {step}/{total}', { step: p.step, total: p.total })}
          </Button>
        ) : live > 0 ? (
          <Button variant="destructive" size="lg" className="h-12 px-7 text-base" onClick={p.onEnd}>
            <Icon icon={faPowerOff} size={14} crit /> {t('End session')}
          </Button>
        ) : (
          <Button variant="fill" size="lg" className="h-12 px-7 text-base" disabled={p.runDisabled} onClick={p.onRun}>
            <Icon icon={faPlay} size={14} color="var(--color-accent-fg)" /> {t('Run sequence')}
          </Button>
        )}
        <Button variant="default" size="lg" className="hero__add h-12 px-6 text-base" onClick={p.onAddApp}>
          <Icon icon={faPlus} size={12} /> {t('Add app')}
        </Button>
      </div>
    </section>
  );
}
