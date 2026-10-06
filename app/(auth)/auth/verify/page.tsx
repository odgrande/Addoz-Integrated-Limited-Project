import type { Metadata } from "next"
import { AuthShell } from "@/components/layout/auth-shell"
import { parseAuthRole } from "@/components/layout/auth-role"
import { VerifyForm } from "@/features/auth/verify-form"

type SearchParams = Promise<{ email?: string; role?: string; redirect?: string }>

export const metadata: Metadata = {
  title: "Verify your email",
  description: "Enter the 6-digit code to verify your ADDOZ account.",
  robots: { index: false },
}

export default async function VerifyPage({ searchParams }: { searchParams: SearchParams }) {
  const { email, role: roleParam, redirect } = await searchParams
  const role = parseAuthRole(roleParam)
  return <AuthShell key={role} role={role}><VerifyForm email={email} redirect={redirect} /></AuthShell>
}
