import { and, eq, gt, isNull, or, sql } from "drizzle-orm"
import { job } from "@/lib/db/schema"

/** A job the public can see and apply to: Active and not past its deadline. */
export function liveJob() {
  return and(eq(job.status, "Active"), or(isNull(job.deadline), gt(job.deadline, sql`now()`)))!
}
