import { ArrowUpRight, MapPin } from "lucide-react"
import { AppLink } from "@/components/patterns/app-link"
import { SampleTag } from "@/components/patterns/status-badge"
import { plural } from "@/lib/format"
import { getArea } from "@/features/locations/data"
import type { Company } from "../data"

/** Company card. Sample profiles always carry the SAMPLE tag. */
export function CompanyCard({ company }: { company: Company }) {
  const openRoles = company.openRoles ?? 0
  const locationName = company.locationName ?? getArea(company.location)?.name
  return <article className="company-card">
    <div className="company-card-top">
      <span className={`company-mark tone-${company.tone}`} aria-hidden="true">{company.mark}</span>
      {company.sample && <SampleTag />}
    </div>
    <h3><AppLink href={`/companies/${company.slug}`} className="company-card-link">{company.name}</AppLink></h3>
    <p className="company-card-industry">{company.industry}</p>
    <div className="company-card-foot">
      {locationName && <span><MapPin size={14} aria-hidden="true" />{locationName}</span>}
      <span className="company-roles">{openRoles ? plural(openRoles, "open role") : "No open roles"}</span>
      <ArrowUpRight size={20} aria-hidden="true" />
    </div>
  </article>
}
