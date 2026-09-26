/**
 * The prototype candidate workspace — SAMPLE DATA for UI only. There are no
 * accounts yet (Directive 007 §24); every screen that shows this says so.
 */

export const candidate = {
  name: "Guest Candidate",
  firstName: "Guest",
  headline: "Add a headline that says what you do",
  location: "ikeja",
  email: "you@example.com",
  sample: true as const,
}

export const profileChecklist = [
  { id: "basics", label: "Add your name, location and phone", done: true },
  { id: "headline", label: "Write a one-line headline", done: false },
  { id: "experience", label: "Add your work experience", done: true },
  { id: "education", label: "Add education or training", done: false },
  { id: "skills", label: "List at least five skills", done: true },
  { id: "cv", label: "Upload your CV", done: true },
  { id: "preferences", label: "Set your job preferences", done: false },
]

export const profileCompletion = Math.round((profileChecklist.filter(item => item.done).length / profileChecklist.length) * 100)

export const savedJobSlugs = ["product-manager", "backend-developer", "hr-officer", "graduate-trainee"]

export const resume = {
  file: "My-CV-2026.pdf",
  size: "248 KB",
  uploadedAt: "2026-09-12",
  lastScan: null as string | null,   // Resume Scanner not connected yet
}

export type JobAlert = {
  id: string
  name: string
  keywords: string
  category: string
  location: string   // area slug or ""
  workplace: "" | "Remote" | "Hybrid" | "On-site"
  frequency: "Instant" | "Daily" | "Weekly"
  active: boolean
}

export const jobAlerts: JobAlert[] = [
  { id: "alert-1", name: "Design roles on the Island", keywords: "designer", category: "Design & Creative", location: "victoria-island", workplace: "", frequency: "Daily", active: true },
  { id: "alert-2", name: "Remote tech", keywords: "", category: "Development & IT", location: "", workplace: "Remote", frequency: "Weekly", active: true },
  { id: "alert-3", name: "Graduate programmes", keywords: "graduate", category: "Internships & Graduate Jobs", location: "", workplace: "", frequency: "Instant", active: false },
]

export type CandidateNotification = { id: string; kind: "application" | "alert" | "tip" | "account"; title: string; body: string; date: string; read: boolean; href?: string }

export const candidateNotifications: CandidateNotification[] = [
  { id: "n-1", kind: "application", title: "You're through to interview", body: "Frontend Developer · Sample Tech Employer moved your application to Interview.", date: "2026-09-21", read: false, href: "/candidate/applications" },
  { id: "n-2", kind: "application", title: "You've been shortlisted", body: "Data Analyst · Sample Finance Employer shortlisted your application.", date: "2026-09-22", read: false, href: "/candidate/applications" },
  { id: "n-3", kind: "alert", title: "3 new roles match “Design roles on the Island”", body: "Fresh roles in Design & Creative around Victoria Island.", date: "2026-09-22", read: false, href: "/candidate/job-alerts" },
  { id: "n-4", kind: "tip", title: "Run your CV through the Resume Scanner", body: "See how applicant tracking systems read your CV before you apply.", date: "2026-09-20", read: true, href: "/career-tools/resume-scanner" },
  { id: "n-5", kind: "account", title: "Finish your profile", body: "Profiles with a headline and preferences get better job matches.", date: "2026-09-18", read: true, href: "/candidate/profile" },
]
