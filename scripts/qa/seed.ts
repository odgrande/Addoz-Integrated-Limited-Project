/** QA only: reference data (categories, locations) for the local PGlite database. */
import { PGlite } from "@electric-sql/pglite"
import { drizzle } from "drizzle-orm/pglite"
import * as schema from "../../lib/db/schema"
import { categories } from "../../features/categories/data"
import { areas } from "../../features/locations/data"

async function main() {
  const client = new PGlite(process.env.PGLITE_DIR!)
  const db = drizzle(client, { schema })
  await db.insert(schema.category).values(categories.map(item => ({ id: `cat_${item.slug}`, slug: item.slug, name: item.name, active: true }))).onConflictDoNothing()
  await db.insert(schema.location).values(areas.map(item => ({ id: `loc_${item.slug}`, slug: item.slug, name: item.name, active: true }))).onConflictDoNothing()
  console.log("seeded", categories.length, "categories,", areas.length, "locations")
  await client.close()
}
main()
