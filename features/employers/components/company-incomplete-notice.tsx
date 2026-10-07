import Link from "next/link"
import { Building2 } from "lucide-react"
import { listMissing } from "@/features/companies/completeness"

/** Shown to employers whose company profile isn't complete yet: jobs can't be published until it is. */
export function CompanyIncompleteNotice({ missing }: { missing: string[] }) {
  if (!missing.length) return null
  return <div className="company-incomplete" role="status">
    <Building2 size={20} aria-hidden="true" />
    <p><strong>Complete your company profile to publish jobs.</strong> Candidates need to know who&apos;s hiring — add {listMissing(missing)}. You can still save drafts meanwhile.</p>
    <Link className="action-button action-primary action-sm" href="/employer/company">Complete profile</Link>
  </div>
}
