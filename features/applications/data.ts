/**
 * Application stages + SAMPLE applications for the prototype dashboards.
 * One vocabulary serves both sides: candidates see where they stand, employers
 * move applicants through the same stages. No real applications are stored.
 */

export const stages = ["Applied", "In review", "Shortlisted", "Interview", "Offer", "Hired", "Not selected"] as const
export type Stage = (typeof stages)[number]

// Tone names map to StatusBadge tones
export const stageTone: Record<Stage, "neutral" | "info" | "accent" | "progress" | "success" | "danger"> = {
  Applied: "neutral",
  "In review": "info",
  Shortlisted: "accent",
  Interview: "progress",
  Offer: "success",
  Hired: "success",
  "Not selected": "danger",
}

export type ApplicationEvent = { date: string; label: string }
export type CandidateApplication = {
  id: string
  job: string            // job slug
  appliedAt: string
  stage: Stage
  events: ApplicationEvent[]
  sample: true
}

export const candidateApplications: CandidateApplication[] = [
  { id: "app-1042", job: "frontend-developer", appliedAt: "2026-09-18", stage: "Interview", sample: true, events: [
    { date: "2026-09-18", label: "Application sent" }, { date: "2026-09-19", label: "Viewed by the employer" }, { date: "2026-09-21", label: "Moved to interview" } ] },
  { id: "app-1039", job: "product-designer", appliedAt: "2026-09-21", stage: "In review", sample: true, events: [
    { date: "2026-09-21", label: "Application sent" }, { date: "2026-09-22", label: "Viewed by the employer" } ] },
  { id: "app-1031", job: "data-analyst", appliedAt: "2026-09-19", stage: "Shortlisted", sample: true, events: [
    { date: "2026-09-19", label: "Application sent" }, { date: "2026-09-20", label: "Viewed by the employer" }, { date: "2026-09-22", label: "Shortlisted" } ] },
  { id: "app-1027", job: "graduate-trainee", appliedAt: "2026-09-22", stage: "Applied", sample: true, events: [
    { date: "2026-09-22", label: "Application sent" } ] },
  { id: "app-1012", job: "marketing-specialist", appliedAt: "2026-09-10", stage: "Not selected", sample: true, events: [
    { date: "2026-09-10", label: "Application sent" }, { date: "2026-09-12", label: "Viewed by the employer" }, { date: "2026-09-16", label: "The employer chose other candidates" } ] },
]
