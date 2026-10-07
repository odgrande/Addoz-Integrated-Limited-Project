import "server-only"

import { cache } from "react"
import { and, asc, count, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { category, company, job, location } from "@/lib/db/schema"
import { searchMarketplace } from "@/features/jobs/public-data"
import type { Company } from "./data"
import { liveJob } from "@/features/jobs/live"
import { markFor, safeLogo, toneFor } from "./brand"


type CompanyRow = { slug: string; name: string; logo: string | null; industry: string | null; description: string | null; companySize: string | null; website: string | null; locationSlug: string | null; locationName: string | null; openRoles: number; topCategory: string | null }

function toCompany(row: CompanyRow): Company {
  const sample = row.name.toLowerCase().startsWith("sample")
  return {
    slug: row.slug,
    name: row.name,
    industry: row.industry || row.topCategory || "Employer",
    location: row.locationSlug ?? "",
    locationName: row.locationName ?? undefined,
    mark: markFor(row.name),
    tone: toneFor(row.slug),
    logo: safeLogo(row.logo),
    size: row.companySize || "Size not shared",
    overview: row.description || `${row.name} is hiring on ADDOZ.`,
    website: row.website ?? undefined,
    openRoles: row.openRoles,
    sample,
  }
}

/** Active companies with at least one live role — the public directory. */
export const listPublicCompanies = cache(async (): Promise<Company[]> => {
  const activeJobs = and(eq(job.companyId, company.id), liveJob())
  const rows = await db.select({
    slug: company.slug,
    name: company.name,
    logo: company.logo,
    industry: company.industry,
    description: company.description,
    companySize: company.companySize,
    website: company.website,
    locationSlug: location.slug,
    locationName: location.name,
    openRoles: count(job.id),
    // Most common category of the company's live roles, used when no industry is set
    topCategory: sql<string | null>`(select ${category.name} from ${job} j2 join ${category} on ${category.id} = j2.category_id where j2.company_id = ${company.id} and j2.status = 'Active' and (j2.deadline is null or j2.deadline > now()) group by ${category.name} order by count(*) desc limit 1)`,
  }).from(company)
    .innerJoin(job, activeJobs)
    .leftJoin(location, eq(company.locationId, location.id))
    .where(eq(company.active, true))
    .groupBy(company.id, location.slug, location.name)
    .orderBy(asc(company.name))
  return rows.map(row => toCompany({ ...row, openRoles: Number(row.openRoles) }))
})

/** One company profile with its live roles and related companies. */
export const getPublicCompany = cache(async (slug: string) => {
  const companies = await listPublicCompanies()
  const current = companies.find(item => item.slug === slug)
  if (!current) return null
  const { jobs } = await searchMarketplace({ company: slug, sort: "newest" })
  const related = companies.filter(other => other.slug !== slug && (other.industry === current.industry || (current.location && other.location === current.location))).slice(0, 3)
  return { company: current, roles: jobs, related }
})
