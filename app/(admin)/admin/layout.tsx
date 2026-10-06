import type { Metadata } from "next"
import type { ReactNode } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { auth } from "@/lib/auth"
import { AdminAuthError, requireAdmin } from "@/features/admin/queries"

export const metadata: Metadata = {
  title: { template: "%s · Admin | ADDOZ", default: "Admin" },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })

  if (!session) redirect("/auth/admin/login?redirect=/admin")

  if (session.user.role === "candidate") redirect("/candidate/dashboard")
  if (session.user.role === "employer") redirect("/employer/dashboard")
  if (session.user.role !== "admin") redirect("/")

  try {
    const adminSession = await requireAdmin(requestHeaders)
    const name = adminSession.user.name || "Admin"
    const initials = name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase()
    return <DashboardShell app="admin" user={{ name, role: "Administrator", initials }}>{children}</DashboardShell>
  } catch (error) {
    if (error instanceof AdminAuthError) redirect("/auth/admin/login?redirect=/admin")
    throw error
  }
}
