import "server-only"

import { cache } from "react"
import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { unstable_rethrow } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { candidateProfile, category, company, employerProfile, job, jobApplication, location, resume, savedJob } from "@/lib/db/schema"
import type { Job } from "@/features/jobs/data"
import { liveJob } from "@/features/jobs/live"

export const MARKETPLACE_PAGE_SIZE = 9

export type MarketplaceFilters = {
  q?: string
  category?: string
  location?: string
  type?: string
  workplace?: string
  experience?: string
  salary?: string
  company?: string
  sort?: string
  page?: number
}

const salaryBands: Record<string, { min: number; max: number }> = {
  "under-150": { min: 0, max: 149_999 },
  "150-300": { min: 150_000, max: 300_000 },
  "300-500": { min: 300_001, max: 500_000 },
  "500-plus": { min: 500_001, max: Number.MAX_SAFE_INTEGER },
}

function mapRecord(record: { job: typeof job.$inferSelect; companyName: string; companySlug: string; companyIndustry: string | null; companyDescription: string | null; locationName: string; locationSlug: string; categoryName: string; categorySlug: string }): Job {
  return {
    id: record.job.id,
    slug: record.job.slug,
    title: record.job.title,
    category: record.categoryName,
    location: record.locationSlug,
    company: record.companySlug,
    companyName: record.companyName,
    locationName: record.locationName,
    type: record.job.type as Job["type"],
    workplace: record.job.workplace as Job["workplace"],
    level: record.job.level as Job["level"],
    experience: record.job.experience as Job["experience"],
    salary: { min: record.job.salaryMin ?? undefined, max: record.job.salaryMax ?? undefined, period: record.job.salaryPeriod === "year" ? "year" : "month" },
    postedAt: record.job.postedAt.toISOString().slice(0, 10),
    deadline: (record.job.deadline ?? new Date(record.job.postedAt.getTime() + 30 * 86_400_000)).toISOString().slice(0, 10),
    featured: Boolean(record.job.featured),
    apply: record.job.apply === "email" ? "email" : "addoz",
    mark: record.job.mark ?? "•",
    color: record.job.color === "yellow" || record.job.color === "orange" ? record.job.color : "blue",
    summary: record.job.summary ?? "",
    responsibilities: record.job.responsibilities ?? [],
    requirements: record.job.requirements ?? [],
    skills: record.job.skills ?? [],
    sample: record.companyName.toLowerCase().startsWith("sample"),
    applied: false,
  }
}

/**
 * Who is looking at a public page, resolved on the server from the Better Auth
 * session. This — not the browser's session hook — decides which apply flow a
 * visitor gets. "unknown" means the session lookup itself failed; the page still
 * renders and the client falls back to its own session check.
 */
export type Viewer =
  | { role: "guest" }
  | { role: "unknown" }
  | { role: "employer" | "admin"; name: string }
  | { role: "candidate"; candidateId: string | null; name: string; email: string; resume: { fileName: string } | null }

export const getViewer = cache(async (): Promise<Viewer> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return { role: "guest" }
    const role = session.user.role
    if (role === "employer" || role === "admin") return { role, name: session.user.name }
    if (role !== "candidate") return { role: "guest" }

    const [profile] = await db.select({ id: candidateProfile.id }).from(candidateProfile).where(eq(candidateProfile.userId, session.user.id)).limit(1)
    // The profile CV (if any) can be reused when applying; it is copied into each application
    const [current] = profile
      ? await db.select({ fileName: resume.fileName, storageKey: resume.storageKey }).from(resume).where(eq(resume.candidateId, profile.id)).orderBy(desc(resume.uploadedAt)).limit(1)
      : []
    return { role: "candidate", candidateId: profile?.id ?? null, name: session.user.name, email: session.user.email, resume: current?.storageKey ? { fileName: current.fileName } : null }
  } catch (error) {
    unstable_rethrow(error) // let Next.js see dynamic-rendering signals
    console.error("[marketplace] session lookup failed", error)
    return { role: "unknown" }
  }
})

type ViewerJobState = { applied: Set<string>; saved: Set<string> } | null

/** The signed-in candidate's applied and saved job ids; null for everyone else. */
const getViewerJobState = cache(async (): Promise<ViewerJobState> => {
  const viewer = await getViewer()
  if (viewer.role !== "candidate" || !viewer.candidateId) return null
  try {
    const [applications, saved] = await Promise.all([
      db.select({ jobId: jobApplication.jobId }).from(jobApplication).where(eq(jobApplication.candidateId, viewer.candidateId)),
      db.select({ jobId: savedJob.jobId }).from(savedJob).where(eq(savedJob.candidateId, viewer.candidateId)),
    ])
    return { applied: new Set(applications.map(row => String(row.jobId))), saved: new Set(saved.map(row => String(row.jobId))) }
  } catch (error) {
    unstable_rethrow(error)
    console.error("[marketplace] candidate job state lookup failed", error)
    return null
  }
})

function withViewerState<T extends Job>(jobs: T[], state: ViewerJobState) {
  return jobs.map(item => ({
    ...item,
    applied: Boolean(state && item.id && state.applied.has(String(item.id))),
    // Signed-out visitors, employers and admins have nothing saved
    saved: Boolean(state && item.id && state.saved.has(String(item.id))),
  })) as T[]
}

function baseQuery() {
  return db.select({ job, companyName: company.name, companySlug: company.slug, companyIndustry: company.industry, companyDescription: company.description, locationName: location.name, locationSlug: location.slug, categoryName: category.name, categorySlug: category.slug }).from(job)
    .innerJoin(company, and(eq(job.companyId, company.id), eq(company.active, true)))
    .innerJoin(location, and(eq(job.locationId, location.id), eq(location.active, true)))
    .innerJoin(category, and(eq(job.categoryId, category.id), eq(category.active, true)))
}

function conditions(filters: MarketplaceFilters) {
  const where = [liveJob()]
  const query = filters.q?.trim()
  if (query) where.push(or(ilike(job.title, `%${query}%`), ilike(job.summary, `%${query}%`), ilike(company.name, `%${query}%`))!)
  if (filters.category) where.push(eq(category.slug, filters.category))
  if (filters.location) where.push(eq(location.slug, filters.location))
  if (filters.company) where.push(eq(company.slug, filters.company))
  if (filters.type) where.push(inArray(job.type, filters.type.split(",")))
  if (filters.workplace) where.push(eq(job.workplace, filters.workplace === "onsite" ? "On-site" : filters.workplace === "remote" ? "Remote" : "Hybrid"))
  if (filters.experience) where.push(inArray(job.experience, filters.experience.split(",")))
  const salary = filters.salary ? salaryBands[filters.salary] : undefined
  if (salary) where.push(and(sql`coalesce(${job.salaryMax}, ${job.salaryMin}, 0) >= ${salary.min}`, sql`coalesce(${job.salaryMin}, ${job.salaryMax}, 0) <= ${salary.max}`)!)
  return where
}

export async function searchMarketplace(filters: MarketplaceFilters = {}) {
  const where = conditions(filters)
  const page = Math.max(1, filters.page ?? 1)
  const offset = (page - 1) * MARKETPLACE_PAGE_SIZE
  const order = filters.sort === "newest" || filters.sort === "relevance" || filters.q ? desc(job.postedAt) : desc(job.featured)
  const [records, [total], jobState] = await Promise.all([
    baseQuery().where(and(...where)).orderBy(order, desc(job.postedAt)).limit(MARKETPLACE_PAGE_SIZE).offset(offset),
    db.select({ value: count(job.id) }).from(job).innerJoin(company, and(eq(job.companyId, company.id), eq(company.active, true))).innerJoin(location, and(eq(job.locationId, location.id), eq(location.active, true))).innerJoin(category, and(eq(job.categoryId, category.id), eq(category.active, true))).where(and(...where)),
    getViewerJobState(),
  ])
  const totalCount = Number(total?.value ?? 0)
  return { jobs: withViewerState(records.map(mapRecord), jobState), totalCount, page, pageCount: Math.max(1, Math.ceil(totalCount / MARKETPLACE_PAGE_SIZE)) }
}

/** Job record only — shared by generateMetadata and the page within one request. */
const getPublicJobRecord = cache(async (slug: string) => {
  const [record] = await baseQuery().where(and(eq(job.slug, slug), liveJob())).limit(1)
  return record ?? null
})

export async function getPublicJobMeta(slug: string) {
  const record = await getPublicJobRecord(slug)
  return record ? { title: record.job.title, summary: record.job.summary, companyName: record.companyName } : null
}

export const getPublicJob = cache(async (slug: string) => {
  const record = await getPublicJobRecord(slug)
  if (!record) return null
  const [jobState, relatedRecords, viewer] = await Promise.all([
    getViewerJobState(),
    baseQuery().where(and(liveJob(), or(eq(job.categoryId, record.job.categoryId), eq(job.locationId, record.job.locationId)), sql`${job.id} <> ${record.job.id}`)).orderBy(desc(job.postedAt)).limit(3)
      .catch(error => { unstable_rethrow(error); console.error("[marketplace] related jobs lookup failed", error); return [] }),
    getViewer(),
  ])
  const current = withViewerState([mapRecord(record)], jobState)[0]!
  return { job: current, viewer, related: withViewerState(relatedRecords.map(mapRecord), jobState), company: { name: record.companyName, industry: record.companyIndustry, overview: record.companyDescription, mark: record.companyName.slice(0, 1), tone: "purple" }, location: { name: record.locationName, stateName: null }, category: { name: record.categoryName, slug: record.categorySlug } }
})

export async function getMarketplaceTaxonomy() {
  const [categories, locations] = await Promise.all([db.select({ slug: category.slug, name: category.name }).from(category).where(eq(category.active, true)).orderBy(asc(category.name)), db.select({ slug: location.slug, name: location.name }).from(location).where(eq(location.active, true)).orderBy(asc(location.name))])
  return { categories, locations }
}

/** Open roles per category and per location (live, active taxonomy only). */
export const getLiveJobCounts = cache(async () => {
  const live = and(liveJob(), eq(company.active, true))
  const [byCategory, byLocation] = await Promise.all([
    db.select({ slug: category.slug, value: count(job.id) }).from(job).innerJoin(company, eq(job.companyId, company.id)).innerJoin(category, eq(job.categoryId, category.id)).where(live).groupBy(category.slug),
    db.select({ slug: location.slug, value: count(job.id) }).from(job).innerJoin(company, eq(job.companyId, company.id)).innerJoin(location, eq(job.locationId, location.id)).where(live).groupBy(location.slug),
  ])
  return {
    categories: Object.fromEntries(byCategory.map(row => [row.slug, Number(row.value)])),
    locations: Object.fromEntries(byLocation.map(row => [row.slug, Number(row.value)])),
  }
})

/**
 * "Ghost mode": admins — and the employer who owns the job — can open a job
 * page whatever its status (pending review, draft, paused, declined…). Nobody
 * else can; the public only ever sees Active jobs.
 */
export async function getJobPreview(slug: string) {
  const viewer = await getViewer()
  if (viewer.role !== "admin" && viewer.role !== "employer") return null
  const [record] = await db.select({ job, companyName: company.name, companySlug: company.slug, companyIndustry: company.industry, companyDescription: company.description, locationName: location.name, locationSlug: location.slug, categoryName: category.name, categorySlug: category.slug }).from(job)
    .innerJoin(company, eq(job.companyId, company.id))
    .innerJoin(location, eq(job.locationId, location.id))
    .innerJoin(category, eq(job.categoryId, category.id))
    .where(eq(job.slug, slug)).limit(1)
  if (!record) return null
  if (viewer.role === "employer") {
    const session = await auth.api.getSession({ headers: await headers() })
    const [owner] = session ? await db.select({ companyId: employerProfile.companyId }).from(employerProfile).where(eq(employerProfile.userId, session.user.id)).limit(1) : []
    if (!owner || owner.companyId !== record.job.companyId) return null
  }
  return { job: { ...mapRecord(record), applied: false }, viewer, related: [] as Job[], status: record.job.status ?? "Draft", company: { name: record.companyName, industry: record.companyIndustry, overview: record.companyDescription, mark: record.companyName.slice(0, 1), tone: "purple" }, location: { name: record.locationName, stateName: null }, category: { name: record.categoryName, slug: record.categorySlug } }
}
