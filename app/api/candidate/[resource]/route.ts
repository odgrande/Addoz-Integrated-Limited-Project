import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { candidateProfile, category, company, job, jobAlert, jobApplication, location, notification, resume, savedJob, user } from "@/lib/db/schema"
import { CandidateAuthError, requireCandidate } from "@/features/candidates/queries"
import { deleteResumeFromStorage, getResumeStorageErrorMessage, isResumeStorageConfigured, uploadResumeToStorage } from "@/lib/storage/r2"

function unauthorized() {
  return Response.json({ error: "Authentication required." }, { status: 401 })
}

function badRequest(message = "Enter valid details.") {
  return Response.json({ error: message }, { status: 400 })
}

async function getResource(context: { params: Promise<{ resource: string }> }) {
  return (await context.params).resource
}

export async function GET(request: Request, context: { params: Promise<{ resource: string }> }) {
  try {
    const { profile, session } = await requireCandidate(request.headers)
    const resource = await getResource(context)

    if (resource === "profile") {
      const [record] = await db.select({ profile: candidateProfile, name: user.name, email: user.email, locationName: location.name })
        .from(candidateProfile).innerJoin(user, eq(candidateProfile.userId, user.id)).leftJoin(location, eq(candidateProfile.locationId, location.id))
        .where(eq(candidateProfile.id, profile.id)).limit(1)
      return Response.json(record)
    }
    if (resource === "resume") {
      const [record] = await db.select().from(resume).where(eq(resume.candidateId, profile.id)).orderBy(desc(resume.uploadedAt)).limit(1)
      return Response.json(record ?? null)
    }
    if (resource === "applications") {
      const records = await db.select({ id: jobApplication.id, title: job.title, slug: job.slug, companyName: company.name, stage: jobApplication.stage, appliedAt: jobApplication.appliedAt })
        .from(jobApplication).innerJoin(job, eq(jobApplication.jobId, job.id)).innerJoin(company, eq(job.companyId, company.id))
        .where(eq(jobApplication.candidateId, profile.id))
      return Response.json(records)
    }
    if (resource === "saved-jobs") {
      const records = await db.select({ jobId: savedJob.jobId, title: job.title, slug: job.slug, companyName: company.name, savedAt: savedJob.savedAt })
        .from(savedJob).innerJoin(job, eq(savedJob.jobId, job.id)).innerJoin(company, eq(job.companyId, company.id))
        .where(eq(savedJob.candidateId, profile.id))
      return Response.json(records)
    }
    if (resource === "job-alerts") {
      const records = await db.select().from(jobAlert).where(eq(jobAlert.candidateId, profile.id))
      return Response.json(records)
    }
    if (resource === "notifications") {
      const records = await db.select().from(notification).where(eq(notification.userId, session.user.id))
      return Response.json(records)
    }
    if (resource === "settings") return Response.json({ name: session.user.name, email: session.user.email })
    return badRequest("Unknown candidate resource.")
  } catch (error) {
    if (error instanceof CandidateAuthError) return unauthorized()
    console.error("Candidate GET failed", error)
    return Response.json({ error: "Unable to load candidate data." }, { status: 500 })
  }
}

export async function POST(request: Request, context: { params: Promise<{ resource: string }> }) {
  try {
    const { profile, session } = await requireCandidate(request.headers)
    const resource = await getResource(context)

    if (resource === "resume") {
      if (!isResumeStorageConfigured()) return Response.json({ error: getResumeStorageErrorMessage() }, { status: 503 })
      const contentType = request.headers.get("content-type") ?? ""
      if (!contentType.includes("multipart/form-data")) {
        const body = await request.json().catch(() => null) as Record<string, unknown> | null
        if (!body) return badRequest()
        const fileName = typeof body.fileName === "string" ? body.fileName.trim() : ""
        const url = typeof body.url === "string" ? body.url.trim() : ""
        if (!fileName || !url) return badRequest("Add a file name and secure file URL.")
        await db.delete(resume).where(eq(resume.candidateId, profile.id))
        const [created] = await db.insert(resume).values({
          candidateId: profile.id,
          fileName,
          fileSize: typeof body.fileSize === "string" ? body.fileSize.trim() : null,
          url,
          storageKey: typeof body.storageKey === "string" ? body.storageKey.trim() : null,
          mimeType: typeof body.mimeType === "string" ? body.mimeType.trim() : null,
          status: "active",
        }).returning()
        return Response.json(created)
      }

      const formData = await request.formData()
      const file = formData.get("resume")
      if (!(file instanceof File)) return badRequest("Choose a resume file to upload.")
      const isAllowedType = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/rtf",
        "text/plain",
      ].includes(file.type)
      const hasAllowedExtension = /\.(pdf|doc|docx|rtf|txt)$/i.test(file.name)
      if (!isAllowedType && !hasAllowedExtension) return badRequest("Upload a PDF, DOC, DOCX, RTF, or TXT resume.")
      if (file.size <= 0) return badRequest("The resume file is empty.")
      if (file.size > Number(process.env.R2_MAX_FILE_SIZE ?? 10 * 1024 * 1024)) return badRequest("Resume files must be 10 MB or smaller.")

      const existing = await db.select().from(resume).where(eq(resume.candidateId, profile.id)).orderBy(desc(resume.uploadedAt)).limit(1)
      const [current] = existing
      if (current?.storageKey) await deleteResumeFromStorage(current.storageKey).catch(() => undefined)
      await db.delete(resume).where(eq(resume.candidateId, profile.id))
      const { key, url, mimeType } = await uploadResumeToStorage({ candidateId: profile.id, fileName: file.name, file })
      const [created] = await db.insert(resume).values({
        candidateId: profile.id,
        fileName: file.name,
        fileSize: String(file.size),
        url,
        storageKey: key,
        mimeType,
        status: "active",
      }).returning()
      return Response.json(created, { status: 201 })
    }

    const body = await request.json().catch(() => null) as Record<string, unknown> | null
    if (!body) return badRequest()

    if (resource === "applications") {
      const slug = typeof body.jobSlug === "string" ? body.jobSlug : ""
      const [target] = await db.select({ id: job.id }).from(job).where(and(eq(job.slug, slug), eq(job.status, "Active"))).limit(1)
      if (!target) return Response.json({ error: "That role is no longer available." }, { status: 404 })
      try {
        const [application] = await db.insert(jobApplication).values({ jobId: target.id, candidateId: profile.id }).returning()
        return Response.json(application, { status: 201 })
      } catch (error) {
        const databaseError = error as { code?: string; cause?: { code?: string; cause?: { code?: string }; message?: string }; message?: string }
        const errorCode = databaseError?.code ?? databaseError?.cause?.code ?? databaseError?.cause?.cause?.code
        const errorMessage = `${databaseError?.message ?? ""} ${databaseError?.cause?.message ?? ""}`
        if (errorCode === "23505" || /job_application_candidate_job_unique|duplicate key/i.test(errorMessage)) {
          return Response.json({ error: "You have already applied to this role." }, { status: 409 })
        }
        console.error("Candidate application failed", error)
        return Response.json({ error: "Unable to submit this application." }, { status: 500 })
      }
    }
    if (resource === "saved-jobs") {
      const slug = typeof body.jobSlug === "string" ? body.jobSlug : ""
      const [target] = await db.select({ id: job.id }).from(job).where(eq(job.slug, slug)).limit(1)
      if (!target) return Response.json({ error: "That role could not be found." }, { status: 404 })
      await db.insert(savedJob).values({ jobId: target.id, candidateId: profile.id }).onConflictDoNothing()
      return Response.json({ saved: true }, { status: 201 })
    }
    if (resource === "job-alerts") {
      if (typeof body.name !== "string" || !body.name.trim()) return badRequest("Give your alert a name.")
      const [created] = await db.insert(jobAlert).values({
        candidateId: profile.id,
        name: body.name.trim(),
        keywords: typeof body.keywords === "string" ? body.keywords.trim() : null,
        categoryId: typeof body.categoryId === "string" && body.categoryId ? body.categoryId : null,
        locationId: typeof body.locationId === "string" && body.locationId ? body.locationId : null,
        workplace: typeof body.workplace === "string" && body.workplace ? body.workplace : null,
        frequency: typeof body.frequency === "string" ? body.frequency : "Daily",
        active: true,
      }).returning()
      return Response.json(created, { status: 201 })
    }
    return badRequest("Unknown candidate resource.")
  } catch (error) {
    if (error instanceof CandidateAuthError) return unauthorized()
    console.error("Candidate POST failed", error)
    return Response.json({ error: "Unable to save that change." }, { status: 500 })
  }
}

export async function PUT(request: Request, context: { params: Promise<{ resource: string }> }) {
  try {
    const { profile } = await requireCandidate(request.headers)
    const resource = await getResource(context)
    const body = await request.json().catch(() => null) as Record<string, unknown> | null
    if (!body) return badRequest()

    if (resource === "profile") {
      const name = typeof body.name === "string" ? body.name.trim() : ""
      if (!name) return badRequest("Your name is required.")
      await db.update(user).set({ name, updatedAt: new Date() }).where(eq(user.id, profile.userId))
      await db.update(candidateProfile).set({
        headline: typeof body.headline === "string" ? body.headline.trim() : null,
        experience: typeof body.experience === "string" ? body.experience.trim() : null,
        locationId: typeof body.locationId === "string" && body.locationId ? body.locationId : null,
        updatedAt: new Date(),
      }).where(eq(candidateProfile.id, profile.id))
      return Response.json({ ok: true })
    }
    if (resource === "resume") {
      return badRequest("Resume uploads must use multipart form data and Cloudflare R2 storage.")
    }
    return badRequest("Unknown candidate resource.")
  } catch (error) {
    if (error instanceof CandidateAuthError) return unauthorized()
    console.error("Candidate PUT failed", error)
    return Response.json({ error: "Unable to update that record." }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ resource: string }> }) {
  try {
    const { profile, session } = await requireCandidate(request.headers)
    const resource = await getResource(context)
    const body = await request.json().catch(() => null) as Record<string, unknown> | null
    if (!body) return badRequest()

    if (resource === "job-alerts" && typeof body.id === "string") {
      await db.update(jobAlert).set({ active: typeof body.active === "boolean" ? body.active : undefined }).where(and(eq(jobAlert.id, body.id), eq(jobAlert.candidateId, profile.id)))
      return Response.json({ ok: true })
    }
    if (resource === "notifications") {
      if (body.id === "all") await db.update(notification).set({ read: true }).where(eq(notification.userId, session.user.id))
      else if (typeof body.id === "string") await db.update(notification).set({ read: true }).where(and(eq(notification.id, body.id), eq(notification.userId, session.user.id)))
      return Response.json({ ok: true })
    }
    if (resource === "settings") {
      const name = typeof body.name === "string" ? body.name.trim() : ""
      if (!name) return badRequest("Your name is required.")
      await db.update(user).set({ name, updatedAt: new Date() }).where(eq(user.id, session.user.id))
      return Response.json({ ok: true })
    }
    return badRequest("Unknown candidate resource.")
  } catch (error) {
    if (error instanceof CandidateAuthError) return unauthorized()
    console.error("Candidate PATCH failed", error)
    return Response.json({ error: "Unable to update that record." }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ resource: string }> }) {
  try {
    const { profile } = await requireCandidate(request.headers)
    const resource = await getResource(context)

    if (resource === "resume") {
      const [current] = await db.select().from(resume).where(eq(resume.candidateId, profile.id)).orderBy(desc(resume.uploadedAt)).limit(1)
      if (current?.storageKey) await deleteResumeFromStorage(current.storageKey).catch(() => undefined)
      await db.delete(resume).where(eq(resume.candidateId, profile.id))
      return Response.json({ ok: true })
    }

    const body = await request.json().catch(() => null) as Record<string, unknown> | null
    if (!body) return badRequest()

    if (resource === "saved-jobs" && (typeof body.jobId === "string" || typeof body.jobSlug === "string")) {
      const [target] = typeof body.jobId === "string"
        ? [{ id: body.jobId }]
        : await db.select({ id: job.id }).from(job).where(eq(job.slug, body.jobSlug as string)).limit(1)
      if (target) await db.delete(savedJob).where(and(eq(savedJob.jobId, target.id), eq(savedJob.candidateId, profile.id)))
      return Response.json({ saved: false })
    }
    if (resource === "job-alerts" && typeof body.id === "string") {
      await db.delete(jobAlert).where(and(eq(jobAlert.id, body.id), eq(jobAlert.candidateId, profile.id)))
      return Response.json({ ok: true })
    }
    return badRequest("Unknown candidate resource.")
  } catch (error) {
    if (error instanceof CandidateAuthError) return unauthorized()
    console.error("Candidate DELETE failed", error)
    return Response.json({ error: "Unable to remove that record." }, { status: 500 })
  }
}
