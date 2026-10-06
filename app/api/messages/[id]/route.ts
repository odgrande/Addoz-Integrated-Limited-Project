import { z } from "zod"
import { MessagesAccessError, MessagesAuthError, getThread, requireMessageViewer, sendMessage } from "@/features/messages/server"

function failure(error: unknown) {
  if (error instanceof MessagesAuthError) return Response.json({ error: "Authentication required." }, { status: 401 })
  if (error instanceof MessagesAccessError) return Response.json({ error: "Conversation not found." }, { status: 404 })
  console.error("[messages] thread request failed", error)
  return Response.json({ error: "Messages are unavailable right now. Please try again." }, { status: 500 })
}

/** One thread with its messages; opening it marks it read. */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await requireMessageViewer(request.headers)
    return Response.json(await getThread(viewer, (await context.params).id))
  } catch (error) { return failure(error) }
}

const replySchema = z.object({ body: z.string().trim().min(1, "Write a message first.").max(5000, "Keep messages under 5,000 characters.") })

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await requireMessageViewer(request.headers)
    const parsed = replySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Write a message first." }, { status: 400 })
    return Response.json(await sendMessage(viewer, (await context.params).id, parsed.data.body), { status: 201 })
  } catch (error) { return failure(error) }
}
