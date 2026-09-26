import { ArrowUpRight, FileSearch, MessagesSquare, Pencil, Search } from "lucide-react"
import { AppLink, Reveal } from "@/components/patterns"
import { careerTools, type ToolSlug } from "@/features/ai/tools"

const icons = { "file-search": FileSearch, messages: MessagesSquare, pencil: Pencil }

/**
 * Shown at the foot of every tool page: the other two tools, plus a way back
 * into /jobs. This is each tool page's one Reveal group.
 */
export function ToolCrossLinks({ current }: { current: ToolSlug }) {
  const others = careerTools.filter(tool => tool.slug !== current)
  return (
    <Reveal className="ci-crosslinks" mode="scroll">
      {others.map(tool => {
        const Icon = icons[tool.icon]
        return (
          <AppLink key={tool.slug} href={`/career-tools/${tool.slug}`} className="card-frame is-interactive ci-crosslink">
            <span className="ci-crosslink-icon" aria-hidden="true"><Icon size={18} /></span>
            <span>
              <span>{tool.name}</span>
              <small>{tool.detail}</small>
            </span>
          </AppLink>
        )
      })}
      <AppLink href="/jobs" className="card-frame is-interactive ci-crosslink">
        <span className="ci-crosslink-icon" aria-hidden="true"><Search size={18} /></span>
        <span>
          <span className="ci-crosslink-title">Browse jobs <ArrowUpRight size={14} aria-hidden="true" /></span>
          <small>Find a role to bring here</small>
        </span>
      </AppLink>
    </Reveal>
  )
}
