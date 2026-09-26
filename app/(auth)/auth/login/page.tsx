import type { Metadata } from "next"
import { AuthShell } from "@/components/layout/auth-shell"
import { parseAuthRole } from "@/components/layout/auth-role"
import { LoginForm } from "@/features/auth/login-form"

type SearchParams = Promise<{ role?: string; redirect?: string }>

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { role } = await searchParams
  const parsed = parseAuthRole(role)
  const admin = parsed === "admin"
  const employer = parsed === "employer"
  return {
    title: admin ? "Admin sign in" : employer ? "Employer sign in" : "Sign in",
    description: admin
      ? "Sign in to the ADDOZ administrator workspace."
      : employer
        ? "Sign in to your ADDOZ employer account to manage your job postings."
        : "Sign in to your ADDOZ account to continue your job search.",
  }
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const role = parseAuthRole(params.role)
  // key: client navigation between ?role variants remounts the shell with the new role
  return <AuthShell key={role} role={role}><LoginForm role={role} redirect={params.redirect} /></AuthShell>
}
