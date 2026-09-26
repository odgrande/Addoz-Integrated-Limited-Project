import type { Metadata } from "next"
import type { ReactNode } from "react"
import { headers } from "next/headers"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getCandidateOverview } from "@/features/candidates/queries"

export const metadata: Metadata = {
  title: { template: "%s · Candidate | ADDOZ", default: "Candidate workspace | ADDOZ" },
  robots: { index: false, follow: false },
}

// Candidate application — calm and empowering (Directive 007 §14)
export default async function CandidateLayout({ children }: { children: ReactNode }) {
  const data = await getCandidateOverview(await headers())
  const name = data.user.name || "Candidate"
  const initials = name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase()
  return <DashboardShell app="candidate" unread={data.notifications.filter(item => !item.read).length} user={{ name, role: "Candidate", initials }}>{children}</DashboardShell>
}
