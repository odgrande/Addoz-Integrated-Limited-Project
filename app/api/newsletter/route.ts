import { z } from "zod"
import { db } from "@/lib/db"
import { newsletterSubscriber } from "@/lib/db/schema"

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  source: z.enum(["footer", "blog"]).optional(),
})

/** Subscribe to job updates. Idempotent: subscribing twice (or re-subscribing) succeeds quietly. */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "Enter a valid email address." }, { status: 400 })
  try {
    await db.insert(newsletterSubscriber).values({ email: parsed.data.email, source: parsed.data.source ?? null })
      .onConflictDoUpdate({ target: newsletterSubscriber.email, set: { unsubscribedAt: null } })
    return Response.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error("[newsletter] subscribe failed", error)
    return Response.json({ error: "We couldn't save your subscription. Please try again." }, { status: 500 })
  }
}
