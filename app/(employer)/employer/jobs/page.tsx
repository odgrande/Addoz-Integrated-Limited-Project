import Link from "next/link"
import { headers } from "next/headers"
import { Plus } from "lucide-react"
import { JobActions } from "@/features/employers/components/employer-ui"
import { getEmployerJobs } from "@/features/employers/queries"
import { displayStatus, isExpired } from "@/features/jobs/listing"

type View = "live" | "review" | "expired" | "archived"
type Row = Awaited<ReturnType<typeof getEmployerJobs>>[number]

const views: { id: View; label: string; empty: string }[] = [
  { id: "live", label: "Live", empty: "No live jobs right now. Publish a draft or reinstate an expired job." },
  { id: "review", label: "Drafts & review", empty: "No drafts, paused jobs or jobs in review." },
  { id: "expired", label: "Expired", empty: "No expired jobs. Jobs land here when their listing period ends." },
  { id: "archived", label: "Archived", empty: "Nothing archived. Archived jobs keep their applicants and can be reinstated." },
]

function viewOf(item: Row): View {
  if (item.status === "Active") return isExpired(item.deadline) ? "expired" : "live"
  if (item.status === "Archived" || item.status === "Closed") return "archived"
  return "review" // Draft, Pending, Declined, Paused
}

const day = (value: Date | string) => new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })

export default async function EmployerJobsPage({ searchParams }: { searchParams: Promise<{ q?: string; view?: string }> }) {
  const params = await searchParams
  const jobs = await getEmployerJobs(await headers(), params.q ?? "")
  const counts = Object.fromEntries(views.map(item => [item.id, jobs.filter(row => viewOf(row) === item.id).length])) as Record<View, number>
  const view: View = views.some(item => item.id === params.view) ? params.view as View : counts.live || !jobs.length ? "live" : (views.find(item => counts[item.id])?.id ?? "live")
  const rows = jobs.filter(row => viewOf(row) === view)
  const tabHref = (id: View) => `/employer/jobs?${new URLSearchParams({ ...(params.q ? { q: params.q } : {}), view: id })}`

  return <main className="employer-page">
    <header className="app-page-header"><div><p className="app-eyebrow">Your marketplace</p><h1>Jobs</h1><p className="app-page-lead">Create roles, keep them current, and stay close to the people applying.</p></div><Link className="action-button action-primary" href="/employer/jobs/new"><Plus size={17} aria-hidden="true" />Post a job</Link></header>
    <form className="employer-filter" method="get"><input type="hidden" name="view" value={view} /><label className="field"><span className="field-label">Search jobs</span><input className="input" name="q" defaultValue={params.q ?? ""} placeholder="Search by title" /></label><button className="action-button action-ghost" type="submit">Search</button></form>
    <nav className="employer-tabs" aria-label="Job lists">{views.map(item => <Link key={item.id} href={tabHref(item.id)} className={item.id === view ? "is-active" : undefined} aria-current={item.id === view ? "page" : undefined}>{item.label} <span>{counts[item.id]}</span></Link>)}</nav>
    {rows.length ? <section className="employer-panel employer-table-wrap"><table className="employer-table"><thead><tr><th>Role</th><th>Status</th><th>Location</th><th>Applicants</th><th>{view === "expired" ? "Ended" : "Ends"}</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{rows.map(item => {
      const status = displayStatus(item.status, item.deadline)
      return <tr key={item.id}>
        <td data-label="Role" className="cell-primary"><Link href={`/employer/jobs/${item.id}/edit`}><strong>{item.title}</strong></Link><small>{item.type} · {item.workplace}</small></td>
        <td data-label="Status"><span className={`employer-status status-${status.toLowerCase().replace(/\s+/g, "-")}`}>{status}</span>{item.status === "Declined" && item.moderationNote && <small className="employer-cover-letter">ADDOZ: {item.moderationNote}</small>}</td>
        <td data-label="Location">{item.locationName ?? "Not set"}</td>
        <td data-label="Applicants"><Link className="inline-link" href={`/employer/jobs/${item.id}/applicants`}>{Number(item.applicantCount)} {Number(item.applicantCount) === 1 ? "applicant" : "applicants"}</Link></td>
        <td data-label={view === "expired" ? "Ended" : "Ends"}>{item.status === "Active" && item.deadline ? day(item.deadline) : "—"}</td>
        <td data-label="Actions"><JobActions id={item.id} status={item.status} deadline={item.deadline} postedAt={item.postedAt} /></td>
      </tr>
    })}</tbody></table></section>
      : jobs.length ? <section className="employer-panel employer-empty"><p>{views.find(item => item.id === view)!.empty}</p></section>
      : <section className="employer-panel employer-empty"><h2>No jobs yet</h2><p>Your first published role will appear here.</p><Link className="action-button action-primary" href="/employer/jobs/new">Create a job</Link></section>}
  </main>
}
