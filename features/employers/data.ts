import type { Stage } from "@/features/applications/data"

/**
 * The prototype employer workspace — SAMPLE DATA for UI only. The employer is the
 * sample company "Sample Tech Employer" (features/companies). Metrics are
 * illustrative numbers for layout, not statistics about ADDOZ.
 */

export const employer = {
  company: "sample-tech-employer",
  contactName: "Hiring Manager",
  email: "hiring@example.com",
  sample: true as const,
}

export type PostingStatus = "Active" | "Draft" | "Paused" | "Closed"

export type Posting = {
  id: string
  job: string             // job slug (features/jobs) — drafts reuse a title only
  title: string
  status: PostingStatus
  views: number
  applicants: number
  shortlisted: number
  postedAt: string | null
  closesAt: string | null
}

export const postings: Posting[] = [
  { id: "p-301", job: "frontend-developer", title: "Frontend Developer", status: "Active", views: 1284, applicants: 46, shortlisted: 8, postedAt: "2026-09-20", closesAt: "2026-10-20" },
  { id: "p-298", job: "backend-developer", title: "Backend Developer", status: "Active", views: 902, applicants: 21, shortlisted: 5, postedAt: "2026-09-12", closesAt: "2026-10-12" },
  { id: "p-296", job: "product-manager", title: "Product Manager", status: "Paused", views: 655, applicants: 17, shortlisted: 3, postedAt: "2026-09-16", closesAt: "2026-10-16" },
  { id: "p-305", job: "", title: "QA Engineer", status: "Draft", views: 0, applicants: 0, shortlisted: 0, postedAt: null, closesAt: null },
  { id: "p-270", job: "", title: "IT Support Officer", status: "Closed", views: 1433, applicants: 58, shortlisted: 9, postedAt: "2026-07-01", closesAt: "2026-07-31" },
]

export type Applicant = {
  id: string
  name: string            // sample names, initialled surname
  posting: string         // posting id
  stage: Stage
  appliedAt: string
  location: string        // area slug
  experience: string
  headline: string
  sample: true
}

export const applicants: Applicant[] = [
  { id: "c-01", name: "Adaeze O.", posting: "p-301", stage: "Interview", appliedAt: "2026-09-20", location: "ikeja", experience: "4 years", headline: "React developer, design systems", sample: true },
  { id: "c-02", name: "Tunde B.", posting: "p-301", stage: "Shortlisted", appliedAt: "2026-09-20", location: "lekki", experience: "3 years", headline: "Frontend engineer, fintech", sample: true },
  { id: "c-03", name: "Chiamaka E.", posting: "p-301", stage: "In review", appliedAt: "2026-09-21", location: "victoria-island", experience: "5 years", headline: "TypeScript + accessibility", sample: true },
  { id: "c-04", name: "Ibrahim S.", posting: "p-301", stage: "Applied", appliedAt: "2026-09-22", location: "agege", experience: "2 years", headline: "Junior frontend developer", sample: true },
  { id: "c-05", name: "Funmilayo A.", posting: "p-298", stage: "Offer", appliedAt: "2026-09-13", location: "ikeja", experience: "7 years", headline: "Backend engineer, payments", sample: true },
  { id: "c-06", name: "Emeka N.", posting: "p-298", stage: "Interview", appliedAt: "2026-09-14", location: "oshodi-isolo", experience: "6 years", headline: "Go and PostgreSQL", sample: true },
  { id: "c-07", name: "Zainab K.", posting: "p-296", stage: "Shortlisted", appliedAt: "2026-09-17", location: "ikorodu", experience: "8 years", headline: "Product lead, marketplaces", sample: true },
  { id: "c-08", name: "Seun D.", posting: "p-296", stage: "Not selected", appliedAt: "2026-09-17", location: "ajah", experience: "3 years", headline: "Associate product manager", sample: true },
  { id: "c-09", name: "Ngozi U.", posting: "p-270", stage: "Hired", appliedAt: "2026-07-04", location: "ikeja", experience: "4 years", headline: "IT support and networks", sample: true },
]

// Last eight weeks of activity across all postings — illustrative, for charts only
export const weeklyActivity = [
  { week: "Jul 28", views: 310, applicants: 9 },
  { week: "Aug 4", views: 402, applicants: 14 },
  { week: "Aug 11", views: 388, applicants: 11 },
  { week: "Aug 18", views: 455, applicants: 16 },
  { week: "Aug 25", views: 520, applicants: 19 },
  { week: "Sep 1", views: 610, applicants: 22 },
  { week: "Sep 8", views: 742, applicants: 27 },
  { week: "Sep 15", views: 815, applicants: 31 },
]

export type EmployerNotification = { id: string; title: string; body: string; date: string; read: boolean; href?: string }

export const employerNotifications: EmployerNotification[] = [
  { id: "e-1", title: "4 new applicants for Frontend Developer", body: "Review them while they're fresh.", date: "2026-09-22", read: false, href: "/employer/jobs/p-301/applicants" },
  { id: "e-2", title: "Product Manager is paused", body: "Resume the listing to keep receiving applications.", date: "2026-09-21", read: false, href: "/employer/jobs" },
  { id: "e-3", title: "Complete your company profile", body: "Candidates trust listings from companies with a full profile.", date: "2026-09-19", read: true, href: "/employer/company" },
  { id: "e-4", title: "QA Engineer is still a draft", body: "Finish the listing and publish it when you're ready.", date: "2026-09-18", read: true, href: "/employer/jobs/p-305/edit" },
]
