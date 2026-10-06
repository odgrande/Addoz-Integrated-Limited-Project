import type { ReactNode } from "react"
import { unstable_rethrow } from "next/navigation"
import { PublicShell } from "@/components/layout/public-shell"
import { getLiveJobCounts } from "@/features/jobs/public-data"
import { JobCountsProvider } from "@/features/jobs/job-counts"

// Marketplace pages: jobs, companies, categories, locations
export default async function MarketplaceLayout({ children }: { children: ReactNode }) {
  const counts = await getLiveJobCounts().catch(error => {
    unstable_rethrow(error)
    console.error("[marketplace] job counts unavailable", error)
    return { categories: {}, locations: {} }
  })
  return <PublicShell variant="marketplace"><JobCountsProvider counts={counts}>{children}</JobCountsProvider></PublicShell>
}
