import type { Metadata } from "next"
import { AuthShell } from "@/components/layout/auth-shell"
import { parseAuthRole } from "@/components/layout/auth-role"
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Forgot your password?",
  description: "Request a link to reset the password for your ADDOZ account.",
}

type SearchParams = Promise<{ role?: string }>

export default async function ForgotPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const role = parseAuthRole((await searchParams).role)
  return <AuthShell key={role} role={role}><ForgotPasswordForm /></AuthShell>
}
