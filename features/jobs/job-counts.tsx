"use client"

import { createContext, useContext, type ReactNode } from "react"

/** Live open-role counts by category and location slug, loaded once per page by the marketplace layout. */
export type JobCounts = { categories: Record<string, number>; locations: Record<string, number> }

const JobCountsContext = createContext<JobCounts>({ categories: {}, locations: {} })

export function JobCountsProvider({ counts, children }: { counts: JobCounts; children: ReactNode }) {
  return <JobCountsContext.Provider value={counts}>{children}</JobCountsContext.Provider>
}

export function useJobCount(kind: "categories" | "locations", slug: string) {
  return useContext(JobCountsContext)[kind][slug] ?? 0
}
