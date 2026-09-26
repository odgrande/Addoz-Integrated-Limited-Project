import type { ReactNode } from "react"
import { PublicShell } from "@/components/layout/public-shell"

// Marketing pages: about, contact, FAQ, legal, blog, Career Intelligence, employers
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <PublicShell variant="marketing">{children}</PublicShell>
}
