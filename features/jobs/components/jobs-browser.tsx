"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SearchX } from "lucide-react"
import { Flip, gsap, reducedMotion, useGSAP } from "@/lib/motion"
import { plural } from "@/lib/format"
import { ActionButton, ActiveFilters, Checkbox, EmptyState, FilterBar, FilterGroup, Modal, Pagination, SearchBar } from "@/components/patterns"
import { categories, categoryGroups, getCategory, getCategoryByName } from "@/features/categories/data"
import { getArea } from "@/features/locations/data"
import { careerLevels, countActiveFilters, emptyFilters, experienceLevels, filterJobs, jobs, jobTypes, salaryBands, sortOptions, type CareerLevel, type Experience, type Job, type JobFilters, type JobType, type SortId } from "../data"
import { JobCard } from "./job-card"

const PAGE_SIZE = 9
const list = (value: string | null) => (value ? value.split(",").filter(Boolean) : [])

/** URL ⇄ filters. Category travels as its slug; everything else as its label. */
type TaxonomyOption = { slug: string; name: string }

function fromParams(params: URLSearchParams, categoryOptions: TaxonomyOption[], locationOptions: TaxonomyOption[]): { filters: JobFilters; page: number } {
  const category = categoryOptions.find(item => item.slug === params.get("category"))
  const sort = sortOptions.some(option => option.id === params.get("sort")) ? (params.get("sort") as SortId) : "featured"
  return {
    filters: {
      q: params.get("q") ?? "",
      location: locationOptions.some(item => item.slug === params.get("location")) ? params.get("location")! : "",
      category: category?.name ?? "",
      types: list(params.get("type")).filter((item): item is JobType => (jobTypes as readonly string[]).includes(item)),
      levels: list(params.get("level")).filter((item): item is CareerLevel => (careerLevels as readonly string[]).includes(item)),
      experience: list(params.get("experience")).filter((item): item is Experience => (experienceLevels as readonly string[]).includes(item)),
      salary: salaryBands.some(band => band.id === params.get("salary")) ? params.get("salary")! : "",
      remote: params.get("remote") === "1",
      sort,
    },
    page: Math.max(1, Number(params.get("page")) || 1),
  }
}

function toQuery(filters: JobFilters, page: number, categoryOptions: TaxonomyOption[]) {
  const params = new URLSearchParams()
  if (filters.q.trim()) params.set("q", filters.q.trim())
  if (filters.location) params.set("location", filters.location)
  if (filters.category) params.set("category", categoryOptions.find(item => item.name === filters.category)?.slug ?? "")
  if (filters.types.length) params.set("type", filters.types.join(","))
  if (filters.levels.length) params.set("level", filters.levels.join(","))
  if (filters.experience.length) params.set("experience", filters.experience.join(","))
  if (filters.salary) params.set("salary", filters.salary)
  if (filters.remote) params.set("remote", "1")
  if (filters.sort !== "featured") params.set("sort", filters.sort)
  if (page > 1) params.set("page", String(page))
  return params.toString()
}

/**
 * The jobs browser (Directive 008: functional + editorial). Search and filters live
 * in the URL; results reflow with Flip; filters sit in a sticky sidebar on desktop
 * and in a sheet on phones and tablets.
 */
export function JobsBrowser({ initialQuery = "", publishedJobs = [], totalCount = 0, pageCount = 1, categoryOptions = [], locationOptions = [] }: { initialQuery?: string; publishedJobs?: Job[]; totalCount?: number; pageCount?: number; categoryOptions?: TaxonomyOption[]; locationOptions?: TaxonomyOption[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [initial] = useState(() => fromParams(new URLSearchParams(initialQuery), categoryOptions, locationOptions))
  const [filters, setFilters] = useState<JobFilters>(initial.filters)
  const [page, setPage] = useState(initial.page)
  const [draft, setDraft] = useState(initial.filters.q)
  const [sheet, setSheet] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const lastQuery = useRef(toQuery(initial.filters, initial.page, categoryOptions))

  // Links into /jobs while already here (nav, footer, back/forward) re-seed the state
  useEffect(() => {
    const query = params.toString()
    if (query === lastQuery.current) return
    const next = fromParams(new URLSearchParams(query), categoryOptions, locationOptions)
    lastQuery.current = toQuery(next.filters, next.page, categoryOptions)
    setFilters(next.filters)
    setPage(next.page)
    setDraft(next.filters.q)
  }, [params])

  const allJobs = useMemo(() => publishedJobs, [publishedJobs])
  const results = allJobs
  const current = Math.min(page, pageCount)
  const visible = results
  const active = countActiveFilters(filters)

  const { contextSafe } = useGSAP(() => {}, { scope: root })

  /** Every change: capture the grid, commit, write the URL, then let Flip reflow it. */
  const apply = useCallback((next: JobFilters, nextPage = 1, scroll = false) => {
    const grid = root.current?.querySelector(".jobs-grid")
    const state = grid && !reducedMotion() ? Flip.getState(grid.querySelectorAll(".job-card")) : null
    flushSync(() => { setFilters(next); setPage(nextPage) })
    const query = toQuery(next, nextPage, categoryOptions)
    lastQuery.current = query
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    if (scroll) root.current?.querySelector("#results")?.scrollIntoView({ behavior: reducedMotion() ? "instant" : "smooth", block: "start" })
    if (!state) return
    contextSafe(() => {
      Flip.from(state, {
        targets: root.current!.querySelectorAll(".jobs-grid .job-card"),
        duration: 0.5, ease: "power3.inOut", absoluteOnLeave: true, prune: true,
        onEnter: cards => gsap.fromTo(cards, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, delay: 0.1, stagger: 0.03, clearProps: "opacity,transform" }),
        onLeave: cards => gsap.to(cards, { opacity: 0, duration: 0.2 }),
      })
    })()
  }, [contextSafe, pathname, router])

  const update = (patch: Partial<JobFilters>) => apply({ ...filters, ...patch })
  const clear = () => { setDraft(""); apply({ ...emptyFilters, sort: filters.sort }) }

  // Facet counts: how many roles each option would show with everything else held
  const facet = <K extends "types" | "levels" | "experience">(_key: K, _values: readonly JobFilters[K][number][]) => ({} as Record<JobFilters[K][number], number>)

  const chips = [
    ...(filters.q ? [{ key: "q", label: `“${filters.q}”`, onRemove: () => { setDraft(""); update({ q: "" }) } }] : []),
    ...(filters.location ? [{ key: "location", label: getArea(filters.location)?.name ?? filters.location, onRemove: () => update({ location: "" }) }] : []),
    ...(filters.category ? [{ key: "category", label: filters.category, onRemove: () => update({ category: "" }) }] : []),
    ...filters.types.map(type => ({ key: `type-${type}`, label: type, onRemove: () => update({ types: filters.types.filter(item => item !== type) }) })),
    ...filters.levels.map(level => ({ key: `level-${level}`, label: level, onRemove: () => update({ levels: filters.levels.filter(item => item !== level) }) })),
    ...filters.experience.map(item => ({ key: `exp-${item}`, label: item, onRemove: () => update({ experience: filters.experience.filter(value => value !== item) }) })),
    ...(filters.salary ? [{ key: "salary", label: salaryBands.find(band => band.id === filters.salary)?.label ?? "", onRemove: () => update({ salary: "" }) }] : []),
    ...(filters.remote ? [{ key: "remote", label: "Remote only", onRemove: () => update({ remote: false }) }] : []),
  ]

  const panel = <div className="jobs-filter-panel">
    <fieldset className="filter-group">
      <legend>Category</legend>
      <label className="sr-only" htmlFor="filter-category">Category</label>
      <div className="field-select-wrap">
        <select id="filter-category" className="field-input field-select jobs-select" value={filters.category} onChange={event => update({ category: event.target.value })}>
          <option value="">All categories</option>
          {categoryOptions.map(category => <option key={category.slug} value={category.name}>{category.name}</option>)}
        </select>
      </div>
    </fieldset>
    <fieldset className="filter-group">
      <legend>Workplace</legend>
      <Checkbox label="Remote only" checked={filters.remote} onChange={event => update({ remote: event.target.checked })} />
    </fieldset>
    <FilterGroup legend="Job type" name="type" options={jobTypes} selected={filters.types} counts={facet("types", jobTypes)} onChange={next => update({ types: next as JobType[] })} />
    <FilterGroup legend="Career level" name="level" options={careerLevels} selected={filters.levels} counts={facet("levels", careerLevels)} onChange={next => update({ levels: next as CareerLevel[] })} />
    <FilterGroup legend="Experience" name="experience" options={experienceLevels} selected={filters.experience} counts={facet("experience", experienceLevels)} onChange={next => update({ experience: next as Experience[] })} />
    <FilterGroup legend="Salary (per month)" name="salary" type="radio" options={[{ value: "", label: "Any salary" }, ...salaryBands.map(band => ({ value: band.id, label: band.label }))]} selected={filters.salary} onChange={next => update({ salary: next as string })} />
  </div>

  return <div className="jobs-browser" ref={root}>
    <header className="jobs-head">
      <p className="eyebrow"><span className="eyebrow-line" />Jobs across Nigeria</p>
      <h1 id="page-title" data-reveal>Browse jobs</h1>
      <p className="jobs-lead">Search and filter roles across Lagos and Ogun State. Save the ones worth a second look.</p>
      <SearchBar className="jobs-search" query={draft} location={filters.location} locations={locationOptions} onQueryChange={setDraft} onLocationChange={location => update({ location })} onSubmit={() => update({ q: draft })} submitLabel="Search" />
    </header>

    <div className="jobs-body" id="results">
      <aside className="jobs-sidebar" aria-label="Filters">
        <div className="jobs-sidebar-head"><h2>Filters</h2>{active > 0 && <button type="button" className="text-link" onClick={clear}>Clear all</button>}</div>
        {panel}
      </aside>

      <div className="jobs-results">
        <FilterBar
          className="jobs-toolbar"
          count={<><strong className="tabular">{totalCount}</strong> {totalCount === 1 ? "role" : "roles"}</>}
          sort={{ value: filters.sort, options: sortOptions, onChange: value => update({ sort: value as SortId }) }}
          onOpenFilters={() => setSheet(true)}
          activeCount={active}
        />
        <ActiveFilters items={chips} onClear={clear} />

        {visible.length > 0
          ? <div className="job-grid jobs-grid">{visible.map(job => <JobCard key={job.slug} job={job} />)}</div>
          : <EmptyState tone="white" icon={<SearchX size={24} strokeWidth={1.8} />} title="No roles match those filters." body="Try a different keyword, fewer filters, or another location." action={<ActionButton variant="dark" onClick={clear}>Clear filters</ActionButton>} />}

        <Pagination page={current} pageCount={pageCount} onChange={next => apply(filters, next, true)} label="Job results pages" />
        <p className="jobs-note">Showing {visible.length ? `${(current - 1) * PAGE_SIZE + 1}–${(current - 1) * PAGE_SIZE + visible.length} of ${plural(totalCount, "role")}` : "no roles"}.</p>
      </div>
    </div>

    <Modal open={sheet} onOpenChange={setSheet} variant="sheet" title="Filters" eyebrow={active ? `${active} active` : undefined}
      footer={<><ActionButton variant="ghost" onClick={clear}>Clear all</ActionButton><ActionButton variant="dark" onClick={() => setSheet(false)}>Show {plural(results.length, "role")}</ActionButton></>}>
      {panel}
    </Modal>
  </div>
}
