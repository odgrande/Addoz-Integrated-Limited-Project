import type { Salary } from "@/lib/format"
import { getCategoryByName } from "@/features/categories/data"

/**
 * Jobs — SAMPLE DATA, clearly labelled in every view.
 *
 * These are illustrative roles for the prototype, not live vacancies. The first six
 * are the homepage's sample roles (same slugs, so homepage links resolve). Categories
 * and areas are real ADDOZ taxonomy; filter vocabularies (job type, career level,
 * experience, sort) follow the current ADDOZ jobs page. Salaries are sample figures
 * shown in the live site's ₦-per-month format. Production swaps this module for
 * queries against the jobs table — every page reads through the helpers below.
 */

export const jobTypes = ["Full-time", "Part-time", "Contract", "Internship"] as const
export const workplaces = ["On-site", "Hybrid", "Remote"] as const
export const careerLevels = ["Fresher", "Junior", "Middle", "Senior"] as const
export const experienceLevels = ["No experience", "1-2 years", "3-5 years", "6-9 years", "10+ years"] as const
export const salaryBands = [
  { id: "under-150", label: "Under ₦150k / month", min: 0, max: 149_999 },
  { id: "150-300", label: "₦150k – ₦300k", min: 150_000, max: 300_000 },
  { id: "300-500", label: "₦300k – ₦500k", min: 300_001, max: 500_000 },
  { id: "500-plus", label: "₦500k +", min: 500_001, max: Infinity },
] as const
export const sortOptions = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "salary", label: "Highest salary" },
] as const

export type JobType = (typeof jobTypes)[number]
export type Workplace = (typeof workplaces)[number]
export type CareerLevel = (typeof careerLevels)[number]
export type Experience = (typeof experienceLevels)[number]
export type SortId = (typeof sortOptions)[number]["id"]

export type Job = {
  id?: string
  slug: string
  title: string
  category: string       // category name
  location: string       // area slug
  company: string        // company slug
  type: JobType
  workplace: Workplace
  level: CareerLevel
  experience: Experience
  salary: Salary
  postedAt: string
  deadline: string
  featured: boolean
  apply: "addoz" | "email"
  mark: string
  color: "yellow" | "blue" | "orange"
  summary: string
  responsibilities: string[]
  requirements: string[]
  skills: string[]
  sample: boolean
  applied?: boolean
}

type Seed = Omit<Job, "sample" | "deadline"> & { deadline?: string }

const seeds: Seed[] = [
  { slug: "product-designer", title: "Product Designer", category: "Design & Creative", location: "victoria-island", company: "sample-creative-studio", type: "Full-time", workplace: "Hybrid", level: "Middle", experience: "3-5 years", salary: { min: 350_000, max: 600_000, period: "month" }, postedAt: "2026-09-21", featured: true, apply: "addoz", mark: "✳", color: "yellow",
    summary: "Help turn complex ideas into thoughtful, useful digital experiences — from early research to polished interface.",
    responsibilities: ["Shape product flows from early sketches to high-fidelity prototypes", "Run lightweight research and usability sessions", "Keep the design system consistent and accessible", "Work closely with engineers through build and release"],
    requirements: ["A portfolio that shows your process, not just outcomes", "Confidence with Figma and interactive prototyping", "Clear written and spoken communication", "Experience designing for mobile-first users"],
    skills: ["Product thinking", "Figma", "Prototyping", "Accessibility"] },
  { slug: "frontend-developer", title: "Frontend Developer", category: "Development & IT", location: "ikeja", company: "sample-tech-employer", type: "Full-time", workplace: "Remote", level: "Middle", experience: "3-5 years", salary: { min: 400_000, max: 700_000, period: "month" }, postedAt: "2026-09-20", featured: true, apply: "addoz", mark: "</>", color: "blue",
    summary: "Build accessible, fast interfaces and collaborate with designers to bring digital products to life.",
    responsibilities: ["Build and maintain React interfaces in TypeScript", "Turn designs into responsive, accessible components", "Improve performance on low-bandwidth connections", "Review code and share knowledge with the team"],
    requirements: ["Solid React and TypeScript experience", "An eye for detail in layout and interaction", "Understanding of web accessibility (WCAG)", "Comfort working in a remote team"],
    skills: ["React", "TypeScript", "Accessibility", "Performance"] },
  { slug: "marketing-specialist", title: "Digital Marketing Specialist", category: "Marketing & Sales", location: "victoria-island", company: "sample-retail-employer", type: "Full-time", workplace: "On-site", level: "Middle", experience: "3-5 years", salary: { min: 250_000, max: 400_000, period: "month" }, postedAt: "2026-09-18", featured: false, apply: "addoz", mark: "↗", color: "orange",
    summary: "Connect thoughtful campaigns with the people they are made for, across social, search and email.",
    responsibilities: ["Plan and run campaigns across paid and organic channels", "Report on performance and turn insight into next steps", "Work with design on assets that fit the brand", "Manage a monthly campaign calendar"],
    requirements: ["Hands-on experience running digital campaigns", "Confidence with analytics tools", "Strong writing for short-form channels", "Organised, with an eye on budgets"],
    skills: ["Content strategy", "Analytics", "Paid social", "Communication"] },
  { slug: "customer-success", title: "Customer Success Associate", category: "Customer Service", location: "ikorodu", company: "sample-services-employer", type: "Full-time", workplace: "Hybrid", level: "Junior", experience: "1-2 years", salary: { min: 150_000, max: 220_000, period: "month" }, postedAt: "2026-09-19", featured: false, apply: "addoz", mark: "+", color: "yellow",
    summary: "Help customers find answers and get more from the products they use — by phone, chat and email.",
    responsibilities: ["Answer customer questions quickly and kindly", "Guide new customers through onboarding", "Log feedback and share patterns with the product team", "Follow up until issues are fully resolved"],
    requirements: ["Warm, patient communication", "Some experience in a customer-facing role", "Comfort with support tools and spreadsheets", "Good judgement about when to escalate"],
    skills: ["Customer support", "Problem solving", "Communication"] },
  { slug: "product-manager", title: "Product Manager", category: "Product Management", location: "ikeja", company: "sample-tech-employer", type: "Contract", workplace: "Remote", level: "Senior", experience: "6-9 years", salary: { min: 600_000, max: 900_000, period: "month" }, postedAt: "2026-09-16", featured: true, apply: "addoz", mark: "◎", color: "blue",
    summary: "Bring teams together around a clear product direction, grounded in what customers actually need.",
    responsibilities: ["Own the roadmap for one product area", "Turn research and data into clear priorities", "Write crisp problem statements and acceptance criteria", "Keep stakeholders aligned through each release"],
    requirements: ["Experience shipping digital products end to end", "Comfort with data and customer research", "Clear, structured communication", "Experience working with remote teams"],
    skills: ["Product strategy", "Research", "Prioritisation", "Roadmapping"] },
  { slug: "content-writer", title: "Content Writer", category: "Writing & Translation", location: "agege", company: "sample-creative-studio", type: "Internship", workplace: "Remote", level: "Fresher", experience: "No experience", salary: { min: 80_000, max: 120_000, period: "month" }, postedAt: "2026-09-15", featured: false, apply: "email", mark: "Aa", color: "orange",
    summary: "Make ideas clear through helpful, human writing — a first step into content and communications.",
    responsibilities: ["Draft articles, captions and short guides", "Edit for clarity, tone and accuracy", "Research topics with a reliable eye", "Learn how content performance is measured"],
    requirements: ["A love of clear writing", "A few writing samples (school or personal work is fine)", "Curiosity and openness to feedback", "Reliable internet access"],
    skills: ["Writing", "Editing", "Research"] },
  { slug: "finance-officer", title: "Finance Officer", category: "Accounting & Finance", location: "apapa", company: "sample-finance-employer", type: "Full-time", workplace: "On-site", level: "Middle", experience: "3-5 years", salary: { min: 120_000, max: 250_000, period: "month" }, postedAt: "2026-09-22", featured: true, apply: "addoz", mark: "₦", color: "yellow",
    summary: "Keep day-to-day finance running smoothly, from payables to month-end reporting.",
    responsibilities: ["Process payables, receivables and reconciliations", "Prepare month-end schedules and reports", "Support budgeting and cash-flow tracking", "Keep records ready for audit"],
    requirements: ["A degree or diploma in accounting or finance", "Working knowledge of accounting software", "Strong attention to detail", "Professional certification (or in progress) is a plus"],
    skills: ["Bookkeeping", "Reconciliation", "Excel", "Reporting"] },
  { slug: "senior-accounts-officer", title: "Senior Accounts Officer", category: "Accounting & Finance", location: "ogijo", company: "sample-manufacturing-employer", type: "Full-time", workplace: "On-site", level: "Senior", experience: "6-9 years", salary: { min: 350_000, period: "month" }, postedAt: "2026-09-14", featured: false, apply: "addoz", mark: "₦", color: "blue",
    summary: "Lead the accounts function for a busy operations site, with a close eye on controls and reporting.",
    responsibilities: ["Oversee ledgers, reconciliations and closing", "Prepare management accounts and variance notes", "Strengthen internal controls", "Coach junior accounts staff"],
    requirements: ["Several years in an accounts leadership role", "Professional accounting certification", "Experience in a manufacturing or operations setting", "Confident with ERP systems"],
    skills: ["Management accounts", "Controls", "ERP", "Leadership"] },
  { slug: "production-supervisor", title: "Production Supervisor", category: "Manufacturing/Industrial", location: "mowe", company: "sample-manufacturing-employer", type: "Full-time", workplace: "On-site", level: "Middle", experience: "3-5 years", salary: { min: 120_000, max: 150_000, period: "month" }, postedAt: "2026-09-21", featured: false, apply: "addoz", mark: "⚙", color: "orange",
    summary: "Run safe, efficient production shifts and help the floor hit its quality targets.",
    responsibilities: ["Plan shift schedules and daily production targets", "Supervise machine operators and floor staff", "Track output, downtime and quality issues", "Enforce health and safety procedures"],
    requirements: ["Experience supervising a production line", "Understanding of quality and safety standards", "Calm leadership under pressure", "Willingness to work shifts"],
    skills: ["Shift planning", "Quality control", "Health & safety"] },
  { slug: "machine-operator", title: "Machine Operator", category: "Manufacturing/Industrial", location: "ibafo", company: "sample-manufacturing-employer", type: "Full-time", workplace: "On-site", level: "Junior", experience: "1-2 years", salary: { min: 120_000, period: "month" }, postedAt: "2026-09-20", featured: false, apply: "addoz", mark: "⚙", color: "yellow",
    summary: "Operate and care for production machinery on a busy, safety-first floor.",
    responsibilities: ["Set up and run assigned machines", "Carry out basic checks and cleaning", "Report faults and quality issues quickly", "Follow safety procedures on every shift"],
    requirements: ["Some experience operating industrial machines", "Basic mechanical understanding", "Reliability and good timekeeping", "Willingness to work shifts"],
    skills: ["Machine operation", "Safety", "Teamwork"] },
  { slug: "hr-officer", title: "HR Officer", category: "Human Resources", location: "ikeja", company: "sample-services-employer", type: "Full-time", workplace: "On-site", level: "Middle", experience: "3-5 years", salary: { min: 200_000, max: 320_000, period: "month" }, postedAt: "2026-09-17", featured: false, apply: "addoz", mark: "HR", color: "blue",
    summary: "Support people across the employee journey — from hiring and onboarding to records and wellbeing.",
    responsibilities: ["Coordinate recruitment and onboarding", "Keep employee records accurate and secure", "Support payroll inputs and leave tracking", "Be a trusted first point of contact for staff"],
    requirements: ["Experience in an HR generalist role", "Knowledge of Nigerian labour practice", "Discretion with sensitive information", "Strong organisation and follow-through"],
    skills: ["Recruitment", "Onboarding", "HR records", "Payroll support"] },
  { slug: "retail-sales-associate", title: "Retail Sales Associate", category: "Retail & Sales", location: "lekki", company: "sample-retail-employer", type: "Full-time", workplace: "On-site", level: "Junior", experience: "1-2 years", salary: { min: 150_000, max: 200_000, period: "month" }, postedAt: "2026-09-22", featured: false, apply: "addoz", mark: "★", color: "orange",
    summary: "Welcome customers, help them find the right fit and keep the store looking its best.",
    responsibilities: ["Greet and advise customers on the floor", "Process sales and returns accurately", "Keep displays tidy and stock replenished", "Share customer feedback with the store lead"],
    requirements: ["A friendly, confident manner", "Some retail or customer service experience", "Basic numeracy", "Weekend availability"],
    skills: ["Customer service", "Sales", "Merchandising"] },
  { slug: "business-sales-executive", title: "Business Sales Executive", category: "Sales & Marketing", location: "oshodi-isolo", company: "sample-logistics-employer", type: "Full-time", workplace: "On-site", level: "Middle", experience: "3-5 years", salary: { min: 200_000, max: 350_000, period: "month" }, postedAt: "2026-09-13", featured: false, apply: "addoz", mark: "↗", color: "yellow",
    summary: "Grow business accounts by understanding what customers need and following through.",
    responsibilities: ["Find and qualify new business customers", "Present offers and negotiate terms", "Manage a pipeline and forecast accurately", "Keep existing accounts happy and growing"],
    requirements: ["A track record in B2B sales", "Strong negotiation and presentation skills", "Comfort with a CRM", "Willingness to visit customers across Lagos"],
    skills: ["B2B sales", "Negotiation", "CRM", "Pipeline management"] },
  { slug: "logistics-coordinator", title: "Logistics Coordinator", category: "Logistics & Transportation", location: "oshodi-isolo", company: "sample-logistics-employer", type: "Full-time", workplace: "On-site", level: "Middle", experience: "3-5 years", salary: { min: 220_000, max: 300_000, period: "month" }, postedAt: "2026-09-18", featured: false, apply: "addoz", mark: "→", color: "blue",
    summary: "Keep deliveries moving on time by planning routes, loads and communication.",
    responsibilities: ["Plan daily dispatch schedules and routes", "Coordinate drivers, warehouse and customers", "Track deliveries and resolve delays", "Maintain accurate delivery records"],
    requirements: ["Experience coordinating deliveries or dispatch", "Good knowledge of Lagos routes", "Calm problem solving", "Confidence with spreadsheets"],
    skills: ["Dispatch planning", "Route planning", "Coordination"] },
  { slug: "fleet-supervisor", title: "Fleet Supervisor", category: "Logistics and Haulage", location: "apapa", company: "sample-logistics-employer", type: "Full-time", workplace: "On-site", level: "Senior", experience: "6-9 years", salary: { min: 250_000, max: 380_000, period: "month" }, postedAt: "2026-09-11", featured: false, apply: "email", mark: "→", color: "orange",
    summary: "Lead a haulage fleet with a focus on safety, maintenance and on-time performance.",
    responsibilities: ["Supervise drivers and fleet schedules", "Plan preventive maintenance with workshops", "Monitor fuel use and trip records", "Lead safety briefings and incident reviews"],
    requirements: ["Several years in fleet or haulage operations", "Knowledge of vehicle maintenance planning", "Strong leadership on the ground", "Experience with fleet tracking tools"],
    skills: ["Fleet management", "Safety", "Maintenance planning"] },
  { slug: "data-analyst", title: "Data Analyst", category: "Data & Analytics", location: "victoria-island", company: "sample-finance-employer", type: "Full-time", workplace: "Hybrid", level: "Junior", experience: "1-2 years", salary: { min: 300_000, max: 450_000, period: "month" }, postedAt: "2026-09-19", featured: true, apply: "addoz", mark: "∑", color: "blue",
    summary: "Turn raw data into clear answers that help teams decide what to do next.",
    responsibilities: ["Build and maintain recurring reports", "Clean and join data from several sources", "Answer business questions with clear charts", "Document definitions so numbers stay consistent"],
    requirements: ["Strong SQL and spreadsheet skills", "Some experience with a BI tool", "Clear explanations for non-technical teams", "Curiosity about how the business works"],
    skills: ["SQL", "Excel", "Data visualisation", "Reporting"] },
  { slug: "backend-developer", title: "Backend Developer", category: "Software Development", location: "ikeja", company: "sample-tech-employer", type: "Full-time", workplace: "Remote", level: "Senior", experience: "6-9 years", salary: { min: 700_000, max: 1_100_000, period: "month" }, postedAt: "2026-09-12", featured: false, apply: "addoz", mark: "{ }", color: "yellow",
    summary: "Design and run the services behind a growing product, with reliability and security first.",
    responsibilities: ["Design APIs and data models", "Build services that are observable and secure", "Improve performance and reliability", "Mentor developers through reviews and pairing"],
    requirements: ["Deep experience with a backend language and SQL databases", "Experience running services in production", "A security-minded approach", "Clear technical writing"],
    skills: ["APIs", "PostgreSQL", "Cloud", "Security"] },
  { slug: "registered-nurse", title: "Registered Nurse", category: "Healthcare & Medical", location: "agege", company: "sample-healthcare-employer", type: "Full-time", workplace: "On-site", level: "Middle", experience: "3-5 years", salary: { min: 180_000, max: 280_000, period: "month" }, postedAt: "2026-09-20", featured: false, apply: "addoz", mark: "+", color: "orange",
    summary: "Provide safe, compassionate care to patients in a busy outpatient setting.",
    responsibilities: ["Assess and care for patients", "Administer treatment as prescribed", "Keep patient records accurate", "Educate patients and families"],
    requirements: ["Current nursing registration", "Experience in a clinical setting", "Calm, caring manner", "Willingness to work shifts"],
    skills: ["Patient care", "Clinical records", "Communication"] },
  { slug: "pharmacy-technician", title: "Pharmacy Technician", category: "Pharmaceuticals", location: "agege", company: "sample-healthcare-employer", type: "Part-time", workplace: "On-site", level: "Junior", experience: "1-2 years", salary: { min: 90_000, max: 140_000, period: "month" }, postedAt: "2026-09-10", featured: false, apply: "addoz", mark: "Rx", color: "yellow",
    summary: "Support the pharmacy team with accurate dispensing, stock and customer care.",
    responsibilities: ["Prepare and dispense medicines under supervision", "Manage stock levels and expiry dates", "Answer customer questions at the counter", "Keep dispensing records complete"],
    requirements: ["Relevant pharmacy technician training", "Careful attention to detail", "Friendly customer manner", "Part-time availability, including weekends"],
    skills: ["Dispensing", "Stock control", "Customer care"] },
  { slug: "graduate-trainee", title: "Graduate Trainee", category: "Internships & Graduate Jobs", location: "victoria-island", company: "sample-finance-employer", type: "Full-time", workplace: "On-site", level: "Fresher", experience: "No experience", salary: { min: 150_000, max: 180_000, period: "month" }, postedAt: "2026-09-22", featured: true, apply: "addoz", mark: "✦", color: "orange",
    summary: "Start your career with structured rotations, mentoring and real responsibility from day one.",
    responsibilities: ["Rotate across teams to learn how the business works", "Support live projects with analysis and research", "Present what you learn at the end of each rotation", "Build your skills with a dedicated mentor"],
    requirements: ["A recent degree in any discipline", "Completed NYSC (or exemption)", "Curiosity and a willingness to learn", "Clear written and spoken English"],
    skills: ["Learning agility", "Communication", "Analysis"] },
  { slug: "front-desk-officer", title: "Front Desk Officer", category: "Administration & Office Support", location: "badagry", company: "sample-services-employer", type: "Full-time", workplace: "On-site", level: "Junior", experience: "1-2 years", salary: { min: 100_000, max: 150_000, period: "month" }, postedAt: "2026-09-15", featured: false, apply: "addoz", mark: "◇", color: "blue",
    summary: "Be the welcoming first point of contact for visitors, calls and the day's schedule.",
    responsibilities: ["Welcome visitors and manage the reception area", "Answer and route calls and emails", "Manage meeting rooms and deliveries", "Keep visitor records up to date"],
    requirements: ["A warm, professional manner", "Good organisation", "Basic computer skills", "Some front-office experience"],
    skills: ["Reception", "Scheduling", "Communication"] },
  { slug: "maintenance-engineer", title: "Maintenance Engineer", category: "Engineering", location: "ogijo", company: "sample-manufacturing-employer", type: "Full-time", workplace: "On-site", level: "Senior", experience: "10+ years", salary: { min: 450_000, max: 650_000, period: "month" }, postedAt: "2026-09-09", featured: false, apply: "addoz", mark: "⚙", color: "orange",
    summary: "Keep plant equipment reliable through planned maintenance and fast, safe repairs.",
    responsibilities: ["Plan and lead preventive maintenance", "Diagnose and fix mechanical and electrical faults", "Improve equipment reliability over time", "Supervise technicians and contractors"],
    requirements: ["An engineering degree or HND", "Extensive plant maintenance experience", "Strong safety discipline", "Leadership of technical teams"],
    skills: ["Preventive maintenance", "Diagnostics", "Safety", "Leadership"] },
  { slug: "brand-designer", title: "Brand Designer", category: "Creative & Design", location: "lekki", company: "sample-creative-studio", type: "Contract", workplace: "Hybrid", level: "Middle", experience: "3-5 years", salary: { min: 300_000, max: 450_000, period: "month" }, postedAt: "2026-09-17", featured: false, apply: "addoz", mark: "✳", color: "yellow",
    summary: "Shape brand identities and campaigns that feel unmistakably themselves.",
    responsibilities: ["Develop identities, guidelines and campaign looks", "Produce assets for digital and print", "Present ideas clearly to clients", "Keep files and guidelines organised"],
    requirements: ["A strong identity and campaign portfolio", "Mastery of typography and layout", "Experience presenting to clients", "Comfort with motion basics is a plus"],
    skills: ["Brand identity", "Typography", "Art direction"] },
  { slug: "call-centre-agent", title: "Call Centre Agent", category: "Call Centre & Customer Service", location: "ajah", company: "sample-services-employer", type: "Part-time", workplace: "On-site", level: "Fresher", experience: "No experience", salary: { min: 80_000, max: 110_000, period: "month" }, postedAt: "2026-09-21", featured: false, apply: "addoz", mark: "☎", color: "blue",
    summary: "Help callers with questions and orders — a great first step into customer service.",
    responsibilities: ["Handle inbound calls with care", "Log each call accurately", "Resolve common questions on the first call", "Escalate complex issues to the right team"],
    requirements: ["Clear, friendly phone manner", "Basic computer skills", "Patience and good listening", "Part-time availability"],
    skills: ["Phone support", "Active listening", "Data entry"] },
]

const addDays = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10)

// Job ads stay visible for 30 days (current ADDOZ employer page: "30 days visibility")
export const jobs: Job[] = seeds.map(seed => ({ ...seed, deadline: seed.deadline ?? addDays(seed.postedAt, 30), sample: true }))

export function getJob(slug: string) {
  return jobs.find(job => job.slug === slug)
}

export function categorySlugOf(job: Job) {
  return getCategoryByName(job.category)?.slug
}

export function jobsInCategory(name: string) {
  return jobs.filter(job => job.category === name)
}

export function jobsInArea(slug: string) {
  return jobs.filter(job => job.location === slug)
}

export function jobsAtCompany(slug: string) {
  return jobs.filter(job => job.company === slug)
}

export function relatedJobs(job: Job, limit = 3) {
  const score = (other: Job) => (other.category === job.category ? 3 : 0) + (other.location === job.location ? 2 : 0) + (other.level === job.level ? 1 : 0)
  return jobs
    .filter(other => other.slug !== job.slug)
    .sort((a, b) => score(b) - score(a) || b.postedAt.localeCompare(a.postedAt))
    .slice(0, limit)
}

// ── Search + filters ──────────────────────────────────────────────────────────
export type JobFilters = {
  q: string
  location: string
  category: string
  types: JobType[]
  levels: CareerLevel[]
  experience: Experience[]
  salary: string
  remote: boolean
  sort: SortId
}

export const emptyFilters: JobFilters = { q: "", location: "", category: "", types: [], levels: [], experience: [], salary: "", remote: false, sort: "featured" }

const salaryTop = (job: Job) => job.salary?.max ?? job.salary?.min ?? 0
const salaryBottom = (job: Job) => job.salary?.min ?? job.salary?.max ?? 0

export function filterJobs(list: Job[], filters: JobFilters) {
  const q = filters.q.trim().toLowerCase()
  const band = salaryBands.find(item => item.id === filters.salary)
  const result = list.filter(job => {
    if (q && !`${job.title} ${job.category} ${job.skills.join(" ")} ${job.summary}`.toLowerCase().includes(q)) return false
    if (filters.location && job.location !== filters.location) return false
    if (filters.category && job.category !== filters.category) return false
    if (filters.types.length && !filters.types.includes(job.type)) return false
    if (filters.levels.length && !filters.levels.includes(job.level)) return false
    if (filters.experience.length && !filters.experience.includes(job.experience)) return false
    if (filters.remote && job.workplace !== "Remote") return false
    if (band && (salaryTop(job) < band.min || salaryBottom(job) > band.max)) return false
    return true
  })
  const sorted = [...result]
  if (filters.sort === "newest") sorted.sort((a, b) => b.postedAt.localeCompare(a.postedAt))
  else if (filters.sort === "oldest") sorted.sort((a, b) => a.postedAt.localeCompare(b.postedAt))
  else if (filters.sort === "salary") sorted.sort((a, b) => salaryTop(b) - salaryTop(a))
  else sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || b.postedAt.localeCompare(a.postedAt))
  return sorted
}

export function countActiveFilters(filters: JobFilters) {
  return (filters.location ? 1 : 0) + (filters.category ? 1 : 0) + filters.types.length + filters.levels.length + filters.experience.length + (filters.salary ? 1 : 0) + (filters.remote ? 1 : 0)
}
