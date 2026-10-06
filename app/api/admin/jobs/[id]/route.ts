import { eq, inArray, isNotNull, and } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/lib/db"
import { company, conversation, job, jobApplication, savedJob } from "@/lib/db/schema"
import { AdminAuthError, recordAdminAction, requireAdmin } from "@/features/admin/queries"
import { companyEmployerUserIds, notify } from "@/lib/notify"
import { deleteResumeFromStorage } from "@/lib/storage/r2"

function failure(error: unknown, fallback: string) {
  if (error instanceof AdminAuthError) return Response.json({ error: "Admin authentication required." }, { status: 401 })
  console.error("[admin] job action failed", error)
  return Response.json({ error: fallback }, { status: 500 })
}

const actionSchema = z.object({
  action: z.enum(["approve", "decline", "pause", "archive", "restore"]),
  note: z.string().trim().max(500).optional(),
})

/** Moderate a job: approve (goes live), decline (with a reason for the employer), pause, archive, restore. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request.headers)
    const id = (await context.params).id
    const parsed = actionSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return Response.json({ error: "Choose a moderation action." }, { status: 400 })
    const { action, note } = parsed.data
    if (action === "decline" && !note) return Response.json({ error: "Add a short reason so the employer knows what to fix." }, { status: 400 })

    const [current] = await db.select({ id: job.id, title: job.title, status: job.status, companyId: job.companyId, approvedAt: job.approvedAt, companyName: company.name })
      .from(job).innerJoin(company, eq(job.companyId, company.id)).where(eq(job.id, id)).limit(1)
    if (!current) return Response.json({ error: "Job not found." }, { status: 404 })

    const now = new Date()
    const changes = action === "approve" ? { status: "Active", approvedAt: now, moderationNote: null, postedAt: now }
      : action === "decline" ? { status: "Declined", moderationNote: note! }
      : action === "pause" ? { status: "Paused" }
      : action === "archive" ? { status: "Archived" }
      : { status: current.approvedAt ? "Active" : "Pending" } // restore
    await db.update(job).set({ ...changes, updatedAt: now }).where(eq(job.id, id))
    await recordAdminAction(request.headers, `job.${action}`, "job", id, note ? { note } : undefined)

    if (action === "approve" || action === "decline") {
      await notify({
        userIds: await companyEmployerUserIds(current.companyId),
        kind: "account",
        title: action === "approve" ? `Approved: ${current.title}` : `Changes needed: ${current.title}`,
        body: action === "approve"
          ? `${current.title} has been approved and is now live on ADDOZ.`
          : `${current.title} wasn't approved yet. Reason: ${note}. Edit the job and publish it again for review.`,
        href: action === "approve" ? "/employer/jobs" : `/employer/jobs/${id}/edit`,
        email: { subject: action === "approve" ? `Your job is live — ${current.title}` : `Your job needs changes — ${current.title}`, actionLabel: action === "approve" ? "View your jobs" : "Edit the job" },
      })
    }
    return Response.json({ ok: true, status: changes.status })
  } catch (error) { return failure(error, "Unable to moderate job.") }
}

/** Permanently delete a job with its applications, CV copies, saves and conversations (requires { confirm: "DELETE" }). */
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request.headers)
    const id = (await context.params).id
    const body = await request.json().catch(() => null) as { confirm?: string } | null
    if (body?.confirm !== "DELETE") return Response.json({ error: "Type DELETE to confirm." }, { status: 400 })
    const [current] = await db.select({ id: job.id, title: job.title }).from(job).where(eq(job.id, id)).limit(1)
    if (!current) return Response.json({ error: "Job not found." }, { status: 404 })
    const applications = await db.select({ id: jobApplication.id, key: jobApplication.cvStorageKey }).from(jobApplication).where(and(eq(jobApplication.jobId, id), isNotNull(jobApplication.id)))
    if (applications.length) await db.delete(conversation).where(inArray(conversation.applicationId, applications.map(row => row.id)))
    await db.delete(jobApplication).where(eq(jobApplication.jobId, id))
    await db.delete(savedJob).where(eq(savedJob.jobId, id))
    await db.delete(job).where(eq(job.id, id))
    await Promise.allSettled(applications.map(row => row.key).filter((key): key is string => Boolean(key)).map(key => deleteResumeFromStorage(key)))
    await recordAdminAction(request.headers, "job.deleted", "job", id, { title: current.title, applications: applications.length })
    return Response.json({ ok: true })
  } catch (error) { return failure(error, "Unable to delete job.") }
}
