import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AuthShell } from "@/components/layout/auth-shell"
import { auth } from "@/lib/auth"
import { LoginForm } from "@/features/auth/login-form"

type SearchParams = Promise<{ redirect?: string }>

export const metadata: Metadata = {
  title: "Admin sign in",
  description: "Sign in to the ADDOZ administrator workspace.",
}

export default async function AdminLoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })

  if (session?.user?.role === "admin") redirect("/admin")

  return <AuthShell role="admin"><LoginForm role="admin" redirect={params.redirect} /></AuthShell>
}
