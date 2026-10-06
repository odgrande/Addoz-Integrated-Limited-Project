import "server-only"

import { and, eq, sql } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { account, candidateProfile, user } from "@/lib/db/schema"

/** Whether a user can sign in with a password (i.e. is not a guest-created account). */
export async function hasPasswordLogin(userId: string) {
  const [credential] = await db.select({ id: account.id }).from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "credential"))).limit(1)
  return Boolean(credential)
}

async function ensureCandidateProfile(userId: string) {
  await db.insert(candidateProfile).values({ userId }).onConflictDoNothing()
  const [profile] = await db.select({ id: candidateProfile.id }).from(candidateProfile).where(eq(candidateProfile.userId, userId)).limit(1)
  if (!profile) throw new Error("Candidate profile could not be created")
  return profile
}

export type GuestCandidate =
  | { ok: true; userId: string; candidateId: string; created: boolean }
  | { ok: false; reason: "SIGN_IN_REQUIRED" | "NOT_A_CANDIDATE" }

/**
 * Resolve the candidate account behind a guest application.
 *
 * A guest application silently creates a passwordless candidate account for
 * the email, so the application has an owner from day one. The account cannot
 * be signed into until its owner sets a password through an emailed link —
 * knowing an email address is never enough to take an account over.
 *
 * - Unknown email → new passwordless candidate account.
 * - Email of an earlier guest (passwordless candidate) → same account.
 * - Email of a candidate who has a password → must sign in instead.
 * - Email of an employer or admin → cannot apply as a guest.
 */
export async function resolveGuestCandidate(email: string, name: string): Promise<GuestCandidate> {
  const normalized = email.trim().toLowerCase()
  const [existing] = await db.select({ id: user.id, role: user.role }).from(user).where(eq(sql`lower(${user.email})`, normalized)).limit(1)

  if (existing) {
    if (existing.role !== "candidate") return { ok: false, reason: "NOT_A_CANDIDATE" }
    if (await hasPasswordLogin(existing.id)) return { ok: false, reason: "SIGN_IN_REQUIRED" }
    const profile = await ensureCandidateProfile(existing.id)
    return { ok: true, userId: existing.id, candidateId: profile.id, created: false }
  }

  const context = await auth.$context
  try {
    const created = await context.internalAdapter.createUser({ email: normalized, name, emailVerified: false, role: "candidate" }, { method: "guest-application" })
    const profile = await ensureCandidateProfile(created.id)
    return { ok: true, userId: created.id, candidateId: profile.id, created: true }
  } catch (error) {
    // Two submissions for a brand-new email at once: the other one created it.
    const [raced] = await db.select({ id: user.id, role: user.role }).from(user).where(eq(sql`lower(${user.email})`, normalized)).limit(1)
    if (!raced) throw error
    if (raced.role !== "candidate") return { ok: false, reason: "NOT_A_CANDIDATE" }
    const profile = await ensureCandidateProfile(raced.id)
    return { ok: true, userId: raced.id, candidateId: profile.id, created: false }
  }
}
