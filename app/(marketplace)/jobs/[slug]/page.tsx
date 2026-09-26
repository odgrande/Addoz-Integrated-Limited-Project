import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCompany } from "@/features/companies/data"
import { getPublicJob } from "@/features/jobs/public-data"
import { JobDetail } from "@/features/jobs/components/job-detail"

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const result = await getPublicJob(slug)
  if (!result) return { title: "Role not found" }
  return {
    title: `${result.job.title} — ${result.company?.name ?? getCompany(result.job.company)?.name ?? "Sample employer"}`,
    description: result.job.summary,
    // Sample roles are illustrative, so they stay out of search results
    robots: { index: false, follow: true },
  }
}

export default async function JobPage({ params }: { params: Params }) {
  const { slug } = await params
  const result = await getPublicJob(slug)
  if (!result) notFound()
  return <JobDetail job={result.job} related={result.related} companyOverride={result.company} locationOverride={result.location} categoryOverride={result.category} />
}
