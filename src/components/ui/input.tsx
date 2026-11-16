import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, style, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-[2px] border px-2 py-1 outline-none transition-colors",
        "bg-[var(--color-bg-base)] border-[var(--color-border-control)]",
        "text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]",
        "focus:border-[var(--color-accent)]",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: 500,
        ...style,
      }}
      {...props}
    />
  )
}

function InputField({ label, ...props }: React.ComponentProps<"input"> & { label: string }) {
  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--color-text-muted)',
        marginBottom: 6,
      }}>
        {label}
      </div>
      <Input {...props} />
    </div>
  )
}

export { Input, InputField }
