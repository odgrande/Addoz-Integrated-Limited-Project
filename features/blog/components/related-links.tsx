import { FileSearch, MessagesSquare, Pencil, Search } from "lucide-react"
import { AppLink } from "@/components/patterns"
import { careerTools } from "@/features/ai/tools"

const icons = { "file-search": FileSearch, messages: MessagesSquare, pencil: Pencil }

/** Related links at the foot of an article: the three tools, plus /jobs. */
export function RelatedLinks() {
  return (
    <div className="bl-related-grid">
      {careerTools.map(tool => {
        const Icon = icons[tool.icon]
        return (
          <AppLink key={tool.slug} href={`/career-tools/${tool.slug}`} className="card-frame is-interactive bl-related-card">
            <span className="bl-related-icon" aria-hidden="true"><Icon size={16} /></span>
            <span>{tool.name}</span>
          </AppLink>
        )
      })}
      <AppLink href="/jobs" className="card-frame is-interactive bl-related-card">
        <span className="bl-related-icon" aria-hidden="true"><Search size={16} /></span>
        <span>Browse jobs</span>
      </AppLink>
    </div>
  )
}
