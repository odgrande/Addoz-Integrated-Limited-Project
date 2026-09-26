import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = { robots: { index: false, follow: false } }

// Authentication (UI only — accounts arrive with the backend, Directive 007 §24).
// Each page renders <AuthShell role={…}> itself so the brand panel can follow `?role=`.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return children
}
