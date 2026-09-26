import type { Metadata } from "next"
import { AuthShell } from "@/components/layout/auth-shell"
import { parseAuthRole } from "@/components/layout/auth-role"
import { RegisterForm } from "@/features/auth/register-form"

type SearchParams = Promise<{ role?: string }>

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { role } = await searchParams
  const employer = role === "employer"
  return {
    title: employer ? "Register as an employer" : "Create an account",
    description: employer
      ? "Create your ADDOZ employer account to start posting jobs."
      : "Create your ADDOZ account to start applying for jobs.",
  }
}

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const role = parseAuthRole((await searchParams).role)
  // The form's Candidate/Employer toggle switches the shell variant live via useAuthRole()
  return <AuthShell key={role} role={role}><RegisterForm /></AuthShell>
}
