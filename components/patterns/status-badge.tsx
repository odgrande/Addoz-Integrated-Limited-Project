import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export type BadgeTone = "neutral" | "info" | "accent" | "progress" | "success" | "warning" | "danger" | "dark"

/**
 * Status pill. Tones use the brand palette with black text on yellow/orange
 * (contrast rule from Directive 003) and white only on purple/black.
 */
export function StatusBadge({ tone = "neutral", children, dot = true, className }: { tone?: BadgeTone; children: ReactNode; dot?: boolean; className?: string }) {
  return <span className={cn("status-badge", `badge-${tone}`, className)}>{dot && <span className="badge-dot" aria-hidden="true" />}{children}</span>
}

/** Small uppercase marker for sample / prototype data. */
export function SampleTag({ children = "Sample", className }: { children?: ReactNode; className?: string }) {
  return <span className={cn("sample-tag", className)}>{children}</span>
}
