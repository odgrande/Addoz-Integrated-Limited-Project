import Link from "next/link"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { ArrowLeft, Download, ExternalLink, FileText, Mail, MapPin, Phone } from "lucide-react"
import { ContactApplicantButton, SaveApplicantButton } from "@/features/employers/components/applicant-contact"
import { StageSelect } from "@/features/employers/components/employer-ui"
import { EmployerOwnershipError, getEmployerApplicant, getEmployerContext, getSavedApplicationIds } from "@/features/employers/queries"
import { MessageButton } from "@/features/messages/components/messages-ui"

export const metadata = { title: "Applicant" }

const bandLabel: Record<string, string> = { top: "Top match", good: "Good match", fair: "Fair match", low: "Low match", unscored: "Not scored" }

export default async function EmployerApplicantPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id
  const requestHeaders = await headers()
  const applicant = await getEmployerApplicant(requestHeaders, id).catch(error => {
    if (error instanceof EmployerOwnershipError) notFound()
    throw error
  })
  const [context, savedIds] = await Promise.all([getEmployerContext(requestHeaders), getSavedApplicationIds(requestHeaders)])
  const { match } = applicant
  const isPdf = /\.pdf$/i.test(applicant.resumeFileName ?? "")
  const companyName = context.company?.name ?? "your company"

  return <main className="employer-page applicant-profile">
    <header className="app-page-header">
      <Link className="text-link" href={`/employer/jobs/${applicant.jobId}/applicants`}><ArrowLeft size={15} aria-hidden="true" />All applicants for {applicant.jobTitle}</Link>
      <div><p className="app-eyebrow">Applicant · {applicant.jobTitle}</p><h1>{applicant.candidateName}</h1><p className="app-page-lead">{applicant.headline ?? "No headline added"}</p></div>
      <div className="applicant-profile-actions">
        <ContactApplicantButton applicationId={applicant.id} candidateName={applicant.candidateName} jobTitle={applicant.jobTitle} companyName={companyName} />
        <MessageButton area="employer" applicationId={applicant.id} label="Open messages" />
        {savedIds && <SaveApplicantButton applicationId={applicant.id} initial={savedIds.includes(applicant.id)} />}
      </div>
    </header>

    <div className="applicant-profile-grid">
      <aside className="employer-panel applicant-facts">
        <div className={`match-score match-score-lg band-${match.band}`}>{match.band === "unscored" ? "—" : `${match.score}%`}<small>{bandLabel[match.band]}</small></div>
        {match.band === "unscored" && <p className="field-hint">We couldn&apos;t read text from this CV (it may be a scanned image), so it isn&apos;t scored. Open the CV to review it.</p>}
        {match.matchedSkills.length + match.missingSkills.length > 0 && <div>
          <h2 className="applicant-facts-title">Skills for this job</h2>
          <ul className="skill-chips">{match.matchedSkills.map(skill => <li key={skill} className="is-match">{skill}</li>)}{match.missingSkills.map(skill => <li key={skill}>{skill}</li>)}</ul>
        </div>}
        {match.requiredYears > 0 && <p className="match-years">{match.years === null ? "Years of experience not stated" : `About ${match.years} years of experience`} · job asks for {match.requiredYears}+</p>}
        <dl className="applicant-contact-list">
          <div><dt><Mail size={14} aria-hidden="true" />Email</dt><dd><a className="inline-link" href={`mailto:${applicant.candidateEmail}`}>{applicant.candidateEmail}</a></dd></div>
          {applicant.candidatePhone && <div><dt><Phone size={14} aria-hidden="true" />Phone</dt><dd><a className="inline-link" href={`tel:${applicant.candidatePhone}`}>{applicant.candidatePhone}</a></dd></div>}
          {applicant.locationName && <div><dt><MapPin size={14} aria-hidden="true" />Location</dt><dd>{applicant.locationName}</dd></div>}
          <div><dt>Applied</dt><dd>{new Date(applicant.appliedAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</dd></div>
          <div><dt>Stage</dt><dd><StageSelect applicationId={applicant.id} initial={applicant.stage} /></dd></div>
        </dl>
        {applicant.coverLetter && <div><h2 className="applicant-facts-title">Cover note</h2><p className="applicant-cover">{applicant.coverLetter}</p></div>}
      </aside>

      <section className="employer-panel applicant-cv">
        <div className="panel-heading">
          <h2><FileText size={18} aria-hidden="true" />{applicant.resumeFileName ?? "CV"}</h2>
          {applicant.resumeUrl && <div className="cluster">
            {isPdf && <a className="action-button action-ghost action-sm" href={`${applicant.resumeUrl}?view=1`} target="_blank" rel="noreferrer"><ExternalLink size={14} aria-hidden="true" />Open</a>}
            <a className="action-button action-ghost action-sm" href={applicant.resumeUrl}><Download size={14} aria-hidden="true" />Download</a>
          </div>}
        </div>
        {!applicant.resumeUrl ? <p>No CV was attached to this application.</p>
          : isPdf ? <iframe className="applicant-cv-frame" src={`${applicant.resumeUrl}?view=1`} title={`CV of ${applicant.candidateName}`} />
          : applicant.cvText ? <><p className="field-hint">Text from the CV, for quick reading. Download it to see the original layout.</p><pre className="applicant-cv-text">{applicant.cvText}</pre></>
          : <p className="field-hint">This document can&apos;t be previewed here. Use <strong>Download</strong> to read it.</p>}
      </section>
    </div>
  </main>
}
