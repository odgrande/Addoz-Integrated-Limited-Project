import "server-only"

import { and, desc, eq, ilike } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { candidateProfile, category, company, job, jobAlert, jobApplication, location, notification, resume, savedJob, user } from "@/lib/db/schema"
import { liveJob } from "@/features/jobs/live"

export class CandidateAuthError extends Error {
  constructor() {
    super("Candidate authentication required")
    this.name = "CandidateAuthError"
  }
}

export async function requireCandidate(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  if (!session?.user || session.user.role !== "candidate") throw new CandidateAuthError()

  let [profile] = await db.select().from(candidateProfile).where(eq(candidateProfile.userId, session.user.id)).limit(1)
  if (!profile) {
    [profile] = await db.insert(candidateProfile).values({ userId: session.user.id }).returning()
  }
  if (!profile) throw new CandidateAuthError()

  return { session, profile }
}

export async function getCandidateOverview(headers: Headers) {
  const { session, profile } = await requireCandidate(headers)
  const [account] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1)
  const [profileWithLocation] = await db.select({
    profile: candidateProfile,
    locationName: location.name,
    locationSlug: location.slug,
  }).from(candidateProfile)
    .leftJoin(location, eq(candidateProfile.locationId, location.id))
    .where(eq(candidateProfile.id, profile.id)).limit(1)

  const [resumeRecord] = await db.select().from(resume).where(eq(resume.candidateId, profile.id)).orderBy(desc(resume.uploadedAt)).limit(1)
  const alerts = await db.select({ id: jobAlert.id }).from(jobAlert).where(eq(jobAlert.candidateId, profile.id))
  const applications = await db.select({
    id: jobApplication.id,
    stage: jobApplication.stage,
    appliedAt: jobApplication.appliedAt,
    title: job.title,
    slug: job.slug,
    companyName: company.name,
  }).from(jobApplication)
    .innerJoin(job, eq(jobApplication.jobId, job.id))
    .innerJoin(company, eq(job.companyId, company.id))
    .where(eq(jobApplication.candidateId, profile.id))
    .orderBy(desc(jobApplication.appliedAt))
    .limit(5)

  const saved = await db.select({
    jobId: savedJob.jobId,
    savedAt: savedJob.savedAt,
    title: job.title,
    slug: job.slug,
    companyName: company.name,
    workplace: job.workplace,
    locationName: location.name,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
  }).from(savedJob)
    .innerJoin(job, eq(savedJob.jobId, job.id))
    .innerJoin(company, eq(job.companyId, company.id))
    .leftJoin(location, eq(job.locationId, location.id))
    .where(eq(savedJob.candidateId, profile.id))
    .orderBy(desc(savedJob.savedAt))
    .limit(5)

  const recommendations = await db.select({
    id: job.id,
    title: job.title,
    slug: job.slug,
    companyName: company.name,
    workplace: job.workplace,
    locationName: location.name,
    categoryName: category.name,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
  }).from(job)
    .innerJoin(company, eq(job.companyId, company.id))
    .leftJoin(location, eq(job.locationId, location.id))
    .leftJoin(category, eq(job.categoryId, category.id))
    .where(liveJob())
    .orderBy(desc(job.featured), desc(job.postedAt))
    .limit(4)

  const notifications = await db.select().from(notification)
    .where(eq(notification.userId, session.user.id))
    .orderBy(desc(notification.createdAt))
    .limit(4)

  const checklist = [
    Boolean(account?.name),
    Boolean(profileWithLocation?.profile.headline),
    Boolean(profileWithLocation?.profile.experience),
    Boolean(profileWithLocation?.profile.locationId),
    Boolean(resumeRecord),
    alerts.length > 0,
  ]
  const completion = Math.round((checklist.filter(Boolean).length / checklist.length) * 100)

  return {
    user: account ?? session.user,
    profile: profileWithLocation?.profile ?? profile,
    locationName: profileWithLocation?.locationName ?? null,
    resume: resumeRecord ?? null,
    completion,
    applications,
    saved,
    recommendations,
    alertsCount: alerts.length,
    notifications,
  }
}

export async function getCandidateProfile(headers: Headers) {
  const { session, profile } = await requireCandidate(headers)
  const [account] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1)
  const [record] = await db.select({ profile: candidateProfile, locationName: location.name }).from(candidateProfile)
    .leftJoin(location, eq(candidateProfile.locationId, location.id))
    .where(eq(candidateProfile.id, profile.id)).limit(1)
  const locations = await db.select().from(location).orderBy(location.name)
  return { user: account ?? session.user, profile: record?.profile ?? profile, locationName: record?.locationName ?? null, locations }
}

export async function getCandidateResume(headers: Headers) {
  const { profile } = await requireCandidate(headers)
  const [record] = await db.select().from(resume).where(eq(resume.candidateId, profile.id)).orderBy(desc(resume.uploadedAt)).limit(1)
  return record ?? null
}

export async function getCandidateApplications(headers: Headers) {
  const { profile } = await requireCandidate(headers)
  return db.select({
    id: jobApplication.id,
    stage: jobApplication.stage,
    appliedAt: jobApplication.appliedAt,
    title: job.title,
    slug: job.slug,
    companyName: company.name,
    locationName: location.name,
  }).from(jobApplication)
    .innerJoin(job, eq(jobApplication.jobId, job.id))
    .innerJoin(company, eq(job.companyId, company.id))
    .leftJoin(location, eq(job.locationId, location.id))
    .where(eq(jobApplication.candidateId, profile.id))
    .orderBy(desc(jobApplication.appliedAt))
}

export async function getCandidateSavedJobs(headers: Headers) {
  const { profile } = await requireCandidate(headers)
  return db.select({
    jobId: savedJob.jobId,
    savedAt: savedJob.savedAt,
    title: job.title,
    slug: job.slug,
    companyName: company.name,
    workplace: job.workplace,
    locationName: location.name,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
  }).from(savedJob)
    .innerJoin(job, eq(savedJob.jobId, job.id))
    .innerJoin(company, eq(job.companyId, company.id))
    .leftJoin(location, eq(job.locationId, location.id))
    .where(eq(savedJob.candidateId, profile.id))
    .orderBy(desc(savedJob.savedAt))
}

export async function getCandidateAlerts(headers: Headers) {
  const { profile } = await requireCandidate(headers)
  return db.select({
    id: jobAlert.id,
    name: jobAlert.name,
    keywords: jobAlert.keywords,
    workplace: jobAlert.workplace,
    frequency: jobAlert.frequency,
    active: jobAlert.active,
    categoryName: category.name,
    locationName: location.name,
  }).from(jobAlert)
    .leftJoin(category, eq(jobAlert.categoryId, category.id))
    .leftJoin(location, eq(jobAlert.locationId, location.id))
    .where(eq(jobAlert.candidateId, profile.id))
    .orderBy(desc(jobAlert.createdAt))
}

export async function getCandidateNotifications(headers: Headers) {
  const { session } = await requireCandidate(headers)
  return db.select().from(notification).where(eq(notification.userId, session.user.id)).orderBy(desc(notification.createdAt))
}

export async function getCandidateSettings(headers: Headers) {
  const { session } = await requireCandidate(headers)
  const [account] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1)
  return account ?? session.user
}

export async function getCandidateRecommendations(headers: Headers, query?: string) {
  await requireCandidate(headers)
  return db.select({
    id: job.id,
    title: job.title,
    slug: job.slug,
    companyName: company.name,
    locationName: location.name,
    categoryName: category.name,
  }).from(job)
    .innerJoin(company, eq(job.companyId, company.id))
    .leftJoin(location, eq(job.locationId, location.id))
    .leftJoin(category, eq(job.categoryId, category.id))
    .where(query ? and(liveJob(), ilike(job.title, `%${query}%`)) : liveJob())
    .orderBy(desc(job.postedAt))
    .limit(12)
}
