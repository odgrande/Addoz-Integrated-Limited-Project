import { ActionButton, Breadcrumbs, EmptyState, Reveal, SampleTag, SectionHeading } from "@/components/patterns"
import { plural } from "@/lib/format"
import { getArea, getState } from "@/features/locations/data"
import type { Job } from "@/features/jobs/data"
import { JobRow } from "@/features/jobs/components/job-card"
import type { Company } from "../data"
import { CompanyCard } from "./company-card"

/**
 * Company profile (Directive 009): a job-detail-style header (large mark + name),
 * overview, open roles and a facts aside, then related companies. Fully static —
 * no filters here, so this stays a server component.
 */
export function CompanyDetail({ company, roles, related }: { company: Company; roles: Job[]; related: Company[] }) {
  const area = getArea(company.location)
  const state = area ? getState(area.state) : undefined
  const locationName = company.locationName ?? area?.name
  const place = [locationName, state ? `${state.name} State` : null].filter(Boolean).join(", ")

  return <article>
    <header className="page-section dc-company-hero">
      <Breadcrumbs items={[{ label: "Companies", href: "/companies" }, { label: company.name }]} />
      <div className="dc-company-hero-row">
        <span className={`company-mark tone-${company.tone} is-large`} aria-hidden="true">{company.mark}</span>
        <div className="dc-company-hero-id">
          <h1 className="t-h1" data-reveal>{company.name}</h1>
          <p className="dc-company-hero-meta">{[company.industry, place].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      <p className="dc-company-hero-foot"><span className="dc-company-hero-size">{company.size}</span>{company.sample && <SampleTag>Sample employer</SampleTag>}</p>
    </header>

    <section className="page-section dc-company-body">
      <div className="dc-company-main">
        <section aria-labelledby="about-company">
          <h2 id="about-company" className="t-h3">About</h2>
          <p className="dc-company-overview">{company.overview}</p>
        </section>
        <section aria-labelledby="open-roles">
          <h2 id="open-roles" className="t-h3">Open roles</h2>
          {roles.length > 0
            ? <ul className="job-list">{roles.map(job => <JobRow key={job.slug} job={job} />)}</ul>
            : <EmptyState title="No open roles right now" body="New roles from this employer will appear here." />}
        </section>
      </div>

      <aside className="dc-company-aside">
        <div className="card-outline dc-fact-panel">
          <h2 className="t-label">Company details</h2>
          <dl className="dc-fact-list">
            <div><dt>Industry</dt><dd>{company.industry}</dd></div>
            <div><dt>Location</dt><dd>{place || "Not shared"}</dd></div>
            {company.website && <div><dt>Website</dt><dd><a className="text-link" href={company.website} target="_blank" rel="noopener noreferrer nofollow">{company.website.replace(/^https?:\/\//, "")}</a></dd></div>}
            <div><dt>Company size</dt><dd>{company.size}</dd></div>
            <div><dt>Open roles</dt><dd>{plural(roles.length, "open role")}</dd></div>
          </dl>
          {company.sample && <p className="dc-fact-note"><SampleTag>Sample employer profile</SampleTag> Preview only — not a verified ADDOZ employer yet.</p>}
        </div>
      </aside>
    </section>

    {related.length > 0 && <section className="page-section tone-cream-dark">
      <SectionHeading eyebrow="SIMILAR EMPLOYERS" title="Related companies" />
      <Reveal mode="scroll" className="company-grid">{related.map(other => <CompanyCard key={other.slug} company={other} />)}</Reveal>
    </section>}

    <section className="page-section tone-yellow">
      <SectionHeading title="Is this your company?" lead="Create your employer profile and take control of how you appear on ADDOZ." action={<ActionButton href="/for-employers" variant="dark" arrow>Create your employer profile</ActionButton>} />
    </section>
  </article>
}
