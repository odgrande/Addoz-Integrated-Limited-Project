import type { Metadata } from "next"
import { JobsBrowser } from "@/features/jobs/components/jobs-browser"
import { getMarketplaceTaxonomy, searchMarketplace } from "@/features/jobs/public-data"

export const metadata: Metadata = {
  title: "Browse jobs",
  description: "Search and filter roles across Lagos and Ogun State by category, job type, career level, experience and salary.",
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

// Rendered per request (it reads searchParams), so the first paint already shows the
// searched-for roles and useSearchParams needs no Suspense boundary. A boundary here
// would also let the public motion layer split the headline before it hydrates.
export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams
  const query = new URLSearchParams(Object.entries(raw).flatMap(([key, value]) => (typeof value === "string" ? [[key, value]] : Array.isArray(value) && value[0] ? [[key, value[0]]] : []))).toString()
  const result = await searchMarketplace({
    q: typeof raw.q === "string" ? raw.q : undefined,
    category: typeof raw.category === "string" ? raw.category : undefined,
    location: typeof raw.location === "string" ? raw.location : undefined,
    type: typeof raw.type === "string" ? raw.type : undefined,
    workplace: raw.remote === "1" ? "remote" : typeof raw.workplace === "string" ? raw.workplace : undefined,
    experience: typeof raw.experience === "string" ? raw.experience : undefined,
    salary: typeof raw.salary === "string" ? raw.salary : undefined,
    sort: typeof raw.sort === "string" ? raw.sort : undefined,
    page: typeof raw.page === "string" ? Number(raw.page) : 1,
  })
  const taxonomy = await getMarketplaceTaxonomy()
  return <JobsBrowser initialQuery={query} publishedJobs={result.jobs} totalCount={result.totalCount} pageCount={result.pageCount} categoryOptions={taxonomy.categories} locationOptions={taxonomy.locations} />
}
