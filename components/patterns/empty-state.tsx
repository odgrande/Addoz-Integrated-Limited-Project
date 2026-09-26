import type { ReactNode } from "react"
import { Asterisk } from "lucide-react"
import { cn } from "@/lib/utils"

/** Empty / zero state — says what happened and what to do next. */
export function EmptyState({ title, body, icon, action, tone = "cream", className }: {
  title: string
  body?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  tone?: "cream" | "white" | "dark"
  className?: string
}) {
  return <div className={cn("empty-state", `empty-${tone}`, className)} role="status">
    <span className="empty-icon" aria-hidden="true">{icon ?? <Asterisk size={26} strokeWidth={1.6} />}</span>
    <h3>{title}</h3>
    {body && <div className="empty-body">{body}</div>}
    {action && <div className="empty-action">{action}</div>}
  </div>
}
