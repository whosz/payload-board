const HINTS: [string, string][] = [
  ['← →', 'select'], ['Enter', 'start / stop'], ['E', 'edit'], ['R', 'restart'], ['Del', 'remove'],
];

/** Footer with the keyboard shortcuts of the tile strip. */
export function KeyHints() {
  return (
    <footer
      className="flex items-center flex-shrink-0"
      style={{ height: 44, gap: 26, padding: '0 40px', borderTop: '1px solid var(--color-border-divider)', background: 'var(--color-bg-surface)' }}
    >
      {HINTS.map(([key, label]) => (
        <span key={key} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
          <span style={{ color: 'var(--color-text-primary)' }}>{key}</span> {label}
        </span>
      ))}
    </footer>
  );
}
