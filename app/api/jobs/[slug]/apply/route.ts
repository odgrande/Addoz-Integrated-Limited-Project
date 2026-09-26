import crypto from "node:crypto"
import { and, eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { candidateProfile, job, jobApplication, user } from "@/lib/db/schema"

function badRequest(message = "Enter valid details.") {
  return Response.json({ error: message }, { status: 400 })
}

function forbidden(message = "This account is not allowed to apply to jobs.") {
  return Response.json({ error: message }, { status: 403 })
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function makeApplicationReference(prefix: string) {
  return `${prefix}-${crypto.randomBytes(10).toString("hex")}`
}

function buildGuestContinuityCookie(reference: string, jobId: string, email: string) {
  const payload = Buffer.from(JSON.stringify({ ref: reference, jobId, email, exp: Date.now() + 86_400_000 })).toString("base64url")
  const signature = crypto.createHmac("sha256", process.env.GUEST_APP_SECRET ?? "local-dev-guest-application-secret").update(payload).digest("hex")
  return `${encodeURIComponent(`${payload}.${signature}`)}`
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  const session = await auth.api.getSession({ headers: request.headers })

  if (session?.user && session.user.role !== "candidate") {
    return forbidden("Only candidates can apply to jobs. Use a candidate account or continue as a guest.")
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!body || typeof body !== "object") return badRequest("Add your application details.")

  const [jobRecord] = await db.select({ id: job.id, status: job.status }).from(job).where(eq(job.slug, slug)).limit(1)
  if (!jobRecord) return Response.json({ error: "That role is no longer available." }, { status: 404 })
  if (jobRecord.status !== "Active") return Response.json({ error: "This role is no longer accepting applications." }, { status: 410 })

  if (session?.user?.email) {
    const [existingUser] = await db.select({ id: user.id, role: user.role }).from(user).where(eq(user.email, String(session.user.email).toLowerCase())).limit(1)
    if (existingUser && existingUser.role !== "candidate" && session.user.role !== "candidate") {
      return forbidden("Only candidates can apply to jobs. Use a candidate account or continue as a guest.")
    }
  }

  if (session?.user?.role === "candidate") {
    const [profile] = await db.select({ id: candidateProfile.id }).from(candidateProfile).where(eq(candidateProfile.userId, session.user.id)).limit(1)
    if (!profile) return forbidden("Create a candidate profile first.")

    const [existing] = await db.select({ id: jobApplication.id }).from(jobApplication).where(and(eq(jobApplication.jobId, jobRecord.id), eq(jobApplication.candidateId, profile.id))).limit(1)
    if (existing) return Response.json({ error: "You have already applied to this role." }, { status: 409 })

    const coverLetter = typeof body.coverLetter === "string" ? body.coverLetter.trim() : ""
    const name = typeof body.name === "string" ? body.name.trim() || session.user.name : session.user.name
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() || session.user.email : session.user.email
    const phone = typeof body.phone === "string" ? body.phone.trim() : ""
    const applicationReference = makeApplicationReference("APP")
    const candidateSnapshot = JSON.stringify({ name, email, phone, coverLetter: coverLetter || null, appliedAt: new Date().toISOString() })

    const [created] = await db.insert(jobApplication).values({
      jobId: jobRecord.id,
      candidateId: profile.id,
      guestName: name,
      guestEmail: email ?? null,
      guestPhone: phone || null,
      coverLetter: coverLetter || null,
      applicationReference,
      candidateSnapshot,
      stage: "Applied",
    }).returning({ id: jobApplication.id, applicationReference: jobApplication.applicationReference })

    return Response.json({ ok: true, applicationId: created.id, applicationReference: created.applicationReference }, { status: 201 })
  }

  const name = String(body.name ?? "").trim()
  const email = String(body.email ?? "").trim().toLowerCase()
  const phone = String(body.phone ?? "").trim()
  const coverLetter = typeof body.coverLetter === "string" ? body.coverLetter.trim() : ""

  if (name.length < 2) return badRequest("Enter your full name.")
  if (!isValidEmail(email)) return badRequest("Enter a valid email address.")
  if (phone && phone.replace(/\D/g, "").length < 10) return badRequest("Enter a valid phone number.")

  const [existingAccount] = await db.select({ id: user.id, role: user.role }).from(user).where(eq(user.email, email)).limit(1)
  if (existingAccount && existingAccount.role === "candidate") {
    return Response.json({ error: "An ADDOZ account already exists for this email. Sign in to continue with your candidate account." }, { status: 409 })
  }

  const [existingGuest] = await db.select({ id: jobApplication.id }).from(jobApplication)
    .where(and(eq(jobApplication.jobId, jobRecord.id), eq(jobApplication.guestEmail, email)))
    .limit(1)
  if (existingGuest) return Response.json({ error: "You have already applied with this email for this role." }, { status: 409 })

  const applicationReference = makeApplicationReference("GUEST")
  const [created] = await db.insert(jobApplication).values({
    jobId: jobRecord.id,
    candidateId: null,
    guestName: name,
    guestEmail: email,
    guestPhone: phone || null,
    coverLetter: coverLetter || null,
    applicationReference,
    candidateSnapshot: JSON.stringify({ name, email, phone, coverLetter: coverLetter || null, appliedAt: new Date().toISOString() }),
    stage: "Applied",
  }).returning({ id: jobApplication.id, applicationReference: jobApplication.applicationReference })

  const response = Response.json({ ok: true, guest: true, applicationId: created.id, applicationReference: created.applicationReference }, { status: 201 })
  response.headers.set("Set-Cookie", `addoz_guest_application=${buildGuestContinuityCookie(created.applicationReference ?? applicationReference, jobRecord.id, email)}; Path=/; Max-Age=86400; SameSite=Lax; HttpOnly${process.env.NODE_ENV === "production" ? "; Secure" : ""}`)
  return response
}
