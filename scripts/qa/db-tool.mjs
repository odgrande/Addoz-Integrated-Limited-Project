/** QA only, run while the server is stopped: `promote <email>` or `expire <jobId>` in the local PGlite database. */
import { PGlite } from "@electric-sql/pglite"

const [command, value] = process.argv.slice(2)
const db = new PGlite(process.env.PGLITE_DIR)
if (command === "promote") {
  const { rows } = await db.query(`update "user" set role = 'admin' where email = $1 returning id`, [value])
  if (rows[0]) await db.query("delete from candidate_profile where user_id = $1", [rows[0].id])
  console.log("promoted", rows.length)
} else if (command === "expire") {
  const { rows } = await db.query("update job set deadline = now() - interval '1 hour' where id = $1 returning id", [value])
  console.log("expired", rows.length)
}
await db.close()
