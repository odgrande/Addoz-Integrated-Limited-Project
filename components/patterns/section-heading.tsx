import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { ScrambleLabel } from "@/components/addoz/scramble-label"

/** Section heading in the homepage language (.section-heading): eyebrow, big h2, aside copy or action. */
export function SectionHeading({ eyebrow, title, lead, action, id, className, as: Tag = "h2" }: {
  eyebrow?: string
  title: ReactNode
  lead?: ReactNode
  action?: ReactNode
  id?: string
  className?: string
  as?: "h2" | "h3"
}) {
  return <div className={cn("section-heading", className)}>
    <div>
      {eyebrow && <div className="eyebrow"><span className="eyebrow-line" /><ScrambleLabel text={eyebrow} /></div>}
      <Tag id={id} data-reveal>{title}</Tag>
    </div>
    {(lead || action) && <div className="section-heading-aside">
      {lead && <p>{lead}</p>}
      {action}
    </div>}
  </div>
}
