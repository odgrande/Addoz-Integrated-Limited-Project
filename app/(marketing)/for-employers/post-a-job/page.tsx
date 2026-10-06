import { headers } from "next/headers"
import { redirect, unstable_rethrow } from "next/navigation"
import { auth } from "@/lib/auth"

/**
 * "Post a job" entry point. There is no guest job posting: employers post from
 * their dashboard. Signed-in employers go straight to the job form; everyone
 * else registers (or signs in) as an employer first and lands on the form.
 */
export default async function PostAJobPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(error => { unstable_rethrow(error); return null })
  const role = session?.user?.role
  if (role === "employer") redirect("/employer/jobs/new")
  if (role === "candidate" || role === "admin") redirect(`/auth/login?role=employer&redirect=${encodeURIComponent("/employer/jobs/new")}`)
  redirect(`/auth/register?role=employer&redirect=${encodeURIComponent("/employer/jobs/new")}`)
}
