import Link from "next/link"
import { headers } from "next/headers"
import { ArrowUpRight, Users } from "lucide-react"
import { StageSelect } from "@/features/employers/components/employer-ui"
import { getEmployerApplicants } from "@/features/employers/queries"
import { employerStages } from "@/features/employers/stages"
import { matchBands } from "@/features/applications/matching"

const bandLabel: Record<string, string> = { top: "Top match", good: "Good match", fair: "Fair match", low: "Low match", unscored: "Not scored" }

export default async function EmployerApplicantsPage({ searchParams }: { searchParams: Promise<{ q?: string; stage?: string; match?: string; sort?: string }> }) {
  const params = await searchParams
  const all = await getEmployerApplicants(await headers(), undefined, params.q ?? "", params.stage)
  const applicants = all
    .filter(item => !params.match || item.match.band === params.match)
    .sort((a, b) => params.sort === "match" ? b.match.score - a.match.score : 0)
  return <main className="employer-page">
    <header className="app-page-header"><div><p className="app-eyebrow">Your talent pool</p><h1>Applicants</h1><p className="app-page-lead">Everyone who applied to your roles, with how well each matches the job they applied for. Open a job to review and shortlist in bulk.</p></div></header>
    <form className="employer-filter" method="get">
      <label className="field"><span className="field-label">Search</span><input className="input" name="q" defaultValue={params.q ?? ""} placeholder="Candidate or job title" /></label>
      <label className="field"><span className="field-label">Stage</span><select className="input" name="stage" defaultValue={params.stage ?? ""}><option value="">All stages</option>{employerStages.map(item => <option key={item}>{item}</option>)}</select></label>
      <label className="field"><span className="field-label">Match</span><select className="input" name="match" defaultValue={params.match ?? ""}><option value="">Any match</option>{matchBands.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}<option value="unscored">Not scored</option></select></label>
      <label className="field"><span className="field-label">Sort</span><select className="input" name="sort" defaultValue={params.sort ?? ""}><option value="">Newest first</option><option value="match">Best match first</option></select></label>
      <button className="action-button action-ghost" type="submit">Filter</button>
    </form>
    {applicants.length ? <section className="employer-panel employer-table-wrap"><table className="employer-table"><thead><tr><th>Candidate</th><th>Job</th><th>Match</th><th>Applied</th><th>Stage</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>{applicants.map(item => <tr key={item.id}>
      <td data-label="Candidate" className="cell-primary"><Link href={`/employer/applicants/${item.id}`}><strong>{item.candidateName}</strong></Link><small>{item.headline ?? "No headline"}</small></td>
      <td data-label="Job">{item.jobTitle}</td>
      <td data-label="Match"><span className={`match-score band-${item.match.band}`}>{item.match.band === "unscored" ? "—" : `${item.match.score}%`}<small>{bandLabel[item.match.band]}</small></span></td>
      <td data-label="Applied">{new Date(item.appliedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</td>
      <td data-label="Stage"><StageSelect applicationId={item.id} initial={item.stage} /></td>
      <td data-label="Open"><Link className="inline-link" href={`/employer/applicants/${item.id}`}>View <ArrowUpRight size={14} aria-hidden="true" /></Link></td>
    </tr>)}</tbody></table></section>
      : <section className="employer-panel employer-empty"><Users size={32} aria-hidden="true" /><h2>No applicants found</h2><p>Try a different search or publish a role to start receiving applications.</p></section>}
  </main>
}
