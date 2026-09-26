import type { ReactNode } from "react"
import { PublicShell } from "@/components/layout/public-shell"

// Marketplace pages: jobs, companies, categories, locations
export default function MarketplaceLayout({ children }: { children: ReactNode }) {
  return <PublicShell variant="marketplace">{children}</PublicShell>
}
