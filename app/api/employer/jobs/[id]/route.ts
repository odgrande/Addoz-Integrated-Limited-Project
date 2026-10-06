import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/lib/db"
import { adminUserIds, notify } from "@/lib/notify"
import { job } from "@/lib/db/schema"
import { EmployerAuthError, EmployerOwnershipError, getEmployerApplicants, getEmployerJob, requireEmployer } from "@/features/employers/queries"

const jobUpdateSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  categoryId: z.string().min(1).optional(),
  locationId: z.string().min(1).optional(),
  type: z.string().min(1).max(40).optional(),
  level: z.string().min(1).max(40).optional(),
  experience: z.string().min(1).max(60).optional(),
  workplace: z.string().min(1).max(40).optional(),
  salaryMin: z.coerce.number().int().nonnegative().nullable().optional(),
  salaryMax: z.coerce.number().int().nonnegative().nullable().optional(),
  salaryPeriod: z.string().max(20).nullable().optional(),
  summary: z.string().trim().min(20).max(500).optional(),
  responsibilities: z.array(z.string().trim().min(1).max(300)).min(1).max(12).optional(),
  requirements: z.array(z.string().trim().min(1).max(300)).min(1).max(12).optional(),
  skills: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  deadline: z.string().nullable().optional(),
  apply: z.enum(["addoz", "email"]).optional(),
  status: z.enum(["Draft", "Active", "Paused", "Closed", "Archived"]).optional(),
})

function errorResponse(error: unknown) {
  if (error instanceof EmployerAuthError) return Response.json({ error: "Authentication required." }, { status: 401 })
  if (error instanceof EmployerOwnershipError) return Response.json({ error: "You do not own this job." }, { status: 404 })
  return null
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const record = await getEmployerJob(request.headers, (await context.params).id)
    return Response.json(record)
  } catch (error) {
    return errorResponse(error) ?? Response.json({ error: "Unable to load this job." }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const id = (await context.params).id
    const { profile } = await requireEmployer(request.headers)
    const existing = await getEmployerJob(request.headers, id)
    const body = await request.json().catch(() => null)
    const parsed = jobUpdateSchema.safeParse(body)
    if (!parsed.success) return Response.json({ error: "Enter valid job details.", fields: parsed.error.flatten().fieldErrors }, { status: 400 })
    const data = parsed.data
    // Publishing a job ADDOZ hasn't approved yet (new or declined) sends it for review;
    // approved jobs can be paused and re-published freely.
    const status = data.status === "Active" && !existing.job.approvedAt ? "Pending" : data.status
    const goingLive = status === "Active" && existing.job.status !== "Active"
    await db.update(job).set({ ...data, status, moderationNote: status === "Pending" ? null : undefined, deadline: data.deadline === undefined ? undefined : data.deadline ? new Date(data.deadline) : null, postedAt: goingLive ? new Date() : undefined, updatedAt: new Date() }).where(and(eq(job.id, id), eq(job.companyId, profile.companyId!)))
    if (status === "Pending" && existing.job.status !== "Pending") {
      await notify({ userIds: await adminUserIds(), kind: "account", title: `Job awaiting review: ${data.title ?? existing.job.title}`, body: `${data.title ?? existing.job.title} was submitted for review.`, href: "/admin/jobs?status=Pending", email: { subject: `Review needed — ${data.title ?? existing.job.title}`, actionLabel: "Review jobs" } })
    }
    return Response.json({ ok: true, status })
  } catch (error) {
    return errorResponse(error) ?? Response.json({ error: "Unable to update this job." }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const id = (await context.params).id
    const { profile } = await requireEmployer(request.headers)
    await getEmployerJob(request.headers, id)
    await db.update(job).set({ status: "Archived", updatedAt: new Date() }).where(and(eq(job.id, id), eq(job.companyId, profile.companyId!)))
    return Response.json({ ok: true })
  } catch (error) {
    return errorResponse(error) ?? Response.json({ error: "Unable to archive this job." }, { status: 500 })
  }
}
