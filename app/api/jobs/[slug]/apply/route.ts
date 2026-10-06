import crypto from "node:crypto"
import { and, desc, eq } from "drizzle-orm"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { candidateProfile, company, job, jobApplication, resume } from "@/lib/db/schema"
import { GUEST_ACCOUNT_FOOTER, companyEmployerUserIds, notify } from "@/lib/notify"
import { resolveGuestCandidate } from "@/features/applications/server"
import { copyResumeToApplication, deleteResumeFromStorage, getResumeStorageErrorMessage, isResumeStorageConfigured, uploadApplicationFileToStorage, validateCvFile } from "@/lib/storage/r2"

type ErrorCode = "INVALID" | "CV_REQUIRED" | "FORBIDDEN" | "NOT_FOUND" | "CLOSED" | "ALREADY_APPLIED" | "ACCOUNT_EXISTS" | "STORAGE" | "SERVER"

function fail(status: number, code: ErrorCode, error: string) {
  return Response.json({ error, code }, { status })
}

const fieldsSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(120, "Use a shorter name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  phone: z.string().trim().max(32).default("")
    .refine(value => !value || value.replace(/\D/g, "").length >= 10, "Enter a valid phone number."),
  coverLetter: z.string().trim().max(5000, "Keep your cover note under 5,000 characters.").default(""),
  consent: z.literal("true", { error: "Confirm you're happy to share your details with the employer." }),
  useProfileResume: z.enum(["true", "false"]).default("false"),
})

function field(form: FormData, name: string) {
  const value = form.get(name)
  return typeof value === "string" ? value : undefined
}

function isUniqueViolation(error: unknown) {
  const candidate = error as { code?: string; cause?: { code?: string } } | null
  return candidate?.code === "23505" || candidate?.cause?.code === "23505"
}

function guestContinuityCookie(reference: string, jobId: string, email: string, secure: boolean) {
  const secret = process.env.GUEST_APP_SECRET ?? process.env.BETTER_AUTH_SECRET
  if (!secret) return null
  const payload = Buffer.from(JSON.stringify({ ref: reference, jobId, email, exp: Date.now() + 86_400_000 })).toString("base64url")
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url")
  return `addoz_guest_application=${payload}.${signature}; Path=/; Max-Age=86400; SameSite=Lax; HttpOnly${secure ? "; Secure" : ""}`
}

/**
 * Submit an application (multipart/form-data, CV required).
 * - Signed-in candidate → their account; CV is a new upload or a copy of the profile resume.
 * - No session → guest; a passwordless candidate account is created silently for the email.
 * - Employer / admin sessions cannot apply.
 * Every application stores its own copy of the CV, so it survives profile resume changes.
 */
export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  let uploadedKey: string | null = null
  try {
    const { slug } = await context.params
    const session = await auth.api.getSession({ headers: request.headers })
    const role = session?.user?.role
    if (session?.user && role !== "candidate") {
      return fail(403, "FORBIDDEN", "Employer and admin accounts can't apply to jobs. Sign in with a candidate account.")
    }

    if (!(request.headers.get("content-type") ?? "").includes("multipart/form-data")) return fail(400, "INVALID", "Add your application details and CV.")
    const form = await request.formData().catch(() => null)
    if (!form) return fail(400, "INVALID", "Add your application details and CV.")
    const parsed = fieldsSchema.safeParse({
      name: field(form, "name"), email: field(form, "email"), phone: field(form, "phone") ?? "", coverLetter: field(form, "coverLetter") ?? "",
      consent: field(form, "consent"), useProfileResume: field(form, "useProfileResume") ?? "false",
    })
    if (!parsed.success) return fail(400, "INVALID", parsed.error.issues[0]?.message ?? "Check your application details.")
    const input = parsed.data

    const [jobRecord] = await db.select({ id: job.id, status: job.status, title: job.title, companyId: job.companyId, companyName: company.name })
      .from(job).innerJoin(company, eq(job.companyId, company.id)).where(eq(job.slug, slug)).limit(1)
    if (!jobRecord) return fail(404, "NOT_FOUND", "That role is no longer available.")
    if (jobRecord.status !== "Active") return fail(410, "CLOSED", "This role is no longer accepting applications.")
    if (!isResumeStorageConfigured()) {
      console.error("[apply] " + getResumeStorageErrorMessage())
      return fail(503, "STORAGE", "CV uploads are temporarily unavailable. Please try again shortly.")
    }

    // Who owns this application. A candidate session always wins over the form,
    // so a guest form sent while signed in is filed under the account.
    let candidateId: string
    let candidateUserId: string
    let email: string
    let guest = false
    if (session?.user && role === "candidate") {
      await db.insert(candidateProfile).values({ userId: session.user.id }).onConflictDoNothing()
      const [profile] = await db.select({ id: candidateProfile.id }).from(candidateProfile).where(eq(candidateProfile.userId, session.user.id)).limit(1)
      if (!profile) return fail(500, "SERVER", "We couldn't load your candidate profile. Please try again.")
      candidateId = profile.id
      candidateUserId = session.user.id
      email = session.user.email.toLowerCase()
    } else {
      const resolved = await resolveGuestCandidate(input.email, input.name)
      if (!resolved.ok) {
        return fail(409, "ACCOUNT_EXISTS", resolved.reason === "SIGN_IN_REQUIRED"
          ? "This email belongs to an ADDOZ candidate account. Sign in to apply."
          : "This email belongs to an ADDOZ employer or admin account. Use a different email to apply.")
      }
      candidateId = resolved.candidateId
      candidateUserId = resolved.userId
      email = input.email
      guest = true
    }

    const [existing] = await db.select({ id: jobApplication.id }).from(jobApplication)
      .where(and(eq(jobApplication.jobId, jobRecord.id), eq(jobApplication.candidateId, candidateId))).limit(1)
    if (existing) return fail(409, "ALREADY_APPLIED", guest ? "You have already applied to this role with this email." : "You have already applied to this role.")

    // CV: a fresh upload, or (signed-in candidates) a copy of the profile resume
    const applicationReference = `${guest ? "GUEST" : "APP"}-${crypto.randomBytes(10).toString("hex")}`
    const upload = form.get("cv")
    let cv: { key: string; fileName: string; mimeType: string | null; fileSize: string | null }
    if (upload instanceof File && upload.size > 0) {
      const problem = validateCvFile(upload)
      if (problem) return fail(400, "CV_REQUIRED", problem)
      const stored = await uploadApplicationFileToStorage({ applicationKey: applicationReference, fileName: upload.name, file: upload })
      uploadedKey = stored.key
      cv = { key: stored.key, fileName: upload.name, mimeType: stored.mimeType, fileSize: String(upload.size) }
    } else if (!guest && input.useProfileResume === "true") {
      const [current] = await db.select().from(resume).where(eq(resume.candidateId, candidateId)).orderBy(desc(resume.uploadedAt)).limit(1)
      if (!current?.storageKey) return fail(400, "CV_REQUIRED", "Your profile has no CV on file. Upload one for this application.")
      const copied = await copyResumeToApplication({ applicationKey: applicationReference, storageKey: current.storageKey, fileName: current.fileName })
      uploadedKey = copied.key
      cv = { key: copied.key, fileName: current.fileName, mimeType: current.mimeType, fileSize: current.fileSize }
    } else {
      return fail(400, "CV_REQUIRED", "Attach your CV (PDF, Word, RTF or TXT).")
    }

    try {
      const [created] = await db.insert(jobApplication).values({
        jobId: jobRecord.id,
        candidateId,
        guestName: input.name,
        guestEmail: email,
        guestPhone: input.phone || null,
        coverLetter: input.coverLetter || null,
        applicationReference,
        candidateSnapshot: JSON.stringify({ name: input.name, email, phone: input.phone || null, coverLetter: input.coverLetter || null, source: guest ? "guest" : "candidate", appliedAt: new Date().toISOString() }),
        cvFileName: cv.fileName,
        cvStorageKey: cv.key,
        cvMimeType: cv.mimeType,
        cvFileSize: cv.fileSize,
        stage: "Applied",
      }).returning({ id: jobApplication.id, applicationReference: jobApplication.applicationReference })
      uploadedKey = null

      // Confirmation to the applicant, alert to the hiring team
      await Promise.all([
        notify({
          userIds: [candidateUserId],
          kind: "application",
          title: `Application sent: ${jobRecord.title}`,
          body: `Your application for ${jobRecord.title} at ${jobRecord.companyName} was received. We'll let you know when the employer updates it.`,
          href: "/candidate/applications",
          email: { subject: `Application received — ${jobRecord.title}`, actionLabel: "View your applications", footer: guest ? GUEST_ACCOUNT_FOOTER : undefined },
        }),
        companyEmployerUserIds(jobRecord.companyId).then(userIds => notify({
          userIds,
          kind: "application",
          title: `New applicant: ${input.name}`,
          body: `${input.name} applied for ${jobRecord.title}. Their CV and details are ready to review.`,
          href: `/employer/jobs/${jobRecord.id}/applicants`,
          email: { subject: `New applicant for ${jobRecord.title}`, actionLabel: "Review applicant" },
        })),
      ]).catch(error => console.error("[apply] notifications failed", error))

      const response = Response.json({ ok: true, guest, applicationId: created!.id, applicationReference: created!.applicationReference }, { status: 201 })
      const cookie = guest ? guestContinuityCookie(applicationReference, jobRecord.id, email, new URL(request.url).protocol === "https:") : null
      if (cookie) response.headers.append("Set-Cookie", cookie)
      return response
    } catch (error) {
      if (isUniqueViolation(error)) return fail(409, "ALREADY_APPLIED", "You have already applied to this role.")
      throw error
    }
  } catch (error) {
    console.error("[apply] application failed", error)
    return fail(500, "SERVER", "We couldn't submit your application. Please try again.")
  } finally {
    // Never leave an orphaned CV behind when the application wasn't saved
    if (uploadedKey) await deleteResumeFromStorage(uploadedKey).catch(() => undefined)
  }
}
