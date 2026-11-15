import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Switch({ checked, onCheckedChange, disabled }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: 40,
        height: 22,
        borderRadius: 2,
        border: `1px solid ${checked ? 'var(--color-accent)' : 'var(--color-border-control)'}`,
        background: checked ? 'var(--color-accent)' : 'var(--color-bg-elevated)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background 0.18s ease, border-color 0.18s ease',
        flexShrink: 0,
      }}
    >
      <SwitchPrimitive.Thumb
        style={{
          display: 'block',
          width: 14,
          height: 14,
          borderRadius: 1,
          background: checked ? 'var(--color-accent-fg)' : 'var(--color-text-secondary)',
          transform: checked ? 'translateX(21px)' : 'translateX(3px)',
          transition: 'transform 0.18s ease, background 0.18s ease',
          pointerEvents: 'none',
        }}
      />
    </SwitchPrimitive.Root>
  );
}
