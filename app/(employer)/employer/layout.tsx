import type { Metadata } from "next"
import type { ReactNode } from "react"
import { headers } from "next/headers"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getEmployerNotifications, getEmployerContext } from "@/features/employers/queries"

export const metadata: Metadata = {
  title: { template: "%s · Employer | ADDOZ", default: "Employer workspace" },
  robots: { index: false, follow: false },
}

// Employer application — professional and powerful (Directive 007 §15)
export default async function EmployerLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers()
  const [context, notifications] = await Promise.all([getEmployerContext(requestHeaders), getEmployerNotifications(requestHeaders)])
  const name = context.user.name || "Employer"
  const initials = name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase()
  return <DashboardShell app="employer" unread={notifications.filter(item => !item.read).length} user={{ name, role: context.company?.name ?? "Employer", initials }}>{children}</DashboardShell>
}
