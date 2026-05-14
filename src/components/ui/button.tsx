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
          "uppercase tracking-[0.25px] leading-[12px]",
          "border-[var(--color-accent-border)] text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-btn-cta-hover)] hover:border-[var(--color-accent-border)]",
        ],
        /* Destructive Large — End Session: transparent + red border, red icon */
        destructive: [
          "uppercase tracking-[0.25px] leading-[12px]",
          "border-[var(--color-btn-destructive-border)] text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-error-bg)] hover:border-[var(--color-btn-destructive-border-hover)]",
        ],
        /* Default — modal action buttons (Browse, Cancel, Save, theme selector) */
        default: [
          "uppercase",
          "border-[var(--color-border-subtle)] text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-btn-default-hover)] hover:text-[var(--color-text-primary)]",
        ],
        /* Fill — Save buttons in modals */
        fill: [
          "uppercase tracking-[0.25px] leading-[12px]",
          "bg-[var(--color-btn-fill-bg)] border-[var(--color-accent-border)] text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-btn-fill-hover)] hover:border-[var(--color-accent-border)]",
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
          "border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]",
          "hover:bg-[var(--color-btn-default-hover)] hover:text-[var(--color-text-primary)]",
        ],
      },
      size: {
        /* 32px — top header */
        lg: "h-8 px-3 rounded-lg text-xs font-bold uppercase tracking-[1px] leading-[18px]",
        /* 28px — table actions / modals */
        default: "h-7 px-2 rounded-lg text-[10px] font-semibold tracking-[0.25px] leading-[12px]",
        /* 30×28 — icon-only view toggle */
        icon: "h-7 w-[30px] rounded-lg",
        /* sidebar navigation */
        nav: "h-10 w-full px-3 rounded-none justify-start gap-2",
        /* 24px — small utility */
        sm: "h-6 px-2 rounded-md text-[10px] font-semibold",
      },
    },
    compoundVariants: [
      /* Destructive Small (default/sm sizes) — filled with error-bg, error-text color */
      {
        variant: "destructive",
        size: "default",
        className: [
          "bg-[var(--color-error-bg)] border-[var(--color-btn-destructive-border)] text-[var(--color-error-text)]",
          "hover:bg-[rgba(100,2,11,1)] hover:border-[var(--color-btn-destructive-border-hover)] hover:text-[var(--color-text-primary)]",
        ],
      },
      {
        variant: "destructive",
        size: "sm",
        className: [
          "bg-[var(--color-error-bg)] border-[var(--color-btn-destructive-border)] text-[var(--color-error-text)]",
          "hover:bg-[rgba(100,2,11,1)] hover:border-[var(--color-btn-destructive-border-hover)] hover:text-[var(--color-text-primary)]",
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
