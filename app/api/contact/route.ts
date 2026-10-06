import { z } from "zod"
import { db } from "@/lib/db"
import { contactMessage } from "@/lib/db/schema"
import { sendEmail } from "@/lib/email"
import { site } from "@/lib/site"

const schema = z.object({
  name: z.string().trim().min(1, "Enter your full name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  phone: z.string().trim().max(32).optional().default(""),
  topic: z.string().trim().min(1, "Choose what this is about.").max(80),
  message: z.string().trim().min(10, "Say a little more — a sentence is enough.").max(5000, "Keep your message under 5,000 characters."),
})

/** Contact form: stored for the ADDOZ team and forwarded to the team inbox. */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Check your message." }, { status: 400 })
  const input = parsed.data
  try {
    await db.insert(contactMessage).values({ name: input.name, email: input.email, phone: input.phone || null, topic: input.topic, message: input.message })
  } catch (error) {
    console.error("[contact] message could not be stored", error)
    return Response.json({ error: "We couldn't send your message. Please try again, or email us directly." }, { status: 500 })
  }

  // Forwarding is best-effort; the message is already stored.
  const text = `${input.message}\n\n— ${input.name} · ${input.email}${input.phone ? ` · ${input.phone}` : ""}`
  await sendEmail({
    to: process.env.CONTACT_EMAIL?.trim() || site.email,
    subject: `ADDOZ contact — ${input.topic}`,
    text,
    html: `<pre style="font-family:Arial,Helvetica,sans-serif;white-space:pre-wrap">${text.replace(/[&<>]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char]!)}</pre>`,
  }).catch(error => console.error("[contact] forward failed", error))

  return Response.json({ ok: true }, { status: 201 })
}
