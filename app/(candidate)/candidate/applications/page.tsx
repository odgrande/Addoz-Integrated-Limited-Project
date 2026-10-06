import Link from "next/link"
import { headers } from "next/headers"
import { ArrowUpRight, ClipboardList } from "lucide-react"
import { getCandidateApplications } from "@/features/candidates/queries"
import { MessageButton } from "@/features/messages/components/messages-ui"

export default async function CandidateApplicationsPage() {
  const applications = await getCandidateApplications(await headers())
  return <main className="candidate-page"><header className="app-page-header"><div><p className="app-eyebrow">Your search</p><h1>Applications</h1><p className="app-page-lead">A clear record of every role you have put your name forward for.</p></div><Link className="action-button action-primary" href="/jobs">Find another role <ArrowUpRight size={16} aria-hidden="true" /></Link></header>{applications.length ? <section className="candidate-panel"><ul className="candidate-detail-list">{applications.map(item => <li key={item.id}><div className="candidate-list-icon"><ClipboardList size={18} aria-hidden="true" /></div><div className="candidate-job-main"><Link href={`/jobs/${item.slug}`}><strong>{item.title}</strong></Link><small>{item.companyName} · {item.locationName ?? "Flexible location"}</small></div><span className="candidate-status">{item.stage ?? "Applied"}</span><MessageButton area="candidate" applicationId={item.id} label="Message employer" /><time>{new Date(item.appliedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</time></li>)}</ul></section> : <section className="candidate-panel candidate-empty"><ClipboardList size={32} aria-hidden="true" /><h2>No applications yet</h2><p>When a role feels right, apply from its job detail page and it will appear here.</p><Link className="action-button action-primary" href="/jobs">Browse jobs</Link></section>}</main>
}
