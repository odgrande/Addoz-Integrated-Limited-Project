import { headers } from "next/headers"
import { ResumeForm } from "@/features/candidates/components/candidate-ui"
import { getCandidateResume } from "@/features/candidates/queries"
import { isResumeStorageConfigured } from "@/lib/storage/r2"

export default async function CandidateResumePage() {
  const resume = await getCandidateResume(await headers())
  return <main className="candidate-page"><header className="app-page-header"><div><p className="app-eyebrow">Resume</p><h1>Keep your best work ready.</h1><p className="app-page-lead">Manage the resume metadata ADDOZ uses when you apply to a role.</p></div></header><section className="candidate-panel candidate-form-panel"><ResumeForm initial={resume ? { id: resume.id, fileName: resume.fileName, fileSize: resume.fileSize, url: resume.url, storageKey: resume.storageKey } : null} storageConfigured={isResumeStorageConfigured()} /></section></main>
}
