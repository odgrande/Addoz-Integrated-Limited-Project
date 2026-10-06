import { eq, sql } from "drizzle-orm"
import { hasPasswordLogin } from "@/features/applications/server"
import { isAPIError } from "better-auth/api"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { candidateProfile, company, employerProfile, user } from "@/lib/db/schema"

const registrationSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(120),
  role: z.enum(["candidate", "employer"]),
  companyName: z.string().trim().min(1).max(160).optional(),
}).superRefine((value, context) => {
  if (value.role === "employer" && !value.companyName) {
    context.addIssue({ code: "custom", path: ["companyName"], message: "Company name is required for employers." })
  }
})

/**
 * Registration roles are selected only by this server endpoint. Better Auth's
 * role field remains input:false so its public endpoints cannot create admins
 * or alter an existing user's authorization claim.
 */
export async function POST(request: Request) {
  const parsed = registrationSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "Enter valid registration details." }, { status: 400 })

  const { email, password, name, role, companyName } = parsed.data
  try {
    // Guest applicants already have a passwordless account for their email.
    // It is claimed through the emailed password link (proof of ownership),
    // never by registering over it.
    const [existing] = await db.select({ id: user.id }).from(user).where(eq(sql`lower(${user.email})`, email.toLowerCase())).limit(1)
    if (existing) {
      if (!(await hasPasswordLogin(existing.id))) {
        return Response.json({ error: "You've applied on ADDOZ with this email before. Use \"Forgot password\" to set a password and open your account.", code: "GUEST_ACCOUNT" }, { status: 409 })
      }
      return Response.json({ error: "An account with this email already exists." }, { status: 409 })
    }

    const result = await auth.api.signUpEmail({
      returnHeaders: true,
      body: { email, password, name },
    })

    if (role === "employer") {
      await db.delete(candidateProfile).where(eq(candidateProfile.userId, result.response.user.id))
      await db.update(user).set({ role }).where(eq(user.id, result.response.user.id))
      const slug = `${companyName!.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${result.response.user.id.slice(-8)}`
      const [createdCompany] = await db.insert(company).values({ slug, name: companyName! }).returning({ id: company.id })
      if (!createdCompany) throw new Error("Unable to create company")
      await db.insert(employerProfile).values({ userId: result.response.user.id, companyId: createdCompany.id, contactName: name })
    }

    // No session yet: the account activates once the emailed code is verified
    const response = Response.json({ ok: true, verify: true }, { status: 201 })
    for (const cookie of result.headers.getSetCookie()) response.headers.append("set-cookie", cookie)
    return response
  } catch (error) {
    const candidate = error as any
    const status = candidate?.status ?? candidate?.statusCode ?? candidate?.body?.status ?? candidate?.response?.status
    const bodyText = typeof candidate?.body === 'string' ? candidate.body : JSON.stringify(candidate?.body ?? candidate?.response?.body ?? {})
    const messageText = typeof candidate?.message === 'string' ? candidate.message : ''
    const isDuplicateEmail = status === 409 || status === 422 || status === 'UNPROCESSABLE_ENTITY' || /already exists|use another email|duplicate/i.test(messageText) || /already exists|use another email|duplicate/i.test(bodyText)

    if (isAPIError(error) && isDuplicateEmail) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 })
    }
    if (isDuplicateEmail) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 })
    }
    console.error("Registration failed", error)
    return Response.json({ error: "Unable to create your account. Please try again." }, { status: 500 })
  }
}
