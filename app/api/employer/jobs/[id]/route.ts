import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/lib/db"
import { adminUserIds, notify } from "@/lib/notify"
import { job } from "@/lib/db/schema"
import { EmployerAuthError, EmployerOwnershipError, getEmployerJob, requireEmployer } from "@/features/employers/queries"
import { deadlineFrom, durationOf, isExpired, listingDays } from "@/features/jobs/listing"
import { getCompanyProfileMissing } from "@/features/employers/queries"
import { listMissing } from "@/features/companies/completeness"

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
  durationDays: z.coerce.number().int().optional(),
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
    const { durationDays, ...data } = parsed.data
    // Publishing a job ADDOZ hasn't approved yet (new or declined) sends it for review;
    // approved jobs can be paused, reinstated and re-published freely.
    const status = data.status === "Active" && !existing.job.approvedAt ? "Pending" : data.status
    const wasLive = existing.job.status === "Active" && !isExpired(existing.job.deadline)
    // Going live, re-publishing or reinstating needs a complete company profile
    if (data.status === "Active" && !wasLive) {
      const missing = await getCompanyProfileMissing(profile.companyId)
      if (missing.length) return Response.json({ error: `Complete your company profile before posting jobs — add ${listMissing(missing)}.`, code: "COMPANY_INCOMPLETE", missing }, { status: 409 })
    }
    // Going live (publish, re-publish, reinstate after expiry) or entering review restarts the
    // listing clock; review keeps the duration so approval can restart it from approval day.
    const restart = (status === "Active" && !wasLive) || (status === "Pending" && existing.job.status !== "Pending")
    const now = new Date()
    const days = durationDays === undefined ? durationOf(existing.job.postedAt, existing.job.deadline) : listingDays(durationDays)
    const timing = restart ? { postedAt: now, deadline: deadlineFrom(now, days) }
      // Changing the duration of a live job counts from when it went live
      : durationDays !== undefined ? { deadline: deadlineFrom(existing.job.postedAt, days) } : {}
    await db.update(job).set({ ...data, ...timing, status, moderationNote: status === "Pending" ? null : undefined, updatedAt: now }).where(and(eq(job.id, id), eq(job.companyId, profile.companyId!)))
    if (status === "Pending" && existing.job.status !== "Pending") {
      await notify({ userIds: await adminUserIds(), kind: "account", title: `Job awaiting review: ${data.title ?? existing.job.title}`, body: `${data.title ?? existing.job.title} was submitted for review.`, href: "/admin/jobs?status=Pending", email: { subject: `Review needed — ${data.title ?? existing.job.title}`, actionLabel: "Review jobs" } })
    }
    return Response.json({ ok: true, status, deadline: timing.deadline ?? existing.job.deadline })
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
