import type { MetadataRoute } from "next"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { category, company, job, location } from "@/lib/db/schema"
import { siteUrl } from "@/lib/site-url"
import { liveJob } from "@/features/jobs/live"

// Rebuilt at most hourly so new roles are discoverable without a deploy
export const revalidate = 3600

const staticPaths = ["/", "/jobs", "/categories", "/locations", "/companies", "/for-employers", "/career-tools", "/about", "/contact", "/faq", "/blog", "/privacy", "/terms"]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const entries: MetadataRoute.Sitemap = staticPaths.map(path => ({ url: `${base}${path}`, changeFrequency: path === "/jobs" ? "hourly" : "weekly" }))
  try {
    const [jobs, categories, locations, companies] = await Promise.all([
      db.select({ slug: job.slug, updatedAt: job.updatedAt, companyName: company.name }).from(job)
        .innerJoin(company, and(eq(job.companyId, company.id), eq(company.active, true)))
        .where(liveJob()),
      db.select({ slug: category.slug }).from(category).where(eq(category.active, true)),
      db.select({ slug: location.slug }).from(location).where(eq(location.active, true)),
      db.selectDistinct({ slug: company.slug, name: company.name }).from(company)
        .innerJoin(job, and(eq(job.companyId, company.id), liveJob()))
        .where(eq(company.active, true)),
    ])
    // Illustrative sample listings are noindex, so they stay out of the sitemap
    const live = (name: string) => !name.toLowerCase().startsWith("sample")
    entries.push(
      ...jobs.filter(item => live(item.companyName)).map(item => ({ url: `${base}/jobs/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "daily" as const })),
      ...categories.map(item => ({ url: `${base}/categories/${item.slug}` })),
      ...locations.map(item => ({ url: `${base}/locations/${item.slug}` })),
      ...companies.filter(item => live(item.name)).map(item => ({ url: `${base}/companies/${item.slug}` })),
    )
  } catch (error) {
    console.error("[sitemap] dynamic entries unavailable", error)
  }
  return entries
}
