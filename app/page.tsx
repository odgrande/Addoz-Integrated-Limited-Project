import { Homepage } from "@/components/addoz/homepage"
import { unstable_rethrow } from "next/navigation"
import { searchMarketplace } from "@/features/jobs/public-data"

export default async function Page() {
  // The homepage must never fail because the jobs query did
  const jobs = await searchMarketplace({ sort: "newest" }).then(result => result.jobs).catch(error => {
    unstable_rethrow(error)
    console.error("[home] latest jobs unavailable", error)
    return []
  })
  return <Homepage jobs={jobs} />
}
