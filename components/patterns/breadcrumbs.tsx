import { ChevronRight } from "lucide-react"
import { AppLink } from "./app-link"

export type Crumb = { label: string; href?: string }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return <nav className="breadcrumbs" aria-label="Breadcrumb">
    <ol>
      {items.map((item, index) => <li key={item.label}>
        {item.href && index < items.length - 1 ? <AppLink href={item.href}>{item.label}</AppLink> : <span aria-current={index === items.length - 1 ? "page" : undefined}>{item.label}</span>}
        {index < items.length - 1 && <ChevronRight size={13} aria-hidden="true" />}
      </li>)}
    </ol>
  </nav>
}
