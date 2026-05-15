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
        width: 32,
        height: 18,
        borderRadius: 9,
        border: checked ? 'none' : '1px solid rgba(176,169,197,0.30)',
        background: checked ? 'var(--color-status-live)' : 'var(--color-bg-elevated)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background 0.18s ease, border-color 0.18s ease',
        flexShrink: 0,
        outline: 'none',
      }}
    >
      <SwitchPrimitive.Thumb
        style={{
          display: 'block',
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: checked ? 'var(--color-bg-base)' : 'var(--color-text-secondary)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          transform: checked ? 'translateX(15px)' : 'translateX(1px)',
          transition: 'transform 0.18s ease, background 0.18s ease',
          pointerEvents: 'none',
        }}
      />
    </SwitchPrimitive.Root>
  );
}
