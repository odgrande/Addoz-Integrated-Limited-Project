import "server-only"

import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { auditLog, candidateProfile, category, company, employerProfile, job, jobApplication, location, notification, resume, user } from "@/lib/db/schema"
import { liveJob } from "@/features/jobs/live"

export class AdminAuthError extends Error { constructor() { super("Admin authentication required"); this.name = "AdminAuthError" } }
export class AdminOwnershipError extends Error { constructor() { super("Admin access denied"); this.name = "AdminOwnershipError" } }

export async function requireAdmin(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  if (!session?.user || session.user.role !== "admin") throw new AdminAuthError()
  return session
}

export async function recordAdminAction(headers: Headers, action: string, entityType: string, entityId?: string, metadata?: Record<string, unknown>) {
  const session = await requireAdmin(headers)
  await db.insert(auditLog).values({ actorUserId: session.user.id, action, entityType, entityId: entityId ?? null, metadata: metadata ? JSON.stringify(metadata) : null })
}

export async function getAdminDashboard(headers: Headers) {
  await requireAdmin(headers)
  const [[users], [candidates], [employers], [activeJobs], [applications], [companies], recent] = await Promise.all([
    db.select({ value: count(user.id) }).from(user),
    db.select({ value: count(user.id) }).from(user).where(eq(user.role, "candidate")),
    db.select({ value: count(user.id) }).from(user).where(eq(user.role, "employer")),
    db.select({ value: count(job.id) }).from(job).where(liveJob()),
    db.select({ value: count(jobApplication.id) }).from(jobApplication),
    db.select({ value: count(company.id) }).from(company),
    db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(8),
  ])
  return { users: Number(users?.value ?? 0), candidates: Number(candidates?.value ?? 0), employers: Number(employers?.value ?? 0), activeJobs: Number(activeJobs?.value ?? 0), applications: Number(applications?.value ?? 0), companies: Number(companies?.value ?? 0), pendingModeration: recent.filter(item => item.action.includes("pending")).length, recent }
}

export async function getAdminJobs(headers: Headers, filters: { q?: string; status?: string; categoryId?: string; locationId?: string } = {}) {
  await requireAdmin(headers)
  const where = []
  if (filters.q) where.push(or(ilike(job.title, `%${filters.q}%`), ilike(company.name, `%${filters.q}%`))!)
  if (filters.status) where.push(eq(job.status, filters.status))
  if (filters.categoryId) where.push(eq(job.categoryId, filters.categoryId))
  if (filters.locationId) where.push(eq(job.locationId, filters.locationId))
  return db.select({ id: job.id, title: job.title, status: job.status, deadline: job.deadline, slug: job.slug, type: job.type, workplace: job.workplace, createdAt: job.createdAt, companyName: company.name, companyId: company.id, companyIndustry: company.industry, companyLocationId: company.locationId, companySize: company.companySize, companyDescription: company.description, categoryName: category.name, locationName: location.name, applicants: count(jobApplication.id) }).from(job).innerJoin(company, eq(job.companyId, company.id)).innerJoin(category, eq(job.categoryId, category.id)).innerJoin(location, eq(job.locationId, location.id)).leftJoin(jobApplication, eq(job.id, jobApplication.jobId)).where(where.length ? and(...where) : undefined).groupBy(job.id, company.id, category.name, location.name).orderBy(desc(job.createdAt))
}

export async function getAdminApplications(headers: Headers, filters: { q?: string; stage?: string } = {}) {
  await requireAdmin(headers)
  const where = []
  if (filters.q) where.push(or(ilike(sql`COALESCE(${user.name}, ${jobApplication.guestName})`, `%${filters.q}%`), ilike(job.title, `%${filters.q}%`), ilike(company.name, `%${filters.q}%`), ilike(sql`COALESCE(${user.email}, ${jobApplication.guestEmail})`, `%${filters.q}%`))!)
  if (filters.stage) where.push(eq(jobApplication.stage, filters.stage))
  return db.select({ id: jobApplication.id, candidateName: sql<string>`COALESCE(${user.name}, ${jobApplication.guestName}, 'Guest applicant')`, candidateEmail: sql<string>`COALESCE(${user.email}, ${jobApplication.guestEmail})`, jobTitle: job.title, employerName: company.name, stage: jobApplication.stage, appliedAt: jobApplication.appliedAt }).from(jobApplication).leftJoin(candidateProfile, eq(jobApplication.candidateId, candidateProfile.id)).leftJoin(user, eq(candidateProfile.userId, user.id)).innerJoin(job, eq(jobApplication.jobId, job.id)).innerJoin(company, eq(job.companyId, company.id)).where(where.length ? and(...where) : undefined).orderBy(desc(jobApplication.appliedAt))
}

export async function getAdminUsers(headers: Headers, q = "", role = "") {
  await requireAdmin(headers)
  const where = []
  if (q) where.push(or(ilike(user.name, `%${q}%`), ilike(user.email, `%${q}%`))!)
  if (role) where.push(eq(user.role, role as "candidate" | "employer" | "admin"))
  return db.select().from(user).where(where.length ? and(...where) : undefined).orderBy(desc(user.createdAt))
}

export async function getAdminCandidates(headers: Headers) {
  await requireAdmin(headers)
  return db.select({ id: candidateProfile.id, userId: user.id, name: user.name, email: user.email, headline: candidateProfile.headline, locationName: location.name, resumeName: resume.fileName, applications: count(jobApplication.id), banned: user.banned, createdAt: user.createdAt }).from(candidateProfile).innerJoin(user, eq(candidateProfile.userId, user.id)).leftJoin(location, eq(candidateProfile.locationId, location.id)).leftJoin(resume, eq(candidateProfile.id, resume.candidateId)).leftJoin(jobApplication, eq(candidateProfile.id, jobApplication.candidateId)).groupBy(candidateProfile.id, user.id, location.name, resume.fileName).orderBy(desc(user.createdAt))
}

export async function getAdminEmployers(headers: Headers) {
  await requireAdmin(headers)
  return db.select({ id: employerProfile.id, userId: user.id, name: user.name, email: user.email, companyName: company.name, companyActive: company.active, jobs: count(job.id), applicants: count(jobApplication.id), banned: user.banned, createdAt: user.createdAt }).from(employerProfile).innerJoin(user, eq(employerProfile.userId, user.id)).leftJoin(company, eq(employerProfile.companyId, company.id)).leftJoin(job, eq(company.id, job.companyId)).leftJoin(jobApplication, eq(job.id, jobApplication.jobId)).groupBy(employerProfile.id, user.id, company.name, company.active).orderBy(desc(user.createdAt))
}

export async function getAdminCompanies(headers: Headers, q = "") {
  await requireAdmin(headers)
  return db.select({ id: company.id, name: company.name, industry: company.industry, locationName: location.name, active: company.active, jobs: count(job.id), createdAt: company.createdAt }).from(company).leftJoin(location, eq(company.locationId, location.id)).leftJoin(job, eq(company.id, job.companyId)).where(q ? ilike(company.name, `%${q}%`) : undefined).groupBy(company.id, location.name).orderBy(desc(company.createdAt))
}

export async function getAdminTaxonomy(headers: Headers, type: "categories" | "locations") {
  await requireAdmin(headers)
  if (type === "categories") return db.select({ id: category.id, slug: category.slug, name: category.name, active: category.active, references: count(job.id) }).from(category).leftJoin(job, eq(category.id, job.categoryId)).groupBy(category.id).orderBy(category.name)
  return db.select({ id: location.id, slug: location.slug, name: location.name, active: location.active, references: count(job.id) }).from(location).leftJoin(job, eq(location.id, job.locationId)).groupBy(location.id).orderBy(location.name)
}

export async function getAdminNotifications(headers: Headers) {
  const session = await requireAdmin(headers)
  return db.select().from(notification).where(eq(notification.userId, session.user.id)).orderBy(desc(notification.createdAt))
}

export async function getAdminAudit(headers: Headers) { await requireAdmin(headers); return db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(100) }
