import type { ReactNode } from "react"
import { FlaskConical } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * The one consistent way to say "this is prototype / sample data" — used wherever
 * a screen shows sample jobs, companies, applicants or a not-yet-connected action.
 */
export function PrototypeNote({ title = "Prototype preview", children, compact, className }: { title?: string; children: ReactNode; compact?: boolean; className?: string }) {
  return <aside className={cn("proto-note", compact && "proto-compact", className)}>
    <FlaskConical size={compact ? 16 : 20} aria-hidden="true" />
    <p><strong>{title}.</strong> {children}</p>
  </aside>
}
