"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { EmptyState, Input } from "@/components/patterns"
import { categories, categoryGroups } from "../data"
import { CategoryCard } from "./category-card"

/**
 * The complete A–Z category index (Directive 009): a quick filter that narrows every
 * group live, plus a sticky jump-link index on wide screens. Groups with no match
 * (and their index entry) simply drop out while filtering.
 */
export function CategoryIndex() {
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()

  const groups = categoryGroups
    .map(group => ({
      group,
      items: categories
        .filter(category => category.group === group.slug && (!q || category.name.toLowerCase().includes(q)))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter(entry => entry.items.length > 0)

  return <>
    <div className="dc-category-search">
      <Input icon={<Search size={18} aria-hidden="true" />} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Quick filter — try “design”, “finance” or “logistics”" aria-label="Filter categories" />
    </div>

    {groups.length === 0
      ? <EmptyState title="No categories match your search" body="Try a different word, or clear the filter to see the full list." />
      : <div className="dc-az-layout">
        <nav className="dc-group-index" aria-label="Jump to a category group">
          <ul>{groups.map(({ group }) => <li key={group.slug}><a href={`#group-${group.slug}`}>{group.name}</a></li>)}</ul>
        </nav>
        <div className="dc-az-groups">
          {groups.map(({ group, items }) => <section key={group.slug} id={`group-${group.slug}`} className="dc-az-group" aria-labelledby={`heading-${group.slug}`}>
            <h3 id={`heading-${group.slug}`} className="t-h3">{group.name}</h3>
            <p className="dc-az-group-line">{group.line}</p>
            <div className="category-chip-grid">{items.map(category => <CategoryCard key={category.slug} category={category} variant="compact" />)}</div>
          </section>)}
        </div>
      </div>}
  </>
}
