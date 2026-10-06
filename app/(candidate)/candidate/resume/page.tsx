import { headers } from "next/headers"
import { ResumeForm } from "@/features/candidates/components/candidate-ui"
import { getCandidateResume } from "@/features/candidates/queries"
import { isResumeStorageConfigured } from "@/lib/storage/r2"

/** Only same-site job pages can be returned to after adding a CV. */
function safeReturn(value: string | undefined) {
  return value && /^\/jobs\/[\w-]+(\?apply=1)?$/.test(value) ? value : undefined
}

export default async function CandidateResumePage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const [resume, params] = await Promise.all([getCandidateResume(await headers()), searchParams])
  const returnTo = safeReturn(params.redirect)
  return <main className="candidate-page">
    <header className="app-page-header"><div><p className="app-eyebrow">Resume</p><h1>{returnTo && !resume ? "Add your CV to apply." : "Keep your best work ready."}</h1><p className="app-page-lead">{returnTo ? "Employers on ADDOZ review every application with a CV. Upload yours once — it stays on your profile and we'll take you straight back to the job." : "Your CV is sent with every application and helps employers see how well you match their roles."}</p></div></header>
    <section className="candidate-panel candidate-form-panel"><ResumeForm initial={resume ? { id: resume.id, fileName: resume.fileName, fileSize: resume.fileSize, url: resume.url, storageKey: resume.storageKey } : null} storageConfigured={isResumeStorageConfigured()} returnTo={returnTo} /></section>
  </main>
}
