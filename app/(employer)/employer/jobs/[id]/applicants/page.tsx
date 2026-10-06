import Link from "next/link"
import { headers } from "next/headers"
import { ArrowLeft } from "lucide-react"
import { ApplicantReview } from "@/features/employers/components/applicant-review"
import { getEmployerApplicants, getEmployerJob, getSavedApplicationIds } from "@/features/employers/queries"
import { displayStatus } from "@/features/jobs/listing"

export default async function EmployerJobApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id
  const requestHeaders = await headers()
  const [record, applicants, savedIds] = await Promise.all([getEmployerJob(requestHeaders, id), getEmployerApplicants(requestHeaders, id), getSavedApplicationIds(requestHeaders)])
  const job = record.job
  const status = displayStatus(job.status, job.deadline)
  return <main className="employer-page">
    <header className="app-page-header"><Link className="text-link" href="/employer/jobs"><ArrowLeft size={15} aria-hidden="true" />Back to jobs</Link><div><p className="app-eyebrow">Applicants · {status}{job.status === "Active" && job.deadline ? ` · ${status === "Expired" ? "ended" : "ends"} ${new Date(job.deadline).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}` : ""}</p><h1>{job.title}</h1><p className="app-page-lead">{applicants.length} {applicants.length === 1 ? "applicant" : "applicants"}{job.experience ? ` · needs ${job.experience}` : ""}{job.skills?.length ? ` · skills: ${job.skills.join(", ")}` : ""}</p></div></header>
    {applicants.length
      ? <ApplicantReview jobSkills={job.skills ?? []} savedIds={savedIds} applicants={applicants.map(item => ({ id: item.id, candidateName: item.candidateName, candidateEmail: item.candidateEmail, candidatePhone: item.candidatePhone, headline: item.headline, locationName: item.locationName, stage: item.stage, appliedAt: new Date(item.appliedAt).toISOString(), coverLetter: item.coverLetter, resumeFileName: item.resumeFileName, resumeUrl: item.resumeUrl, match: item.match }))} />
      : <section className="employer-panel employer-empty"><h2>No applicants yet</h2><p>Applications for this role will appear here, ranked by how well each candidate matches the job.</p></section>}
  </main>
}
