import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 border bg-transparent whitespace-nowrap transition-all outline-none select-none cursor-pointer disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* CTA — Run Sequence / Add App: transparent + accent border, teal icon */
        cta: [
          "uppercase",
          "border-[var(--color-accent-border)] text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-btn-cta-hover)] hover:border-[var(--color-accent-border)]",
        ],
        /* Destructive Large — End Session: transparent + red border, red icon */
        destructive: [
          "uppercase",
          "border-[var(--color-btn-destructive-border)] text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-error-bg)] hover:border-[var(--color-btn-destructive-border-hover)]",
        ],
        /* Default — modal action buttons (Browse, Cancel, Save, theme selector) */
        default: [
          "uppercase",
          "border-[var(--color-border-default)] text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-btn-default-hover)] hover:text-[var(--color-text-primary)]",
        ],
        /* Fill — Save buttons in modals, selected theme (accent-filled) */
        fill: [
          "uppercase",
          "bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-accent-fg)]",
          "hover:brightness-110",
        ],
        /* Ghost — no border, muted */
        ghost: [
          "border-transparent text-[var(--color-text-muted)]",
          "hover:bg-[var(--color-btn-cta-hover)] hover:text-[var(--color-text-primary)]",
        ],
        /* Nav — sidebar NavigationButton */
        nav: [
          "border-transparent text-[var(--color-text-secondary)]",
          "hover:text-[var(--color-text-primary)]",
        ],
        /* Outline — Sort / filter controls (text-secondary, no uppercase) */
        outline: [
          "border-[var(--color-border-default)] text-[var(--color-text-secondary)]",
          "hover:bg-[var(--color-btn-default-hover)] hover:text-[var(--color-text-primary)]",
        ],
      },
      size: {
        /* 36px — one scale for every text button */
        lg: "h-9 px-4 rounded-[2px] text-[13px] font-semibold tracking-[0.06em] leading-none",
        default: "h-9 px-3 rounded-[2px] text-[13px] font-semibold tracking-[0.06em] leading-none",
        /* 36×36 — icon-only view toggle */
        icon: "h-9 w-9 rounded-[2px]",
        /* sidebar navigation */
        nav: "h-10 w-full px-3 rounded-none justify-start gap-2",
        /* 32px — small utility */
        sm: "h-8 px-2.5 rounded-[2px] text-xs font-semibold tracking-[0.06em]",
      },
    },
    compoundVariants: [
      /* Destructive Small (default/sm sizes) — filled with error-bg, error-text color */
      {
        variant: "destructive",
        size: "default",
        className: [
          "bg-[var(--color-error-bg)] border-[var(--color-btn-destructive-border)] text-[var(--color-error-text)]",
          "hover:bg-[color-mix(in_srgb,var(--color-status-crit)_22%,transparent)] hover:border-[var(--color-btn-destructive-border-hover)] hover:text-[var(--color-text-primary)]",
        ],
      },
      {
        variant: "destructive",
        size: "sm",
        className: [
          "bg-[var(--color-error-bg)] border-[var(--color-btn-destructive-border)] text-[var(--color-error-text)]",
          "hover:bg-[color-mix(in_srgb,var(--color-status-crit)_22%,transparent)] hover:border-[var(--color-btn-destructive-border-hover)] hover:text-[var(--color-text-primary)]",
        ],
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
