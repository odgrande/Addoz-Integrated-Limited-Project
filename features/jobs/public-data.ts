import "server-only"

import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { candidateProfile, category, company, job, jobApplication, location } from "@/lib/db/schema"
import type { Job } from "@/features/jobs/data"

export const MARKETPLACE_PAGE_SIZE = 9

export type MarketplaceFilters = {
  q?: string
  category?: string
  location?: string
  type?: string
  workplace?: string
  experience?: string
  salary?: string
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

async function getAppliedJobIds() {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session?.user || session.user.role !== "candidate") return new Set<string>()

  const [profile] = await db.select({ id: candidateProfile.id }).from(candidateProfile).where(eq(candidateProfile.userId, session.user.id)).limit(1)
  if (!profile) return new Set<string>()

  const applications = await db.select({ jobId: jobApplication.jobId }).from(jobApplication).where(eq(jobApplication.candidateId, profile.id))
  return new Set(applications.map(application => String(application.jobId)))
}

function withAppliedState<T extends Job>(jobs: T[], appliedIds: Set<string>) {
  return jobs.map(job => ({ ...job, applied: Boolean(job.id && appliedIds.has(String(job.id))) })) as T[]
}

function baseQuery() {
  return db.select({ job, companyName: company.name, companySlug: company.slug, companyIndustry: company.industry, companyDescription: company.description, locationName: location.name, locationSlug: location.slug, categoryName: category.name, categorySlug: category.slug }).from(job)
    .innerJoin(company, and(eq(job.companyId, company.id), eq(company.active, true)))
    .innerJoin(location, and(eq(job.locationId, location.id), eq(location.active, true)))
    .innerJoin(category, and(eq(job.categoryId, category.id), eq(category.active, true)))
}

function conditions(filters: MarketplaceFilters) {
  const where = [eq(job.status, "Active")]
  const query = filters.q?.trim()
  if (query) where.push(or(ilike(job.title, `%${query}%`), ilike(job.summary, `%${query}%`), ilike(company.name, `%${query}%`))!)
  if (filters.category) where.push(eq(category.slug, filters.category))
  if (filters.location) where.push(eq(location.slug, filters.location))
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
  const [records, [total], appliedIds] = await Promise.all([
    baseQuery().where(and(...where)).orderBy(order, desc(job.postedAt)).limit(MARKETPLACE_PAGE_SIZE).offset(offset),
    db.select({ value: count(job.id) }).from(job).innerJoin(company, and(eq(job.companyId, company.id), eq(company.active, true))).innerJoin(location, and(eq(job.locationId, location.id), eq(location.active, true))).innerJoin(category, and(eq(job.categoryId, category.id), eq(category.active, true))).where(and(...where)),
    getAppliedJobIds(),
  ])
  const totalCount = Number(total?.value ?? 0)
  return { jobs: withAppliedState(records.map(mapRecord), appliedIds), totalCount, page, pageCount: Math.max(1, Math.ceil(totalCount / MARKETPLACE_PAGE_SIZE)) }
}

export async function getPublicJob(slug: string) {
  const [record] = await baseQuery().where(and(eq(job.slug, slug), eq(job.status, "Active"))).limit(1)
  if (!record) return null
  const appliedIds = await getAppliedJobIds()
  const current = { ...mapRecord(record), applied: Boolean(record.job.id && appliedIds.has(String(record.job.id))) }
  const relatedRecords = await baseQuery().where(and(eq(job.status, "Active"), or(eq(job.categoryId, record.job.categoryId), eq(job.locationId, record.job.locationId)), sql`${job.id} <> ${record.job.id}`)).orderBy(desc(job.postedAt)).limit(3)
  return { job: current, related: withAppliedState(relatedRecords.map(mapRecord), appliedIds), company: { name: record.companyName, industry: record.companyIndustry, overview: record.companyDescription, mark: record.companyName.slice(0, 1), tone: "purple" }, location: { name: record.locationName, stateName: null }, category: { name: record.categoryName, slug: record.categorySlug } }
}

export async function getMarketplaceTaxonomy() {
  const [categories, locations] = await Promise.all([db.select({ slug: category.slug, name: category.name }).from(category).where(eq(category.active, true)).orderBy(asc(category.name)), db.select({ slug: location.slug, name: location.name }).from(location).where(eq(location.active, true)).orderBy(asc(location.name))])
  return { categories, locations }
}
