"use client"

import { useCallback, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { SearchX } from "lucide-react"
import { Flip, gsap, reducedMotion, useGSAP } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { ActionButton, AppLink, EmptyState, FilterBar, PageHeader, Reveal, SectionHeading } from "@/components/patterns"
import { careerLevels, emptyFilters, filterJobs, jobTypes, sortOptions, type CareerLevel, type Job, type JobType, type SortId } from "@/features/jobs/data"
import { JobCard } from "@/features/jobs/components/job-card"
import { categoryGroups, relatedCategories, type Category } from "../data"
import { CategoryCard } from "./category-card"

type Filters = { types: JobType[]; levels: CareerLevel[]; sort: SortId }

/**
 * Category detail (Directive 009): PageHeader carries the group + description,
 * lightweight job type / career level chips narrow the results, and the grid
 * reflows with Flip — same technique as the jobs browser.
 */
export function CategoryDetail({ category, jobs }: { category: Category; jobs: Job[] }) {
  const root = useRef<HTMLElement>(null)
  const [filters, setFilters] = useState<Filters>({ types: [], levels: [], sort: "featured" })
  const { contextSafe } = useGSAP(() => {}, { scope: root })
  const group = categoryGroups.find(item => item.slug === category.group)
  const base = jobs
  const related = relatedCategories(category.slug)

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
  const toggleLevel = (level: CareerLevel) => apply({ levels: filters.levels.includes(level) ? filters.levels.filter(item => item !== level) : [...filters.levels, level] })

  const visible = filterJobs(base, { ...emptyFilters, types: filters.types, levels: filters.levels, sort: filters.sort })

  return <article>
    <PageHeader
      crumbs={[{ label: "Jobs", href: "/jobs" }, { label: "Categories", href: "/categories" }, { label: category.name }]}
      eyebrow={group?.name}
      title={category.name}
      lead={<>{group?.line} {category.description}</>}
    />

    <section className="page-section" id="results" ref={root}>
      <div className="dc-chip-filters">
        <div className="dc-chip-group">
          <p className="t-label">Job type</p>
          <div className="filter-chips" role="group" aria-label="Filter by job type">
            {jobTypes.map(type => <button key={type} type="button" className={cn("chip", filters.types.includes(type) && "is-active")} aria-pressed={filters.types.includes(type)} onClick={() => toggleType(type)}>{type}</button>)}
          </div>
        </div>
        <div className="dc-chip-group">
          <p className="t-label">Career level</p>
          <div className="filter-chips" role="group" aria-label="Filter by career level">
            {careerLevels.map(level => <button key={level} type="button" className={cn("chip", filters.levels.includes(level) && "is-active")} aria-pressed={filters.levels.includes(level)} onClick={() => toggleLevel(level)}>{level}</button>)}
          </div>
        </div>
      </div>

      <FilterBar
        count={<><strong className="tabular">{visible.length}</strong> {visible.length === 1 ? "sample role" : "sample roles"}</>}
        sort={{ value: filters.sort, options: sortOptions, onChange: value => apply({ sort: value as SortId }) }}
      >
        <AppLink href={`/jobs?category=${category.slug}`} className="text-link">Open in job search</AppLink>
      </FilterBar>

      {visible.length > 0
        ? <div className="job-grid">{visible.map(job => <JobCard key={job.slug} job={job} />)}</div>
        : <EmptyState icon={<SearchX size={24} strokeWidth={1.8} />} title={`No sample roles in ${category.name} yet`} body="New sample roles are added over time. In the meantime, try these:" action={<><ActionButton href="/jobs" variant="dark">Browse all jobs</ActionButton><ActionButton href="/auth/register" variant="ghost">Set up a job alert</ActionButton></>} />}
    </section>

    {related.length > 0 && <section className="page-section tone-cream-dark">
      <SectionHeading eyebrow="RELATED" title="Related categories" />
      <Reveal mode="scroll" className="category-chip-grid">{related.map(item => <CategoryCard key={item.slug} category={item} variant="compact" />)}</Reveal>
    </section>}
  </article>
}
