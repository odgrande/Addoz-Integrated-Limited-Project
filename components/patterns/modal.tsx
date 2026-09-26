"use client"

import type { ReactNode } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * ADDOZ modal on Base UI Dialog (focus trap, Esc, scroll lock, aria wiring).
 * variant "modal": centred card. variant "sheet": slides in from the side on
 * tablet/desktop and up from the bottom on phones — used for filter panels and
 * detail views in the dashboards.
 */
export function Modal({ open, onOpenChange, title, description, eyebrow, children, footer, size = "md", variant = "modal", className }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  eyebrow?: string
  children?: ReactNode
  footer?: ReactNode
  size?: "sm" | "md" | "lg"
  variant?: "modal" | "sheet"
  className?: string
}) {
  return <DialogPrimitive.Root open={open} onOpenChange={next => onOpenChange(next)}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="modal-backdrop" />
      <DialogPrimitive.Popup className={cn(variant === "sheet" ? "sheet-panel" : "modal-panel", `modal-${size}`, className)}>
        <div className="modal-head">
          <div>
            {eyebrow && <p className="modal-eyebrow">{eyebrow}</p>}
            <DialogPrimitive.Title className="modal-title">{title}</DialogPrimitive.Title>
            {description && <DialogPrimitive.Description className="modal-description">{description}</DialogPrimitive.Description>}
          </div>
          <DialogPrimitive.Close className="modal-close" aria-label="Close"><X size={20} /></DialogPrimitive.Close>
        </div>
        {children && <div className="modal-body">{children}</div>}
        {footer && <div className="modal-foot">{footer}</div>}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
}
