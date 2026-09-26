import type { Metadata } from "next"
import { AuthShell } from "@/components/layout/auth-shell"
import { parseAuthRole } from "@/components/layout/auth-role"
import { ResetPasswordForm } from "@/features/auth/reset-password-form"

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Choose a new password for your ADDOZ account.",
}

type SearchParams = Promise<{ role?: string }>

export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const role = parseAuthRole((await searchParams).role)
  return <AuthShell key={role} role={role}><ResetPasswordForm /></AuthShell>
}
