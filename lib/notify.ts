import "server-only"

import { and, eq, inArray, isNotNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { employerProfile, notification, user } from "./db/schema"
import { actionEmail, sendEmail } from "./email"
import { siteUrl } from "./site-url"

export type NotificationInput = {
  userIds: string[]
  kind: "application" | "message" | "account"
  title: string
  body: string
  /** Site-relative link the notification opens. */
  href: string
  /** Email copy; omit to notify in-app only. */
  email?: { subject: string; actionLabel: string; footer?: string }
}

/**
 * In-app notification + email for each recipient. Never throws: a failed
 * notification must not undo the action that triggered it.
 */
export async function notify(input: NotificationInput) {
  const userIds = [...new Set(input.userIds)].filter(Boolean)
  if (!userIds.length) return
  try {
    await db.insert(notification).values(userIds.map(userId => ({ userId, kind: input.kind, title: input.title, body: input.body, href: input.href })))
  } catch (error) {
    console.error("[notify] in-app notification failed", error)
  }
  if (!input.email) return
  try {
    const recipients = await db.select({ email: user.email, name: user.name }).from(user).where(inArray(user.id, userIds))
    const url = `${siteUrl()}${input.href}`
    await Promise.allSettled(recipients.map(recipient => sendEmail(actionEmail({
      to: recipient.email,
      subject: input.email!.subject,
      greeting: `Hi ${recipient.name?.split(" ")[0] || "there"},`,
      body: input.body,
      actionLabel: input.email!.actionLabel,
      actionUrl: url,
      footer: input.email!.footer ?? "You're receiving this because you have an ADDOZ account.",
    }))))
  } catch (error) {
    console.error("[notify] email notification failed", error)
  }
}

/** Users who manage a company's jobs (its employer accounts). */
export async function companyEmployerUserIds(companyId: string) {
  const rows = await db.select({ userId: employerProfile.userId }).from(employerProfile)
    .where(and(eq(employerProfile.companyId, companyId), isNotNull(employerProfile.userId)))
  return rows.map(row => row.userId)
}

export async function adminUserIds() {
  const rows = await db.select({ id: user.id }).from(user).where(eq(user.role, "admin"))
  return rows.map(row => row.id)
}

/** Footer for emails to applicants who may only have a guest (passwordless) account. */
export const GUEST_ACCOUNT_FOOTER = "Applied as a guest? Use \"Forgot password\" on the ADDOZ sign-in page with this email to set your password and open your account."
