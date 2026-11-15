import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/icons/Icon"
import { faXmark } from "@/components/icons"
import { t } from "@/i18n"

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/65 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  width = 480,
  tone = "default",
  style,
  ...props
}: DialogPrimitive.Popup.Props & {
  /** max width in px */
  width?: number
  /** "danger" tints the frame red (destructive confirmations) */
  tone?: "default" | "danger"
}) {
  const edge = tone === "danger" ? "var(--color-status-crit)" : "var(--color-accent)"
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 flex w-full max-w-[calc(100%-2rem)] max-h-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-5 overflow-y-auto rounded-[2px] border bg-[var(--color-bg-surface)] p-6 text-sm text-popover-foreground outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        style={{
          maxWidth: `min(${width}px, calc(100% - 2rem))`,
          borderColor: tone === "danger" ? "var(--color-btn-destructive-border)" : "var(--color-border-default)",
          borderTop: `3px solid ${edge}`,
          ...style,
        }}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

/** Standard modal header: display-font title (also the dialog's accessible name) + close button. */
function ModalHeader({ title }: { title: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4" style={{ marginTop: -4 }}>
      <DialogPrimitive.Title
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 900,
          fontSize: 28,
          lineHeight: 1,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--color-text-primary)",
          margin: 0,
        }}
      >
        {title}
      </DialogPrimitive.Title>
      <DialogPrimitive.Close className="tile-btn" aria-label={t('Close')} style={{ marginTop: -6, marginRight: -8 }}>
        <Icon icon={faXmark} size={14} />
      </DialogPrimitive.Close>
    </div>
  )
}

/** Standard modal footer: divider + right-aligned actions (secondary first, primary last). */
function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-3" style={{ borderTop: "1px solid var(--color-border-divider)", paddingTop: 16 }}>
      {children}
    </div>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          {t('Close')}
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  ModalFooter,
  ModalHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
