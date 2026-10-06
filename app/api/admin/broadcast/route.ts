import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/lib/db"
import { auditLog, notification, user } from "@/lib/db/schema"
import { actionEmail, isEmailConfigured, sendEmail } from "@/lib/email"
import { siteUrl } from "@/lib/site-url"
import { AdminAuthError, recordAdminAction, requireAdmin } from "@/features/admin/queries"

/** Brevo's free plan sends 300 emails a day; leave headroom for sign-in codes and alerts. */
const MAX_BROADCAST_EMAILS = 250

const schema = z.object({
  audience: z.enum(["candidates", "employers", "everyone", "user"]),
  email: z.string().trim().toLowerCase().email("Enter the person's account email.").optional(),
  title: z.string().trim().min(3, "Add a title.").max(120, "Keep the title under 120 characters."),
  body: z.string().trim().min(5, "Write the message.").max(2000, "Keep the message under 2,000 characters."),
  href: z.string().trim().max(300).regex(/^\/(?!\/)[\w\-./?=&%#]*$/, "Links must be a page on this site, e.g. /jobs").optional().or(z.literal("")),
  sendEmail: z.boolean().default(false),
}).refine(value => value.audience !== "user" || Boolean(value.email), { message: "Enter the person's account email.", path: ["email"] })

function errorResponse(error: unknown, fallback: string) {
  if (error instanceof AdminAuthError) return Response.json({ error: "Admin access required." }, { status: 401 })
  console.error("[admin] broadcast failed", error)
  return Response.json({ error: fallback }, { status: 500 })
}

/** Past broadcasts (from the audit log), newest first. */
export async function GET(request: Request) {
  try {
    await requireAdmin(request.headers)
    const rows = await db.select({ id: auditLog.id, metadata: auditLog.metadata, createdAt: auditLog.createdAt }).from(auditLog)
      .where(eq(auditLog.action, "notification.broadcast")).orderBy(desc(auditLog.createdAt)).limit(30)
    return Response.json(rows.map(row => ({ id: row.id, createdAt: row.createdAt, ...(JSON.parse(row.metadata ?? "{}") as object) })))
  } catch (error) { return errorResponse(error, "Unable to load broadcasts.") }
}

/**
 * Send an announcement to every candidate, every employer, everyone, or one
 * person. It lands in their Notifications (the bell shows the unread count) and,
 * optionally, by email for audiences small enough for the daily email allowance.
 */
export async function POST(request: Request) {
  try {
    const session = await requireAdmin(request.headers)
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Check the broadcast details." }, { status: 400 })
    const input = parsed.data

    const notBanned = or(isNull(user.banned), eq(user.banned, false))!
    const audience = input.audience === "user" ? eq(sql`lower(${user.email})`, input.email!)
      : input.audience === "everyone" ? inArray(user.role, ["candidate", "employer"])
      : eq(user.role, input.audience === "candidates" ? "candidate" : "employer")
    const recipients = (await db.select({ id: user.id, role: user.role, email: user.email, name: user.name }).from(user).where(and(audience, notBanned)))
      .filter(row => row.id !== session.user.id)
    if (!recipients.length) return Response.json({ error: input.audience === "user" ? "No active account uses that email." : "There's nobody in that audience yet." }, { status: 404 })
    if (input.sendEmail && recipients.length > MAX_BROADCAST_EMAILS) {
      return Response.json({ error: `Email can go to at most ${MAX_BROADCAST_EMAILS} people at once (the daily email allowance). Untick "Also email" — everyone still gets it in their notifications.` }, { status: 400 })
    }
    if (input.sendEmail && !isEmailConfigured()) return Response.json({ error: "Email isn't configured. Untick \"Also email\" to send in-app only." }, { status: 503 })

    // Each person's notification opens their own notifications page unless a link was given
    const linkFor = (role: string | null) => input.href || (role === "employer" ? "/employer/notifications" : role === "admin" ? "/admin" : "/candidate/notifications")
    for (let start = 0; start < recipients.length; start += 500) {
      await db.insert(notification).values(recipients.slice(start, start + 500).map(row => ({ userId: row.id, kind: "announcement", title: input.title, body: input.body, href: linkFor(row.role) })))
    }

    let emailed = 0
    if (input.sendEmail) {
      const results = await Promise.allSettled(recipients.map(row => sendEmail(actionEmail({
        to: row.email,
        subject: input.title,
        greeting: `Hi ${row.name?.split(" ")[0] || "there"},`,
        body: input.body,
        actionLabel: "Open ADDOZ",
        actionUrl: `${siteUrl()}${linkFor(row.role)}`,
        footer: "You're receiving this announcement because you have an ADDOZ account.",
      }))))
      emailed = results.filter(result => result.status === "fulfilled").length
    }

    await recordAdminAction(request.headers, "notification.broadcast", "notification", undefined, { audience: input.audience, to: input.email ?? null, title: input.title, body: input.body, recipients: recipients.length, emailed })
    return Response.json({ ok: true, recipients: recipients.length, emailed })
  } catch (error) { return errorResponse(error, "Unable to send the broadcast.") }
}
