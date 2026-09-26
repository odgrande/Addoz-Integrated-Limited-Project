import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/lib/db"
import { company, employerProfile, job, notification, user } from "@/lib/db/schema"
import { EmployerAuthError, EmployerOwnershipError, getEmployerApplicants, requireEmployer } from "@/features/employers/queries"

const jobSchema = z.object({
  title: z.string().trim().min(2).max(160),
  categoryId: z.string().min(1),
  locationId: z.string().min(1),
  type: z.string().min(1).max(40),
  level: z.string().min(1).max(40),
  experience: z.string().min(1).max(60),
  workplace: z.string().min(1).max(40),
  salaryMin: z.coerce.number().int().nonnegative().nullable().optional(),
  salaryMax: z.coerce.number().int().nonnegative().nullable().optional(),
  salaryPeriod: z.string().max(20).nullable().optional(),
  summary: z.string().trim().min(20).max(500),
  responsibilities: z.array(z.string().trim().min(1).max(300)).min(1).max(12),
  requirements: z.array(z.string().trim().min(1).max(300)).min(1).max(12),
  skills: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  deadline: z.string().nullable().optional(),
  apply: z.enum(["addoz", "email"]).default("addoz"),
  status: z.enum(["Draft", "Active"]).default("Draft"),
})

function authError(error: unknown) {
  if (error instanceof EmployerAuthError) return Response.json({ error: "Authentication required." }, { status: 401 })
  if (error instanceof EmployerOwnershipError) return Response.json({ error: "Employer ownership required." }, { status: 403 })
  return null
}

function parseList(value: unknown) {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean)
  if (typeof value === "string") return value.split(/\r?\n|,/).map(item => item.trim()).filter(Boolean)
  return []
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70)
}

export async function GET(request: Request, context: { params: Promise<{ resource: string }> }) {
  try {
    const { profile, session } = await requireEmployer(request.headers)
    const resource = (await context.params).resource
    if (resource === "company") {
      const [record] = profile.companyId ? await db.select().from(company).where(eq(company.id, profile.companyId)).limit(1) : []
      return Response.json(record ?? null)
    }
    if (resource === "profile") {
      const [record] = await db.select().from(employerProfile).where(eq(employerProfile.userId, session.user.id)).limit(1)
      return Response.json({ ...record, name: session.user.name, email: session.user.email })
    }
    if (resource === "applicants") {
      const url = new URL(request.url)
      return Response.json(await getEmployerApplicants(request.headers, undefined, url.searchParams.get("q") ?? "", url.searchParams.get("stage") ?? undefined))
    }
    if (resource === "notifications") return Response.json(await db.select().from(notification).where(eq(notification.userId, session.user.id)))
    if (resource === "settings") return Response.json({ name: session.user.name, email: session.user.email })
    return Response.json({ error: "Unknown employer resource." }, { status: 400 })
  } catch (error) {
    return authError(error) ?? Response.json({ error: "Unable to load employer data." }, { status: 500 })
  }
}

export async function POST(request: Request, context: { params: Promise<{ resource: string }> }) {
  try {
    const { profile } = await requireEmployer(request.headers)
    const resource = (await context.params).resource
    const body = await request.json().catch(() => null) as Record<string, unknown> | null
    if (!body) return Response.json({ error: "Enter valid details." }, { status: 400 })
    if (resource === "jobs") {
      if (!profile.companyId) return Response.json({ error: "Complete your company profile first." }, { status: 409 })
      const parsed = jobSchema.safeParse({ ...body, responsibilities: parseList(body.responsibilities), requirements: parseList(body.requirements), skills: parseList(body.skills) })
      if (!parsed.success) return Response.json({ error: "Complete the required job fields.", fields: parsed.error.flatten().fieldErrors }, { status: 400 })
      const slugBase = slugify(parsed.data.title)
      const slug = `${slugBase}-${Date.now().toString(36)}`
      const [created] = await db.insert(job).values({
        companyId: profile.companyId,
        slug,
        title: parsed.data.title,
        categoryId: parsed.data.categoryId,
        locationId: parsed.data.locationId,
        type: parsed.data.type,
        workplace: parsed.data.workplace,
        level: parsed.data.level,
        experience: parsed.data.experience,
        salaryMin: parsed.data.salaryMin ?? null,
        salaryMax: parsed.data.salaryMax ?? null,
        salaryPeriod: parsed.data.salaryPeriod ?? "month",
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
        apply: parsed.data.apply,
        summary: parsed.data.summary,
        responsibilities: parsed.data.responsibilities,
        requirements: parsed.data.requirements,
        skills: parsed.data.skills,
        status: parsed.data.status,
        postedAt: parsed.data.status === "Active" ? new Date() : undefined,
      }).returning({ id: job.id, slug: job.slug })
      return Response.json(created, { status: 201 })
    }
    return Response.json({ error: "Unknown employer resource." }, { status: 400 })
  } catch (error) {
    return authError(error) ?? Response.json({ error: "Unable to save employer data." }, { status: 500 })
  }
}

export async function PUT(request: Request, context: { params: Promise<{ resource: string }> }) {
  try {
    const { profile, session } = await requireEmployer(request.headers)
    const resource = (await context.params).resource
    const body = await request.json().catch(() => null) as Record<string, unknown> | null
    if (!body) return Response.json({ error: "Enter valid details." }, { status: 400 })
    if (resource === "company") {
      if (!profile.companyId) return Response.json({ error: "No company is attached to this account." }, { status: 409 })
      const name = typeof body.name === "string" ? body.name.trim() : ""
      if (!name) return Response.json({ error: "Company name is required." }, { status: 400 })
      await db.update(company).set({ name, logo: typeof body.logo === "string" ? body.logo.trim() || null : null, description: typeof body.description === "string" ? body.description.trim() || null : null, industry: typeof body.industry === "string" ? body.industry.trim() || null : null, website: typeof body.website === "string" ? body.website.trim() || null : null, locationId: typeof body.locationId === "string" && body.locationId ? body.locationId : null, companySize: typeof body.companySize === "string" ? body.companySize : null, linkedin: typeof body.linkedin === "string" ? body.linkedin.trim() || null : null, twitter: typeof body.twitter === "string" ? body.twitter.trim() || null : null, updatedAt: new Date() }).where(eq(company.id, profile.companyId))
      return Response.json({ ok: true })
    }
    if (resource === "profile") {
      await db.update(user).set({ name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : session.user.name, updatedAt: new Date() }).where(eq(user.id, session.user.id))
      await db.update(employerProfile).set({ contactName: typeof body.contactName === "string" ? body.contactName.trim() || null : null, jobTitle: typeof body.jobTitle === "string" ? body.jobTitle.trim() || null : null, phone: typeof body.phone === "string" ? body.phone.trim() || null : null, updatedAt: new Date() }).where(eq(employerProfile.userId, session.user.id))
      return Response.json({ ok: true })
    }
    return Response.json({ error: "Unknown employer resource." }, { status: 400 })
  } catch (error) {
    return authError(error) ?? Response.json({ error: "Unable to update employer data." }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ resource: string }> }) {
  try {
    const { session } = await requireEmployer(request.headers)
    const resource = (await context.params).resource
    const body = await request.json().catch(() => null) as Record<string, unknown> | null
    if (resource === "notifications" && body && typeof body.id === "string") {
      if (body.id === "all") await db.update(notification).set({ read: true }).where(eq(notification.userId, session.user.id))
      else await db.update(notification).set({ read: true }).where(and(eq(notification.id, body.id), eq(notification.userId, session.user.id)))
      return Response.json({ ok: true })
    }
    if (resource === "settings" && body && typeof body.name === "string" && body.name.trim()) {
      await db.update(user).set({ name: body.name.trim(), updatedAt: new Date() }).where(eq(user.id, session.user.id))
      return Response.json({ ok: true })
    }
    return Response.json({ error: "Enter valid details." }, { status: 400 })
  } catch (error) {
    return authError(error) ?? Response.json({ error: "Unable to update employer data." }, { status: 500 })
  }
}
