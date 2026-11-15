// Per-profile accent colour: overrides --color-accent / --color-accent-fg on <html>,
// choosing readable shades for the current theme (WCAG 4.5:1 for text on the accent).
export const ACCENT_PRESETS = [
  { name: 'Orange', color: '#ff6a13' },
  { name: 'Cyan', color: '#19e3ff' },
  { name: 'Pink', color: '#ff4fa3' },
  { name: 'Amber', color: '#ffc21a' },
  { name: 'Violet', color: '#9b75ff' },
  { name: 'Lime', color: '#b6ff1a' },
] as const;

const rgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const hex = (c: number[]) => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

function luminance(hexColor: string) {
  const [r, g, b] = rgb(hexColor).map(v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Accent + text-on-accent colours for a profile colour in the given theme. */
export function accentVars(color: string, theme: string): { accent: string; fg: string } {
  if (theme === 'light') {
    let c = color;
    for (let f = 1; f > 0.2 && contrast('#ffffff', c) < 4.5; f -= 0.05) c = hex(rgb(color).map(v => v * f));
    return { accent: c, fg: '#ffffff' };
  }
  return { accent: color, fg: contrast('#121211', color) >= 4.5 ? '#121211' : '#ffffff' };
}

const VARS = ['--color-accent', '--color-accent-fg', '--color-accent-border'] as const;

/** Applies the profile colour (or restores the theme default when undefined). */
export function applyAccent(color: string | undefined, theme: string) {
  const root = document.documentElement.style;
  if (!color) { VARS.forEach(v => root.removeProperty(v)); return; }
  const { accent, fg } = accentVars(color, theme);
  root.setProperty('--color-accent', accent);
  root.setProperty('--color-accent-border', accent);
  root.setProperty('--color-accent-fg', fg);
}
