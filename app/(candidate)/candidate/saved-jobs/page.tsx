import Link from "next/link"
import { headers } from "next/headers"
import { ArrowUpRight, Bookmark } from "lucide-react"
import { CandidateSaveButton } from "@/features/candidates/components/candidate-ui"
import { getCandidateSavedJobs } from "@/features/candidates/queries"

export default async function CandidateSavedJobsPage() {
  const saved = await getCandidateSavedJobs(await headers())
  return <main className="candidate-page"><header className="app-page-header"><div><p className="app-eyebrow">Your shortlist</p><h1>Saved jobs</h1><p className="app-page-lead">Keep the roles worth revisiting in one quiet place.</p></div><Link className="action-button action-primary" href="/jobs">Browse jobs <ArrowUpRight size={16} aria-hidden="true" /></Link></header>{saved.length ? <section className="candidate-panel"><ul className="candidate-detail-list">{saved.map(item => <li key={item.jobId}><div className="candidate-list-icon"><Bookmark size={18} aria-hidden="true" /></div><div className="candidate-job-main"><Link href={`/jobs/${item.slug}`}><strong>{item.title}</strong></Link><small>{item.companyName} · {item.workplace} · {item.locationName ?? "Flexible location"}</small></div><CandidateSaveButton jobSlug={item.slug} jobId={item.jobId} title={item.title} initialSaved /></li>)}</ul></section> : <section className="candidate-panel candidate-empty"><Bookmark size={32} aria-hidden="true" /><h2>Your shortlist is empty</h2><p>Save a job from the public jobs experience and it will stay connected to your account.</p><Link className="action-button action-primary" href="/jobs">Explore jobs</Link></section>}</main>
}
