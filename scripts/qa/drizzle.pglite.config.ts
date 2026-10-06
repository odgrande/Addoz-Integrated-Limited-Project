import { defineConfig } from "drizzle-kit"

// QA only: create the schema inside the local PGlite database (see scripts/qa/pglite-db.ts)
export default defineConfig({
  out: "./.qa/drizzle",
  schema: "./lib/db/schema.ts",
  dialect: "postgresql",
  driver: "pglite",
  dbCredentials: { url: process.env.PGLITE_DIR! },
})
