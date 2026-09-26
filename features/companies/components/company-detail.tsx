import { ActionButton, Breadcrumbs, EmptyState, Reveal, SampleTag, SectionHeading } from "@/components/patterns"
import { plural } from "@/lib/format"
import { getArea, getState } from "@/features/locations/data"
import { jobsAtCompany } from "@/features/jobs/data"
import { JobRow } from "@/features/jobs/components/job-card"
import { companies, type Company } from "../data"
import { CompanyCard } from "./company-card"

/**
 * Company profile (Directive 009): a job-detail-style header (large mark + name),
 * overview, open roles and a facts aside, then related companies. Fully static —
 * no filters here, so this stays a server component.
 */
export function CompanyDetail({ company }: { company: Company }) {
  const area = getArea(company.location)
  const state = area ? getState(area.state) : undefined
  const roles = jobsAtCompany(company.slug)
  const related = companies.filter(other => other.slug !== company.slug && (other.industry === company.industry || other.location === company.location)).slice(0, 3)

  return <article>
    <header className="page-section dc-company-hero">
      <Breadcrumbs items={[{ label: "Companies", href: "/companies" }, { label: company.name }]} />
      <div className="dc-company-hero-row">
        <span className={`company-mark tone-${company.tone} is-large`} aria-hidden="true">{company.mark}</span>
        <div className="dc-company-hero-id">
          <h1 className="t-h1" data-reveal>{company.name}</h1>
          <p className="dc-company-hero-meta">{company.industry} · {area?.name}{state ? `, ${state.name} State` : ""}</p>
        </div>
      </div>
      <p className="dc-company-hero-foot"><span className="dc-company-hero-size">{company.size}</span><SampleTag>Sample employer</SampleTag></p>
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
            : <EmptyState title="No open roles right now" body="Sample roles for this employer will appear here as they're added." />}
        </section>
      </div>

      <aside className="dc-company-aside">
        <div className="card-outline dc-fact-panel">
          <h2 className="t-label">Company details</h2>
          <dl className="dc-fact-list">
            <div><dt>Industry</dt><dd>{company.industry}</dd></div>
            <div><dt>Location</dt><dd>{area?.name}{state ? `, ${state.name}` : ""}</dd></div>
            <div><dt>Company size</dt><dd>{company.size}</dd></div>
            <div><dt>Open roles</dt><dd>{plural(roles.length, "open role")}</dd></div>
          </dl>
          <p className="dc-fact-note"><SampleTag>Sample employer profile</SampleTag> Preview only — not a verified ADDOZ employer yet.</p>
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
