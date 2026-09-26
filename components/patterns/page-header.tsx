import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { ScrambleLabel } from "@/components/addoz/scramble-label"
import { Breadcrumbs, type Crumb } from "./breadcrumbs"

/**
 * Page-level header.
 *  editorial — cream, display type, optional aside (public pages)
 *  band      — full-bleed colour block (purple / black / yellow) for statement pages
 *  app       — calm dashboard header: title, description, actions (no reveal motion)
 * Public variants hook into the site motion layer: the eyebrow decodes and the
 * title rises line by line ([data-reveal]).
 */
type Props = {
  title: ReactNode
  eyebrow?: string
  lead?: ReactNode
  actions?: ReactNode
  aside?: ReactNode
  meta?: ReactNode
  crumbs?: Crumb[]
  variant?: "editorial" | "band" | "app"
  tone?: "cream" | "purple" | "black" | "yellow"
  size?: "xl" | "lg" | "md"
  id?: string
  className?: string
}

export function PageHeader({ title, eyebrow, lead, actions, aside, meta, crumbs, variant = "editorial", tone, size = "lg", id = "page-title", className }: Props) {
  if (variant === "app") {
    return <header className={cn("app-page-header", className)}>
      {crumbs && <Breadcrumbs items={crumbs} />}
      <div className="app-page-header-row">
        <div>
          {eyebrow && <p className="app-eyebrow">{eyebrow}</p>}
          <h1 id={id}>{title}</h1>
          {lead && <p className="app-page-lead">{lead}</p>}
        </div>
        {actions && <div className="app-page-actions">{actions}</div>}
      </div>
      {meta}
    </header>
  }
  const resolvedTone = tone ?? (variant === "band" ? "purple" : "cream")
  return <header className={cn("page-header", `page-header--${variant}`, `tone-${resolvedTone}`, `page-header--${size}`, aside && "has-aside", className)}>
    <div className="page-header-inner">
      <div className="page-header-main">
        {crumbs && <Breadcrumbs items={crumbs} />}
        {eyebrow && <div className="eyebrow"><span className="eyebrow-line" /><ScrambleLabel text={eyebrow} /></div>}
        <h1 id={id} data-reveal>{title}</h1>
        {lead && <div className="page-header-lead">{lead}</div>}
        {actions && <div className="page-header-actions">{actions}</div>}
        {meta && <div className="page-header-meta">{meta}</div>}
      </div>
      {aside && <div className="page-header-aside">{aside}</div>}
    </div>
  </header>
}
