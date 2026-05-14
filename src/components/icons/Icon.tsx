import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

interface IconProps {
  icon: IconProp;
  className?: string;
  size?: number;
  active?: boolean;
  crit?: boolean;
  live?: boolean;
  muted?: boolean;
}

export function Icon({ icon, className = '', size = 12, active, crit, live, muted }: IconProps) {
  let color = 'var(--color-text-secondary)';
  if (crit)   color = 'var(--color-status-crit)';
  else if (live || active) color = 'var(--color-status-live)';
  else if (muted) color = 'var(--color-text-muted)';

  return (
    <FontAwesomeIcon
      icon={icon}
      className={className}
      style={{ width: size, height: size, color, flexShrink: 0 }}
    />
  );
}
