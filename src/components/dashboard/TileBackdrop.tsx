import { useId } from 'react';

// Race-track outlines used as the tile background when an app has no artwork.
const TRACKS = [
  'M20 70 C20 30 60 20 90 30 S150 20 175 40 S185 85 150 85 S100 70 70 85 S20 95 20 70Z',
  'M30 50 L60 20 H140 C170 20 180 50 160 60 L120 62 L150 85 H50 C30 85 25 65 30 50Z',
  'M25 40 C40 15 90 15 100 40 S160 70 175 45 C185 70 160 90 120 85 S40 90 30 70 S15 55 25 40Z',
  'M40 22 H160 C175 22 180 38 170 48 L122 54 C110 56 110 68 122 70 L165 76 C176 78 174 92 160 92 H40 C25 92 20 80 30 70 L60 50 C70 43 55 22 40 22Z',
  'M30 60 C30 30 70 30 80 45 C90 60 110 60 120 45 C130 30 175 30 175 60 C175 85 130 85 100 75 C70 85 30 85 30 60Z',
];

interface Props {
  color: string;
  order: number;
  state: 'live' | 'crashed' | 'idle';
}

export function TileBackdrop({ color, order, state }: Props) {
  const grain = 'grain' + useId().replace(/:/g, '');
  const path = TRACKS[Math.abs(order) % TRACKS.length];
  const stroke = state === 'live' ? color : state === 'crashed' ? 'var(--color-status-crit)' : 'var(--color-border-default)';
  const glow = state === 'idle' ? 'transparent' : `color-mix(in srgb, ${stroke} 70%, transparent)`;
  const wash = state === 'idle'
    ? 'color-mix(in srgb, var(--color-text-primary) 4%, transparent)'
    : `color-mix(in srgb, ${stroke} 16%, transparent)`;

  return (
    <div aria-hidden="true" style={{
      position: 'absolute', inset: 0,
      background: `radial-gradient(110% 95% at 80% 35%, ${wash} 0%, transparent 62%), linear-gradient(160deg, var(--color-bg-elevated) 0%, var(--color-bg-surface) 100%)`,
    }}>
      <svg viewBox="0 0 200 100" preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', right: -4, top: 18, width: '70%', height: '74%', overflow: 'visible', filter: `drop-shadow(0 0 5px ${glow})` }}>
        <path d={path} fill="none" stroke="#000" strokeOpacity=".55" strokeWidth="6" strokeLinejoin="round" />
        <path d={path} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
        <path d={path} fill="none" stroke={stroke} strokeOpacity=".25" strokeWidth="7" strokeLinejoin="round" strokeDasharray="1 5" />
        {state === 'live' && (
          <circle className="tile-mover" r="2.6" fill="#fff">
            <animateMotion dur={`${5 + (order % 3)}s`} repeatCount="indefinite" path={path} />
          </circle>
        )}
      </svg>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.09 }}>
        <filter id={grain}>
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${grain})`} />
      </svg>
    </div>
  );
}
