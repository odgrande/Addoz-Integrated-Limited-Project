import "server-only"

import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { category, candidateProfile, company, job, jobApplication, location, notification, savedApplicant, user, employerProfile } from "@/lib/db/schema"

import { employerStages } from "@/features/employers/stages"
import { scoreApplicant } from "@/features/applications/matching"

export class EmployerAuthError extends Error {
  constructor() {
    super("Employer authentication required")
    this.name = "EmployerAuthError"
  }
}

export class EmployerOwnershipError extends Error {
  constructor() {
    super("Employer ownership required")
    this.name = "EmployerOwnershipError"
  }
}

export async function requireEmployer(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  if (!session?.user || session.user.role !== "employer") throw new EmployerAuthError()
  const [profile] = await db.select().from(employerProfile).where(eq(employerProfile.userId, session.user.id)).limit(1)
  if (!profile) throw new EmployerOwnershipError()
  return { session, profile }
}

export async function getEmployerContext(headers: Headers) {
  const { session, profile } = await requireEmployer(headers)
  const [account] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1)
  const [companyRecord] = profile.companyId ? await db.select({
    company,
    locationName: location.name,
  }).from(company).leftJoin(location, eq(company.locationId, location.id)).where(eq(company.id, profile.companyId)).limit(1) : []
  return { session, profile, user: account ?? session.user, company: companyRecord?.company ?? null, locationName: companyRecord?.locationName ?? null }
}

export async function getEmployerJobs(headers: Headers, search = "") {
  const { profile } = await requireEmployer(headers)
  if (!profile.companyId) return []
  const base = db.select({
    id: job.id,
    slug: job.slug,
    title: job.title,
    status: job.status,
    moderationNote: job.moderationNote,
    type: job.type,
    workplace: job.workplace,
    deadline: job.deadline,
    postedAt: job.postedAt,
    createdAt: job.createdAt,
    locationName: location.name,
    applicantCount: count(jobApplication.id),
  }).from(job)
    .leftJoin(location, eq(job.locationId, location.id))
    .leftJoin(jobApplication, eq(job.id, jobApplication.jobId))
    .where(search ? and(eq(job.companyId, profile.companyId), ilike(job.title, `%${search}%`)) : eq(job.companyId, profile.companyId))
    .groupBy(job.id, location.name)
    .orderBy(desc(job.createdAt))
  return base
}

export async function getEmployerJob(headers: Headers, id: string) {
  const { profile } = await requireEmployer(headers)
  if (!profile.companyId) throw new EmployerOwnershipError()
  const [record] = await db.select({ job, locationName: location.name, categoryName: category.name })
    .from(job).leftJoin(location, eq(job.locationId, location.id)).leftJoin(category, eq(job.categoryId, category.id))
    .where(and(eq(job.id, id), eq(job.companyId, profile.companyId))).limit(1)
  if (!record) throw new EmployerOwnershipError()
  return record
}

function cvTextOf(snapshot: string | null) {
  try { return snapshot ? String((JSON.parse(snapshot) as { cvText?: unknown }).cvText ?? "") : "" } catch { return "" }
}

/** Applicants for the employer's company (optionally one job), each with a match score for its job. */
export async function getEmployerApplicants(headers: Headers, jobId?: string, search = "", stage?: string, applicationIds?: string[]) {
  const { profile } = await requireEmployer(headers)
  if (!profile.companyId) return []
  const filters = [eq(job.companyId, profile.companyId)]
  if (jobId) filters.push(eq(job.id, jobId))
  if (stage) filters.push(eq(jobApplication.stage, stage))
  if (applicationIds) {
    if (!applicationIds.length) return []
    filters.push(inArray(jobApplication.id, applicationIds))
  }
  if (search) filters.push(or(ilike(sql`COALESCE(${user.name}, ${jobApplication.guestName})`, `%${search}%`), ilike(job.title, `%${search}%`), ilike(jobApplication.guestEmail, `%${search}%`))!)
  const rows = await db.select({
    id: jobApplication.id,
    jobId: job.id,
    snapshot: jobApplication.candidateSnapshot,
    jobSkills: job.skills,
    jobRequirements: job.requirements,
    jobResponsibilities: job.responsibilities,
    jobExperience: job.experience,
    jobTitle: job.title,
    candidateName: sql<string>`COALESCE(${user.name}, ${jobApplication.guestName}, 'Guest applicant')`,
    candidateEmail: sql<string>`COALESCE(${jobApplication.guestEmail}, ${user.email})`,
    candidatePhone: jobApplication.guestPhone,
    headline: candidateProfile.headline,
    experience: candidateProfile.experience,
    locationName: location.name,
    stage: jobApplication.stage,
    appliedAt: jobApplication.appliedAt,
    coverLetter: jobApplication.coverLetter,
    // Each application keeps its own CV copy; it is served by an ownership-checked route
    resumeFileName: jobApplication.cvFileName,
    resumeFileSize: jobApplication.cvFileSize,
    resumeUrl: sql<string | null>`CASE WHEN ${jobApplication.cvStorageKey} IS NOT NULL THEN '/api/employer/applications/' || ${jobApplication.id} || '/cv' END`,
  }).from(jobApplication)
    .innerJoin(job, eq(jobApplication.jobId, job.id))
    .leftJoin(candidateProfile, eq(jobApplication.candidateId, candidateProfile.id))
    .leftJoin(user, eq(candidateProfile.userId, user.id))
    .leftJoin(location, eq(candidateProfile.locationId, location.id))
    .where(and(...filters))
    .orderBy(desc(jobApplication.appliedAt))
  return rows.map(({ snapshot, jobSkills, jobRequirements, jobResponsibilities, jobExperience, ...row }) => ({
    ...row,
    match: scoreApplicant(
      { title: row.jobTitle, skills: jobSkills, requirements: jobRequirements, responsibilities: jobResponsibilities, experience: jobExperience },
      { cvText: cvTextOf(snapshot), coverLetter: row.coverLetter, headline: row.headline, experience: row.experience },
    ),
  }))
}

/** One applicant of the employer's company (throws EmployerOwnershipError otherwise). */
export async function getEmployerApplicant(headers: Headers, applicationId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(applicationId)) throw new EmployerOwnershipError()
  const [applicant] = await getEmployerApplicants(headers, undefined, "", undefined, [applicationId])
  if (!applicant) throw new EmployerOwnershipError()
  return applicant
}

/** Postgres "relation does not exist" — a table added in an update that hasn't been migrated yet. */
export function isMissingTable(error: unknown) {
  const candidate = error as { code?: string; cause?: { code?: string } } | null
  return candidate?.code === "42P01" || candidate?.cause?.code === "42P01"
}

/** Application ids this employer saved; empty (not an error) until the table exists. */
export async function getSavedApplicationIds(headers: Headers) {
  const { session } = await requireEmployer(headers)
  try {
    const rows = await db.select({ id: savedApplicant.applicationId }).from(savedApplicant).where(eq(savedApplicant.employerUserId, session.user.id)).orderBy(desc(savedApplicant.savedAt))
    return rows.map(row => row.id)
  } catch (error) {
    if (isMissingTable(error)) return null
    throw error
  }
}

export async function getEmployerAnalytics(headers: Headers) {
  const { profile } = await requireEmployer(headers)
  if (!profile.companyId) return { activeJobs: 0, totalJobs: 0, totalApplicants: 0, byJob: [], byStage: [], recent: [] }
  const [jobCounts] = await db.select({ activeJobs: sql<number>`count(*) filter (where ${job.status} = 'Active' and (${job.deadline} is null or ${job.deadline} > now()))`, totalJobs: count(job.id) }).from(job).where(eq(job.companyId, profile.companyId))
  const [applicantCounts] = await db.select({ totalApplicants: count(jobApplication.id) }).from(jobApplication).innerJoin(job, eq(jobApplication.jobId, job.id)).where(eq(job.companyId, profile.companyId))
  const byJob = await db.select({ title: job.title, applicants: count(jobApplication.id) }).from(job).leftJoin(jobApplication, eq(job.id, jobApplication.jobId)).where(eq(job.companyId, profile.companyId)).groupBy(job.id, job.title).orderBy(desc(count(jobApplication.id)))
  const byStage = await db.select({ stage: jobApplication.stage, applicants: count(jobApplication.id) }).from(jobApplication).innerJoin(job, eq(jobApplication.jobId, job.id)).where(eq(job.companyId, profile.companyId)).groupBy(jobApplication.stage).orderBy(desc(count(jobApplication.id)))
  const recent = await getEmployerApplicants(headers)
  return { activeJobs: Number(jobCounts?.activeJobs ?? 0), totalJobs: Number(jobCounts?.totalJobs ?? 0), totalApplicants: Number(applicantCounts?.totalApplicants ?? 0), byJob, byStage, recent: recent.slice(0, 8) }
}

export async function getEmployerNotifications(headers: Headers) {
  const { session } = await requireEmployer(headers)
  return db.select().from(notification).where(eq(notification.userId, session.user.id)).orderBy(desc(notification.createdAt))
}

export async function getEmployerProfile(headers: Headers) {
  const { session, profile } = await requireEmployer(headers)
  const [account] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1)
  return { account: account ?? session.user, profile }
}

export async function getEmployerTaxonomy(headers: Headers) {
  await requireEmployer(headers)
  const [categories, locations] = await Promise.all([db.select().from(category).orderBy(category.name), db.select().from(location).orderBy(location.name)])
  return { categories, locations }
}
