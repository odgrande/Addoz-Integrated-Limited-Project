/**
 * QA only: an in-process Postgres (PGlite) standing in for Neon, so signed-in
 * flows can be tested end to end without touching the live database.
 * Wired in by next.config.mjs only when PGLITE_DIR is set.
 */
import { PGlite } from "@electric-sql/pglite"
import { drizzle } from "drizzle-orm/pglite"
import * as schema from "../../lib/db/schema"

const globalForDb = globalThis as unknown as { addozQaDb?: PGlite }
const client = globalForDb.addozQaDb ??= new PGlite(process.env.PGLITE_DIR!)
export const db = drizzle(client, { schema })
