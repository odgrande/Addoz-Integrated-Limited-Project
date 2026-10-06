import { and, eq, inArray } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/lib/db"
import { candidateProfile, company, job, jobApplication } from "@/lib/db/schema"
import { GUEST_ACCOUNT_FOOTER, notify } from "@/lib/notify"
import { EmployerAuthError, EmployerOwnershipError, requireEmployer } from "@/features/employers/queries"
import { employerStages } from "@/features/employers/stages"

const bulkSchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(1000), stage: z.enum(employerStages) })

// Emails go out for moves a candidate needs to act on; every move gets an in-app notification.
// Keeps a bulk "Not selected" for hundreds of applicants inside the daily email allowance.
const EMAIL_STAGES = new Set(["Shortlisted", "Interview", "Offer", "Hired"])

/** Move many applications (the employer's own) to one stage — e.g. shortlist every top match. */
export async function PATCH(request: Request) {
  try {
    const { profile } = await requireEmployer(request.headers)
    if (!profile.companyId) throw new EmployerOwnershipError()
    const parsed = bulkSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return Response.json({ error: "Choose applicants and a valid stage." }, { status: 400 })
    const { ids, stage } = parsed.data

    const owned = await db.select({ id: jobApplication.id, stage: jobApplication.stage, userId: candidateProfile.userId, title: job.title, companyName: company.name })
      .from(jobApplication).innerJoin(job, eq(jobApplication.jobId, job.id)).innerJoin(company, eq(job.companyId, company.id))
      .leftJoin(candidateProfile, eq(jobApplication.candidateId, candidateProfile.id))
      .where(and(inArray(jobApplication.id, ids), eq(job.companyId, profile.companyId)))
    const changing = owned.filter(row => row.stage !== stage)
    if (changing.length) await db.update(jobApplication).set({ stage }).where(inArray(jobApplication.id, changing.map(row => row.id)))

    if (stage !== "Applied") {
      const results = await Promise.allSettled(changing.filter(row => row.userId).map(row => notify({
        userIds: [row.userId!],
        kind: "application",
        title: `Application update: ${row.title}`,
        body: `Your application for ${row.title} at ${row.companyName} is now "${stage}".`,
        href: "/candidate/applications",
        email: EMAIL_STAGES.has(stage) ? { subject: `Update on your application — ${row.title}`, actionLabel: "View your applications", footer: GUEST_ACCOUNT_FOOTER } : undefined,
      })))
      const failed = results.filter(result => result.status === "rejected").length
      if (failed) console.error(`[employer] ${failed} bulk stage notifications failed`)
    }
    return Response.json({ ok: true, updated: changing.length, stage })
  } catch (error) {
    if (error instanceof EmployerAuthError) return Response.json({ error: "Authentication required." }, { status: 401 })
    if (error instanceof EmployerOwnershipError) return Response.json({ error: "You do not own these applications." }, { status: 404 })
    console.error("[employer] bulk stage update failed", error)
    return Response.json({ error: "Unable to update these applicants." }, { status: 500 })
  }
}
