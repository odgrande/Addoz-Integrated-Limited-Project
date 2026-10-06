import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getJobPreview, getPublicJob, getPublicJobMeta } from "@/features/jobs/public-data"
import { JobDetail } from "@/features/jobs/components/job-detail"

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const result = await getPublicJobMeta(slug)
  if (!result) return { title: "Role not found" }
  return {
    title: `${result.title} — ${result.companyName}`,
    description: result.summary ?? undefined,
    // Illustrative sample roles stay out of search results; live roles are indexable
    ...(result.companyName.toLowerCase().startsWith("sample") ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function JobPage({ params }: { params: Params }) {
  const { slug } = await params
  const result = await getPublicJob(slug)
  if (result) return <JobDetail job={result.job} viewer={result.viewer} related={result.related} companyOverride={result.company} locationOverride={result.location} categoryOverride={result.category} />
  // Not public: admins and the owning employer still see a preview
  const preview = await getJobPreview(slug)
  if (!preview) notFound()
  return <JobDetail job={preview.job} viewer={preview.viewer} related={preview.related} companyOverride={preview.company} locationOverride={preview.location} categoryOverride={preview.category} previewStatus={preview.status} />
}
