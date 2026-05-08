import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

interface IconProps {
  icon: IconProp;
  className?: string;
  size?: number;
  active?: boolean;
  crit?: boolean;
  live?: boolean;
}

export function Icon({ icon, className = '', size = 12, active, crit, live }: IconProps) {
  const color = crit
    ? '#FF2D55'
    : live
    ? '#00E5FF'
    : active
    ? '#FFE600'
    : '#54545A';

  return (
    <FontAwesomeIcon
      icon={icon}
      className={className}
      style={{ width: size, height: size, color, flexShrink: 0 }}
    />
  );
}
