/**
 * Start fresh for launch: removes every account except the one admin named by
 * ADMIN_EMAIL, plus all companies, jobs, applications, CVs, saved jobs, alerts,
 * notifications, messages, audit history, newsletter/contact entries and stored
 * files. Categories, locations and skills are kept (except QA locations named
 * "TEST", "TEST2", …). The kept admin is marked
 * email-verified (required to sign in) and stays signed in.
 *
 *   pnpm launch:reset            → dry run: shows what would be deleted
 *   pnpm launch:reset --confirm  → deletes, in one transaction (all or nothing)
 */
import { config } from "dotenv"
import { neon } from "@neondatabase/serverless"

config({ path: ".env.local" })

const TABLES = [
  "conversation_read", "message", "conversation", "notification", "audit_log",
  "saved_applicant", "saved_job", "job_alert", "job_application", "resume", "stored_file", "job",
  "employer_profile", "company", "candidate_profile",
  "newsletter_subscriber", "contact_message", "verification",
] as const

async function main() {
  const sql = neon(process.env.DATABASE_URL!)
  const keepEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!keepEmail) throw new Error("Set ADMIN_EMAIL in .env.local to the admin account you want to keep.")
  const [keep] = await sql`select id, role from "user" where lower(email) = ${keepEmail}` as { id: string; role: string }[]
  if (!keep || keep.role !== "admin") throw new Error(`No admin account found for ${keepEmail}. Nothing was changed.`)

  const existing = new Set((await sql`select table_name from information_schema.tables where table_schema = 'public'` as { table_name: string }[]).map(row => row.table_name))
  const tables = TABLES.filter(name => existing.has(name))
  const count = async (query: string) => ((await sql.query(query)) as { c: number }[])[0]!.c

  console.log(`Keeping admin: ${keepEmail}\n\nWould delete:`)
  for (const name of tables) console.log(`  ${name.padEnd(22)} ${await count(`select count(*)::int c from "${name}"`)}`)
  console.log(`  ${"user (others)".padEnd(22)} ${await count(`select count(*)::int c from "user" where id <> '${keep.id}'`)}`)
  console.log(`  ${"location (test)".padEnd(22)} ${await count(`select count(*)::int c from location where name ~* '^test[0-9]*$'`)}`)

  if (!process.argv.includes("--confirm")) {
    console.log("\nDry run only. Re-run with --confirm to delete.")
    return
  }

  await sql.transaction([
    ...tables.map(name => sql.query(`delete from "${name}"`)),
    sql`delete from session where "userId" <> ${keep.id}`,
    sql`delete from account where "userId" <> ${keep.id}`,
    sql`delete from "user" where id <> ${keep.id}`,
    sql`update "user" set "emailVerified" = true, "updatedAt" = now() where id = ${keep.id}`,
    sql`delete from location where name ~* '^test[0-9]*$'`,
  ])
  console.log("\nDone. The platform is empty and ready for launch.")
}

main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exit(1) })
