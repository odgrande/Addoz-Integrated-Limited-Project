"use client"

import { useCallback, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { SearchX } from "lucide-react"
import { Flip, gsap, reducedMotion, useGSAP } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { ActionButton, EmptyState, FilterBar, SearchBar } from "@/components/patterns"
import { companies, companyIndustries } from "../data"
import { CompanyCard } from "./company-card"

type Filters = { q: string; industry: string; location: string }
const emptyFilters: Filters = { q: "", industry: "", location: "" }

/**
 * Search + filter for the company directory (Directive 009): name search, a single
 * industry chip and a location select, all client-side and instant. The grid reflows
 * with Flip on every change, mirroring the jobs browser's technique.
 */
export function CompaniesBrowser() {
  const root = useRef<HTMLElement>(null)
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [draft, setDraft] = useState("")
  const { contextSafe } = useGSAP(() => {}, { scope: root })

  const apply = useCallback((patch: Partial<Filters>) => {
    const grid = root.current?.querySelector(".company-grid")
    const state = grid && !reducedMotion() ? Flip.getState(grid.querySelectorAll(".company-card")) : null
    flushSync(() => setFilters(current => ({ ...current, ...patch })))
    if (!state) return
    contextSafe(() => {
      Flip.from(state, {
        targets: root.current!.querySelectorAll(".company-grid .company-card"),
        duration: 0.5, ease: "power3.inOut", absoluteOnLeave: true, prune: true,
        onEnter: els => gsap.fromTo(els, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, delay: 0.1, stagger: 0.03, clearProps: "opacity,transform" }),
        onLeave: els => gsap.to(els, { opacity: 0, duration: 0.2 }),
      })
    })()
  }, [contextSafe])

  const clear = () => { setDraft(""); apply(emptyFilters) }
  const active = (filters.q ? 1 : 0) + (filters.industry ? 1 : 0) + (filters.location ? 1 : 0)

  const q = filters.q.trim().toLowerCase()
  const results = companies.filter(company => {
    if (q && !company.name.toLowerCase().includes(q)) return false
    if (filters.industry && company.industry !== filters.industry) return false
    if (filters.location && company.location !== filters.location) return false
    return true
  })

  return <section className="page-section" ref={root} aria-label="Search and filter companies">
    <SearchBar
      query={draft}
      location={filters.location}
      onQueryChange={setDraft}
      onLocationChange={location => apply({ location })}
      onSubmit={() => apply({ q: draft })}
      label="Search companies"
      placeholder="Search companies by name"
      submitLabel="Search"
    />

    <div className="dc-industry-filter">
      <p className="t-label">Industry</p>
      <div className="filter-chips" role="group" aria-label="Filter by industry">
        <button type="button" className={cn("chip", !filters.industry && "is-active")} aria-pressed={!filters.industry} onClick={() => apply({ industry: "" })}>All industries</button>
        {companyIndustries.map(industry => <button key={industry} type="button" className={cn("chip", filters.industry === industry && "is-active")} aria-pressed={filters.industry === industry} onClick={() => apply({ industry: filters.industry === industry ? "" : industry })}>{industry}</button>)}
      </div>
    </div>

    <FilterBar count={<><strong className="tabular">{results.length}</strong> {results.length === 1 ? "company" : "companies"}</>} />

    {results.length > 0
      ? <div className="company-grid">{results.map(company => <CompanyCard key={company.slug} company={company} />)}</div>
      : <EmptyState icon={<SearchX size={24} strokeWidth={1.8} />} title="No companies match those filters" body="Try a different search term, industry or location." action={active > 0 ? <ActionButton variant="dark" onClick={clear}>Clear filters</ActionButton> : undefined} />}
  </section>
}
