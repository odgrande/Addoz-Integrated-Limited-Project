import { config } from "dotenv"
import { eq } from "drizzle-orm"

config({ path: ".env.local" })

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const name = process.env.ADMIN_NAME?.trim() || "ADDOZ Administrator"
  const password = process.env.ADMIN_PASSWORD
  if (!email) throw new Error("ADMIN_EMAIL is required")

  const { db } = await import("../lib/db")
  const { auth } = await import("../lib/auth")
  const { candidateProfile, employerProfile, user } = await import("../lib/db/schema")
  const [existing] = await db.select().from(user).where(eq(user.email, email)).limit(1)
  let userId = existing?.id
  if (!userId) {
    if (!password) throw new Error("ADMIN_PASSWORD is required when creating a new admin")
    const result = await auth.api.signUpEmail({ body: { email, password, name }, returnHeaders: true })
    userId = result.response.user.id
  }
  await db.delete(candidateProfile).where(eq(candidateProfile.userId, userId))
  await db.delete(employerProfile).where(eq(employerProfile.userId, userId))
  // Admins are provisioned by the operator, so the address is trusted as verified
  await db.update(user).set({ role: "admin", emailVerified: true, updatedAt: new Date() }).where(eq(user.id, userId))
  console.log(`Admin provisioned for ${email}`)
}

main().catch(error => { console.error(error); process.exit(1) })
