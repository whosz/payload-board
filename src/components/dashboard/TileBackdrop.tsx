import { useId } from 'react';

// Tile background when an app has no artwork: the app's first letter, outlined in its colour.
interface Props {
  color: string;
  name: string;
  state: 'live' | 'crashed' | 'idle';
}

export function TileBackdrop({ color, name, state }: Props) {
  const grain = 'grain' + useId().replace(/:/g, '');
  const letter = (name.match(/[\p{L}\p{N}]/u)?.[0] ?? '·').toUpperCase();
  const stroke = state === 'live' ? color : state === 'crashed' ? 'var(--color-status-crit)' : 'var(--color-border-default)';
  const glow = state === 'idle' ? 'transparent' : `color-mix(in srgb, ${stroke} var(--tile-glow), transparent)`;
  const wash = state === 'idle'
    ? 'color-mix(in srgb, var(--color-text-primary) 4%, transparent)'
    : `color-mix(in srgb, ${stroke} 16%, transparent)`;

  return (
    <div aria-hidden="true" style={{
      position: 'absolute', inset: 0,
      background: `radial-gradient(110% 95% at 80% 35%, ${wash} 0%, transparent 62%), linear-gradient(160deg, var(--color-bg-elevated) 0%, var(--color-bg-surface) 100%)`,
    }}>
      <svg viewBox="0 0 100 120" preserveAspectRatio="xMaxYMax meet"
        style={{ position: 'absolute', right: 16, bottom: 2, width: '50%', height: '88%', overflow: 'visible', filter: `drop-shadow(0 0 5px ${glow})` }}>
        {[
          { stroke: 'var(--tile-outline)', strokeWidth: 4 },
          { stroke, strokeWidth: 1.6, fill: `color-mix(in srgb, ${stroke} var(--tile-letter-fill), transparent)` },
          { stroke, strokeOpacity: 'var(--tile-echo)', strokeWidth: 5, strokeDasharray: '1 4' },
        ].map((st, i) => (
          <text key={i} x="92" y="108" textAnchor="end" fill="none" strokeLinejoin="round"
            style={{ fontFamily: 'var(--font-letter)', fontWeight: 400, fontSize: 128 }} {...st}>
            {letter}
          </text>
        ))}
      </svg>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 'var(--tile-grain)' }}>
        <filter id={grain}>
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${grain})`} />
      </svg>
    </div>
  );
}
