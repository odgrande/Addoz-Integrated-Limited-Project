import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { job } from "@/lib/db/schema"
import { AdminAuthError, getAdminJobs, recordAdminAction, requireAdmin } from "@/features/admin/queries"

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin(request.headers); const id = (await context.params).id; const body = await request.json().catch(() => null) as { status?: string } | null
    if (!body?.status || !["Active", "Paused", "Closed", "Archived", "Draft"].includes(body.status)) return Response.json({ error: "Choose a valid moderation status." }, { status: 400 })
    const [updated] = await db.update(job).set({ status: body.status, updatedAt: new Date(), postedAt: body.status === "Active" ? new Date() : undefined }).where(eq(job.id, id)).returning()
    if (!updated) return Response.json({ error: "Job not found." }, { status: 404 })
    await recordAdminAction(request.headers, `job.${body.status.toLowerCase()}`, "job", id, { actor: session.user.id })
    return Response.json({ ok: true })
  } catch (error) { if (error instanceof AdminAuthError) return Response.json({ error: "Admin authentication required." }, { status: 401 }); return Response.json({ error: "Unable to moderate job." }, { status: 500 }) }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(request.headers); const id = (await context.params).id; const [updated] = await db.update(job).set({ status: "Archived", updatedAt: new Date() }).where(eq(job.id, id)).returning(); if (!updated) return Response.json({ error: "Job not found." }, { status: 404 }); await recordAdminAction(request.headers, "job.archived", "job", id); return Response.json({ ok: true }) } catch (error) { if (error instanceof AdminAuthError) return Response.json({ error: "Admin authentication required." }, { status: 401 }); return Response.json({ error: "Unable to archive job." }, { status: 500 }) }
}
