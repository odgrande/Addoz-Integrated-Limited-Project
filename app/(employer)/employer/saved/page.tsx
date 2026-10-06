import Link from "next/link"
import { headers } from "next/headers"
import { ArrowUpRight, BookmarkCheck } from "lucide-react"
import { SaveApplicantButton } from "@/features/employers/components/applicant-contact"
import { StageSelect } from "@/features/employers/components/employer-ui"
import { getEmployerApplicants, getSavedApplicationIds } from "@/features/employers/queries"

export const metadata = { title: "Saved applicants" }

const bandLabel: Record<string, string> = { top: "Top match", good: "Good match", fair: "Fair match", low: "Low match", unscored: "Not scored" }

export default async function EmployerSavedApplicantsPage() {
  const requestHeaders = await headers()
  const savedIds = await getSavedApplicationIds(requestHeaders)
  const applicants = savedIds?.length ? await getEmployerApplicants(requestHeaders, undefined, "", undefined, savedIds) : []
  // Most recently saved first
  const order = new Map((savedIds ?? []).map((id, index) => [id, index]))
  applicants.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))

  return <main className="employer-page">
    <header className="app-page-header"><div><p className="app-eyebrow">Your shortlist</p><h1>Saved applicants</h1><p className="app-page-lead">People you bookmarked to come back to, across all your jobs.</p></div></header>
    {savedIds === null
      ? <section className="employer-panel employer-empty"><BookmarkCheck size={32} aria-hidden="true" /><h2>Almost ready</h2><p>Saved applicants needs a one-time database update. Please contact ADDOZ support.</p></section>
      : applicants.length ? <section className="employer-panel employer-table-wrap"><table className="employer-table"><thead><tr><th>Candidate</th><th>Job</th><th>Match</th><th>Stage</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{applicants.map(item => <tr key={item.id}>
        <td data-label="Candidate" className="cell-primary"><Link href={`/employer/applicants/${item.id}`}><strong>{item.candidateName}</strong></Link><small>{item.headline ?? item.candidateEmail}</small></td>
        <td data-label="Job">{item.jobTitle}</td>
        <td data-label="Match"><span className={`match-score band-${item.match.band}`}>{item.match.band === "unscored" ? "—" : `${item.match.score}%`}<small>{bandLabel[item.match.band]}</small></span></td>
        <td data-label="Stage"><StageSelect applicationId={item.id} initial={item.stage} /></td>
        <td data-label="Actions"><div className="applicant-actions"><Link className="inline-link" href={`/employer/applicants/${item.id}`}>View <ArrowUpRight size={14} aria-hidden="true" /></Link><SaveApplicantButton applicationId={item.id} initial compact /></div></td>
      </tr>)}</tbody></table></section>
      : <section className="employer-panel employer-empty"><BookmarkCheck size={32} aria-hidden="true" /><h2>No saved applicants yet</h2><p>Open an applicant and press <strong>Save</strong> to keep them here for later.</p><Link className="action-button action-ghost" href="/employer/applicants">Go to applicants</Link></section>}
  </main>
}
