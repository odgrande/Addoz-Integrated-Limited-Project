import "server-only"

import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { candidateProfile, company, conversation, conversationRead, employerProfile, job, jobApplication, message, user } from "@/lib/db/schema"
import { GUEST_ACCOUNT_FOOTER, adminUserIds, companyEmployerUserIds, notify } from "@/lib/notify"

export class MessagesAuthError extends Error { constructor() { super("Authentication required"); this.name = "MessagesAuthError" } }
export class MessagesAccessError extends Error { constructor() { super("Conversation not found"); this.name = "MessagesAccessError" } }

type Role = "candidate" | "employer" | "admin"
export type MessageViewer = { userId: string; role: Role; name: string; companyId: string | null }

export async function requireMessageViewer(headers: Headers): Promise<MessageViewer> {
  const session = await auth.api.getSession({ headers })
  const role = session?.user?.role
  if (!session?.user || (role !== "candidate" && role !== "employer" && role !== "admin")) throw new MessagesAuthError()
  let companyId: string | null = null
  if (role === "employer") {
    const [profile] = await db.select({ companyId: employerProfile.companyId }).from(employerProfile).where(eq(employerProfile.userId, session.user.id)).limit(1)
    companyId = profile?.companyId ?? null
  }
  return { userId: session.user.id, role, name: session.user.name, companyId }
}

/** Conversation + the company it belongs to (application threads), for access checks. */
async function loadConversation(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const [row] = await db.select({
    id: conversation.id, kind: conversation.kind, userId: conversation.userId, subject: conversation.subject,
    applicationId: conversation.applicationId, lastMessageAt: conversation.lastMessageAt, companyId: job.companyId, jobId: job.id,
  }).from(conversation)
    .leftJoin(jobApplication, eq(conversation.applicationId, jobApplication.id))
    .leftJoin(job, eq(jobApplication.jobId, job.id))
    .where(eq(conversation.id, id)).limit(1)
  return row ?? null
}
type LoadedConversation = NonNullable<Awaited<ReturnType<typeof loadConversation>>>

function canAccess(viewer: MessageViewer, thread: LoadedConversation) {
  if (thread.kind === "support") return viewer.role === "admin" || thread.userId === viewer.userId
  if (thread.kind === "application") {
    if (viewer.role === "candidate") return thread.userId === viewer.userId
    if (viewer.role === "employer") return Boolean(viewer.companyId && thread.companyId === viewer.companyId)
    return viewer.role === "admin" // moderation: admins can read every thread
  }
  return false
}

/** Everyone who should hear about a new message, minus the sender. */
async function recipientsFor(thread: LoadedConversation, senderId: string, senderRole: Role) {
  let ids: string[] = []
  if (thread.kind === "support") ids = senderRole === "admin" ? [thread.userId] : await adminUserIds()
  else if (senderRole === "candidate") ids = thread.companyId ? await companyEmployerUserIds(thread.companyId) : []
  else ids = [thread.userId]
  return ids.filter(id => id !== senderId)
}

export async function listConversations(viewer: MessageViewer) {
  const filters = viewer.role === "admin"
    ? undefined // god mode: every support and application thread
    : viewer.role === "employer"
      ? or(and(eq(conversation.kind, "support"), eq(conversation.userId, viewer.userId)), viewer.companyId ? and(eq(conversation.kind, "application"), eq(job.companyId, viewer.companyId)) : sql`false`)
      : eq(conversation.userId, viewer.userId)

  const rows = await db.select({
    id: conversation.id, kind: conversation.kind, subject: conversation.subject, lastMessageAt: conversation.lastMessageAt,
    userName: user.name, userEmail: user.email, userRole: user.role, companyName: company.name, applicationId: conversation.applicationId,
    lastReadAt: conversationRead.lastReadAt,
    preview: sql<string | null>`(select ${message.body} from ${message} where ${message.conversationId} = ${conversation.id} order by ${message.createdAt} desc limit 1)`,
  }).from(conversation)
    .innerJoin(user, eq(conversation.userId, user.id))
    .leftJoin(jobApplication, eq(conversation.applicationId, jobApplication.id))
    .leftJoin(job, eq(jobApplication.jobId, job.id))
    .leftJoin(company, eq(job.companyId, company.id))
    .leftJoin(conversationRead, and(eq(conversationRead.conversationId, conversation.id), eq(conversationRead.userId, viewer.userId)))
    .where(filters)
    .orderBy(desc(conversation.lastMessageAt))
    .limit(200)

  return rows.map(row => ({
    id: row.id,
    kind: row.kind as "application" | "support",
    subject: row.subject,
    // Who the viewer is talking to
    counterpart: row.kind === "support"
      ? (viewer.role === "admin" ? `${row.userName} (${row.userRole})` : "ADDOZ team")
      : (viewer.role === "candidate" ? row.companyName ?? "Employer" : viewer.role === "admin" ? `${row.userName} ↔ ${row.companyName ?? "Employer"}` : row.userName),
    preview: row.preview,
    lastMessageAt: row.lastMessageAt.toISOString(),
    unread: Boolean(row.preview) && (!row.lastReadAt || row.lastReadAt < row.lastMessageAt),
  }))
}

export async function getThread(viewer: MessageViewer, id: string) {
  const thread = await loadConversation(id)
  if (!thread || !canAccess(viewer, thread)) throw new MessagesAccessError()
  const messages = await db.select({ id: message.id, body: message.body, createdAt: message.createdAt, senderId: message.senderUserId, senderName: user.name, senderRole: user.role })
    .from(message).innerJoin(user, eq(message.senderUserId, user.id))
    .where(eq(message.conversationId, id)).orderBy(asc(message.createdAt)).limit(500)
  await markRead(id, viewer.userId)
  return {
    id: thread.id,
    kind: thread.kind,
    subject: thread.subject,
    messages: messages.map(item => ({
      id: item.id,
      body: item.body,
      createdAt: item.createdAt.toISOString(),
      mine: item.senderId === viewer.userId,
      // Admins speak as "ADDOZ team" to users
      sender: item.senderRole === "admin" && viewer.role !== "admin" ? "ADDOZ team" : item.senderName,
    })),
  }
}

async function markRead(conversationId: string, userId: string) {
  await db.insert(conversationRead).values({ conversationId, userId, lastReadAt: new Date() })
    .onConflictDoUpdate({ target: [conversationRead.conversationId, conversationRead.userId], set: { lastReadAt: new Date() } })
}

export async function sendMessage(viewer: MessageViewer, id: string, body: string, options: { emailRecipients?: boolean } = {}) {
  const thread = await loadConversation(id)
  if (!thread || !canAccess(viewer, thread)) throw new MessagesAccessError()
  // Admins may read application threads for moderation but don't post into them
  if (thread.kind === "application" && viewer.role === "admin") throw new MessagesAccessError()
  const now = new Date()
  const [created] = await db.insert(message).values({ conversationId: id, senderUserId: viewer.userId, body, createdAt: now }).returning({ id: message.id })
  await db.update(conversation).set({ lastMessageAt: now }).where(eq(conversation.id, id))
  await markRead(id, viewer.userId)

  const recipients = await recipientsFor(thread, viewer.userId, viewer.role)
  const senderLabel = viewer.role === "admin" ? "The ADDOZ team" : viewer.name
  const area = (role: "candidate" | "employer" | "admin") => role === "admin" ? "/admin" : `/${role}`
  // Each recipient opens the thread in their own workspace
  const byArea = new Map<string, string[]>()
  if (recipients.length) {
    const roles = await db.select({ id: user.id, role: user.role }).from(user).where(inArray(user.id, recipients))
    for (const row of roles) {
      const key = `${area(row.role)}/messages?c=${id}`
      byArea.set(key, [...(byArea.get(key) ?? []), row.id])
    }
  }
  const snippet = body.length > 160 ? `${body.slice(0, 157)}…` : body
  await Promise.all([...byArea].map(([href, userIds]) => notify({
    userIds,
    kind: "message",
    title: `New message: ${thread.subject}`,
    body: `${senderLabel}: ${snippet}`,
    href,
    // Skipped when the sender is also emailing the same text directly
    email: options.emailRecipients === false ? undefined : { subject: `${senderLabel} sent you a message on ADDOZ`, actionLabel: "Read and reply", footer: href.startsWith("/candidate") ? GUEST_ACCOUNT_FOOTER : undefined },
  })))
  return { id: created!.id }
}

/** Find or open the thread for one application (employer of the hiring company, or the applicant). */
export async function openApplicationConversation(viewer: MessageViewer, applicationId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(applicationId)) throw new MessagesAccessError()
  const [application] = await db.select({ id: jobApplication.id, companyId: job.companyId, jobTitle: job.title, candidateUserId: candidateProfile.userId })
    .from(jobApplication).innerJoin(job, eq(jobApplication.jobId, job.id)).innerJoin(candidateProfile, eq(jobApplication.candidateId, candidateProfile.id))
    .where(eq(jobApplication.id, applicationId)).limit(1)
  if (!application) throw new MessagesAccessError()
  const allowed = (viewer.role === "employer" && viewer.companyId === application.companyId) || (viewer.role === "candidate" && viewer.userId === application.candidateUserId)
  if (!allowed) throw new MessagesAccessError()
  const [created] = await db.insert(conversation).values({ kind: "application", applicationId, userId: application.candidateUserId, subject: application.jobTitle })
    .onConflictDoNothing({ target: conversation.applicationId }).returning({ id: conversation.id })
  if (created) return created.id
  const [existing] = await db.select({ id: conversation.id }).from(conversation).where(eq(conversation.applicationId, applicationId)).limit(1)
  return existing!.id
}

/** Open a support thread: an admin with a chosen user, or a user with the ADDOZ team. */
export async function openSupportConversation(viewer: MessageViewer, input: { userId?: string; subject?: string }) {
  let targetUserId = viewer.userId
  if (viewer.role === "admin") {
    if (!input.userId) throw new MessagesAccessError()
    const [target] = await db.select({ id: user.id, role: user.role }).from(user).where(eq(user.id, input.userId)).limit(1)
    if (!target || target.role === "admin") throw new MessagesAccessError()
    targetUserId = target.id
  }
  const subject = input.subject?.trim().slice(0, 120) || (viewer.role === "admin" ? "Message from the ADDOZ team" : "Support request")
  const [created] = await db.insert(conversation).values({ kind: "support", userId: targetUserId, subject }).returning({ id: conversation.id })
  return created!.id
}
