import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, style, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-7 w-full min-w-0 rounded-lg border px-2 py-1 outline-none transition-colors",
        "bg-[var(--color-bg-base)] border-[rgba(176,169,198,0.3)]",
        "text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]",
        "focus:border-[rgba(93,90,242,1)]",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        fontWeight: 400,
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
        fontFamily: 'var(--font-body)',
        fontSize: 10,
        fontWeight: 500,
        color: 'var(--color-text-muted)',
        marginBottom: 4,
      }}>
        {label}
      </div>
      <Input {...props} />
    </div>
  )
}

export { Input, InputField }
