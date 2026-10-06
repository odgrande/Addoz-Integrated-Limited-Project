import "server-only"

import { and, eq, inArray, isNotNull, ne } from "drizzle-orm"
import { db } from "@/lib/db"
import { account, candidateProfile, company, conversation, employerProfile, job, jobAlert, jobApplication, notification, resume, savedJob, session, user } from "@/lib/db/schema"
import { deleteResumeFromStorage } from "@/lib/storage/r2"

export class ModerationError extends Error {}

/** Suspend (sign-in blocked, every session ended) or reactivate an account. */
export async function setUserSuspended(userId: string, suspended: boolean, reason?: string) {
  const [target] = await db.select({ id: user.id, role: user.role }).from(user).where(eq(user.id, userId)).limit(1)
  if (!target) throw new ModerationError("User not found.")
  if (target.role === "admin") throw new ModerationError("Admin accounts can't be suspended here.")
  await db.update(user).set({ banned: suspended, banReason: suspended ? (reason?.trim() || "Suspended by ADDOZ") : null, updatedAt: new Date() }).where(eq(user.id, userId))
  if (suspended) await db.delete(session).where(eq(session.userId, userId))
}

/**
 * Permanently delete a candidate or employer account and everything that only
 * they own: profile, applications and their CVs, saved jobs, alerts,
 * notifications, conversations and sessions. For an employer who is the last
 * account on their company, the company is hidden and its jobs archived (other
 * candidates' applications to those jobs are kept for the record).
 */
export async function deleteUserCompletely(userId: string) {
  const [target] = await db.select({ id: user.id, role: user.role, email: user.email }).from(user).where(eq(user.id, userId)).limit(1)
  if (!target) throw new ModerationError("User not found.")
  if (target.role === "admin") throw new ModerationError("Admin accounts can't be deleted here.")

  const files: string[] = []
  const [candidate] = await db.select({ id: candidateProfile.id }).from(candidateProfile).where(eq(candidateProfile.userId, userId)).limit(1)
  if (candidate) {
    const applications = await db.select({ id: jobApplication.id, key: jobApplication.cvStorageKey }).from(jobApplication).where(eq(jobApplication.candidateId, candidate.id))
    const resumes = await db.select({ key: resume.storageKey }).from(resume).where(and(eq(resume.candidateId, candidate.id), isNotNull(resume.storageKey)))
    files.push(...applications.map(row => row.key).filter((key): key is string => Boolean(key)), ...resumes.map(row => row.key!))
    if (applications.length) await db.delete(conversation).where(inArray(conversation.applicationId, applications.map(row => row.id)))
    await db.delete(jobApplication).where(eq(jobApplication.candidateId, candidate.id))
    await db.delete(savedJob).where(eq(savedJob.candidateId, candidate.id))
    await db.delete(jobAlert).where(eq(jobAlert.candidateId, candidate.id))
    await db.delete(resume).where(eq(resume.candidateId, candidate.id))
    await db.delete(candidateProfile).where(eq(candidateProfile.id, candidate.id))
  }

  const [employer] = await db.select({ id: employerProfile.id, companyId: employerProfile.companyId }).from(employerProfile).where(eq(employerProfile.userId, userId)).limit(1)
  if (employer) {
    await db.delete(employerProfile).where(eq(employerProfile.id, employer.id))
    if (employer.companyId) {
      const [colleague] = await db.select({ id: employerProfile.id }).from(employerProfile).where(and(eq(employerProfile.companyId, employer.companyId), ne(employerProfile.id, employer.id))).limit(1)
      if (!colleague) {
        await db.update(company).set({ active: false, updatedAt: new Date() }).where(eq(company.id, employer.companyId))
        await db.update(job).set({ status: "Archived", updatedAt: new Date() }).where(eq(job.companyId, employer.companyId))
      }
    }
  }

  // Support threads, messages and read markers cascade with the user row
  await db.delete(conversation).where(eq(conversation.userId, userId))
  await db.delete(notification).where(eq(notification.userId, userId))
  await db.delete(session).where(eq(session.userId, userId))
  await db.delete(account).where(eq(account.userId, userId))
  await db.delete(user).where(eq(user.id, userId))

  await Promise.allSettled(files.map(key => deleteResumeFromStorage(key)))
  return { email: target.email, role: target.role }
}
