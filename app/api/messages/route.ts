import { z } from "zod"
import { MessagesAccessError, MessagesAuthError, listConversations, openApplicationConversation, openSupportConversation, requireMessageViewer } from "@/features/messages/server"

function failure(error: unknown) {
  if (error instanceof MessagesAuthError) return Response.json({ error: "Authentication required." }, { status: 401 })
  if (error instanceof MessagesAccessError) return Response.json({ error: "Conversation not found." }, { status: 404 })
  console.error("[messages] request failed", error)
  return Response.json({ error: "Messages are unavailable right now. Please try again." }, { status: 500 })
}

/** The viewer's conversations, newest activity first. */
export async function GET(request: Request) {
  try {
    const viewer = await requireMessageViewer(request.headers)
    return Response.json({ conversations: await listConversations(viewer) })
  } catch (error) { return failure(error) }
}

// An application thread when `applicationId` is present (it must be valid), otherwise a support thread
const applicationSchema = z.object({ applicationId: z.string().uuid() })
const supportSchema = z.object({ userId: z.string().min(1).optional(), subject: z.string().trim().max(120).optional() }).strict()

/** Open (or find) a conversation: { applicationId } for hiring threads, { userId?, subject? } for support. */
export async function POST(request: Request) {
  try {
    const viewer = await requireMessageViewer(request.headers)
    const body = await request.json().catch(() => null) as Record<string, unknown> | null
    const wantsApplication = Boolean(body && "applicationId" in body)
    const parsed = wantsApplication ? applicationSchema.safeParse(body) : supportSchema.safeParse(body ?? {})
    if (!parsed.success) return Response.json({ error: "Choose who to message." }, { status: 400 })
    const id = wantsApplication
      ? await openApplicationConversation(viewer, (parsed.data as z.infer<typeof applicationSchema>).applicationId)
      : await openSupportConversation(viewer, parsed.data as z.infer<typeof supportSchema>)
    return Response.json({ id }, { status: 201 })
  } catch (error) { return failure(error) }
}
