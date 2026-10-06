"use client"

import { useCallback, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { SearchX } from "lucide-react"
import { Flip, gsap, reducedMotion, useGSAP } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { ActionButton, AppLink, EmptyState, FilterBar, PageHeader, Reveal, SectionHeading } from "@/components/patterns"
import { emptyFilters, filterJobs, jobTypes, sortOptions, type Job, type JobType, type SortId } from "@/features/jobs/data"
import { getCategoryByName, type Category } from "@/features/categories/data"
import { JobCard } from "@/features/jobs/components/job-card"
import { CategoryCard } from "@/features/categories/components/category-card"
import { getState, nearbyAreas, type Area } from "../data"
import { LocationCard } from "./location-card"

type Filters = { types: JobType[]; sort: SortId }

/**
 * Location detail (Directive 009): PageHeader for the area + state, a job type chip
 * filter and sort (Flip reflow), the categories hiring here (derived from the area's
 * jobs) and nearby areas — all driven from the shared locations/jobs data.
 */
export function LocationDetail({ area, jobs }: { area: Area; jobs: Job[] }) {
  const root = useRef<HTMLElement>(null)
  const [filters, setFilters] = useState<Filters>({ types: [], sort: "featured" })
  const { contextSafe } = useGSAP(() => {}, { scope: root })
  const areaState = getState(area.state)
  const base = jobs
  const nearby = nearbyAreas(area.slug)

  const categoriesHere = [...new Set(base.map(job => job.category))]
    .map(name => getCategoryByName(name))
    .filter((category): category is Category => !!category)

  const apply = useCallback((patch: Partial<Filters>) => {
    const grid = root.current?.querySelector(".job-grid")
    const state = grid && !reducedMotion() ? Flip.getState(grid.querySelectorAll(".job-card")) : null
    flushSync(() => setFilters(current => ({ ...current, ...patch })))
    if (!state) return
    contextSafe(() => {
      Flip.from(state, {
        targets: root.current!.querySelectorAll(".job-grid .job-card"),
        duration: 0.5, ease: "power3.inOut", absoluteOnLeave: true, prune: true,
        onEnter: els => gsap.fromTo(els, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, delay: 0.1, stagger: 0.03, clearProps: "opacity,transform" }),
        onLeave: els => gsap.to(els, { opacity: 0, duration: 0.2 }),
      })
    })()
  }, [contextSafe])

  const toggleType = (type: JobType) => apply({ types: filters.types.includes(type) ? filters.types.filter(item => item !== type) : [...filters.types, type] })

  const visible = filterJobs(base, { ...emptyFilters, types: filters.types, sort: filters.sort })

  return <article>
    <PageHeader
      crumbs={[{ label: "Jobs", href: "/jobs" }, { label: "Locations", href: "/locations" }, { label: area.name }]}
      eyebrow={areaState ? `${areaState.name} STATE` : undefined}
      title={area.name}
      lead={`Open roles based in ${area.name}${areaState ? `, ${areaState.name} State` : ""}.`}
    />

    <section className="page-section" id="results" ref={root}>
      <div className="dc-chip-filters">
        <div className="dc-chip-group">
          <p className="t-label">Job type</p>
          <div className="filter-chips" role="group" aria-label="Filter by job type">
            {jobTypes.map(type => <button key={type} type="button" className={cn("chip", filters.types.includes(type) && "is-active")} aria-pressed={filters.types.includes(type)} onClick={() => toggleType(type)}>{type}</button>)}
          </div>
        </div>
      </div>

      <FilterBar
        count={<><strong className="tabular">{visible.length}</strong> {visible.length === 1 ? "role" : "roles"}</>}
        sort={{ value: filters.sort, options: sortOptions, onChange: value => apply({ sort: value as SortId }) }}
      >
        <AppLink href={`/jobs?location=${area.slug}`} className="text-link">Search all roles in {area.name}</AppLink>
      </FilterBar>

      {visible.length > 0
        ? <div className="job-grid">{visible.map(job => <JobCard key={job.slug} job={job} />)}</div>
        : <EmptyState icon={<SearchX size={24} strokeWidth={1.8} />} title={`No open roles in ${area.name} yet`} body="Try a nearby area, or search all roles on ADDOZ." action={<ActionButton href="/jobs" variant="dark">Browse all jobs</ActionButton>} />}
    </section>

    {categoriesHere.length > 0 && <section className="page-section tone-cream-dark">
      <SectionHeading title="Categories hiring here" />
      <div className="category-chip-grid">{categoriesHere.map(category => <CategoryCard key={category.slug} category={category} variant="compact" />)}</div>
    </section>}

    {nearby.length > 0 && <section className="page-section">
      <SectionHeading eyebrow="NEARBY" title="Nearby areas" />
      <Reveal mode="scroll" className="location-grid">{nearby.map((item, index) => <LocationCard key={item.slug} area={item} size="regular" index={index} />)}</Reveal>
    </section>}
  </article>
}
