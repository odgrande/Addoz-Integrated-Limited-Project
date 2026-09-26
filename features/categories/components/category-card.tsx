import { ArrowUpRight, Blocks, Code2, Megaphone, MessagesSquare, PencilLine, PenTool, type LucideIcon } from "lucide-react"
import { AppLink } from "@/components/patterns/app-link"
import { plural } from "@/lib/format"
import { jobsInCategory } from "@/features/jobs/data"
import type { Category } from "../data"

// Same icons as the homepage "What's your thing?" explorer
const icons: Record<string, LucideIcon> = { code: Code2, pen: PenTool, megaphone: Megaphone, messages: MessagesSquare, blocks: Blocks, pencil: PencilLine }

/**
 * Category card. `feature` = the six homepage categories (icon, line, description);
 * `compact` = the A–Z index. Icons re-trace on hover through the public motion layer.
 */
export function CategoryCard({ category, variant = "feature", index }: { category: Category; variant?: "feature" | "compact"; index?: number }) {
  const count = jobsInCategory(category.name).length
  const Icon = category.icon ? icons[category.icon] : undefined
  if (variant === "compact") {
    return <AppLink href={`/categories/${category.slug}`} className="category-chip-card">
      <span className="category-chip-name">{category.name}</span>
      <span className="category-chip-count">{count ? plural(count, "sample role") : "—"}</span>
    </AppLink>
  }
  return <AppLink href={`/categories/${category.slug}`} className="category-card">
    <span className="category-card-top">
      {index !== undefined && <span className="category-card-index">{String(index + 1).padStart(2, "0")}</span>}
      {Icon && <Icon className="category-icon" strokeWidth={1.4} aria-hidden="true" />}
    </span>
    <span className="category-card-name">{category.name}</span>
    <span className="category-card-line">{category.line}</span>
    <span className="category-card-description">{category.description}</span>
    <span className="category-card-foot"><span>{count ? plural(count, "sample role") : "Roles coming soon"}</span><ArrowUpRight size={20} aria-hidden="true" /></span>
  </AppLink>
}
